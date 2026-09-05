# AI / Codex Delegation Policy

## 目的

この文書は、StreamBand開発でAI/Codexへ任せる作業、必ず人が判断する作業、将来auto-mergeを検討できる条件を定めます。AIをプロダクト機能として利用する方針ではなく、開発作業の委任方針です。

現在の原則は、人間がTask IDと範囲を決め、Codexが調査、実装、検証、Draft PR作成を担当し、人間が差分と結果をレビューすることです。明示されていない権限や目的を、AIがタスクへ追加してはいけません。

## 共通ルール

- 1 task = 1 branch = 1 PR
- `main`へ直接commitまたはpushしない
- 最新の`main`とcleanなworking treeから開始する
- 作業前にopen PR、[ACTIVE_TASKS.md](ACTIVE_TASKS.md)、[LOCKS.md](LOCKS.md)を確認する
- 既存実装を再生成せず、最小限の差分にする
- 指定外の改善は実装せず、未対応事項または次タスク候補として報告する
- package、外部service、GitHub設定を「便利そう」という理由だけで追加・変更しない
- 失敗したcheck、未確認事項、sandboxやnetwork制約を成功扱いにしない
- PRを作成したら、明示的にmergeまで依頼された場合を除いて停止する

## Codexへ委任できる範囲

現在のタスクが対象と完了条件を明示している場合、Codexは次を一連の作業として実行できます。

### 読み取りと調査

- repository status、branch、history、diff、open PR、CI結果の確認
- docs、実コード、config、testsの読解
- 実装済みと未実装、docsとの差異、競合riskの整理
- 公式documentationを使ったversionや互換性の確認
- local lint、test、build、development server、画面のread-only確認

### 低〜中riskの変更

- 明示されたdocsの作成と更新
- scopeが限定されたUI、accessibility、testの小さな変更
- 既存構成に沿ったbug fix
- 既存testやCIで検証でき、rollbackが容易な変更
- Active Task、Lock、Task Queueのtask lifecycle同期

### GitとPR

- task branchの作成
- 変更範囲を確認したcommit
- 明示的に依頼されたremote branchへのpush
- templateに沿ったDraft PR作成
- CI結果のread-only確認と、task範囲内の明白で小さな修正

push、PR作成、mergeは、現在の依頼がその操作まで明示している場合だけ行います。過去タスクの許可を次タスクへ持ち越しません。

## Codexが停止して人へ確認する条件

次に該当する場合は、推測や代替の弱い保護で進めず、原因、選択肢、影響を報告して確認します。

- working treeに由来不明の差分がある
- 同じfileまたは領域にactive lock、open PR、他者作業の可能性がある
- expected branch、commit、changed files、repositoryが一致しない
- taskの解釈によってproduct仕様やdata modelが変わる
- package追加、major update、lockfileの広い変更が必要
- `src/**`や設定の大規模変更、全面refactorが必要
- testを削除、skip、弱化しないとCIを通せない
- destructive command、history rewrite、大量削除が必要
- GitHub ruleset、required check、workflow permissionの変更が必要
- 外部serviceへの書き込み、料金発生、公開範囲変更が必要
- secret、API key、credential、実user dataを扱う必要がある
- DB、migration、認証、認可、AWS、S3、Stripe、本番環境へ触れる必要がある
- security warning、merge conflict、重大なmain更新がある

## 人が保持する判断

次はCodexへ最終決定を委任しません。

- product scope、優先順位、対外的な約束
- DB、認証、権限、cloud、課金serviceの採用
- 本番dataのmigration、削除、復旧
- IAM、secret、billing、domain、production deployment
- 法務、privacy、copyright、利用規約
- security incidentの対外対応
- release、rollback、サービス停止
- auto-merge対象領域の拡大

Codexは比較案、checklist、検証結果を作れますが、証拠のない合意や「2人が承認した」という記録を作りません。

## タスク依頼の最小形式

共通前提は[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)とこの文書を参照し、個別promptは最低限次を含めます。

```text
Task ID:
目的:
変更してよい範囲:
変更禁止:
完了条件:
Git / PRの到達点:
```

Codexは不足情報を実repositoryから確認します。結果が大きく変わらない軽微な点は既存patternに合わせ、product仕様、security、外部変更に関わる不足は質問します。

## 検証とPR判断

変更種類に応じて、次を実行・記録します。

- 全PR: `git diff --check`、変更file一覧、unexpected diffの確認
- docs: `npm run lint`。repository ruleに従いbuildが必要なら実行し、未実行なら理由を記録
- UI / app code: lint、Component test、build、関連E2E、必要なviewport確認
- package / config: install再現性、lockfile、lint、test、build、securityとversion根拠
- GitHub設定: 現在値、変更payload、適用後の再取得、rollback方法

CI失敗を隠すためにtest、required check、branch protectionを弱めません。外部要因と思われる場合も、ログを確認して分類します。

## 現在のmerge方針

2026-09-05時点では、AIによる無条件auto-mergeは導入していません。

- mainはrepository rulesetによりPR経由、`Quality checks`成功、最新mainとの整合が必須
- force pushとmain削除は禁止
- required manual approvalは`0`
- 通常mergeを使用できる
- bypass actorはない
- Draft PRは人が内容を確認するための既定の開始状態

現在の設定事実は[BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)を参照します。Codexは、個別タスクでmergeまで明示された場合に限り、expected head、files、CI、mergeabilityを再確認して通常mergeできます。

## 将来の安全なauto-merge方針

以下は将来候補であり、workflow、GitHub App、rulesetはまだ実装・変更しません。導入は専用TaskとPRで行い、repository上の実際のAPI schemaと権限を確認します。

### 初期対象候補

最初は、人がPRへ明示的に`automerge-safe`相当のlabelを付けた、小さな低risk変更だけを候補にします。labelの作成や運用開始自体も別途承認します。

候補:

- typo、リンク、説明補足など、挙動を変えないdocs変更

初期対象外:

- `AGENTS.md`、AI delegation、security、branch protection、decision logなどgovernanceを変える文書
- `src/**`、package / lockfile、`.github/**`、build設定
- test code、fixture、snapshot
- test削除、skip、assertion弱化
- DB、schema、migration、Auth、permission、AWS、S3、Stripe、secret
- deployment、本番設定、外部service、料金、data削除
- rename、大量format、generated files、大きなdiff

### merge前の必須条件

auto-merge候補でも、すべて満たさない限りmergeしません。

1. PRがDraftではなく、baseが`main`
2. task branchが最新の`main`を含む
3. `Quality checks`を含むrequired checksが成功
4. merge conflictがなく、GitHubがmergeableと判定
5. 人が明示したopt-in labelが現在のhead commitに対して有効
6. allowlist外のfile、unexpected commit、secret検知がない
7. reviewでChanges requestedがなく、未解決conversationがない
8. PR本文にTask ID、変更、検証、未対応、riskがある
9. active lockと他のopen PRに競合がない
10. 通常mergeを使用し、squash / rebaseへ勝手に変更しない

label付与後にcommitが追加された場合はopt-inを失効させ、再確認を必要とします。一時的なCI失敗をretry回数だけで安全と判断しません。

### 段階導入

1. dry-run: 対象可否だけ判定し、mergeしない
2. human opt-in: 人がlabelを付けたdocs-only PRだけauto-merge
3. review: 誤判定、CI時間、rollback実績を確認
4. 対象拡大: 必要性が証明された場合のみ、別DecisionとTaskで検討

auto-merge後もrevert可能性、branch削除結果、mainへの反映、task / lockの後処理を記録します。保護を弱めることをauto-mergeの代替にしません。

## 禁止する自動化

- required checksやbranch protectionのbypass
- CI失敗時のmerge
- AI自身による安全labelの自己付与とmergeの同時実行
- head SHAやchanged filesを確認しないmerge
- security / dependency alertの自動無視
- 本番deployment、migration、data削除との連動
- secretやcredentialをPR本文、log、artifactへ出す処理

## 見直し条件

- DB、認証、file upload、本番環境を導入するとき
- team人数やrepository権限が変わるとき
- required checks、ruleset、merge方式を変えるとき
- auto-mergeのdry-runを開始するとき
- AIによる事故、near miss、secret混入、意図しないmergeが発生したとき
- GitHubまたは利用中のAI toolの権限モデルが変わるとき
