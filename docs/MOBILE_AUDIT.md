# Mobile UI Audit

## 概要

SURFACE-015では、現在のmock UIを変更せず、主要画面のモバイル表示をPlaywrightの自動計測とスクリーンショットで確認しました。

- 実施日: 2026-09-03
- Viewport: `320 × 568`（追加の狭幅確認）、`375 × 812`、`390 × 844`、`768 × 1024`
- 監査ケース: 8画面・状態 × 4 viewport = 32ケース
- レイアウト結果: 31 PASS / 1 ISSUE
- ユニーク指摘: High 0 / Medium 0 / Low 3
- ページ全体の横overflow: なし
- 予期しないconsole error / page error: なし
- コード変更: なし

## 方法

各ケースで次を確認しました。

- `document.documentElement.scrollWidth > window.innerWidth`によるページ全体の横overflow
- 操作要素のviewport外へのはみ出し
- 44px未満の操作領域
- console errorとpage error
- ナビゲーション、カード、折返し、フォーム、TODO、コメント、タイムスタンプ、ファイル情報、空状態、404のスクリーンショット目視

404への遷移時には、意図したHTTP 404に対するブラウザの`Failed to load resource: 404`が記録されました。これは対象画面の期待動作であり、アプリの予期しないconsole errorには数えていません。

## 画面別結果

| 画面 / 状態 | 320 × 568 | 375 × 812 | 390 × 844 | 768 × 1024 | 確認結果 |
| --- | --- | --- | --- | --- | --- |
| `/` | PASS | PASS | PASS | PASS | 見出し、CTA、カード、footerが折り返し、横overflowなし |
| `/dashboard` | PASS | PASS | PASS | PASS | カード、TODO、最近の動きが1列またはgridへ自然に変化 |
| `/bands` | PASS | PASS | PASS | PASS | バンドカード、楽曲pill、メンバー表示に横overflowなし |
| `/bands/lumen-echo` | PASS | PASS | PASS | PASS | CTAは320pxで縦方向へ折り返し、カード幅・本文とも正常 |
| `/bands/lumen-echo/songs` | PASS | PASS | PASS | PASS | 検索input、status filter、楽曲カードがviewport内に収まる |
| `/songs/afterglow` | ISSUE-002 | PASS | PASS | PASS | 320pxのみセクションナビの最終タブが部分表示。それ以外のTODO、コメント、timestamp、ファイルは正常 |
| 検索0件状態 | PASS | PASS | PASS | PASS | input、reset、空状態カードに見切れなし |
| `/songs/not-a-song`（404） | PASS | PASS | PASS | PASS | レイアウト崩れなし。案内内容はISSUE-003 |

## 指摘

### ISSUE-001 — 一部のタップ領域が44px未満

- Severity: Low
- 対象: 全体ナビゲーション、パンくず、カード内リンク、楽曲詳細セクションナビ
- 問題: 自動計測で、高さ16pxのパンくずリンク、34pxの上部ナビゲーション、37〜40pxのカード内リンクなどを確認した。操作不能ではなく、ページ全体のoverflowもないが、狭い画面では押し間違いの余地がある。
- 再現方法: 375px幅で各workspace画面を開き、リンク・ボタンのbounding boxを確認する。
- 推奨修正: 主要操作は`min-height`とpaddingで44px程度を確保する。インラインのパンくずは隣接要素との間隔またはリンク自身の上下paddingを増やす。
- 修正対象候補: `src/components/app-shell.tsx`、`src/components/song-card.tsx`、`src/app/(workspace)/bands/[bandId]/page.tsx`、`src/app/(workspace)/bands/[bandId]/songs/page.tsx`、`src/app/(workspace)/songs/[songId]/page.tsx`

### ISSUE-002 — 320pxで楽曲詳細セクションナビの最終項目が部分表示

- Severity: Low
- 対象: `/songs/afterglow`
- 問題: 320px幅では「ファイル 3」の右端がviewport外になり、横スクロールしないと全体を読めない。ページ全体の横overflowはなく、`overflow-x-auto`の領域内だけで発生する。375px以上では全項目を表示できる。
- 再現方法: `320 × 568`で楽曲詳細を開き、メインカード直下のセクションナビを確認する。
- 推奨修正: 320pxでは2行に折り返す、タブ間隔を詰める、または横スクロール可能であることを視覚的に示す。
- 修正対象候補: `src/app/(workspace)/songs/[songId]/page.tsx`

### ISSUE-003 — 404が標準英語表示で復帰案内が弱い

- Severity: Low
- 対象: 存在しないband / song
- 問題: レイアウトは崩れないが、本文が`This page could not be found.`の英語表示で、アプリ固有の説明や一覧へ戻るCTAがない。共通ヘッダーからは移動できる。
- 再現方法: `/songs/not-a-song`または`/bands/not-a-band`を開く。
- 推奨修正: 日本語の説明とダッシュボード / バンド一覧へ戻る導線を持つApp Routerのcustom 404を追加する。
- 修正対象候補: `src/app/not-found.tsx`

## その他の確認結果

- input / select: 検索inputとstatus filterは320pxを含めて収まり、適切に折り返す。
- TODO / コメント / timestamp: 320pxでも入力欄・checkbox・本文は見切れず、縦方向に配置される。
- ファイル情報: ファイル名、種類、version、更新情報は320pxでカード内に収まる。
- sticky / fixed UI: コンテンツへ重なる固定要素はない。workspaceナビゲーションは画面上部の通常フローにある。
- 画面下部: full-page screenshotでfooterまたは最終カードまで確認し、見切れなし。
- 長い楽曲名: 現在のmock dataに極端に長いタイトルがないため、通常のタイトル折返しのみ確認した。長文fixtureによる境界確認は修正タスク側で必要性を判断する。

## Screenshots

32枚をローカル一時成果物として`.next/mobile-audit/<viewport>/<screen>.png`へ保存しました。Git履歴には追加しません。

- 画面: `home`、`dashboard`、`bands`、`band-detail`、`band-songs`、`song-detail`、`empty-state`、`not-found`
- Viewport directory: `320x568`、`375x812`、`390x844`、`768x1024`

## Recommended Fix Tasks

1. `SURFACE-015A` — モバイルのタップ領域を調整する
   - ISSUE-001を対象に、共通ナビゲーションと頻出リンクから小さく修正する。
2. `SURFACE-015B` — 320pxの楽曲詳細セクションナビを改善する
   - ISSUE-002だけを対象に、折返しまたはスクロールの見せ方を決める。
3. `SURFACE-015C` — モバイルでも復帰しやすいcustom 404を追加する
   - ISSUE-003を対象に、日本語案内と既存画面への導線を追加する。

3件はいずれもLowで、現在の主要操作を妨げるHigh / Mediumの問題は確認していません。監査PRでは修正せず、必要なものを独立タスクとしてレビュー後に着手します。
