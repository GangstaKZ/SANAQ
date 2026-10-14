import "fake-indexeddb/auto";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/dexie.js";
import {
  initialize,
  saveProducts,
  sell,
  deleteProduct,
  validateProduct,
} from "../src/api/productsApi.js";
import { getAnalytics } from "../src/lib/analytics.js";
const item = (overrides = {}) => ({
  name: "Тестовый товар",
  sku: "T01",
  barcode: "test-001",
  quantity: 4,
  min_stock: 5,
  buy_price: 100,
  sell_price: 200,
  category: "Тест",
  ...overrides,
});
test("local inventory and atomic checkout", async () => {
  await db.delete();
  await db.open();
  await initialize();
  assert.equal(await db.products.count(), 20);
  await initialize();
  assert.equal(await db.products.count(), 20);
  await db.products.clear();
  await saveProducts([item()]);
  const p = await db.products.toCollection().first();
  await assert.rejects(saveProducts([item({ name: "Duplicate" })]));
  assert.equal(await db.products.count(), 1);
  await saveProducts([item({ id: p.id, barcode: "" })]);
  assert.equal((await db.products.get(p.id)).barcode, undefined);
  await saveProducts([
    item({ id: p.id }),
    item({ barcode: "test-002", quantity: 1 }),
  ]);
  const second = await db.products.where("barcode").equals("test-002").first();
  await assert.rejects(
    sell([
      { id: p.id, name: p.name, qty: 2, price: 200 },
      { id: second.id, name: second.name, qty: 2, price: 200 },
    ]),
  );
  assert.equal((await db.products.get(p.id)).quantity, 4);
  assert.equal(await db.movements.count(), 0);
  await assert.rejects(sell([{ id: p.id, name: p.name, qty: 1, price: 199 }]));
  await sell([{ id: p.id, name: p.name, qty: 2, price: 200 }]);
  assert.equal((await db.products.get(p.id)).quantity, 2);
  const movements = await db.movements.toArray();
  assert.equal(movements.length, 1);
  assert.equal(movements[0].unit_price, 200);
  const stats = getAnalytics(await db.products.toArray(), movements);
  assert.equal(stats.today, 400);
  assert.equal(stats.low.length, 2);
  assert.equal(stats.days.length, 7);
  await deleteProduct(p.id);
  assert.equal(await db.movements.count(), 1);
  assert.equal(getAnalytics([], movements).today, 400);
});
test("reject invalid inventory values", () => {
  for (const bad of [
    { quantity: -1 },
    { quantity: 1.5 },
    { sell_price: "invalid" },
    { min_stock: -2 },
    { name: " " },
  ])
    assert.throws(() => validateProduct(item(bad)));
});
after(async () => {
  await db.delete();
});
