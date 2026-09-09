# API Notes

## 重要

この文書は将来必要になりそうな API の候補です。エンドポイント、方式、入出力は未確定であり、今回は API の実装、外部公開、認証接続を行いません。Next.js Route Handlers、Server Actions、別バックエンドのどれを採用するかも未決定です。

## 共通方針の候補

- すべての非公開操作で認証とバンド所属をサーバー側で確認する
- 作成・更新・削除は、操作ごとの権限を確認する
- 入力値は型だけでなく実行時にも検証する
- 内部エラー、秘密情報、他ユーザーの存在を不用意に返さない
- 一覧はページング、並び替え、上限を設ける
- 同じリクエストの再送、競合更新、二重投稿を考慮する
- 破壊的操作には確認、監査、必要に応じた再認証を検討する
- API のバージョン方針と廃止手順を公開前に決める

## 将来の API 案

表記は検討用の REST 風の例であり、採用決定ではありません。

### セッション / ユーザー

- `GET /api/me`: 現在のユーザーと基本設定を取得
- `PATCH /api/me`: 表示名など許可されたプロフィールを更新
- `DELETE /api/me`: 退会要求（即時削除か猶予期間かは未決定）

ログイン、ログアウト、メール確認、再設定は、採用する認証サービスの安全な標準機能を優先して検討します。

### バンド

- `GET /api/bands`: 参加中のバンド一覧
- `POST /api/bands`: バンド作成
- `GET /api/bands/{bandId}`: バンド詳細
- `PATCH /api/bands/{bandId}`: バンド基本情報の更新
- `DELETE /api/bands/{bandId}`: バンドのアーカイブまたは削除

### メンバー / 招待

- `GET /api/bands/{bandId}/members`: メンバー一覧
- `POST /api/bands/{bandId}/invitations`: 招待作成
- `GET /api/invitations/{token}`: 招待内容の安全な確認
- `POST /api/invitations/{token}/accept`: 招待承認
- `POST /api/invitations/{token}/decline`: 招待辞退
- `PATCH /api/bands/{bandId}/members/{memberId}`: ロール変更
- `DELETE /api/bands/{bandId}/members/{memberId}`: メンバー削除または退出

招待トークンの失効、期限、推測耐性、再利用防止を必須要件にします。

### 楽曲 / メモ

- `GET /api/bands/{bandId}/songs`: 楽曲一覧
- `POST /api/bands/{bandId}/songs`: 楽曲作成
- `GET /api/songs/{songId}`: 楽曲詳細
- `PATCH /api/songs/{songId}`: 楽曲更新
- `DELETE /api/songs/{songId}`: 楽曲のアーカイブまたは削除
- `GET /api/songs/{songId}/note`: メモ取得
- `PUT /api/songs/{songId}/note`: メモ作成・更新

### 楽曲バージョン

- `GET /api/songs/{songId}/versions`: バージョン一覧
- `POST /api/songs/{songId}/versions`: バージョン作成
- `GET /api/song-versions/{versionId}`: バージョン詳細
- `PATCH /api/song-versions/{versionId}`: 説明などの更新

### コメント

- `GET /api/songs/{songId}/comments`: コメント一覧
- `POST /api/songs/{songId}/comments`: 通常 / タイムスタンプコメント作成
- `PATCH /api/comments/{commentId}`: 自分のコメント更新など
- `DELETE /api/comments/{commentId}`: コメント削除

作成入力の候補: `body`、`songVersionId`、`timestampMs`、`parentCommentId`。組み合わせと範囲をサーバー側で検証します。

### TODO

- `GET /api/songs/{songId}/tasks`: TODO 一覧
- `POST /api/songs/{songId}/tasks`: TODO 作成
- `GET /api/tasks/{taskId}`: TODO 詳細
- `PATCH /api/tasks/{taskId}`: 担当者、状態、期限などを更新
- `DELETE /api/tasks/{taskId}`: TODO 削除
- `GET /api/me/tasks`: 自分の TODO 一覧

### ファイル

- `GET /api/songs/{songId}/files`: ファイルメタデータ一覧
- `POST /api/songs/{songId}/files/upload-request`: 許可されたアップロード要求を作る
- `POST /api/files/{fileId}/complete`: 完了後の検証を要求する
- `GET /api/files/{fileId}/download`: 権限確認後に短時間有効な取得手段を返す
- `DELETE /api/files/{fileId}`: ファイル削除要求

ファイル API はストレージ方式、容量制限、許可形式、署名 URL、検査、削除、費用対策を設計した後に実装します。

## 応答とエラーの案

- 成功時のデータ形式を機能間で揃える
- 入力エラーは項目ごとに UI が表示できる形式にする
- `401` は未認証、`403` は権限不足、`404` は対象なしを基本候補とする
- 情報漏えいにつながる場合は、権限不足と対象なしの見せ方を統一する
- 競合更新は `409` などで明示する案を検討する
- サーバーエラーには利用者向けメッセージと追跡用 ID を返し、詳細は安全なログに限定する

## DATA-002: Core Collaboration Boundary Draft

### この草案の位置づけ

この章は、DATA-001のdata model候補とFLOW-001のreview flowを、将来のserver contract候補へ落とし込むための設計資料です。REST風URLとJSONは会話用の例であり、Next.js Route Handlers、Server Actions、別Backend/APIの採用決定ではありません。DB、ORM、Auth、object storage、AWS/S3も未決定・未実装です。

境界の目的は、UIの表示やTypeScript型を信用境界にせず、次をserver側で一貫して行えるようにすることです。

1. 認証済みactorと対象Band Membershipを解決する
2. operationごとのpermissionとresource ownershipを確認する
3. 入力、entity間の関係、現在state、許可された遷移をruntimeで検証する
4. retryと同時更新を検出し、重複やsilent overwriteを防ぐ
5. serverがauthor、時刻、revision、audit用request IDを決める
6. clientへ必要な結果だけを返し、private resourceや内部情報を漏らさない

### 用語とcontract共通規則

- `Song`は楽曲の基本情報、`SongVersion`は特定時点のreview単位とし、同一entityにしない
- `MidiProposal`は特定Versionのsource MIDIに対する別案で、source Assetを更新しない
- `Comment`本文と`CommentAnchor`の位置情報を分け、位置付きCommentでは対象Versionを必須候補にする
- actor ID、`createdAt`、`updatedAt`、`decidedAt`はclient入力から採用せずserverで設定する
- URLのslugや画面表示labelを内部参照IDとして信用しない
- mutationは`clientOperationId`、更新系は`expectedRevision`を受ける候補とする
- responseへprivate object key、credential、長期URL、stack trace、他Bandの存在情報を含めない
- enum、文字数、role名、保存技術はこの草案だけで確定しない

### Core operation table

Actor欄のcapability名とREST風URLは候補です。正式なrole / permission matrixはCORE-004等の専用判断で確定します。

| Operation | REST風候補 | Actor候補 | 主なinput | Server checks | Mutation候補 | Response候補 | 主な競合risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create Song | `POST /api/bands/{bandId}/songs` | `song:create` capability | Song field、initial Version metadata、`clientOperationId` | auth、membership、permission、Band、field、重複 | Song + initial SongVersionをatomicに作成する候補 | Song summary + initial Version | 二重送信、slug/label重複 |
| Update Song | `PATCH /api/songs/{songId}` | `song:update` capability | patch field、`expectedRevision` | auth、membership、ownership、field、revision | Song metadataのみ更新 | updated Song + revision | stale write、同時編集 |
| Create Version | `POST /api/songs/{songId}/versions` | `version:create` capability | label、note、base Version、verified Asset ID、`clientOperationId` | ownership、Asset readiness、base、revision、label | SongVersion作成とAsset関連付け | Version summary | 二重作成、stale base、partial upload |
| Create Comment | `POST /api/songs/{songId}/comments` | `comment:create` capability | Version ID、body、type、anchor、`clientOperationId` | Version / Track ownership、anchor、field | Comment + optional CommentAnchor | Comment view | 二重投稿、Version mismatch |
| Create MIDI Proposal | `POST /api/songs/{songId}/midi-proposals` | `proposal:create` capability | source Version / MIDI Asset、proposal Asset、summary、`clientOperationId` | source/proposal ownership、kind、readiness | separate MidiProposal作成 | Proposal summary | 二重作成、source差替え |
| Decide Proposal | `POST /api/midi-proposals/{proposalId}/decisions` | `proposal:decide` capability | decision、note、partial detail、`expectedRevision`、`clientOperationId` | current state、permission、revision、transition | Decision/Review record追加 + summary state更新候補 | Decision + current review state | 相反判断、二重決定 |
| Upload Request | `POST /api/songs/{songId}/assets/upload-requests` | Asset種別に応じたcreate capability | kind、name、declared MIME、size、checksum、target refs、`clientOperationId` | permission、quota、kind、size、target ownership | pending Asset / upload intent候補 | short-lived upload instruction | retry、orphan intent |
| Upload Complete | `POST /api/assets/{assetId}/complete` | upload owner + capability | checksum等、`clientOperationId` | object存在、owner、size、detected MIME、state | Assetをverified / failed等へ遷移 | sanitized Asset metadata | 二重complete、不完全object |
| Asset Access | `GET /api/assets/{assetId}/access` | `asset:read` capability | Asset ID | auth、membership、ownership、Asset state | 原則なし。access audit候補 | short-lived access instructionまたはstream | membership変更、期限切れ |
| Core Read | `GET /api/songs/{songId}`等 | resource read capability | ID、pagination / include候補 | auth、membership、ownership、limit | なし | bounded page projection | stale表示、過剰取得 |

## Write boundaries

### Song create

現在の`SongFormDraft`には、`title`、`status`、`bpm`、`timeSignature`、`musicalKey`、`daw`、`versionName`、`versionNote`、`description`、`parts`があります。`bandName`は表示用のread-only値で、requestではURLまたは別のtrusted contextから解決したBand IDと照合します。Audio/MIDIは現在placeholderだけで、create inputへbinaryや偽のfile IDを含めません。

#### request候補

```json
{
  "song": {
    "title": "Afterglow",
    "status": "in_progress",
    "bpm": 118,
    "timeSignature": "4/4",
    "musicalKey": "A minor",
    "dawName": "Studio One",
    "description": "余韻の残るギターを軸にする",
    "partCodes": ["vocal", "guitar", "bass", "drums"]
  },
  "initialVersion": {
    "label": "v0.1",
    "note": "最初の構成確認"
  },
  "clientOperationId": "opaque-client-operation-id"
}
```

#### transaction的commandとseparate requestの比較

| 案 | 利点 | risk |
| --- | --- | --- |
| Songとinitial Versionを1 command / 1 transactionで作る | formの意図と一致し、VersionなしSongや二重初期Versionを避けやすい | commandが複合的になり、初期Version不要のuse caseへ合わせにくい |
| Song作成後にVersionを別requestで作る | resource単位が単純で、Version作成を共通化しやすい | 途中失敗でVersionなしSongが残り、retry時に重複しやすい |

Phase 2 MVPの推奨候補は、Song metadataとinitial Version metadataを1つのapplication commandとして受け、server transaction内で両方を作る方式です。HTTP endpointを1つにするか、Server Action等でcommandを表すかは未決定です。file uploadはこのtransactionへ含めず、別のverified Asset flowへ分けます。

`parts`は現在のformでは担当表示ですが、mock側ではTaskから導出され、SongPartとの意味が確定していません。create時の`partCodes`採用と、担当者・Task・Trackを同時作成するかはTBDとし、暗黙に複数entityを作りません。

### Song update

Song updateは楽曲基本情報だけを変更し、Version label / note、Asset、Proposal、Comment、Taskを同時更新しません。特にedit formの`versionName` / `versionNote`をSong patchへ混ぜず、新Version作成またはVersion metadata専用境界へ分離します。

```json
{
  "patch": {
    "title": "Afterglow",
    "status": "in_progress",
    "bpm": 128,
    "timeSignature": "4/4",
    "musicalKey": "D major",
    "dawName": "Studio One",
    "description": "サビの広がりを再確認"
  },
  "expectedRevision": 7
}
```

server validation候補:

- actorのauthentication、active Band Membership、`song:update` capability
- Songが解決したBandに属し、archived / deleted状態でないこと
- allowlistされたfieldだけを受け、unknown fieldを拒否または明示的に無視する方針を統一すること
- `title`はtrim後必須。最大長は実装前に確定すること
- `bpm`は整数候補で、現在formに合わせる初期範囲候補は`40..240`
- `timeSignature`は構文だけでなく許可meterを検証すること。現在formは`4/4`、`3/4`、`6/8`、`5/4`
- status、musical key、DAW名は安定code / allowlist / custom value方針を先に決めること
- `null`（値を消す）、空文字、field省略（変更しない）を区別すること
- `expectedRevision`がcurrent revisionと一致しない場合は`409 CONFLICT`
- clientがauthor、Band ID、`updatedAt`、revisionの次値を決めないこと

### Version create

Version createはProposal decisionの副作用にしません。正しい境界は次のとおりです。

```text
Proposal review / Decision
→ Composer reflects the decision in the DAW
→ New Preview / MIDI export
→ private upload and server verification
→ explicit Version create/finalize command
```

```json
{
  "label": "v0.9",
  "note": "サビ上声案の一部をDAWで反映",
  "basedOnVersionId": "version_previous",
  "assetIds": ["asset_preview_verified", "asset_midi_verified"],
  "dawSource": {
    "dawName": "Studio One",
    "projectFingerprint": "optional-opaque-reference"
  },
  "expectedSongRevision": 7,
  "clientOperationId": "opaque-client-operation-id"
}
```

- `songId`はpath / command contextから解決し、payloadとの二重指定を避ける候補
- `createdBy`と`createdAt`はserverが設定する
- `basedOnVersionId`は同じSongのVersionであることを確認する
- すべてのAssetが同じBand / Songに属し、`available`相当の検証済みstateであることを確認する
- Audio Previewを必須にするか、MIDIだけのVersionを許可するかはTBD
- label重複、current Version更新rule、branch / 派生Versionの扱いはTBD
- transaction内でVersion作成、Asset関連付け、Songのcurrent Version pointer候補、audit eventを一貫して更新する
- Proposal IDを参考情報として記録する場合も、Accept済みProposalからVersionを自動生成しない

### Comment create

位置付きCommentはSongだけでなく対象SongVersionを明示し、Comment本文とCommentAnchorを一つのcommandとして検証・保存する候補です。authorと時刻はserverが設定します。

```json
{
  "songVersionId": "version_v08",
  "body": "Bassを少し前に出したい",
  "commentType": "review_feedback",
  "anchor": {
    "anchorType": "musical_position",
    "bar": 37,
    "beat": 2,
    "timeMs": 84000,
    "songTrackId": "track_bass"
  },
  "clientOperationId": "opaque-client-operation-id"
}
```

- 現在UIの本文上限`280`文字をPhase 2初期候補として検討するが、正式上限は未決定
- `commentType`候補はDATA-001の`discussion | review_feedback | decision_reference`
- anchorなしのSong全体Commentは許可候補だが、位置付きCommentと同じ曖昧なpayloadにしない
- replyを追加する場合、`parentCommentId`が同じSong / Version contextに属するか検証する
- UIの表示名、`MM:SS`文字列、author IDをそのまま保存値として信用しない
- `authorId`、`createdAt`、Commentの初期`state`はserverが決定する。編集済み・解決済み・削除済みなどのstate modelは未決定

### Comment Anchor validation

| input pattern | candidate handling |
| --- | --- |
| anchorなし | Song全体Commentとして許可候補。`songVersionId`を必須にするかはComment typeごとに確定する |
| timeのみ | `timeMs >= 0`かつ対象Versionのduration内を候補。位置付きCommentなのでVersion必須 |
| barのみ | 許可する場合もVersion必須。beat省略時を小節先頭とみなすかTBD |
| bar + beat | 1始まりの正数。beatは対象位置の拍子範囲内。拍子変更があるVersionではtempo / meter mapが必要 |
| time + track | Version必須。Trackが同じSongに属し、対象Versionで参照可能か確認する |
| time + bar / beat | 両表現の正を決め、矛盾時は`422 ANCHOR_MISMATCH`候補で拒否する |
| trackのみ | Track全体Commentとして許可するかTBD。許可する場合もSong / Version ownershipを検証する |

共通validation:

- `songVersionId`はpathのSongに属し、別Song / 別BandのVersionを拒否する
- archived / deleted / access不能Versionへの新規Comment可否をstate policyで決める。既定候補は新規作成不可
- `songTrackId`は同じSongに属するstable IDを使い、表示名やDAW track番号をkeyにしない
- `timeMs`は負数、小数、上限超過を拒否し、単位をmillisecondに固定する候補
- `bar` / `beat`は整数候補。tickやPPQ、拍子変更、timeとの変換は未決定
- Versionが違えば同じbar / timeでも別位置として扱い、自動で新Versionへ引き継がない

### MIDI Proposal create

Source MIDIは読み取り専用の参照で、Proposalはnew separate entity / Assetとして作ります。original object key、original Asset record、source Versionを更新しません。

```json
{
  "sourceVersionId": "version_v08",
  "sourceMidiAssetId": "asset_midi_source",
  "proposalAssetId": "asset_midi_proposal_verified",
  "title": "サビ上声案",
  "summary": "bars 33-40に上声を追加",
  "songTrackId": "track_keys",
  "targetRange": {
    "startBar": 33,
    "endBar": 40
  },
  "clientOperationId": "opaque-client-operation-id"
}
```

server checks候補:

- source Version、source MIDI Asset、proposal Asset、Trackが同じSong / Bandに属する
- source Assetのkindが`midi_source`相当、proposal Assetのkindが`midi_proposal`相当である
- source Assetをreadでき、proposal Assetを作成したactorに利用権限がある
- proposal Assetがserver検証済みの`available`相当stateである
- source Version / Assetがarchived、deleted、quarantinedでない
- range、title、summary、initial transitionをruntime validationする
- `createdBy`、`createdAt`、initial statusはserverが設定する

### Proposal statusとUI action

DATA-001のenum草案とFLOW-001の表示語彙には差があります。次は統合候補であり、確定enumではありません。

| lifecycle候補 | 意味 | FLOW-001 UIとの関係 |
| --- | --- | --- |
| `draft` | creatorだけが準備中 | UI未表現 |
| `submitted` | review依頼済み | `AVAILABLE`の候補 |
| `reviewing` | review進行中 | `HOLD`後もこのstateへ留める候補 |
| `accepted` | 最終判断で採用 | `ACCEPT`候補。DAWへ自動反映しない |
| `partially_accepted` | 範囲やnote付きで一部採用 | `PARTIAL`候補。詳細必須候補 |
| `rejected` | 最終判断で不採用 | `REJECT`候補 |
| `withdrawn` | creatorがreview前後に撤回 | UI未表現 |

`HOLD`を永続statusにするかは未決定です。初期推奨候補は、HOLDを「最終判断を記録せず`reviewing`を維持するUI action」とし、必要ならReviewResponseやnoteを追加する方式です。期限付き保留、再開、担当変更がproduct要件になった場合にだけ独立statusを再検討します。

### Proposal decision

#### endpoint / command比較

| 案 | 利点 | risk |
| --- | --- | --- |
| `PATCH /api/midi-proposals/{proposalId}`でstatusを直接変更 | 単純でresource数が少ない | 誰が何を判断したか、競合した判断、partial detailを失いやすい |
| `POST /api/midi-proposals/{proposalId}/decisions`でrecord追加 | actor、note、時刻、revision、履歴を保持しやすい | 最終stateの集約ruleとtransactionが必要 |

推奨候補はappend-orientedなDecision / Review recordを作り、同じtransactionでProposalのcurrent summary stateを更新する方式です。DATA-001の`ReviewResponse`をreviewer個別回答、`Decision`を権限を持つactorによる制作上の最終判断として使い分ける候補です。Proposalへのreference fieldや専用record名はdata model reviewで確定し、この文書だけでtable追加を決定しません。

```json
{
  "decision": "partially_accepted",
  "decisionNote": "上声の前半4小節だけ採用",
  "acceptedRange": {
    "startBar": 33,
    "endBar": 36
  },
  "expectedProposalRevision": 4,
  "clientOperationId": "opaque-client-operation-id"
}
```

- `decidedBy`と`decidedAt`はserverが設定する
- `PARTIAL`では範囲または説明を必須にする候補
- current stateから許可されない遷移を拒否する
- Original / Proposal MIDI Assetを変更せず、Versionを自動作成しない
- AがACCEPT、BがREJECTを同時送信した場合、同じfinal Decisionなら先に成立したrevisionだけを受理し、後続を`409`にする候補
- 複数reviewerの意見を両方残す要件がある場合はReviewResponseを別々に記録し、final Decisionとは区別する

## Cross-cutting server responsibilities

### Runtime validation

TypeScript type、HTML属性、disabled button、client-side validationはsecurity boundaryではありません。すべてのwriteでserverが次を検証します。

- required / optional / nullable / omittedの区別
- trim後の空文字、文字数、Unicode正規化方針
- numericの型、整数性、min / max、NaN / infinityの拒否
- enum、format、unknown field、payload size
- cross-field relationと同じSong / Version / Bandへの所属
- authentication、active Membership、resource ownership、operation capability
- current state、archived / deleted / quarantined状態、許可されたtransition
- `expectedRevision`、`clientOperationId`、rate limit候補

runtime validation libraryは未決定です。現在packageに新しいvalidation libraryを追加せず、実装taskで候補を比較します。

### Authorization boundary

現在の`Member.part`は音楽上の担当であり、access roleではありません。DATA-001の`owner / manager / contributor / viewer`候補と、`Owner / Admin / Editor / Commenter / Guest`という別候補にも差があるため、role名と権限は未確定です。API contractではrole名よりcapabilityをserver側で評価する候補とします。

| Operation | Owner/Admin-like | Editor-like | Commenter-like | Guest-like |
| --- | --- | --- | --- | --- |
| Song update | candidate | candidate | no | no |
| Version create | candidate | candidate | no | no |
| Comment create | candidate | candidate | candidate | TBD / default no |
| Proposal create | candidate | candidate | TBD | no |
| Proposal Decision | candidate | candidate | TBD | no |
| Upload / Asset access | candidate | kind別candidate | upload no / read TBD | default no |

これは採用済みpermission matrixではありません。すべてのrequestでserverがsessionからactorを決め、対象Band Membership、capability、resourceのBand ownershipを確認します。UIでbuttonが見えること、clientがroleやuser IDを送ること、object keyを知っていることは権限の証明になりません。

### Information leakage

- 未認証は`401`候補
- 認証済みactorが他Bandのprivate resource IDを指定した場合、存在を漏らさないため外向きには`404`へ統一する候補
- actorが所属済みBand内で存在を知るresourceに対してoperationだけ許可されない場合は`403`候補。ただしどこまで区別するかはsecurity reviewで確定する
- client messageへresource owner、Band名、object key、内部判定理由を含めない
- internal log / auditには`requestId`、actor、resource type / opaque ID、内部reason code、結果を残す候補とし、本文、credential、private URLを過剰に複製しない
- timing、一覧件数、field errorから他Band resourceの存在を推測できないようresponse shapeを揃える

### Optimistic concurrency

Phase 2の最低限として、mutable aggregateに単調増加する`revision`を持たせ、更新commandへ`expectedRevision`を要求する方式を推奨候補とします。HTTP採用時はETag / `If-Match`へmappingでき、Server Action等でも同じapplication contractを使えます。

- Song BPMをrevision 7から更新する二人のrequestは、先に成功したものだけがrevision 8になる
- 古いrevision 7から来た後続requestは`409 CONFLICT`とし、現在値を静かに上書きしない
- Proposalのfinal Decisionもexpected Proposal revision / stateを確認する
- Version createは`expectedSongRevision`またはcurrent Version IDを確認し、古いbaseからcurrent pointerを上書きしない
- conflict responseはUIが「最新を再取得 → 自分の変更と比較 → 再適用 / 取消」を選べるcodeを返す
- merge UI、field単位merge、revision保存方式は実装前に決める

### Idempotency

network retry、double click、browser再送でcreateが重複しないよう、次のoperationは`clientOperationId`またはidempotency keyを受ける候補です。

- Song create
- Version create
- Comment create
- MIDI Proposal create
- Upload request / complete
- Proposal Decision submit

serverはactor + operation scope + keyの組み合わせを一定期間uniqueにし、同じkey / 同じcanonical inputには最初の結果を返す候補です。同じkeyを異なるinputで再利用した場合は`409 IDEMPOTENCY_KEY_REUSED`候補とします。key形式、保存期間、失敗responseの再利用、browserでの生成方法は未決定です。idempotencyはauthorizationやrevision checkの代替ではありません。

## Upload and Asset boundary

### Upload lifecycle

```text
Client selects a file
→ Upload Request
→ Server auth / membership / capability / metadata / quota validation
→ pending Asset or upload intent + opaque object key
→ short-lived private upload instruction
→ Client uploads directly to private object storage candidate
→ Upload Complete
→ Server verifies object, size, checksum, detected type, ownership, state
→ optional future content inspection
→ Asset becomes available, quarantined, or failed
```

Upload Request input候補:

- `kind`: `audio_preview | audio_stem | midi_source | midi_proposal | reference`候補
- original filename（表示用。path / object keyに直接使用しない）
- declared MIME、extension、`sizeBytes`、checksum候補
- Song ID、optional Version / Track / Proposal intent reference
- `clientOperationId`

server側で、kindごとのallowed MIME / extension、max size、Band quota、filename length、target ownership、upload期限を検証します。具体的なformat・容量は未決定です。client supplied MIME、extension、sizeだけを信用せず、complete時に実objectと照合します。

Upload Completeはobject存在、opaque keyとの一致、size、checksum、detected MIME、upload owner、expiry、current Asset stateを再検証します。二重completeはidempotentに同じ結果を返す候補です。不完全、期限切れ、checksum不一致、禁止typeは`available`にせず、failed / quarantined候補としてaccessを拒否します。

### Object storage security

- unreleased Songのobjectをpublic bucket / public URLにしない
- read / writeのたびにauthentication、Band Membership、Asset ownership、current stateをserverで確認する
- upload / download instructionは短時間だけ有効にし、DBやclient stateへ長期保存しない
- object keyはserver生成のopaque IDを基にし、Band名、Song名、user email、original filename、secretを直接含めない
- original filenameとclient supplied MIMEを信用せず、表示時のescapeとcomplete時のserver検証を行う
- private object key、provider credential、署名生成secretをclient responseやlogへ出さない
- malware / content inspection、encryption、region、retention、provider、費用上限は将来のstorage設計で決める
- S3は候補の一つにすぎず、DATA-002でAWS resourceを作成・採用しない

### Asset access

`GET /api/assets/{assetId}/access`は、権限確認後に短時間のdownload instructionを返す案と、server経由でstreamする案を比較するための候補です。どちらでもstable public URLは返しません。

- Membershipを外れたactor、別Bandのactor、deleted / quarantined Assetにはaccessを発行しない
- browser cache、Content-Disposition、range request、Preview再生、download auditはprovider選定時に決める
- responseには表示用filename、sanitized MIME、size、expiry等の必要最小限だけを含める

### UploadとVersion作成の関係

| 案 | 利点 | risk |
| --- | --- | --- |
| Assetをupload / verify後にVersionを作成 | Version作成時に実在・検証済みAssetだけをatomicに関連付けやすい | Version未所属のstaging Assetがorphanになる可能性 |
| Draft Versionを先に作り、その配下へuploadしてfinalize | uploadの所属先が明確でresumeしやすい | 空Version、永続するdraft、partial完成のcleanupとUIが必要 |

Phase 2 MVPの推奨候補は、Songに紐づくprivate staging Assetを先にupload / verifyし、明示的なVersion create/finalize commandでverified Assetをtransaction的に関連付ける方式です。これにより不完全fileをcurrent Versionへ公開しません。staging Assetには短いexpiryとorphan cleanup job候補を設け、失敗時は再利用可否または安全な削除を明示します。

Draft Version方式は、大容量uploadのresume、複数人upload、長時間の準備が必要になった時に再検討します。いずれの方式でもempty Version、partially associated Version、orphan objectを検出・回復する運用が必要です。

## Read boundaries

Phase 2 MVPでは、Song Detail初期表示用のbounded aggregate responseを1回で返し、件数が増えるcollectionはpaginationされたresource endpointへ分ける候補です。最初からmicroserviceや多数のnetwork waterfallへ分割せず、巨大で無制限なresponseにもしません。

### read候補

- `GET /api/bands/{bandId}/songs`: permission済みSong summary、current Version summary、status。pagination必須候補
- `GET /api/songs/{songId}`: Song metadata、current Version、Asset / Comment / Proposal / Reviewの件数と先頭summary、actor capability
- `GET /api/songs/{songId}/versions`: Version履歴。pagination、stable sort
- `GET /api/songs/{songId}/comments?versionId=...`: Comment + Anchor。pagination、Version filter
- `GET /api/songs/{songId}/midi-proposals?versionId=...`: Proposal summaryとreview state
- `GET /api/songs/{songId}/assets?versionId=...`: sanitized Asset metadata。object keyは含めない

Song Detail responseへ全Comment本文、全Version、全Asset URL、全audit logを埋め込みません。UIの初期表示に必要なprojectionと、遅延取得するcollectionの境界・上限をperformance test前に調整します。cacheを採用する場合も、Membership変更後にprivate dataを返さないinvalidationが必要です。

## Response and error model candidates

### success envelope

```json
{
  "data": {
    "id": "resource_id",
    "revision": 8
  },
  "meta": {
    "requestId": "request_id"
  }
}
```

### error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容を確認してください",
    "fieldErrors": {
      "bpm": ["40から240の範囲で入力してください"]
    },
    "requestId": "request_id",
    "retryable": false
  }
}
```

envelope採用自体は未決定ですが、UIが少なくともfield error、unauthenticated、permission / hidden resource、conflict、retryable failure、unknown failureをcodeで区別できる必要があります。利用者向けmessageをbusiness logicに使わず、内部errorやsecretをmessageへ含めません。

### HTTP / error semantic候補

| status候補 | code例 | 用途 |
| --- | --- | --- |
| `400` | `MALFORMED_REQUEST` | JSON等の構文・transport上の不正 |
| `422` | `VALIDATION_ERROR`, `ANCHOR_MISMATCH`, `INVALID_STATE_TRANSITION` | field / relation / state validation |
| `401` | `UNAUTHENTICATED` | 有効なsessionがない |
| `403` | `FORBIDDEN` | resource存在をactorが既知で、operationだけ許可されない場合の候補 |
| `404` | `NOT_FOUND` | 対象なし、または他Band resourceを秘匿する場合 |
| `409` | `REVISION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED` | stale update、同時Decision、key再利用 |
| `413` | `FILE_TOO_LARGE` | upload metadata / 実objectが上限超過 |
| `429` | `RATE_LIMITED` | abuse / burst control。retry情報は安全な範囲で返す |
| `500` | `INTERNAL_ERROR` | 予期しないserver failure。詳細はclientへ返さない |

### Conflict UX contract

UIは`409`を通常のunknown errorと同一扱いにせず、次の導線を提示できるresponse codeを受けます。今回はUIを実装しません。

```text
Save / Decision failed
→ Your view is stale
→ Reload latest resource
→ Review latest changes and your unsaved input
→ Reapply or cancel explicitly
```

serverは古いpayloadを自動で上書きせず、clientも409後に同じrevisionで無限retryしません。responseへcurrent revisionまたは再取得先を含めるかは、情報漏えいとpayload sizeを考慮して実装前に決めます。

## Sequence examples

### A. Position-aware Comment

```text
Client sends body + Version ID + optional Anchor + clientOperationId
→ Server authenticates actor
→ Server resolves active Band Membership and comment capability
→ Server verifies Song / Version / Track ownership
→ Server validates body, anchor units, range, and Version consistency
→ Server creates Comment + CommentAnchor atomically
→ Server returns sanitized Comment view + requestId
```

### B. MIDI Proposal review

```text
Client requests private upload for proposal MIDI
→ Server authorizes and validates upload metadata
→ Client uploads to private object storage candidate
→ Server verifies proposal Asset
→ Client creates Proposal referencing source MIDI + separate proposal Asset
→ ReviewResponse(s) may be recorded
→ Authorized final Decision is recorded with expected revision
→ Composer reflects the decision in the DAW outside StreamBand
→ New Version may be created later through an explicit command
```

### C. New Version

```text
Composer exports Preview / MIDI from the DAW
→ Client obtains private upload instructions
→ Server verifies uploaded staging Assets
→ Client explicitly requests Version create/finalize
→ Server checks permission, base Version, Song revision, Asset ownership/readiness
→ Server creates Version and associates Assets transactionally
→ Version becomes current candidate according to a separately approved rule
```

## DATA-002 explicit non-goals

この草案では次を実装・採用決定しません。

- API、Next.js Route Handler、Server Action、別Backend
- DB、ORM、schema、migration、DB製品
- authentication、authorization、Cognito、session、cookie
- AWS、S3 bucket、Lambda、API Gateway、object storage provider
- file upload / download、presigned URL、malware scan
- localStorage、実永続化、secret / `.env`、infrastructure as code
- payment、Stripe、production deployment
- audio playback / processing、MIDI parse / edit / generation
- Studio One連携、Companion App、VST3、DAW自動反映

この章のrole、enum、limit、URL、payload、responseはすべてreview候補です。Cloud implementationへ進む前に、人によるcontract、permission、provider、cost、security、rollbackの承認が必要です。

## 実装前に決めること

- API 方式、URL / 関数命名、バージョニング
- 認証とセッション、CSRF 対策
- ロール別の権限マトリクス
- 入力スキーマ、最大文字数、レート制限
- ページング、検索、並び替え
- 更新競合、冪等性、トランザクション
- キャッシュと再検証
- 監査ログ、監視、アラート
- API テストと権限境界テスト
