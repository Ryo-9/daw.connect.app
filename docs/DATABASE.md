# Database Notes

## 重要

この文書は将来のデータモデル候補を整理するメモです。DB 製品、ORM、テーブル名、カラム、制約は未確定であり、今回は DB の作成、接続、マイグレーション、シード、実データ投入を行いません。

## 基本方針の候補

- バンドをデータ分離の基本単位にする
- すべての読み書きで、ログインだけでなくバンド所属と操作権限を確認する
- ID は外部から連番を推測しにくい形式を検討する
- 作成日時と更新日時を必要なテーブルに持たせる
- 削除方式、保持期間、復旧可否はテーブルごとに決める
- ファイル本体は DB に入れず、安全なストレージ上のオブジェクトを参照する案を優先する
- 楽曲の履歴とコメントの対象バージョンを区別する
- 個人情報とログは必要最小限にする

## 将来のテーブル案

### `users`

アプリ利用者の基本プロフィール。認証サービス固有の資格情報を直接保存しない構成を検討します。

候補フィールド: `id`、`auth_provider_id`、`display_name`、`email`（必要性を要検討）、`avatar_url`、`created_at`、`updated_at`、`deleted_at`

### `bands`

バンドワークスペース。

候補フィールド: `id`、`name`、`description`、`image_url`、`created_by`、`created_at`、`updated_at`、`archived_at`

### `band_members`

ユーザーとバンドの所属関係。1 ユーザーが複数バンドへ参加できるようにします。

候補フィールド: `id`、`band_id`、`user_id`、`role`、`status`、`joined_at`、`created_at`、`updated_at`

候補制約: `band_id` と `user_id` の組み合わせを重複させない。ロール値は権限設計後に確定する。

### `band_invitations`（追加候補）

招待先、状態、有効期限を管理する候補。招待トークンは平文保存を避けます。

候補フィールド: `id`、`band_id`、`invitee_identifier`、`role`、`status`、`invited_by`、`token_hash`、`expires_at`、`accepted_at`、`created_at`

### `songs`

バンドに所属する楽曲の基本情報。

候補フィールド: `id`、`band_id`、`title`、`description`、`status`、`bpm`、`musical_key`、`created_by`、`created_at`、`updated_at`、`archived_at`

### `song_notes`（追加候補）

楽曲ごとの整理済みメモ。最初は 1 楽曲 1 メモとするか、複数カテゴリに分けるか未決定です。

候補フィールド: `id`、`song_id`、`content`、`updated_by`、`created_at`、`updated_at`

### `song_versions`

楽曲の特定版。音源やコメントがどの版に属するかを明確にします。

候補フィールド: `id`、`song_id`、`version_label`、`description`、`created_by`、`created_at`

候補制約: 同じ楽曲内での `version_label` の重複可否を決める。

### `comments`

通常コメントとタイムスタンプコメント。返信を同じテーブルで表す案があります。

候補フィールド: `id`、`song_id`、`song_version_id`（任意）、`author_id`、`parent_comment_id`（任意）、`body`、`timestamp_ms`（任意）、`created_at`、`updated_at`、`deleted_at`

候補ルール: タイムスタンプは秒ではなくミリ秒など単位を固定し、負数を禁止する。対象バージョンが必要かを明確にする。

### `tasks`

楽曲のパート別 TODO。

候補フィールド: `id`、`song_id`、`title`、`description`、`part`、`assignee_id`（任意）、`status`、`priority`、`due_at`（任意）、`created_by`、`created_at`、`updated_at`、`completed_at`

### `files`

ストレージ上のファイルに関するメタデータ。ファイル本体や一時的な署名 URL は保存しない案を優先します。

候補フィールド: `id`、`band_id`、`song_id`、`song_version_id`（任意）、`uploaded_by`、`storage_key`、`original_name`、`media_type`、`size_bytes`、`checksum`、`status`、`created_at`、`deleted_at`

## 主な関係の案

- `users` と `bands` は `band_members` を介した多対多
- `bands` は複数の `songs` を持つ
- `songs` はメモ、複数の `song_versions`、`comments`、`tasks`、`files` を持つ
- `song_versions` は複数の `comments` と `files` を持てる
- `users` は作成者、投稿者、担当者、アップロード者として各データへ参照される

## 実装前に決めること

- DB / ORM / マイグレーション方式
- ID、日時、タイムゾーン、列挙値の表現
- ロール、所属状態、招待状態の定義
- 削除、退会、バンド解散時のデータ処理
- メモの構造と編集履歴
- コメント編集・削除・返信の仕様
- 楽曲バージョン番号の付け方
- ファイル容量、許可形式、検査、保持期間
- インデックス、検索、ページング
- バックアップ、復旧、監査ログ
- テストデータと本番データの完全な分離

## セキュリティ確認

DB 実装時は、各クエリが対象バンドへのアクセス権を検証していることをテストします。クライアントから送られた `user_id`、`band_id`、ロールを信用せず、サーバー側で確定します。接続文字列をコードやログへ出しません。
