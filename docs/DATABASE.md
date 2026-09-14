# Data Model Review

## この文書の位置づけ

この文書は、DATA-001で確認したPhase 1のmock data、DATA-002のAPI boundary、CLOUD-DATA-001のCloud MVP向けDynamoDB physical designを分けて記録します。CLOUD-DATA-001では物理モデルの推奨案を一つに絞りますが、AWS resource、DB/API実装、migration、実data投入は行いません。

現在のruntimeの正は `src/lib/mock-data.ts` と実際の画面です。以下のPhase 2案とphysical designはreview対象であり、実装済みのschemaではありません。

## 変えてはいけないプロダクト境界

- StreamBandはDAWを置き換えず、DAW外でPreview、Stem、MIDI、feedback、proposal、version、担当を整理する
- DAW内の音色、mix、plugin chain、automation、完全なproject stateはStreamBandの保存対象にしない
- MIDI Proposalは元MIDIを直接上書きせず、sourceとproposalを別entity・別assetとして追跡する
- Song VersionとMIDI Proposal、MemoとDecision、Song statusとReview statusを混同しない
- 未公開楽曲と関連assetはprivateを既定とし、band membershipと操作権限をserver側で確認する

## Phase 1: 現在のmock data model

### 実装済みentity

| Type / data | 主なfield | 現在の関係 | 現在の制約 |
| --- | --- | --- | --- |
| `Member` | `id`, `name`, `part`, `initials`, `color` | `Band.memberIds`、Task/Comment/Fileのactor IDから参照 | user identity、band membership、access roleが1つに混在。認証なし |
| `Band` | `id`, `name`, `description`, `genre`, `accent`, `memberIds`, `updatedAt` | MemberとSongをまとめる | `id`はURL slug兼用。日時は表示文字列 |
| `Song` | `id`, `bandId`, `title`, `status`, `bpm`, `musicalKey`, `progress`, `version`, `duration`, `summary`, `nextMilestone`, `notes`, `updatedAt` | Band配下。Task/Comment/Fileから参照 | VersionとMemoが埋め込み。拍子、DAW、作成者、正規日時なし |
| `SongTask` | `id`, `songId`, `title`, `part`, `assigneeId`, `status`, `dueDate` | SongとMemberへ参照 | partと期限は表示文字列。画面上のtoggleはReact stateのみ |
| `SongComment` | `id`, `songId`, `authorId`, `body`, `createdAt`, `timestamp?` | SongとMemberへ参照 | Version、track、bar/beatとの関係なし。時刻は`MM:SS`文字列 |
| `SharedFile` | `id`, `songId`, `name`, `kind`, `size`, `version`, `uploadedBy`, `updatedAt` | SongとMemberへ参照 | file本体、storage key、checksum、version IDなし。すべて表示用 |

現在の列挙値は次のとおりです。

- `SongStatus`: `アイデア | 制作中 | 確認待ち | 完成`
- `TaskStatus`: `未着手 | 進行中 | 完了`
- `SharedFile.kind`: `Audio | MIDI | Reference`
- part: enumではなく、`Guitar`、`Vocal`、`Bass`、`Drums`、`Keyboard`、`All`などの自由な表示文字列
- access role、review status、proposal status、comment type: 未定義

### Song内に埋め込まれている情報

- `version`は`v0.8`のような表示labelだけで、独立したVersion IDや履歴ではない
- `notes.direction / arrangement / recording`はSongへ直接埋め込まれ、編集履歴や更新者を持たない
- `progress`、`duration`、`nextMilestone`は画面表示用の値で、算出元や正規形式は未定義
- `updatedAt`、`createdAt`、`dueDate`は「今日 18:42」「8/12」などの表示文字列で、永続化用timestampではない

### SURFACE-017のform-only data

`SongFormDraft`はReactの画面内stateで、`mock-data.ts`のschemaや永続dataではありません。

| field | 用途 | reload後 |
| --- | --- | --- |
| `title`, `status`, `bpm`, `musicalKey` | Song基本情報の入力確認 | 初期値へ戻る |
| `timeSignature`, `daw` | 将来metadataの表示確認 | 初期値へ戻る。現在のSongにはない |
| `versionName`, `versionNote` | 初期/現行versionのreview表示 | 初期値へ戻る。Version entityはない |
| `description` | Song summary / memo候補 | 初期値へ戻る |
| `parts` | 担当partの複数選択UI | 初期値へ戻る。新規taskやtrackは作らない |

保存buttonはdisabledで、DB、API、Server Actions、localStorage、cookie、file uploadを使用しません。

### component内だけにあるvisual mock

| surface | 現在のdata | 永続entityの有無 |
| --- | --- | --- |
| Waveform preview | 固定bar配列、固定position、`4/4`、sample rate・meterの表示 | なし。音声解析・再生もなし |
| MIDI Proposal | 固定Original名、Proposal A、piano roll矩形 | なし。MIDI解析・生成・編集もなし |
| Version note | 楽曲詳細内の固定表示 | なし |
| Call / Presence | globalなMember一覧と固定online dot | なし。session、heartbeat、通話もなし |
| Comment composer | bodyと任意timestampのReact state | 一時表示のみ。reloadで消える |

## Phase 1からPhase 2へ進む前のgap

- `Member.part`は音楽上の担当であり、authorization roleとして利用できない
- URL用slugと内部のstable IDが分離されていない
- Songの表示label `version`からVersion履歴やassetの所属を保証できない
- CommentがどのVersion、track、time、bar、beatを対象にするか機械的に判定できない
- SharedFileの`version`が文字列参照で、存在するVersionとの整合を保証できない
- Memo、Decision、Review、Proposal、Track、Presenceが独立dataではない
- 表示用日時・容量・durationと保存用の正規値が分離されていない
- 作成者、更新者、soft delete、復元、auditの情報が不足している

## Phase 2: cloud data model草案

### 設計原則候補

- 内部参照は推測しにくいstable ID、URL表示は変更可能なslugとして分離する
- すべてのprivate read/writeでUserだけでなくBand Membershipと対象resourceのbandをserver側で検証する
- binary fileはDBへ入れず、private object storageのobjectをAsset metadataから参照する
- presigned URLは短時間だけ発行し、DBへ永続保存しない
- VersionはSongの制作時点、ProposalはVersionに対する非破壊の別案として分離する
- comment anchorはVersionを基準にし、timeとbar/beatの単位を正規化する
- deleteはresourceごとにarchive、soft delete、hard delete、保持期間、復元可否を定義する
- user操作と高risk変更はactor、対象、時刻、結果をauditできるようにする

### entity一覧

名称は論理名であり、実table名の確定ではありません。

| Entity候補 | 責務 | 主なfield候補 |
| --- | --- | --- |
| User | profileと認証providerへの安全な参照 | `id`, `authSubject`, `displayName`, `createdAt`, `updatedAt`, `deletedAt?` |
| Band | private workspace | `id`, `slug`, `name`, `description`, `genre?`, `createdBy`, `createdAt`, `updatedAt`, `archivedAt?` |
| BandMembership | UserとBandの所属・access role | `id`, `bandId`, `userId`, `role`, `status`, `joinedAt`, `createdAt`, `updatedAt` |
| Song | 楽曲のstableな基本情報 | `id`, `bandId`, `slug`, `title`, `description?`, `status`, `bpm?`, `timeSignature?`, `musicalKey?`, `dawName?`, `createdBy`, `createdAt`, `updatedAt`, `archivedAt?` |
| SongVersion | 楽曲の特定時点とreview単位 | `id`, `songId`, `sequence`, `label`, `note?`, `basedOnVersionId?`, `createdBy`, `createdAt`, `publishedAt?` |
| SongMemo | 継続参照する整理済み情報 | `id`, `songId`, `category`, `content`, `updatedBy`, `createdAt`, `updatedAt` |
| Decision | 制作上の確定事項 | `id`, `songId`, `songVersionId?`, `title`, `summary`, `status`, `sourceCommentId?`, `decidedBy`, `decidedAt`, `supersededById?` |
| SongPart | 楽曲内の音楽上の担当分類 | `id`, `songId`, `partCode`, `label`, `sortOrder` |
| SongTrack | DAW外で参照する論理track | `id`, `songId`, `songPartId?`, `label`, `trackType`, `sortOrder`, `archivedAt?` |
| Asset | Audio Preview、Stem、MIDI、Referenceのfile metadata | `id`, `bandId`, `songId`, `songVersionId?`, `songTrackId?`, `kind`, internal `storageObjectKey`, `originalName`, `declaredMimeType`, `verifiedMimeType?`, `sizeBytes`, `checksumAlgorithm`, `checksum`, `state`, `uploadExpiresAt`, `createdBy`, `createdAt`, `updatedAt`, `deletedAt?` |
| MidiProposal | 元MIDIと別管理するproposal | `id`, `songId`, `songVersionId`, `sourceMidiAssetId`, `proposalAssetId?`, `targetRange?`, `summary`, `status`, `createdBy`, `createdAt`, `reviewedBy?`, `reviewedAt?` |
| Comment | 会話・feedback本文 | `id`, `songId`, `songVersionId?`, `authorId`, `parentCommentId?`, `commentType`, `body`, `createdAt`, `updatedAt`, `deletedAt?` |
| CommentAnchor | Commentの位置参照 | `id`, `commentId`, `anchorType`, `songVersionId`, `songTrackId?`, `timeMs?`, `bar?`, `beat?`, `tick?` |
| ReviewRequest | Versionの確認依頼 | `id`, `songVersionId`, `requestedBy`, `status`, `dueAt?`, `createdAt`, `closedAt?` |
| ReviewResponse | reviewerごとの回答 | `id`, `reviewRequestId`, `reviewerId`, `status`, `commentId?`, `createdAt`, `updatedAt` |
| Task | 制作TODO | `id`, `songId`, `songVersionId?`, `songPartId?`, `assigneeMembershipId?`, `title`, `description?`, `status`, `priority?`, `dueAt?`, `createdBy`, `createdAt`, `updatedAt`, `completedAt?` |
| CreativeItem（CREATIVE-DATA-001 design） | UI上のMemo / Idea / Taskを同じCreative Boardで扱うsingle physical entity。DEC-025でdocs-only designを承認済み | `id`, `bandId`, `songId`, `kind`, `body/title`, `originAnchor?`, `currentTargetAnchor?`, `sourceCommentId?`, Task時だけの`status/assignee/priority/dueDate/completion?`, actor / timestamps / revision |
| ActivityStatus（論理metadata） | Role / Membership stateと独立したBand内参加状況 | `membershipId`, `statusCode`, `updatedBy`, `updatedAt`候補。Physical placementは未決定 |
| NotificationPreference（論理contract） | User自身のpreset / event / channel / frequency選択 | `userId`, `preset`, category / channel overrides候補、timestamps。Authorizationとは無関係 |
| QuietHours（論理contract） | ordinary deliveryをhold / digestする時間帯 | `userId`, `startLocalTime`, `endLocalTime`, `timeZone`, `enabled`, timestamps候補 |
| Notification（論理contract） | sourceへのprivate reference / summaryとpresentation state | `id`, `userId`, `category`, `sourceType`, `sourceId`, `readState`, `occurredAt`, `expiresAt`候補。Source entityではない |
| PresenceSession | online表示の一時session候補 | `id`, `bandId`, `songId?`, `userId`, `connectedAt`, `lastSeenAt`, `expiresAt` |
| CallSession | 将来通話を採用した場合の最小session metadata | `id`, `bandId`, `songId?`, `providerRef?`, `startedBy`, `startedAt`, `endedAt?` |
| DawBridgeSource | 将来Bridgeを採用した場合の参照metadata | `id`, `songId`, `songVersionId?`, `dawName`, `projectFingerprint?`, `bridgeVersion`, `capturedAt`, `capabilities` |
| AuditEvent | 重要操作の追跡 | `id`, `bandId`, `actorUserId?`, `action`, `resourceType`, `resourceId`, `result`, `occurredAt`, `requestId?` |

Presence heartbeatは短命なdata storeで扱い、長期DB保存を既定にしません。CallとDawBridgeは将来機能を採用した場合だけ具体化し、現在のvisual mockから実装済みとは判断しません。

### 主な関係

```text
User --< BandMembership >-- Band --< Song --< SongVersion
                                  |       |        |--< Asset
                                  |       |        |--< ReviewRequest --< ReviewResponse
                                  |       |        `--< MidiProposal >-- source/proposal Asset
                                  |       |--< SongMemo
                                  |       |--< Decision
                                  |       |--< SongPart --< SongTrack --< Asset
                                  |       |--< Comment --0..1 CommentAnchor
                                  |       |--< CreativeItem --< CommentLink / StructuralEvent
                                  |       `--< Task
                                  `--< AuditEvent
```

- Bandはdata isolationとauthorizationの基本単位にする候補
- SongVersionはSongに従属し、別SongのAssetやCommentを参照できないconstraintが必要
- MidiProposalの`sourceMidiAssetId`と`proposalAssetId`は別IDとし、source objectを上書きしない
- CommentAnchorでtime/bar/beat/trackを使う場合は、対象SongVersionを必須にする候補
- Taskの担当はUser IDではなく、対象Band内のMembership IDを参照する候補
- CREATIVE-DATA-001ではMemo / Idea / TaskをCreativeItemへ統合する提案で、既存`SongMemo / Task`候補を別physical itemとして同時実装しない

## enum草案

日本語labelはUI側で変換し、永続値は安定したcodeにする候補です。値と権限は未承認で、実装前に見直します。

| enum | 候補値 | 注意 |
| --- | --- | --- |
| Song status | `idea`, `in_progress`, `in_review`, `completed`, `archived` | 現在の4状態とのmappingを定義。Review statusとは別 |
| Membership role | `owner`, `admin`, `editor`, `commenter`, `guest` | AUTHZ-001のcapability bundle。musical part、Cognito group、AWS roleと分離 |
| Membership status | `active`, `removed` | controlled friend testの最小値。invite / suspendは後続flowで追加判断 |
| Part code | `vocal`, `guitar`, `bass`, `drums`, `keyboard`, `other`, `all` | 初期UI候補。複数partと自由labelを許容するか未決定 |
| Track type | `audio`, `midi`, `reference`, `guide`, `other` | DAW trackの完全再現には使わない |
| Asset kind | `AUDIO_PREVIEW`, `SOURCE_MIDI`, `PROPOSAL_MIDI` | STORAGE-001-DESIGNの初期allowlist。Stem / Referenceは後続候補 |
| Asset state | `PENDING_UPLOAD`, `VERIFYING`, `AVAILABLE`, `FAILED`, `DELETION_REQUESTED`, `DELETED` | STORAGE-001-DESIGNのstate machine。direct upload中をserver stateとして推測しない |
| Proposal status | `draft`, `submitted`, `accepted`, `rejected`, `withdrawn` | acceptedでも元MIDIは上書きしない |
| Comment type | `discussion`, `review_feedback`, `decision_reference` | 位置はComment Anchorで別管理する |
| Anchor type | `version`, `time`, `musical_position`, `track` | `timeMs`とbar/beat/tickの整合ruleが必要 |
| Review request status | `open`, `changes_requested`, `approved`, `closed` | reviewer個別回答と全体statusの集約ruleが必要 |
| Creative item kind | `MEMO`, `IDEA`, `TASK` | user-facing modelは3種類。順序を強制せず相互変換可能 |
| Task status | `OPEN`, `IN_PROGRESS`, `DONE`, `CANCELED` | UIは未対応 / 対応中 / 完了 / 不要にする。DONEからreopen可能 |
| Task priority | `NORMAL`, `IMPORTANT` | 2段階だけ。NORMALはprimary UIで強調しない |
| Activity status | `REGULAR`, `PAUSED`, `LOW_FREQUENCY`, `SUPPORT`候補 | 表示は通常参加 / 活動休止中 / 参加頻度低め / サポート参加。Role / accessへ影響させない |
| Notification preset | `FOCUS`, `STANDARD`, `ALL`候補 | Preference bundle。Role / Activity Statusと独立 |
| Notification frequency | `REALTIME`, `HOURLY_DIGEST`, `DAILY_DIGEST`, `OFF`候補 | Security categoryは通常preset / OFF対象外 |
| Notification read state | `UNREAD`, `READ` | Source action / business stateを変更しない |
| Decision status | `proposed`, `decided`, `superseded` | CommentやMemo本文だけで確定扱いにしない |

## Version naming草案

- display label例: `v0.1`, `v0.8`, `v1.0`, `First demo`, `2026-09-09 rehearsal mix`
- identityとsortには`SongVersion.id`と`sequence`を使い、labelの文字列比較へ依存しない
- 同じSong内でlabelをuniqueにするか、表示名の重複を許可するかは未決定
- `basedOnVersionId`で派生元を示せる候補とするが、DAW projectの差分再現を約束しない
- AssetとCommentは可能な限りVersion IDへ結び、`v0.8`のような文字列だけで関連付けない

## Comment anchor草案

- `timeMs`は整数millisecondで保存し、UIで`MM:SS`等へformatする
- `bar`と`beat`は1始まり、`tick`は拍内位置の候補。採用するPPQと拍子変更の扱いは未決定
- timeとbar/beatを同時に持つ場合の正を決め、矛盾した値をserver側で拒否する
- track anchorはSongTrack IDを使い、画面上の表示名を参照keyにしない
- position付きCommentは必ず対象Versionを持ち、別versionへ暗黙に引き継がない
- AnchorなしのSong全体Commentも許容する

## CREATIVE-001 conceptual model（CREATIVE-DATA-001の前提）

CREATIVE-001-DESIGNでは「創作を管理せず、創作を支える」をproduct contractとし、Memo / Idea / Taskを同じCreative Boardで扱います。この章はdomain relationshipの前提で、具体的なsingle-table key、`ScopeIndex`、transaction、tombstone / history designは後段のCREATIVE-DATA-001を正とします。DEC-025はdocs-only designとして承認済みで、resource / runtimeは未実装です。

### Creative item semantics

- `MEMO`: 思いつき / 提案の段階。具体化や実行判断は不要
- `IDEA`: 具体化した案だが、実行は未確定
- `TASK`: 実行すると決めたこと。未完了でもVersion作成をblockしない
- kindは`MEMO ↔ IDEA ↔ TASK`で相互変更でき、変換履歴を残すかは実装gate
- 一般的なProposal kindは作らない。`MidiProposal`は再生・比較可能なMIDI Assetを持つ別domain entity
- MidiProposalのRejectは関連Creative itemを削除せず、Proposal DecisionはSOURCE_MIDI / SongVersionを変更しない

Taskだけがoptionalにsingle `assigneeMembershipId`、`NORMAL / IMPORTANT`、calendar `dueDate`、`OPEN / IN_PROGRESS / DONE / CANCELED`、`completedBy / completedAt / completedVersionId?`候補を持ちます。Assignee離脱時はTaskを保持してunassignedへ戻す候補です。期限超過はderived displayであり、state mutationではありません。DONEはreopenでき、CANCELEDのuser-facing labelは「不要にする」です。

### Origin, current target, and Comment link

```text
CreativeItem
├── Song（required）
├── originAnchor?（作成時のVersion / Track / point / range。履歴として保持）
├── currentTargetAnchor?（後のVersionで追う場合にuserが明示）
├── sourceCommentId?（Comment → Task）
└── assigneeMembershipId?（Taskのみ、0..1）
```

- old VersionのComment / Creative item Anchorをnew Versionへ自動remapしない
- originが`V1 / 2:14`、current targetが`V2 / 3:02`になっても、元位置を上書きしない
- TaskをVersionごとに自動duplicateせず、Current Songのoutstanding projectionが過去Version由来itemを横断表示する
- Comment → Taskは元Commentを保持して相互linkし、同一Commentからのaccidental duplicateをidempotency / conditional uniqueness候補で防ぐ
- direct Task createでは`sourceCommentId`もAnchorも不要で、Song-levelを許容する

### Anchor dimensions

Creative item / Commentで共有するAnchor候補は、Version、timeline `timeMs`、bar / beat、Trackと、point / rangeです。Position / Trackを外すことで`Version + Track + range → Version + Track → Version → Song`と同じitemのscopeを自然に広げます。

- point: `timeMs`またはbar / beatの一点
- range: `startTimeMs/endTimeMs`またはstart/end bar / beat
- time、bars / beats、Trackはそれぞれoptional。ただしposition付きAnchorはVersion必須
- Anchor relationshipは常にsame Song / Bandでserver validationし、client supplied IDをauthorityにしない
- PPQ、拍子変更、duration照合、Track physical entity、range field shapeは実装gate

### Retention and authorization boundary

Creative itemはprivate Band dataです。Protected operationはcanonical itemからBandをderiveし、strong ACTIVE BandMembershipと将来承認するcreative capabilityを必須にします。Creatorは恒久authorityではありません。Own Task delete、shared / other-created itemの「不要にする」、Owner / Admin moderation、hard delete / tombstone、AuditEventはAUTHZ / data implementation gateで決めます。本文、Song title、Anchor detailをsecurity denial logへ複製しません。

## COLLAB-001 conceptual model（physical designは未変更）

この章はMembership lifecycle、Activity Status、Notification UXのdomain候補です。CLOUD-DATA-001のtable、PK / SK、`ScopeIndex`、TTL、transaction matrixを変更しません。各recordの物理配置とindexは後続physical-design taskで決めます。

### Membership lifecycle and history

- Leave / removeはcanonical `BandMembership`を`ACTIVE → REMOVED`へ条件付き更新する概念で、Cognito User / StreamBand Userの削除ではない
- Admin / Editor / Commenter / Guestはself-leave可能。Ownerは別のACTIVE Ownerを残す場合だけleaveでき、sole Ownerはownership transferが先
- OwnerはAdmin以下、AdminはEditor / Commenter / Guestだけをremoveできる既存AUTHZ contractを維持する
- Leave / remove後もComment、Proposal / Decision、Version contribution、共有Creative item等のproduction historyとattributionを必要範囲で保持する
- 個人だけの未共有draftは削除可能候補とし、共有済み制作履歴と同じ保持を自動適用しない。Exact delete / tombstoneは後続physical-design gateで決める
- Self-rejoinを許可せず、新Invitation + explicit acceptanceで新しいACTIVE lifecycleへ進む。過去Membership recordを復活させるか新recordにするかはphysical gate
- Account final deletion時のPII anonymization / Former member表示はAUTH-001-DESIGNに従う

Removal reasonはoptionalなfixed category候補で、本文や攻撃的freeform messageをNotification / Auditへ複製しません。Exact categories、retention、operator visibilityは未決定です。

### Activity Status boundary

Activity StatusはBand member profileのinformational metadataで、authorization stateではありません。`REGULAR / PAUSED / LOW_FREQUENCY / SUPPORT`候補の変更はRole、Membership status、Task assignee、NotificationPreferenceをmutateしません。Access判定は常にstrong ACTIVE BandMembershipとAUTHZ capabilityだけを使用します。

### Notification relationship and retention

```text
Internal User
├── NotificationPreference?（preset / overrides）
├── QuietHours?（ordinary delivery preference）
└── Notification*（private source reference / presentation state）
      `── canonical source（Comment / CreativeItem / Version / Proposal / Invitation / Membership event）
```

- Notificationはsource entityではなく、削除 / expiry / READでsourceを変更しない
- `actionRequired`は保存済みsummaryだけを正にせず、current source stateからderiveする候補
- ordinary Notificationは90日retention。Security notificationとAuditEventは別の保持・復旧contract
- Notification deep linkはsource ID / Anchor等のlogical reference候補で、signed URL、S3 key、credentialを保存しない
- List / readはNotification所有Userをserverで確認し、deep link先はcanonical sourceとstrong ACTIVE Membershipを再検証する
- Activity Status、Role、Membership stateからNotification preset / QuietHours / assigneeを自動変更しない

### Physical implementation gates

- Activity StatusをBandMembership itemへ持つか別member profile itemにするか
- NotificationPreference / QuietHours / NotificationのPK / SK / GSI / TTL、90日cleanup、pagination、read-state write pattern
- source reference / privacy-safe snapshot / action-required projection / deduplication / digest deliveryの境界
- leave / remove transaction、history / rejoin record、reason category / AuditEvent、notification generation
- security notification retentionとordinary Notificationの分離、provider / queue / mobile token storage

これらはCLOUD-DATA-001の追加access patternとして別reviewを必要とし、このtaskではphysical keyやAWS resourceを作りません。

## file / object storage境界

将来のS3またはS3互換object storageは候補であり、採用済みではありません。

- object候補: Audio Preview、Stem、元MIDI、Proposalから生成した別MIDI、Reference file
- DBへ保存する候補: private object key、元file名、MIME type、byte size、checksum、scan/state、owner、Song/Version/Track参照、作成・削除時刻
- DBへ保存しない: file binary、長期有効な公開URL、presigned URL、cloud credential
- download/upload URLはmembershipとresource accessを確認後、短時間だけserver側で発行する候補
- object keyはuser入力file名から直接組み立てず、stable IDを基にする
- deleteはDB metadataとobjectの順序、retry、orphan検出、保持期間を設計する
- 未公開曲のobjectはpublic bucket/CDNを既定にせず、logにもURLや個人情報を不用意に残さない

## DBに入れるべきでないもの

- Audio/MIDI/fileのbinary本体
- presigned URL、session token、API key、password、secret、cloud credential
- DAW project本体、plugin binary、plugin chain、automation、mix state、音色presetの完全copy
- UI描画用の固定waveform barやpiano roll矩形。必要ならassetから再生成可能な派生dataとして別途検討する
- 高頻度のpresence heartbeatの無期限履歴
- clientが自己申告したrole、user ID、band access結果
- localStorageやcookieだけを正とする共同制作data

## 画面とdataの対応

| 画面 | Phase 1で読む/表示するdata | Phase 2候補 | 現在のwrite |
| --- | --- | --- | --- |
| `/` | Song、Band Memberの集計表示 | 公開用summaryまたは認可済みdashboard projection | なし |
| `/dashboard` | Band、Song、Task、Member | UserのMembershipを基準にしたBand/Song/Task projection | なし |
| `/bands` | Band、Member count、Song count | Band + Membership集計 | なし |
| `/bands/[bandId]` | Band、Member、Song、Task | Band、BandMembership、Song、Task | なし |
| `/bands/[bandId]/songs` | Song list、status、BPM、version label | Song + current SongVersion summary | search/filterのReact stateのみ |
| `/songs/[songId]` | Song、embedded notes、Task、Comment、SharedFile、visual mock | Song、current Version、Memo、Decision、Task、Comment/Anchor、Asset、Proposal、Review、Presence | TODO/CommentのReact stateのみ |
| `/bands/[bandId]/songs/new` | Band、空のSongFormDraft | Song draft + initial SongVersion作成command候補 | 画面内previewのみ |
| `/songs/[songId]/edit` | Song、Taskから作ったpart初期値 | Song metadata updateとVersion操作を分離 | 画面内previewのみ |

作成/編集formの`versionName`をSong metadata更新と同じAPIで暗黙更新しない方針を候補とします。Songの基本情報更新と新Version作成は、validation、権限、audit、失敗時のatomicityをDATA-002で分けて検討します。

## IDとslug

- 現在の`lumen-echo`や`afterglow`はmock IDとURL segmentを兼ねる
- Phase 2では内部IDとslugを分け、title/name変更で参照関係を壊さない
- slugはBand内またはresource種別内でのunique scope、予約語、変更履歴、redirectの要否を決める
- authorizationはslugの存在だけで許可せず、解決後のstable ID、band ID、membershipで判断する
- 外部公開するIDは連番の推測を避ける形式を候補とするが、UUID/ULID等の採用は未決定
- mock IDをそのまま本番primary keyへ移行することを前提にしない

## 権限、削除、復元、audit

- UserとBandMembershipを分け、同じUserでもBandごとにroleが異なる前提にする
- membershipから外れたUserが、過去URLやobject keyで未公開Songへアクセスできないことをtestする
- Song/Version/Asset/Comment/Decisionごとにcreate/read/update/delete権限を定義する
- SongとBandはまずarchive/soft delete候補とし、復元期限、hard delete、関連asset処理を決める
- Versionや採用済みDecisionを物理削除できる範囲は、履歴とprivacyの両面から決める
- AuditEventはactor、action、resource、result、timeを記録し、本文やsecretを過剰に複製しない
- account退会、Band解散、法的削除要求、backupからの消去手順は実装前に決める

## DAW Bridge metadata

DawBridgeSourceは将来候補で、Companion App/Bridge Pluginの採用や実装を意味しません。

- 保存候補はDAW名、Bridge version、source project fingerprint、capture時刻、対応capabilityなど最小metadata
- DAW local path、credential、plugin parameter、音色、mix、project全体をcloudへ無条件送信しない
- Bridge由来のVersion/Assetにはoriginを追跡できる参照を付ける候補
- 同期失敗、重複送信、offline、version互換、取消、rollbackは専用設計が必要
- 元projectや元MIDIをStreamBandから自動上書きしない

## API化前の境界

[API.md](API.md)のendpoint例は未確定です。DATA-002では少なくとも次を決めてから実装へ進みます。

- commandごとのauthentication、Band Membership、role/ownership check
- runtime validation、文字数、BPM/拍子、anchor、file metadataの制約
- Song updateとVersion createを分ける境界
- idempotency、二重投稿、optimistic concurrency、`409`の扱い
- upload request、complete、downloadの権限再確認と期限
- transaction境界、partial failure、retry、audit event
- clientへ返さないfieldと、権限不足/対象なしによる情報漏えい対策

## CLOUD-DATA-001: Cloud MVP DynamoDB physical design

### Statusと対象範囲

調査日: 2026-09-11

この章は、2 user / 1 private Bandのfriend testに必要なmetadata persistenceを、resource作成前に具体化した設計です。選択する形は、On-Demand capacityの**単一DynamoDB table + sparse GSI 1本**です。table名候補は`streamband-<environment>-metadata`、primary keyは`PK` / `SK`、GSIは`ScopeIndex`（`GSI1PK` / `GSI1SK`）とします。`<environment>`は`nonprod`または`private-alpha`で、実名・曲名・email等を含めません。

この選択はphysical designのreview案であり、table、PITR、index、TTL、alarm、IAM、APIはまだ作成していません。CLOUD-003Cのdeployment foundation bootstrapは完了していますが、application tableやdata resourceの作成許可を意味しません。

### MVP persistence scope

最初のsliceで永続化するのは次のentityと補助recordに限定します。

- `User`、`Band`、`BandMembership`
- `Song`、明示的に作る`SongVersion`
- binary本体を含まない`Asset` metadata
- `Comment`とVersion固定の`CommentAnchor`
- source MIDIと別assetを参照する`MidiProposal`
- append-onlyの`ProposalDecision`
- Membership変更、Proposal Decision、Song archive、Asset削除等に限定した`AuditEvent`
- authentication subjectからUserを引くlookup recordと、二重送信を防ぐidempotency record

CLOUD-DATA-001時点では`CreativeItem`（Memo / Idea / Task）、`ActivityStatus`、`NotificationPreference`、`QuietHours`、`Notification`、`SongMemo`、`Task`、`SongPart`、`SongTrack`の独立entity、`ReviewRequest` / `ReviewResponse`、formal invitation、notification delivery、search projection、Presence / Call、DAW Bridgeを最初のsliceからDEFERしました。CreativeItemだけは後続のCREATIVE-DATA-001 / DEC-025でsingle-table extensionのdocs-only designを承認済みですが、実装は未着手です。Commentのpart / track文脈は当面optionalな安定codeとしてAnchorに保持し、独立SongTrackが必要になった時に専用migrationを行います。Stemは`Asset.kind`で表現可能にしますが、最初のupload workflow必須にはしません。

### Single-tableを選ぶ理由

| 観点 | single-table採用理由 | small multi-tableを今回見送る理由 |
| --- | --- | --- |
| 小規模serverless | 1 tableのOn-Demandでcapacity管理を減らし、Lambdaから一貫したrepository boundaryを使える | table別capacityは不要でも、backup、alarm、IAM、restore、migrationの対象が増える |
| authorization | protected itemへ`bandId`を持たせ、Membershipのbase-table `GetItem`と組み合わせる規則を統一できる | entity tableごとに所有scopeとread順序がばらつきやすい |
| atomicity | Song + initial Version、Proposal + Decision summary、Membership + Auditを同一Regionの`TransactWriteItems`で扱える | 複数tableでもtransaction可能だが、最初のMVPでは運用対象を増やす利点が小さい |
| recovery | 1 tableをPITRから隔離tableへ戻して整合確認しやすい | table間で同じ復旧時点を選び、cutoverを調整するrunbookが増える |
| beginner maintainability | key prefix、1 GSI、access-pattern matrixを固定すれば、物理設定の数を小さくできる | entityごとの単純なkeyは理解しやすい一方、cross-table list、backup、policyの全体管理が増える |

見直し条件は、access patternが頻繁に変わる、ad-hoc join / reporting / full-text searchが中心になる、relationship constraintをapplicationで安全に維持できない、transactionが100 item制限へ近づく、hot partitionやGSI costが実測で問題になる、またはteamがkey prefixを安全に保守できない場合です。その場合はmanaged PostgreSQLをfallbackとして再評価します。SQL migrationを伴う切替は別taskとし、DynamoDB itemをdomain DTOへ変換するrepository層からexportします。

### Key convention

- IDはserver生成のopaqueでimmutableな値とし、この文書の`b_demo_01`等はsynthetic exampleです。UUID / ULIDの最終選択は実装taskで固定します。
- 時刻はserver生成UTC ISO 8601、sequenceと数値sort keyは固定幅zero-paddingを使います。
- mutableな表示名、slug、original filenameをPK / SKへ使いません。
- protected entityは`bandId`を必須とし、`songId` / `songVersionId`も関係に応じて重複保持します。このdenormalizationはclientを信用するためではなく、serverがcross-Band mismatchを検証するためです。
- mutableなentityには`revision`を1から付け、更新ごとにconditional writeでincrementします。append-only itemはrevision不要です。

| Entity / record | PK | SK | 主要fieldとrelationship | concurrency / status |
| --- | --- | --- | --- | --- |
| User | `USER#<userId>` | `PROFILE` | `entityType`, `userId`, `displayName`, `createdAt`, `updatedAt` | `revision`, `status` |
| Auth subject lookup | `AUTH#<provider>#<opaqueSubject>` | `USER` | `userId`, `createdAt`; client responseへ出さない | immutable、重複Put禁止 |
| Band | `BAND#<bandId>` | `META` | `bandId`, `slug`, `name`, `createdBy`, timestamps | `revision`, `status=ACTIVE|ARCHIVED` |
| BandMembership | `BAND#<bandId>` | `MEMBERSHIP#<userId>` | `membershipId`, `bandId`, `userId`, `role`, timestamps | `revision`, `status=ACTIVE|REMOVED` |
| Song | `SONG#<songId>` | `META` | `bandId`, metadata、`currentVersionId`, `currentVersionSequence`, timestamps | `revision`, Song status、`archivedAt?` |
| SongVersion | `VERSION#<versionId>` | `META` | `bandId`, `songId`, `sequence`, `label`, `note`, `basedOnVersionId?`, actor / timestamps | 原則immutable。限定metadata更新時だけ`revision` |
| Asset | `ASSET#<assetId>` | `META` | `bandId`, `songId`, `songVersionId?`, `kind`, internal `storageObjectKey`, checksum / size / MIME、actor / timestamps | `revision`, upload / deletion state |
| Comment | `VERSION#<versionId>` | `COMMENT#<createdAt>#<commentId>` | `bandId`, `songId`, `versionId`, `commentId`, author、type、body、timestamps | `revision`, `deletedAt?` |
| CommentAnchor | `VERSION#<versionId>` | `ANCHOR#<orderType>#<position>#<commentId>` | `bandId`, `songId`, `versionId`, `commentId`, `commentSk`, optional time / bar / beat / part code | immutable。Commentと同時作成 |
| MidiProposal | `PROPOSAL#<proposalId>` | `META` | `bandId`, `songId`, `sourceVersionId`, `sourceMidiAssetId`, separate `proposalAssetId`, summary、actor / timestamps | `revision`, Proposal status |
| ProposalDecision | `PROPOSAL#<proposalId>` | `DECISION#<decidedAt>#<decisionId>` | `bandId`, `songId`, `sourceVersionId`, `decision`, note / partial detail、actor | append-only。Proposal/Asset/Versionを上書きしない |
| AuditEvent | `BAND#<bandId>` | `AUDIT#<occurredAt>#<auditEventId>` | actor、action、resource type / ID、result、request ID。本文やobject keyを複製しない | append-only、retention policy対象 |
| Idempotency | `OP#<actorUserId>#<operation>` | `KEY#<clientOperationId>` | input hash、result resource ID、createdAt、`expiresAt` | conditional Put、TTL補助 |

`CommentAnchor`の`orderType / position`は、time anchorなら`T#<timeMs 12桁>`、musical positionなら`B#<bar 8桁>#<beat 4桁>#<tick 8桁>`、位置なしCommentにはAnchor itemを作りません。timeとbar/beatを同時に受ける場合はserverが整合を検証し、Versionが違う位置情報を流用しません。

Proposal lifecycleのphysical candidateは`DRAFT | SUBMITTED | REVIEWING | ACCEPTED | PARTIALLY_ACCEPTED | REJECTED | WITHDRAWN`です。FLOW-001の`HOLD`はfinal Decisionを追加せず`REVIEWING`を維持するUI actionとして扱い、独立した永続statusにはしません。Decision itemは`ACCEPT | PARTIAL | REJECT`を記録し、権限matrixはAUTHZ-001で確定します。

### ScopeIndex: MVPで唯一のGSI

`ScopeIndex`は`GSI1PK` / `GSI1SK`を持つitemだけが入るsparse GSIです。projectionは`KEYS_ONLY`とし、一覧のindex query後に必要なcanonical itemを`BatchGetItem`します。これによりitem種別ごとの表示fieldをindexへ複製せず、write / storage amplificationをkey分に限定します。一覧の追加round tripは2 user規模では受容します。

| Indexed item | GSI1PK | GSI1SK | served access pattern |
| --- | --- | --- | --- |
| BandMembership | `USER#<userId>` | `BAND#<bandId>` | UserのBand一覧 |
| Song | `BAND#<bandId>` | `SONG#<updatedAt>#<songId>` | BandのSong一覧 |
| SongVersion | `SONG#<songId>` | `VERSION#<sequence 12桁>#<versionId>` | Version履歴とlatest候補 |
| Asset | `SONG#<songId>` | `ASSET#VERSION#<versionId-or-STAGING>#<createdAt>#<assetId>` | Version / staging Asset一覧 |
| MidiProposal | `SONG#<songId>` | `PROPOSAL#VERSION#<versionId>#<createdAt>#<proposalId>` | Song全体またはVersion単位のProposal一覧 |

GSI queryはeventually consistent onlyなので、Membership authorization、Asset access authorization、current Versionのread-after-write判定には使いません。GSIは一覧候補の発見だけに使い、protected operationはbase tableを再読込します。LSI、別GSI、Streams、DAX、Global TablesはMVPでは追加しません。

### Access-pattern matrix

| # | Access pattern | Operation / key | consistency | count / pagination |
| --- | --- | --- | --- | --- |
| 1 | Get Band by ID | `GetItem(BAND#id, META)` | protected readはstrong | 1 item |
| 2 | Check membership | `GetItem(BAND#id, MEMBERSHIP#userId)` | **strong必須**。`ACTIVE` / capabilityも確認 | 1 item、毎protected command |
| 3 | List Bands for User | `Query ScopeIndex(USER#userId, begins_with(BAND#))` → canonical `BatchGet` | indexはeventual。表示後の操作時は#2を再確認 | friend testは10件未満想定、cursor対応 |
| 4 | Get Song | `GetItem(SONG#id, META)` → #2で`bandId`確認 | strong候補 | 1 item |
| 5 | List Songs for Band | `Query ScopeIndex(BAND#id, begins_with(SONG#))` → `BatchGet` | listはeventual可。先に#2 | 25件/page、`LastEvaluatedKey` |
| 6 | Get latest SongVersion | strong `Get Song.currentVersionId` → strong `GetItem(VERSION#id, META)` | **strong**。GSI latestだけに依存しない | 2 items |
| 7 | List SongVersions | `Query ScopeIndex(SONG#id, begins_with(VERSION#))`、descending | eventual可 | 25件/page |
| 8 | Get Version | `GetItem(VERSION#id, META)` → `bandId/songId`照合 | strong候補 | 1 item |
| 9 | List Comments for Version | base `Query(VERSION#id, begins_with(COMMENT#))` |通常eventual、投稿直後はAPI responseまたはstrong | 50件/page |
| 10 | Comments around anchor | base `Query(VERSION#id, ANCHOR#T#... BETWEEN ...)`または`ANCHOR#B#...` → stored Comment keyを`BatchGet` | base Queryはstrong候補 | 100 anchors/page、windowを限定 |
| 11 | List Proposals for Version / Song | `Query ScopeIndex(SONG#id, begins_with(PROPOSAL#...))` | eventual可。mutation前はbase再読込 | 25件/page |
| 12 | Get Proposal + Decision history | `Query(PROPOSAL#id)`。`META` + `DECISION#` | review直後はstrong候補 | decisionは50件/page |
| 13 | Get Asset metadata | `GetItem(ASSET#id, META)` | strong候補 | 1 item |
| 14 | Resolve Asset ownership | #13 + strong #2、request Song / Versionとstored IDsを照合 | **strong必須** | signed instructionごと |
| 15 | Write AuditEvent | protected mutationと同じ`TransactWriteItems`で`Put` | transaction | 1 event /重要操作 |
| 16 | Prevent cross-Band read | resource base itemのstored `bandId`とstrong Membershipを照合 | **strong必須** | mismatchはDATA-002の外向き404候補 |

GSI pagination tokenはserverがopaque cursorとして署名 / encodeする候補で、raw keyやinternal storage keyを公開API identifierにしません。`Scan`は運用調査以外のapplication pathで使いません。

### Atomicity and write matrix

| Operation | write strategy | atomic boundary / condition | consistency note |
| --- | --- | --- | --- |
| Create Song + initial Version | `TransactWriteItems` | Song Put、Version Put、idempotency Put、optional Audit。両entityの`attribute_not_exists` | SongとVersionを半端に残さない |
| BandMembership add / role / remove | `TransactWriteItems` | Membership conditional Put/Update + Audit + idempotency。最後のOwner等のruleはAUTHZ-001で追加 | authorization readはstrong |
| Create Comment | `TransactWriteItems` | Comment + optional Anchor + idempotency。Version / membershipは直前にstrong readし、必要ならtransaction conditionへ含める | Anchorだけ残さない |
| Create Proposal | `TransactWriteItems` | Proposal + idempotency + Audit候補。source / proposal Assetは`AVAILABLE`かつsame Band / Song / Versionを事前確認 | source Assetは更新しない |
| Record Proposal Decision | `TransactWriteItems` | expected revision / statusでProposal summary Update、append Decision Put、idempotency、Audit | **Versionを作らない**。相反判断を409にする |
| Complete Asset upload | object storage verify後に`TransactWriteItems` | Assetをexpected state / revisionで`AVAILABLE`へUpdate + idempotency + Audit。storageとDynamoDBは同一transactionではない | retry可能なreconciliationが必要 |
| Create next Version | `TransactWriteItems` | Version Put、expected Song revisionでcurrentVersion pointer Update、verified Asset association、idempotency、Audit | Proposal Decisionとは別command |
| Single Song metadata update | conditional `UpdateItem` | `revision = expectedRevision`かつnot archived | 1 itemなのでtransaction不要 |

DynamoDB transactionは最大100 unique item / 4 MBであるため、Versionに一度に関連付けるAsset数へimplementation上限を設けます。外部object storageの成否とDynamoDB transactionはatomicにならないため、Asset stateとreconciliationを必須にします。

### Concurrency and idempotency

- mutable entityのupdateは`revision = expectedRevision`をconditionにし、成功時に`revision = revision + 1`と`updatedAt`をserver値で更新します。
- condition failureはsilent overwriteせずDATA-002の`409 CONFLICT`へmapし、clientへlatest再読込と差分確認を促します。
- Proposal DecisionはProposal revisionとallowed current statusを同時にcondition化し、AのAcceptとBのRejectが両方current summaryにならないようにします。Decision履歴はappend-onlyです。
- create / complete系は`clientOperationId`からIdempotency itemを作り、同じkey + input hashは既存resultを返し、同じkey + 異なるinputは409候補とします。
- `TransactWriteItems.ClientRequestToken`の公式idempotency windowは10分なので、それだけに依存せず、applicationのIdempotency itemを24時間保持する初期候補とします。TTL削除は非同期のため、期限切れitemもapplicationで`expiresAt`を判定します。
- retryはthrottle / retryable 5xxへbounded exponential backoff + jitterを使い、validation、permission、condition conflictは自動再送しません。

### Asset metadata boundary

1. upload requestでserverがMembership、capability、Band / Song / Version ownership、kind、size、MIME候補を検証する。
2. DynamoDBへ`Asset(state=PENDING_UPLOAD)`とopaque internal object keyを作る。client supplied filenameからkeyを組み立てない。
3. short-lived upload instructionだけを返し、長期URLを保存しない。
4. upload completeでobjectの存在、size、checksum、type等をstorage側から検証する。
5. conditional writeで`VERIFYING` / `AVAILABLE`へ進める。失敗時は`FAILED`として再試行またはorphan cleanup対象にする。
6. download/accessごとにAsset、Version、Song、BandMembershipを再確認してshort-lived instructionを返す。

DynamoDBに保存するのはmetadataだけです。audio / MIDI binaryはprivate S3、presigned URLは短命response、`storageObjectKey`はinternal fieldとし通常のclient DTOへ出しません。`SOURCE_MIDI` Assetはread-only source、`PROPOSAL_MIDI`は別Asset ID / objectです。Proposal Decisionはどちらのbinaryも変更しません。

STORAGE-001-DESIGNでは、初期kindを`AUDIO_PREVIEW / SOURCE_MIDI / PROPOSAL_MIDI`へ限定し、1 Assetにつき一意なopaque object keyを割り当てます。Asset metadataはupload intentとverified resultを分け、client申告値とstorage確認値を混同しません。署名URL、bucket名、object version ID、内部keyはpersistent public API identityにせず、通常のclient DTOへ含めません。詳細なformat、limit、expiry、CORS、Versioning / lifecycle契約は[AWS.md](AWS.md)を正とします。

### Deletion, retention, and recovery

| Resource | MVP behavior | physical cleanup boundary |
| --- | --- | --- |
| Song | `ARCHIVED` + `archivedAt/by`。一覧から除外し、明示restore可能 | friend test中はcascade hard deleteしない。purgeは別Human Gate |
| SongVersion | 原則immutable / retained。current pointer変更はtransaction | MVPでは自動hard deleteしない |
| Comment / Anchor | Commentはtombstone化し本文をactive itemから除去。Anchorはtimeline整合用tombstone参照を保持 | backup内残存とprivacy削除手順を別taskで定義 |
| Asset | accessを即時denyする`DELETION_REQUESTED` → object cleanup確認後`DELETED` | S3 Versioning / lifecycleと同期するSTORAGE-001責務。metadata tombstoneは保持 |
| Membership | `REMOVED`へ変更し、以後のstrong membership checkを拒否 | historical actor IDとAuditは保持 |
| Proposal / Decision | Proposal withdrawalは可、Decision historyはappend-only | Original / Proposal Assetを上書き・cascade削除しない |
| AuditEvent | 重要eventだけを保持し、本文・URL・secretは複製しない | 180日retentionを初期候補。正式期間はprivacy / incident reviewで承認 |

TTLは削除時刻の厳密な保証ではなく、期限後も数日残る可能性があります。そのためpermission、idempotency、privacyの判定をTTL削除完了へ依存させません。Song / Version / Assetの自動TTLは使いません。

table作成taskではDynamoDB PITRを35日で有効化する推奨です。PITRは誤更新・削除からtable metadataを指定時点へ戻す助けになりますが、S3 object、外部identity、IAM、application bugの再発防止、個別itemの即時undoを保証しません。restoreは既存tableを巻き戻さず**新しいtable**を作るため、切替前にrecord count、critical relationship、GSI、authorizationを隔離検証します。TTL、PITR、deletion protection、tags、alarms、IAM、Streams等はrestore後に手動 / IaCで再設定が必要です。

Private Alpha前にsynthetic dataでrestore drillを行い、new table作成 → validation → application endpoint切替候補 → rollback / cleanupの手順と時間を記録します。S3 Versioningは別のSTORAGE-001 gateで、DynamoDB PITRと同じものではありません。

### Capacity and cost

- nonprod / Private AlphaはOn-Demand capacityを選びます。小さく不規則なtrafficにcapacity planningが不要で、request単位課金となるためです。freeを保証せず、resource作成直前にTokyo Regionのcurrent official priceを再確認します。
- 主なbilling driverはtable / GSIのread-write request、transaction request、stored bytes、PITR / backup、restore / export、data transferです。transaction read / writeは通常requestより多くrequest unitを使います。
- `ScopeIndex`はindex keyを持つitemだけを対象にし`KEYS_ONLY` projectionとします。それでもindexed Song / Version / Asset / Proposal / MembershipのwriteごとにGSI write / storage amplificationがあるため、不要なprojectionと追加indexを避けます。
- DynamoDB item上限は400 KBです。Comment本文、Version note、Proposal summaryへserver-side上限を設け、一覧summaryを小さく保ちます。audio / MIDI binary、波形sample、piano roll全note列、file内容はS3へ置きます。
- large collection、unbounded Comment/Audit、Scan、N+1 BatchGet、hot keyはmetricsで確認します。2 user想定を理由にpaginationを省略しません。

### Security / authorization boundary

- PK / SKやopaque IDを知っていることはauthorizationではありません。API / Lambdaはidentityをserverで確定し、strong base-table readで`BandMembership.status=ACTIVE`とoperation capabilityを確認します。
- client supplied `bandId`、`songId`、`versionId`、`assetId`の関係を信用せず、stored `bandId / songId / versionId`が同じchainに属することを検証します。
- GSIのeventual resultだけでpermissionを許可しません。membership removal後のprotected read / signed accessはbase itemで拒否します。
- cross-Band mismatchや他Band resourceは、内部logへsafe request IDとcategoryを残しつつ、外向きには存在を漏らさない404候補を維持します。
- private S3 object key、signed URL、Cognito subject、internal auth lookup keyをpersistent public API IDにしません。
- AUTHZ-001のrole bundleは`Owner / Admin / Editor / Commenter / Guest`です。creator fieldはaudit / own-resource conditionであり、resource管理権限そのものではありません。
- Bandごとに最低1人のACTIVE Ownerを残し、ownership transferとMembership changeはexpected revision付きtransactionでinvariantを守ります。詳細なcapability / audit / error contractは[API.md](API.md)を正とします。

### Physical design summary

| Item | Decision |
| --- | --- |
| selected model | On-Demand single-table design |
| table candidate | `streamband-<environment>-metadata` |
| primary key | `PK` / `SK`; entity prefix + opaque immutable ID |
| GSI | `ScopeIndex` (`GSI1PK` / `GSI1SK`), sparse, `KEYS_ONLY`; no LSI |
| access | base `Get/Query` for identity / authorization / detail、GSI for user / Band / Song scope lists |
| transactions | Song + initial Version、Membership mutation、Comment + Anchor、Proposal Decision、Version create、verified Asset completion |
| concurrency | integer `revision` + `expectedRevision` conditional write、conflictは409、silent overwrite禁止 |
| backup | PITR 35日をresource taskで有効化し、Private Alpha前にnew-table restore drill |
| delete | archive / tombstone first。Asset object cleanupは別state machine、automatic cascadeなし |
| migration trigger | access pattern churn、relationship / reporting要求、transaction / item / hot-key limit、保守性または実測cost問題でPostgreSQLを再評価 |

## CREATIVE-DATA-001: CreativeItem physical persistence contract

### Status and selected model

この章は、DEC-022のcreative workflowとDEC-024のauthorization contractを、CLOUD-DATA-001の既存single-tableへ追加する**承認済みのdocs-only physical design**です。設計日: 2026-09-14。Runtime command / validation、migration、resource変更は別gateであり、このtaskではDynamoDB table、GSI、migration、API routeを作成しません。

Memo / Idea / Taskは別entityへ分割せず、1つの`CreativeItem` entityと`kind = MEMO | IDEA | TASK`で表現します。同じitemを相互変換してもopaque immutable IDを維持するため、Comment link、origin、history、notification sourceが別itemへ分散せず、Memo → Idea → Taskをmandatory workflowにも変えません。Separate entity方式はTask-only fieldの型を分けやすい一方、変換時にID・link・idempotencyを移送するtransactionが増え、同一itemとしての制作履歴が曖昧になるためMVPでは採用しません。

### Canonical CreativeItem

```text
PK = CREATIVE#<creativeItemId>
SK = META
```

| Field | Required / condition | Meaning |
| --- | --- | --- |
| `entityType` | required | `CreativeItem` |
| `creativeItemId` | required / immutable | opaque stable ID |
| `bandId` / `songId` | required / immutable | canonical ownership chain。Protected operationのserver-side authorizationに使用 |
| `kind` | required | `MEMO | IDEA | TASK` |
| `lifecycleState` | required | `ACTIVE | DELETED`。Taskのworkflow statusとは別 |
| `title` / `body` | application ruleに応じてoptional | private creative content。Audit / logへ複製しない |
| `createdBy` / `createdAt` | required / immutable | creator attribution。Authorizationそのものではない |
| `updatedBy` / `updatedAt` | required | 最後に更新したactor / server time |
| `revision` | required | integer optimistic revision。Mutationは`expectedRevision`を要求 |
| `sourceCommentId` / `sourceCommentVersionId` / `sourceCommentCreatedAt` | Comment → Taskだけ | canonical source Commentのserver-managed locator。一般linkとは区別 |
| `originAnchor` | optional | 作成時の位置履歴。別Versionへ自動remapしない |
| `currentTargetAnchor` | optional | userが明示した現在target。Originとは別に更新可能 |
| `hasExternalContribution` | required boolean | creator以外による、self-delete不可にすべき共有contributionが一度でも存在したことをserverがmonotonicに記録。Title / body editを含む全対象mutationで更新し、一度`true`になったら`false`へ戻さない |
| `commentLinkCount` | required integer | active general Comment edge数。Edge transactionと同時更新しself-delete guardに使用 |
| `deletedAt` / `deletedBy` | `DELETED`時 | logical deletion metadata。Private bodyをAuditへコピーしない |
| `GSI1PK` / `GSI1SK` | `ACTIVE` itemだけ | Song Creative Board用sparse ScopeIndex keys |

`kind = TASK`のときだけ、`status = OPEN | IN_PROGRESS | DONE | CANCELED`、optional `assigneeMembershipId`、internal locator候補`assigneeUserId`、`priority = NORMAL | IMPORTANT`、optional date-only `dueDate`（`YYYY-MM-DD`）、optional `completedBy / completedAt / completedVersionId`を保存します。DONE遷移でcompletion fieldsを設定し、reopenではcurrent METAから外しますが、actor / time / optional related Versionはstructural eventに残します。Memo / IdeaにはTask-only fieldをdefault値で埋めません。

### Existing ScopeIndex reuse

```text
GSI1PK = SONG#<songId>
GSI1SK = CREATIVE#<createdAt>#<creativeItemId>
```

既存のsparse `ScopeIndex`を`KEYS_ONLY`のまま再利用し、新しいtable / GSIは追加しません。Sort keyは変換や状態変更で動かないcreated orderとし、cursorの安定性を優先します。Boardの「すべて」はGSI Query後にcanonical itemを`BatchGetItem`し、kind filter、outstanding Task（`OPEN / IN_PROGRESS`）、priority、assignee、Anchor表示はapplication側で行います。Logical deleteではGSI key attributesを削除し、eventual consistencyで返った候補もcanonical `lifecycleState`を確認して除外します。

Initial page candidateは50 index candidatesです。Filtered resultが不足する場合はopaque cursorを維持して最大5 index page / 250 candidatesまでbounded continuationし、それでも不足すれば次cursorを返します。Friend test規模でもpaginationを省略せず、application pathで`Scan`を使いません。Status / priority / assigneeだけのためにwrite amplificationとpermission surfaceを増やすindexは作りません。

### Comment relationships and duplicate prevention

Comment → Taskはclient operation IDとは独立したuniqueness guardを持ちます。

```text
PK = COMMENT#<commentId>
SK = CREATIVE_TASK_LINK
```

Guard itemは`entityType = CommentCreativeTaskLink`、`bandId / songId / songVersionId / commentId / commentCreatedAt / creativeItemId`、`linkState = ACTIVE | TASK_DELETED`、`createdBy / createdAt / revision`を保持します。Commentのcanonical itemは既存の`VERSION#<versionId> / COMMENT#<createdAt>#<commentId>`なので、serverはCreativeItem / guardのserver-managed locatorからcanonical Commentを先に解決し、stored Version / Song / Band chainを検証します。Guard keyだけでCommentの存在やauthorizationを判断しません。

Comment → Task commandは1回の`TransactWriteItems`で、actorのACTIVE Membershipとcanonical Commentの条件確認、CreativeItem Put、`attribute_not_exists(PK)`付きguard Put、Idempotency Put、structural event、safe AuditEventを処理します。同じoperation key + 同じcanonical inputは既存`creativeItemId`へ収束し、同じkey + 異なるinputは409、別operation IDによるdouble tapもguard conditionで重複Taskを作りません。

Taskをlogical deleteしてもguardを消さず`TASK_DELETED`へ更新し、同じCommentから自動的に再変換可能にはしません。意図的な再作成は、過去linkの表示、authorization、Auditを含む別command / human reviewを必要とするfuture candidateです。

一般的なComment linkはunbounded arrayをMETAへ埋めず、次のedge itemで表現します。

```text
PK = CREATIVE#<creativeItemId>
SK = COMMENT_LINK#<commentId>
```

Edgeには`entityType = CreativeCommentLink`、`bandId / songId / songVersionId / commentId / commentCreatedAt / creativeItemId`、`createdBy / createdAt`を保持します。Creative itemからlinked Commentsをbase QueryできればMVP access patternを満たすため、general reverse edgeや新GSIは作りません。Comment → Task専用guardはreverse duplicate checkを担い、一般linkと混同しません。Unlink / reverse listがproduct requirementになった時点で、mirror edgeをtransactionで持つ必要性を再評価します。

### Anchor representation

`originAnchor`と`currentTargetAnchor`はCreativeItem META内のbounded mapとし、新しいitem / GSIを作りません。両方ともoptionalで、Song-level itemはAnchorなしで正常です。

| Field candidate | Rule |
| --- | --- |
| `songVersionId` | 指定時はCreativeItemのcanonical Song / Bandへ属することを検証 |
| `songTrackId`またはstable `trackCode` | optional。別SongのTrackを拒否 |
| `anchorType` | `VERSION | TRACK | TIME_POINT | TIME_RANGE | MUSICAL_POINT | MUSICAL_RANGE` candidate |
| `timeMs`または`startTimeMs / endTimeMs` | integer、0以上、rangeはstart < end |
| `bar / beat / tick`とend counterparts | 1-based bar / beat、PPQ exact ruleはruntime validation gate |

`originAnchor`は作成時のVersion位置をhistoryとして保持し、Version更新時に自動remapしません。`currentTargetAnchor`だけをuserの明示操作とexpected revisionで更新し、originは残します。Timeline markerはSong page分をpage取得後にfilterするMVP境界とし、time-window Queryの負荷が実測で問題になるまでは専用indexを追加しません。

### Kind conversion identity and fields

Memo ↔ Idea ↔ Taskは同じ`creativeItemId`を維持するconditional updateです。`createdBy / createdAt / originAnchor / sourceCommentId`を変更せず、`updatedBy / updatedAt / revision`とstructural eventを更新します。

- Memo / Idea → Task: `OPEN / NORMAL`を初期化し、assignee、due date、completion fieldはcommandで明示された場合だけ追加する
- Task → Memo / Idea: active METAからTask-only fieldsを`REMOVE`し、古いassignment / statusをcurrent DTOへ残さない
- Memo ↔ Idea: Task fieldを生成しない
- 再びTaskへ変換: 古いTask fieldを黙って復元せず、`OPEN / NORMAL`から開始する
- 変換retry: Idempotency itemと`expectedRevision`で同一結果へ収束し、stale conversionは409にする

構造履歴にはbefore / after kindとsafe state codeだけを残し、private title / bodyを複製しません。この設計は変換順序を要求せず、どのkindからでも作成・変更できるproduct ruleを維持します。

### Assignee reference and removed Membership

Current assignmentはBand-specificな`assigneeMembershipId`をidentityとし、既存Membership keyを取得するために`assigneeUserId`をinternal locatorとして併記する候補です。Serverは`BAND#<bandId> / MEMBERSHIP#<assigneeUserId>`をstrong readし、recordの`membershipId`が保存値と一致し`ACTIVE`であるときだけcurrent assigneeとして投影します。どちらのfieldもauthorizationを付与しません。

Leave / remove時にSong内の全Taskをfan-out updateしません。Membershipがinactive、missing、またはmembershipId mismatchなら、remaining member向けcurrent UIでは即時に「未割当」と投影し、次mutationでconditional unassignできます。過去のassignment structural eventと元membershipIdはhistoryとして保持します。Rejoinでは新しいmembershipIdを発行するため、以前のassignmentが自動復活しません。Background cleanupはcorrectness条件ではなくfuture maintenance候補です。

### Logical deletion and safe tombstone

`lifecycleState = ACTIVE | DELETED`はTask statusと別です。Logical deleteは`expectedRevision`とauthorized capability / self-delete guardをconditionに、`DELETED`、`deletedAt / deletedBy`、新revisionを設定し、ScopeIndex key attributesを削除します。Canonical item、relationship guard、edge、structural eventはhistory / recoveryのため保持します。

Authorized remaining memberがdirect Getした場合、repository layerはtombstone DTOとしてID、kind candidate、lifecycle、deletedAt、safe attributionだけを返し、title、body、Anchor、Task detailを返しません。Storage上のprivate contentをいつpurgeするか、restore API、retention、legal deletionは別Human Gateであり、TTLやautomatic hard purgeをこの提案へ追加しません。

Editor / Commenterのconditional self-deleteは、actorがimmutable `createdBy`と一致し、`hasExternalContribution = false`、`commentLinkCount = 0`、`sourceCommentId`なし、`ACTIVE`、revision一致をすべて満たす場合だけ許可します。`hasExternalContribution`はstructural eventの有無ではなく、creator以外によるtitle / body edit、kind conversion、Task state change、reopen / unnecessary、assign / unassign、priority / due date update、Anchor update、general Comment link、その他DEC-024上の他member edit / production historyに該当するmutationをすべて含みます。該当mutationではserverがactorとstored `createdBy`を比較し、同じatomic update / transaction内で値をmonotonicに`true`へ設定します。Client側判定や後続集計へ依存せず、creator自身だけのmutationでは`false`から変更しません。Owner / AdminはDEC-024に従いshared itemをlogical deleteできます。Guardを完全に評価できない旧dataや不整合ではfail closedにします。

### Structural history versus AuditEvent

Product UXに必要な最小structural eventはCreativeItem partitionへappend-only child itemとして保存します。

```text
PK = CREATIVE#<creativeItemId>
SK = EVENT#<occurredAt>#<eventId>
```

Event candidateは`KIND_CHANGED`、`TASK_STATUS_CHANGED`、`REOPENED`、`MARKED_UNNECESSARY`、`ASSIGNED`、`UNASSIGNED`、`COMMENT_LINKED`、`CREATED_FROM_COMMENT`、`DELETE_REQUESTED`です。`bandId / songId / creativeItemId / actorUserId / occurredAt / beforeCode / afterCode / optional relatedSongVersionId / resultingRevision`だけを必要最小限で持ち、title / body / Comment本文を保存しません。通常の本文editはMETAのupdated fields / revisionだけで扱い、全文edit snapshotを無制限に残しません。

AuditEventはauthorization、destructive operation、incident review用のBand-scoped safe recordで、Creative historyはuserへ制作の構造的な歩みを示すrecordです。重要operationでは同じtransactionへ両方を含められますが、private contentを重複保存せず、個人の生産性scoreへ使いません。

### Creative transaction matrix

すべてのprotected mutationはcanonical CreativeItem / source entityとactor Membershipをstrong readし、transaction内でも可能な限りactor Membership `ACTIVE`、resource revision、relationship stateをConditionCheckして、read後のremoval raceを閉じます。Idempotency itemは既存`OP#<actorUserId>#<operation> / KEY#<clientOperationId>`を再利用します。

| Operation | Atomic write / condition | Idempotency / history / Audit |
| --- | --- | --- |
| Create CreativeItem | Membership condition + `attribute_not_exists(Creative META)` + META Put | Idempotency Put + safe create Audit。Creator / Song chainはserver値 |
| Edit title / body | ACTIVE actor Membership + capability + `revision = expectedRevision`でMETA Update。`actor != createdBy`なら同じatomic updateで`hasExternalContribution = true` | Idempotency candidate。Private title / bodyをAudit / structural eventへコピーせず、full text edit historyを作らない |
| Convert kind | Membership + `revision = expectedRevision` + allowed lifecycle/kindでMETA Update | Idempotency + `KIND_CHANGED` + Audit |
| Update Task status | Membership + revision + allowed current transition + `kind=TASK` | Idempotency + `TASK_STATUS_CHANGED` + Audit |
| Reopen | Membership + revision + `status IN (DONE,CANCELED)`でMETA Update | Idempotency + `REOPENED` + Audit |
| Mark unnecessary | Membership + revision + active Taskで`CANCELED`へUpdate | Idempotency + `MARKED_UNNECESSARY` + Audit |
| Assign / unassign | Actor Membership + target Membership ID / `ACTIVE` condition + Creative revision Update | Idempotency + `ASSIGNED / UNASSIGNED` + Audit。Assigneeにcapabilityを付与しない |
| Comment → Task | Actor Membership + source Comment condition + Creative Put + unique guard Put | Idempotency + `CREATED_FROM_COMMENT` + Audit。Guardがoperation IDを越えてduplicateを防止 |
| Link Comment | Actor Membership + canonical Comment condition + Creative revision Update + edge Put | Idempotency + `COMMENT_LINKED` + Audit。Link count / external contribution guardも同時更新 |
| Logical delete | Membership + capability / self-delete guard + revisionでMETA tombstone Update | Idempotency + `DELETE_REQUESTED` + Audit。Source guardがあれば`TASK_DELETED`へ同時更新 |

Creator以外がCreativeItemを変更するすべてのmutation pathは、structural eventを作るかどうかに関係なく、同じMETA update / transaction内で`hasExternalContribution = true`を設定します。対象にはkind / state / reopen / unnecessary / assignment / priority / due / Anchor / Comment linkと、将来追加するDEC-024上の共有contributionが含まれます。この値をclearするoperationは設けません。

各transactionはboundedな6〜9 item程度を想定し、DynamoDBの100 unique item / 4 MB制限内に保ちます。大量linkの一括mutationやSong全体fan-outは同じtransactionへ詰め込まず、実装時にcommand上限を設けます。Validation / permission / revision conflictは自動retryせず、throttle / retryable 5xxだけをbounded backoff対象にします。

### Creative access-pattern matrix

| # | Access pattern | Operation / key | consistency and authorization | count / pagination |
| --- | --- | --- | --- | --- |
| 1 | Get CreativeItem by ID | `GetItem(CREATIVE#id, META)` | protected readはstrong候補。Stored `bandId/songId` → strong ACTIVE Membership | 1 item |
| 2 | List CreativeItems for Song | `Query ScopeIndex(SONG#id, begins_with(CREATIVE#))` → `BatchGet` canonical | GSIはeventual、先にMembership strong read。Canonical lifecycleを再確認 | 50 candidates/page + opaque cursor |
| 3 | List / filter Creative Board | #2をkind / active Task fieldでapplication filter | authorizationはfilter/GSIへ依存しない | bounded 5 page / 250 candidates candidate |
| 4 | Get source Comment relationship | Creative META `sourceCommentId` + canonical Comment locationをserverで解決 | same Song / Version / Bandを再検証 | 1 Creative + 1 Comment |
| 5 | Comment → Task duplicate check | `GetItem(COMMENT#commentId, CREATIVE_TASK_LINK)`、create時はconditional Put | Read結果だけでauthorizeせずcanonical Comment + Membershipを検証 | 0 or 1 guard |
| 6 | List linked Comments | base `Query(CREATIVE#id, begins_with(COMMENT_LINK#))` → canonical Comment reads | itemと各Comment chainを検証 | 50 edges/page |
| 7 | Validate assignee | `GetItem(BAND#bandId, MEMBERSHIP#assigneeUserId)` + membershipId comparison | **strong必須**。ACTIVEでなければcurrent unassigned projection | 0 or 1 Membership |
| 8 | Update with expectedRevision | strong Get + conditional Update / transaction | actor Membership strong + resource revision / state condition | 1 item + bounded side records |
| 9 | Logical delete | conditional META tombstone update + GSI key removal | capability / self-delete guard / revisionをtransactionで確認 | 1 item + history / Audit / optional guard |
| 10 | Read safe history / tombstone | base `Query(CREATIVE#id, begins_with(EVENT#))`またはMETA Get | Authorized remaining ACTIVE memberだけ。Private bodyをprojectionしない | 50 events/page / 1 tombstone |

### Cost, scale, and reconsideration

Principal cost driverはCreativeItem数、ScopeIndex key write / storage、Comment guard / edge、structural history、Audit / idempotency record、transaction write、canonical `BatchGet`、PITR、item size、paginationです。`KEYS_ONLY`でもindexed active itemのcreate / deleteでindex writeが生じ、transactionは通常writeより多くrequestを消費します。DynamoDB item上限400 KBを理由に、title / body / link数へruntime上限を設け、Comment listやevent listをMETAのarrayへ埋め込みません。Freeを保証せず、resource変更前にTokyo Regionのcurrent pricingを再確認します。

新GSIを追加しない理由は、MVPの中心accessがSong-scoped Boardでpredictableであり、assignee / status / priority / timelineごとのindexはwrite amplification、migration、operational burdenを増やすためです。次の場合はdedicated index、derived projection、別read model、またはPostgreSQLを再評価します。

- 1 Songのactive CreativeItemが約1,000件を継続して超える
- Filtered pageを満たすため5 index page / 250 candidatesのbounded readを頻繁に使い切る
- User / assignee横断Task list、全Band global search、complex reportingが承認要件になる
- Timeline window queryがpage取得後filterではlatency / cost目標を満たさない
- Edge / structural history growth、400 KB / transaction / hot-partition constraint、relational integrityの保守負担が実測問題になる

### Privacy and security boundary

- CreativeItem / edge / historyへAWS credential、Cognito token、session、presigned URL、S3 object keyを保存しない
- Client supplied role、creator、assignee、Band / Song / Version relationshipをauthorityとして使わない
- Title、body、Comment本文、filename、Anchor free textをCloudWatch、AuditEvent、idempotency logへ出さない
- Idempotency recordはcanonical input hashを保持できるが、raw private inputを保存 / logせず、hashもclientへ返さない
- ScopeIndex result、assignee reference、opaque ID knowledgeではauthorizeせず、canonical resource chainとstrong ACTIVE Membershipを毎protected operationで確認する
- Cross-Band mismatch、REMOVED member、hidden sourceは外向き404候補とし、safe category / request IDだけをlogする

### CREATIVE-DATA-001 physical summary

| Item | Proposed decision |
| --- | --- |
| selected model | 1つの`CreativeItem` entity + `MEMO / IDEA / TASK` kind |
| canonical key | `PK=CREATIVE#<creativeItemId>`, `SK=META` |
| list index | existing `ScopeIndex`: `SONG#<songId>` / `CREATIVE#<createdAt>#<creativeItemId>`, sparse `KEYS_ONLY` |
| new table / GSI | none |
| Comment → Task | `COMMENT#<commentId> / CREATIVE_TASK_LINK` guard + transaction。Logical delete後もguard保持 |
| general Comment link | `CREATIVE#<id> / COMMENT_LINK#<commentId>` edge。MVP reverse indexなし |
| conversion | same CreativeItem ID、creator / origin保持、Task-only current fieldsをkindに応じてinitialize / remove |
| Anchor | bounded `originAnchor` + `currentTargetAnchor` maps。Optional、no automatic remap、no index |
| assignee | Band-specific membershipId + internal user locator。Inactive / replaced Membershipはread時にunassigned projection |
| deletion | `ACTIVE / DELETED` logical tombstone、GSI keys remove、relationship / safe history保持。Hard purgeは別Human Gate |
| history | `CREATIVE#id / EVENT#time#eventId` structural events + separate Band AuditEvent。Private text snapshotなし |
| concurrency | integer revision + expectedRevision、conditional transaction、conflictは409 |
| migration trigger | large per-Song count、cross-user/global queries、timeline-window load、reporting / relationship complexity、measured cost / limits |

### Current official references

- [DynamoDB On-Demand capacity mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html)
- [DynamoDB constraints（400 KB item、100 item transaction）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html)
- [Global Secondary Index consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
- [DynamoDB transactions and idempotency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)
- [DynamoDB concurrency patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/BestPractices_ImplementingVersionControl.html)
- [DynamoDB TTL behavior](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [PITR restore behavior](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/pointintimerecovery_restores.html)

公式仕様、quota、priceはresource作成直前に再確認します。

## COLLAB-DATA-001: Activity Status and Notification physical persistence contract

### Status and scope

設計日: 2026-09-15。これはDEC-023と、提案中のDEC-026をCLOUD-DATA-001の既存On-Demand single-tableへ追加する**提案中のdocs-only physical design**です。新table / GSI、DynamoDB resource、runtime、API route、provider、queue / scheduler、AWS、infra、workflow、migrationは作成・変更しません。Human review前のDecision candidateはDEC-027です。

Notificationは制作を促進・評価するworkflowではなく、重要事項と制作contextへ戻るための補助です。Notification生成失敗でComment、Version、CreativeItem等のcanonical mutationを巻き戻さず、READ / expiry / delivery stateでsourceを変更しません。

### Domain separation and item placement

| Record | PK | SK | Core fields | Physical boundary |
| --- | --- | --- | --- | --- |
| Activity Status | `BAND#<bandId>` | `MEMBER_PROFILE#<membershipId>` | `entityType`, `bandId`, `membershipId`, `activityStatus`, `updatedBy`, `updatedAt`, `revision`, `schemaVersion` | BandMembershipとは別item。Absentは`REGULAR`。Role / Membership / assignee / preferenceを変更しない |
| Notification Preference | `USER#<userId>` | `NOTIFICATION_PREFERENCE` | `entityType`, `userId`, `preset`, bounded `overrides`, `policyVersion`, `schemaVersion`, timestamps, `revision` | User-owned application setting。Authorizationには使わない |
| Quiet Hours | `USER#<userId>` | `QUIET_HOURS` | `entityType`, `userId`, `enabled`, `startLocalTime`, `endLocalTime`, `timeZone`, timestamps, `revision`, `schemaVersion` | External delivery timingだけに使用。Membership / accessへ影響しない |
| Notification | `NOTIFICATION#<notificationId>` | `META` | recipient、category / event、source reference、presentation state、timestamps、retention、`revision`, `schemaVersion` | Source entityやAuditEventではない。Center対象だけScopeIndexへ載せる |
| Notification dedup guard | `NOTIFY_EVENT#<sourceEventId>` | `RECIPIENT#<recipientKey>#RELATION#<recipientRelation>` | `notificationId`, `createdAt`, optional retention | 同じserver event / recipient relationのCenter itemを1件へ収束 |
| Delivery tracking | `NOTIFICATION#<notificationId>` | `DELIVERY#<channel>` | `deliveryState`, `deliveryMode`, attempt / schedule / safe failure fields、timestamps、`revision`, retention | External channelごとに1 record。Provider payload / contentを保存しない |

すべてのIDはserver生成のopaque値です。`recipientKey`はinternal `USER#<userId>`を基本とし、未登録invitation deliveryを将来扱う場合だけserver生成の`INVITATION#<opaqueRecipientId>`を使います。Raw emailをPK / SK、dedup key、logへ入れません。Center itemはinternal Userへmap済みの場合だけ作成します。

### Activity Status placement decision

Private Alpha候補は、Activity StatusをBandMembership itemへ埋め込まず、同じBand partitionの`MEMBER_PROFILE#<membershipId>`へ分離します。

| Concern | Membership field | Separate member profile item |
| --- | --- | --- |
| authorization contention | Informational updateでもauthorization recordのrevision / write pathへ触れる | Role / `ACTIVE / REMOVED`のwriteと分離できる |
| lifecycle / history | Rejoinやremove時にauth stateと表示metadataが混ざる | Old membershipIdにhistoryを固定し、new membershipIdへ自動復活させない |
| read pattern | Membership 1 itemで取得できる | Member list後、表示対象profileをbounded `BatchGetItem`する |
| future extension | Profile field増加がsecurity-critical itemを膨らませる | Informational fieldsをprofile item内でboundedに拡張できる |

Absent profileは`REGULAR`として投影し、default itemを一斉生成しません。初回の非default変更は`expectedRevision = 0`と`attribute_not_exists`で作成し、その後`REGULAR`へ戻してもrecordとrevisionは保持します。更新はactor / target Membershipが`ACTIVE`であることをstrong read / transaction conditionで確認しますが、Activity Status変更とMembership role / status変更を同じatomic mutationにはしません。Membership `REMOVED`後もhistorical profileは保持し、authorizationや再参加には使いません。

### Preference and Quiet Hours

Notification Preferenceがない場合、serverはcurrent versioned defaultとして`STANDARD` preset、explicit overrideなしを適用します。Default適用だけで巨大なrecordを作らず、本人が初めて変更したときにcompact itemを作ります。

- `preset = FOCUS | STANDARD | ALL`はbundleの選択だけを保存する
- `overrides`はserver-defined event type / channelごとの、defaultと異なる値だけをbounded mapとして保存する
- Unknown key、重複、unbounded entryを拒否し、DEC-026変更時も`policyVersion / schemaVersion`で解釈を分ける
- Existing explicit overrideをpreset変更で暗黙削除しない。Resetは別の明示operationとする
- Mutable settingはinteger `revision + expectedRevision`で更新し、stale writeは409候補
- Absent defaultからの初回writeは`expectedRevision = 0`と`attribute_not_exists`を要求し、同時初期化をsilent overwriteしない
- Account `SUSPENDED` / `DELETION_PENDING`ではcollaboration preference mutationを停止してrecordを保持し、final account deletion時のcleanup / PII boundaryはAUTH-001へ従う。Band removalでは削除しない

Quiet HoursはPreferenceと別revisionで変更します。Absent itemはdisabledです。`startLocalTime / endLocalTime`は`HH:mm`のlocal wall-clock、`timeZone`はIANA timezone IDを保存し、UTCへ固定変換した時刻だけを正にしません。Enabled時はstartとendを異なる値とし、`start > end`を日跨ぎrangeとして扱います。DST / timezone変更時は保存したtimezone rulesで次のboundaryを再計算し、元のlocal timeを保持します。SECURITYはbypassし、DIRECT / ORDINARYだけをhold / catch-up候補にします。

### Notification canonical item and ScopeIndex

Notification canonical itemの主要fieldは次です。

- `notificationId`, `recipientUserId`, `category = SECURITY | DIRECT | ORDINARY`, `eventType`
- `sourceEventId`, `sourceType`, opaque `sourceId`, `recipientRelation`, `occurredAt`, `createdAt`
- Band-scopedの場合だけ`bandId`, `recipientMembershipId`
- `readState = UNREAD | READ`, optional `readAt`, integer `revision`
- Non-security retention用`expiresAt`とDynamoDB TTL attribute候補`ttlEpochSeconds`
- `GSI1PK = USER#<recipientUserId>`
- `GSI1SK = NOTIFICATION#<occurredAt>#<notificationId>`

既存sparse `ScopeIndex`を`KEYS_ONLY`のまま再利用し、新GSIを追加しません。Sort keyへread stateを入れないため、READ変更でGSI keyを書き換えず、安定したnewest-first cursorを維持します。

- 「すべて」はScopeIndexをdescending Queryし、canonical Notificationを`BatchGetItem`する
- 「未読」は同じQuery結果のcanonical `readState`をbounded filterする。初期候補は50 candidates/page、最大5 page / 250 candidatesで一度応答し、続きはopaque cursorで取得する
- 「要対応」は保存済みbooleanをworkflowの正にせず、eligible candidateのcanonical source stateからderiveする
- ScopeIndexはeventual consistencyなので、mark-read直後はcommand responseを画面へ反映し、次回Query候補もcanonical itemを再確認する
- `Scan`、unread専用GSI、category / Band / status別GSIはPrivate Alphaでは追加しない

User単位で90日内のNotificationが増え、unread / action-requiredで5 pageのbounded filterを常時使い切る、latency / read costが目標を外れる、または複数Band横断の高頻度Centerが必要になった場合だけ、read-state projection / dedicated sparse indexを別Decisionとして再評価します。

### Source reference and authorization

Notificationにはsourceのprivate本文を複製せず、次だけを保持します。

- server-generated opaque `sourceEventId`
- server-defined `sourceType`とopaque `sourceId`
- Band-scoped filtering用の`bandId / recipientMembershipId`
- server-defined `recipientRelation`
- `occurredAt`

Comment / Creative body、lyrics、Song title、filename、presigned URL、S3 key、Cognito token、session ID、credential、raw provider payload、不要なemailは保存しません。`actionRequired`はsnapshotを正にせず、canonical Invitation / Task / Proposal等からderiveします。Sourceが削除・非表示ならgeneric unavailable projectionだけを返します。

Center listはNotification ownershipを確認した後、Band-scoped candidateごとに`BAND#<bandId> / MEMBERSHIP#<recipientUserId>`をstrong `BatchGetItem`し、取得したitemが現在`ACTIVE`かつその`membershipId`がstored `recipientMembershipId`と一致する場合だけ表示します。Deep linkではさらにcanonical source → stored Band → strong ACTIVE Membership → capabilityを再実行します。Notification ID、GSI result、old URL、過去の別Membershipはaccess proofではありません。

### Deduplication and idempotency

Canonical commandの`clientOperationId`を扱う既存Idempotency recordと、Notification dedup guardは別責務です。

- Command idempotencyはcanonical mutation自体のduplicateを防ぐ
- Notification guardは成功済みcanonical mutationから生成された同じ`sourceEventId + recipientKey + recipientRelation`のCenter duplicateを防ぐ
- `sourceEventId`、category、recipient relationはserverがcanonical resultから発行し、client入力を信用しない
- Retryで同じIDを再利用できるよう、idempotent commandは既存Idempotency resultへsafe `sourceEventId`を保持し、revisioned mutationはcommitted resource ID + resulting revision + event typeからserver-sideでstable opaque IDを導出する候補とする。Private inputをIDやlogへ含めず、exact algorithmはruntime gateで固定する
- Notification Putと`attribute_not_exists`付きguard Putは小さな`TransactWriteItems`にまとめ、片方だけを残さない
- Same guard retryはstored `notificationId`へ収束し、別Notificationを作らない
- Guard retentionは対応Notification以上とし、TTL lag中もapplicationの`expiresAt`判定後に同じ古いeventを復活させない
- Guardをphysical deleteした後のold event replayは、serverが`occurredAt`をretention windowと照合して拒否し、期限切れNotificationを再生成しない

Canonical source mutation、Notification作成、external delivery schedulingを一つの巨大transactionへ入れません。DIRECT / ORDINARYのNotification生成やdeliveryが失敗しても、Comment、Version、CreativeItem等の制作mutationは成功を維持します。Stable event handoff / outbox / repair mechanismとSECURITY eventのfail-closed要件はruntime reliability taskで決め、通知を理由に制作をblockしない原則を崩しません。

### Delivery tracking

External deliveryは`notificationId + channel`で1 logical recordとし、retryでNotificationやdelivery recordを増やしません。

| Field / state | Contract |
| --- | --- |
| `deliveryState` | `QUEUED | ATTEMPTING | RETRY_WAIT | ACCEPTED | FAILED_PERMANENT | CANCELED`。`ACCEPTED`はprovider受付であり、end-device delivery保証ではない |
| scheduling | `deliveryMode`, `scheduledFor`, optional `nextAttemptAt`, `preferenceRevisionUsed`, `policyVersion` |
| attempts | `attemptCount`, `lastAttemptAt`, `acceptedAt?`, `lastSafeErrorCategory?`。最大5回候補、jitter付きexponential backoff |
| concurrency | `revision + expectedRevision`とallowed transition condition。Terminal stateからのblind retryを拒否 |
| privacy | Notification本文、private source、provider request / responseを保存しない。Provider message IDは既定で保存しない |
| retention | Non-securityは親Notificationの`expiresAt / ttlEpochSeconds`に合わせる。Expired / removed recipientはsend前に`CANCELED`へ進める候補 |

Provider webhook相関にprovider receipt IDが不可欠と確認された場合だけ、opaque最小reference、access、encryption、retentionをprovider Human Gateで追加します。Queue、scheduler、DLQ、providerが未選定のため、`nextAttemptAt`検索用GSIは追加しません。DynamoDBをretry queueの正にする要件が確定した場合は、access patternとwrite amplificationを示す別Decisionが必要です。

Digestはdelivery layerでrecipient + channel + delivery windowを単位にgroupし、Notification canonical itemsをsourceとして参照します。Same Song / threadのORDINARY summaryはまとめられますが、DIRECT logical targetとSECURITY eventをcollapseで失いません。Digestが0件なら送信せず、送信直前にexpiry、account state、Membership、current preference、Quiet Hoursを再評価します。

### Access-pattern matrix

| # | Access pattern | Operation / key | Consistency / authorization | Pagination / count |
| --- | --- | --- | --- | --- |
| 1 | Get / update Activity Status | `GetItem(BAND#id, MEMBER_PROFILE#membershipId)`、conditional Put / Update | Actor / target Membershipはstrong。Profileはeventual表示可 | 1 profile |
| 2 | Get Preference + Quiet Hours | `BatchGet(USER#id, NOTIFICATION_PREFERENCE / QUIET_HOURS)` | User ownership。Absent defaultをserver適用 | 最大2 items |
| 3 | Update Preference / Quiet Hours | conditional Put / Update | `revision = expectedRevision`。Authorizationとは分離 | 1 item |
| 4 | List Center newest-first | `Query ScopeIndex(USER#id, begins_with(NOTIFICATION#))` → canonical BatchGet | GSI eventual。User ownership + Band membership filter | 50 candidates/page + opaque cursor |
| 5 | List UNREAD / action candidates | #4を最大5 pageまでbounded filter | Canonical read state / source stateを確認 | 最大250 candidates/response |
| 6 | Get / mark READ | `GetItem(NOTIFICATION#id, META)` + conditional Update | Strong Get、recipient一致、revision / current state | 1 item。Source mutationなし |
| 7 | Dedup Notification | `Get/TransactWrite(NOTIFY_EVENT#event, RECIPIENT#...#RELATION#...)` | Server event identityのみ | 1 guard + 1 Notification |
| 8 | Read / update delivery | `Get/Update(NOTIFICATION#id, DELIVERY#channel)` | Worker identity + state / revision condition | Channelごと1 item |
| 9 | Filter removed member | `BAND#bandId / MEMBERSHIP#recipientUserId`をstrong BatchGetし、stored membershipIdと比較 | Current same membershipIdが`ACTIVE`の場合だけ表示 / send | Page内unique Membershipだけ |
| 10 | Handle expiry / TTL lag | Canonical `expiresAt`をread時に評価 | TTL delete完了をprivacy / accessに使わない | Expired candidateを除外してcursor継続 |

### Transaction and consistency matrix

| Operation | Atomic boundary | Failure policy |
| --- | --- | --- |
| Change Activity Status | ACTIVE Membership ConditionCheck + profile Put / Update、expected revision | Conflictは409。Role / Membership / preferenceを変更しない |
| Change Preference | 1 item conditional Put / Update | Stale revisionは409。Notificationやsourceへcascadeしない |
| Change Quiet Hours | 1 item conditional Put / Update | Invalid local time / timezoneは422。Delivery timingだけへ反映 |
| Create Notification | canonical mutation成功後、Notification + dedup guardのsmall transaction | DIRECT / ORDINARY失敗でcanonical workをrollbackしない。Retryはsame sourceEventIdへ収束 |
| Mark READ | Notification METAのconditional Update | Source / action-required business stateを変更しない |
| Create delivery record | `attribute_not_exists`付きchannel record Put | Existing recordへ収束。Notification duplicateを作らない |
| Retry / accept / fail delivery | allowed current state + expected revisionのconditional Update | 最大5回候補。Permanent errorはchannel停止、別channelへ無断fallbackしない |
| Remove Membership | Existing Membership mutation + Auditを正とし、Notification一括cleanupを含めない | Access / send時のstrong checkで即deny。Cleanup失敗でremoveをblockしない |

DynamoDB transactionの100 unique item / 4 MB制限を維持し、recipient全員分のNotificationをsource mutation transactionへ詰め込みません。GSI listはeventualでよい一方、Membership removal、deep-link source access、mark-read ownership、protected mutationはbase itemをstrong readします。

### TTL, recovery, and retention

Non-securityの`DIRECT / ORDINARY` Center itemとdelivery trackingは、`occurredAt`から90日後を`expiresAt`とする初期候補です。`ttlEpochSeconds`はDynamoDB TTL用のepoch secondsですが、TTL deleteは即時保証ではなく期限後も残り得ます。API / UIはserver timeで`expiresAt <= now`をlogical expiryとして非表示・配送停止し、physical deleteを待ちません。

- Notification TTLはComment、CreativeItem、Version、Proposal、Invitation、Membership history等のsourceへcascadeしない
- SECURITY Notificationには90日TTLを自動設定せず、retention / access / deletionを別Human Gateで決める
- AuditEvent、canonical source、Membership historyをNotification TTLへ含めない
- PITR restoreではexpired itemが復元され得るため、restore後も`expiresAt` filter、Membership check、source authorizationを再適用する
- Restored tableのTTL / PITR / GSI等はCLOUD-DATA-001のrestore runbookどおり再確認し、Notification復元だけでsource accessを復活させない

### Cost, scale, and reconsideration

On-Demand single-tableを維持します。追加billing driverはActivity / Preference / QuietHours items、Notification + dedup + delivery items、ScopeIndex key write / storage、transaction write、BatchGet、retry state update、PITR / restore、TTL lag中storageです。新GSIは作らないためindex resourceは増えませんが、Centerへ載せるNotificationごとにexisting ScopeIndexのwrite / storage amplificationが1件発生します。External channelが増えるとdelivery child itemもchannel数に比例します。

2 users / 1 private Bandではbounded filterとBatchGetを優先し、高scale用read modelを先に作りません。次の場合はseparate projection / GSI / queue-backed retry index / PostgreSQLを別reviewします。

- Userあたり90日Notificationが増え、5 page / 250 candidate filterを継続的に使い切る
- Unread、action-required、delivery due検索が実測latency / cost目標を外れる
- Multi-Band / many-user fan-out、high-volume digest、provider webhook reconciliationが必要になる
- Dedup / delivery child growth、hot partition、400 KB item、100-item transaction、PITR costが問題になる

### COLLAB-DATA-001 physical summary

| Item | Proposed decision |
| --- | --- |
| Table / capacity | Existing `streamband-<environment>-metadata` On-Demand single-table |
| Activity Status | `BAND#bandId / MEMBER_PROFILE#membershipId` separate item。Absent=`REGULAR` |
| Preference | `USER#userId / NOTIFICATION_PREFERENCE`、absent=`STANDARD` + no overrides |
| Quiet Hours | `USER#userId / QUIET_HOURS`、IANA timezone + local start/end、separate revision |
| Notification | `NOTIFICATION#notificationId / META` canonical item |
| Center index | Existing sparse `ScopeIndex`: `USER#userId / NOTIFICATION#occurredAt#notificationId`, `KEYS_ONLY` |
| New GSI / table | none |
| Dedup | Server `sourceEventId + recipientKey + recipientRelation` guard + atomic Notification Put |
| Delivery | `NOTIFICATION#id / DELIVERY#channel`、one logical record per channel、max 5 retry candidate |
| Read state | Canonical mutable `UNREAD / READ`; SK / GSI keyへ入れない |
| Membership removal | No fan-out delete。List / send / deep linkでcurrent same Membershipをstrong check |
| Retention | Non-security DIRECT / ORDINARYは90日logical expiry + TTL候補。SECURITY / Auditは別gate |
| Reliability | Canonical creative mutationをNotification failureでrollbackしない。SECURITY reliability / outboxは別gate |

### Remaining implementation gates

- DEC-026 / DEC-027 Human review、runtime DTO / validation、API、migration、DynamoDB / TTL / PITR resource
- Stable event handoff / outbox / repair、queue / scheduler / DLQ、digest aggregation、delivery due lookup
- Provider selection、provider receipt / bounce / complaint、security retention、mobile push token
- Formal invitationの未登録recipient persistence、account deletion cleanup、Activity Status moderation capability
- Measured page / item / retry limitとobservability、restore drill、cost recheck

## 開発運用

- 永続化を始めてもlocalStorageやcookieを共同制作dataの正にしない
- mock、test、production dataを分離し、実dataやcredentialをfixtureへ入れない
- DB/API/Auth/AWSの変更は領域ごとのlockと専用task/PRで行う
- `main`へ直接pushせず、1 task = 1 branch = 1 PRと`Quality checks`を維持する
- migrationはforward/rollback、backup、data loss riskをreviewし、UI taskへ混ぜない

## CLOUD-DATA-001後の未確定事項

- DynamoDB table resource、IAM、repository implementation、migration toolの実装
- Auth provider、session、招待、capability policyの実装mapping
- opaque stable IDの具体形式、slug変更/redirect
- Song status、Review status、Proposal status、Decision statusの正式な遷移
- CreativeItem physical contractはCREATIVE-DATA-001 / DEC-025でsingle entity、既存ScopeIndex、relationship guard / edge、structural historyをdocs-only designとして承認済み。Runtime schema / migration / resource実装は未着手
- Activity Status、NotificationPreference、QuietHours、Notification / delivery trackingのphysical contractはCOLLAB-DATA-001 / DEC-027で提案中。Runtime schema、resource、migration、provider / queue、security retentionは未着手
- Version label unique、branch/派生versionの扱い
- Comment anchorのPPQ、拍子変更、timeとの同期、version間引き継ぎ
- Track/Partの自由入力、複数担当、DAW trackとの対応範囲
- STORAGE-001-DESIGN contractをS3 / IAM / APIへ実装する方法、Private Alphaのencryption / retention再承認、scan / multipart導入条件
- AuditEventの正式保持期間、閲覧権限、privacy dataの扱い
- Presence/Call/Bridgeを採用するか、採用時のprotocolとdata保持
- restore cutover、disaster recovery、account/Bandのlegal deletion手順

これらは候補のままとし、証拠のない採用決定や実装予定日を記録しません。
