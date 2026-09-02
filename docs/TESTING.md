# Testing Strategy

## 文書の位置付け

この文書は、DAW Connect App の自動テストをどこから始め、DB・認証導入後や一般公開前にどう拡張するかを定めます。目的はテスト数やカバレッジ率を増やすことではなく、壊れやすい重要な振る舞いを少ないテストで守り、2 人と Codex が PR を安全に判断できるようにすることです。

2026-09-03 時点ではテストツール、テストコード、CI は未導入です。この文書で構成と優先順位だけを決め、依存追加、設定、テスト実装、GitHub Actions は BRIDGE-008 と BRIDGE-006 の専用 PR で扱います。

## 現在のテスト対象

現在は Next.js App Router と静的モックデータによる UI プロトタイプです。

- 画面: `/`、`/dashboard`、`/bands`、`/bands/[bandId]`、`/bands/[bandId]/songs`、`/songs/[songId]`
- Client Components: 楽曲検索、ステータス絞り込み、0 件状態、TODO 完了切り替え、コメント一時追加
- Server Components: 主要ページ、動的ルート、モックデータの表示、存在しない ID の 404 判定
- 永続化: なし。検索条件、TODO、追加コメントはリロードで初期状態へ戻る
- 未実装: API / Server Actions、DB、認証・認可、ファイル保存、自動テスト、CI

## 推奨構成

| 役割 | 推奨ツール | 主な対象 | 採用理由 | 現在の制約 |
| --- | --- | --- | --- | --- |
| Unit test runner | Vitest | 純粋関数、同期ロジック | TypeScript と相性がよく、watch と 1 回実行を分けやすい。Next.js 公式ガイドに構成例がある | async Server Components の直接テストには使わない |
| Component testing | React Testing Library + jsdom | Client Components の表示と操作 | DOM を利用者と同じ観点で検証し、実装詳細への依存を減らせる | Next.js のルーティング全体やブラウザ固有動作は対象外 |
| E2E testing | Playwright | 主要画面遷移、動的ルート、404、統合された操作 | 実ブラウザで Next.js アプリ全体を確認でき、Chromium / Firefox / WebKit に拡張できる | ブラウザ準備とサーバー起動が必要で Component test より重い |

Jest + React Testing Library も候補ですが、既存テスト資産がない現在は Vitest と役割が重複します。最初から runner を 2 つ持つ利点がないため採用しません。Cypress も E2E 候補ですが、ブラウザ E2E を Playwright に一本化して設定と学習対象を増やさない方針です。

Next.js の公式ガイドは、Vitest と React Testing Library を Unit testing に併用できる一方、async Server Components は E2E で確認することを推奨しています。現在の動的ページは async Server Components のため、この境界を守ります。

## テストを書く原則

- 利用者から見える振る舞いを、role、label、表示名、URL で確認する
- CSS class、コンポーネント内部 state、実装上の関数呼び出し回数を固定しない
- `data-testid` は role や label で特定できない場合だけ使う
- 大きな DOM snapshot を基本にせず、守る理由が明確な値だけを検証する
- 1 テストは 1 つの利用者シナリオに集中し、他テストの実行順に依存させない
- モックの日付、件数、文言を必要以上に固定せず、重要な意味と状態変化を確認する
- PR のテストから本番、外部 API、実ユーザーデータへ接続しない
- flaky test は再実行で隠さず、原因を調査する。修正まで隔離する場合は Issue と期限を残す
- 初期段階ではカバレッジ率を merge 条件にしない。重要シナリオが守られているかを優先する

## Level 1 — 今すぐ

mock UI の現在に合わせ、速い Component test と少数の E2E smoke test に限定します。

### Unit / Component test

BRIDGE-008 で最初に実装する順序です。

1. `SongFilterPanel`
   - 初期状態ですべての楽曲と件数を表示する
   - 前後空白と大文字・小文字を吸収して楽曲名を検索する
   - ステータス単独、および検索との組み合わせで絞り込む
   - 0 件状態を表示し、リセットで全件表示へ戻る
2. `TaskChecklist`
   - モックの初期完了状態と未完了件数を表示する
   - checkbox 操作で `aria-checked`、表示状態、未完了件数が切り替わる
   - 再操作で初期相当の状態へ戻る
3. `MockCommentComposer`
   - 空入力では追加ボタンを有効にしない
   - 本文と任意タイムスタンプを一時表示する
   - 追加後に入力欄を空にし、保存・送信されていない案内を表示する

`src/lib/mock-data.ts` の固定配列そのものや、単純な getter を網羅的にテストしません。分岐や変換ロジックが増えた時点で、その振る舞いに対する Unit test を追加します。

### E2E smoke test

PR ごとは Chromium 1 種類に絞り、次を守ります。

1. トップからダッシュボード、バンド一覧、Lumen Echo 詳細、楽曲一覧、Afterglow 詳細へ移動できる
2. 各画面で代表的な見出しと URL が一致する
3. 存在しない band ID と song ID が 404 になる
4. 楽曲詳細で TODO とコメントを操作でき、リロード後にモック初期状態へ戻る

Component test と E2E で同じ細部を二重に検証しません。Component test は入力ごとの分岐、E2E はルーティングと代表的な統合フローを担当します。

## Level 2 — DB / 認証導入時

API、Server Actions、DB、認証・認可、ファイル保存を採用した機能だけに追加します。採用方式はこの文書では決めません。

- 入力検証、状態遷移、権限判定などのドメインロジックを Unit test する
- API / Server Actions の成功、入力エラー、対象なし、競合、再送を Integration test する
- 本番と分離した使い捨てテスト DB で作成・更新・削除・制約・トランザクションを確認する
- 未ログイン、所属外バンド、権限不足、招待期限切れを必ず拒否することを確認する
- 保存後の再読込、別セッションからの参照、同時更新時の挙動を確認する
- ファイル保存は adapter 境界を Unit / Integration test し、許可形式、容量、削除、失敗時を確認する
- E2E では最小のログイン、バンド参加、楽曲・コメント・TODO の永続化フローを確認する
- テストから本番 DB、本番ストレージ、実メール、実決済へ接続しない

権限テストは正常系より優先します。URL や ID を変えて他バンドのデータへアクセスできないことを、API / Server Action と E2E の両方で確認します。

## Level 3 — 一般公開前

- 本番相当環境で主要ユーザーフローを E2E 確認する
- Chromium、Firefox、WebKit の主要ブラウザ構成で full E2E を実行する
- PC と主要モバイル viewport でナビゲーション、横スクロール、タップ操作を確認する
- 自動アクセシビリティ検査に加え、キーボード、フォーカス順、読み上げを手動確認する
- 認証失効、他バンドへのアクセス拒否、退会、メンバー削除、招待期限切れを確認する
- 通信失敗、タイムアウト、再試行、競合、二重送信時の利用者向け表示を確認する
- ファイルの許可形式、容量超過、中断、取得、削除、権限切れ URL を確認する
- マイグレーション、バックアップ復旧、ロールバックを本番と分離した環境で確認する
- 必要性が確認できた画面だけ visual regression を導入する

## PR ごとの必須チェック

### BRIDGE-006 導入直後

テストツールがまだない段階では、GitHub Actions で次を必須にします。

1. `npm ci`
2. `npm run lint`
3. `npm run build`

CI では標準の `npm run build` を使用します。Codex 実行環境固有の Turbopack `EPERM` 回避で使う `npm run build -- --webpack` を、CI の既定へ無条件に持ち込みません。

### BRIDGE-008 完了後

次を PR の必須チェックへ追加します。実際の script 名は BRIDGE-008 で `package.json` に追加し、README とこの文書へ反映します。

4. Vitest の Unit / Component test を watch なしで 1 回実行する
5. production build を起動し、Playwright の Chromium smoke test を実行する

最初は 1 つの分かりやすい CI job で順番に実行し、所要時間が問題になった場合だけ job 分割やキャッシュを検討します。ブラウザは E2E の直前に Chromium だけを準備し、失敗時は Playwright trace とスクリーンショットを artifact として残します。

## 毎回実行しない重い確認

次は手動実行、定期実行、リリース前、または関連領域を変更した PR に限定します。

- Playwright の Chromium / Firefox / WebKit 全ブラウザ実行
- 複数の PC / モバイル viewport の全組み合わせ
- visual regression と画像 artifact の比較
- カバレッジ計測とレポート生成
- 大量データ、長時間、並行操作、性能、負荷の確認
- Level 2 の DB・認証・ファイルを含む full integration suite

## BRIDGE-006 への引き継ぎ

- GitHub Actions は最初に `npm ci`、lint、build だけを導入する
- Node.js の CI バージョンを明示し、ローカルの要件と一致させる
- workflow へ秘密情報や本番接続を追加しない
- timeout と同一ブランチの古い実行キャンセルを設定する
- BRIDGE-008 後に Unit / Component と Chromium smoke E2E を必須チェックへ追加する
- full browser matrix は定期または手動 workflow として分離する

## BRIDGE-008 への引き継ぎ

- 導入時点で Next.js `16.3.x`、React `19.2.x`、採用 Node.js と互換性のある版を公式資料から確認する
- Vitest、React Testing Library、jsdom、利用者操作用 helper を 1 つの専用 PR で追加する
- Playwright と Chromium を同じ専用 PR で追加し、最小 smoke test だけを作る
- 最初の Component test は `SongFilterPanel`、次に `TaskChecklist`、`MockCommentComposer` の順にする
- 最初の E2E は主要画面遷移、404、非永続状態のリロード確認に限定する
- watch 用と CI の 1 回実行用 script を分ける
- package と lockfile の差分、install script、ライセンス、実行時間をレビューする

## 見直し条件

- API / Server Actions、DB、認証・認可、ファイル保存のいずれかを導入するとき
- test suite が PR の待ち時間や flaky failure の主因になったとき
- Next.js、React、Node.js、テストツールの major version を更新するとき
- β版または一般公開の準備を始めるとき

## 参考資料

- [Next.js: Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [Next.js: Playwright](https://nextjs.org/docs/app/guides/testing/playwright)
- [Vitest Guide](https://vitest.dev/guide/)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles/)
- [Playwright: Web server](https://playwright.dev/docs/test-webserver)
- [Playwright: Continuous Integration](https://playwright.dev/docs/ci)
