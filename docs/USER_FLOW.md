# User Flow

## 基本方針

ユーザーが「バンドを選ぶ → 楽曲を選ぶ → メモ・コメント・TODO・ファイルを扱う」という階層を迷わず理解できる導線にします。スマートフォンでは、現在のバンド名と楽曲名が分かる表示を保ち、主要操作までの手数を抑えます。

認証、招待、ファイル保存は将来の想定を含むフローです。今回は実装せず、方式を決定した後に詳細化します。

## UI プロトタイプで確認できる導線

`ui-prototype-001` では、ログインを省略したモック状態で次の順に画面遷移を確認できます。

1. `/` でアプリの目的を確認する
2. 「ダッシュボードを開く」から `/dashboard` へ移動する
3. ナビゲーションから `/bands` を開く
4. バンドカードから `/bands/lumen-echo` を開く
5. 「楽曲一覧を見る」から `/bands/lumen-echo/songs` を開く
6. 楽曲カードから `/songs/afterglow` を開く
7. 楽曲詳細内でメモ、TODO、コメント、共有ファイルを確認する

表示内容は `src/lib/mock-data.ts` の仮データです。ボタンや入力欄の一部は将来の操作位置を確認するためのもので、作成・更新・送信・アップロードは行いません。

## UI 操作プロトタイプで確認できる導線

`ui-interaction-prototype-001` では、上記の基本導線に次の操作を追加します。

1. `/bands/lumen-echo/songs` で楽曲名を入力する
2. 「すべて」「アイデア」「制作中」「確認待ち」「完成」から状態を選ぶ
3. 0 件になった場合は空状態を確認し、「すべての楽曲を表示」で条件を戻す
4. `/songs/afterglow` で TODO のチェックを切り替える
5. コメントと任意のタイムスタンプを入力し、「画面に追加」を押す
6. コメントが一時表示され、「保存・送信されていない」案内を確認する
7. ページをリロードし、検索条件、TODO、追加コメントが初期状態へ戻ることを確認する

この導線は操作位置と説明の分かりやすさを検証するものです。実際の作成、更新、送信、アップロード、永続化は行いません。

## 楽曲作成・編集の非保存プロトタイプで確認できる導線

`SURFACE-017` では、保存方式を決める前にフォーム項目とreview表示を次の流れで確認します。

1. `/bands/lumen-echo/songs` の「新規楽曲」から `/bands/lumen-echo/songs/new` を開く
2. 楽曲名、制作metadata、初期version、メモ、担当partを入力する
3. 「Previewに反映」で同じ画面の未保存reviewを確認する
4. `/songs/afterglow` の「楽曲情報を編集」から `/songs/afterglow/edit` を開く
5. 既存mock dataを初期値として変更し、同じ未保存reviewを確認する
6. ページをリロードし、入力変更が消えて初期状態へ戻ることを確認する

この操作はReactの画面内stateだけを使います。「保存（未実装）」は無効で、DB、API、Auth、AWS、localStorage、cookie、実ファイルuploadは使用しません。

## Phase 1 core collaboration review flow

`FLOW-001`では、DAWで作った素材をStreamBand上で確認し、判断を次の制作へ返す順序をSong Detail内で明確にします。

```text
DAW export
→ Preview review
→ Version / bar / beat / time / trackに紐づくComment
→ Originalと分離されたMIDI Proposal review
→ Accept / Partial / Hold / RejectのDecision
→ 作曲者がDAW側へ判断を反映
→ 新しいPreview / MIDIをexport
→ New StreamBand Version
```

- Song Detailの5 step navigationから既存のPreview、Comment、Proposal、Decision、Version sectionへ移動する
- Original MIDIは読み取り専用として示し、Proposalによって上書きしない
- ProposalをAcceptしてもDAWへ自動反映せず、Versionも自動作成しない
- Comment AnchorはDATA-001の草案に合わせ、対象Versionとbar / beat / time / trackの文脈を分けて表示する
- Decision button、anchor、statusはPhase 1のvisual mockで、保存・通信・backend stateは持たない

このflowはDAWを置き換えません。最終判断の反映と正式な音源・MIDIの生成はDAW側で行い、StreamBandでは共有された新しいVersionを次のreview単位として扱う想定です。

### Phase 2 server boundary補足（DATA-002候補）

FLOW-001のユーザー導線は変えず、Cloud化する場合は各操作の間にserver側の検証境界を置きます。具体的なtransportは、Next.js Route Handlers、Server Actions、別Backend/APIを含めて未決定です。

```text
DAWでPreview / MIDIを書き出す
↓
private upload instructionを要求する
↓
serverが認証・Band membership・metadataを検証する
↓
upload済みassetをserverが検証する
↓
Versionを明示的に作成 / finalizeする
↓
Preview → Comment → Proposal → Decisionのreviewを行う
↓
作曲者がDAWへ反映し、次のVersionを別操作で共有する
```

- Commentは対象Versionを明示し、bar / beat / time / trackのanchor整合性をserverで検証する。
- MIDI ProposalはOriginal MIDIとは別entity / assetとして作成し、元データを上書きしない。
- DecisionはProposal reviewの記録であり、Versionを自動作成しない。
- authorization、runtime validation、競合検出、idempotencyはUI表示ではなくserver boundaryの責務とする。
- これはDATA-002時点の設計候補であり、upload、API、DB、Auth、Storageは未実装のままとする。

## 1. 初回訪問

目的: アプリが自分たちの制作に役立つかを理解する。

- ランディングページを開く
- アプリ概要と主要機能を見る
- 「アカウントを作成」または「ログイン」を選ぶ
- 招待 URL から来た場合は、招待先バンドの概要を確認する

## 2. アカウント作成

目的: Friend Testから最終製品に近いself-service registrationを安全に試す。

Open public signupは無効にし、Band invitationを持つ人だけがself-service registrationへ進める設計にします。一般公開時はauthentication systemを作り直さず、invite-only入口をpublicへ開放できる構成を目指します。Managed Loginだけでinvite gateを安全に成立させるexact mechanismは未確定であり、administrator-created temporary accountへ戻して解決しません。

### Invitation-gated friend-test authentication flow（AUTH-001-DESIGN）

```text
Band invitation link
→ StreamBand branded entry
→ branded Cognito Managed Login registration
→ email verification + password creation
→ email + password login
→ Authorization Code + PKCE callback
→ same-origin BFF creates opaque HttpOnly session
→ internal User mapping
→ invitation details / role confirmation
→ explicit accept
→ ACTIVE BandMembership creation
→ dashboard / allowed Band
```

- sign in: user-facing IDはemail。unknown account / wrong passwordは存在を区別しないgeneric errorにする
- verification: verified emailとinvitation targetが一致するまでMembershipへ進めない
- session: access / ID 1時間、約7日のrefresh capability、idle 12時間 / absolute 7日のBFF session候補。通常使用中はserver-side renewalする
- session expiry: StreamBand Session Expired画面でreauthenticateし、元のsafe routeへ戻る。Private draftをURLへ入れない
- sign out: current deviceだけをlogoutし、StreamBand login / home entryへ戻る。他deviceは維持する
- forgot password: email verification codeとnew passwordで完了し、既存StreamBand sessionをすべてinvalidateする
- Passkey: Friend Testのmandatory MFAではないが、Private AlphaまでにPasskey-preferred normal sign-inをtargetとして再確認する
- Membership removal: Cognito accountが有効でも、removed Bandは次requestのstrong Membership checkで拒否する

Login / signup / invitation / reset / logout、Cognito、session / device、email deliveryはまだ未実装です。localhost、nonprod、Private Alphaはcallback / client / sessionを分離し、wildcard callbackやtokenのlocalStorage保存を行いません。

## 3. バンド作成

目的: 制作情報をまとめるワークスペースを作る。

- ダッシュボードまたはバンド一覧で「バンドを作成」を選ぶ
- バンド名と任意の説明を入力する
- 内容を確認して作成する
- 作成したバンドの詳細画面へ移動する
- 最初の楽曲作成またはメンバー招待を案内する

## 4. メンバー招待

目的: 共同制作する相手をワークスペースへ招く。

- バンド詳細からメンバー画面を開く
- verified email addressとroleを入力する。Default roleはEditor
- 招待内容を確認して送信する
- 14日以内に予測不能token付きlinkからregistration / loginする
- 招待された人はBand名、inviter、roleを確認し、accept / あとで決める / declineを選ぶ
- accept時にserverがtoken、expiry、revoke、email一致、inviter権限を再検証してからMembershipを作成する

Link clickだけではMembershipを作りません。`あとで決める`は`PENDING`のままです。辞退すると`DECLINED`になりますが、expiry前・未revoke・inviter capability有効・verified email一致・その他server validation成功なら、本人は「この招待は辞退済みです」画面の`やっぱり参加する`から明示的に再acceptできます。再acceptでも全条件を再検証し、成功時だけMembershipを作ります。Inviter revoke、expiry、capability loss、invalid / replaced invitationではacceptできず、新規発行が必要です。OwnerはAdmin / Editor / Commenter / Guest、AdminはEditor / Commenter / Guestを招待でき、Editor以下はinvite不可です。Owner roleは通常invitationで付与せず、ownership transfer専用flowを使います。

## 5. 楽曲作成

目的: 制作単位となる楽曲を登録する。

- バンド詳細または楽曲一覧で「楽曲を作成」を選ぶ
- タイトル、説明、状態などを入力する
- 保存後、楽曲詳細へ移動する
- メモ追加、TODO 作成、ファイル共有の次の操作を案内する

## 6. メモ追加

目的: 楽曲全体の方針や固定して参照したい情報を残す。

- 楽曲詳細からメモを開く
- 制作方針、歌詞案、コード、録音メモなどを入力する
- 保存前に入力内容を確認する
- 保存後、更新者と更新日時が分かるようにする

コメントとメモの使い分けを画面内で説明します。話し合いはコメント、継続して参照する整理済み情報はメモを基本とします。

## 7. コメント追加

目的: 楽曲について意見を交換する。

- 楽曲詳細からコメント欄を開く
- コメントを入力して投稿する
- 必要に応じて既存コメントへ返信する
- 投稿後に内容、投稿者、時刻を確認する

編集・削除の範囲やメンション通知は、権限と通知の設計後に決めます。

## 8. タイムスタンプコメント追加

目的: 音源の修正箇所を正確に共有する。

- 楽曲の対象バージョンを選ぶ
- 音源を再生し、気になる位置で停止する
- 現在時刻を引き継ぐか、時刻を手入力する
- コメントを入力して投稿する
- 時刻を選ぶと同じ位置から再生できるようにする

コメントがどの楽曲バージョンに属するかを常に表示します。

## 9. ファイル共有

目的: 楽曲に関連する MIDI / 音源ファイルを版とともに共有する。

- 楽曲詳細からファイルまたはバージョン画面を開く
- ファイルの種類と対応バージョンを確認する
- アップロードするファイルと説明を選ぶ
- 容量、形式、公開範囲を確認する
- アップロード後、他のメンバーがプレビューまたは取得する

Phase 1 では画面と導線のみを扱います。実ファイルの保存は、セキュリティ、費用、削除、アクセス制御を設計してから実装します。

## 10. TODO 管理

目的: 担当作業と進捗を明確にする。

- 楽曲詳細から TODO を開く
- タイトル、パート、担当者、期限、優先度を入力する
- TODO を作成し、一覧で状態を確認する
- 作業開始時に「進行中」、完了時に「完了」へ更新する
- ダッシュボードで自分の未完了 TODO を確認する

## 継続利用の基本ループ

- ダッシュボードで更新と自分の TODO を確認する
- バンドから対象の楽曲を開く
- 最新バージョンと未解決コメントを確認する
- メモ、コメント、TODO、ファイルを更新する
- 判断事項を楽曲内に残し、次の担当を明確にする
