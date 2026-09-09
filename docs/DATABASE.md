# Data Model Review

## この文書の位置づけ

この文書は、DATA-001で確認したPhase 1のmock dataと、Phase 2以降のcloud data model候補を分けて記録します。将来のDB/API実装に向けたレビュー資料であり、DB製品、ORM、table名、column、constraint、AWS/S3、認証方式の採用決定ではありません。

現在の正は `src/lib/mock-data.ts` と実際の画面です。以下のPhase 2案はすべて `候補` で、実装、migration、seed、実data投入、file uploadは行っていません。

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
| Asset | Audio Preview、Stem、MIDI、Referenceのfile metadata | `id`, `bandId`, `songId`, `songVersionId?`, `songTrackId?`, `kind`, `storageObjectKey`, `originalName`, `mimeType`, `sizeBytes`, `checksum`, `state`, `createdBy`, `createdAt`, `deletedAt?` |
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
| Membership role | `owner`, `manager`, `contributor`, `viewer` | musical partと分離。操作matrixはCORE-004で決める |
| Membership status | `invited`, `active`, `suspended`, `left` | invite/退会仕様と同時に確定する |
| Part code | `vocal`, `guitar`, `bass`, `drums`, `keyboard`, `other`, `all` | 初期UI候補。複数partと自由labelを許容するか未決定 |
| Track type | `audio`, `midi`, `reference`, `guide`, `other` | DAW trackの完全再現には使わない |
| Asset kind | `audio_preview`, `audio_stem`, `midi_source`, `midi_proposal`, `reference` | PreviewとStem、元MIDIとproposalを区別する |
| Asset state | `pending`, `available`, `quarantined`, `failed`, `deleted` | upload検査方式の決定後に確定する |
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

## 開発運用

- 永続化を始めてもlocalStorageやcookieを共同制作dataの正にしない
- mock、test、production dataを分離し、実dataやcredentialをfixtureへ入れない
- DB/API/Auth/AWSの変更は領域ごとのlockと専用task/PRで行う
- `main`へ直接pushせず、1 task = 1 branch = 1 PRと`Quality checks`を維持する
- migrationはforward/rollback、backup、data loss riskをreviewし、UI taskへ混ぜない

## 未確定事項

- DB製品、ORM、migration tool、hosting先
- Auth provider、session、招待、Membership roleと権限matrix
- stable IDとslug形式、slug変更/redirect
- Song status、Review status、Proposal status、Decision statusの正式な遷移
- Memoを1件にするかcategory別・revision別にするか
- Version sequence、label unique、branch/派生versionの扱い
- Comment anchorのPPQ、拍子変更、timeとの同期、version間引き継ぎ
- Track/Partの自由入力、複数担当、DAW trackとの対応範囲
- object storage provider、region、暗号化、scan、容量、format、保持、削除、費用上限
- audit logの保持期間、閲覧権限、privacy dataの扱い
- Presence/Call/Bridgeを採用するか、採用時のprotocolとdata保持
- backup、restore、disaster recovery、account/Band削除手順

これらは候補のままとし、証拠のない採用決定や実装予定日を記録しません。
