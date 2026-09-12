# Active Tasks

現在作業中のタスクと担当範囲を共有するためのテンプレートです。作業開始前に 1 行追加し、PR のマージまたは作業中止時に履歴へ移します。

## 使い方

1. `TASK_QUEUE.md` の ID または新しいタスク ID を決める
2. 担当者、ブランチ、対象ファイル、開始日を記入する
3. 同時編集を避ける範囲を `LOCKS.md` に記入する
4. 状態が変わったら、この表と PR を更新する
5. 完了または中止したタスクは下の履歴へ移す

状態は `準備中`、`作業中`、`レビュー待ち`、`停止中` を使います。停止中の場合は理由と再開条件をメモします。

## 作業中

| Task ID | タスク名 | 担当者 | 状態 | ブランチ | 対象ファイル / 領域 | 開始日 | PR | メモ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COLLAB-001-DESIGN | Band membership lifecycle / Activity Status / Notification UX | Codex | レビュー待ち | `docs/collab-001-membership-notification-design` | `docs/PRODUCT_SPEC.md`、`docs/USER_FLOW.md`、`docs/API.md`、`docs/DATABASE.md`、`docs/TESTING.md`、`docs/SCREEN_LIST.md`、`docs/DECISION_LOG.md`、作業状態文書 | 2026-09-11 | #36 | Leave / remove、Owner invariant、Activity Status、Notification preset / Quiet Hours / Centerをdocs化。runtime / physical DB変更なし |

## 完了・中止履歴

| Task ID | 結果 | 担当者 | ブランチ / PR | 終了日 | メモ |
| --- | --- | --- | --- | --- | --- |
| CREATIVE-001-DESIGN | 完了 | Codex | `docs/creative-001-creative-workflow-design` / #35 | 2026-09-11 | 創作を管理せず支えるMemo / Idea / Task、Version履歴、Anchor、Focus Modeを設計しmainへマージ済み。runtime / physical DB変更なし |
| AUTH-001-DESIGN | 完了 | Codex | `docs/auth-001-cognito-session-design` / #34 | 2026-09-11 | invite-only signup、branded Cognito Managed Login、BFF session、Passkey / device / account lifecycleを設計しmainへマージ済み。Cognito / runtime実装なし |
| CLOUD-OIDC-001-DESIGN | 完了 | Codex | `docs/cloud-oidc-001-deployment-trust` / #33 | 2026-09-11 | GitHub Environment限定OIDC trust、CDK role delegation、PR safety、revocation contractを設計しmainへマージ済み。OIDC / IAM / workflow実装なし |
| STORAGE-001-DESIGN | 完了 | Codex | `docs/storage-001-private-asset-design` / #32 | 2026-09-11 | private Preview / MIDIのbucket、encryption、opaque key、upload / access、retention、recovery contractを設計しmainへマージ済み。AWS resource作成なし |
| AUTHZ-001 | 完了 | Codex | `docs/authz-001-capability-matrix` / #31 | 2026-09-11 | Band Membership role、capability、ownership、cross-Band protection、audit / test contractを設計しmainへマージ済み。AWS resource作成なし |
| CLOUD-DATA-001 | 完了 | Codex | `docs/cloud-data-001-dynamodb-design` / #30 | 2026-09-11 | Cloud MVPのOn-Demand single-table、sparse GSI、transaction、concurrency、PITR / restoreを設計しmainへマージ済み。AWS resource作成なし |
| CLOUD-003C-DECISION | 完了 | Codex | `docs/cloud-003c-bootstrap-decision` / #29 | 2026-09-11 | nonprod bootstrapの一時permission、execution policy、proposed command、runbookを一案へ確定しmainへマージ済み。actual bootstrapは別Human Gateで未承認 |
| CLOUD-003C-REVIEW | 完了 | Codex | `docs/cloud-003c-bootstrap-review` / #28 | 2026-09-11 | 現行CDK bootstrap resource、cost、permission、execution policy、OIDC原則をAWS公式資料でreviewしmainへマージ済み。AWS接続・変更なし |
| CLOUD-003C-PREP | 完了 | Codex | `docs/cloud-003c-prep-checkpoint` / #27 | 2026-09-11 | 人間確認済みのnonprod readinessとactual bootstrap前のHuman Gateを機密識別子なしでmainへ同期。AWS接続・resource変更なし |
| CLOUD-003B-CI | 完了 | Codex | `chore/cloud-003b-infra-ci` / #26 | 2026-09-10 | Node.js 24の既存`Quality checks`へinfra build / test / offline synthを統合してmainへマージ済み。AWS credential・OIDC・resource操作なし |
| CLOUD-003B | 完了 | Codex | `chore/cloud-003b-cdk-repository-foundation` / #25 | 2026-09-10 | 独立`infra/` package、空Stack、offline test / synthをmainへマージ済み。AWS接続・resource作成なし |
| HOST-001 | 完了 | Codex | `docs/host-001-private-alpha-hosting-decision` / #24 | 2026-09-10 | Vercel ProをPrivate Alpha primary hosting candidateとしてmainへマージ済み。契約・project・deploymentなし |
| CLOUD-002 | 完了 | Codex | `cloud/cloud-002-foundation-decision` / #23 | 2026-09-10 | account / environment、IaC、credential、cost、rollback方針をmainへマージ済み。AWS接続・resource作成なし |
| CLOUD-001 | 完了 | Codex | `cloud/cloud-001-phase2-mvp-plan` / #22 | 2026-09-10 | 2026年末Private AlphaのCloud MVP architectureとhuman gateをmainへマージ済み。AWS resource作成なし |
| DATA-002 | 完了 | Codex | `data/data-002-core-api-boundary` / #21 | 2026-09-09 | Core collaboration API / persistence boundary草案をmainへマージ済み。runtime実装なし |
| FLOW-001 | 完了 | Codex | `flow/flow-001-core-collaboration-review` / #20 | 2026-09-09 | Preview → Comment → Proposal → Decision → Versionの非保存review flowをmainへマージ済み |
| DATA-001 | 完了 | Codex | `data/data-001-mock-schema-review` / #19 | 2026-09-09 | Phase 1 mock data棚卸しとPhase 2 cloud data model草案をmainへマージ済み。実装変更なし |
| SURFACE-017 | 完了 | Codex | `surface/surface-017-song-form-prototype` / #18 | 2026-09-06 | 楽曲作成・編集の非保存フォームと画面内review previewをmainへマージ済み |
| VISUAL-003 | 完了 | Codex | `visual/visual-003-waveform-midi-collaboration-surfaces` / #17 | 2026-09-06 | 表示専用のWaveform、MIDI proposal、Comment / Version、Call Bar surfaceをmainへマージ済み |
| VISUAL-002 | 完了 | Codex | `visual/visual-002-mechanical-daw-workspace` / #16 | 2026-09-06 | mechanical canvas、panel、control、segment meterのvisual refinementをmainへマージ済み |
| VISUAL-001 | 完了 | Codex | `visual/visual-001-streamband-foundation` / #15 | 2026-09-05 | 濃紺base・紫/青accentのvisual foundationを主要画面へ反映してmainへマージ済み |
| SURFACE-015B | 完了 | Codex | `fix/surface-015b-song-detail-section-nav` / #14 | 2026-09-05 | 320pxで楽曲詳細section navigationの全項目を見切れなく表示し、領域内横scrollを解消 |
| BRIDGE-004 | 完了 | Codex | `docs/bridge-004-project-context-ai-delegation` / #13 | 2026-09-05 | Project Context、AI / Codex委任方針、将来の限定的auto-merge候補を文書化してmainへマージ済み |
| SURFACE-015A | 完了 | Codex | `fix/surface-015a-tap-targets` / #12 | 2026-09-05 | 主要リンクとnavigationのtap領域を44px目安へ調整し、4 viewportとCI成功後にmainへマージ済み |
| SURFACE-015 | 完了 | Codex | `audit/surface-015-mobile-ui` / #11 | 2026-09-05 | 主要画面を4 viewportで監査し、Low issue 3件と独立した修正候補を記録してmainへマージ済み |
| BRIDGE-003 | 完了 | Codex | `docs/bridge-003-pr-template` / #10 | 2026-09-03 | 標準PRテンプレートを追加し、GitHub Actions成功後にmainへマージ済み |
| BRIDGE-002 | 完了 | Codex | `chore/bridge-002-main-protection` / #9 | 2026-09-03 | mainへのPRと`Quality checks`を必須化し、削除・force pushを禁止するrulesetを設定してmainへマージ済み |
| BRIDGE-008 | 完了 | Codex | `test/bridge-008-ui-automation` / #8 | 2026-09-03 | Level 1のComponent testとChromium smoke E2Eを追加し、GitHub Actions成功後にmainへマージ済み |
| BRIDGE-006 | 完了 | Codex | `ci/bridge-006-pr-quality-checks` / #7 | 2026-09-03 | main 向け PR の `npm ci`、lint、build CIを追加し、GitHub Actions成功後にmainへマージ済み |
| BRIDGE-005 | 完了 | Codex | `docs/bridge-005-testing-strategy` / #6 | 2026-09-03 | 初期テスト方針を定義し、main へマージ済み。テストツールは未導入 |
| BRIDGE-009 | 完了 | Codex | `docs/bridge-009-project-state-sync` / #5 | 2026-09-02 | 現在実装とプロジェクト文書を同期し、main へマージ済み |
| ui-interaction-prototype-001 | 完了 | Codex | `ui/ui-interaction-prototype-001` / #4 | 2026-08-10 | 非永続の検索・絞り込み、コメント一時追加、TODO 切り替えを main へマージ済み |
| ui-prototype-001 | 完了 | Codex | `ui/ui-prototype-001` / #3 | 2026-08-10 | main へマージ済み |
| fill-initial-docs | 完了 | 未記入 | `docs/initial-project-docs` / #2 | 2026-08-10 | main へマージ済み |
| initial-project-docs | 完了 | 未記入 | `docs/initial-project-docs` / #2 | 2026-08-10 | 初期文書の配置修正を含めて main へマージ済み |
| 記入例 | 完了 / 中止 | 名前 | `feature/example` / #123 | YYYY-MM-DD | 短い結果または中止理由 |

## 新規行テンプレート

| Task ID | タスク名 | 担当者 | 状態 | ブランチ | 対象ファイル / 領域 | 開始日 | PR | メモ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-ID | 目的が分かる名前 | 名前 | 準備中 | `type/task-name` | パスまたは機能領域 | YYYY-MM-DD | 未作成 | 依存関係・注意点 |
