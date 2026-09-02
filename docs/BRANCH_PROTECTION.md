# Main Branch Protection

## 現在の設定

2026-09-03時点で、GitHub repository ruleset `Main branch protection`（ID: `22150838`）をdefault branchへactiveで適用しています。classic branch protectionではなくrepository rulesetを使用します。

- mainへの変更はPull Request経由を必須とする
- GitHub Actionsのstatus check `Quality checks`を必須とする
- PR branchを最新のmainへ追従させてからcheckを通す
- mainの削除を禁止する
- mainへのforce pushを禁止する
- 手動Approveは必須にしない（必要承認数: `0`）
- bypass actorは設定しない
- 通常mergeを含むrepositoryの既存merge方式を利用できる

`Quality checks`は`.github/workflows/ci.yml`のjob名です。workflow名ではなくjob名をrulesetのstatus check contextに指定します。

## 確認方法

管理権限を持つGitHub CLIで、ruleset本体とmainへの有効ルールを取得します。

```bash
gh api repos/Ryo-9/daw.connect.app/rulesets/22150838
gh api repos/Ryo-9/daw.connect.app/rules/branches/main
```

次の4種類のruleが返ることを確認します。

- `pull_request`
- `required_status_checks`
- `non_fast_forward`
- `deletion`

設定変更は保護を一時的に無効化せず、専用タスクで現在値を取得してから行います。rulesetを削除・弱化する変更は、共同開発者の確認なしに実行しません。

## 参考資料

- [GitHub Docs: REST API endpoints for rules](https://docs.github.com/en/rest/repos/rules)
- [GitHub Docs: Available rules for rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
