<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DAW Connect App project rules

このセクションは、DAW Connect App で作業する Codex / AI エージェント向けの必須ルールです。上の Next.js 固有ルールと合わせて、リポジトリ全体に適用します。依頼とルールが矛盾する場合や、安全に判断できない場合は実装を止めてユーザーへ確認してください。

## 最優先ルール

1. `main` ブランチへ直接 commit / push しない。
2. 1 タスクにつき 1 ブランチ、1 PR とし、別タスクの変更を混ぜない。
3. 指定されたタスク、ファイル、完了条件の範囲外を勝手に実装しない。
4. 既存のユーザー変更を消去、上書き、巻き戻ししない。
5. 仕様外の改善は実装せず、「提案」または「未対応事項」として残す。

## 作業開始前

- 現在のブランチと未コミット差分を確認する。
- `docs/ACTIVE_TASKS.md` と `docs/LOCKS.md` を確認し、他の担当者と編集範囲が重ならないことを確認する。
- タスク ID、変更可能範囲、禁止範囲、完了条件を確認する。
- 不明点が結果を大きく変える場合は、推測で進めず質問する。

## ブランチと PR

- ブランチ名は `feature/`、`fix/`、`docs/`、`chore/` のいずれかを基本とする。
- `main` の変更、強制 push、履歴の書き換えは禁止する。
- PR は小さく保ち、目的と無関係な整形やリファクタリングを含めない。
- PR 本文には「変更内容」「確認方法と実行結果」「未対応事項」「既知のリスク」を必ず含める。
- AI が生成したコードや文章も、人のレビューを前提とする。

## 高リスク領域

次の領域は高リスクとして扱い、タスクに明示的な指示と変更許可があるまで、実装・設定変更・依存追加を行わない。

- DB、スキーマ、マイグレーション、実データ
- 認証、セッション、招待
- 権限管理、ロール、アクセス制御
- AWS、IAM、S3、CloudFront、Lambda、API Gateway などのクラウド設定
- Stripe、課金、決済、請求
- 本番環境、本番デプロイ、DNS

高リスク領域のドキュメント案を作る場合も、確定事項と候補を明確に分ける。実在する認証情報や本番情報を例として記載しない。

## 秘密情報とセキュリティ

- API キー、パスワード、トークン、秘密鍵、接続文字列をコード、テスト、ログ、PR、ドキュメントに書かない。
- 秘密情報は環境変数で扱い、公開可能な名前だけを `.env.example` に記載する。
- `.env.local` や資格情報ファイルを commit しない。
- ログに個人情報、認証情報、ファイルの非公開 URL を出さない。
- 秘密情報の混入を見つけたら値を表示・再利用せず、作業を止めてユーザーへ報告する。

## 変更時の原則

- 最小限の差分で目的を満たし、既存の構成、命名、スタイルに合わせる。
- 依存パッケージの追加や更新は、明示されたタスクでのみ行う。
- 削除、破壊的操作、大規模な自動整形は、対象と影響を確認してから行う。
- 仮実装やモックは、その旨が分かるようにし、本番対応済みと表現しない。
- 将来候補を、現在採用済みの仕様として扱わない。

## 変更後の必須確認

コードまたは設定を変更した場合は、完了報告前に次を実行する。ドキュメントのみの変更でも、依頼の完了条件に含まれる場合は実行する。

1. `npm run lint`
2. `npm run build`

失敗した場合はエラーを隠さず、原因、試したこと、未解決点を報告する。未実行を成功扱いにしない。

## 完了報告

- タスク ID とブランチ名
- 変更したファイルと変更内容
- lint / build / テストの結果
- 未対応事項とリスク
- 次に分けるべきタスク候補
