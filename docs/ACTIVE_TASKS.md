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
| SURFACE-015B | 320pxの楽曲詳細セクションナビ改善 | Codex | 作業中 | `fix/surface-015b-song-detail-section-nav` | `src/app/(workspace)/songs/[songId]/page.tsx`、関連E2E、作業状態文書 | 2026-09-05 | 本PR | ISSUE-002だけを対象に、320pxで最終tabを見切れさせず、領域内横スクロールを解消 |

## 完了・中止履歴

| Task ID | 結果 | 担当者 | ブランチ / PR | 終了日 | メモ |
| --- | --- | --- | --- | --- | --- |
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
