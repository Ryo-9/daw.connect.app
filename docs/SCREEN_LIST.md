# Screen List

画面名と役割を整理した初期案です。Phase 1 ではモックデータによる UI プロトタイプを優先し、認証、招待、ファイル保存などの実処理は専用タスクで検討します。

## UI プロトタイプ 001 実装状況

2026-09-06 時点で、次の導線をモックデータだけで確認できます。楽曲作成・編集は画面内previewまで操作でき、投稿・uploadは表示確認のみです。いずれもデータは保存されません。

| 画面 | URL 例 | 状態 |
| --- | --- | --- |
| トップページ | `/` | 実装済み |
| ダッシュボード | `/dashboard` | 実装済み |
| バンド一覧 | `/bands` | 実装済み |
| バンド詳細 | `/bands/lumen-echo` | 実装済み |
| 楽曲一覧 | `/bands/lumen-echo/songs` | 実装済み |
| 楽曲詳細 | `/songs/afterglow` | 実装済み |
| Preview review | `/songs/afterglow#preview` | Waveform visual mock。音声再生・解析なし |
| MIDI Proposal review | `/songs/afterglow#proposal` | Originalと別案を分離したvisual mock |
| Review Decision | `/songs/afterglow#decision` | Accept / Partial / Hold / Rejectの無効button表示のみ |
| Version handoff | `/songs/afterglow#version` | DAW反映後に次Versionを共有する説明。自動作成なし |
| 楽曲作成 | `/bands/lumen-echo/songs/new` | Phase 1非保存フォーム。画面内previewのみ |
| 楽曲編集 | `/songs/afterglow/edit` | Phase 1非保存フォーム。元mock dataは変更しない |
| 楽曲メモ | `/songs/afterglow#memo` | 楽曲詳細内に表示 |
| パート別 TODO | `/songs/afterglow#tasks` | 現行mock。将来のCreative Board / Task contractは未実装 |
| コメント / タイムスタンプ | `/songs/afterglow#comments` | 楽曲詳細内に表示 |
| ファイル共有 | `/songs/afterglow#files` | 楽曲詳細内に表示。保存処理なし |

## 公開・導入画面

### 1. ランディングページ

- アプリの目的と主な機能を伝える
- ログイン / アカウント作成への入口を置く
- 初期優先度: 高

### 2. ログイン画面

- メールアドレスなどでログインする想定の画面
- パスワード再設定や外部認証は方式決定後に追加する
- 初期優先度: 中（Phase 1 は見た目のみ）

### 3. アカウント作成画面

- 新規ユーザー登録を開始する想定の画面
- 利用規約・プライバシーポリシーへの同意導線を置く
- 初期優先度: 中（Phase 1 は見た目のみ）

### 4. 招待受け取り画面

- 招待されたバンドと招待者を確認し、参加 / 辞退する
- 未ログイン時の導線は認証方式と一緒に設計する
- 初期優先度: 中（実装は高リスク領域の判断後）

## アプリ共通画面

### 5. ダッシュボード

- 参加中のバンド、最近更新された楽曲、自分の TODO をまとめて表示する
- 初期優先度: 高

### 6. 通知一覧

- メンション、コメント、招待、TODO 更新を確認する将来画面
- 初期優先度: 低

### 7. 設定画面

- プロフィール、表示、通知、アカウント管理を行う想定
- 危険な操作は確認画面と再認証を検討する
- 初期優先度: 低〜中

## バンド画面

### 8. バンド一覧

- 参加しているバンドを一覧表示する
- バンド作成への入口を置く
- 初期優先度: 高

### 9. バンド作成画面

- バンド名、説明、画像などの基本情報を入力する
- 初期優先度: 高

### 10. バンド詳細

- バンド概要、最近の楽曲、メンバー、進行中 TODO を表示する
- 楽曲一覧やメンバー管理への入口になる
- 初期優先度: 高

### 11. バンドメンバー・招待画面

- メンバー一覧と招待状況を確認する
- 招待、削除、役割変更は権限設計後に実装する
- 初期優先度: 中（Phase 1 は見た目のみ）

## 楽曲画面

### 12. 楽曲一覧

- バンド内の楽曲を状態、更新日などで一覧表示する
- 検索、絞り込み、並び替えは段階的に追加する
- 初期優先度: 高

### 13. 楽曲作成・編集画面

- タイトル、バンド、状態、BPM、拍子、キー、DAW、バージョン、メモ、担当パートを入力する
- Phase 1では入力内容を同じ画面のreview previewへ反映するだけで、保存・通信・ファイル選択は行わない
- 作成は `/bands/[bandId]/songs/new`、編集は `/songs/[songId]/edit` から確認する
- 初期優先度: 高

### 14. 楽曲詳細

- 楽曲概要、メモ、最新バージョン、コメント、TODO をまとめる
- Preview → Comment → MIDI Proposal → Decision → Versionを一つの制作review flowとして示し、各stepから既存sectionへ移動できる
- CommentはVersion / bar / beat / time / trackの文脈を表示し、Original MIDIとProposalは別データとして明示する
- DecisionはPhase 1の無効なmock操作で、DAW自動反映やVersion自動作成を行わない
- 将来はCreative BoardでMemo / Idea / Taskを同じsurfaceに置き、過去Version由来の未対応itemをCurrent Songから任意に確認できる
- Anchor markerとFocus Modeはuser-controlledな表示候補で、playback停止、modal、Version作成blockを行わない
- モバイルでは情報をタブまたはセクションで整理する
- 初期優先度: 高

### 15. 楽曲メモ画面

- 制作方針、歌詞案、コード、録音メモなどを閲覧・編集する
- 同時編集は MVP 対象外
- 初期優先度: 高

### 16. コメント画面

- 楽曲への通常コメントと返信を時系列で表示する
- 投稿、編集、削除の権限は別途定義する
- 初期優先度: 高

### 17. タイムスタンプコメント画面

- 音源の再生時刻に紐付いたコメントを表示・追加する
- Phase 1 では時刻入力とモック音源で体験を検証する
- 初期優先度: 高

### 18. Creative Board / 軽量Task画面

- Memo / Idea / Taskを同じ制作ボードで軽く区別し、すべて / 種類 / 要対応をfilterする
- Taskは任意のsingle assignee、important、calendar due date、Anchorを持てるが、未完了でも制作をblockしない
- CommentからTaskへlinkでき、Version originと任意のcurrent targetを分けて表示する
- Timeline annotationを隠すFocus Modeを選べるが、dataを削除せずsystemが自動で切り替えない
- Exact route / component / persistenceは未実装で、現行`#tasks` mockをこのtaskでは変更しない
- 初期優先度: 高

### 19. ファイル一覧・共有画面

- 音源、MIDI、画像などを種類とバージョンごとに表示する
- 実アップロード、保存、ダウンロードは保存方式決定後に実装する
- 初期優先度: 中（Phase 1 は見た目のみ）

### 20. バージョン履歴画面

- 楽曲バージョン、作成者、日時、説明、関連ファイルを表示する
- 自動差分や復元は将来検討とする
- 初期優先度: 中

## 共通状態

各主要画面では、通常表示だけでなく次の状態も設計します。

- 読み込み中
- データがない状態と最初の操作への案内
- 入力エラー
- 通信 / 読み込みエラーと再試行
- 権限がない状態
- ページが見つからない状態

## UI 操作プロトタイプで確認できる状態

`ui-interaction-prototype-001` では、保存や通信を行わず次の操作感を確認できます。

- 楽曲一覧: 楽曲名の検索、ステータス絞り込み、0 件時の空状態、条件リセット
- 楽曲詳細: コメントと任意タイムスタンプの入力、一時コメントの画面内表示
- 楽曲詳細: パート別 TODO の完了 / 未完了切り替えと未完了件数の更新
- 共通: 「MOCK UI・保存されません」の表示、未実装ボタンの理由、キーボードフォーカス

検索条件、コメント、TODO の変更はブラウザ内の一時状態だけで、リロードすると初期状態に戻ります。URL クエリ、DB、API、ブラウザストレージは使用しません。
