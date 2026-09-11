# Task Queue

今後 Codex に依頼する候補を管理します。ここにある項目は着手許可ではありません。着手前に 1 件を選び、目的、変更範囲、禁止範囲、完了条件を具体化して、1 タスク 1 ブランチ 1 PR で進めます。

## 運用ルール

- 優先度は `P0`（最優先）、`P1`（重要）、`P2`（後で検討）を使う
- 依存関係のあるタスクは、前のタスクが完了してから着手する
- Core Lane は高リスク領域を含むため、二人の合意と明示指示が必要
- 同時作業前に `ACTIVE_TASKS.md` と `LOCKS.md` を更新する
- 完了した項目は PR 番号とともに履歴へ移すか、チェックを付ける

## 現在の状態と次候補

2026-09-11 時点で、AUTH-001-DESIGN / PR #34までがmainへマージ済みです。現在の操作データはブラウザ内の一時状態で、DB、API、認証、application AWS resource、hosting deploymentは未実装です。mainはPR経由と`Quality checks`成功がGitHub rulesetで必須化されています。現在はCREATIVE-001-DESIGNで、創作を管理せず支えるMemo / Idea / Task、Version履歴、Anchor、Focus ModeのUX contractをreviewしています。CLOUD-003C actual bootstrap、OIDC、Cognito / session runtime実装はそれぞれ別Human Gateのままです。

次に検討する候補は以下です。順序や着手日は確定事項ではなく、担当と変更範囲を確認してから選びます。

| 候補 | ID | 内容 | 依存・注意 |
| --- | --- | --- | --- |
| 1 | CREATIVE-001-DESIGN | Creative workflow and lightweight production tracking | レビュー待ち。Memo / Idea / Task、Version横断未対応、Anchor / Timeline / Focus、非強制progressをdocs化。runtime / physical DB変更なし |
| 2 | CLOUD-003C | Nonprod AWS Foundation Bootstrap | 未承認。PR #29のdecision merge後もactual command実行には別Human Gateが必要 |
| 3 | AUTH-001 | Private Alpha authentication prototype | AUTH-001-DESIGN / PR #34は完了。CLOUD-003の必要なfoundation execution gate完了後、Cognito / session runtimeを別taskで実装 |
| 4 | HOST-DEPLOY-001 | Nonprod hosting proof of concept | HOST-001のprovider / cost承認後だけ開始。account接続、Next.js 16 compatibility、protected Preview、rollbackをsynthetic dataで検証 |
| 5 | SURFACE-015C | custom 404の追加 | Cloud critical pathと別lockで並行可能。SURFACE-015のISSUE-003 |
| 6 | SURFACE-016 | 長い楽曲名の境界確認 | Cloud critical pathと別lockで並行可能。長文fixtureで折返しを確認 |

## Data Design Lane

Phase 1のmockと将来の永続化境界を整理するレーンです。DB、API、Auth、AWSの採用や実装はCore Laneの明示タスクへ分離します。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| DATA-001 | P1 | Mock data schema review | 完了（PR #19）。Phase 1の実装事実とPhase 2 cloud data model候補を分け、entity、関係、enum、画面対応を文書化 |
| DATA-002 | P1 | API boundary draft | 完了（PR #21）。DATA-001 / FLOW-001を前提に、core operation、認可、runtime validation、競合、冪等性、upload境界を文書化。API実装なし |

## Cloud Implementation Lane

2026年末Private Alphaへ向けた候補です。CLOUD-001 / CLOUD-002 / HOST-001は完了し、CLOUD-003を人間側account準備、repository foundation、将来bootstrapへ分割しています。後続taskはそれぞれhuman approval、専用branch、lock、PRを必要とします。

既存Core LaneのAuth / DB / Storage / Monitoring候補と目的が重なる項目は、このCloud critical pathと二重に実装しません。CLOUD-002で既存候補との対応を確認し、後続task IDとscopeを一つに統合してから着手します。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| CLOUD-001 | P0 | Phase 2 Cloud MVP Architecture Plan | 完了（PR #22）。2 user / 1 private BandのAuth、API、metadata、private Asset、monitoring、cost、recovery、critical pathをdocs化。resource作成なし |
| CLOUD-002 | P0 | Cloud foundation / environment / IaC decision | 完了（PR #23）。account分離、Region、IaC、credential、naming、cost、rollback、destroyの方針をdocs化。resource作成なし |
| HOST-001 | P0 | Next.js Private Alpha hosting decision | 完了（PR #24）。Vercel Pro primary candidate、Amplify conditional fallback、AWS-native last resortを比較。契約・project・deploymentなし |
| CLOUD-003 | P0 | Nonprod AWS Foundation Bootstrap | 進行中。CLOUD-003A、CLOUD-003B、CLOUD-003B-CI、CLOUD-003C-PREP、CLOUD-003C-REVIEW、CLOUD-003C-DECISIONは完了。actual bootstrapは別Human Gate待ち |
| CLOUD-003A | P0 | Nonprod account readiness | 人間側で完了報告済み。StreamBand用nonprod account、root MFA、monitoring用Budget、MFA付きhuman IAM user、temporary local authenticationを確認。機密識別子・credentialはrepositoryへ保存しない |
| CLOUD-003B | P0 | CDK Repository Foundation | 完了（PR #25）。AWS CDK + TypeScriptの`infra/`、空Stack、offline unit test / synthを追加。AWS接続・resource作成なし |
| CLOUD-003B-CI | P0 | Infrastructure CI Integration | 完了（PR #26）。Node.js 24の既存`Quality checks`へ独立infra packageのbuild / test / offline synthを統合。AWS credential・OIDC・resource操作なし |
| CLOUD-003C-PREP | P0 | AWS nonprod readiness checkpoint | 完了（PR #27）。人間確認済みreadinessとactual bootstrap前のHuman Gateを機密識別子なしで同期。AWS接続・resource変更なし |
| CLOUD-003C-REVIEW | P0 | CDK bootstrap resource / cost / permission review | 完了（PR #28）。現行default bootstrap、billing driver、temporary permission、execution policy、OIDC原則と明示Human Gateを公式資料で整理。AWS接続・resource変更なし |
| CLOUD-003C-DECISION | P0 | Final nonprod bootstrap permission and execution plan | 完了（PR #29）。bootstrapper temporary policy、execution role、proposed command、runbook、STOP条件を一案へ確定。AWS接続・変更なし |
| CLOUD-003C | P0 | Nonprod AWS Foundation Bootstrap | 未承認。CLOUD-003C-DECISIONのhuman review / merge後も、actual command実行には別の明示承認が必要 |
| CLOUD-OIDC-001-DESIGN | P0 | GitHub Actions OIDC deployment trust design | 完了（PR #33）。nonprod Environment限定trust、CDK role delegation、session、PR safety、revocationを設計。OIDC / IAM / workflow実装なし |
| HOST-DEPLOY-001 | P0 | Nonprod hosting proof of concept | HOST-001承認後のhosting接続task候補。synthetic dataだけでNext.js 16、protected Preview、manual promotion、rollbackを検証 |
| AUTH-001-DESIGN | P0 | Cognito authentication and web session contract | 完了（PR #34）。email sign-in、invitation-gated signup、branded Managed Login、confidential BFF、7-day session、Passkey / device / account lifecycleを設計。Cognito resource / runtime実装なし |
| AUTH-001 | P0 | Private Alpha authentication prototype | AUTH-001-DESIGN承認とCLOUD-003のfoundation execution gate完了までblock。Cognito、BFF session、callback、secretは専用実装taskで検証 |
| CLOUD-DATA-001 | P0 | Metadata persistence physical design | 完了（PR #30）。On-Demand single-table + sparse GSI 1本を選び、key / access pattern / transaction / concurrency / PITR / PostgreSQL再評価条件をreview。resource作成なし |
| AUTHZ-001 | P0 | Band Membership authorization | 完了（PR #31）。5 roleのcapability matrix、resource ownership、strong Membership check、cross-Band denial、AuditEvent、future test contractを設計。実装なし |
| API-001 | P0 | Band / Song core read-write | DATA-002 contractの最小slice。Auth/Authz/Dataのgate後のみ |
| STORAGE-001-DESIGN | P0 | Private Preview / MIDI storage contract | 完了（PR #32）。bucket、encryption、opaque key、format / size、state、short-lived upload/access、retention、recoveryを設計。resource作成なし |
| STORAGE-001 | P0 | Private Preview / MIDI Asset implementation | CLOUD-003 foundation execution gateとSTORAGE-001-DESIGN承認後のみ。S3 / API / IAM実装は別task |
| VERSION-001 | P0 | Persisted Version workflow | DAW export後の明示Version作成。Proposal Decisionによる自動作成なし |
| COMMENT-001 | P0 | Persisted Version Comment | Version-scoped Comment + Anchorとpermission / conflict test |
| PROPOSAL-001 | P1 | Persisted MIDI Proposal + Decision | SOURCE_MIDIを上書きしない別Asset / entityとDecision履歴 |
| OBS-001 | P0 | Private Alpha operations baseline | finite logs、alarms、Budgets、backup / restore drill、incident / cost runbook |
| DEPLOY-001 | P0 | Isolated Private Alpha deployment | required checksとyear-end acceptance criteriaを満たす2 user環境 |

## Flow Lane

既存surfaceを使った共同制作の順序と、DAW / StreamBand間の責務境界を整理するレーンです。Phase 1では表示と画面内の一時操作だけを扱います。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| FLOW-001 | P1 | Core Collaboration Review Flow | 完了（PR #20）。Song DetailでPreview → Comment → MIDI Proposal → Decision → Versionの順序と非破壊境界を明示 |

## Creative Support Lane

創作意図と制作の歩みを、project-management型の強制へ変えずに扱うレーンです。Creative itemのruntime / persistenceは、docs承認後もAUTHZ / data / surfaceの小さなtaskへ分割します。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| CREATIVE-001-DESIGN | P0 | Creative workflow and lightweight production tracking | レビュー待ち。Memo / Idea / Task、Comment → Task、Version履歴 / outstanding、Anchor、Timeline、Focus Mode、非強制progressを定義。CLOUD-DATA-001 physical designは変更しない |
| CREATIVE-DATA-001 | P1 | Creative item persistence extension | CREATIVE-001承認後の候補。Physical item / index / transaction / retention / Auditをreviewし、既存single-tableを変更する場合は専用Decisionとmigration planを要求 |
| CREATIVE-AUTHZ-001 | P1 | Creative item capability extension | Memo / Idea / Taskのcreate / edit / convert / unnecessary / delete、Comment link、assigneeを5 roleへmappingする設計候補 |
| CREATIVE-SURFACE-001 | P1 | Creative Board and Focus Mode prototype | Data / Authz contract後の小規模surface候補。Timeline marker、cluster、Focusを非永続mockから検証し、playback / Version作成をblockしない |

## Core Lane

DB、API、認証、権限、AWS など、データとインフラの中核を扱うレーンです。候補の比較・設計と実装を別タスクに分けます。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| CORE-001 | P1 | MVP データ要件の確定 | エンティティ、関係、保持・削除方針をレビュー済みにする。実装なし |
| CORE-002 | P1 | DB 候補の比較 | PostgreSQL 系サービスなどを費用・運用・移行性で比較する。採用は別判断 |
| CORE-003 | P1 | 認証候補の比較 | セッション、招待、退会を含め、安全性と費用を比較する。実装なし |
| CORE-004 | P1 | 権限マトリクスの設計 | 所有者、メンバー、招待中などの操作可能範囲を表にする |
| CORE-005 | P1 | API 契約の具体化 | 入出力、認可、エラー、ページングを定義する。秘密情報は含めない |
| CORE-006 | P1 | DB スキーマとマイグレーション方針 | 採用技術決定後に専用 PR で設計する |
| CORE-007 | P1 | 認証の最小実装 | 設計承認後のみ。テスト、失敗時動作、秘密管理を含める |
| CORE-008 | P1 | バンド・楽曲 API の最小実装 | 認証・権限・DB の土台完了後に着手する |
| CORE-009 | P1 | コメント・TODO API の実装 | 楽曲アクセス権を必ず検証する |
| CORE-010 | P1 | ファイル保存方式の比較 | 容量、形式、署名 URL、削除、費用、マルウェア対策を検討する |
| CORE-011 | P2 | AWS 構成案と費用上限のレビュー | IAM 最小権限、Budgets、ログ、停止手順を含める。構築なし |
| CORE-012 | P2 | ストレージの限定実装 | 保存方式の承認後のみ。非公開を既定にし、アクセス制御をテストする |
| CORE-013 | P2 | 監査・バックアップ・削除設計 | 復旧手順とユーザーデータ削除を定義する |
| CORE-014 | P2 | 課金要件と Stripe 候補調査 | v1 の利用検証後。法務、返金、Webhook の安全性を含める |

## Surface Lane

UI、画面、フォーム、レスポンシブ対応を扱うレーンです。Phase 1 はモックデータを使い、Core Lane の実装を前提にしません。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| SURFACE-001 | P0 | UI 方針とデザイントークンの作成 | 色、文字、余白、状態、モバイル基準を決める |
| SURFACE-002 | P0 | 共通レイアウトとナビゲーション | 完了（PR #3）。PC / モバイルの基本移動をモックで確認できる |
| SURFACE-003 | P0 | ランディングページ | 完了（PR #3）。アプリ概要と開始導線をレスポンシブで表示する |
| SURFACE-004 | P0 | ダッシュボード UI | 完了（PR #3）。バンド、最近の楽曲、自分の TODO をモック表示する |
| SURFACE-005 | P0 | バンド一覧・詳細 UI | 一部完了（PR #3）。通常状態は実装済み。空状態とエラー状態は未実装 |
| SURFACE-006 | P0 | 楽曲一覧・詳細 UI | 一部完了（PR #3）。画面、状態、更新情報は実装済み。正式なモバイル確認は SURFACE-015 で行う |
| SURFACE-007 | P1 | 楽曲作成・編集フォーム | SURFACE-017 / PR #18でPhase 1の非保存入力とreview previewを完了。保存・詳細validationは後続で検討する |
| SURFACE-008 | P1 | 楽曲メモ UI | 表示と編集状態を分け、未保存が分かるようにする |
| SURFACE-009 | P1 | コメント UI | 一部完了（PR #3、#4）。表示と非永続の一時追加は実装済み。返信などは未実装 |
| SURFACE-010 | P1 | タイムスタンプコメント UI | 一部完了（PR #3、#4）。時刻表示と任意入力は実装済み。音源・バージョン連携は未実装 |
| SURFACE-011 | P1 | パート別 TODO UI | 一部完了（PR #3、#4）。表示と非永続の完了切り替えは実装済み。作成・絞り込みは未実装 |
| SURFACE-012 | P1 | ファイル・バージョン UI | 実アップロードなしで種類、版、状態を設計する |
| SURFACE-013 | P1 | 認証・招待画面プロトタイプ | 見た目とエラー導線のみ。認証実装を含めない |
| SURFACE-014 | P1 | アクセシビリティ改善 | 一部完了（PR #4）。基本的なラベルとフォーカスを実装済み。体系的な確認は未実施 |
| SURFACE-015 | P1 | 主要画面のモバイル確認 | 完了（PR #11）。4 viewportで主要画面を監査し、Low issue 3件を独立した修正候補へ分割 |
| SURFACE-015A | P2 | モバイルのタップ領域調整 | 完了（PR #12）。主要操作を44px目安へ調整し、320 / 375 / 390 / 768pxで横overflowがないことを確認 |
| SURFACE-015B | P2 | 320pxの楽曲詳細セクションナビ改善 | 完了（PR #14）。320pxで全section itemを表示し、navigation領域内の横scrollを解消 |
| SURFACE-015C | P2 | custom 404の追加 | 監査ISSUE-003。日本語案内とダッシュボード / バンド一覧への復帰導線を追加する |
| SURFACE-016 | P2 | 長い楽曲名の境界確認 | 長文fixtureを使い、主要card、見出し、breadcrumbの折返しと横overflowを確認する |
| SURFACE-017 | P1 | 楽曲作成・編集フォームの非保存プロトタイプ | 完了（PR #18）。保存処理なしで入力、review preview、未保存状態の見せ方を検証済み |

## Visual Lane

色、surface、type、spacingなど、既存の情報構造を保ったvisual systemを扱うレーンです。DAW本体の編集UIや新機能は含みません。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| VISUAL-001 | P0 | StreamBand visual foundation | 完了（PR #15）。黒〜濃紺のcanvas、紫/青accent、制作toolらしいpanel・border・shadowへ主要画面を同期 |
| VISUAL-002 | P1 | Mechanical DAW workspace refinement | 完了（PR #16）。微細なgrid、rack panel、inset control、segment meterで機材感を補強 |
| VISUAL-003 | P1 | Waveform MIDI collaboration surfaces | 完了（PR #17）。楽曲詳細に表示専用のWaveform、MIDI proposal、review、presence surfaceを追加。実機能は含めない |

## Bridge Lane

ドキュメント、テスト、開発支援、軽微修正を扱うレーンです。

| ID | 優先度 | タスク候補 | 完了イメージ / 注意 |
| --- | --- | --- | --- |
| BRIDGE-000 | P0 | Git リポジトリとリモートの初期設定 | 涼さんの GitHub リポジトリへ安全に接続し、初期ブランチと共同作業者を確認する |
| BRIDGE-001 | P0 | Next.js 開発環境の初期化 | 完了。Next.js / TypeScript / Tailwind CSS を初期化し、起動・lint・build を確認済み |
| BRIDGE-002 | P0 | GitHub ブランチ保護 | 完了（PR #9）。mainへのPRと`Quality checks`成功を必須化し、削除とforce pushを禁止。詳細は [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) |
| BRIDGE-003 | P0 | PR テンプレートの作成 | 完了（PR #10）。Task、変更、検証、安全性、競合、未対応とリスクを短いチェックリストで標準化 |
| BRIDGE-004 | P1 | Project contextとAI委任方針 | 完了（PR #13）。統合仕様、UI方向性、Codex委任境界、将来の限定的auto-merge候補を文書化。DEC-007は提案中 |
| BRIDGE-005 | P1 | テスト方針の作成 | 完了（PR #6）。`TESTING.md` で Vitest、React Testing Library、Playwright と Level 1〜3 の対象を整理し、Level 1の導入はPR #8で完了 |
| BRIDGE-006 | P1 | CI で lint / build を実行 | 完了（PR #7）。main 向け PR ごとに `npm ci`、lint、標準 build を自動化済み |
| BRIDGE-007 | P1 | Issue / タスク記述テンプレート | Codex に渡せる変更範囲と完了条件を標準化する |
| BRIDGE-008 | P1 | 主要 UI のテスト追加 | 完了（PR #8）。楽曲検索・絞り込み、TODO、コメントのComponent testと、主要導線・404・一時状態のChromium smoke E2Eを追加 |
| BRIDGE-009 | P1 | ドキュメント整合性レビュー | 完了（PR #5）。現在実装、マージ済み作業、未実装領域を文書へ同期済み |
| BRIDGE-010 | P2 | アクセシビリティ確認手順 | 手動確認と自動検査の項目をチェックリスト化する |
| BRIDGE-011 | P2 | エラー報告テンプレート | 再現手順、期待結果、実際結果、環境を揃える |
| BRIDGE-012 | P2 | 依存関係更新ルール | 更新頻度、レビュー、ロックファイル、脆弱性対応を定義する |
| BRIDGE-013 | P1 | モックデータと型の方針 | 旧BRIDGE-004候補。UI用データの置き場所、命名、実APIへの移行方法を専用タスクで決める |

## 完了履歴

| ID | PR | 完了日 | メモ |
| --- | --- | --- | --- |
| AUTH-001-DESIGN | #34 | 2026-09-11 | invitation-gated signup、Cognito Managed Login、BFF session、Passkey / device / account lifecycleを設計。Cognito resource / runtime実装なし |
| CLOUD-OIDC-001-DESIGN | #33 | 2026-09-11 | GitHub Environment限定OIDC trust、CDK role delegation、PR safety、revocation contractを設計。OIDC / IAM / workflow実装なし |
| STORAGE-001-DESIGN | #32 | 2026-09-11 | private Preview / MIDIのbucket、encryption、opaque key、upload / access、retention、recovery contractを設計。AWS resource作成なし |
| AUTHZ-001 | #31 | 2026-09-11 | 5 roleのBand capability、canonical ownership、strong Membership check、cross-Band denial、AuditEvent、future test contractを設計。AWS resource作成なし |
| CLOUD-DATA-001 | #30 | 2026-09-11 | Cloud MVPのOn-Demand single-table、sparse GSI、access pattern、transaction、concurrency、PITR / restoreを設計。AWS resource作成なし |
| CLOUD-003C-DECISION | #29 | 2026-09-11 | nonprod bootstrapの一時permission、execution policy、proposed command、runbookを一案へ確定。actual bootstrapは別Human Gateで未承認 |
| CLOUD-003C-REVIEW | #28 | 2026-09-11 | 現行CDK bootstrapのresource、cost、permission、execution policy、OIDC原則をAWS公式資料で整理。AWS接続・resource変更なし |
| CLOUD-003C-PREP | #27 | 2026-09-11 | 人間確認済みのAWS nonprod readinessとactual bootstrap前のHuman Gateを機密識別子なしで同期。AWS接続・resource変更なし |
| CLOUD-003B-CI | #26 | 2026-09-10 | Node.js 24の既存`Quality checks`へinfra build / test / offline synthを統合。AWS credential・OIDC・resource操作なし |
| CLOUD-003B | #25 | 2026-09-10 | 独立`infra/` package、resource 0件のCDK Stack、offline unit test / synthを追加。AWS接続・resource作成なし |
| HOST-001 | #24 | 2026-09-10 | Vercel Pro primary candidate、Amplify conditional fallback、AWS-native last resortを比較。hosting接続・deploymentなし |
| CLOUD-002 | #23 | 2026-09-10 | account / environment分離、CDK / TypeScript推奨、short-lived credential、cost、destroy、rollback、drift方針を文書化。AWS接続・resource作成なし |
| CLOUD-001 | #22 | 2026-09-10 | 2 user / 1 private BandのPhase 2 Cloud MVP target、security、cost、recovery、critical pathを文書化。AWS resource作成なし |
| DATA-002 | #21 | 2026-09-09 | Song / Version / Comment / Proposal / Assetのcore API boundary、authorization、validation、競合、冪等性、upload lifecycleを文書化 |
| FLOW-001 | #20 | 2026-09-09 | Song Detailに5 stepのreview導線、Comment Context、非破壊Proposal、Decision、DAW経由のVersion handoffを追加 |
| DATA-001 | #19 | 2026-09-09 | Phase 1 mock dataとPhase 2 cloud data model候補を分け、entity、関係、enum、画面対応、永続化前の論点を文書化 |
| SURFACE-017 | #18 | 2026-09-06 | 楽曲作成・編集の非保存フォーム、画面内review preview、reloadでの初期化を追加 |
| VISUAL-003 | #17 | 2026-09-06 | 楽曲詳細へ表示専用のWaveform、MIDI proposal、Comment / Version、Call Bar surfaceを追加 |
| VISUAL-002 | #16 | 2026-09-06 | mechanical canvas、panel、control、segment meterのvisual refinementを主要画面へ反映 |
| VISUAL-001 | #15 | 2026-09-05 | 濃紺base・紫/青accentのvisual foundationを主要画面へ反映 |
| SURFACE-015B | #14 | 2026-09-05 | 320pxの楽曲詳細section navigationで見切れと領域内横scrollを解消 |
| BRIDGE-004 | #13 | 2026-09-05 | Project Context、AI / Codex委任方針、将来の限定的auto-merge候補を文書化 |
| SURFACE-015A | #12 | 2026-09-05 | 主要navigation、パンくず、頻出linkのtap領域を44px目安へ調整 |
| SURFACE-015 | #11 | 2026-09-05 | 4 viewportで主要画面を監査し、Low issue 3件と独立した修正候補を記録 |
| BRIDGE-003 | #10 | 2026-09-03 | 変更、検証、安全性、競合、未対応事項を確認する標準PRテンプレートを追加 |
| BRIDGE-002 | #9 | 2026-09-03 | mainへのPRと`Quality checks`を必須化し、削除とforce pushを禁止するrulesetを設定 |
| BRIDGE-008 | #8 | 2026-09-03 | Level 1のComponent testとChromium smoke E2Eを導入し、PR CIへ追加 |
| BRIDGE-006 | #7 | 2026-09-03 | main 向けPull Requestで `npm ci`、lint、標準buildを実行するGitHub Actionsを導入 |
| BRIDGE-005 | #6 | 2026-09-03 | 初期自動テスト方針と Level 1〜3 の対象を定義。テストツールは未導入 |
| BRIDGE-009 | #5 | 2026-09-02 | 現在実装と GitHub 上のマージ済み作業にプロジェクト文書を同期 |
| initial-project-docs | #2 | 2026-08-10 | 開発準備ドキュメント一式 |
| ui-prototype-001 | #3 | 2026-08-10 | モックデータによるトップ、ダッシュボード、バンド、楽曲詳細の主要導線 |
| ui-interaction-prototype-001 | #4 | 2026-08-10 | 非永続の検索・絞り込み、コメント入力、TODO 切り替え、アクセシビリティ改善 |
