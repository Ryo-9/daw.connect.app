import { expect, test } from "@playwright/test";

test("トップから主要画面を移動できる", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /曲づくりの会話を/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: "ダッシュボードを開く" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "おかえりなさい、涼さん。" }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "メインナビゲーション" })
    .getByRole("link", { name: /バンド$/ })
    .click();
  await expect(page).toHaveURL(/\/bands$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "バンド一覧" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Lumen Echoを開く" }).click();
  await expect(page).toHaveURL(/\/bands\/lumen-echo$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Lumen Echo" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "楽曲一覧を見る" }).click();
  await expect(page).toHaveURL(/\/bands\/lumen-echo\/songs$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "楽曲一覧" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Afterglow/ }).click();
  await expect(page).toHaveURL(/\/songs\/afterglow$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Afterglow" }),
  ).toBeVisible();
});

test("存在しないバンドと楽曲は404になる", async ({ page }) => {
  const bandResponse = await page.goto("/bands/not-a-band");
  expect(bandResponse?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();

  const songResponse = await page.goto("/songs/not-a-song");
  expect(songResponse?.status()).toBe(404);
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

test("320pxで楽曲詳細セクションナビが横スクロールなしで収まる", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/songs/afterglow");

  const sectionNavigation = page.getByRole("navigation", {
    name: "楽曲詳細セクション",
  });
  await expect(sectionNavigation).toBeVisible();
  await expect(sectionNavigation.getByRole("link")).toHaveCount(4);

  const fitsWithoutHorizontalScroll = await sectionNavigation.evaluate(
    (element) => element.scrollWidth <= element.clientWidth,
  );
  expect(fitsWithoutHorizontalScroll).toBe(true);
});

test("検索・TODO・コメントは操作でき、リロードで一時状態が消える", async ({
  page,
}) => {
  await page.goto("/bands/lumen-echo/songs");
  await page.getByRole("searchbox", { name: "楽曲名" }).fill("Paper");
  await expect(page.getByRole("link", { name: /Paper Moon/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Afterglow/ })).toHaveCount(0);

  await page.goto("/songs/afterglow");
  const task = page.getByRole("checkbox", {
    name: "ラスサビのギターを録り直すを完了にする",
  });
  await task.click();
  await expect(
    page.getByRole("checkbox", {
      name: "ラスサビのギターを録り直すを未完了にする",
    }),
  ).toHaveAttribute("aria-checked", "true");

  await page
    .getByRole("textbox", { name: "コメント", exact: true })
    .fill("E2Eの一時コメント");
  await page
    .getByRole("textbox", { name: "コメントのタイムスタンプ、任意" })
    .fill("01:24");
  await page.getByRole("button", { name: "画面に追加" }).click();
  await expect(page.getByText("E2Eの一時コメント")).toBeVisible();
  await expect(
    page
      .getByLabel("今回追加したモックコメント")
      .getByText("▶ 01:24", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("checkbox", {
      name: "ラスサビのギターを録り直すを完了にする",
    }),
  ).toHaveAttribute("aria-checked", "false");
  await expect(page.getByText("E2Eの一時コメント")).toHaveCount(0);
});

test("楽曲作成・編集フォームはプレビューだけを更新し、リロードで元に戻る", async ({
  page,
}) => {
  await page.goto("/bands/lumen-echo/songs");
  await page.getByRole("link", { name: "新規楽曲" }).click();
  await expect(page).toHaveURL(/\/bands\/lumen-echo\/songs\/new$/);
  await expect(page.getByRole("heading", { level: 1, name: "新しい楽曲を作成" })).toBeVisible();
  await expect(page.getByText("このフォームはまだ保存されません")).toBeVisible();

  await page.getByRole("textbox", { name: /SONG TITLE/ }).fill("E2E Draft Song");
  await page.getByRole("button", { name: "Previewに反映" }).click();
  await expect(
    page.getByLabel("未保存の楽曲プレビュー").getByRole("heading", { name: "E2E Draft Song" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "保存（未実装）" })).toBeDisabled();

  await page.reload();
  await expect(page.getByRole("textbox", { name: /SONG TITLE/ })).toHaveValue("");
  await expect(page.getByLabel("未保存の楽曲プレビュー").getByText("Untitled song")).toBeVisible();

  await page.goto("/songs/afterglow");
  await page.getByRole("link", { name: "楽曲情報を編集" }).click();
  await expect(page).toHaveURL(/\/songs\/afterglow\/edit$/);
  await expect(page.getByRole("textbox", { name: /SONG TITLE/ })).toHaveValue("Afterglow");

  await page.getByRole("textbox", { name: /SONG TITLE/ }).fill("Afterglow Edit Preview");
  await page.getByRole("button", { name: "Previewに反映" }).click();
  await expect(
    page
      .getByLabel("未保存の楽曲プレビュー")
      .getByRole("heading", { name: "Afterglow Edit Preview" }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByRole("textbox", { name: /SONG TITLE/ })).toHaveValue("Afterglow");
});
