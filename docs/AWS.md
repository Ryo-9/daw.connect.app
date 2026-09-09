# AWS Notes

## 重要

この文書は将来 AWS を使う場合の候補と注意点を整理するメモです。CLOUD-001ではAWSのserverless構成を2026年末Private Alphaの推奨ターゲットとして具体化しますが、人の承認と専用実装taskを経るまでは採用済み・実装済みではありません。今回はアカウント作成、IAM設定、resource構築、S3 upload、本番deploymentを行いません。

## CLOUD-001: Phase 2 Cloud MVP Plan

### 計画の状態

この章の状態語は次の意味です。

- `MVP TARGET`: CLOUD-001がPrivate Alphaに推奨する構成。resource作成前に人が承認する
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

- controlledな2 userのauthentication、email verification、sign in / out、password reset、session
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
- formal email invitation flow、notification
- CloudFront private delivery
- full audit UI、restore UI
- full-text search
- richer malware/content inspection
- presence（短命stateのみ。永続履歴を既定にしない）

Private Alphaではformal invitationを作らず、管理されたaccount / Membership provisioningで2人だけを登録する候補です。誰でも参加できるBandや公開join linkは許可しません。

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
| IaC | AWS CDK / Terraform等を比較 / `TBD / BLOCKER` | CLOUD-002前にhuman decisionが必要 |

### Authenticationとapplication authorization

#### Cognito boundary

Cognitoは「このrequestのuserは誰か」を確認します。Band MembershipはDynamoDB候補のapplication dataとして扱い、「どのBandに所属し、何を実行できるか」をLambda側で毎回検証します。Cognito groupだけでBandごとのOwner / Admin / Editor / Commenter / Guestを表現しません。

Private Alphaの最小候補:

- public self-sign-upは初期OFFとし、2 userをcontrolled provisioningする
- email verificationを必須候補とする
- sign in、sign out、password reset、session expiry / refreshを実装対象にする
- strong password policy、generic authentication error、rate / abuse controlを設計する
- social login、passkey、enterprise SSO、複数IdP、advanced MFA UXはDEFER
- MFAは将来対応できる構成を保ち、Private Alphaで必須化するかはAUTH-001のhuman security gateとする

AWS管理者のMFAと、StreamBand利用者のCognito MFAは別問題です。AWS root userや管理権限の日常利用を避け、管理者accessはMFAと短時間credentialを必須候補にします。

#### Band invitation

2026年末はformal email invitationより、監査可能なcontrolled test flowを推奨します。

1. 管理者が許可済みemail / Cognito subjectを確認する
2. applicationの管理境界でBandMembershipを作る
3. actor、対象Band、対象User、時刻、request IDをAuditEvent候補へ残す
4. userは本人の認証後だけBandへ入れる

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

- `PREVIEW_AUDIO`: userがDAWからreview用にexportした音声
- `STEM_AUDIO`: optional。Private Alpha初期はSHOULD LATER
- `SOURCE_MIDI`: 特定Versionのread-only source
- `PROPOSAL_MIDI`: SOURCE_MIDIとは別のproposal Asset
- `IMAGE`: future / DEFER

`SOURCE_MIDI != PROPOSAL_MIDI`をstorage key、Asset metadata、authorization、delete flowで維持します。Decisionはどちらのobjectも上書きせず、DAWへの自動反映もしません。

#### S3 security baseline

- account / bucket levelのBlock Public Accessを有効にし、public ACL / public bucket policyを許可しない
- bucket / objectはprivate、ownershipはserver-managed
- 保存時暗号化とHTTPS通信を必須baselineとし、default encryption / key管理方式はSTORAGE-001で確定する
- upload request前とdownload/access発行前にauthentication、Membership、capability、Asset ownershipを確認する
- upload / access instructionは対象key・method・期限を限定し、短時間だけ有効にする
- object keyはopaque Asset IDを中心にserverが生成する
- original filename、client MIME、extension、sizeを信用せず、upload completeでobject metadata、size、detected type、checksum候補を検証する
- complete前のobjectをVersionへ公開せず、failed / quarantined stateではaccessを拒否する
- signed URL、credential、private object keyをDBのpublic view、log、PR、docsへ記録しない
- membership変更後も既発行URLが期限までは使えるriskを抑えるため、短いexpiryを選ぶ
- incomplete multipart uploadとorphan staging objectに期限 / cleanupを設ける

object keyの形は次を候補とし、最終形はSTORAGE-001で決めます。

```text
environment/
opaque-band-id/
opaque-song-id/
opaque-asset-id
```

email、real name、未公開Song title、secret project name、original filenameをkeyへ直接入れません。

#### Preview / transcoding

Private Alpha初期は、userがStudio Oneから互換性を確認したlightweight Preview fileをexportしてuploadします。server-side FFmpeg、waveform解析、codec変換はDEFERします。original masterとstreaming derivativeの分離は、browser互換性、容量、転送costが実測上の問題になった時に再評価します。

#### CloudFront

`DEFER`。2 user / 1 Bandでは、authorization後に短時間のS3 access instructionを発行する方が、private cache policy、signed URL key管理、OAC、invalidationを追加するより単純です。latency、range request、egress、繰り返し再生の実測がS3 direct accessの限界を示した場合、OAC + private CloudFront signed URL / Cookieを別decisionで検討します。S3をpublic originにはしません。

### Regionとenvironment

#### Region

単一Regionの第一候補はAsia Pacific (Tokyo) `ap-northeast-1`です。2 userが日本中心であるためlatencyと運用の単純さを優先し、multi-Region replicationはDEFERします。CLOUD-002でCognito、API Gateway HTTP API、Lambda、DynamoDB、S3、CloudWatchの利用可否、quota、実価格、data residency要件を再確認してから確定します。

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
- Private Alpha target: おおむね¥3,000〜¥10,000/月以内
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

Next.js web applicationのremote hostingはPrivate Alphaのblocking deployment decisionです。CLOUD-001では採用先を決めません。

| criterion | Vercel | AWS Amplify Hosting | AWS-native custom Next.js |
| --- | --- | --- | --- |
| Next.js compatibility | current Next.js機能とofficial support範囲を確認 | supported feature / runtime / deployment制約を確認 | framework更新ごとに運用責任が大きい |
| deployment / preview | branch preview、rollback、secret管理を比較 | branch環境、backend integrationを比較 | build、runtime、CDN、rollbackを自前設計 |
| cost / logs | Private Alpha trafficで再見積もり | build / hosting / transferを再見積もり | resource数と常時costを含める |
| AWS backend integration | CORS、token/session、region latencyを確認 | IAM / Cognito / API連携を確認 | 柔軟だが運用負担が最大 |
| migration | standard buildとAPI contractのportable性を確認 | hosting固有設定を限定 | AWS couplingとrunbookが増える |

HOST-001候補で、preview environment、custom domain、logs、rollback、CORS/CSRF、Cognito session、future migrationを実測比較してhuman approvalします。AWS-native custom hostingはPrivate Alphaの最小構成としては原則避けます。

### Infrastructure as Code decision

IaCはresource作成前に必須ですが、今回は導入しません。

| criterion | AWS CDK | Terraform | other supported approach |
| --- | --- | --- | --- |
| TypeScript親和性 | 現行team skillと合わせやすい | HCL等の学習が必要 | support期間と学習負担を確認 |
| reviewability | generated template / diffの確認方法が必要 | planとstate changeをreviewしやすい | dry-run / drift検出が必須 |
| destroy / recreate | stack dependencyとretained dataを設計 | stateとlifecycle ruleを設計 | data resource誤削除を防ぐ |
| state management | CloudFormation/CDKのstack state | remote state / lock / secret保護 | rollbackと共同作業を確認 |
| CI | OIDC、approval、environment gateが必要 | 同左 | long-lived keyを使わない |

CLOUD-002の前に、初心者の運用負荷、data resource保護、preview / plan、drift、rollback、CI credentialを比較してhuman decisionを記録します。`cdk deploy`や`terraform apply`はCLOUD-001で実行しません。

### Critical pathとimplementation slices

1 task = 1 small PRを維持し、前段のsecurity / data gateが通るまで後段を開始しません。

1. `CLOUD-002` Cloud foundation / account・environment・IaC decision、pricing estimate、rollback
2. `HOST-001` Next.js Private Alpha hosting decision（比較は早期、deployは後段）
3. `AUTH-001` Cognito authentication prototype（controlled user、verification、session、reset）
4. `CLOUD-DATA-001` DynamoDB access pattern / physical design、PITR / restore plan
5. `AUTHZ-001` Band Membershipとcapability matrix
6. `API-001` Band / Song core read-write boundaryの最小実装
7. `STORAGE-001` private Preview / MIDI upload・complete・access
8. `VERSION-001` persisted Version workflow
9. `COMMENT-001` Version-scoped Comment + Anchor
10. `PROPOSAL-001` separate MIDI Proposal + Decision
11. `OBS-001` alarms、budget、backup / restore drill、operational runbook
12. `DEPLOY-001` isolated Private Alpha deploymentとacceptance test

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
