# Decision Log

仕様や技術に関する重要な判断を残すための記録です。「何を決めたか」だけでなく、「なぜ決めたか」「何をまだ決めていないか」も記載します。過去の記録は削除せず、変更時は新しい決定を追加して置き換え関係を示します。

## ステータス

- `提案中`: 選択肢を検討している
- `承認済み`: 二人で合意し、現在有効
- `保留`: 情報不足などで後から判断する
- `廃止`: 新しい決定に置き換えられた

## 決定一覧

| ID | 日付 | タイトル | ステータス | 影響範囲 | 置き換え先 |
| --- | --- | --- | --- | --- | --- |
| DEC-001 | 2026-08-10 | MVP は DAW 外の制作管理に集中する | 承認済み | プロダクト全体 | - |
| DEC-002 | 2026-08-10 | 1 タスク 1 ブランチ 1 PR で進める | 承認済み | 開発運用 | - |
| DEC-003 | 2026-08-10 | Next.js / React / TypeScript / Tailwind CSS / npm を現行フロントエンド構成とする | 承認済み | アーキテクチャ | - |
| DEC-004 | 2026-08-10 | 最初の UI はモックデータと画面遷移に限定する | 承認済み | UI プロトタイプ | - |
| DEC-005 | 2026-08-10 | UI 操作はブラウザ内の一時状態に限定する | 承認済み | UI 操作プロトタイプ | - |
| DEC-006 | 2026-09-03 | 初期テストを Vitest / React Testing Library / Playwright で構成する | 提案中 | 自動テスト / CI | - |
| DEC-007 | 2026-09-05 | AI委任境界と限定的auto-merge条件を定める | 提案中 | 開発運用 / GitHub | - |
| DEC-008 | 2026-09-06 | 楽曲詳細を制作レビューsurfaceとして視覚化する | 提案中 | 楽曲詳細visual | - |
| DEC-009 | 2026-09-06 | 楽曲作成・編集を非保存フォームで先行検証する | 提案中 | 楽曲フォーム / Phase 1 | - |
| DEC-010 | 2026-09-09 | 永続化前にmockとcloud data modelの境界を整理する | 提案中 | データ設計 / Phase 2準備 | - |
| DEC-011 | 2026-09-09 | Phase 1の中心review flowを定義する | 提案中 | Song Detail / 制作review | - |
| DEC-012 | 2026-09-09 | Core API / persistence boundaryを実装前にcontract化する | 提案中 | API / persistence設計 | - |
| DEC-013 | 2026-09-09 | 2026年末Private AlphaのCloud targetとhuman gatesを定める | 承認済み | Cloud architecture / Phase 2 | - |
| DEC-014 | 2026-09-10 | Phase 2 Cloud foundation / IaC policyを定める | 承認済み | AWS account / IaC / deployment safety | - |
| DEC-015 | 2026-09-10 | Private AlphaのNext.js hosting候補を定める | 承認済み | Web hosting / deployment | - |
| DEC-016 | 2026-09-11 | Dedicated nonprodのCDK bootstrap permission planを定める | 提案中 | AWS bootstrap / temporary privilege | - |
| DEC-017 | 2026-09-11 | Cloud MVP metadataをOn-Demand single-tableで設計する | 提案中 | DynamoDB physical design | - |
| DEC-018 | 2026-09-11 | Band authorizationをrole bundleとserver capabilityで判定する | 提案中 | Authorization / BandMembership | - |
| DEC-019 | 2026-09-11 | Private Assetをenvironment単位のS3 bucketと短命instructionで扱う | 提案中 | S3 / Asset security | - |
| DEC-020 | 2026-09-11 | nonprod deployment trustをGitHub Environment限定OIDCへ分離する | 提案中 | AWS deployment identity / GitHub | - |
| DEC-021 | 2026-09-11 | Invitation-gated CognitoとBFF Web session方針を定める | 承認済み | Authentication / Signup / Session / Device security | - |
| DEC-022 | 2026-09-11 | 創作を管理せず支えるCreative workflowを定める | 承認済み | Creative UX / Version history / Memo・Idea・Task / Anchor | - |

---

## DEC-001: MVP は DAW 外の制作管理に集中する

- 日付: 2026-08-10
- ステータス: 承認済み
- 決定者: プロジェクトメンバー
- 背景: 最初から DAW 直接連携やリアルタイム編集まで扱うと、技術・検証範囲が大きくなる。
- 決定: MVP ではバンド、楽曲、メモ、コメント、タイムスタンプコメント、パート別 TODO を中心にする。ファイル共有とバージョン管理はまず準備から始める。
- 採用理由: 小規模チームの制作情報が散らばる課題を、少ない機能で先に検証できるため。
- 見送った選択肢: DAW 直接連携、リアルタイム共同編集。
- 影響: MVP の画面、データ、タスクの優先順位。
- 見直し条件: MVP 利用検証で直接連携が最優先課題だと分かった場合。

## DEC-002: 1 タスク 1 ブランチ 1 PR で進める

- 日付: 2026-08-10
- ステータス: 承認済み
- 決定者: プロジェクトメンバー
- 背景: 初心者 2 人が GPT/Codex を使うため、変更の混在や上書き事故を避けたい。
- 決定: `main` に直接 push せず、タスクごとにブランチと PR を分ける。
- 採用理由: 差分、確認方法、問題発生時の切り分けが分かりやすくなるため。
- 影響: すべての開発・ドキュメント作業。
- 見直し条件: なし。運用上の細部は必要に応じて追加する。

## DEC-003: Next.js / React / TypeScript / Tailwind CSS / npm を現行フロントエンド構成とする

- 日付: 2026-08-10
- ステータス: 承認済み
- 決定者: プロジェクトメンバー（main へマージ済みの実装で確認）
- 背景: Web アプリとレスポンシブ UI を少人数で開発する構成が必要。
- 決定: 現行 UI プロトタイプでは Next.js `16.3.0`、React / React DOM `19.2.8`、TypeScript `^5`、Tailwind CSS `^4`、npm、App Router を使用する。
- 採用理由: UI と Web アプリの構築を一つのプロジェクトで進めやすく、型によるミスの発見を期待できるため。PR #3 と #4 が main へマージされ、現行実装として確認できる。
- 未決事項: テスト方針は DEC-006 で提案中。永続データの取得方式、DB、認証、ストレージ、ホスティング先は未決定であり、本決定の一部として採用済みとは扱わない。
- 影響: 初期セットアップと Surface Lane のタスク。
- 見直し条件: バージョン更新時、または要件に合わない制約が判明した場合。

## DEC-004: 最初の UI はモックデータと画面遷移に限定する

- 日付: 2026-08-10
- ステータス: 承認済み
- 決定者: プロジェクトメンバー
- 背景: DB、認証、ファイル保存を始める前に、曲ごとの情報整理と画面遷移が分かりやすいかを確認したい。
- 決定: `ui-prototype-001` は `src/lib/mock-data.ts` の静的データを Server Components で表示し、作成・編集・投稿・アップロード処理を実装しない。
- 採用理由: 高リスク領域へ触れず、PC とスマートフォンで主要導線を早くレビューできるため。
- 影響: トップ、ダッシュボード、バンド一覧・詳細、楽曲一覧・詳細。
- リスク: 操作ボタンの多くは見た目のみであり、実際の保存・エラー・権限体験は検証できない。
- 見直し条件: UI レビュー完了後、入力フォームやデータ設計を専用タスクで開始するとき。

## DEC-005: UI 操作はブラウザ内の一時状態に限定する

- 日付: 2026-08-10
- ステータス: 承認済み
- 決定者: プロジェクトメンバー
- 背景: DB、認証、API の設計前に、検索、入力、状態変更の分かりやすさをブラウザで確認したい。
- 決定: `ui-interaction-prototype-001` の検索条件、追加コメント、TODO 状態は React の画面内状態だけで管理する。URL クエリ、通信、DB、API、ブラウザストレージは使用しない。
- 採用理由: 高リスク領域へ触れず、操作後の表示と非保存の伝わり方を早くレビューできるため。
- 影響: 楽曲一覧の検索・絞り込み、楽曲詳細のコメント入力と TODO チェック。
- リスク: リロードで状態が消え、永続化、通信エラー、競合、権限の体験は検証できない。
- 未決事項: 保存時の API、入力検証、投稿者権限、更新競合、エラー表示。
- 見直し条件: データ・API・権限設計が承認され、保存処理を専用タスクで開始するとき。
- 関連: `ui-interaction-prototype-001`

## DEC-006: 初期テストを Vitest / React Testing Library / Playwright で構成する

- 日付: 2026-09-03
- ステータス: 提案中
- 提案者: Codex（BRIDGE-005）
- 承認者: 未承認。PR レビューでプロジェクトメンバー 2 人の合意を確認する
- 背景: 2 人と Codex の並行開発で、現在の mock UI の主要操作と画面遷移を少ないテストで守り、PR の merge 判断を自動化する必要がある。
- 決定案: Unit test runner に Vitest、Client Components の Component testing に React Testing Library + jsdom、ブラウザ E2E に Playwright を使用する。async Server Components、動的ルート、404 は E2E で確認する。
- 採用理由: 現在の Next.js / React / TypeScript 構成と役割を分けやすく、速い Component test と少数の実ブラウザ smoke test を組み合わせられるため。最初から複数の test runner や E2E framework を併用せず、初心者が把握する設定を限定できる。
- 検討した選択肢: Jest + React Testing Library は既存資産がなく Vitest と役割が重複するため見送る。Cypress は Playwright と役割が重複し、初期の設定と学習対象が増えるため見送る。
- 導入段階: Level 1 は mock UI の主要 Client Component と Chromium smoke E2E、Level 2 は API / Server Actions・DB・認証認可・ファイル保存、Level 3 は本番相当・権限境界・障害・主要ブラウザ・レスポンシブ・アクセシビリティを対象とする。
- CI: BRIDGE-006 では最初に `npm ci`、lint、build を必須化する。BRIDGE-008 のテスト導入後に Vitest の 1 回実行と Playwright Chromium smoke E2E を PR 必須チェックへ追加する。全ブラウザや full suite は毎回の PR では実行しない。
- 実装状況: BRIDGE-008 / PR #8で提案どおりの構成を導入し、Component testとChromium smoke E2Eをmainへマージした。これは実装事実の記録であり、プロジェクトメンバー2人の承認を意味しない。
- 影響: BRIDGE-006、BRIDGE-008、将来の DB・認証・ファイル保存タスク。
- リスク: E2E を増やしすぎると実行時間と flaky failure が増えるため、PR ごとは Chromium の主要導線に限定する。カバレッジ率は初期の merge 条件にしない。
- 未決事項: DEC-006の正式承認、Level 2 / 3の具体的な設定、将来のcoverage基準。
- 見直し条件: DB・認証・ファイル保存の導入時、テストが PR の待ち時間の主因になった時、主要 version 更新時、一般公開準備時。
- 関連: BRIDGE-005、BRIDGE-006、BRIDGE-008、[TESTING.md](TESTING.md)

## DEC-007: AI委任境界と限定的auto-merge条件を定める

- 日付: 2026-09-05
- ステータス: 提案中
- 提案者: Codex（BRIDGE-004）
- 承認者: 未承認。PRレビューでプロジェクトメンバーの合意を確認する
- 背景: 共通前提を毎回長いpromptへ複製せず、2人とCodexが同じ安全境界で小さなタスクを進められる状態が必要。将来的なauto-mergeも、branch protectionを弱めず、低risk変更に限定する必要がある。
- 決定案: 人間がtaskの目的と範囲を決め、Codexへ調査、scope内の変更、検証、Draft PR作成までを委任する。高risk領域、外部変更、destructive action、仕様変更は人が判断する。auto-mergeは未導入のままとし、将来はhuman opt-in、allowlist、最新main、required checks成功、expected files / head確認を満たす小さな変更から段階導入する。
- 採用理由: AIの作業速度を活かしつつ、権限やtask scopeの暗黙的な拡大、CI失敗merge、他者作業との衝突を防ぐため。
- 現在の実装事実: mainはPR、最新mainとの整合、`Quality checks`成功が必須で、force pushと削除は禁止。required manual approvalは0。auto-merge用workflow、App、label運用は未実装。
- 初期auto-merge対象外: app code、package、workflow、governance文書、security、DB、Auth、AWS、secret、deployment、test弱化、大きなdiff。
- リスク: 条件が複雑すぎると運用されず、広すぎると意図しない変更がmergeされる。AIが自分でsafe labelを付けてmergeするとhuman opt-inにならない。
- 未決事項: opt-in label、allowlist、diff上限、実装方式、監査log、緊急停止、正式な承認時期。
- 見直し条件: dry-run開始時、teamや権限の変更時、DB / Auth / production導入時、AI関連incident発生時。
- 関連: BRIDGE-004、[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)、[AI_DELEGATION.md](AI_DELEGATION.md)、[BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)

## DEC-008: 楽曲詳細を制作レビューsurfaceとして視覚化する

- 日付: 2026-09-06
- ステータス: 提案中
- 提案者: Codex（VISUAL-003）
- 実装事実: 楽曲詳細にWaveform、MIDI proposal、Comment / Version、Call Bar風の表示専用surfaceを追加し、PC中心の制作workspace感を強めた。スマートフォンでは既存情報を崩さない範囲に留めた。
- 境界: 音声解析・再生、MIDI解析・編集・生成、通話、DAW連携、保存は未実装のまま維持する。元MIDIとproposalは明確に分け、元データを上書きする表現にしない。
- 未決事項: 実機能の採用、データ形式、再生・同期方式、proposalの承認flow、通話方式。
- 関連: VISUAL-003、[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)

## DEC-009: 楽曲作成・編集を非保存フォームで先行検証する

- 日付: 2026-09-06
- ステータス: 提案中
- 提案者: Codex（SURFACE-017）
- 実装事実: Phase 1では楽曲作成・編集フォームをReactの画面内stateだけで動く非保存プロトタイプとして追加し、入力後のreview previewを確認できるようにする。
- 境界: DB、API、Auth、AWS、ブラウザ保存、実ファイルuploadは後続Phaseへ分離し、現在のmock dataを更新しない。
- 表示方針: PCメインの制作workspaceを優先し、スマートフォンでは横overflowを避けて入力と確認ができる縦積み表示に留める。
- 未決事項: 永続data schema、validation、保存API、権限、競合処理、ファイル管理。
- 関連: SURFACE-017、[SCREEN_LIST.md](SCREEN_LIST.md)、[USER_FLOW.md](USER_FLOW.md)

## DEC-010: 永続化前にmockとcloud data modelの境界を整理する

- 日付: 2026-09-09
- ステータス: 提案中
- 提案者: Codex（DATA-001）
- 背景: 現在の表示用mockをそのまま永続schemaと見なすと、Version、Proposal、Comment anchor、file metadata、権限の境界が曖昧になる。
- 決定案: DB/API実装前にPhase 1の実装事実とPhase 2のcloud data model草案を分けて記録し、Song Version、MIDI Proposal、Comment Anchor、Audio/MIDI Assetを独立した関係として扱う。
- 非破壊原則: MIDI Proposalは元MIDIを直接上書きせず、source assetとproposal assetを別参照にする。VersionとProposal、MemoとDecision、Song statusとReview statusも混同しない。
- 境界: 実保存、DB/ORM選定、API、Auth、AWS/S3、migrationは後続Phaseと専用taskへ分離する。
- 未決事項: 採用DB、ID形式、enum確定、storage provider、権限matrix、削除保持期間、audit log方式、API契約。
- 関連: DATA-001、[DATABASE.md](DATABASE.md)、[API.md](API.md)

## DEC-011: Phase 1の中心review flowを定義する

- 日付: 2026-09-09
- ステータス: 提案中
- 提案者: Codex（FLOW-001）
- 決定案: Song Detailの中心review flowをPreview → Comment → MIDI Proposal → Decision → Versionの順とし、同一画面内のsection navigationで示す。
- Comment境界: CommentはVersionを基準に、bar / beat / time / trackの位置文脈を持つ候補として表示する。Phase 1ではvisual mockであり保存しない。
- 非破壊原則: Original MIDIはProposalによって上書きしない。ProposalのAcceptはDAWへの自動反映ではなく、作曲者がDAWで判断を反映する。
- Version境界: 作曲者がDAW側で反映し、新しいPreview / MIDIを書き出して共有した時点を次のStreamBand Versionとする。DecisionだけでVersionを自動作成しない。
- 境界: 音声再生、MIDI解析・編集・生成、Proposal / Decision / Versionの保存、DB、API、Auth、AWS、DAW連携は未実装のまま維持する。
- 関連: FLOW-001、[USER_FLOW.md](USER_FLOW.md)、[SCREEN_LIST.md](SCREEN_LIST.md)、[DATABASE.md](DATABASE.md)

## DEC-012: Core API / persistence boundaryを実装前にcontract化する

- 日付: 2026-09-09
- ステータス: 提案中
- 提案者: Codex（DATA-002）
- 決定案: Song、Version、Comment、MIDI Proposal、Decision、Assetのcore writeについて、UI input、server checks、mutation、response、競合riskを実装前に整理する。
- 非破壊原則: Original MIDIはread-only sourceとして扱い、Proposalを別entity / assetとして作成する。Proposal DecisionとVersion作成を分離し、Decision後は作曲者がDAWへ反映してから新しいVersionを明示的に共有する。
- server responsibility: authorization、runtime validation、resource ownership、allowed state transitionはserver側で確認し、UI上の表示だけを権限判定に使わない。
- 競合方針候補: revision等でstale writeを検出し、silent overwriteしない。
- file境界候補: 未公開楽曲のAssetをpublic object / permanent public URLで配布せず、認可後の短時間accessを使う。
- 境界: DATA-002ではcontract候補を文書化するだけで、transport、framework、DB、Auth、Storage providerを採用決定せず、実装もしない。
- 関連: DATA-002、[API.md](API.md)、[DATABASE.md](DATABASE.md)、[USER_FLOW.md](USER_FLOW.md)

## DEC-013: 2026年末Private AlphaのCloud targetとhuman gatesを定める

- 日付: 2026-09-09
- ステータス: 承認済み
- 提案者: Codex（CLOUD-001）
- 承認者: 人間側（CLOUD-002依頼でreview結果を明示）
- Private Alpha goal: 2 user / 1 private Bandで、Studio Oneからmanual exportしたPreview / MIDIを共有し、Version Comment、separate MIDI Proposal、Decision、DAW反映後のNew Versionまでを安全に行う。
- 承認済みplanning baseline: Cognito User Pool、API Gateway HTTP API + Lambda、DynamoDB On-Demand、private S3、CloudWatch、AWS Budgetsをlow fixed costのAWS serverless targetとする。`ap-northeast-1`を単一Regionの第一候補とし、resource作成直前にservice availability、quota、official pricingを再確認する。
- Auth境界: Cognitoはidentity、BandMembershipとoperation capabilityはapplication data / server責務とし、Cognito groupだけへBand authorizationを置かない。
- Non-destructive boundary: SOURCE_MIDIとPROPOSAL_MIDIを別Assetとして扱い、DecisionはOriginalやDAWを自動変更せず、Versionを自動作成しない。
- Defer: CloudFront、WebSocket、server transcoding、formal invitation、realtime、Companion / Bridge、paymentは年末acceptance criteriaから外す。
- Security / operations候補: public Asset禁止、short-lived access、nonprod / Private Alpha分離、finite logs、backup / restore drill、stale write防止、cost alertsをPrivate Alpha前gateとする。
- Cost rule: Developmentはできる限り数千円/月、Private Alphaは通常¥500〜¥1,500/月を目標とする。月¥5,000超はusage / resource調査、月¥10,000超を予測する変更はhuman approvalを必須とする。AWS Budgetsはhard capではない。
- Human approval待ち: individual resource作成、DynamoDB physical design、permission matrix、MFA、AWS account作成 / bootstrap、web hosting、IaC、file limit / retention、price estimate、incident / rollback。
- 実装状態: docs-only。AWS account / resource、credential、Auth、DB、API、S3、deploymentは作成していない。
- 関連: CLOUD-001、[AWS.md](AWS.md)、[ARCHITECTURE.md](ARCHITECTURE.md)、[ROADMAP.md](ROADMAP.md)

## DEC-014: Phase 2 Cloud foundation / IaC policyを定める

- 日付: 2026-09-10
- ステータス: 承認済み
- 提案者: Codex（CLOUD-002）
- 承認者: 人間側（CLOUD-003B依頼で承認範囲を明示）
- 承認済み前提: DEC-013のAWS serverless target、Tokyo Region第一候補、CloudFront / WebSocket / transcodingのDEFER、real unreleased data投入前のnonprod / Private Alpha account分離、cost guardrailを維持する。
- IaC決定: AWS CDK + TypeScriptを採用し、現行のTypeScript skillを再利用してAWS-onlyのsmall architectureをCloudFormation stackで管理する。CLOUD-003Bで承認された範囲は、root appから分離した`infra/` package、空Stack、offline test、`--no-lookups` synthまで。
- Repository境界: rootの`infra/`をapp `src/**`から分けた独立packageとして小さく開始する。npm workspace化、monorepo tool、root package依存は追加しない。
- Account / environment: `local`、AWS `nonprod`、`private-alpha`を初期境界とする。nonprodとPrivate Alphaは別accountを推奨し、Private Alpha account未準備なら本物のdata投入をblockする。
- Credential候補: local humanはIAM Identity Center等のshort-lived session、GitHub Actionsはrepository / environmentを限定したOIDC AssumeRoleとする。long-lived access key、共有credential、root daily useを禁止する。
- Change safety候補: naming / tagでproject・environment・purposeを識別し、Private Alphaのdestroy、replacement、protection disable、data migrationを通常deployから分離してhuman approvalを要求する。
- Rollback境界: application rollback、CloudFormation / infrastructure rollback、DynamoDB / S3等のdata recoveryを別手順にする。IaC rollbackはuser data restoreではない。
- Drift方針候補: managed resourceはreviewed IaCをsource of truthとし、Console emergency changeは記録後に専用task / PRでreconcileする。
- 次のresource境界: CLOUD-003Cを最初のAWS接続 / bootstrap候補として分離する。actual AWS connection、account確認、IAM / OIDC、Budgets、CDK bootstrap / deploy、resource作成はCLOUD-003Bの承認外で、別Human Gateが必要。
- Human approval待ち: AWS Organizations model、OIDC trust、bootstrap policy、first AWS connection / deploy、destructive gate、exact budget threshold / recipient。AWS CDK + TypeScript、`infra/`、offline test / synthのみ承認済み。
- 見直し条件: multi-cloud要件、既存Terraform estate、CDKで未対応のresource、team運用負荷、state / rollback事故、hosting decisionとの不整合が判明した場合。
- 関連: CLOUD-002、CLOUD-003候補、HOST-001、[AWS.md](AWS.md)、[ARCHITECTURE.md](ARCHITECTURE.md)

## DEC-015: Private AlphaのNext.js hosting候補を定める

- 日付: 2026-09-10
- ステータス: 承認済み
- 提案者: Codex（HOST-001）
- 承認者: 人間側（PR #24のreview / merge）
- Primary候補: Vercel ProをPrivate Alpha primary hosting candidateとして承認する。Next.jsのverified adapter、PR Preview、staged promotion、rollbackを使い、Next.js `16.3.0`のcompatibilityと2人teamの運用単純性を優先する。
- Fallback候補: AWS Amplify Hosting。ただしAWS公式managed SSR supportが現時点でNext.js 15までのため、Next.js 16 official supportまたは必要機能のPoC成功までdeploy-readyとしない。hosting都合だけのNext.js downgradeは行わない。
- Last resort: AWSのsingle Node.js / Docker self-hosting。Vercel / Amplifyが不適合な場合だけ別taskでcost、reverse proxy、cache、version skew、rollback、operationsを設計する。
- Security境界: hosting protectionはdefense in depthとし、private dataはCognito identityとLambda側Band authorizationで保護する。Previewはsynthetic dataだけに接続し、production client bundle / public configへsecretやprivate dataを含めない。
- Release候補: protected Previewと`Quality checks`後、review済みimmutable commitをstaged productionからhumanが明示promoteする。main mergeだけでPrivate Alpha custom domainへ自動公開しない候補とする。
- Cost: Vercel Hobbyはpersonal / non-commercial用途に限定されるため既定にしない。Vercel Pro base / usage / add-onは接続前にcurrent priceで再見積もりし、Private Alpha通常目標超過のhuman acceptanceを必要とする。
- Portability: business rule、application authorization、Asset accessをAPI Gateway / Lambda側に保ち、standard Next.js buildとstable custom domain / API contractを維持する。
- 未決事項: Vercel契約、account / project / team、billing owner、料金発生、production protection、custom domain、Cognito callback / CORS、region latency、log retention、first deployment、rollback drill。候補承認は接続・契約・deploymentの承認ではない。
- 実装状態: docs-only。hosting account / project / GitHub App / domain / credential / deployment、AWS resource、runtime / package / config変更はない。
- 関連: HOST-001、CLOUD-002、CLOUD-003候補、[HOSTING.md](HOSTING.md)、[ARCHITECTURE.md](ARCHITECTURE.md)、[AWS.md](AWS.md)

## DEC-016: Dedicated nonprodのCDK bootstrap permission planを定める

- 日付: 2026-09-11
- ステータス: 提案中
- 提案者: Codex（CLOUD-003C-DECISION）
- Human decision: PR reviewでapprove / rejectする。actual bootstrap commandは、このDecisionの承認とは別の明示Human Gateを必要とする
- Bootstrapper recommendation: 既存のStreamBand専用human IAM userへ、AWS CDK公式が示す`cloudformation:*`、`ecr:*`、`ssm:*`、`s3:*`、`iam:*` / `Resource: "*"`のcustomer-managed policyを実行直前だけattachし、bootstrap直後にdetach・削除する。long-lived access keyは作らず、temporary `aws login` sessionを使う
- Alternative not selected: 専用same-account bootstrap roleは継続運用ではisolationに優れるが、初回一回の作業にrole / trust / caller policy / profileが増える。現行`aws login` sessionがMFA必須AssumeRole trustを満たす保証を公式資料から確認できないため、推測で採用しない
- CloudFormation execution recommendation: synthetic dataだけのisolated nonprod accountに限り、bootstrapが作るCloudFormation execution roleへAWS managed `AdministratorAccess`を明示指定する。human userの日常policyには付けず、cross-account trustを追加しない
- Risk acceptance: execution roleのblast radiusはaccount-wide。nonprod account分離、real / unreleased data禁止、review済みCDK template、deploy principal制限で緩和する。Private Alphaへpolicyを持ち越さず、real data前にfresh reviewする
- Bootstrap configuration: `ap-northeast-1`、profile `streamband-nonprod`、`CDKToolkit`、default qualifier、termination protection / public access block enabled、customer-managed bootstrap KMS keyなし、cross-account trustなし、express modeなし
- OIDC sequence: human bootstrapとtemporary privilege撤去を先に完了し、GitHub OIDC / deployment roleは別task、その後にfirst nonprod application deploymentとする
- 実装状態: docs-only recommendation。AWS接続、IAM / policy / role、OIDC、resource、bootstrap、deployは未実施で、CLOUD-003C actual bootstrapは未承認
- 見直し条件: current CDK template / CLI変更、existing `CDKToolkit`検出、account / Region差異、KMS / trust差異、Private Alpha開始、real data投入、custom execution policyへ移行する時
- 関連: CLOUD-003C-REVIEW、CLOUD-003C-DECISION、[AWS.md](AWS.md)

## DEC-017: Cloud MVP metadataをOn-Demand single-tableで設計する

- 日付: 2026-09-11
- ステータス: 提案中
- 提案者: Codex（CLOUD-DATA-001）
- Decision candidate: Cloud MVPのmetadataは`PK` / `SK`を持つOn-Demand DynamoDB single-tableと、user / Band / Song scopeの一覧に限定したsparse `ScopeIndex` 1本で開始する。GSIは`KEYS_ONLY`とし、authorizationには使わない
- 採用理由: 2 user / 1 private Bandの小さく不規則なtrafficでcapacity planning、table別backup / alarm / IAM、cross-table restore coordinationを増やさず、key conventionとtransaction境界を一つに固定するため
- Authorization: protected entityへ`bandId`と必要なparent IDを持たせるが、keyやclient入力を権限として扱わない。serverがbase tableのBandMembershipをstrong readし、resource relationshipとcapabilityを確認する
- Non-destructive boundary: SOURCE_MIDIとPROPOSAL_MIDIは別Asset、ProposalDecisionはappend-only recordとsummary update、SongVersionはDAW反映後の別commandとする。DecisionからVersionを自動作成しない
- Consistency: mutable itemはinteger `revision`と`expectedRevision`のconditional writeを使い、stale writeを409へmapする。Song + initial Version、Comment + Anchor、Proposal Decision、Version creation等は必要最小限の`TransactWriteItems`でatomicにする
- Recovery: resource taskではPITR 35日を有効化し、Private Alpha前にsynthetic dataでnew-table restore drillを行う。DynamoDB PITRとS3 Versioning / object restoreを別責務として扱う
- Cost: On-Demand、GSI 1本、small item、paginationを基本とし、binaryはprivate S3へ分離する。current Region pricingはresource作成直前に再確認し、freeを保証しない
- 見直し条件: access pattern churn、ad-hoc relational query / reporting、complex constraint、100 item transaction / 400 KB item / hot partition、GSI cost、key modelの保守性が問題になった場合はmanaged PostgreSQLを再評価する
- 実装状態: docs-only proposal。DynamoDB table、PITR、GSI、IAM、API、repository code、AWS resourceは未作成
- 関連: CLOUD-DATA-001、DATA-001、DATA-002、[DATABASE.md](DATABASE.md)、[API.md](API.md)、[AWS.md](AWS.md)

## DEC-018: Band authorizationをrole bundleとserver capabilityで判定する

- 日付: 2026-09-11
- ステータス: 提案中
- 提案者: Codex（AUTHZ-001）
- Role model: Cloud MVPのBandMembership roleを`Owner / Admin / Editor / Commenter / Guest`へ統一する。roleはclient-side hierarchyではなく、serverがoperation capabilityへ展開する固定bundleとする
- Verification: identity解決後、canonical resourceからstored Band IDをderiveし、base tableのACTIVE BandMembershipをstrong readしてからcapability、ownership、state、revisionを評価する。GSI、URL、client role、cached UI、object key、opaque IDはauthorizationにしない
- Membership invariant: 各Bandに最低1人のACTIVE Ownerを残す。Owner transferはatomic、AdminはOwner / Admin peerを変更せず、removed memberは次requestからdenyする
- Collaboration boundary: CommenterはCommentとProposal review / non-final Holdまで、Editor以上はSong / Version / Asset / Proposalとfinal Decisionを扱う。Guestはsame-Bandの限定read-only。Audit readと他人Comment moderationはOwner / Adminに限定する
- Comment rule: own Comment bodyのeditはserver timeで15分、own tombstoneは時間制限なし、他人本文のeditは禁止し、Owner / Adminだけが理由付きtombstone moderationを行う
- Non-destructive rule: Proposal Decisionはappend-only recordとsummary stateを更新するが、SOURCE_MIDI、PROPOSAL_MIDI、DAW、SongVersionを変更しない。HOLDはfinal Decisionを作らずREVIEWINGを維持する
- Error / audit: 未認証401、same-Band capability不足403、hidden / cross-Band 404、stale / current-state conflict 409、input validation 422とする。member / ownership、archive、Asset deletion、Proposal Decision、moderationをsafe AuditEvent対象にする
- 実装状態: docs-only proposal。Cognito、API、DynamoDB、S3、IAM、AWS resource、runtime authorization codeは未実装
- 見直し条件: friend testでroleが細かすぎる、Guest accessが広すぎる、separation-of-dutiesが必要、moderation / invitation / account recovery要件が加わる、Private Alpha security reviewでdeny境界が変わる場合
- 関連: AUTHZ-001、DATA-002、CLOUD-DATA-001、[API.md](API.md)、[DATABASE.md](DATABASE.md)

## DEC-019: Private Assetをenvironment単位のS3 bucketと短命instructionで扱う

- 日付: 2026-09-11
- ステータス: 提案中
- 提案者: Codex（STORAGE-001-DESIGN）
- Bucket model: environmentごとに1つのprivate Asset bucketを使い、nonprodとPrivate Alphaは別account / bucketに分離する。S3 Block Public Accessの4設定、Bucket owner enforced / ACL disabled、HTTPS-onlyを明示する
- Encryption: nonprodはSSE-S3を明示し、customer-managed KMS keyを作らない。Private Alphaはreal unreleased music投入前に別reviewする
- Asset boundary: 初期kindを`AUDIO_PREVIEW / SOURCE_MIDI / PROPOSAL_MIDI`に限定し、binaryはS3、metadataはDynamoDBへ分離する。SOURCE_MIDIとPROPOSAL_MIDIはdistinct Asset / opaque keyで、Decisionは両objectもVersionも変更しない
- Upload / access: unique keyへのconditional single-part PUT、SHA-256、size / MIME / bounded signature、`PENDING_UPLOAD → VERIFYING → AVAILABLE / FAILED`を使用する。upload instruction 15分、access instruction 5分とし、毎回canonical relationshipとstrong ACTIVE Membershipを確認する
- Recovery: nonprodでS3 Versioningとsynthetic restore drillを行い、Private Alphaでもenable候補とする。DynamoDB PITRとS3 Versioningは別復旧手段で、metadata / object reconciliationが必要
- Cost / retention: Preview 80 MiB、各MIDI 10 MiB、nonprod Band 2 GiBを初期application limit候補とする。bucket-wide current expirationは使わず、orphan / noncurrent physical cleanupはstate確認とHuman Gateを要求する
- 実装状態: docs-only proposal。S3、IAM、API、Lambda、KMS、CORS、lifecycle、AWS resource、runtime upload / accessは未実装
- 見直し条件: 100 MB以上、slow network、multi-part / resumable upload、Stem、scan、CloudFront、instant revocation、Private Alpha encryption / retention、実測costの要件が生じた場合
- 関連: STORAGE-001-DESIGN、DATA-002、CLOUD-DATA-001、AUTHZ-001、[AWS.md](AWS.md)、[API.md](API.md)、[DATABASE.md](DATABASE.md)

## DEC-020: nonprod deployment trustをGitHub Environment限定OIDCへ分離する

- 日付: 2026-09-11
- ステータス: 提案中
- 提案者: Codex（CLOUD-OIDC-001-DESIGN）
- Identity boundary: one-time human bootstrap identity、GitHub OIDC deployment identity、CloudFormation execution roleを別主体として扱う。GitHub roleへapplication administrator permissionを直接付けない
- Trust candidate: GitHub Environment `nonprod`を選び、deployment branchをprotected `main`だけに限定する。`aud = sts.amazonaws.com`、current immutable repository + environment subject、`ref = refs/heads/main`、`environment = nonprod`を`StringEquals`で完全一致させ、repository / owner / branch wildcardを使わない
- Workflow boundary: PR `Quality checks`は`contents: read`のままAWS accessなし。future deploymentはmainへmerge後の別workflow / jobをmanual dispatchし、そのjobだけ`contents: read` + `id-token: write`とEnvironment gateを持つ
- Permission boundary: OIDC roleはreview済みCDK bootstrap deploy / file publishing / lookup roleだけをassumeするcandidateとし、container assetが必要になるまでimage publishing roleを省く。CloudFormation execution roleを直接assumeせず、AdministratorAccessをGitHub roleへ付けない
- Session: role maximumは3,600秒、workflow requested durationは1,800秒候補。run ID / attemptを含む非個人session nameで監査し、human console loginとaccess keyを持たせない
- Sequence: human bootstrapとtemporary privilege撤去、OIDC provider / role、deployment workflow、first application deployを別taskに分ける。nonprod roleをPrivate Alphaへ再利用しない
- Implementation state: docs-only proposal。OIDC provider、IAM role / policy、GitHub Environment、workflow permission、secret / variable、AWS resourceは未作成。CLOUD-003C actual bootstrapも未承認
- Human Gate: provider、audience、immutable subject、role名、exact trust / permission、session、workflow trigger、Environment protection、revocationを実装前に提示して明示承認を得る
- 見直し条件: GitHub OIDC subject customization / immutable format変更、CDK bootstrap template / qualifier / role変更、container asset導入、deploymentが1時間を超える、Private Alpha開始、GitHub plan制約が判明した場合
- 関連: CLOUD-OIDC-001-DESIGN、CLOUD-003C-REVIEW、CLOUD-003C-DECISION、DEC-014、DEC-016、[AWS.md](AWS.md)、[TESTING.md](TESTING.md)

## DEC-021: Invitation-gated CognitoとBFF Web session方針を定める

- 日付: 2026-09-11
- ステータス: 承認済み
- 提案者: Codex（AUTH-001-DESIGN）
- 承認者: 人間側（PR #34 revisionで製品方針を明示）
- Provider / authorization: Amazon Cognito User Poolsをauthenticationに採用する。Verified issuer + Cognito `sub`をprivate mappingし、opaque internal User → canonical resource → strong ACTIVE BandMembership → AUTHZ-001 capabilityでauthorizationする。Email、username、`sub`をBand keyにしない
- User-facing identity: login IDはemail address、初回UXはemail + password。Provider内部usernameのexact implementationはinvite-only signup / Managed Login / Passkeyとの整合を実装gateで確認し、email変更でownershipを変えない
- Signup: Open public signupはdisabled、invitation-gated self-service signupはenabled。AdminCreateUser / temporary passwordをprimary flowにせず、final-product flowをsmall invite-only scopeでFriend Testから使う
- Invitation: verified email、予測不能token、14-day expiry、accept時server revalidation、explicit acceptanceを必須とする。`PENDING → DECLINED`はexpiry前・未revoke・inviter capability有効・verified email一致・その他validation成功なら、本人の明示操作で`DECLINED → ACCEPTED`へ戻せる。`あとで決める`はstateを変えず、revoke / expiry / invalidationは同一invitationで不可逆とする。Re-acceptでも全条件を再検証し、成功時だけMembershipを作る。Default roleはEditor、Owner / Adminだけが許可範囲をinviteでき、Owner roleはownership transfer専用flowとする
- Login / OAuth: StreamBand branded entry → branded Cognito Managed Login → StreamBand。Authorization Code + PKCE S256、state / nonce、confidential BFFを使い、Implicitを無効化する
- Web session: tokenはserver-side、browserはopaque `__Host-` Secure / HttpOnly / SameSite=Lax cookie。Access / ID 1時間、refresh capability約7日、idle 12時間 / absolute 7日のBFF session候補とし、active use中はrenewする
- Session UX: expiry時は専用画面からreauthenticateしてsafe routeへ復帰し、explicit logoutはhomeへ戻る。同一accountのmulti-device sessionを許可し、current / specified / all-device revokeを分ける
- Password: minimum 8文字、uppercase / lowercase / number各1以上、symbol optional、password manager推奨、routine forced rotationなし。Reset後は全StreamBand sessionを失効する
- Passkey / step-up: Friend TestでMFAをmandatoryにしないが、Private AlphaまでにPasskey-preferred sign-inをtargetとする。Credential / ownership / account等の重要操作はstrong step-upを要求し、成功後約15分reuse候補とする
- Device: trusted statusは180日未使用でexpireし、browser fingerprintをprimary identityにしない。Passkeyとdevice session / trustを別conceptとし、specific-device protectとsecurity notificationを計画する
- Account: StreamBand User stateを`ACTIVE / SUSPENDED / DELETION_PENDING / DELETED`とし、Cognito / BandMembership stateから分離する。Deletionは即access停止 + session revoke → 30-day recovery → PII anonymization、collaboration historyはFormer member相当で必要範囲を保持する。Last Owner invariantを維持する
- Risk: New / unusual deviceは追加verification、高riskはstep-up、明白な反復攻撃はprogressive throttleとし、少数failureで固定lockしない
- Environment: local / nonprod / Private Alphaでuser pool、app client、callback / logout origin、session / device namespaceを分離し、wildcard callbackとnonprod client再利用を禁止する
- 実装状態: docs-only decision。Cognito、invitation、user、domain、app client、secret、callback、BFF、session / device store、AWS resource、runtime / package / configは未実装
- Unresolved implementation gates: invite-only self-serviceのexact Cognito integration、provider username、session / device store、encryption、client secret、callback実値、runtime identity、Passkey / WebAuthn設定、Private Alpha CSP / price / mobile timing。これらをapproved UXの撤回で解決しない
- Human Gate: AUTH-001 runtimeはCLOUD-003C foundation execution gate後の別taskとし、Cognito resource / secret / callback / application codeを事前reviewする
- 関連: AUTH-001-DESIGN、AUTHZ-001、CLOUD-DATA-001、HOST-001、CLOUD-OIDC-001-DESIGN、[AWS.md](AWS.md)、[API.md](API.md)、[TESTING.md](TESTING.md)

## DEC-022: 創作を管理せず支えるCreative workflowを定める

- 日付: 2026-09-11
- ステータス: 承認済み
- 提案者: 人間側（CREATIVE-001-DESIGNで製品方針を明示）
- 承認者: 人間側
- Core principle: StreamBandはproject management appではなく、作者とBand memberの変化する創作意図を記録・共有し、制作負荷を減らす補助appとする。未完了item、期限、完了率でSong / Version作成をblockせず、systemが正しい制作手順やcompletionを強制しない
- Creative item: user-facing modelは`Memo / Idea / Task`の3種類だけ。どこからでも作成し、`Memo ↔ Idea ↔ Task`を相互変更できる。一般Proposal stateは追加せず、MIDI Proposalは実際に比較できる別MIDI Asset / proposal dataとして維持する
- Task: `OPEN / IN_PROGRESS / DONE / CANCELED`候補、DONEからreopen、CANCELEDは「不要にする」、optional single assignee、`NORMAL / IMPORTANT`、optional calendar due dateとする。別member approvalや期限超過によるautomatic state changeを要求しない
- Version history: SongVersionを上書きせず、Preview、MIDI、Comment / Anchor、Version固有情報を保持する。Old Anchorはnew Versionへ自動remapせず、origin historyとuser指定のcurrent targetを分離し、TaskをVersionごとにduplicateしない
- Outstanding items: Current Songから過去Version由来の未対応itemを横断確認でき、新Version作成時に件数を軽く示せる。ただし`確認する / あとで確認`の選択に留め、Version creationをblockしない
- Comment → Task: 元Commentを消さず相互linkし、same Commentからのaccidental duplicateを防ぐ。Direct Song-level TaskとAnchorなしも許可する
- Anchor: Version、time、bar / beat、Track、point / rangeをoptionalにし、作成contextを初期値にする。Dimensionを外すと同じitemが自然にSong scopeへ広がる。Versionをまたぐ自動移動はしない
- Timeline / Focus: Anchor itemは軽量markerとclusterで表示し、playhead連動はside panelの軽いhighlightまで。Modal、playback stop、focus stealingを禁止する。Focus Modeはuser操作でannotation表示だけを隠し、dataを変更しない
- Progress: Task完了率やproductivity scoreをprimary UXにせず、Current Version、最近変わったこと、考えていること、制作中の内容で曲の歩みを見せる
- Security: Creative itemもprivate Band dataで、canonical resourceとstrong ACTIVE BandMembership、AUTHZ capabilityをserverが検証する。Cross-Band deny、removed Member deny、private contentをlogへ複製しない既存contractを弱めない
- Physical design: CLOUD-DATA-001のsingle-table key / GSIは変更しない。Memo / Idea / Task、origin / current target、Comment link、delete / audit / capabilityのphysical persistenceは後続implementation gate
- 実装状態: docs-only。UI、API、DB、DynamoDB、AWS、Cognito、infra、runtime、package、workflowは変更していない
- 関連: CREATIVE-001-DESIGN、FLOW-001、CLOUD-DATA-001、AUTHZ-001、STORAGE-001-DESIGN、[PRODUCT_SPEC.md](PRODUCT_SPEC.md)、[USER_FLOW.md](USER_FLOW.md)、[DATABASE.md](DATABASE.md)、[API.md](API.md)、[TESTING.md](TESTING.md)

---

## 新規決定テンプレート

### DEC-NNN: 判断内容を短く書く

- 日付: YYYY-MM-DD
- ステータス: 提案中 / 承認済み / 保留 / 廃止
- 決定者: 名前
- 背景: なぜ判断が必要か
- 決定: 何を採用・変更するか
- 採用理由: この案を選んだ根拠
- 検討した選択肢: 他の案と見送った理由
- 影響: 対象機能、データ、費用、運用など
- リスク: 注意点と対策
- 未決事項: まだ決めていないこと
- 見直し条件: いつ、何が起きたら再検討するか
- 関連: Issue / Task / PR / ドキュメント
