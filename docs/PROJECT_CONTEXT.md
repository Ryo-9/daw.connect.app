# StreamBand Project Context

## この文書の役割

この文書は、StreamBandで変えてはいけないプロダクト前提と、現在の開発フェーズ、UIの方向性を短時間で共有するための入口です。人間とCodexは、タスク開始時にこの文書と [AI_DELEGATION.md](AI_DELEGATION.md) を読み、長い仕様を推測で補わないでください。

実装済みかどうかは実コード、`package.json`、[ARCHITECTURE.md](ARCHITECTURE.md)を優先します。承認済みの判断は[DECISION_LOG.md](DECISION_LOG.md)、作業状態は[ACTIVE_TASKS.md](ACTIVE_TASKS.md)と[LOCKS.md](LOCKS.md)を正とします。文書間に矛盾がある場合は、都合のよい解釈で実装せず、差異を報告して確認します。

## 名前

- プロダクト名: **StreamBand**
- GitHub repository: `Ryo-9/daw.connect.app`
- ローカルpackage名と現行UIには、旧称の`DAW Connect App`が残っている
- 旧称の一括置換やbranding変更は本タスクに含めず、必要なら独立したSurfaceタスクで行う

## プロダクトの核

StreamBandは、バンドや小規模な音楽制作チームが、DAWの外側で共同制作情報を整理するためのWebアプリです。DAWを置き換える製品ではなく、DAWで行う制作にメモ、会話、担当、ファイル情報を結び付ける外付け型の共同作曲支援を目指します。

中心となる情報階層は次のとおりです。

1. バンド / 制作チーム
2. 楽曲
3. 楽曲に紐づくメモ、コメント、タイムスタンプ、TODO、ファイル、バージョン情報

価値判断では、機能数より次を優先します。

- 目的の楽曲と最新情報へ迷わず到達できる
- 決まったこと、会話、次の担当を混同せず整理できる
- DAWや制作環境が異なるメンバーでも共有できる
- スマートフォンから閲覧と主要操作を行いやすい
- 元の制作物を壊さず、変更の由来を追える

## 現在のフェーズ

現在は **Phase 1: Local Prototype** です。Next.jsのローカルWeb UIと、静的mock dataを使った非永続インタラクションまでを検証します。

### 実装済み

- Next.js App Routerによる`/`、`/dashboard`、`/bands`、`/bands/[bandId]`、`/bands/[bandId]/songs`、`/songs/[songId]`
- 共通レスポンシブナビゲーション
- バンド、楽曲、メモ、コメント、タイムスタンプ、TODO、ファイル情報のmock表示
- 楽曲名検索、ステータス絞り込み、検索0件状態
- コメントの一時追加とTODO完了状態の一時切り替え
- 動的routeと存在しないIDの404
- 基本アクセシビリティ、モバイル監査、主要タップ領域の調整
- lint、build、Component test、Chromium smoke E2Eを実行するPR CI

### 現在の制約

- データ源は`src/lib/mock-data.ts`
- 変更は画面内の一時stateだけで、reloadすると消える
- API、Server Actions、DB、browser storageによる永続化はない
- 認証、認可、招待の実処理はない
- ファイルのupload、保存、downloadはない
- AWS、S3、Stripe、本番deploymentはない
- Companion AppとBridge Pluginの本実装はない

見た目だけ存在する操作を、保存済み、送信済み、連携済みと説明してはいけません。

## Phase 1のUI方向性

現在のUIは、音声編集画面ではなく「制作状況を集中して確認できるworkspace」を目指します。VISUAL-001以降は、PCを主対象とする制作支援toolとして、次を保ちます。

- 情報階層: バンドから楽曲へ進み、楽曲詳細に関連情報を集約する
- 視覚: 黒〜濃紺のcanvasとpanel、紫のprimary accent、青の進捗・情報accentを基調にする
- 雰囲気: DAWを置き換える編集画面ではなく、DAWの外側で使うprofessionalな制作toolとして見せる
- 質感: 微細なgrid、insetのcontrol、segment meter、硬質なedgeを控えめに使い、機材操作盤らしさを出す。サイバーゲーム風の過剰な発光や装飾は避ける
- 密度: PCでは一覧性と作業toolらしい密度を優先し、細い境界線、階層化したpanel、抑えたshadowで情報のまとまりを示す
- 状態: mock、未保存、未実装、処理不可を利用者へ明示する
- Responsive: PCを主対象にしつつ、320pxを含む狭幅でpage全体の横overflowを作らず、主要操作はおおむね44pxのtap領域を確保する
- Accessibility: semantic HTML、見出し順、label、keyboard focus、十分なcontrastを崩さない
- 変更単位: 全画面の再設計を一度に行わず、監査issueやユーザーフロー単位で小さく変更する

新しいUI案は、既存の使い方を壊す場合、先に目的と移行範囲をレビューします。VISUAL-001は情報構造と機能を変えず、visual foundationだけを同期する専用タスクです。以後も好みだけを理由にnavigation再編やcomponent再生成を行いません。

## DAWと制作ファイルの境界

- 音声録音、MIDI編集、mix、plugin処理、音色の最終決定はDAW側の責務とする
- StreamBand側でDAW固有の音色、plugin chain、完全な再生結果を再現できると表現しない
- StreamBandは、制作物そのものよりも、版、説明、feedback、担当、参照関係を扱う
- DAW直接連携、Companion App、Bridge Pluginは将来候補であり、採用済みでも実装予定確定でもない
- 外部連携を検討する際は、対象DAW、権限、通信、失敗時動作、version互換、rollbackを別タスクで決める

## MIDI Proposalの非破壊原則

MIDI Proposalは将来候補で、Phase 1には実装しません。将来検討する場合も、次を必須前提とします。

- 元MIDIを直接上書きしない
- 提案は元データと区別できる別file、別version、または差分として作る
- 元version、提案者または生成元、作成日時、対象範囲を追跡できるようにする
- 採用、DAWへのimport、置換は利用者が明示的に選ぶ
- 取消と比較ができない不可逆処理を自動実行しない
- DAW音色をStreamBand側で再現できることをproposalの前提にしない

この原則は、AI生成に限らず、人が作るMIDI案やBridge連携にも適用します。

## 現在行わないこと

明示的な専用タスク、比較、承認がない限り、次へ着手しません。

- DB、schema、migration、実データ投入
- API、Server Actions、認証、認可、招待
- AWS、S3、cloud resource、production deployment
- Stripe、課金、契約、請求
- 実file uploadや公開URL
- Companion App、Bridge Plugin、DAW直接操作
- AIによる作曲、編曲、演奏の自動生成
- 元MIDIや音源への自動上書き

将来候補を文書化するときも、「採用済み」「実装済み」「日程確定」と書かず、候補、未決定、未実装を区別します。

## タスク開始時の読み順

1. `AGENTS.md`
2. この文書
3. [AI_DELEGATION.md](AI_DELEGATION.md)
4. [ACTIVE_TASKS.md](ACTIVE_TASKS.md)と[LOCKS.md](LOCKS.md)
5. [TASK_QUEUE.md](TASK_QUEUE.md)と対象領域の文書
6. 実コード、設定、tests

タスク依頼には、この共通前提を繰り返す代わりに、Task ID、今回の目的、変更可能範囲、禁止範囲、完了条件、PR後に停止するかを記載します。

## 関連文書

- 詳細なプロダクト仕様: [PRODUCT_SPEC.md](PRODUCT_SPEC.md)
- 画面と導線: [SCREEN_LIST.md](SCREEN_LIST.md)、[USER_FLOW.md](USER_FLOW.md)
- 実装構成: [ARCHITECTURE.md](ARCHITECTURE.md)
- 開発判断: [DECISION_LOG.md](DECISION_LOG.md)
- セキュリティ: [SECURITY.md](SECURITY.md)
- テストとCI: [TESTING.md](TESTING.md)
- main保護: [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)
