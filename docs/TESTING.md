# Testing Strategy

## 文書の位置付け

この文書は、DAW Connect App の自動テストをどこから始め、DB・認証導入後や一般公開前にどう拡張するかを定めます。目的はテスト数やカバレッジ率を増やすことではなく、壊れやすい重要な振る舞いを少ないテストで守り、2 人と Codex が PR を安全に判断できるようにすることです。

2026-09-03 時点で、BRIDGE-006 / PR #7の基本CIと、BRIDGE-008 / PR #8のVitest / React Testing LibraryによるComponent test、PlaywrightによるChromium smoke E2Eはmainへマージ済みです。API、DB、認証・認可、ファイル保存を対象にするLevel 2以降は未実装です。

## 現在のテスト対象

現在は Next.js App Router と静的モックデータによる UI プロトタイプです。

- 画面: `/`、`/dashboard`、`/bands`、`/bands/[bandId]`、`/bands/[bandId]/songs`、`/songs/[songId]`
- Client Components: 楽曲検索、ステータス絞り込み、0 件状態、TODO 完了切り替え、コメント一時追加
- Server Components: 主要ページ、動的ルート、モックデータの表示、存在しない ID の 404 判定
- 永続化: なし。検索条件、TODO、追加コメントはリロードで初期状態へ戻る
- 未実装: API / Server Actions、DB、認証・認可、ファイル保存、Level 2 / 3の自動テスト

## 推奨構成

| 役割 | 推奨ツール | 主な対象 | 採用理由 | 現在の制約 |
| --- | --- | --- | --- | --- |
| Unit test runner | Vitest | 純粋関数、同期ロジック | TypeScript と相性がよく、watch と 1 回実行を分けやすい。Next.js 公式ガイドに構成例がある | async Server Components の直接テストには使わない |
| Component testing | React Testing Library + jsdom | Client Components の表示と操作 | DOM を利用者と同じ観点で検証し、実装詳細への依存を減らせる | Next.js のルーティング全体やブラウザ固有動作は対象外 |
| E2E testing | Playwright | 主要画面遷移、動的ルート、404、統合された操作 | 実ブラウザで Next.js アプリ全体を確認でき、Chromium / Firefox / WebKit に拡張できる | ブラウザ準備とサーバー起動が必要で Component test より重い |

Jest + React Testing Library も候補ですが、既存テスト資産がない現在は Vitest と役割が重複します。最初から runner を 2 つ持つ利点がないため採用しません。Cypress も E2E 候補ですが、ブラウザ E2E を Playwright に一本化して設定と学習対象を増やさない方針です。

Next.js の公式ガイドは、Vitest と React Testing Library を Unit testing に併用できる一方、async Server Components は E2E で確認することを推奨しています。現在の動的ページは async Server Components のため、この境界を守ります。

## 導入構成とコマンド

BRIDGE-008 / PR #8で導入した直接依存は次のとおりです。正確な解決versionは `package-lock.json` を基準にします。

- Vitest `4.1.11`
- React Testing Library `16.3.3`、DOM Testing Library `10.4.1`
- jest-dom `7.0.1`、user-event `14.6.7`
- jsdom `30.0.1`
- Vite React plugin `6.1.1`（path aliasはVite 8の標準機能で解決）
- Playwright Test `1.62.1`

実行コマンド:

- `npm test`: Component testのwatch実行
- `npm run test:run`: Component testを1回実行（CI用）
- `npm run test:e2e`: production buildを起動してChromium smoke E2Eを実行。事前にbuildとChromiumの導入が必要

## テストを書く原則

- 利用者から見える振る舞いを、role、label、表示名、URL で確認する
- CSS class、コンポーネント内部 state、実装上の関数呼び出し回数を固定しない
- `data-testid` は role や label で特定できない場合だけ使う
- 大きな DOM snapshot を基本にせず、守る理由が明確な値だけを検証する
- 1 テストは 1 つの利用者シナリオに集中し、他テストの実行順に依存させない
- モックの日付、件数、文言を必要以上に固定せず、重要な意味と状態変化を確認する
- PR のテストから本番、外部 API、実ユーザーデータへ接続しない
- flaky test は再実行で隠さず、原因を調査する。修正まで隔離する場合は Issue と期限を残す
- 初期段階ではカバレッジ率を merge 条件にしない。重要シナリオが守られているかを優先する

## Level 1 — 今すぐ

mock UI の現在に合わせ、速い Component test と少数の E2E smoke test に限定します。

### Unit / Component test

BRIDGE-008 / PR #8で次を実装しました。

1. `SongFilterPanel`
   - 初期状態ですべての楽曲と件数を表示する
   - 前後空白と大文字・小文字を吸収して楽曲名を検索する
   - ステータス単独、および検索との組み合わせで絞り込む
   - 0 件状態を表示し、リセットで全件表示へ戻る
2. `TaskChecklist`
   - モックの初期完了状態と未完了件数を表示する
   - checkbox 操作で `aria-checked`、表示状態、未完了件数が切り替わる
   - 再操作で初期相当の状態へ戻る
3. `MockCommentComposer`
   - 空入力では追加ボタンを有効にしない
   - 本文と任意タイムスタンプを一時表示する
   - 追加後に入力欄を空にし、保存・送信されていない案内を表示する

`src/lib/mock-data.ts` の固定配列そのものや、単純な getter を網羅的にテストしません。分岐や変換ロジックが増えた時点で、その振る舞いに対する Unit test を追加します。

### E2E smoke test

PR ごとは Chromium 1 種類に絞り、次を守ります。

1. トップからダッシュボード、バンド一覧、Lumen Echo 詳細、楽曲一覧、Afterglow 詳細へ移動できる
2. 各画面で代表的な見出しと URL が一致する
3. 存在しない band ID と song ID が 404 になる
4. 楽曲詳細で TODO とコメントを操作でき、リロード後にモック初期状態へ戻る

Component test と E2E で同じ細部を二重に検証しません。Component test は入力ごとの分岐、E2E はルーティングと代表的な統合フローを担当します。

## Level 2 — DB / 認証導入時

API、Server Actions、DB、認証・認可、ファイル保存を採用した機能だけに追加します。採用方式はこの文書では決めません。

- 入力検証、状態遷移、権限判定などのドメインロジックを Unit test する
- API / Server Actions の成功、入力エラー、対象なし、競合、再送を Integration test する
- 本番と分離した使い捨てテスト DB で作成・更新・削除・制約・トランザクションを確認する
- 未ログイン、所属外バンド、権限不足、招待期限切れを必ず拒否することを確認する
- 保存後の再読込、別セッションからの参照、同時更新時の挙動を確認する
- ファイル保存は adapter 境界を Unit / Integration test し、許可形式、容量、削除、失敗時を確認する
- E2E では最小のログイン、バンド参加、楽曲・コメント・TODO の永続化フローを確認する
- テストから本番 DB、本番ストレージ、実メール、実決済へ接続しない

権限テストは正常系より優先します。URL や ID を変えて他バンドのデータへアクセスできないことを、API / Server Action と E2E の両方で確認します。

### AUTH-001-DESIGN future authentication contract

AUTH-001実装時は、既存のUI smokeとは別に、次を必須test contractとします。Cognito production resource、実email、Private Alpha dataへtestから接続しません。

- valid login、invalid password、unknown accountのnon-enumerating response
- invitation-gated signup、verified email、14-day expiry、revoke / decline / inviter capability loss、explicit acceptance
- `PENDING → DECLINED`を保存し、validな`DECLINED`を本人がexplicit re-acceptすると`ACCEPTED`になる
- `DECLINED`がexpired、inviter revoked、inviter capability lost、invalid / replacedの場合はre-acceptをdenyする
- `あとで決める`はinvitation stateを変更せず、re-acceptでも全server validationを再実行する
- Membershipはinitial accept / re-acceptのvalidation成功時だけ作成する
- open public signup、link-click-only Membership creation、invalid role、Owner invitationを拒否する
- password reset後のall-session invalidationと、8文字 + uppercase / lowercase / number policy
- 12-hour idle / 7-day absolute session、active renewal、expired screenからsafe route復帰、explicit logout時のhome復帰
- independent multi-device session、current / specified / all-device logout、specified-device protect
- trusted deviceの180-day unused expiry、new-device notification、progressive rate limiting
- Passkey registration / preferred sign-in、password recovery、sensitive operationのstep-up、15-minute strong-reauth reuse
- disabled Cognito userをdenyし、valid Cognito accountでも`BandMembership=REMOVED`なら次requestからBand accessをdeny
- StreamBand Userの`SUSPENDED / DELETION_PENDING / DELETED`をdenyし、provider / Membership stateと混同しない
- tokenのissuer、client / audience、`token_use`、expiry、state、nonce、PKCE mismatchを拒否する
- forged email / User ID / `sub`を無視し、internal User mappingをverified tokenから解決する
- access / ID / refresh token、client secret、authorization code、session cookieをlocalStorage、URL、HTML、logへ置かない
- `__Host-` session cookieのSecure、HttpOnly、SameSite、Path、Domain、expiryを確認する
- external top-level Song / Comment linkでLax sessionを維持し、cross-site mutationをCSRF / Origin ruleで拒否する
- cookie mutationがCSRF token + Origin / Hostを要求し、OAuth state mismatchとwrong callback originを拒否する
- BFFがallowlist外のhost / path / methodへaccess tokenをforwardしない
- nonprod client / callback / sessionでPrivate Alphaへ入れない
- email変更後もinternal User IDとresource ownershipが変わらない
- account deletionが即access停止、30-day recovery、PII anonymization、Former member history、last Owner invariantを守る

Local testではCognito protocol / errorをdeterministic adapterで模擬し、nonprod integration testは専用synthetic userとisolated environmentだけを使用します。認証失効、cookie、callback、email delivery、rate limitの実environment testはAUTH-001 implementation計画で範囲とcleanupを明示します。

### CREATIVE-001-DESIGN future creative workflow contract

Creative workflowの実装時は、制作をblockしないこととVersion history / authorizationを、表示細部より優先して検証します。Physical persistenceが未決定のため、現在はtest追加やfixture変更を行いません。

- old VersionのComment / Creative item Anchorがnew Versionへ自動移動しない
- TaskはVersionをまたいでも自動duplicateせず、originと明示的なcurrent targetを別に保持できる
- unfinished TaskがSong / Version creationをblockしない
- Memo / Idea / Taskをどこからでも作成でき、`Memo ↔ Idea ↔ Task`で相互変換できる
- Task state `OPEN / IN_PROGRESS / DONE / CANCELED`と、`DONE`からのreopenを検証する
- assigneeはoptionalなACTIVE same-Band member 1人だけで、未指定を許可する
- due dateはoptionalで、期限超過してもstateを自動変更しない
- Comment → Taskが元Comment / origin Anchorを保持し、元Commentを削除しない
- same Commentからのretry / double actionでaccidental duplicate Taskを作らない
- Song-level TaskをAnchorなしで作成できる
- time / bar-beatのpointとrange、optional Track、Version整合性を検証する
- Song / Version / Waveform / MIDI contextからAnchorを初期化でき、各dimension解除で同じitemのscopeが自然に広がる
- Anchor密集時にmarkerをclusterし、全annotationでTimelineを覆わない
- playback位置到達やitem arrivalがmodal、focus steal、playback auto-stop、forced acknowledgementを起こさない
- Focus Modeはcreative dataを削除・mutateせず、user操作で表示だけを隠す
- Cross-Band UserがCreative itemをread / mutateできず、forged Song / Version / Anchor relationshipを拒否する
- removed Memberがold Task / Comment URLを知っていても、strong ACTIVE Membership checkで次requestから拒否される
- Proposal DecisionがIdea、Task、SOURCE_MIDI、SongVersionを自動変更しない
- 完了率や期限超過をVersion作成条件・productivity scoreとして扱わない

Integration testは将来承認されたAUTHZ capabilityとphysical modelを使い、private content、実user、未公開曲をfixture / logへ入れません。

### CREATIVE-SURFACE-001 current prototype coverage

Song Detailの非永続prototypeは、Component testとChromium E2Eで次を確認します。これはruntime authorization、API、DynamoDB persistenceのtestではありません。

- Memo / Idea / Taskを同じCreative Boardに表示し、Task-only metadataをMemo / Ideaへ表示しない
- `すべて / Memo / Idea / Task` filterがbrowser local stateだけで表示を切り替える
- Focus ModeがCreative itemとTimeline markerの表示だけを隠し、OFFへ戻すと同じitemが復元される
- 追加入口とComment → Task候補が、保存・通信・変換未実装であることを明示する
- Song DetailからCreative Boardへ到達でき、320 / 375 / 390 / 768 / 1280pxでpage-level horizontal overflowを起こさない
- Focus Modeがplayback、Task state、notification、authorization、Version作成へ影響しない境界をUI copyで示す

既存の楽曲メモ / TODOは比較用に残します。統合方針、server-side Comment → Task、role enforcement、persistent filter / Focus stateは後続taskです。

### CREATIVE-AUTHZ-001 future authorization contract

Creative item実装では、CREATIVE-AUTHZ-001のrole bundleをserver-side table-driven testにし、UI表示やcreator / assignee fieldだけではpermissionが増えないことを検証します。現在はdocs-onlyで、runtime test / fixture / DB schemaを追加しません。

- `Owner / Admin / Editor / Commenter / Guest`の各capabilityをallow / conditional / denyまでparameterized testする
- GuestはCreative itemをviewできるが、create / edit / convert / Task mutation / link / delete / Audit readをすべてdenyされる
- CommenterはMemo / Ideaを作成し、自分のMemo / Ideaだけをedit / Memo ↔ Idea変換 / Anchor更新できる。Direct Task createと一般Task mutationはdenyされる
- Commenterは自分のnon-tombstoned Commentからだけunassigned `OPEN / NORMAL` Taskを作れ、他人Commentからの変換はdenyされる
- Owner / Admin / Editorは通常のCreative item edit / conversionとTask state / assignee / priority / due / Anchorを更新できる
- Editorが他人作成itemをdeleteできず、Owner / Adminだけがshared itemのlogical deletion requestを行える
- Editorのself-deleteとCommenterのown Memo / Idea deleteは、他member history / linkがある場合にdenyされる
- Owner / Admin / EditorはTaskを`CANCELED`へ「不要にする」ことができ、`DONE / CANCELED`からreopenできる。Commenter / Guestはdenyされる
- Cross-Band item / Song / Version / Anchor / source Comment mismatchとforged client `bandId`を404候補でdenyする
- inactive / REMOVED memberはcreator / author / assigneeでも次のprotected requestからread / mutationをdenyされる
- Assigneeに設定されてもrole capabilityは増えず、Guest / CommenterがTask status permissionを取得しない
- Stale `expectedRevision`は409となり、他memberの本文 / kind / state / assignmentをsilent overwriteしない
- Payloadは有効でもcurrent stateから不可能なTask transitionは409、不正enum / date / Anchor inputは422となる
- Same Commentに対するretry / double actionは同じlinked Taskへ収束し、accidental duplicateを作らない
- Source Comment authorとTask creatorが異なっても両attributionを保持し、元Commentをedit / tombstoneしない
- Former memberはmutationできず、authorized remaining memberには共有production historyが残り、account deletion後の表示はanonymization contractに従う
- Unfinished / DONE / CANCELED Taskとauthorization denialのAuditを、Version作成blockや個人生産性scoreへ使用しない

Logical deletion / tombstone、link / history判定、removed assignee reconciliation、idempotencyのphysical integration testはCREATIVE-DATA-001でschemaを承認した後に追加します。

### CREATIVE-DATA-001 future persistence contract

DEC-025のdocs-only designは承認済みです。別実装taskではDynamoDB Local / test repository等のAWS connectionを使わないfixtureから始め、次をphysical integration testへ追加します。このtaskではtable、runtime schema、test codeを追加しません。

- Memo / Idea / Taskが1つのCreativeItem canonical keyを使い、kind変換でも`creativeItemId / createdBy / originAnchor`が変わらない
- Memo / Idea itemへTask-only status、assignee、priority、due、completion fieldを不要に保存しない
- Task → Memo / Ideaでcurrent Task-only fieldsが除去され、Taskへ再変換してもstale assignment / DONE stateを自動復元しない
- Song Board Queryがexisting `ScopeIndex`だけを使い、`Scan`や新GSIへ依存しない
- GSI list candidateをcanonical BatchGetし、DELETED / cross-Song itemを除外してから返す
- Eventual GSI resultやclient supplied `bandId`だけではauthorizeせず、protected mutation前にcanonical itemとstrong ACTIVE Membershipを確認する
- List / kind / status filterがopaque cursorでpaginateし、bounded continuation後もcursorを失わない
- Comment → Taskの同一operation retry、double tap、異なるclientOperationIdが1つのguard / Taskへ収束する
- 同じidempotency key + 異なるcanonical inputが409になり、raw title / bodyをlogしない
- Comment → TaskのCreativeItem / uniqueness guard / relationship / history / Auditがtransaction failure時に部分作成されない
- Linked Taskをlogical deleteしてもComment guardが残り、同じCommentから黙って再作成できない
- General Comment linkがedge itemとしてpaginateされ、CreativeItem METAへunbounded arrayを作らない
- Missing / tombstoned / cross-Band Commentとのlinkをdenyし、link作成とself-delete guard fieldをatomicに更新する
- Optional origin / current target Anchorがcanonical Song / Version / Trackへ属し、old Version anchorを自動remapしない
- AnchorなしSong-level itemが正常で、current targetだけを変更してもorigin historyが残る
- Assignee MembershipがACTIVEかつ保存membershipIdと一致するときだけcurrent assigneeとして返る
- Membership removal後に全Task fan-out updateなしでunassignedへ投影され、new Membershipでrejoinしてもold assignmentが復活しない
- Assignee reference、creator、source Comment IDを知ることがrole capabilityを付与しない
- `revision = expectedRevision`のconditionがkind / state / assignee / priority / due / Anchor / deleteのstale writeを409にする
- Logical deleteでGSI keysを外し、direct Getはprivate title / body / Anchorを含まないsafe tombstoneを返す
- Editor / Commenterのself-delete guardがcreator以外のhistory、Comment link、source Comment relationshipを検出してfail closedにする
- Creator以外がtitle / bodyを一度編集した後は`hasExternalContribution`がmonotonicに`true`となり、creatorのconditional self-deleteをdenyする
- Creator以外によるkind / Task state / reopen / unnecessary / assignment / priority / due / Anchor / Comment link等のstructural mutation後もconditional self-deleteをdenyする
- Creator自身だけによるtitle / body editまたはその他mutationでは、`hasExternalContribution`を`false`から`true`へ変更しない
- Owner / Adminのshared logical deleteでもhard purge、relationship cascade、restoreを暗黙に実行しない
- Structural eventとAuditEventがsafe code / opaque IDだけを持ち、creative本文、Comment本文、signed URL、object key、tokenを複製しない
- Transactionが100 unique item / 4 MBを超えるunbounded batchを受け付けず、large collectionsをpaginateする
- Unfinished / DONE / CANCELED Creative itemがSongVersion作成をblockせず、history eventをproductivity scoreへ利用しない

### COLLAB-001-DESIGN future membership / notification contract

Membership lifecycleとNotificationを実装する場合は、sessionやclient表示ではなくstrong Membership / canonical sourceを正として次を検証します。現在はtest code、provider、AWS resourceを追加しません。

- Admin / Editor / Commenter / Guestが自分のACTIVE Membershipをexplicit confirmation後にleaveできる
- last ACTIVE Ownerのleaveをdenyし、ownership transfer後ならformer Ownerがleaveできる
- OwnerはAdmin / Editor / Commenter / Guestをremoveできる
- AdminはEditor / Commenter / Guestをremoveでき、Owner / peer Admin removeをdenyする
- Editor / Commenter / Guestによるmember removeをdenyする
- leave / remove後は次のprotected requestからdenyし、old shared URLやstale sessionでaccessできない
- leave / remove後もComment、Proposal / Decision、Version contribution等のshared historyを保持する
- removed memberのself-rejoinをdenyし、新しいinvitation + explicit acceptanceを要求する
- Activity Status変更でRole、capability、Membership state、access、Task assigneeが変わらない
- Activity Status変更でNotification preset / frequency / Quiet Hoursが変わらない
- Notification preset / frequency変更でauthorization Role / capabilityが変わらない
- Quiet Hoursでordinary deliveryをhold / digestでき、in-app historyは保持できる
- security-critical notificationはordinary presetでOFFにならず、Quiet Hoursをbypassする候補を検証する
- NotificationをREADにしてもTask、Proposal、Invitation等のsource stateが変わらない
- ordinary Notificationの90日cleanupがsource entityを削除せず、Security notification / Auditへ誤適用されない
- action-required表示がcurrent source stateと整合し、stale Notificationだけでworkflowを変更しない
- deep linkごとにcanonical source authorizationを再検証する
- removed Memberがold Notification linkからBandへ入れず、cross-Band sourceを404候補でdenyする
- Notification ownershipだけではBand accessを許可せず、signed URL / S3 key / tokenをpayloadやlogへ保存しない

Email / push provider、digest scheduler、physical TTL / index、delivery retryのintegration testは、それぞれの実装方式とisolated environmentが承認された後に追加します。

## Level 3 — 一般公開前

- 本番相当環境で主要ユーザーフローを E2E 確認する
- Chromium、Firefox、WebKit の主要ブラウザ構成で full E2E を実行する
- PC と主要モバイル viewport でナビゲーション、横スクロール、タップ操作を確認する
- 自動アクセシビリティ検査に加え、キーボード、フォーカス順、読み上げを手動確認する
- 認証失効、他バンドへのアクセス拒否、退会、メンバー削除、招待期限切れを確認する
- 通信失敗、タイムアウト、再試行、競合、二重送信時の利用者向け表示を確認する
- ファイルの許可形式、容量超過、中断、取得、削除、権限切れ URL を確認する
- マイグレーション、バックアップ復旧、ロールバックを本番と分離した環境で確認する
- 必要性が確認できた画面だけ visual regression を導入する

## PR ごとの必須チェック

### BRIDGE-006 導入直後

テストツールがまだない段階では、`.github/workflows/ci.yml` の `PR Quality Checks` を main 向け Pull Request で実行します。CI の Node.js は `24` を使用します。Next.js `16.3.0` の要件である Node.js `>=20.9.0` を満たし、導入時点で公式 LTS の安定 major だからです。ローカル開発全体の標準 version と更新方針は別途決定します。

1. `npm ci`
2. `npm run lint`
3. `npm run build`

workflow は `contents: read` だけを許可し、`actions/checkout@v7` と `actions/setup-node@v7`、npm cache を使用します。CI では標準の `npm run build` を使用します。Codex 実行環境固有の Turbopack `EPERM` 回避で使う `npm run build -- --webpack` を、CI の既定へ無条件に持ち込みません。

### BRIDGE-008 導入後

次をPRの必須チェックへ追加します。

4. `npm run test:run`でComponent testをwatchなしで1回実行する
5. `npx playwright install --with-deps chromium`でChromiumだけを準備する
6. `npm run test:e2e`でproduction buildに対するChromium smoke testを実行する

1つのCI jobで、install、lint、Component test、build、Chromium導入、E2Eの順に実行します。所要時間が問題になった場合だけjob分割を検討します。Playwrightの出力は `.next/playwright-results` に置き、artifact uploadはまだ行いません。

## 毎回実行しない重い確認

次は手動実行、定期実行、リリース前、または関連領域を変更した PR に限定します。

- Playwright の Chromium / Firefox / WebKit 全ブラウザ実行
- 複数の PC / モバイル viewport の全組み合わせ
- visual regression と画像 artifact の比較
- カバレッジ計測とレポート生成
- 大量データ、長時間、並行操作、性能、負荷の確認
- Level 2 の DB・認証・ファイルを含む full integration suite

## 現在のPR CI

- GitHub Actionsは `.github/workflows/ci.yml` の `PR Quality Checks` で実行する
- Node.js `24` と npm cache を使用する
- root `package-lock.json`と`infra/package-lock.json`の両方をnpm cache keyへ含め、各packageで個別に`npm ci`する
- 独立`infra/` packageは`npm run check`でTypeScript build、Vitest、`--no-lookups`のoffline CDK synthを実行する
- infra checkはAWS credentialを必要とせず、AWS lookup、resource作成、CDK bootstrap / deployを行わない
- workflow へ秘密情報や本番接続を追加しない
- 現在の`Quality checks`は`contents: read`だけを維持し、AWS OIDC tokenを要求しない。将来のdeploymentは通常PRから分離したworkflow / jobでのみ`id-token: write`を付け、protected `main`と`nonprod` Environment gateを必要とする設計候補とする
- `id-token: write`はOIDC token要求を許可するjob permissionであり、repository write権限ではない。ただしAWS role assumptionへつながるため、全CI jobへ広げない
- 20 分の timeout と同一 PR の古い実行キャンセルを設定する
- root `npm ci`、infra `npm ci` / check、lint、Component test、build、Chromium smoke E2Eを1つのrequired jobで順に実行する
- full browser matrix は定期または手動 workflow として分離する

## BRIDGE-008 の実装範囲

- Component testは `SongFilterPanel`、`TaskChecklist`、`MockCommentComposer` を対象にする
- E2Eは主要画面遷移、band/songの404、検索、TODO、コメント、非永続状態のリロード確認に限定する
- async Server ComponentsをComponent testせず、動的ページと404はE2Eで確認する
- Playwright projectはChromium 1種類だけにする
- watch 用と CI の 1 回実行用 script を分ける
- Level 2 / 3、coverage threshold、visual regression、browser matrixは追加しない

## 見直し条件

- API / Server Actions、DB、認証・認可、ファイル保存のいずれかを導入するとき
- test suite が PR の待ち時間や flaky failure の主因になったとき
- Next.js、React、Node.js、テストツールの major version を更新するとき
- β版または一般公開の準備を始めるとき

## 参考資料

- [Next.js: Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js: Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Playwright: Web server](https://playwright.dev/docs/test-webserver)
- [Playwright: Continuous Integration](https://playwright.dev/docs/ci)
- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
