# Product Spec

## プロダクト概要

DAW Connect App は、バンドや音楽制作チームが DAW の外側で共同制作に必要な情報を整理する Web アプリです。音源制作そのものではなく、曲ごとの相談、進捗、素材、判断の共有を支えます。

## 解決する課題

- 楽曲のメモやフィードバックがチャットに流れ、後から見つけにくい
- 「何分何秒の箇所か」が伝わりづらく、修正対象の認識がずれる
- パートごとの担当と期限が曖昧になり、作業状況が分からない
- 音源や MIDI の最新版が分からなくなる
- 複数の曲を同時に制作すると、情報とファイルの対応関係が崩れやすい
- PC を開けない場面で、スマートフォンから確認・返信しにくい

## 想定ユーザー

### 主なユーザー

- 2〜10 人程度のバンドメンバー
- 作曲、編曲、録音、ミックスを分担する小規模な音楽制作チーム
- DAW の種類や利用環境が異なるメンバー同士で制作する人

### 利用場面

- リハーサル後に楽曲ごとの修正点を記録する
- デモ音源を聞き、特定の時間にコメントする
- ギター、ボーカル、ドラムなどパート別に TODO を割り当てる
- 新しい音源や MIDI がどの版かを確認する

## MVP の目的

共同制作の情報を「バンド → 楽曲」の単位に整理し、メンバーが迷わず確認・更新できる基本体験を検証します。DAW 連携や高度な同期よりも、少人数チームの日常的な制作を邪魔せず支えられることを優先します。

MVP の成功判断では、少なくとも次を確認します。

- メンバーが目的の楽曲と最新情報に迷わず到達できる
- メモ、コメント、TODO の置き場所が明確である
- タイムスタンプコメントによって修正箇所を共有できる
- スマートフォンでも主要情報の閲覧と基本操作ができる

## 創作を管理せず、創作を支える

StreamBandはproject management appではありません。作者やBand memberの「こうしたい」「試してみたい」「今はこれが良いと思う」「後で考え直したい」という創作意図を記録・共有し、制作上の負荷を減らし、見えづらい制作の歩みを可視化する補助appです。音楽上の判断は感性やその時の気持ちで変わり得るため、systemが正しい制作手順や完了を強制しません。

- 未完了Taskや未確認Commentを理由にSong / SongVersionの作成をblockしない
- Task完了率をproductivity scoreとして扱わず、義務を強調する表示をprimary UXにしない
- Memo / Idea / Taskは直接作成でき、相互に変更できる。Taskも完了後のreopenや「不要にする」を許す
- 過去VersionのComment / AnchorはそのVersionの履歴として残し、新Versionへ自動remapしない
- 過去Version由来の未対応項目はCurrent Songから横断確認できるが、確認や処理を強制しない
- notificationやcreative itemの到着でplaybackを止めたり、modalを自動表示したり、autosave等でeditingをblockしたりしない
- creative metadataは必要な時だけ前面へ出し、music / compositionそのものを常にprimaryとする

### Creative item

ユーザー向けのcreative itemは次の3種類に絞ります。これは順序ではなく、その時点での意図の明確さを表すため、どこからでも作成・相互変更できます。

| 種類 | 意味 | 例 |
| --- | --- | --- |
| Memo | 提案・思いつきの段階で、具体化も実行判断もしていない | ラスサビ、何か変化が欲しい |
| Idea | ある程度具体化したが、実行は確定していない | ラスサビだけ3度上のハモりを追加する案 |
| Task | 実際にやると決めたこと | ラスサビのハモりを作成する |

一般的な`Proposal`を第四のcreative stateにはしません。既存のMIDI Proposalは、実際に再生・比較できる別MIDI Asset / proposal dataであり、Ideaとは別conceptです。Rejectしても関連Ideaを自動削除せず、SOURCE_MIDIを上書きせず、DecisionからVersionを自動生成しません。

### 軽量Taskと制作の歩み

- Task stateはユーザー向けに`未対応 / 対応中 / 完了`、内部候補を`OPEN / IN_PROGRESS / DONE / CANCELED`とする。`CANCELED`の表示は「不要にする」を推奨する
- assigneeは任意の1人だけ。未指定はBand共有、離脱時はTaskを残してassigneeなしへ戻す候補とする
- priorityは`normal / important`の2段階で、通常は表示を強めずimportantだけを軽く強調する
- due dateは任意の日付で、defaultは期限なし。期限超過は表示してもstateを自動変更せず、制作をblockしない
- DONEは別member approvalなしで設定でき、いつでもreopenできる。必要な確認はComment / mention / review requestを使う
- primary progress表示は完了率ではなく、Current Version、最近変わったこと、考えていること、制作中の内容を示す

Taskのhard delete / tombstone、completion metadata、assignee離脱処理、Memo / Idea / Taskの物理保存形式は実装前のdata / authorization gateで決めます。

## Band participationとNotification

Band MembershipのRole / stateとActivity Statusを分離します。Roleは`Owner / Admin / Editor / Commenter / Guest`のauthorization capability、Activity StatusはBand内で現在の参加状況を伝えるinformational profile metadataです。

Activity Statusのuser-facing候補は`通常参加 / 活動休止中 / 参加頻度低め / サポート参加`です。本人が変更してもRole、permission、Band access、ACTIVE Membership、Task assignment、Notification presetをsystemが自動変更しません。活動率、稼働率、ranking、inactivity penaltyには使いません。

### Leave / remove

- Admin / Editor / Commenter / Guestは確認後に自分でBandを退出でき、routine leaveに毎回step-up authenticationを要求しない
- Ownerは必要なACTIVE Ownerを残さず退出できない。最後のOwnerにはdedicated ownership transferを案内し、transferだけをsensitive step-up対象として維持する
- OwnerはAdmin / Editor / Commenter / Guest、AdminはEditor / Commenter / Guestをremoveできる。AdminはOwner / peer Adminをremoveできず、Editor以下はremoveできない
- Leave / remove成功後はMembershipを`REMOVED`とし、次のprotected requestからold URLを含めてdenyする。Cognito / StreamBand accountと共同制作履歴は削除しない
- 本人は自力で再参加できず、新しいinvitationが必要。Historical attributionはAUTH-001のFormer member / PII contractに従う

### Notification principle

Notificationは制作を急かす仕組みではなく、見逃したくない重要事項を届け、元の制作contextへ戻るための補助です。Playbackを止めず、modalを強制表示せず、Task消化を繰り返し促しません。RoleやActivity Statusから通知量を強制しません。

- presetは`集中 / 標準 / すべて`。Preferenceのinitial bundleであり、authorizationではなく本人が変更できる
- ordinary eventは必要に応じて`リアルタイム / 1時間まとめ / 1日まとめ / OFF`を選べる候補とする
- security notificationはordinary collaboration通知と分離し、presetでOFFにせず、即時・Quiet Hours bypass候補とする
- Quiet Hoursではordinary push / emailをhold / digest候補にするが、in-app historyは記録できる
- Notification Centerは`要対応 / 未読 / すべて`。要対応はsource stateから導く制作context shortcutで、productivity scoreではない
- Notificationはsource dataではない。Read / expiry / deleteでComment、Task、Idea、Memo、Version、Proposal、Invitation、Membership eventを変更しない
- ordinary notification retentionは初期90日。Security notification / Audit retentionは別contractとする
- deep link先では毎回canonical sourceとstrong ACTIVE BandMembershipを再検証し、notification所有をBand access proofにしない

Delivery channel / provider、event matrix、digest、physical persistence、mobile push、security retentionは実装前の専用gateで決めます。

## 主要機能

1. バンドワークスペース
   - バンドごとにメンバー、楽曲、活動情報をまとめる
2. 楽曲管理
   - 楽曲一覧、楽曲詳細、ステータス、基本情報を扱う
3. 楽曲メモ
   - 方向性、コード、歌詞案、録音メモなどを楽曲に紐付ける
4. コメント
   - 楽曲単位の意見交換と履歴確認を行う
5. タイムスタンプコメント
   - 音源上の時刻とコメントを対応付ける
6. Creative Board / 軽量Task
   - Memo / Idea / Taskを同じ場所で扱い、必要な場合だけ担当、状態、期限を添える
7. ファイル共有の準備
   - MIDI / 音源の表示、分類、アップロード導線を設計する
8. バージョン管理の準備
   - 楽曲バージョンと関連ファイルを区別できる構造を設計する
9. レスポンシブ UI
   - PC とスマートフォンで情報を読みやすくする

## MVP で優先しない機能

- DAW プラグインや DAW プロジェクトとの直接連携
- 波形の高度な編集、MIDI 編集、リアルタイム同期
- リアルタイム共同編集、音声・ビデオ通話
- AI による作曲・編曲・演奏の提案や自動生成
- 公開コミュニティ、SNS、楽曲配信
- 高度な通知設定、分析ダッシュボード
- 本番認証、本番 AWS 構築、本番 S3 アップロード
- 課金、サブスクリプション、広告
- 企業向けの細かな監査・権限機能

## 将来的な拡張案

- DAW またはデスクトップ補助アプリとの連携
- 波形表示と再生位置に連動したコメント
- ファイルのプレビュー、差分、版の比較
- スレッド、メンション、通知
- カレンダーやリハーサル日程との連携
- AI による議事録、TODO 抽出、楽曲情報の要約（作曲補助とは分けて検討）
- テンプレート化された制作フロー
- ストレージ容量やチーム機能に応じた有料プラン

これらは候補であり、ユーザー検証、費用、セキュリティを確認するまで採用を確定しません。
