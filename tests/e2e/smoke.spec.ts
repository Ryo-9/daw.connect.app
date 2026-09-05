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
