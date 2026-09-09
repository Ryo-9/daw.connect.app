# Private Alpha Web Hosting

## この文書の役割

この文書は、`HOST-001`でStreamBandの2026年Private Alpha向けNext.js Web Hosting候補を比較し、account接続やdeploymentを始める前のhuman review材料をまとめます。2026-09-10時点の公式資料と、repositoryのNext.js `16.3.0` / App Router構成を基準にしています。

ここで扱う内容は**提案中のhosting方針**です。Vercel / AWSへのaccount接続、project、domain、credential、environment variable、GitHub App、deployment、AWS resourceは作成していません。承認済みのCloud targetと未実装の境界は[ARCHITECTURE.md](ARCHITECTURE.md)と[AWS.md](AWS.md)を参照します。

## Decision summary

| 項目 | HOST-001推奨案 | 状態 |
| --- | --- | --- |
| Primary candidate | **Vercel Pro** | human approval pending |
| Conditional fallback | **AWS Amplify Hosting** | Next.js 16のofficial supportまたは実環境PoC成功が条件。現時点ではdeploy-readyではない |
| Last-resort candidate | AWS上のsingle Node.js / Docker self-hosting | 別architecture / cost / operations taskなしでは採用しない |
| Static export | 不採用候補 | future Auth / request-time / server featureを制約するため |
| Private data boundary | Cognito identity + application authorization + API Gateway / Lambda | hosting protectionだけに依存しない |
| Preview data | nonprodのsynthetic dataのみ | real unreleased dataへ接続しない |
| Private Alpha release | reviewed immutable commitをhumanが明示promote | mergeだけでcustom production domainへ自動公開しない候補 |

Vercelを第一候補にする最大の理由は、Next.jsの公式guideでverified adapterとして扱われ、現在のNext.js 16に対するcompatibility riskと2人teamのhosting運用を最小化できるためです。Vercel固有APIへbusiness logicを置かず、browser / Next.jsからCognitoとAPI Gateway HTTP APIのdocumented contractへ接続すれば、backendとdomainを維持したままhostingを移しやすくできます。

ただしVercel Hobbyはpersonal / non-commercial用途に限定されるため、StreamBand Private Alphaの既定案にしません。Vercel Proのbase priceとusage、tax、為替、必要seat、deployment protection add-onを接続直前に再見積もりし、CLOUD-001のbudget guardrailに対するhuman cost acceptanceを必要とします。

Amplify HostingはAWS内に集約でき、pay-as-you-go、branch deployment、PR preview、password access controlが魅力です。一方、AWS公式documentationは現在Next.js 12〜15をmanaged SSR support範囲としており、repositoryのNext.js `16.3.0`を保証していません。Next.jsをhosting都合だけでdowngradeせず、official support更新とPoCをfallback gateにします。

## Current repository facts

- framework: Next.js `16.3.0`、React `19.2.8`、App Router、npm
- scripts: `npm run build`と`npm run start`があり、標準Node.js server要件を満たす
- config: `next.config.ts`にhosting固有設定なし
- current rendering: Server Components中心、Client Componentsは一時interactionだけ
- current data: `src/lib/mock-data.ts`だけ。API、Auth、DB、S3、runtime persistenceなし
- routes: static / generated dynamic routesを含むが、Phase 2ではAuth、request-time data、server boundaryが加わる予定
- CI: PRでlint、Component test、標準Next.js build、Chromium E2Eを実行

現在の画面だけならstatic exportの検討余地はありますが、Phase 2 targetとのcompatibilityを判断基準にします。静的化のためにAuth / server rendering / middleware相当の設計を曲げません。

## Options comparison

| criterion | Vercel Pro | AWS Amplify Hosting | AWS-native Node.js / Docker |
| --- | --- | --- | --- |
| Next.js 16 compatibility | Next.js verified adapter。major releaseとのcoordinated testがある | AWS公式managed SSR supportは現時点でNext.js 15まで。16.3.0は未保証 | `next start` / Dockerは全機能を実行可能だが、platform設計と検証はteam責任 |
| setup / operations | Git連携、build、CDN、TLS、runtimeをmanaged。2人teamに最小 | Git連携、build、CDN、atomic deployをAWS内でmanaged | reverse proxy、TLS、runtime patch、health、scaling、cache、log、alarmを設計 |
| PR preview | push / PRごとのunique preview。protected preview候補あり | PR web previewあり。GitHub Appとbranch設定が必要 | build / route / cleanupを自作 |
| production release | staged production、manual promote、instant rollback候補 | branch deployと過去buildのredeploy候補 | image / artifact promotionとtraffic switchを自作 |
| access protection | previewはVercel Authentication候補。production URL全体のplatform protectionはplan / add-on確認が必要 | branch単位のpassword access control候補 | reverse proxy / WAF / identity-aware accessを自作 |
| AWS backend | public HTTPS API Gateway + Cognito token。CORS / callback originを明示 | AWS内のrole / Cognito連携余地。ただしhosting AuthとBand authorizationは分離 | flexibleだがIAM、network、runtime credential範囲が増える |
| secrets / config | Preview / Productionを分離し、server-only値だけplatform secret候補 | build envをsecret storeと混同しない。SSRのAWS accessはrole優先 | secret manager、runtime injection、rotationを自作 |
| logs / observability | build / runtime log。保持とexportはplan依存。AWS API logはCloudWatch | build / access / compute logをAWS側で集約しやすい | collection、redaction、retention、alertを自作 |
| cost shape | Pro base charge + usage + optional protection。Hobbyは非商用限定 | build、storage、transfer、SSR request / durationのpay-as-you-go | compute、load balancing、CDN、logs等。idle costと運用時間が増えやすい |
| migration | standard Next.jsとexternal API contractを維持すれば比較的移しやすい | Amplify build / branch / role設定を分離すれば移行可能 | standard Node / Docker artifactはportableだがinfra移行が大きい |
| main risk | recurring cost、cross-provider config、production protectionのplan条件 | Next.js 16 support gap、framework追従、build/runtime差 | security / availability / rollback / cacheの運用負担 |

## Primary candidate: Vercel Pro

### Adoption conditions

次をすべて満たすPoCとhuman review後だけproject接続へ進みます。

1. exact Next.js `16.3.0` commitで標準`npm run build`が成功する
2. App Router、dynamic route、404、Client interaction、将来使うrequest-time / auth patternのcompatibilityを確認する
3. Preview deploymentをVercel Authentication等で保護し、private-alpha AWS backendへ接続しない
4. Private AlphaはCognito sign-inとserver-side application authorizationが完成するまでreal dataを扱わない
5. production releaseを`Quality checks`成功済みcommitのmanual promotionに限定できる
6. production / previewのconfig、Cognito callback URL、API CORS allowlistを分離できる
7. current price、tax、為替、seat、usage、protection costを確認し、humanがbudget impactを承認する
8. rollback drill、log redaction、incident owner、account offboardingを確認する

### Environment and project boundary candidate

| hosting boundary | backend | data | release rule |
| --- | --- | --- | --- |
| Local | local mock | synthetic only | deploymentなし |
| Vercel Preview / nonprod project | AWS nonprodまたはmock | synthetic only | PRごとのprotected preview。閉じたPRのcleanupを確認 |
| Vercel Private Alpha project / production | isolated private-alpha AWS account | authorized unreleased data | reviewed commitをhumanが明示promote。automatic public releaseを既定にしない |

nonprodとPrivate Alphaを別Vercel projectにする案を第一候補とします。environment variable、Git integration、deployment protection、domain、log accessの誤設定がreal dataへ波及するriskを減らすためです。同じteamを使うかも含め、project / member / billing ownerは接続taskで承認します。

PR previewはreview convenienceであり、security / functional acceptanceの代わりではありません。Preview URLにはmock / synthetic dataだけを出し、Private AlphaのCognito client、API endpoint、signed Asset URL、secretを渡しません。

### Release and rollback candidate

```text
Pull Request
→ Quality checks
→ protected Preview review
→ main merge
→ staged production build
→ smoke / config review
→ human promotion to Private Alpha domain
```

- `main` mergeだけでPrivate Alpha custom domainへ自動promoteしない候補とする
- promotion対象はreview済みのimmutable commit / deployment IDで確認する
- rollbackはprevious known-good deploymentへのdomain reassignmentを第一手段とする
- rollback時にenvironment variableやexternal AWS dataが自動で戻ると仮定しない
- schema / data / Assetのrollbackはhosting rollbackと分離する
- rollback後はnew production deploymentのauto-assignment状態とcurrent domainを再確認する

## Conditional fallback: AWS Amplify Hosting

Amplify Hostingは次のいずれかを満たすまでfallback候補のままにします。

- AWS公式のmanaged SSR support対象にNext.js 16が含まれる
- official adapter / documented deployment routeでNext.js 16.3.0の必要機能をPoCし、人がsupport riskを受け入れる

PoCではApp Router、Server Components、dynamic route、image handling、streaming / response behavior、middleware / proxy相当、build/runtime environment、Cognito redirect、API Gateway access、PR preview、access control、atomic deploy、previous build redeployを確認します。失敗を避けるためNext.jsを15へdowngradeする変更はHOST-001に含めません。

Amplifyを選ぶ場合も、Amplify Auth / Dataへarchitectureを無条件に置き換えません。CLOUD-001で承認済みのCognito identity、API Gateway + Lambda、DynamoDB、private S3というapplication boundaryを維持し、Hostingはfrontend delivery責務に限定します。

## AWS-native self-hosting boundary

Next.js公式guide上、single Node.js serverまたはDockerは全Next.js機能を実行できます。しかしPrivate Alphaでも、reverse proxy、TLS、rate limit、runtime patch、health check、graceful shutdown、image optimization、cache、version skew、rollback、log / alarmをteamが運用する必要があります。複数instanceではServer Function key、deployment ID、shared cache / tag coordinationも考慮が必要です。

この負担は2人のPrivate Alphaに対して大きいため、VercelとAmplifyの両方が採用不能になった場合だけ、専用architecture taskでmanaged container候補、monthly cost、threat model、runbookを比較します。CLOUD-002で避けたALB、always-on ECS、EC2、NAT GatewayをHOST-001から追加しません。

## Security boundary

### Hosting protection is defense in depth

- private Song / Version / Comment / Assetのprimary boundaryはCognito authenticationとLambda側Band authorization
- hosting platformへ到達できることをBand access permissionと見なさない
- unauthorized responseに他Band resourceの存在、metadata、signed URLを含めない
- production HTML / JavaScript bundle、`NEXT_PUBLIC_*`、source mapへsecretやprivate dataを埋めない
- Previewはprotectedでもsynthetic dataだけを使う
- production URL全体のplatform protectionは補助防御としてcost / UX / automation影響をreviewする
- password / sharable linkだけをPrivate Alphaのuser identityとして使わない

VercelのStandard Protectionはpreview / generated deployment URLを保護できますが、production domain protectionの利用条件と追加料金が異なります。高額なprotection add-onを自動採用せず、Cognito application authを完成条件にします。production protectionが必須と判断した場合は、current plan / add-on costを再確認し、project cost guardrailを超えるなら停止してhuman approvalを求めます。

### AWS integration

- browser / Next.jsはdocumented HTTPS API Gateway endpointへ接続し、long-lived AWS access keyを持たない
- Cognito callback / logout URLはstableなallowlistへ限定し、arbitrary PR URLをPrivate Alpha clientへ登録しない
- credential付きCORSで`*`を使わず、approved nonprod / Private Alpha originを分ける
- API Gateway / LambdaはtokenだけでなくBandMembership、resource ownership、allowed operationを毎回検証する
- signed upload / access instructionとAsset metadataはAWS backendが発行し、hosting platformをpublic file originにしない
- SSRからAWSへ直接credential accessが本当に必要になった場合は、long-lived keyを追加せず、workload identity / short-lived roleとBFF boundaryを別taskでreviewする

### Git and platform access

- GitHub integrationは`Ryo-9/daw.connect.app`だけへscopeを限定する
- hosting project owner、billing owner、deployment promoter、log viewerを最小にする
- account recovery、MFA、member removal、lost device、provider outageをrunbook化する
- deployment bypass token、platform token、domain credentialをrepository、docs、PR、chat、screenshotへ記録しない
- preview / build logへtoken、callback code、signed URL、Comment body、未公開曲名を不要に出さない

## Cost review

2026-09-10時点の公開価格ではVercel Proは月額USD 20からで、usage credit / metered usage、追加seat、add-on、税が別条件です。Hobbyはpersonal / non-commercial用途に限定されています。Amplify Hostingはbuild minute、CDN storage / transfer、SSR request / duration等の従量課金です。いずれも価格保証としてdocsへ固定せず、account接続直前に公式priceと実際の想定build / trafficで再計算します。

- Vercel Proのbase costはPrivate Alpha通常目標`¥500〜¥1,500/月`を超える可能性が高いため、compatibility / operational simplicityと引き換えにhuman cost acceptanceが必要
- total projected monthly costが`¥5,000`を超える場合はhosting + AWS usage / resourceを調査する
- `¥10,000`超予測、Advanced Deployment Protection等の高額add-on、追加有料seatは明示human approvalなしで導入しない
- Amplifyのfree allowanceを恒久的なcost guaranteeとして扱わない
- build loop、preview retention、log retention、data transfer、function durationを月次確認対象にする

## Portability and migration

- standard `next build` / `next start`を維持し、business ruleとAWS contractをVercel-only APIへ置かない
- application authorization、data model、Asset accessはAPI Gateway / Lambda側をsource of truthにする
- provider-specific configはapp codeと分離し、追加する場合は専用task / PRで記録する
- custom domain、Cognito callback、CORS originをhosting providerのgenerated URLから分離する
- server-only / public configのinventoryとmigration checklistを保つ。secret valueはinventoryへ書かない
- export可能なbuild / runtime logとdeployment-to-commit mappingを保持する
- provider migration時もnew hostでAuth / API / Asset security testが通るまでDNSを切り替えない

## Human approval gates

- Vercel ProをPrimaryとして採用することとmonthly estimate
- Vercel / Amplify account、team、project、GitHub Appを作成・接続すること
- repository access scope、platform role、MFA / recovery owner
- nonprod / Private Alpha project separationとproduction promotion rule
- environment variable name / visibility、Cognito callback、API CORS origin
- custom domain、DNS、TLS、deployment protection plan / add-on
- first Preview / nonprod deployment、first Private Alpha deployment
- real unreleased dataをPrivate Alphaへ入れること
- rollback drillとincident / offboarding runbook
- Amplifyへのfallback判断、またはAWS-native self-hosting検討開始

## Hosting proof-of-concept acceptance

Hosting account接続を許可する別taskでは、最低限次を確認します。

- exact branch / commit / repository / account / environment
- Next.js `16.3.0` standard buildとexisting Chromium smoke
- protected Previewにsynthetic dataだけが表示される
- generated URL、custom domain、production promotion設定
- no secret in client bundle / build log / deployment metadata
- Cognito callbackとAPI CORSのstable origin設計（resource未作成ならdocument review）
- build / runtime log accessとretention
- previous known-good deploymentへのrollbackと、config / data非rollbackの注意
- current monthly estimate、spend notification、deletion / disconnect手順

## Explicit non-goals

HOST-001では次を行いません。

- Vercel / Amplify / AWS accountへの接続
- hosting project、GitHub App、domain、DNS、certificateの作成
- deployment、preview URL、production URLの作成
- AWS account / IAM / OIDC / Cognito / API Gateway / Lambda / DynamoDB / S3 resource作成
- environment variable、credential、secret、access tokenの追加
- package、runtime code、Next.js config、CI workflowの変更
- Auth / authorization / DB / API / upload / persistenceの実装
- Next.js downgrade、static export化、AWS-native hosting infrastructureの追加

## Official references（2026-09-10確認）

- [Next.js: Deploying](https://nextjs.org/docs/app/getting-started/deploying)
- [Next.js: Deploying to platforms](https://nextjs.org/docs/app/guides/deploying-to-platforms)
- [Next.js: Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Vercel: Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Vercel: Git deployments and Preview deployments](https://vercel.com/docs/git)
- [Vercel: Promoting deployments](https://vercel.com/docs/deployments/promoting-a-deployment)
- [Vercel: Instant Rollback](https://vercel.com/docs/instant-rollback)
- [Vercel: Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Vercel: Plans and pricing](https://vercel.com/docs/plans)
- [AWS Amplify Hosting: Next.js support](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html)
- [AWS Amplify Hosting: PR previews](https://docs.aws.amazon.com/amplify/latest/userguide/pr-previews.html)
- [AWS Amplify Hosting: branch access control](https://docs.aws.amazon.com/amplify/latest/userguide/access-control.html)
- [AWS Amplify Hosting pricing](https://aws.amazon.com/amplify/pricing/)
