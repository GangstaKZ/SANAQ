import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";
test("catalog, scanner, sale, report and offline persistence", async ({
  page,
  context,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Обзор." })).toBeVisible();
  await page.screenshot({
    path: "artifacts/dashboard-desktop.png",
    fullPage: true,
  });
  await page.goto("/products");
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await page
    .getByRole("button", { name: "Добавить товар", exact: true })
    .click();
  await page.getByLabel("Название", { exact: true }).fill("Проверка SANAQ");
  await page.getByLabel("Штрих-код", { exact: true }).fill("1234567890123");
  await page.getByLabel("Остаток", { exact: true }).fill("8");
  await page.getByLabel("Цена продажи", { exact: true }).fill("900");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(21);
  await page
    .getByRole("button", {
      name: "Редактировать товар: Проверка SANAQ",
      exact: true,
    })
    .click();
  await page.getByLabel("Минимальный остаток", { exact: true }).fill("9");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet([
      {
        name: "Импорт тест",
        barcode: "987654321",
        quantity: 4,
        min_stock: 1,
        buy_price: 10,
        sell_price: 20,
      },
    ]),
    "Products",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "test.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    });
  await expect(page.locator("tbody tr")).toHaveCount(22);
  await page.screenshot({
    path: "artifacts/products-desktop.png",
    fullPage: true,
  });
  await page.goto("/scan");
  await page.getByLabel("Штрих-код", { exact: true }).fill("1234567890123");
  await page.getByRole("button", { name: "Найти", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Проверка SANAQ", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Добавить в корзину", exact: true })
    .click();
  await page.getByRole("link", { name: "Перейти в кассу" }).click();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page.getByRole("button", { name: "Продать", exact: true }).click();
  await expect(
    page.getByText("Продажа завершена", { exact: false }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".kpi-value").first()).toHaveText("900 ₸");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("SANAQ-report.pdf");
  await download.saveAs("artifacts/SANAQ-report.pdf");
  await page.goto("/products");
  await page
    .getByRole("button", { name: "Удалить: Импорт тест", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Удалить", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(21);
  await context.setOffline(true);
  await page
    .getByRole("button", { name: "Добавить товар", exact: true })
    .click();
  await page.getByLabel("Название", { exact: true }).fill("Офлайн товар");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody tr")).toHaveCount(22);
  await context.setOffline(false);
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(22);
  await page.getByRole("button", { name: "Переключить язык" }).click();
  await expect(page.getByRole("heading", { name: /Тауарлар/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test("mobile routes fit viewport and menu works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/products", "/pos", "/scan", "/suppliers"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/mobile-${path.slice(1) || "dashboard"}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .locator("nav")
    .getByRole("link", { name: /Товары/ })
    .click();
  await expect(page).toHaveURL(/products/);
});
