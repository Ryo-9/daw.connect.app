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
| Upload Request | `POST /api/songs/{songId}/assets/upload-requests` | `asset:request-upload` capability | kind、name、declared MIME、size、SHA-256 checksum、target refs、`clientOperationId` | permission、quota、kind、size、target ownership | `PENDING_UPLOAD` Asset / upload intent | 15分のshort-lived upload instruction | retry、orphan intent |
| Upload Complete | `POST /api/assets/{assetId}/complete` | `asset:complete-upload` + upload owner | `expectedRevision`、`clientOperationId` | object存在、expected key、owner、size、checksum、bounded signature、state | `PENDING_UPLOAD → VERIFYING → AVAILABLE / FAILED` | sanitized Asset metadata | 二重complete、不完全object |
| Asset Access | `GET /api/assets/{assetId}/access` | `asset:access` capability | Asset ID | auth、strong Membership、canonical ownership、`AVAILABLE` state | 原則なし。access audit候補 | 5分のshort-lived access instruction | membership変更、期限切れ |
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
- source Assetのkindが`SOURCE_MIDI`、proposal Assetのkindが`PROPOSAL_MIDI`である
- source Assetをreadでき、proposal Assetを作成したactorに利用権限がある
- proposal Assetがserver検証済みの`available`相当stateである
- source Versionがarchivedでなく、source Assetが`AVAILABLE`である
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
- current state、archived / `FAILED` / `DELETION_REQUESTED` / `DELETED`状態、許可されたtransition
- `expectedRevision`、`clientOperationId`、rate limit候補

runtime validation libraryは未決定です。現在packageに新しいvalidation libraryを追加せず、実装taskで候補を比較します。

### Authorization boundary

現在の`Member.part`は音楽上の担当であり、access roleではありません。AUTHZ-001ではCloud MVPのroleを`Owner / Admin / Editor / Commenter / Guest`へ統一し、roleを直接if文で比較するのではなく、後段のcapability matrixをserver contractとして評価します。

すべてのrequestでserverがsessionからactorを決め、対象Band Membership、capability、resourceのBand ownershipを確認します。UIでbuttonが見えること、clientがroleやuser IDを送ること、object keyやopaque IDを知っていることは権限の証明になりません。

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
→ Asset(PENDING_UPLOAD) + opaque object key
→ short-lived private upload instruction
→ Client uploads directly to private S3 candidate
→ Upload Complete
→ conditional transition to VERIFYING
→ Server verifies object, size, checksum, bounded file signature, ownership, state
→ Asset becomes AVAILABLE or FAILED
```

STORAGE-001-DESIGNのMVP contractでは`UPLOADING`をserver stateにしません。browserからS3への転送進捗はclient-localで、serverが確実に知るのはupload instruction発行前の`PENDING_UPLOAD`とcomplete受付後の`VERIFYING`だけです。`FAILED`から同じkeyへ再uploadせず、新しいAsset / keyで再試行します。

Upload Request input候補:

- `kind`: `AUDIO_PREVIEW | SOURCE_MIDI | PROPOSAL_MIDI`
- original filename（表示用。path / object keyに直接使用しない）
- declared MIME、extension、`sizeBytes`、`checksumAlgorithm=SHA256`、checksum
- Song ID、optional Version / Track / Proposal intent reference
- `clientOperationId`

serverはcanonical Song / Version、ACTIVE Membership、AUTHZ-001の`asset:request-upload`、kind、format、size、filename sanitation、Band使用量候補、target relationshipを検証します。初期application limitはPreview 80 MiB、各MIDI 10 MiB、nonprod Band合計2 GiB候補、upload instruction 15分です。これはS3 hard limitではなく、実測後に専用reviewで変更します。serverはAsset metadataとkeyを先に作り、key / method / checksum header / content type / expiryを限定したinstructionだけを返します。

Upload Completeはupload intentのactor、canonical relationship、`PENDING_UPLOAD` state、revision、idempotencyを確認して`VERIFYING`へconditional transitionします。その後、object存在、expected key、size、S3 checksum、signed content type、bounded signature（MP3 / WAV / Standard MIDI File）をstorage側から検証します。同じoperationの二重completeは同じresultを返し、mismatchは`FAILED`としてaccessを拒否してorphan reconciliation対象にします。ETagをcontent checksumとはみなしません。

### Object storage security

- unreleased Songのobjectをpublic bucket / public URLにしない。環境ごとに1つのprivate Asset bucketを使う候補
- S3 Block Public Accessの4設定、Bucket owner enforced、ACLなし、HTTPS-only bucket policyをIaCで明示する
- nonprodはSSE-S3を明示し、customer-managed KMS keyを作らない。Private Alphaはreal data投入前に再reviewする
- read / writeのたびにauthentication、Band Membership、Asset ownership、current stateをserverで確認する
- upload / download instructionは短時間だけ有効にし、DBやclient stateへ長期保存しない
- object keyはserver生成のopaque IDを基にし、Band名、Song名、user email、original filename、secretを直接含めない。新規writeは`If-None-Match: *`候補で既存key上書きを拒否する
- original filenameとclient supplied MIMEを信用せず、表示時のescapeとcomplete時のserver検証を行う
- private object key、provider credential、署名生成secretをclient responseやlogへ出さない
- server-side transcodingとmalware scanning serviceはMVPへ追加せず、size / checksum / bounded signatureを先に実装する。uploaded contentをserverで実行しない
- 具体的なbucket、IAM、API、S3 resourceは未作成で、actual implementationはAWS foundation execution gate後の別taskとする

### Asset access

`GET /api/assets/{assetId}/access`は、AUTHZ-001の共通sequenceを通して5分有効のdownload / Preview instructionを返す候補です。stable public URLは返しません。

- canonical AssetからBand / Song / Versionをderiveし、strong readしたACTIVE Membership、`asset:access` capability、`AVAILABLE` stateを毎回確認する
- Membershipを外れたactor、別Bandのactor、`FAILED / DELETION_REQUESTED / DELETED` Assetにはaccessを発行しない
- 削除されたmemberへ新規instructionを発行しないが、既発行URLは最長5分残り得るresidual riskとして扱う
- browser cache / Content-Disposition / range requestはimplementation taskでresponse testする
- responseには表示用filename、sanitized MIME、size、expiry等の必要最小限だけを含める

browser direct access用CORS候補は、review済みのexact app originだけ、`PUT / GET / HEAD`だけ、`Content-Type`、`If-None-Match`、必要なchecksum headerだけを許可します。Private Alphaでwildcard originを使わず、preflight cacheは初期300秒候補です。CORSはauthorizationではありません。

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
| `422` | `VALIDATION_ERROR`, `ANCHOR_MISMATCH` | field / relation / format validation |
| `401` | `UNAUTHENTICATED` | 有効なsessionがない |
| `403` | `FORBIDDEN` | resource存在をactorが既知で、operationだけ許可されない場合の候補 |
| `404` | `NOT_FOUND` | 対象なし、または他Band resourceを秘匿する場合 |
| `409` | `REVISION_CONFLICT`, `STATE_CONFLICT`, `INVALID_STATE_TRANSITION`, `IDEMPOTENCY_KEY_REUSED` | stale update、同時Decision、現在stateから不可能な遷移、key再利用 |
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

DATA-002の草案では次を実装・採用決定しませんでした。AUTHZ-001は後段でauthorization contractだけを具体化しますが、runtime実装は引き続き行いません。

- API、Next.js Route Handler、Server Action、別Backend
- DB、ORM、schema、migration、DB製品
- authentication、authorization実装、Cognito、session、cookie
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
- AUTHZ-001のrole / capabilityをapplication policyへ安全にmappingする方法
- 入力スキーマ、最大文字数、レート制限
- ページング、検索、並び替え
- 更新競合、冪等性、トランザクション
- キャッシュと再検証
- 監査ログ、監視、アラート
- API テストと権限境界テスト

## AUTHZ-001: Band Membership authorization contract

### Status and principles

この章はCloud MVPのserver-side authorization契約です。設計日: 2026-09-11。認証、Cognito、API、IAM、DynamoDB、S3は未実装で、AWS resourceも作成していません。

- authorization単位はBandごとの`BandMembership`であり、Cognito groupや音楽上のpartではない
- roleは権限の強弱を単純比較する数値階層ではなく、serverがcapabilityへ展開する固定bundleとする
- すべてのcapabilityは、明示がない限り**同じBandのACTIVE Membership**を必須とする
- creator / authorは一部の「自分のresource」操作を狭めるconditionであり、作成後の恒久的な管理権限ではない
- UI visibility、GSI result、URLのBand ID、client role、cached state、object key、opaque resource IDをauthorizationに使わない
- denyを既定とし、role / state / ownership / relationshipのいずれかを確認できなければfail closedとする

### Role definitions

| Role | Meaning | Explicit boundary |
| --- | --- | --- |
| `Owner` | Bandの最上位authority。所有権移譲、Band archive / restore、Owner / Admin境界を管理する | 最後のACTIVE Ownerを失わせられない。routine AWS / billing権限とは無関係 |
| `Admin` | Band metadataと大部分のmember / collaboration contentを管理する | Bandを所有せず、Ownerの変更・排除・所有権移譲はできない |
| `Editor` | Song、Version、Asset、MIDI Proposal等の制作collaboration contentを作成・更新する | member管理、Band ownership、他人Commentのmoderation、Audit閲覧はできない |
| `Commenter` | Version / Proposalをreviewし、Commentと非finalなHold / Reviewingを扱う | Song / Version / Asset / final Proposal Decisionを変更しない |
| `Guest` | ACTIVE Membershipを持つ限定read-only participant | write、Audit閲覧、private admin metadata閲覧は行わない |

### Capability matrix legend

- `A`: role bundleとして許可。表のstate / relationship conditionは引き続き必要
- `C`: ownership、target role、state等の追加条件を満たす場合だけ許可
- `D`: deny
- `S`: application serviceだけが実行し、人間roleへ直接公開しない
- `Same Band`は全行で必須。例外はserver自身が書くAuditEventだけだが、そのeventにもderived `bandId`が必要
- `Failure`の`404`はmissing / inactive membership / cross-Band秘匿、`403`は同じBand内でcapability不足、`409`はrevision / current state / invariant conflictを表す。未認証は全行で`401`

#### Band and Membership

| Capability | Owner | Admin | Editor | Commenter | Guest | Same Band | Ownership / state condition | Audit | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `band:read` | A | A | A | A | A | 必須 | ACTIVE Membership。ARCHIVEDも同じmemberはread可 | No | 404 |
| `band:update` | A | A | D | D | D | 必須 | ACTIVE Band、`expectedRevision` | No | 403 / 409 |
| `band:archive` | A | D | D | D | D | 必須 | ACTIVE Band、`expectedRevision` | **Yes** | 403 / 409 |
| `band:restore` | A | D | D | D | D | 必須 | ARCHIVED Band、`expectedRevision` | **Yes** | 403 / 409 |
| `membership:list` | A | A | A | A | A | 必須 | safe profile projectionだけを返す | No | 404 |
| `membership:add` | A | C | D | D | D | 必須 | target Userをserver解決。OwnerはAdmin以下、AdminはEditor / Commenter / Guestだけを付与。Owner追加はtransfer flowのみ | **Yes** | 403 / 409 / 422 |
| `membership:change-role` | C | C | D | D | D | 必須 | OwnerはAdmin / Editor / Commenter / Guest間、AdminはEditor / Commenter / Guest間だけ変更可。Owner変更はtransfer flow。target revision必須 | **Yes** | 403 / 409 |
| `membership:remove` | C | C | D | D | D | 必須 | Ownerはlast Owner以外、AdminはEditor / Commenter / Guestだけ。他人をremove | **Yes** | 403 / 409 |
| `membership:transfer-ownership` | A | D | D | D | D | 必須 | actorがACTIVE Owner、targetがACTIVE member。promote + optional actor demoteをatomicに行う | **Yes** | 403 / 409 |
| `membership:remove-self` | C | C | C | C | C | 必須 | actor自身だけ。sole ACTIVE Ownerは禁止 | **Yes** | 409 |
| `membership:remove-last-owner` | D | D | D | D | D | 必須 | 常にdeny。別Owner作成 / transferが先 | **Yes (attempt)** | 409 |

Adminは自分をOwnerへ昇格できず、Owner / 他Adminのrole変更・removeもできません。Owner roleを持つmemberの追加は一般`membership:add`ではなく、existing Ownerが明示するownership transfer / co-owner approval flowだけを使います。MVPでco-ownerを許可する場合も、最低1人のACTIVE Owner invariantを変えません。

#### Song and Version

| Capability | Owner | Admin | Editor | Commenter | Guest | Same Band | Ownership / state condition | Audit | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `song:create` | A | A | A | D | D | 必須 | ACTIVE Band。initial Versionとatomic create | No | 403 / 409 / 422 |
| `song:read` | A | A | A | A | A | 必須 | stored Song.bandIdを使用。archived itemもdirect read可 | No | 404 |
| `song:update` | A | A | A | D | D | 必須 | non-archived Song、`expectedRevision`。creator条件なし | No | 403 / 409 |
| `song:archive` | A | A | A | D | D | 必須 | non-archived Song、`expectedRevision` | **Yes** | 403 / 409 |
| `song:restore` | A | A | A | D | D | 必須 | archived Song、`expectedRevision` | **Yes** | 403 / 409 |
| `version:create` | A | A | A | D | D | 必須 | non-archived Song、verified same-Song Assets、`expectedSongRevision` | **Yes** | 403 / 409 / 422 |
| `version:read` | A | A | A | A | A | 必須 | stored Version → Song → Band chain一致 | No | 404 |
| `version:list` | A | A | A | A | A | 必須 | parent Song access。pagination必須 | No | 404 |
| `version:update-limited-metadata` | A | A | A | D | D | 必須 | label / noteだけ。sequence、assets、creator、createdAt、basedOnはimmutable。`expectedRevision` | **Yes** | 403 / 409 / 422 |

Version creatorは特別なauthorizationを持ちません。Versionのdelete / rewriteはMVP capabilityに含めず、DAW反映後の新Versionを明示作成します。

#### Asset

| Capability | Owner | Admin | Editor | Commenter | Guest | Same Band | Ownership / state condition | Audit | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `asset:request-upload` | A | A | A | D | D | 必須 | ACTIVE Song、same-Song target、kind / quota / metadata validation | No | 403 / 409 / 422 |
| `asset:complete-upload` | C | C | C | D | D | 必須 | actorがupload intent / Asset creator、state=PENDING/VERIFYING、object verification、revision一致 | No | 403 / 409 / 422 |
| `asset:access` | A | A | A | A | A | 必須 | canonical Assetが`AVAILABLE`、stored Band / Song / Version chain一致 | access log候補 | 404 / 409 |
| `asset:request-delete` | A | A | C | D | D | 必須 | Owner/Adminはsame-Band Asset。Editorは自分のPENDING / FAILED staging Assetだけ。AVAILABLE Version AssetはEditor不可 | **Yes** | 403 / 409 |

upload completeのOwner/Admin overrideはMVPでは設けません。開始actorが不在になったorphan uploadは、別のrecovery command / taskで処理し、他人のuploadを通常completeしません。短時間instructionを発行するたびにauthorizationを再確認します。

#### Comment

| Capability | Owner | Admin | Editor | Commenter | Guest | Same Band | Ownership / state condition | Audit | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `comment:create` | A | A | A | A | D | 必須 | accessible Version、valid Anchor。authorはserver決定 | No | 403 / 409 / 422 |
| `comment:read` | A | A | A | A | A | 必須 | Version chain一致。tombstone本文は返さない | No | 404 |
| `comment:edit-own` | C | C | C | C | D | 必須 | actor=author、作成後15分以内、not tombstoned、bodyだけ、`expectedRevision` | No | 403 / 409 |
| `comment:edit-others` | D | D | D | D | D | 必須 | author attributionを保つため常にdeny | No | 403 |
| `comment:tombstone-own` | C | C | C | C | D | 必須 | actor=author、not tombstoned、`expectedRevision`。時間制限なし | No | 403 / 409 |
| `comment:moderate-others` | A | A | D | D | D | 必須 | 他人Commentをtombstone化するだけ。本文を書き換えない。reason category必須 | **Yes** | 403 / 409 |

MVPのedit windowはserver timeで15分です。期限後は元Commentを残して新しいCommentで訂正します。moderatorも他人の本文を編集できず、必要な場合だけtombstoneにします。PITR / backup内の保持と法的削除は別runbookです。

#### MIDI Proposal and Decision

| Capability | Owner | Admin | Editor | Commenter | Guest | Same Band | Ownership / state condition | Audit | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `proposal:create` | A | A | A | D | D | 必須 | source Version / SOURCE_MIDIとseparate PROPOSAL_MIDI Assetがsame Band / Song、AVAILABLE | No | 403 / 409 / 422 |
| `proposal:submit` | C | C | C | D | D | 必須 | actor=creator、status=DRAFT、`expectedRevision` | No | 403 / 409 |
| `proposal:read` | A | A | A | A | A | 必須 | stored source Version / Asset chain一致 | No | 404 |
| `proposal:withdraw-own` | C | C | C | D | D | 必須 | actor=creator、status=DRAFT / SUBMITTED / REVIEWING、`expectedRevision` | **Yes** | 403 / 409 |
| `proposal:review` | A | A | A | A | D | 必須 | status=SUBMITTED / REVIEWING。review feedbackはCommentとして保存 | No | 403 / 409 |
| `proposal:accept` | A | A | A | D | D | 必須 | status=SUBMITTED / REVIEWING、`expectedRevision`、append final Decision | **Yes** | 403 / 409 |
| `proposal:partial-accept` | A | A | A | D | D | 必須 | status=SUBMITTED / REVIEWING、partial detail必須、`expectedRevision` | **Yes** | 403 / 409 / 422 |
| `proposal:reject` | A | A | A | D | D | 必須 | status=SUBMITTED / REVIEWING、`expectedRevision`、append final Decision | **Yes** | 403 / 409 |
| `proposal:hold` | A | A | A | A | D | 必須 | SUBMITTED→REVIEWINGまたはREVIEWING維持。final Decision itemを作らない | status変更時のみ | 403 / 409 |

Proposal creatorであること自体はfinal Decision権限を生みません。一方、MVPではEditor capabilityを持つactorをcreatorという理由だけでdecisionから除外しません。Decision actorとproposal creatorを記録し、必要ならPrivate Alpha reviewでseparation-of-dutiesを追加します。

`ACCEPT / PARTIAL / REJECT`はProposal summary stateとappend-only Decisionを同じtransactionで更新しますが、SOURCE_MIDI、PROPOSAL_MIDI、DAW、SongVersionを変更しません。`HOLD`はfinal Decisionではなく`REVIEWING`の維持です。作曲者がDAWへ明示反映し、Preview / MIDIをexportした後、別の`version:create`で次Versionを作ります。

#### Audit

| Capability | Owner | Admin | Editor | Commenter | Guest | Same Band | Ownership / state condition | Audit | Failure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `audit:write-system` | S | S | S | S | S | derived必須 | application serviceだけ。actorは認証contextから設定 | n/a | client callは403 |
| `audit:read` | A | A | D | D | D | 必須 | sanitized Band-scoped page、pagination。raw payloadなし | read access log候補 | 403 / 404 |

### Server-trusted ownership rules

| Resource | Trusted ownership / relationship | Creator-specific exception |
| --- | --- | --- |
| Band | canonical Band IDとACTIVE Owner Membership | `createdBy`はaudit情報で、現在のOwner authorityを決めない |
| Song | canonical `Song.bandId` | creator条件なし。role capabilityで管理 |
| SongVersion | canonical `bandId + songId`とparent Song | creator条件なし。limited metadataだけ更新可 |
| Comment | canonical `bandId + songId + versionId`、`authorUserId` | authorだけ15分edit / anytime tombstone。moderatorは本文を編集しない |
| Asset | canonical `bandId + songId + versionId?`、state、`createdBy` | creatorだけupload complete。Editorのdelete requestはown stagingだけ |
| MidiProposal | canonical `bandId + songId + sourceVersionId + sourceMidiAssetId + proposalAssetId` | creatorだけsubmit / withdraw。final Decisionはrole capability |
| ProposalDecision | parent Proposalからderived Band / Song / Version、server actor、append-only | creator ownershipなし。client supplied `decidedBy/At`を無視 |

client submitted `ownerId`、`authorId`、`createdBy`、`decidedBy`、`bandId`はauthorityとして採用しません。source MIDIはcanonical Assetを読み、`kind=SOURCE_MIDI`、`state=AVAILABLE`、source Versionとsame Band / Songであることを検証します。Proposal Assetは別ID / objectの`PROPOSAL_MIDI`で、same Band / Song contextを満たさなければ422または秘匿404で拒否します。

### Common membership verification algorithm

すべてのprotected operationは次の順序を共有します。

1. authentication layerでidentityを確認する。失敗は401
2. auth subjectからinternal Userをserver側で解決する
3. target canonical resourceをserver側で取得する
4. resourceに保存されたrelationshipからBand IDをderiveする
5. base tableから`BandMembership`をstrongly consistent readする
6. Membershipが`ACTIVE`であることを要求する
7. role bundleをcapabilityへ展開し、対象operationを評価する
8. ownership、parent chain、resource state、allowed transitionを評価する
9. revision / idempotency condition付きreadまたはwriteを実行する
10. 必須operationではsafe `AuditEvent`を同じtransactionまたは整合するserver flowで出す

一覧GSIやclient cacheで候補を見つけても、protected detail / mutation / Asset instructionの直前にこのsequenceを行います。Membership remove後はold page、old role表示、stale session、過去URLを持っていても、次requestのstrong readで拒否します。

### Cross-Band protection and denial logging

- URL Bandとcanonical resourceのBandが違う、parent Song / Version / Asset chainが違う、Membershipがmissing / inactiveの場合はfail closedとする
- 他Band resourceの存在を漏らさないため、missing resourceとcross-Band / inactive Membershipは外向き`404 NOT_FOUND`へ統一する候補を維持する
- ACTIVE same-Band memberにresourceを示した後、operation capabilityだけ不足する場合は`403 FORBIDDEN`
- internal denial logはsafe reason category、request ID、opaque actor / resource ID、resultだけを候補とする
- Song title、Comment body、filename、object key、signed URL、MIDI content、token、credential、authentication payloadをdenial log / AuditEventへ入れない
- repeated sensitive denial、forged Band chain、role escalation attemptだけをrate-limit / deduplicateしてsecurity event候補にし、通常404を無制限に記録しない

### Membership mutation invariants

- Bandごとに最低1人の`ACTIVE Owner`を常に残す
- ownership transferはtargetのACTIVE Membershipと両Membership revisionを確認し、target promoteとactor demote候補を`TransactWriteItems`でatomicにする
- sole Ownerのremove / self-remove / demote / suspendと、last Ownerを失わせるBandMembership transactionはcondition failureにする
- actorはclient payloadで自分のroleを変更できない。Adminは自分をOwnerへpromoteできず、Owner / Admin peerを変更・removeできない
- stale member管理画面は`expectedRevision` conflictとして409を返し、最新Membershipを再読込させる
- Membership removeを成功させた後、GSIやcacheのeventual resultが残っていてもstrong base-table readを正とし、protected accessを即時denyする

### Asset authorization sequence

upload request、upload complete、download/access instruction、delete requestは別capabilityです。各requestで次を再確認します。

1. canonical Assetまたはtarget Song / Versionを取得する
2. stored `bandId / songId / versionId` chainを検証する
3. ACTIVE Membershipをstrong readする
4. operation capabilityとcreator conditionを評価する
5. Asset state、revision、kind、source/proposal relationshipを検証する
6. serverだけがshort-lived instructionを発行またはstate transitionする

S3 object keyを知ること、expiredでないpresigned URLを過去に得たこと、GSIにAssetが見えることは新しいaccess authorizationではありません。long-lived URLをDynamoDBへ保存せず、`storageObjectKey`を通常のclient responseへ出しません。

### Error mapping

| Outcome | HTTP / code | Rule |
| --- | --- | --- |
| identity missing / invalid | `401 UNAUTHENTICATED` | resource lookup detailを返さない |
| ACTIVE same-Band memberだがcapability不足 | `403 FORBIDDEN` | resource存在を既に知るcontextだけで使用 |
| missing、cross-Band、inactive / removed Membership、hidden resource | `404 NOT_FOUND` | 原因を外向きに区別しない |
| stale revision、last Owner invariant、edit window終了、allowed operationのcurrent state不一致 | `409 REVISION_CONFLICT` / `STATE_CONFLICT` | latestを再読込。自動上書きしない |
| payload / enum / relationship formatが不正 | `422 VALIDATION_ERROR` | field error。存在秘匿が優先する場合は404 |
| rate / abuse control | `429 RATE_LIMITED` | safe retry metadataだけを返す |

invalid transitionは、payload自体が有効でも現在stateから実行できないため**409**へ統一します。422は現在stateに依存しないfield / format / same-Band内relationship validationに使います。

### AuditEvent matrix

| Event | Required | Minimum safe fields |
| --- | --- | --- |
| Membership add / role change / remove / self-remove | Yes | actor ID、Band ID、target Membership ID、action、before/after role/status code、time、request ID、result |
| Ownership transfer / rejected last-Owner attempt | Yes | actor / target Membership ID、action、result / reason category、time、request ID |
| Band archive / restore | Yes | actor ID、Band ID、action、revision、time、request ID、result |
| Song archive / restore | Yes | actor ID、Band / Song opaque ID、action、revision、time、request ID、result |
| Asset deletion request / result | Yes | actor ID、Band / Song / Asset opaque ID、kind code、state transition、time、request ID |
| Proposal final Decision | Yes | actor ID、Band / Song / Proposal / Decision opaque ID、decision code、revision、time、request ID |
| Proposal withdraw / Hold state change | Yes | actor / Proposal opaque ID、state transition、time、request ID |
| Moderate another user's Comment | Yes | moderator ID、Comment opaque ID、reason category、time、request ID。本文なし |
| Security-sensitive denial | Conditional | reason category、request ID、opaque IDs、time、result。rate-limit / deduplicate |

AuditEventへComment body、Song / Band title、filename、object key、signed URL、token、credential、raw authentication claim、MIDI / audio contentを保存しません。Audit readはOwner / Adminだけへsanitized pageを返し、Audit自体もprivate Band dataとして扱います。

condition failureでtransaction自体が成立しないrejected last-Owner attemptは、失敗したtransactionへAudit itemを混在させず、拒否後にrate-limitされたserver security eventとして別途記録します。監査記録の失敗を理由に禁止操作を許可することはありません。

### Mandatory future server tests

| Test contract | Required assertion |
| --- | --- |
| role matrix | critical capabilityを5 roleすべてでparameterized testし、allow / conditional / denyが表と一致する |
| removed Membership | removal後の次requestがGSI / cache状態に関係なく404で拒否される |
| cross-Band ID | 他BandのSong / Version / Asset / Proposal IDを指定しても404で存在情報を返さない |
| forged Band ID | payload / URLのBand IDを書き換えてもcanonical resource chainとの差で拒否される |
| Comment ownership | authorは15分以内edit可能、他人editは全role deny、Owner/Admin moderationはtombstone + Auditのみ |
| source MIDI integrity | Proposal create / decide後もSOURCE_MIDI Asset ID / object / stateが不変 |
| Decision / Version separation | Accept / Partial / Reject transactionがSongVersionを作成しない |
| last Owner | remove / demote / self-removeの全経路でsole ACTIVE Ownerを失わせない |
| stale revision | Song、Membership、Comment、Proposalのold revision writeが409になりsilent overwriteしない |
| Asset access | ACTIVE MembershipとAVAILABLE stateを毎回要求し、removed member / wrong Version / wrong Bandを拒否する |
| GSI is not authorization | forged / stale index resultだけではprotected read、write、signed instructionを許可しない |
| Proposal role split | Commenterはreview / Hold可能だがfinal Decision不可、GuestはProposal readだけ |
| Audit sanitation | required eventが作られ、本文、title、filename、object key、URL、tokenを含まない |

### AUTHZ-001 compact contract

- Role model: `Owner / Admin / Editor / Commenter / Guest`はcapability bundleであり、client側の数値hierarchyではない
- Common algorithm: identity → canonical resource → stored Band → strong ACTIVE Membership → capability → ownership / state → conditional operation → safe Audit
- Ownership invariant: creatorは恒久authorityではない。author / uploader / proposal creator条件は明示したown-resource operationだけ
- Membership invariant: ACTIVE Ownerを最低1人残し、transferはatomic、removed memberは次requestからdeny
- Transition invariant: Proposal DecisionはSOURCE_MIDIを上書きせずVersionを作らない。HOLDはfinal Decisionでない
- Comment rule: own body editは15分、own tombstoneは時間制限なし、他人本文のeditは禁止、Owner/Adminだけmoderation tombstone可
- Error contract: unauthenticated 401、same-Band capability不足403、hidden / cross-Band 404、stale / invalid current state 409、input validation 422、rate limit 429
- Audit: member / ownership、archive / restore、Asset delete、Proposal state / Decision、other-user moderationを必須にし、private contentを複製しない
- Future tests: role matrix、cross-Band、last Owner、removed member、revision、Asset、Comment、Proposal non-destructive boundaryを実装merge gateにする
- Deferred: Cognito session、formal invitation、exact capability code implementation、cache invalidation、MFA、break-glass support、Private Alpha separation-of-dutiesは後続task / human review
