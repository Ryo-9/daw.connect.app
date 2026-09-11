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
                                  |       `--< Task
                                  `--< AuditEvent
```

- Bandはdata isolationとauthorizationの基本単位にする候補
- SongVersionはSongに従属し、別SongのAssetやCommentを参照できないconstraintが必要
- MidiProposalの`sourceMidiAssetId`と`proposalAssetId`は別IDとし、source objectを上書きしない
- CommentAnchorでtime/bar/beat/trackを使う場合は、対象SongVersionを必須にする候補
- Taskの担当はUser IDではなく、対象Band内のMembership IDを参照する候補

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
| Task status | `todo`, `in_progress`, `completed`, `cancelled` | 現在の3状態とのmappingを定義する |
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

この選択はphysical designのreview案であり、table、PITR、index、TTL、alarm、IAM、APIはまだ作成していません。CLOUD-003C actual bootstrapも別Human Gateのままです。

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

`SongMemo`、`Task`、`SongPart`、`SongTrack`の独立entity、`ReviewRequest` / `ReviewResponse`、formal invitation、notification、search projection、Presence / Call、DAW Bridgeは最初のsliceでは永続化をDEFERします。Commentのpart / track文脈は当面optionalな安定codeとしてAnchorに保持し、独立SongTrackが必要になった時に専用migrationを行います。Stemは`Asset.kind`で表現可能にしますが、最初のupload workflow必須にはしません。

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

### Current official references

- [DynamoDB On-Demand capacity mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html)
- [DynamoDB constraints（400 KB item、100 item transaction）](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html)
- [Global Secondary Index consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html)
- [DynamoDB transactions and idempotency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html)
- [DynamoDB concurrency patterns](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/BestPractices_ImplementingVersionControl.html)
- [DynamoDB TTL behavior](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [PITR restore behavior](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/pointintimerecovery_restores.html)

公式仕様、quota、priceはresource作成直前に再確認します。

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
- Memoを1件にするかcategory別・revision別にするか
- Version label unique、branch/派生versionの扱い
- Comment anchorのPPQ、拍子変更、timeとの同期、version間引き継ぎ
- Track/Partの自由入力、複数担当、DAW trackとの対応範囲
- STORAGE-001-DESIGN contractをS3 / IAM / APIへ実装する方法、Private Alphaのencryption / retention再承認、scan / multipart導入条件
- AuditEventの正式保持期間、閲覧権限、privacy dataの扱い
- Presence/Call/Bridgeを採用するか、採用時のprotocolとdata保持
- restore cutover、disaster recovery、account/Bandのlegal deletion手順

これらは候補のままとし、証拠のない採用決定や実装予定日を記録しません。
