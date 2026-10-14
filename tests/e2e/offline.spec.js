import { test, expect } from "@playwright/test";
test.use({ baseURL: "http://localhost:4173" });
test("production PWA reloads and sells without a network", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Обзор.");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  await context.setOffline(true);
  await page.goto("/products");
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await page.goto("/pos");
  await page.getByRole("button", { name: /Молоко 3.2%/ }).click();
  await page.getByRole("button", { name: "Продать", exact: true }).click();
  await expect(
    page.getByText("Продажа завершена", { exact: false }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".kpi-value").first()).toHaveText("450 ₸");
  await page.reload();
  await expect(page.locator(".kpi-value").first()).toHaveText("450 ₸");
});
