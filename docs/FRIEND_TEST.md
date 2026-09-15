# Friend Test Acceptance Contract

## Status and authority

Task: `FRIEND-TEST-001-DESIGN`。この文書は、開発者本人と友人1人が1つのprivate Bandで行う最初の実利用検証について、開始条件、実施scenario、合否、対象外を定めるdocs-only acceptance contractです。Friend Test自体、AWS resource、runtime、DB、Auth、workflow、deploymentはこのtaskでは実行・変更しません。

実際のFriend Testは、必要runtimeとenvironmentを別task / Human Gateで用意し、Start Gateを証拠付きで確認した後のexecution taskとして行います。設計上の正は[PRODUCT_SPEC.md](PRODUCT_SPEC.md)、[API.md](API.md)、[DATABASE.md](DATABASE.md)、[AWS.md](AWS.md)と承認済みDecisionです。この文書はそれらを弱めず、test開始と合否へ落とし込みます。

## Purpose and scope

Friend Testの目的は、機能数や制作速度を評価することではありません。次の問いを、実際の2人の制作loopで検証します。

- 2人が目的のprivate Band / Song / current Versionへ迷わず到達できるか
- Studio Oneから手動で書き出したPreviewを安全に共有し、Version固有のfeedbackを残せるか
- StreamBand上の判断をDAWへ手動で戻し、次のVersionを共有できるか
- reload、再login、別端末を挟んでもownership、Version history、private accessが壊れないか
- StreamBandが制作を管理・強制せず、音楽制作そのものを邪魔しないか

対象は2 users、1 private Band、PCとsmartphone、Studio Oneとのmanual export / importです。User Aは既存AUTHZ contract上の制作操作capabilityを持つmember、User Bはreview参加に必要な既存roleを持つmemberとします。Friend Test専用roleは作りません。

## Core loop and MIDI add-on decision

最初のFriend Testで必須とするcore loopは次です。

```text
Login / invitation acceptance
→ private Band / Song
→ explicit SongVersion + AUDIO_PREVIEW
→ User BのVersion-scoped Comment / timestamp
→ User AがDAWへmanual反映
→ explicit New SongVersion + new Preview
→ old VersionのComment / Asset / historyを確認
```

`MIDI Proposal → Decision`は**最初のFriend Test開始をblockしない追加scenario**とします。曲にMIDI変更が不要だった、または機能がまだ実装されていないことだけでcore Friend TestをFAILにしません。ただし未検証の機能を合格済みとは記録しません。CLOUD-001のPrivate Alpha全体を完了扱いにする前、またはMIDI機能を利用可能として提供する前に、少なくとも1回は次を別acceptanceとして通します。

```text
AVAILABLEなSOURCE_MIDI
→ separate PROPOSAL_MIDI / MidiProposal
→ authorized review / Decision
→ SOURCE_MIDIとProposal objectが不変であることを確認
→ DAWへmanual import / 反映
→ Decisionとは別commandでNew SongVersion
```

DecisionはVersionを自動作成せず、ProposalはSOURCE_MIDIを上書きしません。この分離はMIDI add-onが未実装でも変えません。

## Start Gate

Level Bを開始するには、以下の**Blocking**項目をすべてLevel Aのsynthetic dataで確認し、実行担当Humanが開始を承認します。項目が不明、未確認、失敗中なら友人を招待せずSTOPします。

| Gate | Blocking evidence |
| --- | --- |
| Reviewed deployment | 対象environment、region、review済みcommit、rollback / access-stop手順を記録し、applicationがHTTPSで到達できる。想定外resourceや未review変更がない |
| Environment isolation | Synthetic integration用nonprodと、未公開曲を置くPrivate Alpha data boundaryを分離する。実曲をnonprodへ入れない。Private Alphaのaccount / resource / role / budget / log境界をHumanが確認する |
| Controlled identity | Open public signupを無効にし、招待または承認済みtest identityだけが登録できる。2 accountでemail verification、login、logout、session expiry / renewal、recovery pathを確認する |
| Invitation | Link clickだけでMembershipを作らず、target、expiry、revoke、inviter capability、verified identityをserver-side再検証し、本人のexplicit accept成功時だけACTIVE Membershipを作る |
| Server authorization | Canonical resourceからBandを導出し、strong ACTIVE MembershipとAUTHZ capabilityを毎protected operationで確認する。Unauthenticated、cross-Band、REMOVED lifecycle、forged relationをdenyする |
| Metadata persistence | Band、Song、SongVersion、Version-scoped Comment / Anchorが永続化され、reload / logout-login後も残る。User Aの保存結果をauthorized User Bが読める |
| Private Preview storage | AUDIO_PREVIEWをprivate storageへupload / verify / accessできる。Block Public Access、short-lived instruction、AVAILABLE state、size / type / checksum候補、current Membership再確認が動く |
| Version integrity | New Versionが明示操作で作られ、旧VersionのPreview / Comment / Anchorを上書き・自動remapしない。Current Versionとhistoryを取り違えない |
| Failure behavior | Upload / validation / conflict / unavailable sourceをsafe errorとして表示し、失敗objectをAVAILABLEにしない。Retryやdouble actionで主要recordを重複・破損させない |
| Privacy and safe logging | Public object、long-lived URL、credential、token、private object key、未公開曲本文・filenameの不要なlog copyがないことを確認する |
| Monitoring and budget | Basic error / availability / authorization / storage observationとbudget guardrailが有効で、Budgetがhard capではないことを担当Humanが理解する |
| Recovery readiness | Synthetic dataでmetadata backup / restoreとS3 object reconciliationのrunbookを確認する。Test中止時のMembership removal、account/session stop、private access停止手順が使える |
| Device readiness | User A / Bが別account・別sessionを使え、少なくともPCとsmartphoneでlogin、Song、Preview、Commentの主要操作を行える。致命的horizontal overflowや操作不能がない |

### Non-blocking at first start

次は初回core Friend Testの開始条件に含めません。未実装を実装済みと表現せず、必要性が観察された場合だけ別taskへ分けます。

- 高度なNotification、email / push provider、digest、Notification Center完全実装
- Creative Board / Memo / Idea / Taskの完全永続化
- MIDI Proposal / Decision（上記add-onとしてPrivate Alpha完了前に別途検証）
- Presence、Call、real-time collaboration
- DAW Bridge、automatic DAW sync、Companion App、VST3
- DAW project、plugin chain、mix state、音色、automationの同期
- waveform解析、server transcoding、高度なMIDI editor
- public signup、public profile、billing、production domain、full analytics
- polished onboarding、multi-Band scale、10人以上のtest、native mobile app

これらがnon-blockingでも、authentication、authorization、private Asset、cross-Band / removed-member denial、safe logging、recoveryを省略してよい意味ではありません。

## Level A — Developer Integration Test

友人を呼ぶ前に、開発者1人がsynthetic / disposable dataだけで次を順に通します。必要なら開発者が管理する2つのtest identityと別browser profileを使いますが、実在する友人のemailや未公開曲をfixture / logへ残しません。

1. Reviewed deployment / environment / commitを確認する。
2. Controlled accountでregistration / verification / login / logout / recoveryを確認する。
3. Invitationをacceptし、対象private Bandだけが見えることを確認する。
4. Synthetic Song、initial Version、AUDIO_PREVIEWを作成し、object verification後だけAVAILABLEになることを確認する。
5. 別test sessionからPreviewを開き、Version-scoped point / timestamp Commentを作成する。
6. 両sessionでreloadし、一度logout / loginしてもSong、Version、Asset metadata、Commentが残ることを確認する。
7. New Versionとnew Previewを作成し、old Comment / Anchorがold Versionに固定されることを確認する。
8. Unauthenticated、別Band relation、forged resource relation、REMOVED Membership、expired access instructionをdenyする。
9. Upload mismatch / failure、stale revision、duplicate request、missing sourceのsafe errorとrecoveryを確認する。
10. PC / smartphoneの主要route、basic logging / monitoring / budget、access-stop / restore runbookを確認する。

Level Aに1つでもopen BLOCKER / HIGHがあればLevel Bへ進みません。

## Level B — Two-person Friend Test

### Preparation

- HumanがStart Gate結果、対象environment、参加者2人、既存role assignment、data handlingを確認する
- User A / Bは別accountと別sessionを使う。Credentialやtokenを共有しない
- 未公開曲を扱う場合はPrivate Alpha boundaryだけを使い、使用するSong名・filename・email等をrepository、ticket本文、test logへ転記しない
- 説明は安全上必要なものと開始目的に限定し、操作手順を逐一誘導しすぎない

### Mandatory two-person scenario

1. User AがStudio Oneからreview用Audio Previewを書き出す。
2. User AがStreamBandへloginし、1つのprivate Band / target Songへ入る。
3. User Aがexplicit SongVersionを作成し、Preview upload / completeを通してそのVersionへ紐付ける。
4. User Bがinvitation-gated registration / verification / explicit acceptanceを完了し、別account / sessionからloginする。
5. User Bが自力でBand、Song、current Version、Previewへ到達する。
6. User BがPreviewを確認し、特定時刻またはrangeへVersion-scoped Commentを残す。
7. User AがCommentと対象Version / timestampを正しく確認する。
8. User Aが必要な内容をStudio Oneへmanual反映し、新しいPreviewを書き出す。
9. User Aが別のSongVersionを明示作成し、新Previewを紐付ける。
10. User A / Bがnew Versionをcurrent review対象として認識し、old VersionのPreview / Comment / Anchor / historyがold Versionに残ることを確認する。
11. 両者がreloadし、一度再loginしても保存結果とaccess boundaryが維持されることを確認する。
12. Test終了前に、User BがsmartphoneからSong、Version、Preview、Commentを再確認する。

MIDI add-onを同じ曲で行う必要はありません。機能が利用可能で、実際の制作判断に合う時だけ別記録として行います。User Bのroleで許可されない操作をtest都合でclient-sideに緩和せず、既存AUTHZ capabilityを正とします。

## Level C — Repeat Test

Level Bの偶然の成功を合格にしないため、別Songまたは同じSongの次の制作cycleでcore loopをもう1回行います。

- 新しいPreviewと明示Versionを作る
- 前回とは異なるpoint / rangeまたは別VersionへCommentする
- DAWへmanual反映し、次Versionを共有する
- 旧履歴、current Version、2人のaccess、reload / re-loginを再確認する
- 初回で必要だった口頭説明やworkaroundが減ったかを記録する

Level Cが未実施なら全体結果は`INCOMPLETE`で、PASSにはしません。

## Pass criteria

Level A / B / Cを完了し、次をすべて満たし、open BLOCKER / HIGHがない場合だけ`PASS`とします。

- 2人が最小限の説明で正しいprivate Band / Song / current Versionへ到達できる
- PreviewとVersionの対応を取り違えず、User BがComment対象Version / point / rangeを理解できる
- User BのCommentがUser Aへ正しいVersionのrecordとして永続表示される
- Reload、再login、別session / smartphone確認後も主要metadataとauthorized accessが維持される
- Unauthenticated、cross-Band、forged relation、REMOVED memberがprivate metadata / Assetを取得できない
- Upload失敗や不一致objectがAVAILABLEにならず、short-lived accessとsafe error boundaryが維持される
- New Version追加後もold VersionのPreview / Comment / Anchor / historyが壊れず、自動remapされない
- Studio One → StreamBand → Studio One → New Versionのmanual round-tripが成立する
- StreamBandが未完了Taskや未確認項目を理由にVersion作成・DAW作業・playbackをblockしない
- Credential、token、private object key、signed URL、未公開制作内容の不要なcopyがUI / URL / logへ露出しない
- 致命的data loss、cross-account leakage、corruptionがない

MIDI add-on未実施はcore Friend TestのFAIL理由ではありませんが、結果に`MIDI add-on: NOT TESTED`と明記し、Private Alpha全体をcomplete扱いにしません。

## Failure and bug severity

| Severity | Definition | Friend Test action |
| --- | --- | --- |
| `BLOCKER` | Security / privacy exposure、cross-Band leak、removed access、data corruption / loss risk、login不能、core loop継続不能、秘密情報露出 | 即時中止。Accessを止め、証拠をsafeに保存し、別fix / incident task後にLevel Aから再確認 |
| `HIGH` | Core操作が成立しないが限定的workaroundはある、またはVersion / Asset / Commentの信頼性を損なう | 当該pathを停止し全体PASSにしない。修正と再testが必要 |
| `MEDIUM` | Core outcomeは正しいが迷い、余分な手順、表示不整合、mobile frictionがある | Testは継続可能。再現手順と影響を記録し、優先度をHuman review |
| `LOW` | Cosmetic、wording、軽微なspacingで意味・access・data integrityへ影響しない | Testは継続可能。必要なら独立polish task |

次は常にBLOCKERです。

- Private Assetが第三者 / public accessから読める
- REMOVED / unauthorized accountがBand dataへアクセスできる
- Version、Asset、Commentが別Song / Bandへ混ざる
- Reload / re-loginで主要dataが消える、またはwrong accountへ見える
- Commentが別Versionへ移る、SOURCE_MIDIがProposalで上書きされる
- Upload failureがAVAILABLEになる、またはtest継続にdata corruption riskがある
- Credential、token、long-lived signed URL、private object key、未公開内容が不適切に露出する

## Security and privacy rules

- Invite済みの2人だけを対象private BandのACTIVE Membershipにする
- Real unreleased musicはHuman-approved Private Alpha boundaryだけで扱い、nonprod / local fixtureへ入れない
- S3 / object accessをpublicにせず、server-authorized short-lived instructionごとにcurrent Membershipを確認する
- Song title、lyrics、Comment / Creative body、original filename、audio / MIDI contentをapplication / delivery / audit logへ不要に複製しない
- Credential、password、verification code、token、cookie、signed URL、private object keyをfeedback noteへ記録しない
- Account disableとBandMembership REMOVEDを混同せず、leave / remove後は次のprotected requestからBand accessをdenyする
- Test中止時は新しいupload / access instruction発行を止め、必要なMembership / session / hosting stopをapproved runbookで行う。Physical Notificationやbrowser cache cleanupをaccess revocation条件にしない
- Test終了後の保持期間をこの文書では新規決定しない。Keep / restricted hold / cleanup requestのいずれかをHumanが既存retention・backup・account deletion contractに沿って記録し、physical deleteは別Human Gateで行う

## Observation and feedback

機能の成功に加え、次を観察します。定量値を使う場合もUX frictionの発見だけに使い、個人や制作のperformance評価には使いません。

- 最初にどこを押すか迷った場所
- Band、Song、Versionの違いを説明なしで理解できたか
- PreviewとComment / timestampの対応が自然だったか
- Timestamp Commentが通常chatより探しやすかったか
- DAW → StreamBand → DAWの手動往復で面倒・重複・中断を感じた箇所
- Smartphoneでreview / Comment確認ができたか
- NotificationやCreative Boardがなくてもcore loopが成立したか
- 使わなかった機能、邪魔だったUI、制作の集中を切った動作
- 説明しないと理解できなかった概念と、次回に同じ説明が必要だったか

記録しないもの:

- Task消化数、完了率、productivity score、制作速度ranking
- 音楽的判断の正誤、参加者個人の能力評価
- 未公開曲本文・file内容、private URL、account識別情報、credential

## Observation note template

```text
Date:
Level: A / B / C / MIDI add-on
Environment class: synthetic nonprod / approved Private Alpha
Reviewed app commit:
User roles: existing AUTHZ role names only
Devices / browsers:
Scenario steps completed:
PASS criteria evidence:
BLOCKER / HIGH:
MEDIUM / LOW friction:
Explanation or workaround required:
Production flow interruption observed:
MIDI add-on: PASS / FAIL / NOT TESTED
Data disposition decision: keep / restricted hold / separate cleanup approval required
Outcome: PASS / FAIL / INCOMPLETE
Next separate task:
```

Actual email、account ID、token、private URL、Song title、filename、Comment本文はこの記録へ入れません。

## End-of-test decision

- `PASS`: Level A / B / C、全required criteria、security / privacy checksが成功し、open BLOCKER / HIGHがない
- `FAIL`: Required criterionが失敗、またはBLOCKER / HIGHが残る。Friend Testを続行・公開範囲拡大しない
- `INCOMPLETE`: Environment / participant都合等でrequired levelを終えていない。成功扱いにせず再実施する

PASSでもpublic launch、application production readiness、MIDI add-on、Notification、Creative persistence、scaleを自動承認しません。FAILでも設計を場当たり的に緩和せず、再現条件、safe evidence、fix task、Level Aからのretestを記録します。

## Explicit exclusions

Friend TestはStreamBandがDAWを置き換えられるかを評価しません。DAW project file、plugin chain、mix state、音色、automation、real-time syncの移行を要求しません。Notification delivery provider、Creative Board完全永続化、Call / Presence、Bridge / Companion、public signup、billing、public profile、production domain、full analytics、multi-Band / large-team scaleは別scopeです。

実装済みでない機能への期待を口頭workaroundで満たしたことにせず、core loopへ本当に必要と分かった場合は独立task、security review、必要なHuman Gateへ戻します。
