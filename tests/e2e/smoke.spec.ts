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

test("存在しないページはStreamBandのcustom 404になる", async ({ page }) => {
  for (const path of [
    "/bands/not-a-band",
    "/songs/not-a-song",
    "/this-route-does-not-exist",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: "ページが見つかりません" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "ホームへ戻る" })).toBeVisible();
  }
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

test("長い楽曲名が主要surfaceでpage overflowを起こさない", async ({ page }) => {
  const longTitle =
    "夜明け前の街で何度も書き直したメロディーとまだ名前のない僕たちの長い長いデモソング Final Arrangement Version 2026 MixReviewCheckpointABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (const width of [320, 375, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/bands/lumen-echo/songs");

    const card = page
      .locator('a[href="/songs/afterglow"]')
      .filter({ has: page.locator("h3") })
      .first();
    const cardTitle = card.locator("h3");
    await cardTitle.evaluate((element, title) => {
      element.textContent = title;
    }, longTitle);

    const cardBox = await card.boundingBox();
    const cardTitleBox = await cardTitle.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardTitleBox).not.toBeNull();
    expect(cardTitleBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(cardTitleBox!.x + cardTitleBox!.width).toBeLessThanOrEqual(
      cardBox!.x + cardBox!.width,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);

    await page.goto("/songs/afterglow");
    const detailTitle = page.getByRole("heading", { level: 1 });
    const breadcrumbTitle = page
      .getByRole("navigation", { name: "パンくず" })
      .locator("span.text-muted");
    await detailTitle.evaluate((element, title) => {
      element.textContent = title;
    }, longTitle);
    await breadcrumbTitle.evaluate((element, title) => {
      element.textContent = title;
    }, longTitle);

    for (const title of [detailTitle, breadcrumbTitle]) {
      const box = await title.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});

test("楽曲詳細のreview flowから5つの対象sectionへ移動できる", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/songs/afterglow");

  const flowNavigation = page.getByRole("navigation", {
    name: "コラボレーションレビューフロー",
  });
  await expect(flowNavigation.getByRole("link")).toHaveCount(5);

  for (const step of [
    { name: "01 PREVIEWへ移動", target: "preview" },
    { name: "02 COMMENTへ移動", target: "comments" },
    { name: "03 PROPOSALへ移動", target: "proposal" },
    { name: "04 DECISIONへ移動", target: "decision" },
    { name: "05 VERSIONへ移動", target: "version" },
  ]) {
    await flowNavigation.getByRole("link", { name: step.name }).click();
    await expect(page).toHaveURL(new RegExp(`#${step.target}$`));
    await expect(page.locator(`#${step.target}`)).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
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
