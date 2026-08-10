# API Notes

## 重要

この文書は将来必要になりそうな API の候補です。エンドポイント、方式、入出力は未確定であり、今回は API の実装、外部公開、認証接続を行いません。Next.js Route Handlers、Server Actions、別バックエンドのどれを採用するかも未決定です。

## 共通方針の候補

- すべての非公開操作で認証とバンド所属をサーバー側で確認する
- 作成・更新・削除は、操作ごとの権限を確認する
- 入力値は型だけでなく実行時にも検証する
- 内部エラー、秘密情報、他ユーザーの存在を不用意に返さない
- 一覧はページング、並び替え、上限を設ける
- 同じリクエストの再送、競合更新、二重投稿を考慮する
- 破壊的操作には確認、監査、必要に応じた再認証を検討する
- API のバージョン方針と廃止手順を公開前に決める

## 将来の API 案

表記は検討用の REST 風の例であり、採用決定ではありません。

### セッション / ユーザー

- `GET /api/me`: 現在のユーザーと基本設定を取得
- `PATCH /api/me`: 表示名など許可されたプロフィールを更新
- `DELETE /api/me`: 退会要求（即時削除か猶予期間かは未決定）

ログイン、ログアウト、メール確認、再設定は、採用する認証サービスの安全な標準機能を優先して検討します。

### バンド

- `GET /api/bands`: 参加中のバンド一覧
- `POST /api/bands`: バンド作成
- `GET /api/bands/{bandId}`: バンド詳細
- `PATCH /api/bands/{bandId}`: バンド基本情報の更新
- `DELETE /api/bands/{bandId}`: バンドのアーカイブまたは削除

### メンバー / 招待

- `GET /api/bands/{bandId}/members`: メンバー一覧
- `POST /api/bands/{bandId}/invitations`: 招待作成
- `GET /api/invitations/{token}`: 招待内容の安全な確認
- `POST /api/invitations/{token}/accept`: 招待承認
- `POST /api/invitations/{token}/decline`: 招待辞退
- `PATCH /api/bands/{bandId}/members/{memberId}`: ロール変更
- `DELETE /api/bands/{bandId}/members/{memberId}`: メンバー削除または退出

招待トークンの失効、期限、推測耐性、再利用防止を必須要件にします。

### 楽曲 / メモ

- `GET /api/bands/{bandId}/songs`: 楽曲一覧
- `POST /api/bands/{bandId}/songs`: 楽曲作成
- `GET /api/songs/{songId}`: 楽曲詳細
- `PATCH /api/songs/{songId}`: 楽曲更新
- `DELETE /api/songs/{songId}`: 楽曲のアーカイブまたは削除
- `GET /api/songs/{songId}/note`: メモ取得
- `PUT /api/songs/{songId}/note`: メモ作成・更新

### 楽曲バージョン

- `GET /api/songs/{songId}/versions`: バージョン一覧
- `POST /api/songs/{songId}/versions`: バージョン作成
- `GET /api/song-versions/{versionId}`: バージョン詳細
- `PATCH /api/song-versions/{versionId}`: 説明などの更新

### コメント

- `GET /api/songs/{songId}/comments`: コメント一覧
- `POST /api/songs/{songId}/comments`: 通常 / タイムスタンプコメント作成
- `PATCH /api/comments/{commentId}`: 自分のコメント更新など
- `DELETE /api/comments/{commentId}`: コメント削除

作成入力の候補: `body`、`songVersionId`、`timestampMs`、`parentCommentId`。組み合わせと範囲をサーバー側で検証します。

### TODO

- `GET /api/songs/{songId}/tasks`: TODO 一覧
- `POST /api/songs/{songId}/tasks`: TODO 作成
- `GET /api/tasks/{taskId}`: TODO 詳細
- `PATCH /api/tasks/{taskId}`: 担当者、状態、期限などを更新
- `DELETE /api/tasks/{taskId}`: TODO 削除
- `GET /api/me/tasks`: 自分の TODO 一覧

### ファイル

- `GET /api/songs/{songId}/files`: ファイルメタデータ一覧
- `POST /api/songs/{songId}/files/upload-request`: 許可されたアップロード要求を作る
- `POST /api/files/{fileId}/complete`: 完了後の検証を要求する
- `GET /api/files/{fileId}/download`: 権限確認後に短時間有効な取得手段を返す
- `DELETE /api/files/{fileId}`: ファイル削除要求

ファイル API はストレージ方式、容量制限、許可形式、署名 URL、検査、削除、費用対策を設計した後に実装します。

## 応答とエラーの案

- 成功時のデータ形式を機能間で揃える
- 入力エラーは項目ごとに UI が表示できる形式にする
- `401` は未認証、`403` は権限不足、`404` は対象なしを基本候補とする
- 情報漏えいにつながる場合は、権限不足と対象なしの見せ方を統一する
- 競合更新は `409` などで明示する案を検討する
- サーバーエラーには利用者向けメッセージと追跡用 ID を返し、詳細は安全なログに限定する

## 実装前に決めること

- API 方式、URL / 関数命名、バージョニング
- 認証とセッション、CSRF 対策
- ロール別の権限マトリクス
- 入力スキーマ、最大文字数、レート制限
- ページング、検索、並び替え
- 更新競合、冪等性、トランザクション
- キャッシュと再検証
- 監査ログ、監視、アラート
- API テストと権限境界テスト
