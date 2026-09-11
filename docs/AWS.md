# AWS Notes

## 重要

この文書は将来 AWS を使う場合の候補と注意点を整理するメモです。CLOUD-001 / PR #22のreview後、Cognito、API Gateway HTTP API + Lambda、DynamoDB On-Demand、private S3、CloudWatch、AWS BudgetsをPhase 2 Private Alphaのprimary targetとする方向は人間承認済みです。ただしservice resource、account、credential、application integration、deploymentは未作成・未実装で、それぞれ専用taskと承認を必要とします。

## CLOUD-001: Phase 2 Cloud MVP Plan

### 計画の状態

この章の状態語は次の意味です。

- `MVP TARGET`: CLOUD-001 reviewで人間承認されたPrivate Alphaのplanning baseline。resource作成は別taskで再承認する
- `DEFER`: 2026年末の共同制作loopに不要で、必要性が確認されるまで作らない
- `TBD / BLOCKER`: 実装開始またはPrivate Alpha開始前に専用taskで決める

既存のNext.js UI、mock data、Component test、Chromium E2Eは実装済みです。以下のCloud、Auth、DB、API、Storage、monitoring、deploymentはすべて未実装です。

### 2026年末Private Alphaのゴール

開発者本人とStudio Oneを使う友人の2人が、1つのprivate Bandで本物の未公開曲を安全にreviewできる最小loopを成立させます。

```text
Studio Oneで制作
→ Preview / MIDIをmanual export
→ StreamBandへprivate upload
→ 許可された友人がbrowserでVersionをreview
→ Version-scoped Comment
→ 必要ならOriginalと分離したMIDI Proposal
→ Decision
→ 作曲者がDAWで反映
→ New Preview / MIDIをmanual export
→ New Version
```

StreamBandはDAWを置き換えず、DAW project、plugin state、音色、mixをCloudで再現しません。

### Scope

#### MUST

- invitation-gatedな2 userのself-service authentication、email verification、sign in / out、password reset、session
- verified emailに結びつくBand invitation、explicit acceptance、expiry / revoke、role validation
- private Band、Band Membership、server-side application authorization
- Song、SongVersion、Comment、CommentAnchor
- Asset metadataとprivate Preview / Source MIDI upload・access
- Original MIDIと別AssetであるMidiProposal、Proposal Decision
- server-generated author / timestamp / revision等のbasic audit field
- membership変更、Asset削除、Decision、Song archiveを追える最小AuditEvent候補
- runtime validation、idempotency、optimistic concurrency、safe error response
- request ID付きのbasic error log、service metrics、cost alert
- non-production dataとPrivate Alpha dataの分離
- backup / restore runbookと、復元可能性を確認するtest

#### SHOULD LATER

- Stem upload（PreviewとMIDIの安全なloopが成立した後）
- large-scale invitation automation、general collaboration notification
- CloudFront private delivery
- full audit UI、restore UI
- full-text search
- richer malware/content inspection
- presence（短命stateのみ。永続履歴を既定にしない）

Friend Testからinvite-only self-service registrationを使い、一般公開時にsignup systemを作り直さない方針です。Open public signup、誰でも参加できるBand、公開join linkは許可しません。

#### OUT OF SCOPE through 2026

- Companion App、VST3 Bridge、AU、Studio One automatic integration、multi-DAW integration
- WebSocket presence、real-time cursor、live chat sync、DAW live transport
- WebRTC、video call、real-time jam、real-time co-editing
- push notification、payment、subscription、public launch
- AI作曲機能、advanced MIDI editor、mobile native app
- automatic DAW clip modification、complete DAW project sync

### 推奨target architecture

```text
Next.js Web Hosting (TBD / blocking decision)
          |
          | HTTPS + authenticated request
          v
Amazon API Gateway HTTP API (MVP TARGET)
          |
          | JWT identity check
          v
AWS Lambda application boundary (MVP TARGET)
  |       |       |
  |       |       +--> CloudWatch logs / metrics
  |       +----------> Amazon S3 private Assets
  +------------------> Amazon DynamoDB metadata

Amazon Cognito User Pool --> Who is this user?
Application Membership --> Which Band and operation are allowed?
AWS Budgets -------------> delayed cost warning, not a hard cap
```

| responsibility | 推奨service / disposition | 境界 |
| --- | --- | --- |
| User authentication | Amazon Cognito User Pool / `MVP TARGET` | identityとsession。Band authorizationは持たせない |
| Application API | API Gateway HTTP API + Lambda / `MVP TARGET` | JWT確認後もLambdaがMembership、ownership、runtime inputを再検証 |
| Metadata | DynamoDB On-Demand / `MVP TARGET` | logical entityをtableと同一視せず、physical keyは別task |
| Private files | Amazon S3 / `MVP TARGET` | Block Public Access、opaque key、短時間access |
| Logs / metrics | Amazon CloudWatch / `MVP TARGET` | finite retention、sensitive dataを記録しない |
| Cost warning | AWS Budgets + cost review / `MVP TARGET` | alertには遅延がありhard capではない |
| CDN | CloudFront / `DEFER` | Private AlphaではS3のshort-lived accessから開始 |
| Realtime API | API Gateway WebSocket / `DEFER` | HTTP APIだけでreview loopが成立する |
| Email delivery | Cognito既定deliveryから小さく開始する候補 / `TBD` | quota、sender、SES移行要否をAUTH-001で確認 |
| Web hosting | Vercel / Amplify Hosting / AWS-native等を比較 / `TBD / BLOCKER` | Private Alpha前に専用decisionが必要 |
| IaC | AWS CDK + TypeScriptを第一候補 / `TBD / BLOCKER` | CLOUD-002 reviewでhuman approvalが必要。詳細は後段 |

### Authenticationとapplication authorization

#### Cognito boundary

Cognitoは「このrequestのuserは誰か」を確認します。Band MembershipはDynamoDB候補のapplication dataとして扱い、「どのBandに所属し、何を実行できるか」をLambda側で毎回検証します。Cognito groupだけでBandごとのOwner / Admin / Editor / Commenter / Guestを表現しません。

Private Alphaの最小候補:

- user-facing sign-in identifierはemail addressとし、ownershipはverified issuer + Cognito `sub`からopaque internal Userへmappingする
- open public signupはOFF、invitation-gated self-service signupはONとし、2人のfriend testから最終製品に近い登録UXを使う
- email verificationを必須候補とする
- sign in、sign out、password reset、session expiry / refreshを実装対象にする
- password policy、generic authentication error、progressive rate / abuse controlを設計する
- social login、enterprise SSO、複数IdPはDEFERするが、PasskeyはPrivate Alphaまでのtargetとしてfresh Cognito WebAuthn reviewを行う
- Friend TestでMFAは必須にせず、security-sensitive operationにはstep-up authenticationを計画する

AWS管理者のMFAと、StreamBand利用者のCognito MFAは別問題です。AWS root userや管理権限の日常利用を避け、管理者accessはMFAと短時間credentialを必須候補にします。

#### Band invitation

Friend Testから、最終製品に近いinvitation-gated self-service registrationを使用します。

1. Owner / Adminが許可されたroleでinvitationを発行する
2. verified emailに結びつく予測不能token付きlinkを本人が開く
3. StreamBand branded entryからCognito registration、email verification、password作成、loginを完了する
4. Band名、inviter、roleを確認し、accept / later / declineを本人が選ぶ
5. accept時にserverがtoken、expiry、revoke、email、inviter capabilityを再検証してからBandMembershipを作る
6. actor、Band、invitation、target internal User、result、時刻、request IDをsafe AuditEvent候補へ残す

Open public signupはOFFのままにします。Cognito Managed Loginの標準self-registrationを有効にするとinternet上の誰でもaccountを作れるため、invitation tokenをCognito registrationと安全にbindするexact mechanismはAUTH invitation implementation gateで決めます。管理者作成accountへUXを戻して解決しません。

consoleやDBのad-hoc直接編集を通常運用にせず、実装taskで再実行可能なbootstrap / admin commandとrunbookを用意します。公開join、guessable token、Cognito accountだけで自動参加する方式は禁止します。

### API execution boundary

| candidate | security / integration | complexity / cost | 将来client |
| --- | --- | --- | --- |
| Next.js server endpoint only | Web hostingと同一境界で単純。hosting/session方式へ強くcoupleする | 初期構成は少ないが、hosting変更とbackend scalingが連動 | Companion / Bridgeへ同じcontractを公開しにくい |
| API Gateway HTTP API + Lambda | AWS JWT authorizer候補、service role、S3/DynamoDB境界を分けやすい | IaC、deployment、observabilityの学習が必要。request単位cost候補 | Web / Companion / Bridgeが将来同じAPI boundaryを利用しやすい |
| Hybrid | SSR/BFFとcore APIを分けられる | auth、error、validationを二重化しやすい | web固有処理とshared APIを明確に分ける必要 |

Phase 2 MVPでは、API Gateway HTTP API + Lambdaをcore system APIの推奨ターゲットにします。Next.jsは画面とweb固有integrationを担当し、business authorizationとpersistence mutationはshared Lambda application boundaryへ集約する候補です。browser token/sessionの保持方法、CSRF、CORS、direct API vs BFFはAUTH-001 / API-001で確定します。

API GatewayのJWT検証はauthenticationの一層であり、resource authorizationの代替ではありません。LambdaはDATA-002どおりMembership、Band ownership、runtime validation、revision、idempotencyを検証します。

#### WebSocket

`DEFER`。Private AlphaのPreview → Comment → Proposal → Decision → VersionはHTTP requestと明示refreshで成立します。real-time cursor、presence、live chat、DAW live transportがacceptance criteriaになった時だけ、WebSocketのconnection authorization、reconnect、presence expiry、costを別taskで評価します。

### Metadata persistence

#### MVP access pattern候補

- User IDから参加Bandを一覧する
- Band IDからBandとactive Membershipを読む
- Band IDからmemberを一覧する
- Band IDからSongを更新順またはstatusで一覧する
- Song IDをBand ownership込みで読む
- Song IDからVersionを新しい順に一覧する
- Songのcurrent Versionを読む
- Version IDからComment + Anchorをpage単位で一覧する
- Version IDからMidiProposal + Decision summaryを一覧する
- Version / Song IDからAsset metadataを一覧する
- idempotency keyとrevisionで重複・stale mutationを検出する
- high-risk operationのAuditEvent候補をresource / timeで追跡する

これはlogical access patternであり、Domain entityとDynamoDB tableは同じものではありません。partition key、sort key、secondary index、item collection、transaction、TTL、hot partition対策はCLOUD-DATA-001へ分離します。

#### DynamoDB On-Demand vs managed PostgreSQL

| criterion | DynamoDB On-Demand | managed PostgreSQL |
| --- | --- | --- |
| initial cost | request量に追従し、idle serverを避けやすい | instance / computeのminimum costが生じやすいserviceもある |
| operational burden | capacity planningを減らせる。access pattern設計は必要 | patch、connection、pool、upgrade、vacuum等をservice責任と照合する必要 |
| schema flexibility | item shape変更は容易だが、整合ruleはapplication / transaction設計が重要 | migrationは必要だがconstraintとrelational schemaを表現しやすい |
| relationship queries | joinなし。known access patternへdenormalizeが必要 | join、ad-hoc query、relationship整合に強い |
| design burden | physical keyとindexを先に設計する負担が高い | SQL/schema設計は直感的だがquery/index tuningが必要 |
| scaling | serverlessでrequest増減へ追従しやすい | instance/connection/replica等のcapacity設計が必要 |
| backup | PITR / on-demand backup候補 | providerのsnapshot / PITR / restore方式を確認 |
| local development | Cloud挙動との差を管理するtest strategyが必要 | local PostgreSQLとの一致を作りやすい |
| migration difficulty | access patternに埋め込まれたdenormalizationの移行負担が高い | SQL ecosystemとexportは豊富だがschema migration riskがある |

Private Alphaの推奨候補はDynamoDB On-Demandです。2 userの予測困難だが小さいtraffic、low fixed cost、Lambdaとのserverless運用を優先します。ただしCLOUD-DATA-001で全critical access pattern、transaction、conditional write、backup / restore、data exportを検証できない場合はmanaged PostgreSQLへ戻します。物理schema採用はCLOUD-001だけでは確定しません。

料金とservice limitsは実装直前に各serviceのofficial pricing / quota pageで再確認します。

### Private Asset architecture

#### Asset kind

- `AUDIO_PREVIEW`: userがDAWからreview用にexportした音声
- `STEM_AUDIO`: optional。Private Alpha初期はSHOULD LATER
- `SOURCE_MIDI`: 特定Versionのread-only source
- `PROPOSAL_MIDI`: SOURCE_MIDIとは別のproposal Asset
- `IMAGE`: future / DEFER

`SOURCE_MIDI != PROPOSAL_MIDI`をstorage key、Asset metadata、authorization、delete flowで維持します。Decisionはどちらのobjectも上書きせず、DAWへの自動反映もしません。

#### S3 security baseline

- account / bucket levelのBlock Public Accessを有効にし、public ACL / public bucket policyを許可しない
- bucket / objectはprivate、ownershipはserver-managed
- 保存時暗号化とHTTPS通信を必須baselineとし、nonprodはSTORAGE-001-DESIGNでSSE-S3を選択した。Private Alphaはreal data前に再reviewする
- upload request前とdownload/access発行前にauthentication、Membership、capability、Asset ownershipを確認する
- upload / access instructionは対象key・method・期限を限定し、短時間だけ有効にする
- object keyはopaque Asset IDを中心にserverが生成する
- original filename、client MIME、extension、sizeを信用せず、upload completeでobject metadata、size、detected type、checksum候補を検証する
- complete前のobjectをVersionへ公開せず、`AVAILABLE`以外のstateではaccessを拒否する
- signed URL、credential、private object keyをDBのpublic view、log、PR、docsへ記録しない
- membership変更後も既発行URLが期限までは使えるriskを抑えるため、短いexpiryを選ぶ
- incomplete multipart uploadとorphan staging objectに期限 / cleanupを設ける

STORAGE-001-DESIGNではobject keyを次の候補へ具体化しました。

```text
<environment>/assets/<asset-kind>/<asset-id>/<object-id>
```

email、real name、未公開Song title、secret project name、original filenameをkeyへ直接入れません。

#### Preview / transcoding

Private Alpha初期は、userがStudio Oneから互換性を確認したlightweight Preview fileをexportしてuploadします。server-side FFmpeg、waveform解析、codec変換はDEFERします。original masterとstreaming derivativeの分離は、browser互換性、容量、転送costが実測上の問題になった時に再評価します。

#### CloudFront

`DEFER`。2 user / 1 Bandでは、authorization後に短時間のS3 access instructionを発行する方が、private cache policy、signed URL key管理、OAC、invalidationを追加するより単純です。latency、range request、egress、繰り返し再生の実測がS3 direct accessの限界を示した場合、OAC + private CloudFront signed URL / Cookieを別decisionで検討します。S3をpublic originにはしません。

### Regionとenvironment

#### Region

単一Regionの第一候補はAsia Pacific (Tokyo) `ap-northeast-1`です。2 userが日本中心であるためlatencyと運用の単純さを優先し、multi-Region replicationはDEFERします。各resource作成taskでCognito、API Gateway HTTP API、Lambda、DynamoDB、S3、CloudWatchの利用可否、quota、実価格、data residency要件を再確認します。

#### Environment stages

| phase | data | cloud境界 |
| --- | --- | --- |
| Local | mock / syntheticのみ | 現在のNext.jsとtest。実credential・未公開音源を置かない |
| AWS nonprod | synthetic / disposableのみ | Auth/API/DB/Storage integrationとfailure test |
| Private Alpha | 本物の未公開曲 | nonprodと分離したresource、role、budget、backup、logs、domain / hosting |

development dataとPrivate Alpha dataを同じtable、bucket、User Pool、log groupへ混ぜません。environmentはresource name / tagだけでなく、IAMとdata pathでも分離します。

#### AWS account separation

最小開始は1つのnonprod AWS account内のisolated resourcesでもよい候補ですが、本物の未公開曲を入れる前にPrivate Alphaを別AWS accountへ分離することを推奨します。AWS accountをsecurity、quota、billingの境界として使い、production-like dataへのdeveloper accessを減らします。

別accountを準備できない場合は、同一account内の別resource / role / key / budgetで保護を弱めて自動続行せず、human risk acceptanceをPrivate Alphaのblockerにします。今回はAWS Organizationsやaccountを作成しません。

### Secretsとcredential

- AWS access key、JWT secret、Cognito secret、DB credential、private keyをrepository、commit、PR、docs、chat、screenshotへ保存しない
- workloadはIAM role、CIはOIDC等のshort-lived credential候補を優先し、長期access keyを配布しない
- browserへ埋め込むpublic identifierとserver secretを区別し、browser public clientへclient secretを置かない
- server secretが必要な場合はSecrets Manager、SSM Parameter Store、hosting providerのsecret storeを比較する
- local secret、rotation、revocation、emergency access、退任時削除をCLOUD-002 / AUTH-001で決める

### Logging、monitoring、audit

#### Safe logging

CloudWatchへ候補として記録する最小field:

- request ID、operation、success / failure、latency
- safeなopaque resource ID、environment、error category
- service-level count / duration / retry

記録しないもの:

- password、token、signed URL、raw credential、private key
- audio / MIDI contents
- full unreleased lyrics、Comment body、original filename、personal informationの不要なcopy

CloudWatch Logsは既定の無期限保持を使わず、Private Alphaのincident調査に必要な有限期間をCLOUD-002で設定します。application logは30〜90日候補、AuditEventは別の保持要件候補とし、正式期間はprivacy / recovery reviewで決めます。

#### Minimum monitoring

- API Gateway 4xx / 5xx、latency、unexpected request growth
- Lambda error、timeout、throttle、duration
- authorization failureの急増
- DynamoDB throttle / system error / conflict count
- upload request / complete failure、missing object、orphan増加
- S3 storage size、request / transfer増加
- budget actual / forecast alert、cost anomaly候補

高度なobservability platformは導入せず、少数のactionable alarm、dashboard、runbookから開始します。

#### Audit

enterprise audit systemは作りませんが、`who / what / when / resource / request ID / result`を追えるapplication eventを考慮します。特にMembership change、Asset deletion、Proposal Decision、Song archive / deleteを優先します。本文やfile内容をAuditEventへ複製しません。

### Cost guardrails

これはAWSの料金保証ではなく、StreamBandのplanning ruleです。

- Development target: できる限り数千円/月以内
- Private Alpha normal target: おおむね¥500〜¥1,500/月
- 月¥5,000を超えた場合はusage、resource、data transfer、異常requestを確認する
- projected monthly costが¥10,000を超えるarchitecture / resource変更はhuman approval必須
- implementation前と大きな変更前にofficial AWS pricing pageとAWS Pricing Calculatorで再見積もりする
- environment / service / owner tag候補でcostを追跡する
- actualとforecastの複数thresholdで早期警告し、通知先と調査担当を2人で確認する

AWS Budgetsはbilling data更新と通知に遅延があるため、hard spending capではありません。alert後の確認、upload停止候補、nonessential environment停止、resource特定、human escalationをrunbook化します。自動停止はdata lossやavailabilityへの影響をreviewせず導入しません。

#### MVPで避ける高固定費 / 高運用負荷service

明確な必要性が出るまで、EC2 always-on server、NAT Gateway、Application Load Balancer、always-on ECS、OpenSearch、provisioned RDS、ElastiCache、EKSを使いません。LambdaをVPCへ入れる必要がなければ入れず、NAT Gatewayをbaselineにしません。

### Backup、recovery、delete

Private Alpha開始前の候補baseline:

- DynamoDB PITRを有効化し、restoreは既存tableの巻き戻しではなく隔離先へのrestoreから検証する
- release / migration前にon-demand backupが必要かrunbookで判断する
- S3 Versioningを有効化候補とし、誤上書き・削除から直ちに永久消失しないようにする
- S3 object versionは復旧用のstorage世代であり、共同制作上の`SongVersion`とは別概念として扱う
- noncurrent version、delete marker、orphan、incomplete multipart uploadへlifecycleを設定する
- restore owner、RPO / RTO候補、復元後のauthorization確認、定期restore drillを定義する
- backupもprivate dataとして権限、保持、削除、costを管理する

delete model候補:

| resource | user-visible transition | physical delete候補 |
| --- | --- | --- |
| Song | まずarchive / soft delete | retentionと関連Asset確認後。即時cascadeしない |
| SongVersion | contentは原則immutable。限定metadata訂正のみ | user操作で即hard deleteしない |
| Comment | tombstone / deletedAt候補 | privacy要件とthread整合後 |
| Asset | access停止 + delete requested / deleted metadata | retention後にobjectをidempotent削除 |
| Membership | inactive / removed | 直後から全read/writeと新規signed accessを拒否 |

retention期間、法的削除、account削除、backupからの消去はTBDです。利用者が消した瞬間に唯一のcopyが永久消失する設計にはしません。

### Failure strategy

| scenario | corruption / leakage prevention | retry / user-visible behavior |
| --- | --- | --- |
| upload interrupted | pending Assetをavailableにせず、incomplete partsを期限後cleanup | resume / new upload候補。「未完了」を表示 |
| upload成功・complete失敗 | objectをprivate stagingのまま保持しVersionへ関連付けない | idempotent completeをretry。期限後orphan cleanup |
| Version create失敗 | Assetはverified stagingのまま、current Version pointerを変えない | 同じoperation IDでretry、または明示取消 |
| duplicate request | idempotency keyで二重Song / Version / Comment / Proposalを防ぐ | 同じinputなら最初のresult、異なるinputならconflict |
| Cognito unavailable | fail closed。anonymous fallbackやpublic Asset accessを許可しない | sign-in / refresh errorとretry案内 |
| Lambda error | transaction / conditional writeでpartial metadata mutationを避ける | request ID付きgeneric error。安全なoperationだけretry |
| DynamoDB conflict | revision / condition failureでsilent overwriteしない | 409相当。latestをreloadして差分確認 |
| S3 object missing | Asset metadataだけでavailableと決めずaccess時にも存在/stateを確認 | Asset unavailable表示、operator調査。別objectを返さない |
| page表示後にpermission変更 | requestごとにMembershipを再確認しcacheを無効化 | 次requestから403/404候補。private dataを再取得しない |
| friendがBandから削除 | new signed accessを拒否し、既発行URLは短時間expiryでriskを限定 | session再評価、Bandを一覧から除外 |
| cost急増 | budget / service metricsで検知し、public exposureやloopを調査 | humanへ通知し、runbookでnonessential upload / environmentを停止 |

障害時はprivate dataを漏らすfallback、別Band dataの代替表示、validation省略、public bucket化を行いません。

### Web hosting decision

Next.js web applicationのremote hostingはPrivate Alphaのblocking deployment decisionです。HOST-001 / PR #24でVercel Proをprimary candidate、AWS Amplify HostingをNext.js 16 support確認後の条件付きfallback、AWS-native custom Next.jsをlast resortとして承認しました。候補承認に契約、account接続、project、料金発生、deploymentは含まれません。詳細は[HOSTING.md](HOSTING.md)を参照します。

| criterion | Vercel | AWS Amplify Hosting | AWS-native custom Next.js |
| --- | --- | --- | --- |
| Next.js compatibility | verified adapter。現行16.3.0の第一候補 | AWS公式managed SSR supportは現時点で15まで。16はgate | Node.js / Dockerは全機能候補だが運用責任が大きい |
| deployment / preview | protected Preview、staged production、instant rollback候補 | PR preview、branch access control、atomic deploy候補 | build、runtime、CDN、rollbackを自前設計 |
| cost / logs | Pro base + usage / add-on。接続前に再見積もり | build / hosting / transfer / SSRの従量課金 | resource数、idle cost、運用時間を含める |
| AWS backend integration | CORS、token/session、region latencyを確認 | IAM / Cognito / API連携を確認 | 柔軟だが運用負担が最大 |
| migration | standard buildとAPI contractのportable性を確認 | hosting固有設定を限定 | AWS couplingとrunbookが増える |

Previewはsynthetic dataとnonprod backendだけに接続し、Private Alpha dataのprimary boundaryはCognito + Lambda application authorizationに置きます。production promotion、custom domain、CORS / callback、cost、rollbackはhosting接続taskでhuman approvalし、AWS-native custom hostingは原則避けます。

### Infrastructure as Code decision

IaCはresource作成前に必須ですが、今回は導入しません。

| criterion | AWS CDK | Terraform | other supported approach |
| --- | --- | --- | --- |
| TypeScript親和性 | 現行team skillと合わせやすい | HCL等の学習が必要 | support期間と学習負担を確認 |
| reviewability | generated template / diffの確認方法が必要 | planとstate changeをreviewしやすい | dry-run / drift検出が必須 |
| destroy / recreate | stack dependencyとretained dataを設計 | stateとlifecycle ruleを設計 | data resource誤削除を防ぐ |
| state management | CloudFormation/CDKのstack state | remote state / lock / secret保護 | rollbackと共同作業を確認 |
| CI | OIDC、approval、environment gateが必要 | 同左 | long-lived keyを使わない |

CLOUD-002で、初心者の運用負荷、data resource保護、preview / plan、drift、rollback、CI credentialを比較し、AWS CDK + TypeScriptを第一候補として提案します。詳細と未承認事項は後段のCLOUD-002章へ分離します。`cdk bootstrap`、`cdk deploy`、`terraform` / `tofu` commandは実行しません。

### Critical pathとimplementation slices

1 task = 1 small PRを維持し、前段のsecurity / data gateが通るまで後段を開始しません。

1. `CLOUD-002` Cloud foundation / account・environment・IaC decision、pricing estimate、rollback（完了・PR #23）
2. `HOST-001` Next.js Private Alpha hosting decision（PR #24で候補承認済み。deployは別task）
3. `CLOUD-003` account readiness、offline repository foundation、将来のnonprod bootstrapを別gateに分割
4. `AUTH-001` Cognito authentication prototype（controlled user、verification、session、reset）
5. `CLOUD-DATA-001` DynamoDB access pattern / physical design、PITR / restore plan
6. `AUTHZ-001` Band Membershipとcapability matrix
7. `API-001` Band / Song core read-write boundaryの最小実装
8. `STORAGE-001` private Preview / MIDI upload・complete・access
9. `VERSION-001` persisted Version workflow
10. `COMMENT-001` Version-scoped Comment + Anchor
11. `PROPOSAL-001` separate MIDI Proposal + Decision
12. `OBS-001` alarms、budget、backup / restore drill、operational runbook
13. `DEPLOY-001` isolated Private Alpha deploymentとacceptance test

Surface taskの`SURFACE-015C` / `SURFACE-016`はCloud critical pathと領域が重ならない場合のみ別branch / lockで並行候補にできます。CLOUD-001からは着手しません。

### Year-end acceptance criteria

- 2 usersがauthenticationでき、同じprivate Bandのactive Membershipを持つ
- ComposerがSongと明示的なVersionを作成・参照できる
- Composerがuser-exported Previewをprivateにuploadし、Friendは許可された場合だけaccessできる
- Friendが対象Versionを明示したComment + Anchorを作成できる
- ComposerがSOURCE_MIDIをprivate Assetとして共有できる
- PROPOSAL_MIDIがOriginalとは別Asset / entityで、sourceを上書きしない
- authorized actorがDecisionを記録できるが、DAW/MIDIを自動変更しない
- ComposerがDAW作業後に次のVersionを明示的に作成できる
- 別Band / removed userはSong、Version、Comment、Assetへaccessできない
- 未公開曲のpublic object / permanent public URLが存在しない
- stale write、duplicate request、partial uploadがdata corruptionを起こさない
- basic error、authorization failure、upload failure、storage / request / cost growthを観測できる
- metadataとAssetについてdocumented restore手順があり、nonprodでrestore test済み

### Private Alpha開始前のhuman gates

- Cognito、API Gateway + Lambda、DynamoDB、S3、Regionの採用承認
- Owner/Admin/Editor/Commenter/Guest相当の最終capability matrix
- AWS account分離、IAM/MFA、emergency access
- web hostingとIaC方式
- file format / size / checksum / retention / delete policy
- monthly cost estimateと¥10,000超変更のapproval process
- threat review、backup / restore test、incident / cost runbook

### 公式資料（2026-09-09確認）

- [Cognito user pool email settings](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html)
- [API Gateway HTTP API JWT authorizer](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [DynamoDB On-Demand capacity](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html)
- [DynamoDB point-in-time recovery](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Point-in-time-recovery.html)
- [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [S3 presigned URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [S3 Lifecycle configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html)
- [CloudFront private content](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-overview.html)
- [CloudWatch Logs retention](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)
- [AWS Budgets cost management](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html)
- [AWS account separation guidance](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/implementation.html)
- [AWS Regions and Availability Zones](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html)

## CLOUD-002: Cloud Foundation Decision

### Decision status

CLOUD-001 review後、次は人間承認済みのplanning baselineです。

- primary Cloud target: Cognito、API Gateway HTTP API + Lambda、DynamoDB On-Demand、private S3、CloudWatch、AWS Budgets
- `ap-northeast-1`を単一Regionの第一候補とし、resource作成直前にservice availability、quota、official pricingを再確認する
- local、AWS nonprod、Private Alphaを分け、本物の未公開曲を入れる前にPrivate Alpha accountをnonprodから分離する
- CloudFront、WebSocket、server-side transcodingをDEFERし、Companion App / VST3 Bridgeは2027年以降へ分離する

CLOUD-002で提案したAWS CDK + TypeScriptと`infra/`配置は、CLOUD-003Bでrepository foundationの範囲に限って人間承認されました。credential、naming / tagging、destructive operation、bootstrap手順の実AWS適用は引き続き別Human Gateです。CLOUD-002ではAWSへ接続せず、account、IAM、OIDC、bootstrap resourceを含むresourceを1つも作りませんでした。

### AWS account strategy

| option | isolation / blast radius | cost visibility | beginner operations | future path |
| --- | --- | --- | --- | --- |
| A. 1 account内でnonprod / private-alphaをresource分離 | 誤ったrole、region、stack、manual操作が両environmentへ届くriskが残る | tagで分離できるが、untagged / shared costの判別が難しい | account作成は少ないが、毎回environmentを慎重に識別する必要 | 後からaccount分離するmigrationとcredential変更が必要 |
| B. nonprod accountとprivate-alpha accountを分離 | accountがIAM、quota、billing、dataの強い境界になり、事故の影響を限定しやすい | account単位とtag単位の両方で追跡できる | initial setup、cross-account role、billing運用は増える | future production-like environmentへ自然に拡張しやすい |

推奨はOption Bです。最初のAWS integrationはnonprod accountだけでdummy dataを使い、本物の未公開曲を入れる前にPrivate Alpha専用accountを準備します。管理account / AWS Organizations / Control Towerの必要性とownerはCLOUD-003前のhuman gateで決め、今回accountを作りません。

同一accountでPrivate Alphaを代替することは既定のfallbackにしません。account分離が準備できない場合は、自動的に保護を弱めず、本物のdata投入をblockして人がriskを再評価します。

### Environment model

| environment | 目的 | 許可data | change / destroy gate |
| --- | --- | --- | --- |
| `local` | 現在のmock UI、unit / component / E2E、local contract検証 | mock / syntheticのみ。Cloud credentialと本物の未公開曲は禁止 | local artifactは再生成可能。shared sourceは通常PRを通す |
| `nonprod` | AWS integration、failure、IaC、Auth/API/Storageの検証 | dummy/test audio・MIDIのみ | reviewed plan後の作成・更新。disposableであることを確認したstackだけ明示destroy可 |
| `private-alpha` | 2 controlled usersが本物の未公開曲をreview | authorizedなreal unreleased data | human-approved deployment、backup / restore、強いdeletion protection。unattended destroy禁止 |

形式だけの`dev / test / staging / prod`を増やしません。初期は上記3境界だけとし、nonprodとPrivate Alphaでaccount、credential、state / stack、data、log、budgetを共有しません。

### Region policy

- primary Region candidateはTokyo `ap-northeast-1`
- 日本の2 userに対するlatency、data location、operational simplicityを優先する
- Private Alphaはsingle Regionとし、multi-Region replication / failoverを作らない
- CLOUD-003、AUTH-001、CLOUD-DATA-001、STORAGE-001のresource作成直前に、対象serviceのRegion availability、quota、current official pricingを再確認する
- Region変更はstorage、backup、credential、latency、data migrationへ影響するため、単なるconfig変更として扱わずhuman approvalを要求する

### IaC options

IaCは必須です。AWS CDK + TypeScriptのtool adoptionとoffline repository foundationはCLOUD-003Bで承認され、最初のAWS接続とbootstrapはまだ未承認です。

| criterion | AWS CDK + TypeScript | Terraform | OpenTofu | CloudFormation direct |
| --- | --- | --- | --- | --- |
| AWS-only fit | AWS construct / CloudFormationと直接統合 | AWS provider経由。multi-cloudにも広げられる | Terraform-compatibleなprovider model | AWS nativeだが低level |
| TypeScript fit | 現行teamのTypeScript知識を再利用可能 | HCLを学ぶ必要 | HCLを学ぶ必要 | YAML / JSONとintrinsic functionを学ぶ必要 |
| beginner cost | application codeに近いが、constructとgenerated templateの両方を理解する | declarative syntaxは読みやすいがstate / backend運用が増える | Terraformに近く、state / backend / encryption運用が増える | toolは少ないが大きなtemplateとreferenceが難しい |
| review / diff | `cdk synth`と`cdk diff`。replacement / IAM changeをtemplate / change setでも確認 | `plan`が明確。apply直前の再planが必要 | `tofu plan`。apply直前の再確認が必要 | change setとtemplate diff |
| state | CloudFormation stackがmanaged state。別remote state backendは不要 | remote state、locking、access、backupが必要 | remote state、locking、access、backupに加えstate encryption候補 | CloudFormation stackがmanaged state |
| bootstrap | account / RegionごとのCDK bootstrap resourceが必要 | backend / provider initializationが必要 | backend / provider initializationが必要 | CDK bootstrap不要。deployment role等は別途必要 |
| drift | CloudFormation drift / CDK diffを運用 | refresh / planで検出 | refresh / planで検出 | CloudFormation drift / change set |
| destroy / rollback | CloudFormation rollbackとremoval policy。data restoreは別 | plan / state / lifecycleに依存。data restoreは別 | plan / state / lifecycleに依存。data restoreは別 | CloudFormation rollback / policy。data restoreは別 |
| CI/CD | synth / test / diffとOIDC AssumeRole候補 | plan artifact、remote state、locking、OIDCが必要 | plan、remote state、locking、OIDCが必要 | template validation / change set、OIDCが必要 |
| secrets | secret valueをconstruct / outputへ埋めない。CloudFormation outputも公開範囲に注意 | state / planにsecretが残り得るため機密扱い | state / planにsecretが残り得るため機密扱い | parameter / output / eventへsecretを出さない |
| multi-account | stackをaccount / Regionごとに分けてbootstrap / roleを管理 | provider alias / state境界を管理 | provider / state境界を管理 | stack / roleをaccountごとに管理 |
| maintenance / community | AWS releaseとconstruct ecosystemへ依存 | provider / Terraform version、license、backendと広いcommunity資産を管理 | provider compatibility、OpenTofu version、governanceとcommunity成熟度を管理 | AWS resource schemaとofficial exampleへ直接追従 |
| vendor coupling | AWS / CloudFormationへのcouplingが強い | languageはcross-cloudだがAWS resource定義は移植不能 | 同左。tool migrationにもstate検証が必要 | AWSへのcouplingが最も直接的 |
| tool cost | tool自体よりbootstrap / deployed resource / CIのcostを確認 | CLIとoptional managed backend / runnerのcostを確認 | CLIとremote backend / runnerのcostを確認 | deployed resource / CIのcostを確認 |

#### Decision: AWS CDK + TypeScript（offline foundation approved）

StreamBandはAWS-onlyのsmall serverless architectureで、applicationとteam skillがTypeScript中心です。CDKなら言語を増やさず、CloudFormation stackをstate / deployment単位に使えるため、2人のteamが別途remote state backendとlockingを運用する範囲を減らせます。construct-level diffだけで安全と判断せず、synthesized template、security change、replacement、CloudFormation change setをreview対象にします。

Terraform / OpenTofuはplanの明確さとAWS外への拡張性が強みですが、現在のscopeではHCLに加えてremote state、locking、state secret、backend recoveryを運用する負担が増えます。将来multi-cloud、既存Terraform estate、専任infra運用、CDKで表現しにくいprovider要件が出た場合は再評価します。CloudFormation directは低level templateのreview負担が大きいため第一候補にしません。

CDKはdeploy前にaccount / Region単位のbootstrapが必要で、S3 / ECR / IAM role等のbootstrap resourceを作ります。bootstrapのtrustとexecution policyは強い権限になり得るため、CLOUD-003でtemplate、trusted principal、permissions、costをreviewした上で一度ずつ明示承認します。

### Future repository layout

repository rootの`infra/`を採用します。CLOUD-003Bでapplicationから独立したpackage、空Stack、offline test / synthを作成し、root packageやworkspaceには追加しません。

```text
infra/
├ package.json          # app packageとは依存とscriptを分離する候補
├ tsconfig.json
├ cdk.json
├ bin/
├ lib/
├ test/
└ config/               # secretなしのenvironment metadataだけ
```

- `src/**`とinfrastructure sourceを分け、appのinstall / buildへ無条件にCDKを混ぜない
- 最初は1 repository内の小さなpackageとし、monorepo toolや別repositoryを追加しない
- reusable constructを早期に階層化せず、environment-specific stackとshared codeを最小にする
- account ID、credential、signed URL、secret、実email、private hostnameをconfigへcommitしない
- generated assembly / asset / local stateをcommitしない
- test、synth、diff、deploy scriptは将来のinfra taskで定義し、application `Quality checks`の変更とは別PRにする

`infrastructure/`は意味が明確ですが、長いpathにする利点が小さいため`infra/`を推奨します。future Companion / Bridgeが増えても、Cloud backend foundationは同じ`infra/`境界に置き、client codeと混同しません。

### Credential and CI authentication

#### Local human access

- AWS IAM Identity Center等のfederated sign-inとshort-lived sessionを第一候補にする
- 人ごと・environmentごとにpermission set / roleを分け、credentialを共有しない
- Private Alpha accessはnonprodより狭くし、日常のread / deployとsecurity / billing administrationを分離する
- session expiry、MFA、revocation、lost-device、offboardingをbootstrap runbookへ含める
- long-lived IAM user access keyを`.env`、shell profile、password managerから常用する設計にしない

#### GitHub Actions

- GitHub OIDCからenvironment別AWS deploy roleをAssumeRoleする方式を推奨する
- IAM trustはrepository、branch / GitHub Environment、audience等のconditionで限定し、任意fork / arbitrary refからAssumeRoleできないようにする
- PR checksはread-only synth / testを基本とし、AWS接続を必要とするdiff / deployは別workflow、明示environment、human approvalへ分離する
- nonprodとPrivate Alphaでroleを分け、Private Alpha deploy roleを通常PRへ渡さない
- long-lived IAM user access keyをGitHub Secretへ保存しない
- OIDC provider、role、workflow permissionはCLOUD-003の専用PRで実schemaを確認して作る。今回は`.github/workflows/**`を変更しない

#### Root account baseline

将来accountを作成する場合のbootstrap checklist候補:

- root userへphishing-resistant MFAを含む強いMFAを設定する
- root credentialとrecovery methodを安全に保管し、日常作業に使わない
- root access keyを作らない。既存の場合は利用状況確認後に無効化 / 削除する
- administrative daily accessはIAM Identity Center等のtemporary credentialへ移す
- accountのbilling / security / operations contactを確認する。private emailをrepositoryやdocsへ記録しない
- root / recovery accessとsecurity setting変更はhuman approvalと監査記録を必須にする

### Resource naming and tagging

#### Naming

人がConsole、diff、alertでenvironmentを誤認しにくいよう、原則を`project-environment-purpose`とします。

```text
streamband-nonprod-<purpose>
streamband-alpha-<purpose>
```

- environment codeは`nonprod`と`alpha`に固定し、`prod`をPrivate Alphaの曖昧な別名にしない
- CloudFormation stack候補は`streamband-nonprod-foundation`等、purposeを狭くする
- S3 bucketのglobal uniqueness、service length / character rule、physical name固定のreplacement riskは各resource taskで確認する
- account ID、email、real name、未公開Song / Band名、credentialをresource nameへ含めない
- CDKの自動physical nameを使うか固定するかは、cross-stack reference、replacement、migrationをreviewしてresourceごとに決める

#### Minimum tags

| key | 候補value | 目的 |
| --- | --- | --- |
| `Project` | `StreamBand` | project識別 |
| `Environment` | `nonprod` / `private-alpha` | data / change gateとcost分離 |
| `ManagedBy` | `IaC` | manual resourceとの区別 |
| `Purpose` | `foundation` / service単位の安定code | owner調査とcost分類 |

必要なdata resourceには`DataClass=synthetic`または`DataClass=unreleased-private`を追加候補とします。個人名、email、Song / Band名、secretをtagへ書きません。tagはauthorization boundaryではなく、未tag resourceも安全である必要があります。`Owner` / `CostCenter`は2人のPrivate Alphaで維持価値が生じた時だけ、個人情報ではないteam codeを採用します。

### Cost visibility and Budgets

- `Project`、`Environment`、`Purpose`をcost allocation候補として有効化し、account / service / tagで追跡する
- Developmentはできる限り数千円/月以内、Private Alphaは通常¥500〜¥1,500/月を目標とする
- 月¥5,000を超えた場合はusage、resource、request / transfer、retention、異常accessを確認する
- projected ¥10,000/月超の構成変更はhuman approvalなしで進めない
- AWS Budgetsはbilling反映と通知に遅延がありhard capではない。low early warning、mid warning、¥5,000相当のinvestigation、¥10,000相当のhuman gateをfoundation taskで設定候補とする
- JPY / USD換算、actual threshold、recipient、official pricing、Pricing Calculator estimateはresource作成時に再確認する
- budget alertに対するowner、確認期限、nonessential environment停止、upload制限、incident escalationをrunbook化する

NAT Gateway、EC2 always-on、ALB、always-on ECS、EKS、OpenSearch、ElastiCache、provisioned RDSはfoundation baselineで作りません。追加には専用Decision、monthly estimate、human approvalが必要です。

### Destructive operation and deletion protection

| operation | nonprod gate | private-alpha gate |
| --- | --- | --- |
| stack / environment destroy | synthetic dataと対象stackを確認し、diff / listと明示承認後だけ実行 | unattended / routine destroy禁止。backup、restore test、影響一覧、別human approvalが必要 |
| S3 bucket delete / replace | empty確認とorphan / retention確認。automatic cleanupを既定にしない | retention / versioning / recovery確認なしでは禁止。retain policy候補 |
| DynamoDB table delete / replace | disposable tableだけ。backup要否とmigrationをreview | deletion protection、PITR、backup、restore先、cutover / rollback承認が必須 |
| Cognito User Pool replace | test userへの影響とsign-in regressionを確認 | identity loss / subject changeをdata migrationなしで許可しない |
| resource rename | physical replacementの有無をchange setで確認 | replacementならrenameではなくmigration taskとして扱う |
| PITR / versioning / backup disable | 理由と再有効化条件をPRに記録 | human approvalとrecovery impact reviewなしで禁止 |

- `cdk destroy`やenvironment-wide deleteをPrivate Alpha automationへ入れない
- data-bearing resourceはCDK removal policy、CloudFormation termination protection、service deletion protectionを実装taskで検討する
- protectionを外す変更は通常deployに混ぜず、専用task、expected resource、backup evidence、rollback planを必要とする
- wildcard target、曖昧なprofile / account、unreviewed replacementを使わない

### Rollback and data restore boundary

Rollbackを3種類に分けます。

1. Application rollback: HOST-001 / DEPLOY-001でprevious known-good artifact / commitへ戻す。DB schemaやdataを自動で巻き戻さない。
2. Infrastructure rollback: CloudFormation rollbackまたはknown-good IaC commitの再deploy。replacement済みresourceや外部stateが元に戻るとは仮定しない。
3. Data recovery: DynamoDB PITR / backup、S3 Versioning / lifecycle、application audit / reconciliationを使う別runbook。CLOUD-DATA-001、STORAGE-001、OBS-001で検証する。

`IaC rollback != deleted user data restore`です。CloudFormation stack rollbackが成功しても、削除済みitem、上書き済みobject、Cognito identity、外部email、client retryの整合は回復しない可能性があります。data migrationにはforward / backward compatibility、backup、restore先、cutover、verification、abort conditionを別途定義します。

### Drift and state policy

#### Drift

- IaC managed resourceはConsoleで日常的に直接変更せず、repositoryのreviewed IaCをsource of truthにする
- Consoleのread-only確認とincident対応は許可するが、emergency変更はactor、時刻、理由、対象を記録する
- emergency変更後は専用task / PRでIaCへ反映するか、review後にIaCの状態へ戻す。放置しない
- future CIでsynth / testを行い、AWSへ接続する`cdk diff` / drift detectionはcredentialとcostを持つ別gateにする
- drift解消時もprivate-alphaの現物を無条件にIaCへ合わせず、削除 / replacementをreviewする

#### State

- CDK: CloudFormation stackがresource stateを管理する。CDK bootstrap stack / bucket / ECR / IAM roleもaccount / Regionごとのmanaged foundation resourceであり、application stackと同じくinventory、cost、protection対象にする
- Terraform: local `terraform.tfstate`を共有・commitせず、remote backend、locking、encryption、versioning、access、backup、recovery ownerが必要
- OpenTofu: 同様にremote stateとlockingが必要。state / plan encryptionを使う場合はkey loss、rotation、recoveryも運用対象になる
- どのtoolでもplan / state / outputはcredentialやsensitive attributeを含み得るため、PR、artifact、logへ無制限に公開しない

### Deployment approval boundary

- PRではIaC source、unit test、synthesized template、expected changeをreviewする
- AWSへ接続するdiff / change setは対象account、Region、role、stackを明示し、resultを秘密情報なしでreviewする
- apply / deployはapproved commitからだけ行い、PRのarbitrary codeへPrivate Alpha roleを渡さない
- nonprod deployとPrivate Alpha deployを別role / environment / approvalにする
- Private Alphaのdelete、replacement、protection disable、security / root change、¥10,000超予測は通常deployから分離する
- branch protectionや`Quality checks`をCloud deployの代わりにせず、専用workflow / environment gateはCLOUD-003以降で設計する

### Future bootstrap sequence

以下はCLOUD-003候補で1段ずつ確認する順序で、CLOUD-002では実行しません。

1. account / ownership / billing / support / alternate contactのsecurity checklistを人が承認する
2. root MFA、root recovery、root daily-use禁止、root access keyなしを確認する
3. Budgets / Cost Explorer / cost allocation tag等のcost visibilityとnotification ownerを準備する
4. IAM Identity Center等で個別human identityとshort-lived least-privilege accessを準備する
5. GitHub OIDC providerとenvironment別AssumeRole trustをreviewし、nonprod deploy roleだけを先に作る
6. 採用済みIaC toolとbootstrap template / policy / trust / costをreviewして、nonprodだけをbootstrapする
7. synth / test / diff / approvalのCI boundaryを確認する
8. logging / tagging / protectionを含む最小nonprod foundation stackをdeployする
9. account / Region / tag / budget / role / drift / rollbackを再取得して検証する
10. その後にAUTH-001等のservice resource taskを1 task = 1 PRで開始する

Private Alpha accountの準備とbootstrapは、nonprodのrunbookと失敗時手順をreviewしてから別の明示承認で行います。

### Boundaries with following tasks

- `HOST-001`: PR #24でVercel Pro primary candidateを承認済み。hosting由来のOIDC、domain、secret、rollbackの実設定は別task / gateとする
- `AUTH-001`: Cognito User Pool、app client、session integrationを設計・実装する。CLOUD-002では作らない
- `CLOUD-DATA-001`: PR #30でDynamoDB physical designを完了。resource implementationはfoundation gate後
- `AUTHZ-001`: PR #31でBand Membership capability matrixとserver authorization test contractを完了。runtime implementationは別task
- `STORAGE-001-DESIGN`: PR #32でprivate bucket、opaque key、MIME / size、state、lifecycle、Versioning、short-lived accessの設計を完了。S3 / IAM / API実装は`STORAGE-001`へ分離
- `CLOUD-003`: Aは人間側account readiness、Bはoffline repository foundation、Cは別Human Gate後の最初のAWS接続 / bootstrapとして分割する

### Human approval gates

- AWS account作成、AWS Organizations / management model
- real unreleased dataをPrivate Alpha accountへ初めて投入すること
- AWS CDK + TypeScriptと`infra/`packageはoffline foundationまで承認済み。AWS接続を伴う変更は別Human Gate
- 最初のCDK bootstrap、bootstrap trust / execution policy、最初のAWS deployment
- GitHub OIDC trustとdeploy role、Private Alpha workflow / environment access
- root / recovery / billing / security setting変更
- projected ¥10,000/月超、新しい高固定費service、multi-Region / VPC / NAT等の追加
- Private Alphaのdestroy、resource replacement、data migration、deletion protection / backup disable
- hosting、Cognito integration、DynamoDB physical design、S3 retention / limitの各専用Decision

### Official references（2026-09-10確認）

- [AWS CDK bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)
- [AWS CDK diff](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd-diff.html)
- [CloudFormation termination protection](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-protect-stacks.html)
- [IAM security best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS root user best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html)
- [IAM Identity Center temporary credentials](https://docs.aws.amazon.com/singlesignon/latest/userguide/howtogetcredentials.html)
- [GitHub Actions: OIDC in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [Terraform remote state](https://developer.hashicorp.com/terraform/language/state/remote)
- [Terraform plan](https://developer.hashicorp.com/terraform/cli/commands/plan)
- [OpenTofu state locking](https://opentofu.org/docs/language/state/locking/)
- [OpenTofu state encryption](https://opentofu.org/docs/language/state/encryption/)
- [AWS tagging best practices](https://docs.aws.amazon.com/tag-editor/latest/userguide/best-practices-and-strats.html)
- [AWS cost allocation tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html)

## CLOUD-003: Nonprod Foundation Bootstrap

### CLOUD-003A: Account readiness（human-side completed）

人間側から、StreamBand専用nonprod AWS accountの作成とroot MFA設定完了が報告されています。この確認はAWS APIで再取得せず、account identifier、root email、支払い情報、MFA情報、credentialをrepositoryへ保存しません。既存の別用途AWS account / resourceは対象外です。

### CLOUD-003C-PREP: Nonprod readiness checkpoint（human-confirmed）

次の事実は人間側で確認済みとして記録します。このrepository同期ではAWSへ接続せず、command outputやcredential由来の識別子を再取得・保存しません。

- StreamBand専用のnonprod AWS accountが存在し、root MFAが設定されている
- 月額USD 10のAWS Budgetがmonitoring用に作成されている。Budgetは通知のための仕組みであり、利用を自動停止するhard spending capではない
- setup / local development専用のhuman IAM userが存在し、そのIAM userにMFAが設定されている
- long-lived access keyは作成していない
- localでは`aws login`によるtemporary CLI authenticationに成功し、profile名は`streamband-nonprod`、選択Regionは`ap-northeast-1`である
- localで`aws sts get-caller-identity --profile streamband-nonprod`の成功を確認済み。ただしoutput、account number、ARNその他のcredential由来識別子は記録しない
- 現在のIAM permissionはlocal sign-in supportへ意図的に限定されており、AWS administrationまたはbootstrapに必要なpermissionが準備済みとは扱わない
- このcheckpointではapplication AWS resourceを作成していない
- CDK bootstrap / deployと、それに必要な権限変更は未承認のまま維持する

この記録は人間から報告されたreadinessの状態同期であり、AWS account、IAM、Budget、CLI認証をCodexが検証または変更したことを意味しません。

### CLOUD-003B: CDK repository foundation

CLOUD-003Bで許可されるのは、AWSに接続しないrepository toolchainだけです。

- AWS CDK + TypeScriptを`infra/`の独立npm packageとして配置する
- `StreamBandNonprodFoundation`をenvironment-agnosticな空Stackとして生成する
- Node.js 24を標準とし、CDK App / Stack生成、resource 0件、nonprod境界、account / Region未bindingをoffline unit testで確認する
- `cdk synth --no-lookups`でcredentialなしのoffline synthを行い、`cdk.out/`はcommitしない
- application `src/**`、root package、既存GitHub Actionsは変更しない。infra CI integrationは別taskで判断する
- AWS account ID、credential、private dataをcode、docs、test、outputへ含めない

2026-09-10時点の公式AWS CDKサポート表ではNode.js 24がサポート対象です。CDK CLIと`aws-cdk-lib`は同一versionを仮定せず、library release時のCLIまたは新しいCLIが互換という公式方針に従ってpackage lockで固定します。

この段階ではS3、ECR、IAM、OIDC、Budgets、SNS、CloudWatch、Cognito、Lambda、API Gateway、DynamoDBを定義しません。AWS connection、API call、bootstrap、deploy、diff、destroyも行いません。そのためAWS runtime resourceとAWS runtime costは0です。

### CLOUD-003C: First AWS connection / bootstrap（pending Human Gate）

CLOUD-003Cは、対象account / Region / role、bootstrap template、trust、permission、cost、rollbackを再確認したうえで最初のAWS接続とnonprod bootstrapを行う将来taskです。CLOUD-003Bの承認には含まれず、明示的な別Human Gateが必要です。Private Alphaや本物の未公開曲も対象にしません。

実際の`cdk bootstrap`より前に、別のhuman-gated taskで次を順番に行います。

1. 現行AWS CDKが作成するbootstrap resourceと、課金され得るcomponent / 保存量 / requestを公式情報で再確認する
2. bootstrap時だけ使用する最小限で実用的なtemporary permission pathを定義し、通常のlocal sign-in permissionと分離する
3. GitHub Actions OIDCとdeployment roleのtrust / permission案はbootstrap permissionと分けてreviewする
4. 作成予定resource、対象account / Region、必要permission、rollback / removal境界を実行前に人へ提示する
5. 提示内容に対する明示的なhuman approvalを得た後だけ`cdk bootstrap`を実行する

CLOUD-003C-PREPでは上記の調査、権限設計、OIDC / IAM変更、bootstrap、deployを実施しません。CLOUD-003自体は未完了で、actual bootstrapはHuman Gateによりblockされたままです。

### CLOUD-003C-REVIEW: CDK bootstrap resource / cost / permission review

調査日: 2026-09-11

この節は、repositoryで固定しているAWS CDK v2のCLIと、調査日時点のAWS公式資料に基づく実行前レビューです。bootstrap templateはCDKの更新で変わるため、実際の実行直前に、使用するCLIが生成するtemplate、公式ドキュメント、対象Regionの価格を再確認します。このレビューはAWSへの接続、権限付与、resource作成、bootstrapまたはdeployの承認ではありません。

#### Current default bootstrap components

標準のmodern bootstrapは通常`CDKToolkit`というCloudFormation stackを作成し、次のresourceを管理します。resourceはbootstrap時に作成されますが、asset保存や各roleの実利用は後続deploy時に発生します。

| Component | Bootstrapで作成 | 主な責務 | 後続deployでの利用 |
| --- | --- | --- | --- |
| CloudFormation bootstrap stack（通常`CDKToolkit`） | Yes | bootstrap resourceの構成と更新を管理 | template更新、drift / rollback / deletion境界の基準 |
| S3 file asset bucket | Yes | CloudFormation templateとfile assetのstaging | deploy前にFile Publishing role経由でassetを保存 |
| ECR container asset repository | Yes | container image assetのstaging | container assetがあるdeployでImage Publishing role経由で利用 |
| CloudFormation execution role | Yes | application stackをCloudFormationが実行する際の権限 | 後続stackの作成・更新・削除で利用 |
| Deployment action / deploy role | Yes | CDK deploymentをCloudFormationへ渡す | 後続deploy時に利用 |
| File publishing role | Yes | S3 file assetを公開する | file assetを含むdeploy時に利用 |
| Image publishing role | Yes | ECR image assetを公開する | container assetを含むdeploy時に利用 |
| Lookup role | Yes | CDK context lookupを限定的に行う | lookupを必要とするsynth / deployで利用。現在のoffline stackではlookupを使わない |
| SSM bootstrap version parameter | Yes | bootstrap template versionをtoolingが確認する | 後続deploy時の互換性確認に利用 |

現行の標準bootstrapを「customer-managed KMS keyを必ず自動作成する」と説明してはいけません。現在のCLIではcustomer-managed key作成は標準ではなく、`--bootstrap-customer-key`を明示した場合に作成候補となります。`--bootstrap-kms-key-id`は既存keyを指定する別optionです。StreamBandではどちらも未選択・未承認で、このレビューではkeyを作りません。

次はdefault bootstrapの構成外です。

- GitHub Actions OIDC provider、GitHub用deployment role、repository secret / variable
- Cognito、Lambda、API Gateway、DynamoDB、application asset bucket、CloudWatch alarm
- AWS Budget（既存の月額USD 10 Budgetは人間側monitoring checkpointであり、bootstrap resourceではない）
- cross-account trust、permissions boundary、customer-managed KMS key
- CDK stack termination protection。CLI optionで明示する候補であり、defaultで有効と仮定しない

#### Cost review

価格はRegion、保存量、request、data transfer、option、将来のdeploy内容で変わります。次の表は課金保証ではなく、実行前に監視すべきdriverです。

| Component | Default | Likely billing driver | Idle-cost behavior | 増加要因 / cleanup |
| --- | --- | --- | --- | --- |
| CloudFormation `CDKToolkit` stack | Yes | 標準AWS resource provider自体には追加料金なし。配下resourceの料金は別 | stackの存在だけを理由に「全体が無料」とは扱わない | third-party extensionはdefault外。削除前にasset store、依存stack、termination protectionを確認 |
| S3 asset bucket | Yes | 保存bytes、request、retrieval / data transfer等 | 空または小容量ならdriverは小さいが、無料保証はしない | file asset、古いversion、request、転送で増加。current templateのlifecycleとretentionを実行前に確認し、依存assetを先に消さない |
| ECR asset repository | Yes | image storage、data transfer | imageがなければstorage driverは限定的だが、無料保証はしない | container assetと転送で増加。untagged image lifecycleと参照中imageを確認してcleanup |
| 5 IAM rolesと関連policy | Yes | IAM自体は追加料金なし | direct baseline chargeなし | 金額より権限のblast radiusが主要risk。削除前にdeploy / CloudFormation利用を停止 |
| SSM bootstrap version parameter | Yes | 標準Parameter Store parameter / standard throughputは追加料金なし | defaultの標準parameterはdirect baseline chargeなし | advanced parameterやhigher throughputはdefault外で有料候補 |
| Customer-managed KMS key | No | keyの保持とAPI request | 作成すれば使用量が少なくてもkeyの料金driverになり得る | `--bootstrap-customer-key`等を明示した場合だけ候補。不要なkeyを作らず、既存key参照時も削除影響をreview |

S3 / ECRの保存assetとrequestは、空のskeleton stackをbootstrapするだけの場合より、実際のapplication deploy開始後に増えます。AWS CDKにはunused assetを整理する明示的なgarbage collection機能がありますが、削除操作なので別task / reviewなしに実行しません。月額USD 10 Budgetは早期警告のmonitoringであり、hard spending capでもresourceの自動停止保証でもありません。

#### Bootstrap identity permissions

AWS公式CDK guideがbootstrap実行identityに最低限必要として列挙するaction familyは、`cloudformation:*`、`ecr:*`、`ssm:*`、`s3:*`、`iam:*`（対象`Resource: *`）です。これはbootstrap resourceとroleを作成・更新するための強い権限で、StreamBandのleast-privilege policyとして承認済みという意味ではありません。

- 現在のlocal sign-in permissionは意図的に限定されており、bootstrapには不足している状態を維持する
- long-lived access keyを追加せず、temporary sessionを前提候補とする
- bootstrap用のtemporary elevated permissionは、正確なaction / resource / durationを別Human Gateで提示して承認を得る
- bootstrap後はtemporary elevated human permissionを外せる運用を設計する
- repository、PR、GitHub Secretsへhuman credentialを保存しない

このPRはpolicyをAWSへ作成・適用しません。公式の広いaction familyはreview inputであり、そのままcopyして付与する実行指示ではありません。

#### CloudFormation execution policy risk

標準bootstrapでは、`--cloudformation-execution-policies`を指定しない場合、CloudFormation execution roleへ`AdministratorAccess`が使われ、後続deployが広い管理権限で実行され得ることをAWS CDK CLI documentationが明記しています。これはbootstrap identityのtemporary permissionとは別の、bootstrap後もdeployに影響するpermission boundaryです。

- broad execution policyは将来のCDK stack追加を通しやすい一方、誤ったtemplateや侵害されたdeploymentのblast radiusを大きくする
- narrowly scoped managed policyはriskを下げる一方、新しいresource typeを追加するたびにdeploy failureとpolicy reviewが必要になり得る
- `--cloudformation-execution-policies`にはmanaged policy ARNを渡せるが、account固有ARNと実policyはこのdocsへ記録せず、別Human Gateで提示する
- cross-account trustを追加する場合、trusted principalがexecution policy相当の権限を得られるため、今回は設定しない

Decision Gate: **CloudFormation execution policy must be separately approved before bootstrap.** `AdministratorAccess`も代替policyも、このtaskでは選択・適用しません。

#### GitHub Actions OIDC review（implementationなし）

OIDC deployment roleはhuman bootstrap permissionとは別の設計対象です。将来実装する場合のsecurity baseline候補は次のとおりです。

- GitHub OIDCを使い、長期AWS access keyをGitHubへ保存しない
- AWS STS向けaudienceを`sts.amazonaws.com`へ制限する
- trust policyのsubjectを意図したGitHub organization / repositoryへ制限する
- branchまたはGitHub environment条件を、実用上可能な範囲でwildcardより狭くする
- OIDC roleのpermissionはdeployに必要な範囲へ限定し、bootstrap用human permissionと共有しない
- deployment gateにはGitHub environment protectionを検討する

このPR後もOIDCは未実装です。workflow、GitHub Actions permission、IAM provider / role、secret / variableを変更しません。

#### Pre-bootstrap Human Gate checklist

以下を一式として人へ提示し、明示承認を得るまでbootstrapを実行しません。

1. **Target**: StreamBand `nonprod`、Region `ap-northeast-1`。repositoryへaccount IDを書かず、実行者が外部の安全な手順で対象を照合する
2. **Proposed command — not executed**:

   ```text
   cd infra
   npx cdk bootstrap aws://<NONPROD_ACCOUNT_ID>/ap-northeast-1 \
     --profile streamband-nonprod \
     --termination-protection \
     --cloudformation-execution-policies <HUMAN_APPROVED_MANAGED_POLICY_ARN>
   ```

   placeholderを実値へ置換する方法、使用CLI version、generated templateを実行直前にreviewする
3. **Expected resource categories**: `CDKToolkit` stack、S3 asset bucket、ECR asset repository、CloudFormation execution / deploy / file publishing / image publishing / lookup roles、SSM bootstrap version parameter
4. **Bootstrapper permission**: temporary session、承認済みaction / resource / duration、実行後の権限撤去方法
5. **CloudFormation execution policy**: `AdministratorAccess`を暗黙採用せず、選ぶmanaged policy、必要範囲、failure trade-offを別承認する
6. **GitHub OIDC status**: not implemented。human bootstrapとOIDC provider / deployment roleは別task / approvalとする
7. **Billing drivers**: S3 / ECR storage・request・transfer、optional KMS、将来deployによるasset増加。最新のTokyo Region pricingとBudget通知を直前確認する
8. **Rollback / deletion**: CloudFormation rollbackとdata / asset restoreは別物。termination protection、retained asset、依存stack、cleanup手順を確認する
9. **Data boundary**: bootstrapには未公開楽曲、production data、application assetを投入しない
10. **Explicit approval**: 上記command、resource、permission、execution policy、cost、rollbackを提示後、人の明示承認があるまで実行禁止

`AUTH-001`その他の実装taskは、必要なfoundation gateが完了するまでblockしたままにします。CLOUD-003 actual bootstrapは未承認です。

#### Official references（2026-09-11確認）

- [AWS CDK: Bootstrapping environments](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html)
- [AWS CDK: `cdk bootstrap` command](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd-bootstrap.html)
- [AWS CDK: Deploy applications](https://docs.aws.amazon.com/cdk/v2/guide/deploy.html)
- [AWS CDK CLI default bootstrap template](https://github.com/aws/aws-cdk-cli/blob/main/packages/aws-cdk/lib/api/bootstrap/bootstrap-template.yaml)
- [Amazon S3 pricing](https://aws.amazon.com/s3/pricing/)
- [Amazon ECR pricing](https://aws.amazon.com/ecr/pricing/)
- [AWS CloudFormation pricing](https://aws.amazon.com/cloudformation/pricing/)
- [AWS Systems Manager pricing](https://aws.amazon.com/systems-manager/pricing/)
- [AWS IAM FAQ](https://aws.amazon.com/iam/faqs/)
- [AWS KMS pricing](https://aws.amazon.com/kms/pricing/)
- [AWS IAM: Create a role for an OIDC identity provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)
- [AWS Security Blog: Use IAM roles to connect GitHub Actions to AWS](https://aws.amazon.com/blogs/security/use-iam-roles-to-connect-github-actions-to-actions-in-aws/)

### CLOUD-003C-DECISION: Final nonprod bootstrap permission and execution plan

判断日: 2026-09-11

状態: **Review recommendation — actual bootstrapは未承認**

この節はCLOUD-003C-REVIEWを、専用StreamBand nonprod accountで1回だけ行うbootstrapの推奨案へ絞り込んだものです。AWSへ接続せず、policy、role、resourceを作成・変更せず、commandも実行していません。人がこの案を承認した後も、実行は別taskとし、直前にcurrent CLI / template / priceを再確認します。

#### Human bootstrap permission model

| Option | Security isolation | Beginner operations | `aws login` compatibility | Privilege removal / retention risk |
| --- | --- | --- | --- | --- |
| A. 既存専用human IAM userへcustomer-managed bootstrap policyを一時attach | userへ直接強い権限が付く時間帯は明確なrisk。時間を限定し、他用途accountでは使わない | policy作成・attach・detach・削除で完了し、role profile / trust policyが不要 | 現在確認済みのtemporary `aws login` profileをそのまま利用できる | attach中の全sessionが権限を得るため作業直前attachと直後detachが必須。detach後にpolicy削除と元permission確認が容易 |
| B. 同一accountの専用bootstrap roleを作り一時AssumeRole | bootstrap permissionをroleへ隔離でき、継続運用では優位 | role、trust、callerの`sts:AssumeRole`、profile、session、MFA条件の設定と撤去が増える | AWS公式の`aws login`資料は短期credentialを説明するが、そのsessionがMFA必須trustの`aws:MultiFactorAuthPresent`を満たす保証までは明記していない。公式AssumeRole例はMFA device情報を別途profile / requestへ渡す | roleを消し忘れるriskと、trust / caller policyの両方を検証する負担がある |

**Recommendation: Option A.** 初回だけのdedicated nonprod bootstrapでは、既存の専用human IAM userへcustomer-managed policyを実行直前だけattachし、確認完了後に即detachしてpolicy自体も削除します。追加roleとMFA連携を推測で構築せず、manual stepを最小化し、long-lived access keyを作らないことを優先します。

この選択は、一般的にuserへの直接付与がroleより安全という意味ではありません。attach中は強い権限がuserの有効なsessionへ及ぶため、短いmaintenance window、単一command、即時撤去、撤去確認を一つのrunbookとして扱います。継続deployとPrivate Alphaではこの方式を再利用せず、別OIDC deployment roleをreviewします。

#### Temporary bootstrapper policy

Suggested policy name: `StreamBandNonprodCdkBootstrapTemporary`

**Review candidate — not applied**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CdkBootstrapDocumentedServiceFamilies",
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ecr:*",
        "ssm:*",
        "s3:*",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```

これはAWS CDK公式guideがbootstrap identityに必要として示すservice action familyをそのまま表した、**broad but service-limited**な一時候補です。`iam:*`と`Resource: "*"`を含むためleast privilegeとは呼びません。applicationの日常操作、deploy、Private Alphaへ流用しません。

- human approval後、bootstrap実行直前だけ既存専用IAM userへattachする
- attach中は他のAWS作業をせず、承認済みbootstrap commandだけを1回実行する
- `CDKToolkit`と期待resourceの確認後、同じexecution window内で即detachする
- detach後、userが元の限定permissionだけへ戻ったことを人が確認する
- successful bootstrapと撤去確認後、customer-managed policyを削除する。失敗時も放置せず、調査に必要な記録を残してdetachを優先する
- policy documentはrepositoryのreview記録から再作成できるため、AWS上へ未使用policyを保存し続けない

policy作成・attach・detach・削除自体にも別のprivileged human actionが必要です。その実行主体と手順はactual bootstrap taskで明示し、root credentialを日常利用へ転用しません。

#### CloudFormation execution policy

| Option | Initial success | Security / maintenance |
| --- | --- | --- |
| 1. AWS managed `AdministratorAccess` | Cognito、Lambda、API Gateway、DynamoDB、private S3、CloudWatchと、それらに必要なrole / policyを後続CDK stackで扱いやすい | CloudFormation execution roleがaccount内の広い変更能力を持つ。template、deploy principal、account分離が破られるとblast radiusが大きい |
| 2. Custom limited managed policy | 許可serviceを明示でき、execution roleのblast radiusを抑えられる | resource作成時のIAM / PassRole / service-linked role / tagging等を事前に正確に網羅する必要があり、現時点のempty stackでは過不足なく確定できない。各sliceでpolicy保守とdeploy failure対応が増える |

**Recommendation: Option 1 — AWS managed `AdministratorAccess`をCloudFormation execution roleだけへ明示指定する。**

理由は、ここがreal dataを禁止した専用nonprod accountであり、current stackはempty、次の複数service sliceを学習しながら小さく追加する段階だからです。初回からcustom policyを推測すると、必要actionの欠落を繰り返し補うか、結局広いwildcardを見えにくい形で作るriskがあります。

適用境界は次のとおりです。

- `AdministratorAccess`はbootstrapが作る**CloudFormation execution roleのみ**。human IAM userの日常policyへattachしない
- human userに付ける一時bootstrap policyは前節の5 service familyだけとし、bootstrap直後に撤去・削除する
- `--trust`と`--trust-for-lookup`でcross-account principalを追加しない
- bootstrap後も、CDK roleをassumeできるprincipalを無条件に増やさない
- nonprodにはsynthetic / disposable dataだけを置き、未公開楽曲とreal user dataを入れない
- Private Alpha accountへこのexecution policyをcopyしない。real data投入前にfresh execution-policy reviewとhuman approvalを必須にする
- 将来OIDC deployment roleを作る場合、repository / branch / environmentとassume可能roleを別taskで限定する

blast radiusはaccount-wideです。誤ったCloudFormation templateや、CDK deployment roleをassumeできるprincipalの侵害により、nonprod account内のresourceが広く変更・削除され得ます。account分離、synthetic data限定、PR review、deployment principal制限を必須countermeasureとします。

#### Final recommended bootstrap configuration

| Setting | Recommendation |
| --- | --- |
| Target | dedicated StreamBand `nonprod` account only |
| Region | `ap-northeast-1` |
| Local profile | `streamband-nonprod` temporary `aws login` session |
| Toolkit stack | `CDKToolkit` |
| Qualifier | default `hnb659fds` |
| Termination protection | enabled |
| Bootstrap S3 public access block | enabled |
| Customer-managed bootstrap KMS key | do not create; use current default AWS-managed encryption behavior unless a separate reason is approved |
| Cross-account deploy trust | none; omit `--trust` |
| Cross-account lookup trust | none; omit `--trust-for-lookup` |
| CloudFormation execution policy | AWS managed `AdministratorAccess`, execution role only |
| Express mode | disabled so the initial bootstrap keeps normal stabilization / rollback behavior |
| Application resources | none; bootstrap stack only |
| Data | no unreleased music, production data, Private Alpha data, or application asset |

`--trust` / `--trust-for-lookup`は空値を渡さず、option自体を意図的に省略します。account performing the bootstrap以外のcross-account trustは追加しません。

#### Exact proposed command

**PROPOSED ONLY — HUMAN APPROVAL REQUIRED — DO NOT EXECUTE**

```text
cd infra
npm exec -- cdk bootstrap aws://<NONPROD_ACCOUNT_ID>/ap-northeast-1 \
  --profile streamband-nonprod \
  --toolkit-stack-name CDKToolkit \
  --qualifier hnb659fds \
  --termination-protection true \
  --public-access-block-configuration true \
  --bootstrap-customer-key false \
  --express false \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

`<NONPROD_ACCOUNT_ID>`はexecution時に安全なlocal contextで置換し、repository、PR、chat、logへ実値を残しません。local `infra/`にlockされたCDK CLIを使い、`--trust` / `--trust-for-lookup`は付けません。実行直前にCLI help、generated bootstrap template、target、policy、cost driverを再確認し、差異があれば停止します。

#### Future human execution runbook（このtaskでは実行しない）

1. localだけで対象がStreamBand専用nonprod account、Regionが`ap-northeast-1`であることを確認し、account ID / ARNをrepository、PR、chatへ転記しない
2. 月額USD 10 Budgetと通知先が有効であることを確認する。Budgetはhard capではない
3. `aws login --profile streamband-nonprod`で再認証する
4. human-approved privileged administration手順で、`StreamBandNonprodCdkBootstrapTemporary`だけを既存専用IAM userへattachする
5. installed CDK version、proposed command、generated template、expected resource、KMS / trust / execution policyを直前確認する
6. 承認されたbootstrap commandを1回だけ実行し、失敗時にoptionを推測で変えて再実行しない
7. `CDKToolkit`の成功、S3 / ECR、5 bootstrap role、SSM parameter、termination protection、public access block、customer-managed KMS keyなし、cross-account trustなしを確認する
8. 成否にかかわらずtemporary human bootstrap policyを直ちにdetachし、成功時はpolicyを削除する
9. human IAM userが以前の限定permissionへ戻り、bootstrap / administration actionを実行できないことを確認する
10. Billing、Cost Explorer、Budgetの初期変化を確認し、想定外resource / costがあれば停止・調査する
11. 同じtaskでapplication stackをdeployせず、OIDC、Cognito、S3 application bucketその他のresourceを追加しない
12. command、resource category、成否、撤去確認、cost確認だけを機密識別子なしで別branch / PRへ記録する

#### STOP conditions

次のいずれかがあればbootstrapを開始または再実行しません。

- StreamBand専用nonprod以外のaccount、または`ap-northeast-1`以外を指している
- 予期しない既存`CDKToolkit` stackがある、または既存stackのversion / parameterが不明
- generated template / resource categoryがCLOUD-003C-REVIEWとmaterially異なる
- customer-managed KMS keyを作成・参照する設定が入る
- `--trust`、`--trust-for-lookup`、その他のcross-account trustが入る
- bootstrapper policyまたはCloudFormation execution policyが承認内容より広い、別policyへ置き換わる、または対象principalが不明
- USD 10 Budget、billing / cost monitoring、通知先を確認できない
- temporary credentialとtarget identityを安全に確認できない
- long-lived access keyの作成・入力・共有を要求される
- nonprodにreal / unreleased song、Private Alpha data、production credentialが存在する
- CLI / template / official documentationが更新され、review内容と一致しない
- temporary policyを直後に撤去できる担当・時間・確認手順が揃っていない

#### OIDC order

推奨順序は次です。

```text
human performs one approved bootstrap
→ verifies resources and removes temporary human privilege
→ separate GitHub OIDC / deployment-role task and Human Gate
→ first reviewed nonprod application deployment
```

初回bootstrapにGitHub OIDCは技術的な必須条件ではありません。bootstrap permission、OIDC trust、継続deploy permissionを同時に作ると、失敗原因とprivilege boundaryが混ざるため分離します。このPR後もOIDCは未実装です。

#### Official references（2026-09-11再確認）

- [AWS CLI: Login for local development using console credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html)
- [AWS CLI: Using an IAM role](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html)
- [AWS IAM: Secure API access with MFA](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_configure-api-require.html)
- [AWS CDK: Bootstrapping environments](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html)
- [AWS CDK: `cdk bootstrap` command](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd-bootstrap.html)
- [AWS CDK security best practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices-security.html)

### Official references（2026-09-10確認）

- [AWS CDK supported Node.js versions](https://docs.aws.amazon.com/cdk/v2/guide/node-versions.html)
- [AWS CDK versioning and Toolkit compatibility](https://docs.aws.amazon.com/cdk/v2/guide/versioning.html)
- [AWS CDK CLI lookup option](https://docs.aws.amazon.com/cdk/v2/guide/ref-cli-cmd.html)

## CLOUD-OIDC-001-DESIGN: GitHub Actions OIDC deployment trust

### Status and boundary

調査日: 2026-09-11。これはnonprod継続deployment用のtrust / permission設計であり、OIDC provider、IAM role / policy、GitHub Environment、secret / variable、workflow、AWS resourceを作成・変更していません。AWS接続、CDK bootstrap / deployも行っていません。実装には本章末尾のHuman Gateと専用taskが必要です。

既存のPR `Quality checks`は`pull_request`で動くread-only CIのまま維持し、AWS credentialを取得させません。actual CLOUD-003C bootstrapも別Human Gateで未承認です。

### Three identities are separate

| identity | lifecycle | responsibility | must not become |
| --- | --- | --- | --- |
| Human bootstrap identity | 初回bootstrap直前だけ一時permissionを得て、直後に撤去 | `CDKToolkit`を1回作成・検証する | 日常deploy identity、long-lived access key holder |
| GitHub Actions OIDC deployment identity | 承認済みworkflow runごとにshort-lived STS sessionを得る | CDK CLIが必要なbootstrap roleをassumeする入口 | application administrator、human console user、bootstrapper |
| CloudFormation execution role | CDK bootstrapが作り、CloudFormation serviceがdeploy時に使用 | application stackで実行可能なAWS actionの上限を決める | GitHub web identity roleそのもの、human permission |

GitHub roleへapplication serviceの管理権限を直接集約しません。GitHub roleはdeployment entry point、`DeploymentActionRole` / publishing / lookup roleはCDK tooling boundary、`CloudFormationExecutionRole`はresource mutation boundaryです。

### OIDC provider candidate

| setting | candidate |
| --- | --- |
| Provider URL / issuer | `https://token.actions.githubusercontent.com` |
| AWS STS audience | `sts.amazonaws.com` |
| Credential model | GitHub OIDC tokenを`AssumeRoleWithWebIdentity`へ交換して得るtemporary STS credential |
| Stored AWS access key | none |

AWSはrole trust policyの`aud`と`sub`を検証します。`aud = sts.amazonaws.com`を`StringEquals`で固定し、別audience向けtokenがこのroleへ使われることを防ぎます。OIDC token、STS credential、signed tokenをGitHub log、artifact、repositoryへ保存しません。

### Trust subject and GitHub Environment decision

比較結果:

| option | strength | limitation |
| --- | --- | --- |
| A. `main` branchを直接subjectへ固定 | branch refを狭くできる | deployment approval、environment-scoped history / protectionをsubjectだけでは表現しにくい |
| B. GitHub Environment `nonprod`をsubjectへ固定 | environment protectionとdeployment branch restrictionを同じjobへ適用できる | Environment設定とplan上利用可能なprotection ruleの事前確認が必要 |

**Recommendation: Option B、GitHub Environment `nonprod`.** 将来のdeployment jobは`environment: nonprod`を参照し、Environment側のdeployment branchを`main`だけに限定します。通常PR jobとarbitrary branchはEnvironmentへ到達させません。

GitHub公式仕様ではEnvironmentを参照する従来subjectは次です。

```text
repo:Ryo-9/daw.connect.app:environment:nonprod
```

ただし、このrepositoryはGitHubのcurrent defaultで**immutable subject claims**を使用します。owner / repository名にimmutable IDが加わり、expected subjectは次の形です。実IDはrepository、PR、chatへ記録しません。

```text
repo:Ryo-9@<GITHUB_OWNER_ID>/daw.connect.app@<GITHUB_REPOSITORY_ID>:environment:nonprod
```

実装前にrepositoryのOIDC customizationをread-onlyで再確認し、実際のtoken claimと一致する完全一致値を安全なAWS設定手順へ渡します。さらにAWS IAMがcurrent GitHub claimとして扱える`ref = refs/heads/main`と`environment = nonprod`も完全一致条件へ加え、Environment設定とIAM trustの両方でbranchを限定します。名前だけのlegacy subjectへfallbackしたり、`StringLike` / wildcardで差異を吸収したりしません。OIDC subject customizationを変更する場合は、AWS trustを先に対応させる別migration taskが必要です。

### GitHub Environment candidate

- name: `nonprod`
- deployment branches / tags: selected branch `main`だけ。`refs/pull/*`、tag、feature branchは許可しない
- trigger candidate: protected `main`へmerge後、`workflow_dispatch`で人が対象commitを確認して開始する
- required reviewer: repository planでprivate repositoryに利用可能なら1人のmanual approvalを推奨する。利用不能なら自動で弱い代替へせず、manual dispatch + branch restrictionを最低gateとしてhuman reviewする
- prevent self-review / administrator bypass: team人数とplan capabilityを実装taskで確認し、利用可能なら有効化候補
- secrets: AWS access keyを保存しない。non-sensitive valueも必要最小限とし、account identifierをrepositoryへcommitしない

Environmentはsubjectを狭めるだけでなく、branch / approval gateとして使います。Environmentを作るだけではAWS権限は発生せず、OIDC provider / role trustとfuture workflowのすべてが揃った時だけtemporary sessionを取得できます。

### GitHub deployment role permission boundary

GitHub OIDC roleへ`AdministratorAccess`を付けません。current CDK default deploymentでは、entry identityが次のbootstrap roleを必要な時だけassumeします。

| bootstrap role | GitHub roleからのaccess | purpose |
| --- | --- | --- |
| `DeploymentActionRole` | required | CloudFormation deployment開始とexecution roleのpassをCDK経由で行う |
| `FilePublishingRole` | file assetがあるdeployでrequired | bootstrap S3 bucketへtemplate / file assetをpublishする |
| `ImagePublishingRole` | container image assetがある場合だけ | bootstrap ECR repositoryへimage assetをpublishする。初回empty / non-container stackには不要候補 |
| `LookupRole` | context lookupを承認したdeployだけ | environment lookupを行う。offline synthには使わない |
| `CloudFormationExecutionRole` | GitHub roleが直接assumeしない | `DeploymentActionRole`がCloudFormationへpassし、CloudFormationがresource changeを実行する |

CDK bootstrap roleには`aws-cdk:bootstrap-role` tagがあります。AWS公式のsecurity guidanceはdeployment identityに`sts:AssumeRole`を与え、このtagを`deploy / file-publishing / image-publishing / lookup`へ限定する候補を示しています。StreamBandではさらにnonprod account、default qualifier、Tokyo Regionの具体的role ARN候補へresourceを絞る方針です。

bootstrap version確認の`ssm:GetParameter`をOIDC roleへ直接追加する必要があるかは、actual bootstrap template、current CLIと最初のdry reviewで確認します。current default deploy roleがversion parameterを読む構成を前提に、確認前からdirect SSM permissionを広げません。CloudFormation、IAM、S3、ECRその他application serviceの直接管理actionもGitHub roleへ付けません。

### Role session restrictions

- role maximum session duration candidate: **3,600 seconds（1 hour）**。AWS role設定の最小maximumとする
- workflowのrequested duration candidate: **1,800 seconds（30 minutes）**。`AssumeRoleWithWebIdentity`の許容範囲内で、current stack規模に対してdefault 1 hourより短く始める。超過する場合は先にjob分割 / deploy時間を調査し、無条件に延長しない
- role session name candidate: `streamband-gh-<RUN_ID>-<RUN_ATTEMPT>`。GitHub runとCloudTrail eventを対応付け、個人名を使わない
- human console login、access key、unrelated service permission、cross-account trustを許可しない
- trust先はStreamBand nonprod accountだけ。Private Alpha用roleへ再利用しない

role trust削除後も既発行sessionはexpirationまで使える可能性があります。短いdurationとemergency revocation手順でresidual riskを限定します。

### Workflow permission and PR safety

現在のPR CIは次を維持します。

```yaml
permissions:
  contents: read
```

将来の専用deployment jobだけが最低限次を必要とします。

```yaml
permissions:
  contents: read
  id-token: write
```

`id-token: write`はGitHub OIDC tokenを要求する権限で、repository contentへのwrite権限ではありません。ただしAWS role assumptionの入口になるため、workflow全体や`Quality checks`へ付けず、deployment job scopeだけに置きます。

Concrete PR safety model:

1. `pull_request` eventではAWS deployment jobを起動せず、OIDC permissionも付けない
2. PRは既存`Quality checks`を通し、protected `main`へmergeする
3. deploymentはdefault branchに置かれたreview済みworkflowを`workflow_dispatch`で開始する
4. jobは`nonprod` Environmentを参照し、Environmentが`main`以外を拒否する
5. Environment approvalが利用可能ならtoken発行stepより前に要求する
6. fork、PR merge ref、feature branch、tag、外部reusable workflowへdeployment credentialを渡さない

`pull_request_target`でPR codeをcheckoutしてdeployする構成や、arbitrary ref inputをcheckoutしてcredentialを取得する構成は禁止候補です。workflow ref / commitを固定してからOIDCを要求し、untrusted PR codeがcredential付きjobを変更できないようにします。

### Future deployment sequence

```text
Pull Request
→ Quality checks（AWS accessなし）
→ protected mainへmerge
→ main上の専用deployment workflowをmanual dispatch
→ GitHub Environment nonprod gate
→ GitHub OIDC token（immutable repo + environment subject）
→ GitHub OIDC deployment roleをAssumeRoleWithWebIdentity
→ CDK DeploymentActionRole / FilePublishingRole（必要ならImagePublishingRole / LookupRole）
→ CloudFormationへCloudFormationExecutionRoleをpass
→ reviewed stack deployment
→ smoke check / deployment result記録
```

OIDC provider / role作成そのものと、最初のapplication resource deploymentを同じtaskにしません。最初のOIDC implementation taskではtrustとpermissionを検証するだけとし、Cognito、DynamoDB、application S3 bucket、Lambda、API Gatewayを自動deployしません。

推奨順序は既存DEC-016を維持します。

```text
human bootstrap
→ temporary human privilegeを撤去・確認
→ separate OIDC provider / deployment-role implementation task
→ separate deployment-workflow task
→ first minimal nonprod application deployment
```

### Private Alpha boundary

- nonprod OIDC role、Environment、execution policy、stackをPrivate Alphaへ再利用しない
- Private Alphaは別AWS account、別GitHub Environment、別OIDC trust role、別execution-policy reviewを必要とする
- nonprod subject / permissionからPrivate Alpha roleをassumeできるtrust pathを作らない
- real unreleased musicはPrivate AlphaのAuth / Authz / Storage / recovery / cost gate完了後だけ扱う

### Revocation and incident response

Emergency stop order:

1. GitHub deployment workflowをdisableするか、credential jobを停止し、新規runを止める
2. `nonprod` Environmentのapprovalを停止し、deployment accessをblockする
3. OIDC role trustからGitHub principal / subjectをremoveまたはexplicit denyし、新規sessionを止める
4. 必要ならrole session revocationを行い、最大1時間の既発行credential residual riskを監視する
5. deployment roleをdisable / deleteする。bootstrap roleとCloudFormation execution roleは影響を別reviewする
6. OIDC provider削除は、同じproviderを使う他roleがないことを確認した最後のaccount-level手段とする

workflow停止やtrust削除は新規OIDC sessionを止めますが、CloudFormationで既に開始したchangeやbootstrap execution roleを自動rollbackしません。進行中stack、data、rollbackは別incident runbookで扱います。

### Audit and logging boundary

記録候補:

- repository identity、workflow name / ref、run ID / attempt、review済みcommit SHA
- role session name、target environment、deployment result、safe error category
- CloudFormation stack action、change set / stack outcome、request / event identifier

記録禁止:

- OIDC token、STS access / secret / session credential、JWT body、authorization header
- account-specific identifierを含むrole ARNの不要なcopy
- secret、signed URL、private object key、未公開Song / filename / Comment内容

GitHub Actions log、CloudTrail / CloudFormation event、application logの保持とaccessは別operations taskで決め、credential debug outputを有効化しません。

### Review candidate — not applied: trust policy

次は構造確認用の非実行candidateです。placeholderは実装時の安全なlocal / AWS contextで解決し、repositoryへ実値を保存しません。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GitHubNonprodEnvironmentOnly",
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<NONPROD_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:Ryo-9@<GITHUB_OWNER_ID>/daw.connect.app@<GITHUB_REPOSITORY_ID>:environment:nonprod",
          "token.actions.githubusercontent.com:ref": "refs/heads/main",
          "token.actions.githubusercontent.com:environment": "nonprod"
        }
      }
    }
  ]
}
```

`StringEquals`を使い、immutable subject、branch ref、Environmentを重ねて限定し、repository / owner wildcard、`repo:*/*:*`、branch wildcard、PR subjectを許可しません。actual immutable IDsとOIDC customizationはimplementation直前に再取得してhumanへ提示します。

### Review candidate — not applied: deployment entry permission

次も非実行candidateです。default qualifier `hnb659fds`とRegionはDEC-016に合わせていますが、actual bootstrap後のrole名 / tag / templateを再確認するまで適用しません。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeReviewedCdkBootstrapRoles",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": [
        "arn:aws:iam::<NONPROD_ACCOUNT_ID>:role/cdk-hnb659fds-deploy-role-<NONPROD_ACCOUNT_ID>-ap-northeast-1",
        "arn:aws:iam::<NONPROD_ACCOUNT_ID>:role/cdk-hnb659fds-file-publishing-role-<NONPROD_ACCOUNT_ID>-ap-northeast-1",
        "arn:aws:iam::<NONPROD_ACCOUNT_ID>:role/cdk-hnb659fds-lookup-role-<NONPROD_ACCOUNT_ID>-ap-northeast-1"
      ],
      "Condition": {
        "StringEquals": {
          "iam:ResourceTag/aws-cdk:bootstrap-role": [
            "deploy",
            "file-publishing",
            "lookup"
          ]
        }
      }
    }
  ]
}
```

初回candidateはcontainer image assetを含まないため`ImagePublishingRole`を省きます。将来container assetがreview済みstackへ必要になった場合だけ、対応するexact role ARNと`image-publishing` tagを専用PRで追加します。direct `ssm:GetParameter`その他のactionがcurrent CLIで必要と判明した場合も、actual bootstrap template / CloudTrail-free dry review / official docsで根拠を示し、exact parameter resourceへ限定してから別途承認します。推測で`Resource: "*"`やapplication administrator permissionへ広げません。

### Mandatory future verification

- `pull_request` workflowとfork codeがOIDC deployment roleを取得できない
- wrong repository、owner、immutable repository ID、Environment、audienceがすべてdenyされる
- protected `main` + `nonprod` Environmentのexpected tokenだけがacceptされる
- Environmentのdeployment branch ruleがfeature branch / tag / PR merge refをdenyする
- GitHub roleはbootstrap role以外をassumeできず、application serviceを直接管理できない
- file / deploy / lookup roleだけを必要に応じてassumeでき、image roleは未承認時にdenyされる
- CloudFormation execution roleはGitHub roleから直接assumeできない
- nonprod EnvironmentからPrivate Alpha roleをassumeできない
- GitHub secret / variable / repositoryにlong-lived AWS access keyがない
- trust削除後は新規sessionが失敗し、既発行sessionの最長1時間riskがrunbookどおり扱われる
- token / STS credentialがlog、artifact、outputへ出ない

### Pre-implementation Human Gate

OIDC implementation前に、次の実値と設定案をrepositoryへcommitせず人へ提示し、明示承認を得ます。

1. Provider URL: `https://token.actions.githubusercontent.com`
2. Audience: `sts.amazonaws.com`
3. Repository: `Ryo-9/daw.connect.app`
4. GitHub Environment `nonprod`と`main`限定条件
5. current immutable subjectの完全一致値
6. IAM role name
7. exact trust policy
8. exact deployment-entry permission policyとbootstrap role一覧
9. role maximum 3,600秒、workflow request 1,800秒、session name
10. workflow event / trigger、checkout ref、job permission
11. Environment protection / reviewer / bypass設定
12. rollback、trust removal、session revocation、provider removalの手順

このreview後もOIDC provider / role / Environment / workflowは**not implemented / not approved for execution**です。CLOUD-003C actual bootstrapも別Human Gateです。

### Official references（2026-09-11確認）

- [GitHub: Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)
- [GitHub: OpenID Connect reference](https://docs.github.com/en/actions/reference/security/oidc)
- [GitHub: Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [AWS IAM: Create a role for a GitHub OIDC provider](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)
- [AWS IAM: OIDC federation condition keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html#condition-keys-wif)
- [AWS STS: AssumeRoleWithWebIdentity](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html)
- [AWS CDK: Security best practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices-security.html)
- [AWS CDK: Deploy applications](https://docs.aws.amazon.com/cdk/v2/guide/deploy.html)
- [AWS CDK: Bootstrap an environment](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html)

## AUTH-001-DESIGN: Cognito authentication and Web session contract

### Status and boundary

初回調査日: 2026-09-11。Human review revision: 2026-09-11。この章は、2人のinvitation-gated friend test向けにAmazon Cognito User Poolsとbrowser sessionの境界を実装前に定める設計です。Cognito user pool / domain / app client / user、invitation、callback URL、client secret、session / device store、API integration、AWS resourceは作成していません。AUTH-001 runtime実装はCLOUD-003Cのfoundation execution gateと、このrevised designのreviewが完了するまでblockします。

認証と認可を次のように分けます。

```text
Cognito authentication
Who is this person?
        ↓
private auth-subject mapping
internal StreamBand User
        ↓
canonical resource + strong ACTIVE BandMembership
AUTHZ-001 capability
What may this member do in this Band?
```

Cognito group、email、画面上のrole、sessionが存在することだけでSong / Asset accessを許可しません。

### Friend-test authentication scope

MVPで扱うもの:

- invitation-gated self-service signup、email verification、password creation
- email + password sign in / sign out
- forgot-password / reset
- session expiration / renewal
- invalid、verification pending、reset required、disabled userの安全な案内
- Cognito `sub`からinternal Userへのprivate mapping
- Membership removal後の次requestからの即時authorization deny
- independent multi-device sessionと将来のtrusted-device管理
- StreamBand User state、30-day account deletion recovery、collaboration historyのanonymized retention
- Private AlphaまでのPasskey-preferred候補と重要操作のstep-up authentication

DEFER:

- open public signup、social login、enterprise SSO、anonymous access
- billing identity、大規模なinvitation automation、複数identity provider
- public account recovery support portal、advanced threat protection、WAF
- Companion / native client。将来追加する場合はWeb app client / BFF cookieを再利用しない

### Sign-in identifier decision

**Human-approved decision: user-facing sign-in identifierはemail address。** 初回の基本UXは`email + password`です。Provider内部usernameのexact implementationをUXの前提にはせず、invite-only self-service signup、Managed Login、将来のPasskeyとの整合をAUTH implementation gateで確認します。

| option | evaluation |
| --- | --- |
| emailをCognito username attributeとして使う | user-facing UXと一致して単純。ただしCognito設定後の変更制約とPasskey username promptをimplementation時に確認する |
| provider内部username + email alias | internal provider identityをemail変更から分離できるが、invite-only Managed Login signupとの整合と運用が増える可能性がある |

- user poolはcase-insensitiveを候補とし、emailのcase差で別identityを作らない
- user-facing loginはemailだけとし、provider usernameをpublic StreamBand IDや画面上の所有権として使わない
- emailはverifiedになるまで通常accessへ進めない
- email変更時は新しいaddressのverificationを完了するまで、既存verified aliasを安全に保つ設定候補を実装taskで確認する
- Cognito `sub`はprovider内で固定のauth subjectですが、StreamBand public User IDではありません。email、username、`sub`のいずれもBand roleではありません
- `verified issuer + sub`をprivate mappingしてopaque internal User IDを得るため、email変更後もSong / Comment / Proposal / Membership ownershipは変わりません
- signup / email changeでduplicate / alias collisionを検証し、client errorから他accountの存在を開示しません

### Invitation-gated self-service signup

**Human-approved product flow: open public signupはdisabled、invitation-gated self-service signupはenabled。** Friend Test専用のtemporary login UXを作らず、最終製品に近いsignup flowを2人・invite-onlyの範囲で先に使います。一般公開時はauthentication systemを作り直さず、入口をinvite-onlyからpublicへ開放できる設計にします。

```text
Band invitation
→ invitation link
→ StreamBand branded entry
→ Cognito self-service registration
→ email verification
→ password creation
→ login
→ invitation details and role confirmation
→ explicit accept
→ BandMembership
```

Invitation minimum contract:

1. invitationはverified email addressに結びつけ、予測不能tokenとserver-stored digest / stateを持つ候補とする
2. initial expiryは**14日**。accept時にserverがtoken、expiry、revocation、email一致、inviterのcurrent ACTIVE Membershipとinvite capabilityを再検証する
3. link clickやCognito User作成だけではMembershipを作らない。本人がBand名、inviter、roleを確認してexplicit acceptした時だけ作成する
4. `あとで決める`はstateを変えず、期限内のdeclineは本人が実行できる。decline、inviter revoke、expiry後は同じinvitationを復活させず、新規発行を必要とする
5. Cognito User、private auth-subject mapping、invitation、BandMembershipは別record / transitionとして扱い、partial failureをreconcileする
6. default invited roleは`Editor`。OwnerはAdmin / Editor / Commenter / Guest、AdminはEditor / Commenter / Guestを招待できる。Editor / Commenter / Guestは招待不可
7. Owner roleを通常invitationで付与せず、AUTHZ-001のownership transfer専用flowを使う
8. unknown / invalid / expired / revoked invitationはBandやaccountの存在を漏らさないsafe errorにする

AWS current guidanceではCognito self-service sign-upを有効にするとinternet上の誰でもsign upできます。Managed Loginだけでinvitation tokenをsignupへ安全にbindできると仮定しません。Pre-sign-up validation、StreamBand server-mediated registration、separate app-client / entryなどのexact mechanismは**UNRESOLVED implementation gate**です。Human-approved signup UXをadministrator-created userへ戻して解決しません。`AdminCreateUser` temporary-password flowは、将来のemergency / operator fallbackとして必要性を別reviewしますがprimary flowではありません。

### Web authentication architecture

| option | security / operation | evaluation |
| --- | --- | --- |
| browserがCognito tokenを保持してAWS APIを直接call | BFF session storeが不要で単純だが、malicious JavaScriptによるtoken theftのimpactが大きく、refresh token保護がbrowser責務になる | Web MVPでは不採用 |
| same-origin Backend for Frontend（BFF）がtokenを保持し、browserへHttpOnly cookieを返す | tokenをbrowser JavaScriptへ露出せずsession revokeを制御しやすい。CSRF、server session store、proxy allowlist、Vercel運用が追加責務 | **Web MVP recommendation** |

Web flow:

```text
Browser
→ same-origin Next.js / Vercel BFF login endpoint
→ Cognito Managed Login
→ BFF callback（code + state）
→ BFFがcodeをtokenへ交換
→ Cognito tokenをserver-side sessionへ関連付ける
→ Browserにはopaque session ID cookieだけ
→ Browser request → BFF → allowlisted AWS API
→ BFFがaccess tokenをAuthorization headerへ付与
→ APIがtokenを検証
→ internal User + BandMembership authorization
```

BFFはOAuth confidential clientであり、Cognito token、refresh token、client secretをbrowserへ返しません。server-side session storeはopaque session ID、encrypted token material、expiry、internal User reference、revocation stateだけを保持する候補です。保存場所、encryption key、TTL、VercelからAWSへのcredential boundaryはAUTH-001 implementation前の専用physical-design gateで確定します。session storeを決めるまでtokenをclient-side cookieへ詰めるfallbackへ移行しません。

BFF proxyは任意URLを受けず、approved AWS API host / path / methodへの固定mappingだけを持ちます。将来のCompanion Appは別のpublic app client + Authorization Code / PKCEをreviewし、Webのconfidential client secretやcookie sessionを共有しません。

### Login UI and OAuth decision

**Human-approved decision: StreamBand branded entry UIからCognito Managed Loginへ移動し、StreamBandへ戻る。** Managed LoginにはStreamBandのlogo、色、dark/light等の利用可能なbrandingを適用します。Password入力、signup、verification、forgot-password、Passkey候補をprovider surfaceへ寄せ、完全custom password formは初期必須にしません。明確なUX価値が得られた場合だけ将来再評価します。

- OAuth flow: Authorization Code grant only
- PKCE: transactionごとに新しいverifierを作り、`S256`を使う
- `state`: login transactionへbindしてcallbackでconstant-time比較し、replay後は再利用不可
- `nonce`: transactionごとに作り、verified ID token claimと照合する
- Implicit grant: tokenがfront channelへ露出しPKCEを使えないため不採用
- Client credentials: human Web sign-inでは有効化しない
- callback / logout URL: environmentごとのexact allowlist。fragment / wildcardなし

Managed Login独自cookieは1時間有効で、短いapplication tokenを設定しても同じbrowserが1時間以内にcredentialなしで再認証できる場合があります。StreamBand logoutはBFF sessionだけでなくCognito `/logout`へbrowserをredirectしてManaged Login cookieもclearする候補とします。

### Cognito app-client candidate

| setting | Web MVP candidate |
| --- | --- |
| client type | confidential traditional Web app client |
| client secret | あり。ただしBFFのsensitive server configurationだけに保存し、browser / repository / PR / logへ出さない |
| grant | Authorization Code only + PKCE S256 |
| identity provider | Cognito local user only |
| scopes | `openid`、`email`、review済みAPI scopeだけ。`profile`や`aws.cognito.signin.user.admin`は必要性が出るまで要求しない |
| token revocation | enabled |
| refresh rotation | enabled、retry grace **10秒**候補 |
| user-existence protection | `PreventUserExistenceErrors=ENABLED` |
| callback / logout | local / nonprod / Private Alphaでexact URLを分離 |
| client credentials / implicit | disabled |

Client ID、user pool ID、issuer / domainはpublic configurationになり得ますが、値はresource作成taskでenvironmentごとに注入し、このtaskでは作成・記録しません。client secretはconfidential valueです。nonprod client / secret / callbackをPrivate Alphaへ再利用しません。

### Token and application session contract

| artifact | purpose | initial candidate |
| --- | --- | --- |
| ID token | BFFがsign-in時のidentity claimを検証する。API permission tokenやBand roleとして使わない | 1 hour |
| access token | BFFからAWS APIへ提示し、issuer、signature、client / audience、`token_use=access`、expiry、scopeを検証する | 1 hour |
| refresh capability | BFFだけがtoken endpointでsession renewalに使う。API、browser、localStorageへ渡さない | 約7日を支えられるrefresh token、rotation enabled、graceはimplementation時に再確認 |
| BFF session | opaque browser sessionからserver-side token recordを引く | **12-hour idle timeout、7-day absolute timeout** |
| Managed Login cookie | Cognito domain側のinteractive reauthentication state | Cognito fixed 1 hour behaviorを前提として扱う |

通常使用中はBFFがserver-side renewalを行い、activeなmusic review中に突然loginへ飛ばさないことを優先します。Absolute 7日を超えて延長せず、refresh failure、disabled / suspended User、mapping不整合ではsessionを破棄します。Access / ID / refresh tokenのcurrent Cognito supported range、Managed Login cookie behavior、refresh rotationはimplementation直前に公式docsで再確認します。

Session expiry時は、current editing / viewing contextをsafe same-origin routeとしてserver sessionへ一時保持し、`StreamBand Session Expired` screenからreauthentication後に復帰します。Comment body等のprivate draftをURLやcookieへ入れず、復元不能な未保存入力がある場合は期限前warning候補を出します。Explicit logoutでは以前のSongへ自動復帰せず、StreamBand login / home entryへ戻します。

tokenは種類ごとに検証し、ID tokenをAPI access tokenの代用にしません。Cognito `cognito:groups`やOAuth scopeはcoarse identity/API boundary候補であって、`Owner / Admin / Editor / Commenter / Guest`はDynamoDB BandMembershipから毎request判定します。

### Cookie, CSRF, and OAuth transaction security

Primary session cookie candidate:

```text
Name: __Host-streamband-session
Value: opaque random session identifier only
Secure: true
HttpOnly: true
SameSite: Lax
Path: /
Domain: omitted (host-only)
Max-Age: no longer than the 7-day absolute session
```

`SameSite=Lax`は、Discord、LINE、email等の外部siteからSong / Comment共有linkをtop-level navigationで開いた時に、existing sessionを不必要に失わないためのcandidateです。Cross-site subrequestやunsafe methodを許可する根拠にはしません。

session IDはsuccessful login、security-sensitive rotation、privilege-sensitive reauthenticationでrotateし、URL、HTML、localStorage、sessionStorage、logへ出しません。通常renewalでsession IDをrotateする場合は同時request raceを安全に扱います。environment間でcookie name / originを共有しません。

OAuth開始用のshort-lived transaction cookieはopaque transaction IDだけを持ち、`Secure`、`HttpOnly`、`SameSite=Lax`、host-only、最長10分候補とします。これはCognitoからのtop-level callbackでstate / PKCE verifierをserver側recordから解決するためで、main application sessionとは別です。callback後に即deleteします。

Cookie-authenticated mutationはすべて次を要求します。

- safe methodのGET / HEADはstateを変更しない
- exact `Origin` / target hostを検証し、不一致またはsensitive requestで欠落した場合はfail closed候補
- sessionへbindしたsynchronizer CSRF tokenをHTML / JSONで渡し、custom headerで返させる。URLやlogへ入れない
- `Sec-Fetch-Site`等をdefense-in-depthに使えるが、legacy fallbackとしてOrigin / CSRF validationを維持する
- OAuth callbackは`state`、PKCE、nonce、expected issuerを別途検証する

`SameSite`だけをCSRF対策と見なしません。BFFとbrowser appは同一originを原則とし、credential付きcross-origin BFF callを作りません。

### XSS and rendering boundary

- HttpOnlyはJavaScriptによるcookie valueの直接窃取を減らしますが、XSSがuser権限でBFF requestを送ることまでは防ぎません
- Song title、Comment、Version note等のuntrusted textはframeworkのescaped renderingを維持し、sanitizationなしの`dangerouslySetInnerHTML`を使わない
- access / refresh / ID token、authorization code、client secretをbrowser JavaScript、localStorage、sessionStorageへ保存しない
- BFFのoutbound API destinationをallowlistし、client supplied URLへtokenをforwardしない
- CSP、security headers、third-party script governanceはHOST security implementation taskでreviewする

### Internal User mapping

```text
verified Cognito issuer + sub
→ private Auth subject lookup
→ opaque internal User ID
→ canonical resource
→ strong ACTIVE BandMembership
→ AUTHZ-001 capability
```

- provider keyはexpected Cognito issuerと`sub`の組をserverがverified tokenから作る。client submitted `sub`、email、User IDをmapping authorityにしない
- CLOUD-DATA-001の`AUTH#<provider>#<opaqueSubject> / USER` lookupをconditional writeでuniqueにし、1 subjectを複数Userへ割り当てない
- emailはprofile / recovery attributeで、foreign keyやresource owner keyではない。email変更後もinternal User IDとownershipは変わらない
- valid Cognito accountでもmappingがmissing / disabledならapplication sessionを開始せずgeneric support stateにする
- profile responseへraw provider subjectやprivate lookup keyを出さない

### Email verification and password policy

**Email rule:** verified email addressを通常accessの必須条件とします。UNCONFIRMED / unverified stateではBand dataへ進めず、verification / controlled supportだけを案内します。Invitation acceptanceではsignup / authenticated identityのverified emailとinvitation targetをserver-sideで再照合し、単なるclient inputを信用しません。Resend / reset responseは`PreventUserExistenceErrors`とBFF normalizationを使い、account有無をできる限り同じ表示・timingへ寄せます。

Password candidate:

| setting | candidate |
| --- | --- |
| minimum | **8 characters** |
| maximum | Cognito current maximum 256 charactersを受け入れ、silent truncationしない |
| composition | uppercase 1文字以上、lowercase 1文字以上、number 1文字以上。symbolはoptional |
| password manager | 利用可能・推奨。paste / autofillを妨げない |
| temporary password | primary signupでは使わない。AdminCreateUser fallbackを採用する別taskだけで決める |
| routine expiration | なし。漏えい疑い、admin reset、user reset時だけ変更 |
| password history | first friend testではDEFER。feature plan / costと実用性をPrivate Alpha前に再評価 |

Cognitoがpassword hashing / storageを担い、StreamBandはpasswordを保存、転送log、analyticsへ記録しません。8文字 + compositionはhuman-approved initial UXであり、password managerとより長いpassphraseを妨げません。Providerのcurrent setting rangeはimplementation時に公式docsで再確認します。

### Passkey, MFA, and step-up stance

**Human-approved decision: Friend TestではMFAをmandatoryにしないが、Passkeyを無期限DEFERしない。** Private AlphaまでにPasskey registrationとPasskey-preferred normal sign-inをtargetとし、Face ID / Touch ID / Windows Hello等のplatform UXを利用します。Passwordはrecovery pathとして維持します。

Current CognitoはManaged LoginでWebAuthn Passkeyを扱い、Passkey登録には既存authentication sessionが必要です。Choice-based authentication、feature plan、RP ID、user verification、MFAとの組み合わせをPrivate Alpha real-data前にfresh reviewします。ProviderのPasskey credentialとStreamBand device session / trusted-device recordは別conceptです。Synced Passkeyを1 physical deviceと1:1に扱いません。

Security-sensitive operationはstrong reauthentication / step-upを要求する候補です。

- password / email変更
- Passkey追加・削除、device security action
- Band ownership transfer
- account deletion
- future billing-sensitive operation

Successful strong reauthenticationは約**15分**再利用可能なcandidateとし、通常のmusic review、Comment、Version閲覧で毎回step-upを求めません。Exact Cognito WebAuthn / MFA / challenge behavior、recovery factor、costはimplementation gateです。

### Account states and error UX

Authentication provider state、StreamBand User state、BandMembership stateを別conceptとして保持します。Provider固有statusを画面business roleにしません。

| Cognito / application state | behavior |
| --- | --- |
| `UNCONFIRMED` / verification pending | sessionを作らず、verificationまたはcontrolled supportへ案内 |
| `FORCE_CHANGE_PASSWORD` | operator fallbackで生じた場合だけnew-password challenge完了までsessionなし。primary signup stateではない |
| `CONFIRMED` + verified email + mapped internal User | session候補。Band accessは別Membership check |
| `RESET_REQUIRED` | password reset flowだけへ案内し、通常sessionを作らない |
| disabled | existing BFF sessionを破棄し、generic account-unavailable案内。Cognito token revokeだけに依存しない |
| deleted / not found / unknown | generic credential / recovery response。account存在を外向きに区別しない |

wrong credential、unknown accountは「emailまたはpasswordを確認してください」、verification / reset requiredは本人がchallengeを開始できたcontextだけで必要な次stepを示します。Cognito unavailableはretryable service errorとrequest IDだけを返し、password再入力を無限に促しません。Band unauthorizedはAUTHZ-001に従い403 / hidden 404とし、authentication failureと混同しません。

StreamBand User state:

| state | application behavior |
| --- | --- |
| `ACTIVE` | authentication後にMembership / capability次第で利用可能 |
| `SUSPENDED` | new / existing application accessを停止し、sessionをrevoke。Band historyは保持 |
| `DELETION_PENDING` | application accessを即停止し、sessionをrevoke。30-day recovery grace中 |
| `DELETED` | login不可。PII / auth mappingを削除またはanonymizeし、必要なcollaboration historyはFormer member表示へ置換 |

BandMembershipの`ACTIVE / REMOVED`等はこれと別です。Userが`ACTIVE`でも特定Bandで`REMOVED`ならそのBandへ入れず、Cognito accountが有効でもStreamBand Userが`SUSPENDED / DELETION_PENDING / DELETED`ならapplication accessを許可しません。

### Forgot-password, sign-out, and revocation

Forgot-password candidate:

1. Managed Loginのforgot-password surfaceからuser-facing email addressを入力する
2. Cognito / BFFはexisting / unknownをできる限り同じoutward responseへ正規化する
3. verified delivery channelへshort-lived codeを送る
4. codeとnew passwordを確認し、成功時は**全既存StreamBand sessionを無効化**する
5. loginへ戻り、新しいsessionを開始する

provider側quotaに加え、BFF / edgeでIP、opaque account bucket、request categoryのprogressive delay / throttling候補を設けます。単純な「5回失敗で30分固定lock」は採用しません。Login、reset request / confirm、verification resend、OAuth callback failureを別bucketにし、emailやraw Cognito errorをlog keyにしません。

Sign-out candidate:

1. CSRF-protected POSTでBFF logoutを開始する
2. **current deviceの**server-side sessionをinvalidにし、current refresh tokenをrevokeする
3. `__Host-streamband-session`をexpireする
4. browserをCognito `/logout`へredirectし、StreamBand login / home entryへ戻す。以前のSongへ自動復帰しない
5. current device logoutで他の正常なdevice sessionを失効させない

Cognito JWTはself-containedなので、signature / expiryだけを独自検証するconsumerはrevocationを即時反映しない場合があります。WebではBFF sessionを入口にし、AWS API側のtoken validation method、revocation expectation、1-hour access-token residual windowをimplementation testで確認します。Password reset、User suspend / delete、all-device logoutではUser session indexから全sessionをinvalidateできる設計候補にします。

### Multi-device, trusted device, and security actions

同一accountでMac、Windows、iPhone、iPad / Android等の複数端末へ同時loginできます。各deviceは独立したsession ID、refresh lineage、created / last-used time、revocation stateを持つ候補で、current-device logoutは他端末へ影響しません。

New device candidate flow:

```text
authentication
→ additional identity verification when risk requires
→ security notification
→ trusted device registration
```

- 同じtrusted deviceの通常loginごとにはnew-device notificationを送らない
- trusted statusは**180日未使用**でexpireし、active regular-use deviceはtrustを維持する
- browser fingerprintingをprimary identityにせず、server-issued opaque device / session recordとstrong authentication eventを基礎にする
- future native appはOS secure storageをcredential / session materialの候補とする
- exact device credential、rotation、risk signal、Cognito remembered-device / WebAuthnとの関係はphysical-design taskで決める

Future Settings → Security → Logged-in devicesは次を提供します。

- current device logout
- specified device logout
- specified device protect: target sessionsとtrusted statusをrevokeし、次accessでstrong verificationを要求
- all other devices / all devices logout

Known lost deviceではspecified-device protectを優先でき、account-wide compromise疑いではall-device logout + password / Passkey / email等のcredential reviewを行います。Passkey credential managementとdevice session / trusted-device managementは別画面 / conceptにします。

Security notificationはFriend Testではemail中心です。New / unusual device、password / email / Passkey change、device protect、account deletion等を即時候補とし、通常のtrusted-device loginでは毎回通知しません。Future mobileではrisk / importanceに応じてpush + emailを使い分けます。

Risk response candidate:

| risk | response |
| --- | --- |
| normal | normal login / renewal |
| new or unusual device | additional identity verification + security notification |
| higher risk | step-up authentication / email verification candidate |
| obvious repeated attack | stronger progressive throttling。単発の怪しさだけで即account lockしない |

### Account deletion and history retention

```text
deletion request + strong step-up
→ immediate application access stop
→ all sessions revoke
→ DELETION_PENDING
→ 30-day recovery grace
→ final deletion / PII anonymization
```

- 30日以内のrecoveryはstrong identity verificationとHuman-reviewed support / self-service contractで行い、recovery後は全deviceで再authenticationする
- final deletionでemail、profile、auth credential / mapping等のPIIを削除またはanonymizeする
- Comment、Proposal、Decision、Version contribution等はBand production historyに必要な範囲を保持し、authorは`Former member`相当のopaque tombstone identityで表示できる
- collaboration historyへemail、Cognito username / `sub`、deleted profileを残さない
- last ACTIVE Ownerはownership transferなしにaccount deletionやBand leaveを完了できない
- full legal retention / erasure、backup内expiry、AuditEvent retentionはPrivate Alpha privacy / deletion taskで確定する

### Membership removal boundary

`BandMembership=REMOVED`はCognito account disable / deleteではありません。Userは別Bandやaccount settingsへsign inできる可能性がありますが、removed Bandのprotected requestは次のstrong base-table Membership readで拒否します。

- removal operation後にUserのactive BFF sessionsを通知 / invalidateできるなら行うが、authorization correctnessをsession invalidationへ依存させない
- already issued S3 access instructionのresidual riskはSTORAGE-001-DESIGNの5分expiryまで残る
- stale page、valid Cognito token、old role claim、known Song / Asset IDはaccess proofにならない
- normal Band removalにCognito user deletionを使わない

### API and hosting boundary

Future protected request:

```text
browser session cookie
→ same-origin BFF session + CSRF validation
→ BFF retrieves server-side access token
→ fixed AWS API routeへBearer tokenを付与
→ API verifies issuer / signature / client-or-audience / token_use / expiry / scope
→ auth subject lookup
→ canonical resource
→ strong ACTIVE BandMembership
→ AUTHZ-001 capability
```

HOST-001のVercel Pro primary candidateを前提に、browserとBFFは同一origin候補です。nonprod / Private Alphaはuser pool、app client、session namespace、callback / logout originを分けます。

- localhostはlocal developmentに限りexact `http://localhost:<port>/<callback-path>`候補を登録できる
- cloud callback / logoutはHTTPS必須で、wildcard、arbitrary Vercel Preview URL、user-controlled return URLを許可しない
- Preview deploymentはnonprod synthetic dataに限定し、Private Alpha app client callbackへ登録しない
- open redirectを防ぐため、post-login return pathはsame-origin relative path allowlistに限定する

### Configuration and secret classes

| class | examples | handling candidate |
| --- | --- | --- |
| public environment configuration | Region、Cognito issuer / domain、user pool ID、app client ID、public API origin | valueはdeployment environmentへ注入。secretと偽らないが、environment混同を防ぎrepositoryへ実値をhard-codeしない |
| sensitive server configuration | app client secret、session encryption / signing key、server-side token material、provider admin credential | Vercel / approved secret managerのserver-only setting。browser bundle、repository、PR、logへ出さない |
| browser cookie | opaque session ID、opaque OAuth transaction ID | HttpOnly / Secure cookie。Cognito token / user or music dataを含めない |

このtaskでは`.env`、secret nameの実装、値、callback URLを追加しません。BFFからsession store / AWS APIへ接続するcredential方式はOIDC deployment identityと混同せず、runtime service identityの別Human Gateで決めます。

### Logging, abuse, cost, and recovery

Safe log候補:

- request ID、opaque internal User ID（必要な場合だけ）、auth event category、result、safe provider error category、latency

記録禁止:

- password、temporary password、authorization code、PKCE verifier、state / nonce value
- access / ID / refresh token、cookie、client secret、reset / verification code、raw claims
- private email、Song / file / Comment情報、private callback / signed URL

Rate-limit候補はlogin failure、reset request / confirm、verification resend、callback failureを分け、Cognito quotaだけをabuse controlと見なしません。threshold、WAF、edge productはimplementation / operations taskで決めます。

Cognitoの主なcost driverはfeature planごとのMAU、federated MAU、M2M request、email / SMS delivery、advanced threat protection等です。2 local userのfriend testは小規模と見込みますがfreeを保証しません。Managed Loginに必要なfeature plan、Tokyo Regionのcurrent price、email delivery、Budgetをresource作成直前に公式pricingで再確認します。

Recovery候補:

- one user locked out: もう一方のBand Owner権限ではなく、controlled auth support runbookでidentityを確認してreset / resendする
- both users locked out: separate AWS operator accessとreview済みCognito admin runbookで復旧し、root accountを通常手段にしない
- email delivery failure: address / bounce / sending quotaをsafe metadataだけで確認し、別channelでpasswordやcodeを送らない
- Cognito configuration error: IaC rollbackとuser/session recoveryを分け、user pool replacementを即実行しない
- BFF cookie/session bug: server-side sessionsをinvalidateし、Cognito token revoke / Managed Login logoutを組み合わせる。Band dataは変更しない

### Mandatory future tests

- valid login、wrong password、unknown accountのnon-enumerating outward response
- invitation-gated signup、verified email、explicit acceptance、14-day expiry、revoke / decline / inviter capability loss
- link click / Cognito User creationだけではMembershipを作らず、default roleがEditor、Owner invitationを拒否する
- open public signupを拒否し、invite-only gateを迂回できない
- verification required、password creation、password reset後のall-session invalidation
- access / ID / refresh token type、issuer、audience / client、expiry、nonceの誤りをdeny
- 12-hour idle / 7-day absolute expiration、active renewal、safe route復帰、explicit logout時のhome復帰
- independent multi-device session、current / specified / all-device revoke、specified-device protect
- 180-day unused trusted-device expiryと、active trusted deviceへ毎回new-device通知しないこと
- Passkey登録 / preferred sign-in、password recovery、15-minute step-up reuse、sensitive operationのstep-up requirement
- disabled Cognito userをdenyし、BandMembership REMOVEDをvalid Cognito accountでも次requestからdeny
- StreamBand User `SUSPENDED / DELETION_PENDING / DELETED`をdenyし、stateがBandMembershipと混同されない
- forged internal User ID / email / `sub`を無視し、auth-subject mappingをserver tokenから解決
- cross-Band resourceをAUTHZ-001どおりdenyし、Cognito groupをBand roleとして使用しない
- browser localStorage / sessionStorage / HTML / URL / logにtokenやsecretが存在しない
- session / transaction cookieのSecure、HttpOnly、SameSite、Path、Domain、expiryが契約どおり
- external top-level Song / Comment linkでLax sessionを利用でき、cross-site POST / subrequestはCSRF / Origin ruleで拒否される
- cookie mutationのCSRF token、Origin / Host、safe-method rule、OAuth state / nonce / PKCE mismatchをdeny
- exact callback originだけを許可し、open redirect、wildcard Preview callback、wrong environmentをdeny
- email変更後もinternal User ID / ownershipが安定し、unverified new aliasを通常accessに使わない
- risk responseがprogressiveで、少数failureによる固定30分lockを行わず、obvious attackをthrottleする
- account deletionが即access停止、30-day recovery、final PII anonymization、Former member history、last Owner invariantを守る
- BFF outbound destination allowlistを外れるURL / methodへaccess tokenをforwardしない
- private-alpha app client / callback / session namespaceがnonprodから分離される
- error / audit logにpassword、code、token、cookie、client secret、private emailがない

### Compact authentication contract

| item | decision / candidate |
| --- | --- |
| identity provider | Amazon Cognito User Pools（adopted design、not created） |
| user model | 2 invitation-gated self-service users。open public signup disabled |
| sign-in identifier | user-facing email + password。provider username implementationはgate |
| invitation | unpredictable token、14-day expiry、server revalidation、explicit accept、default Editor |
| login UI | StreamBand branded entry → branded Cognito Managed Login → StreamBand |
| Web architecture | same-origin confidential BFF、server-side token/session、opaque HttpOnly cookie |
| OAuth | Authorization Code + PKCE S256、state + nonce、Implicit disabled |
| app client | confidential Web client、secret server-only、token revocation / rotation enabled |
| lifetime | access 1h、ID 1h、refresh capability約7日、BFF idle 12h / absolute 7日 |
| cookie / CSRF | `__Host-` host-only Secure HttpOnly SameSite=Lax + synchronizer token + Origin validation |
| internal mapping | verified issuer + `sub` → private lookup → internal User。emailはforeign keyにしない |
| email | verified address required。email変更でinternal ownershipは変わらない |
| password | 8+、uppercase / lowercase / number各1以上、symbol optional、manager推奨、routine expiryなし |
| Passkey / MFA | Friend TestでMFA mandatoryではない。Private AlphaまでにPasskey-preferred候補をfresh review |
| step-up | sensitive operationで要求し、successful strong reauthを約15分再利用候補 |
| devices | independent multi-device sessions、trusted-device unused expiry 180日、specific-device protect |
| logout | current deviceだけを通常logout。specified / all-device revokeは別action |
| account deletion | immediate stop → DELETION_PENDING 30日 → PII anonymization、Band historyはFormer memberとして保持 |
| authorization | Cognitoだけでは不可。canonical resource + strong ACTIVE Membership + capability |
| environment | local / nonprod / Private Alphaでuser pool / client / callback / sessionを分離 |

### Private Alpha re-review and unresolved implementation gates

Private Alphaへreal unreleased musicを投入する前に、次を再承認します。

- separate account / user pool / app client / domain / callback / session namespace
- Managed Login feature planとcurrent Cognito / email delivery cost
- invitation-gated self-service signupのexact Cognito / server mechanismとprovider username
- Passkey / WebAuthn、RP ID、user verification、MFA interplay、lost-factor / password recovery
- server-side session / trusted-device store、token encryption、TTL、revocation index、Vercel-to-AWS runtime identity
- client secret storage / rotation、callback protection、CSP / security headers
- API Gateway token validation / revocation semanticsとBandMembership strong-read test
- privacy notice、account deletion / export、30-day recovery、history anonymization、email change、support / incident runbook

### Official references（2026-09-11確認）

- [Amazon Cognito: User pool managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-managed-login.html)
- [Amazon Cognito: Apply branding to managed login](https://docs.aws.amazon.com/cognito/latest/developerguide/managed-login-branding.html)
- [Amazon Cognito: Authentication flows and WebAuthn passkeys](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow-methods.html)
- [Amazon Cognito: Application-specific settings with app clients](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html)
- [Amazon Cognito: Using PKCE in authorization code grants](https://docs.aws.amazon.com/cognito/latest/developerguide/using-pkce-in-authorization-code.html)
- [Amazon Cognito: Working with user attributes](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html)
- [Amazon Cognito: Configuring policies for user creation](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-admin-create-user-policy.html)
- [Amazon Cognito: Pre sign-up Lambda trigger](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html)
- [Amazon Cognito: Creating user accounts as administrator](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-create-user-accounts.html)
- [Amazon Cognito: Password and account recovery](https://docs.aws.amazon.com/cognito/latest/developerguide/managing-users-passwords.html)
- [Amazon Cognito: Managing user existence errors](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pool-managing-errors.html)
- [Amazon Cognito: Token validity quotas](https://docs.aws.amazon.com/cognito/latest/developerguide/quotas.html)
- [Amazon Cognito: Refresh tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-the-refresh-token.html)
- [Amazon Cognito: Token revocation](https://docs.aws.amazon.com/cognito/latest/developerguide/token-revocation.html)
- [Amazon Cognito: User account disable / delete](https://docs.aws.amazon.com/cognito/latest/developerguide/how-to-manage-user-accounts.html)
- [Amazon Cognito pricing](https://aws.amazon.com/cognito/pricing/)
- [RFC 10017: OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html)
- [RFC 9700: OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

Current feature、quota、pricing、Managed Login behaviorはresource / runtime実装直前に再確認します。

## STORAGE-001-DESIGN: Private Preview / MIDI storage contract

### Status and scope

設計日: 2026-09-11。この章はCloud MVPの事前設計であり、S3 bucket、IAM、API、Lambda、KMS key、CORS、lifecycle、AWS resourceは作成していません。AWS接続、CDK bootstrap / deployも行っていません。実装はCLOUD-003 foundation execution gateと本設計のhuman review後に、別taskで行います。

初回friend testの対象は次の3 kindだけです。

- `AUDIO_PREVIEW`: DAWからuserが書き出した軽量review音源。server transcodingなし
- `SOURCE_MIDI`: 特定Versionに対応するread-only source
- `PROPOSAL_MIDI`: SOURCE_MIDIとは別Asset / objectの提案

Stemはdata model上の将来候補に残しますが、最初のupload flowからはDEFERします。DynamoDBはAsset metadataだけを保持し、binaryはprivate S3へ置きます。Proposal DecisionはSOURCE_MIDI / PROPOSAL_MIDIを上書きせず、SongVersionも自動作成しません。

### Bucket model and environment boundary

| Option | Benefit | Cost / risk | Decision |
| --- | --- | --- | --- |
| environmentごとに1 private bucket | IAM、CORS、Versioning、lifecycle、monitoring、restore drillを一組で理解でき、3 kindをopaque prefixで分離できる | bucket内policy mistakeのblast radiusは同environment全Assetへ及ぶ | **MVP採用候補** |
| asset classごとに複数bucket | kindごとのpolicy / lifecycleを物理分離できる | bucket、IAM、alarm、recovery、CORSが増え、2 user規模では運用負担が大きい | 見送り |

nonprodとPrivate Alphaは別AWS account / environmentで、bucketも共有しません。candidate physical nameは`streamband-<environment>-assets-<opaque-suffix>`です。suffixはglobal uniqueness用のrandom / deployment identifierであり、account ID、email、Band / Song名を使いません。実bucket名はresource作成taskでcurrent naming ruleとcollisionを確認して決めます。

### Public access and encryption baseline

後続IaCでは次をdefault任せにせず、意図として明示します。

- S3 Block Public Accessの4設定をすべて有効化する
- S3 Object Ownershipを`Bucket owner enforced`とし、ACLを無効化する
- public ACL、public bucket policy、website hosting、anonymous accessを作らない
- bucket policyで`aws:SecureTransport=false`をdenyし、HTTPSだけを許可する
- upload / accessはserver authorization後のshort-lived instructionだけとする
- access roleは必要なbucket / prefix / operationへ限定し、clientへAWS credentialを渡さない

| Encryption option | Benefit | Cost / operation | Nonprod decision |
| --- | --- | --- | --- |
| SSE-S3 | S3がkey管理を担当し、default encryptionと単純なIAMで開始できる | customer-managed key policy / key feeを増やさない。S3自体のstorage / request費用は残る | **採用候補** |
| SSE-KMS customer-managed key | key policy、audit、rotation / disable等をより明示的に制御できる | KMS key / requestのcost、key policy、grant、recovery、disable事故の運用が増える | nonprodでは見送り。Private Alpha前に再review |

nonprodの保存時暗号化は**SSE-S3**を選び、bucket default encryptionとして明示します。S3は現在すべてのnew objectを暗号化し、SSE-S3がdefaultですが、review可能性のためIaCにも意図を残します。friend test / synthetic data段階でcustomer-managed KMS keyのkey fee、key policy、recovery burdenを増やしません。Private AlphaがSSE-S3を継承するとは決めず、real unreleased music投入前にthreat model、key control、costを再reviewします。

### Opaque object key

candidate convention:

```text
<environment>/assets/<asset-kind>/<asset-id>/<object-id>
```

synthetic examples:

```text
nonprod/assets/audio-preview/ast_demo_01/obj_demo_01
nonprod/assets/source-midi/ast_demo_02/obj_demo_02
nonprod/assets/proposal-midi/ast_demo_03/obj_demo_03
```

- key componentはserver生成のopaque stable IDとsafe kind codeだけにする
- Band名、Song title、version label、user email / name、original filename、secret project nameを含めない
- keyはinternal storage locatorで、Asset public IDでも認可情報でもない
- bucket名、key、S3 version IDを通常のclient DTO / logへ出さない
- original filenameはsanitized表示metadataとしてDynamoDBへ分離する
- 1 Asset = 1 unique keyとし、reuseしない。SigV4のconditional `If-None-Match: *`をupload instructionへ含め、既存current objectへのwriteを拒否する候補

S3 Versioningはrecovery defenseであり、同じkeyへ通常上書きするapplication version管理ではありません。SOURCE_MIDI更新が必要なら、新しいAsset / keyと明示SongVersionを作ります。

### Formats and application limits

| Kind | Initial application limit | Accepted declaration | Required content evidence |
| --- | ---: | --- | --- |
| `AUDIO_PREVIEW` | **80 MiB** | `.mp3` + `audio/mpeg`、`.wav` + `audio/wav`。`audio/x-wav`はlegacy declarationとして受けてもverified MIMEは`audio/wav`へ正規化 | MP3 frame / ID3またはRIFF/WAVEのbounded signature check |
| `SOURCE_MIDI` | **10 MiB** | `.mid` / `.midi`、`audio/midi` / `audio/x-midi`候補 | Standard MIDI Fileの`MThd` headerとbounded structure check |
| `PROPOSAL_MIDI` | **10 MiB** | SOURCE_MIDIと同じ | Standard MIDI File。SOURCE_MIDIとはdifferent Asset ID / key必須 |

これらはS3 hard limitではなく、初期friend test用のconservative application limitです。実測した曲長、sample rate、upload time、costをreviewして変更します。nonprod Bandのstored current + retained bytes上限は**2 GiB候補**とし、upload request時のdeclared sizeとserver-side usage projectionで早期拒否します。quotaはbilling hard capではなく、concurrent upload / Versioning分もmonitoringで確認します。

extensionまたはMIMEだけではcontentを証明できません。client申告、signed request header、S3 metadata、checksum、bounded magic / header checkを照合します。StreamBandを一般file hostingにせず、archive、executable、DAW project、plugin binary、任意documentを許可しません。server-side transcoding、waveform生成、MIDI編集 / 実行は行いません。

### Upload state machine

`UPLOADING`は採用しません。browserからS3への進捗はclient-localであり、serverが正確に保証できないためです。

| Current | Trigger / actor | Next | Rule |
| --- | --- | --- | --- |
| none | authorized upload request / server | `PENDING_UPLOAD` | metadata、opaque key、expiry、expected SHA-256を作成 |
| `PENDING_UPLOAD` | upload complete / original uploader | `VERIFYING` | `expectedRevision`とidempotencyをconditional check |
| `VERIFYING` | server verifier success | `AVAILABLE` | object / key / size / checksum / signature / relationship一致 |
| `VERIFYING` | deterministic mismatch / expiry | `FAILED` | access不可。safe reason categoryだけ保存 |
| `PENDING_UPLOAD` | cancel / expiry reconciliation | `DELETION_REQUESTED` | objectが存在しても公開しない |
| `FAILED` | authorized cleanup | `DELETION_REQUESTED` | 同じkeyへretryせずnew Assetを作る |
| `AVAILABLE` | AUTHZ-001 delete request | `DELETION_REQUESTED` | 直ちにnew access instructionをdeny |
| `DELETION_REQUESTED` | reconciler confirms object cleanup / retention handling | `DELETED` | metadata tombstoneとauditを保持 |

`AVAILABLE`、`FAILED`、`DELETED`からupload stateへ戻しません。retryはnew Asset / object keyです。Proposal Decisionはこのstate machineを変更しません。

### Upload request contract

serverはinstruction発行前に次を順に確認します。

1. identityをauthenticateしinternal Userを解決する
2. canonical Song / optional Versionを取得し、stored Band relationshipをderiveする
3. base tableからACTIVE Membershipをstrong readする
4. AUTHZ-001の`asset:request-upload` capabilityを確認する
5. kindが3種類のallowlist内で、Version / Proposal intentと矛盾しないことを確認する
6. declared size、extension、MIME、SHA-256形式、filename length / control character / path segmentを検証する
7. application limitとnonprod Band quota候補を確認する
8. `clientOperationId`のidempotencyとduplicate intentを確認する
9. serverがopaque Asset ID / object keyを生成し、`PENDING_UPLOAD` metadataをconditional createする
10. key、`PUT`、content type、SHA-256 header、`If-None-Match: *`、expiryを限定したinstructionを返す

upload instructionのinitial lifetimeは**15分**です。original filenameはpath separator、control character、bidi制御文字等を除去 / 正規化し、表示用として長さを制限します。key生成には一切使いません。Asset author / createdAt / key / initial stateはserverが決めます。

### Upload complete and verification

complete requestは`assetId`、`expectedRevision`、`clientOperationId`を受け、checksumやidentityをclientだけから確定しません。

- canonical Asset、stored Band / Song / Version、upload intent actorを取得する
- ACTIVE Membershipと`asset:complete-upload`を再確認し、AUTHZ-001どおりoriginal uploaderだけを許可する
- state=`PENDING_UPLOAD`、instruction expiry、revision、idempotencyを確認して`VERIFYING`へconditional updateする
- S3側のexpected exact keyへ`HEAD`相当確認を行い、object存在、actual size、signed content type、stored checksumを取得する
- persisted expected SHA-256とS3 verified checksumを同じalgorithmで照合する。ETagは特にmultipart時にfull-object hashとは限らないためchecksumに使わない
- bounded range / safe parser候補でMP3、WAV、Standard MIDI Fileのsignatureを確認し、uploaded contentを実行しない
- Asset kind、Band / Song / Version、proposal source / target relationshipを再検証する
- success時だけconditionalに`AVAILABLE`へし、verified size / MIME / checksum / timeをserver fieldへ保存する

同じoperationと同じinputのcomplete retryは同じresultを返します。異なるinputで同じidempotency keyを使う場合は409です。missing object、wrong key、oversize、checksum / signature mismatch、expired intentは`AVAILABLE`にせず`FAILED`またはretriable verification errorにし、別objectを代替表示しません。

S3 / networkの一時errorは直ちにdeterministic `FAILED`へせず、`VERIFYING`のままbounded retry候補とします。retry上限後もobject状態を確定できない場合はaccessを拒否したままoperator reconciliationへ送り、成功を推測しません。

S3 object作成とDynamoDB updateはatomicではありません。objectだけ存在する場合はprivate orphanとしてreconciliation対象、metadataだけ`AVAILABLE`でobjectがない場合はaccessをfail closedしてoperator investigation対象にします。reconcilerはAsset IDとsafe reasonだけを扱い、filename / title / URLをlogへ出しません。

### Short-lived access and residual risk

upload instructionは15分、download / Preview access instructionは**5分**をinitial candidateとします。underlying role credentialがそれより先に切れればinstructionも先に失効し得ます。

すべてのnew access requestで:

1. identityをauthenticateする
2. canonical Assetを取得する
3. stored Band / Song / Version chainをderive / validateする
4. ACTIVE Membershipをbase tableでstrong readする
5. `asset:access` capabilityを確認する
6. state=`AVAILABLE`を要求する
7. exact key / `GET` / 5分に限定したinstructionを発行する

removed memberへ新規instructionを出しません。ただし、すでに発行されたURLは取り消し可能なsessionではなくbearer capabilityとして最長5分利用され得ます。短いexpiry、HTTPS、ログ非記録でriskを限定し、即時revocationが必須になる場合はserver proxy / CloudFront等を別decisionで再評価します。expired URLは自動更新せず、application authorizationを再実行します。URL、signature、query string、keyをDB、analytics、error reportへ永続化しません。

### CORS contract

browser direct upload / accessを採用する場合だけ、bucket CORSを次へ限定します。

- `AllowedOrigins`: review済みのexact nonprod / Private Alpha web origin。wildcard禁止
- `AllowedMethods`: `PUT`, `GET`, `HEAD`だけ。browser / S3仕様上不要なmethodは削る
- `AllowedHeaders`: `Content-Type`、`If-None-Match`、`x-amz-checksum-sha256`等、実装で実際に署名するheaderだけ。包括的wildcardは避ける
- `ExposeHeaders`: UIがverificationに必要な`ETag` / checksum response headerだけ
- `MaxAgeSeconds`: initial **300秒**

CORSはbrowser policyでありauthorizationではありません。origin追加、custom domain、Vercel Preview originの扱いはhosting / Auth integration taskで明示reviewし、任意PR Preview originをwildcardで許可しません。

### Versioning, retention, and lifecycle

- **nonprod**: S3 Versioningを最初のstorage implementation候補で有効化し、synthetic dataによるrestore / delete-marker drillを行う。unique key + conditional writeがprimary overwrite preventionで、Versioningはrecovery defense
- **Private Alpha candidate**: Versioningを有効化する。ただしreal data投入前にretention、cost、delete permission、recovery runbookを別Human Gateで再承認する
- simple deleteはversioned bucketでdelete markerを作り、current keyが404相当になる。過去versionの物理削除とは別操作
- SOURCE_MIDI immutabilityはapplication / IAM / conditional writeで守り、Versioningがあるからoverwrite可とはしない
- SongVersionとS3 object versionは別概念。S3 version IDをcollaboration version labelに使わない

lifecycle candidate:

| Target | nonprod candidate | Private Alpha candidate |
| --- | --- | --- |
| incomplete multipart upload | multipart導入時は7日後abort | 同じ候補。導入前に確認 |
| `PENDING_UPLOAD / FAILED` orphan object | reconcilerが`CleanupEligible`相当へしたobjectだけ7日後cleanup候補 | automatic cleanup期間を別承認。初期はoperator review優先 |
| `DELETION_REQUESTED` current object | application cleanupがretention / audit確認後にdelete marker作成 | immediate physical purgeなし。human-approved retention後 |
| noncurrent versions | synthetic nonprodで30日候補をrestore drill後に判断 | 初期auto-expirationなし。実測costとrecovery要件後に決定 |
| delete markers | orphan / version整合を確認してcleanup候補 | auto removalなしから開始 |

bucket-wide current object expirationは設定しません。未公開音源へaggressive lifecycleを適用せず、Private Alphaのnoncurrent version / physical purgeは別human approvalとします。lifecycleはmetadata stateを直接読めないため、serverが安全にcleanup eligibilityを確定しない限りprefix / tagだけで削除しません。

### Multipart decision

初期上限がPreview 80 MiB、MIDI 10 MiBのため、MVPは**single-part conditional PUT**で開始します。AWSは一般に100 MB以上でmultipartをbest practiceとするため、上限を100 MB以上へ上げる、mobile / slow networkでretry costが問題になる、または実測でupload reliabilityが不足した場合にmultipartを別taskで追加します。未使用でも将来の安全策として、multipart導入時は7日後の`AbortIncompleteMultipartUpload`を必須にします。

### Validation and malware boundary

audio / MIDIはuntrusted inputです。MVPはallowlist kind、size、declared MIME / extension、SHA-256、S3-side checksum、bounded file signatureを検証します。MIDI eventやaudio codecをserverで実行・演奏・変換せず、uploaded fileをshell / plugin / DAWへ渡しません。browser responseはattachment / mediaとして安全なContent-TypeとContent-Dispositionをserver側metadataから決め、user filenameをheaderへ未escapeで入れません。

malware scan、deep codec validation、archive bomb対策、moderationはwider beta前のrisk review候補です。MVPで専用scan serviceを採用したと偽らず、実装まで「checksum一致 = safe content」と説明しません。

### Logging and privacy

safe log / metric candidate:

- request ID、opaque Asset ID、operation、result、state transition
- size class（exact sizeが不要ならbucket化）、kind code、safe error category、latency
- Band / Songのopaque IDはincident investigationに必要な最小範囲だけ

記録禁止:

- presigned / signed URL、query string、storage object key、bucket名が不要なapplication log
- original filename、Band / Song title、Comment本文、audio / MIDI content
- token、credential、authorization header、session、secret、client-local path

access log / CloudTrail data event等はsecurity value、volume、cost、retentionをimplementation taskで比較し、無期限・全payload loggingを既定にしません。

### Cost drivers and recovery boundary

S3はfreeを保証しません。主なdriverはstored bytes、PUT / GET / HEAD / LIST等のrequest、internet data transfer、Versioningのnoncurrent object、lifecycle / retrieval class、orphan / failed upload、将来SSE-KMSを選ぶ場合のKMS key / requestです。current Tokyo Region pricing、free tier、tax、transfer条件はresource作成直前にAWS公式pricingで再確認します。USD 10 Budgetはmonitoringでありhard capではありません。

DynamoDB PITRはS3 objectを復旧せず、S3 VersioningはDynamoDB Asset metadataを復旧しません。restore drillは次の両方向を含めます。

- objectあり + metadataなし: private orphanとして公開せず、checksum / ownershipを照合してrecoverまたはcleanup
- metadataあり + objectなし: accessをfail closedし、別objectで代替せず、Versioning / backupからisolated recovery
- DynamoDB new-table restore後: Asset relationshipとS3 object / versionをreconcileし、authorization test後だけtraffic切替
- S3 restore後: current metadata state、checksum、Band / Song / Version relationshipを再検証

### Mandatory future tests

- bucket / accountのBlock Public AccessとBucket owner enforced / ACL disabledをIaC assertionで確認する
- public policy / ACLを作れず、HTTP transportがdenyされる
- unauthorized、removed member、cross-Band、forged Asset / Band chainでinstructionを発行しない
- `PENDING_UPLOAD / VERIFYING / FAILED / DELETION_REQUESTED / DELETED`へaccessを出さない
- oversize、unsupported MIME / extension / signature、wrong key、wrong size、checksum mismatchを`AVAILABLE`にしない
- conditional uploadがexisting key overwriteを拒否する
- SOURCE_MIDIを同じkeyへ上書きせず、PROPOSAL_MIDIがdistinct Asset / objectになる
- Proposal DecisionがS3 object / Asset association / SongVersionを変更しない
- complete retryがidempotentで、異なるpayloadのkey reuseを409にする
- signed URL / object key / filename / title / tokenがDB・response identity・logへ残らない
- delete request直後からnew accessをdenyし、physical cleanup後もmetadata tombstoneを保持する
- exact CORS origin / method / headerだけを許可し、wildcard originを拒否する
- DynamoDB-only / S3-only failureとrestore reconciliationをsynthetic dataで検証する

### Compact storage contract

| Item | Decision candidate |
| --- | --- |
| bucket | environmentごとに1 private bucket。nonprod / Private Alphaは別account / bucket |
| encryption | nonprodはexplicit SSE-S3。customer-managed KMSなし。Private Alphaは再review |
| key | `<environment>/assets/<kind>/<asset-id>/<object-id>`、opaque unique IDs、conditional no-overwrite |
| kinds | `AUDIO_PREVIEW / SOURCE_MIDI / PROPOSAL_MIDI`。Stem deferred |
| formats | Preview MP3 / WAV、MIDIはStandard MIDI Fileだけ |
| limits | Preview 80 MiB、各MIDI 10 MiB、nonprod Band 2 GiB候補 |
| state | `PENDING_UPLOAD → VERIFYING → AVAILABLE / FAILED → DELETION_REQUESTED → DELETED`。retryはnew Asset |
| expiry | upload 15分、download / Preview 5分 |
| authorization | canonical Asset chain + strong ACTIVE Membership + AUTHZ capability + current stateをrequestごとに確認 |
| CORS | exact origins、PUT / GET / HEAD、必要headerのみ、300秒。wildcard originなし |
| Versioning | nonprodでrestore drill、Private Alphaでもenable candidate。normal app versioningには使わない |
| lifecycle | current objectのbucket-wide expiryなし。orphan / noncurrent purgeはstate確認とHuman Gate |
| multipart | 初期はsingle-part PUT。100 MB以上 / reliability要件で再評価 |
| logs | request ID / opaque Asset ID / safe categoryのみ。URL / key / filename / content / secretなし |
| recovery | DynamoDB PITRとS3 Versioningを別々にrestoreし、metadata / objectをreconcile |
| implementation | AWS foundation gate後の別task。S3 / IAM / API / runtimeは未実装 |

### Official references（2026-09-11確認）

- [S3 Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
- [S3 Object Ownership and disabled ACLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html)
- [SSE-S3 default encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/specifying-s3-encryption.html)
- [S3 presigned URL expiration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [S3 conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html)
- [S3 checksum validation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html)
- [S3 CORS elements](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html)
- [S3 Versioning delete markers](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeleteMarker.html)
- [S3 multipart upload](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html)
- [Abort incomplete multipart upload lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html)
- [S3 security best practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [S3 pricing](https://aws.amazon.com/s3/pricing/)

## 利用候補

### Amazon S3

音源、MIDI、画像などのファイル保存候補です。

- バケットとオブジェクトは非公開を既定にする
- 公開 URL ではなく、権限確認後の短時間署名 URL を検討する
- 許可形式、最大容量、保存期間、削除手順を決める
- 暗号化、バージョニング、ライフサイクル、CORS を明示的に設定する
- 未完了アップロードや不要ファイルによる費用増加を防ぐ

### Amazon CloudFront

S3 上の許可済みコンテンツを安全かつ効率的に配信する候補です。

- S3 を直接公開せず、Origin Access Control などを検討する
- 署名 URL / Cookie、キャッシュ、削除後の無効化を設計する
- 非公開ファイルが別ユーザーのキャッシュへ漏れないことを確認する

### Amazon Route 53

独自ドメインの DNS 管理候補です。

- 本番公開時にのみ検討する
- ドメイン更新、連絡先、DNS 変更権限を二人で管理する
- 誤設定時の復旧手順を残す

### Amazon CloudWatch

アプリや AWS リソースのログ、メトリクス、アラーム候補です。

- 秘密情報や個人情報をログへ出さない
- 保持期間を明示し、無期限保存による費用増加を避ける
- エラー率、失敗、容量、費用に関するアラームを検討する

### AWS IAM

人とサービスが AWS を操作する権限を管理します。

- root ユーザーを日常利用しない
- 各人に別アカウント / ロールを用意し、MFA を有効にする
- アクセスキーの長期利用を避け、最小権限にする
- 本番と開発の権限・リソースを分離する
- 退任、端末紛失、キー漏えい時の無効化手順を準備する

### AWS Lambda

ファイル検査、メタデータ処理、非同期処理などの候補です。通常の Next.js 処理で十分かを先に確認し、構成を増やす価値がある場合だけ採用します。

### Amazon API Gateway

独立 API や Lambda の公開入口候補です。Next.js 内のサーバー処理との重複や費用を比較し、必要な場合だけ検討します。

### AWS Budgets

予算と使用量の通知に使う候補です。

- アカウント作成直後から小さい予算アラートを設定する
- 通知先を二人で確認する
- アラートは自動停止ではないため、停止手順も用意する

## 追加候補

- AWS Certificate Manager: HTTPS 証明書
- AWS WAF: 公開後の Web 攻撃対策（費用と必要性を評価）
- AWS CloudTrail: AWS 操作の監査
- Amazon SES: 招待や通知メール（送信制限と不正利用対策が必要）
- Amazon RDS: PostgreSQL の候補（他のマネージド DB と比較）

## 環境分離の案

- 開発、検証、本番を混在させない
- 可能なら AWS アカウント自体を本番と非本番で分ける
- リソース名、タグ、予算を環境ごとに明確にする
- テストで本番データや本番バケットを使わない
- 本番変更は専用タスク、レビュー、チェックリストを必須にする

## 実装前の判断項目

- AWS を採用する理由と、より単純な代替案
- 利用リージョンとデータ保護要件
- 月額上限、予算通知、費用急増時の停止方法
- IAM 設計、MFA、緊急アクセス、監査
- ファイル容量、転送量、保存期間、削除
- バックアップと復旧目標
- Infrastructure as Code の方式とレビュー方法
- 障害、漏えい、キー紛失時の対応
- サービス終了時のデータ移行・削除方法

## 導入時の必須ルール

- コンソール上の手作業だけで本番構成を増やさず、変更内容をレビュー可能にする
- 秘密情報をリポジトリ、PR、チャット、スクリーンショットへ載せない
- IAM ポリシーで `*` 権限を安易に使わない
- S3 の Block Public Access を原則有効にする
- 費用アラート、ログ保持期間、削除手順をリソース作成と同時に設定する
- 構築前後に二人で対象アカウント、リージョン、環境を確認する
