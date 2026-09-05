# Locks

二人や複数の Codex セッションが同じファイル・領域を同時編集し、変更を上書きする事故を避けるための簡易ロック表です。技術的なロックではないため、作業前の確認と会話を必須とします。

## ルール

- 作業開始前に、編集するファイルまたは機能領域を「使用中のロック」に追加する
- ロックは必要最小限の範囲にする。リポジトリ全体をロックしない
- 同じファイルを触る必要がある場合は、先に担当者同士で順番を決める
- ロック中の範囲は、担当者の許可なく別タスクで編集しない
- PR のマージ、作業中止、担当の引き継ぎ時にロックを解除する
- 長時間更新がないロックも勝手に削除せず、担当者へ確認する
- DB、認証、権限、AWS、課金などは、ファイル単位ではなく領域単位でロックする

## 使用中のロック

| Lock ID | Task ID | 担当者 | ファイル / 領域 | ブランチ | 開始日 | 解除予定 / 条件 | メモ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LOCK-015 | VISUAL-001 | Codex | `src/app/**`、`src/components/**`、`src/lib/mock-data.ts`のvisual color、`docs/PROJECT_CONTEXT.md`、作業状態文書 | `visual/visual-001-streamband-foundation` | 2026-09-05 | PR マージまたは作業中止 | 既存情報構造を維持したvisual foundation変更。機能、package、CI、高risk領域は対象外 |

## 解除済みロック

| Lock ID | Task ID | 担当者 | ファイル / 領域 | 解除日 | 結果 / PR |
| --- | --- | --- | --- | --- | --- |
| LOCK-014 | SURFACE-015B | Codex | `src/app/(workspace)/songs/[songId]/page.tsx`、`tests/e2e/smoke.spec.ts`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md` | 2026-09-05 | 完了・PR #14。`Quality checks`成功とmainへのマージを確認して解除 |
| LOCK-013 | BRIDGE-004 | Codex | `AGENTS.md`、`README.md`、`docs/PROJECT_CONTEXT.md`、`docs/AI_DELEGATION.md`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、`docs/DECISION_LOG.md` | 2026-09-05 | 完了・PR #13。`Quality checks`成功とmainへのマージを確認して解除 |
| LOCK-012 | SURFACE-015A | Codex | 共通ナビゲーション、パンくず、バンドカード内リンク、楽曲詳細セクションナビ、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md` | 2026-09-05 | 完了・PR #12。`Quality checks`成功とmainへのマージを確認して解除 |
| LOCK-011 | SURFACE-015 | Codex | `docs/MOBILE_AUDIT.md`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、ローカル一時スクリーンショット | 2026-09-05 | 完了・PR #11。モバイル監査レポートのmainへのマージを確認して解除 |
| LOCK-010 | BRIDGE-003 | Codex | `.github/pull_request_template.md`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md` | 2026-09-03 | 完了・PR #10。GitHub Actions成功とmainへのマージを確認して解除 |
| LOCK-009 | BRIDGE-002 | Codex | GitHub repository ruleset、`README.md`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、`docs/TESTING.md`、`docs/ARCHITECTURE.md`、`docs/DECISION_LOG.md`、`docs/BRANCH_PROTECTION.md` | 2026-09-03 | 完了・PR #9。ruleset有効化、GitHub Actions成功、mainへのマージを確認して解除 |
| LOCK-008 | BRIDGE-008 | Codex | `package.json`、`package-lock.json`、`vitest.config.mts`、`vitest.setup.ts`、`playwright.config.ts`、`tests/`、`.github/workflows/ci.yml`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、`docs/TESTING.md`、`docs/ARCHITECTURE.md`、`docs/DECISION_LOG.md` | 2026-09-03 | 完了・PR #8。GitHub Actions成功とmainへのマージを確認して解除 |
| LOCK-007 | BRIDGE-006 | Codex | `.github/workflows/ci.yml`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、`docs/TESTING.md`、`docs/ARCHITECTURE.md` | 2026-09-03 | 完了・PR #7。GitHub Actions成功とmainへのマージを確認して解除 |
| LOCK-006 | BRIDGE-005 | Codex | `docs/TESTING.md`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、`docs/ARCHITECTURE.md`、`docs/DECISION_LOG.md` | 2026-09-03 | 完了・PR #6。main へのマージを確認して解除 |
| LOCK-005 | BRIDGE-009 | Codex | `README.md`、`docs/ACTIVE_TASKS.md`、`docs/LOCKS.md`、`docs/TASK_QUEUE.md`、`docs/ARCHITECTURE.md`、`docs/DECISION_LOG.md` | 2026-09-02 | 完了・PR #5。main へのマージを確認して解除 |
| LOCK-004 | ui-interaction-prototype-001 | Codex | `src/app/`、`src/components/`、関連 docs | 2026-09-02 | 友人確認済み。PR #4 は main へマージ済みのため解除 |
| LOCK-003 | ui-prototype-001 | Codex | `src/app/`、`src/components/`、`src/lib/mock-data.ts`、関連 docs | 2026-08-10 | 完了・PR #3 |
| LOCK-002 | fill-initial-docs | 未記入 | `README.md`、`AGENTS.md`、`docs/` | 2026-08-10 | 完了・PR #2 |
| LOCK-001 | initial-project-docs | 未記入 | `README.md`、`AGENTS.md`、`docs/` | 2026-08-10 | fill-initial-docs へ引き継ぎ。PR 未作成 |
| 記入例 | TASK-ID | 名前 | `src/example/` | YYYY-MM-DD | 完了 #123 / 中止 |

## 新規ロックテンプレート

| Lock ID | Task ID | 担当者 | ファイル / 領域 | ブランチ | 開始日 | 解除予定 / 条件 | メモ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LOCK-NNN | TASK-ID | 名前 | 具体的なパスまたは領域 | `type/task-name` | YYYY-MM-DD | 条件 | 競合しそうな作業 |

## 競合したとき

1. 両方の作業を一度止める
2. それぞれの未コミット差分と目的を確認する
3. 先に完了させるタスク、引き継ぐ変更、別ファイルへ分ける範囲を決める
4. `ACTIVE_TASKS.md` とこの表を更新する
5. 合意後に片方ずつ作業を再開する
