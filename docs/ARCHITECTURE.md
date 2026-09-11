# Architecture

## 文書の位置付け

現在の実装事実と、将来の構成候補を分けて共有する文書です。UI プロトタイプと非永続インタラクションは実装済みですが、DB、API / Server Actions、認証・認可、AWS、ストレージ、課金、本番デプロイは未実装です。将来候補は採用済みと扱わず、各領域の比較・承認・実装を別タスクに分けます。

## 現在採用済みの構成

`package.json`、`package-lock.json`、`src/app` の現在の内容から確認できる構成は次のとおりです。

- Next.js `16.3.0`
- React / React DOM `19.2.8`
- TypeScript `^5`
- Tailwind CSS `^4`
- ESLint `^9` と `eslint-config-next` `16.3.0`
- npm（`package-lock.json` を使用）
- Next.js App Router（`src/app`）
- GitHub Actions（main 向け Pull Request で Node.js `24`、`npm ci`、lint、Component test、build、Chromium smoke E2Eを実行）
- Vitest `4.1.11`、React Testing Library `16.3.3`、jsdom `30.0.1`
- Playwright Test `1.62.1`（初期E2EはChromiumのみ）

現在は `/`、`/dashboard`、`/bands`、`/bands/[bandId]`、`/bands/[bandId]/songs`、`/songs/[songId]` を実装しています。ページ表示は主に Server Components、検索・絞り込み・コメント一時追加・TODO 切り替えは Client Components で構成されています。データは `src/lib/mock-data.ts` の静的モックだけを使用し、通信や永続化は行いません。

## 設計方針

- 初心者 2 人が理解・レビューできる単純な構成を優先する
- まず UI プロトタイプをモックデータで作り、利用体験を検証する
- フロントエンド、データアクセス、外部サービスの境界を分ける
- ユーザー入力とサーバー側の両方で検証し、権限確認を UI だけに任せない
- 高リスク領域は最小権限、非公開、低コストを既定にする
- 技術採用は `DECISION_LOG.md` に理由と見直し条件を残す

## 仮の全体構成

1. ブラウザ
   - PC / スマートフォンからレスポンシブ UI を利用する
2. Next.js アプリ
   - 画面、ルーティング、サーバー側処理の入口を担当する想定
3. アプリケーション層
   - バンド、楽曲、コメント、TODO などのルールをまとめる想定
4. データ層
   - 将来の DB への読み書きを分離する想定
5. 外部サービス
   - 将来の認証、ファイルストレージ、監視など。採用未定

## 採用済みのフロントエンド

### Next.js / React

- Web アプリのルーティングと画面表示に Next.js App Router を使用している
- 現在の画面は React Server Components を基本とし、ブラウザ内状態が必要な箇所だけ Client Components を使用している
- Server / Client Component の境界を必要最小限にし、理由なくクライアント処理を増やさない

### TypeScript

- 画面とモックデータの型定義に使用している
- `any` に頼らず、外部入力は実行時にも検証する
- UI 用の型と DB 固有の型を直接結び付けすぎない

### Tailwind CSS

- レスポンシブ UI と共通スタイルに使用している
- 色、余白、文字サイズを共通化し、画面ごとの任意値を増やしすぎない
- アクセシビリティと読みやすさをデザインの要件に含める

## 現在未実装のアプリケーション領域

- API Route Handlers / Server Actions / 別バックエンド
- DB、ORM、スキーマ、マイグレーション
- 認証、セッション、招待、認可
- ファイルのアップロード、保存、ダウンロード
- AWS、S3、その他のクラウド構成
- Stripe、課金、請求
- 本番ホスティング、監視、バックアップ

## Phase 2 target architecture（CLOUD-001 planning baseline）

以下のservice方向はCLOUD-001 / PR #22 review後の人間承認済みplanning baselineです。現在の実装事実ではなく、resource作成、credential設定、application integration、deploymentは未実施で、それぞれ人の承認と専用taskを必要とします。

```text
Next.js Web Hosting (Vercel Pro approved candidate / connection not approved)
          |
          v
API Gateway HTTP API
          |
          v
AWS Lambda application boundary
  |       |       |
  |       |       +--> CloudWatch logs / metrics
  |       +----------> private S3 Assets
  +------------------> DynamoDB On-Demand metadata

Cognito User Pool: identity / authentication
Application Membership: Band authorization
AWS Budgets: delayed cost alerts
```

### MVP target

- Authentication: Amazon Cognito User Pool。controlledな2 user、email verification、sign in / out、password reset、sessionを候補とする
- Authorization: BandMembershipをapplication dataとして持ち、Lambdaがrequestごとにcapabilityとresource ownershipを確認する
- API: API Gateway HTTP API + Lambdaをshared core API候補とし、DATA-002のruntime validation、revision、idempotencyを適用する
- Metadata: DynamoDB On-DemandをPrivate Alphaの第一候補とし、logical entityとphysical table / key設計を分離する
- Files: S3 private object、Block Public Access、server-controlled opaque key、短時間upload / access instruction
- Operations: CloudWatchの有限保持log / metrics、AWS Budgetsのactual / forecast warning、backup / restore runbook
- Region: 日本中心の単一Regionとして`ap-northeast-1`を第一候補にし、service availabilityと価格を実装直前に再確認する

### Defer

- CloudFront、WebSocket、server transcoding、formal invitation email、notification
- Companion App、VST3 / AU、Studio One自動連携、WebRTC、realtime co-editing
- always-on server、NAT Gateway、ALB、ECS、OpenSearch、provisioned RDS、ElastiCache、EKS

CloudFrontはPrivate Alphaの実測でS3 short-lived accessにlatency / cache / transfer上の問題が出た時だけ再評価します。WebSocketはreview loopの完成条件ではないため導入しません。

### Environment boundary

- Local: mock / synthetic dataだけを使い、実credentialや未公開音源を置かない
- AWS nonprod: synthetic / disposable dataでAuth、API、DB、Storage、failureを検証する
- Private Alpha: 本物の未公開曲を扱うisolated environment

本物の未公開曲を入れる前に、Private Alphaをnonprodと別AWS accountへ分離することを推奨します。同一accountを続ける場合はhuman risk acceptanceを必須とし、data、IAM、resource、budgetを混在させません。

### Web hosting target（HOST-001 approved candidate）

HOST-001 / PR #24で、**Vercel ProをPrivate Alpha primary hosting candidate**、**AWS Amplify Hostingを条件付きfallback**として承認しました。候補承認は契約、account接続、project、domain、credential、料金発生、deploymentの承認ではなく、これらは未実施です。比較とsecurity / release gateの詳細は[HOSTING.md](HOSTING.md)を参照します。

- VercelはNext.jsのverified adapterで、Next.js `16.3.0`へのcompatibility riskと2人teamの運用負荷を抑えやすい
- Vercel Hobbyはpersonal / non-commercial用途に限定されるため、Private Alphaの既定案にしない
- Amplify HostingのAWS公式managed SSR supportは現時点でNext.js 15までのため、Next.js 16 official supportまたはPoC成功までdeploy-ready fallbackとしない
- AWS-native Node.js / DockerはNext.js機能を実行できるが、reverse proxy、runtime、cache、rollback、monitoringの運用範囲が大きいためlast resortとする
- Previewはprotectedなnonprod / synthetic dataだけに限定し、Private AlphaはCognito + application authorization完成前にreal unreleased dataを扱わない
- production releaseは`Quality checks`済みのimmutable commitをhumanが明示promoteする候補とし、hosting rollbackとdata recoveryを分離する

Vercel Proのbase / usage costはPrivate Alphaの通常目標を超える可能性があるため、current price、tax、為替、seat、protection add-onをaccount接続直前に再確認し、human cost acceptanceを必須にします。

### Foundation / Infrastructure as Code boundary

CLOUD-003BではAWS CDK + TypeScriptを採用し、repository rootの独立`infra/` packageにapplication sourceと分離したtoolchainを置きます。現時点の`StreamBandNonprodFoundation`はresourceを定義しない空Stackで、unit testと`--no-lookups`のoffline synthだけを対象とします。

- environment: `local`、AWS `nonprod`、`private-alpha`だけを初期境界とする
- account: 本物の未公開曲を入れる前にnonprodとPrivate Alphaを別AWS accountへ分ける
- credential: local human bootstrap identity、GitHub Actions OIDC deployment identity、CloudFormation execution roleを別主体として扱う。GitHub deploymentはrepositoryと`nonprod` Environmentを限定したshort-lived OIDC sessionを第一候補とし、long-lived access keyを使わない
- deployment: nonprod / Private Alphaのrole、stack、approvalを分離し、Private Alphaのunattended destroyを禁止する
- rollback: application、infrastructure、data recoveryを分け、IaC rollbackをuser data restoreと見なさない
- source layout: repository rootの`infra/`をapp packageや`src/**`と分離する。root npm workspaceやroot dependencyには含めない

AWSへの接続、account binding、IAM / OIDC、Budgets、bootstrap resource、deployed stack、deployment workflowは未作成です。通常のPR `Quality checks`はAWS accessを持たず、将来のdeploymentはprotected `main`から別workflow / jobと`nonprod` Environment gateを通す設計候補です。最初のAWS接続とbootstrapはCLOUD-003C、OIDC provider / role / workflowは別Human Gateです。詳細は[AWS.md](AWS.md)のCLOUD-002 / CLOUD-003章を参照します。

## 自動テスト

初期テスト構成として、Unit test runner に Vitest、Client Components の Component testing に React Testing Library + jsdom、ブラウザ E2E に Playwright を使用しています。async Server Components で構成された動的ページや 404 は直接の Component test ではなく、Playwright で確認します。

テスト方針はBRIDGE-005 / PR #6、基本CIはBRIDGE-006 / PR #7、Level 1自動テストはBRIDGE-008 / PR #8でmainへマージ済みです。Client ComponentsをVitest / React Testing Library、async Server Components・動的ルート・404・主要導線をPlaywrightで確認します。PR CIは `npm ci`、lint、Component test、標準build、Chromium smoke E2Eを実行します。対象と実行タイミングの詳細は [TESTING.md](TESTING.md) に記載します。

## 将来的な DB 候補

CLOUD-001 reviewではPrivate Alphaのlow fixed costとserverless運用を優先し、DynamoDB On-Demandをprimary target、managed PostgreSQLをfallback比較対象とする方向が人間承認されました。resourceは未作成で、物理schemaはCLOUD-DATA-001のreview後に決めます。

比較項目:

- DynamoDB On-Demandのrequest連動cost、capacity management削減、access-pattern / index設計負担
- managed PostgreSQLのrelation / join / constraint、local development、migrationの分かりやすさとminimum compute / connection運用
- backup / PITR、restore test、export / migration
- transaction、conditional write、idempotency、optimistic concurrency
- 利用地域、data protection、停止方法、vendor coupling

詳細なテーブル候補は [DATABASE.md](DATABASE.md) に記載します。

## 将来的な認証候補

CLOUD-001 reviewではAmazon Cognito User PoolsをPrivate Alphaのprimary targetとする方向が人間承認されました。AUTH-001-DESIGNでは、controlled user、Cognito Managed Login、Authorization Code + PKCE、Vercel上のsame-origin confidential BFF、server-side token/session、opaque HttpOnly cookieをWeb MVPの具体候補として選択しました。これは提案中の設計であり、resourceとintegrationは未実装です。Auth.js、Clerk、Supabase Authなどは、CognitoやBFF構成に要件不適合が判明した場合の再検討候補です。

比較項目:

- セッション管理と安全な Cookie 設定
- メール確認、パスワード再設定、招待の実装負担
- MFA、アカウント停止・削除への対応
- 料金と無料枠終了時の影響
- Next.js との統合、テスト、移行性

認証だけでなく、「誰がどのバンド・楽曲へアクセスできるか」という認可を別に設計します。

```text
Browser
→ same-origin BFF session
→ Cognito authentication
→ internal User mapping
→ canonical resource
→ strong ACTIVE BandMembership
→ server capability authorization
```

- Cognito `sub`、email、groupをStreamBand public User IDやBand roleにしない
- access / ID / refresh tokenはbrowser JavaScriptへ渡さず、cookieにはopaque session IDだけを置く候補
- BandMembership removalはCognito accountを削除せず、次のprotected requestで即時denyする
- Companion / native clientは将来別のpublic app clientをreviewし、Web BFF client secretやcookieを共有しない
- local / nonprod / Private Alphaのidentity resource、callback、session namespaceを分離する

## Phase 2の AWS target

- Cognito: controlled userのauthentication target。Band authorizationはapplication responsibility
- API Gateway HTTP API + Lambda: core application API target
- DynamoDB On-Demand: metadata target。physical designは未決定
- S3: 非公開の音源 / MIDI file storage target
- CloudWatch: 有限保持のログ、メトリクス、アラームtarget
- AWS Budgets: hard capではない費用warning target
- CloudFront: Private AlphaではDEFER
- API Gateway WebSocket: Private AlphaではDEFER
- Route 53: DNS 管理候補
- IAM: 人とサービスの最小権限管理

これらはplanning targetであり、resourceは未作成です。具体的な利用条件は [AWS.md](AWS.md) に記載します。

## 想定する責務の分け方

- `app`: ルート、画面構成、サーバー処理の入口
- `components`: 再利用する UI 部品
- `features`: 機能単位の UI・処理（採用する場合）
- `lib`: 外部サービスや共通処理との境界
- `types` / schema: 共有型や入力検証（配置は初期実装時に決定）
- `docs`: 仕様、判断、運用手順

実際のフォルダ構成は、Next.js 初期化タスクで小さく始め、必要になるまで階層を増やしません。

## まだ確定していないこと

- Node.js のローカル標準運用バージョンと更新方針（CI は `24`）
- Level 2 / 3のテスト構成、カバレッジ運用
- DynamoDBの実resource、migration / export、restore運用
- Cognito / BFFのsession store、token encryption、runtime service identity、client secret管理、callback実値
- public invitation / self-signup、Private Alpha MFA / recovery、account deletion / export
- API Gateway + LambdaとBFF間のruntime credential、token validation / revocation実装
- S3実resource、Private Alpha encryption / retention、scan、multipart
- Vercel Proの採用、account / project境界、current cost、production protection / promotion方式。AmplifyのNext.js 16 support
- CDK採用、account bootstrap、deployment方式
- ログ保持期間、alarm threshold、backup / restore detail
- 本番公開、課金、利用規約、プライバシー対応

## 変更管理

未決事項を決めるときは、候補、費用、安全性、運用負荷、移行性を比較し、`DECISION_LOG.md` に記録します。DB、認証、AWS、課金の実装は、それぞれ独立したタスクと PR にします。
