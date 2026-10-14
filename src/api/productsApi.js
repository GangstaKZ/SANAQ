import { db } from "../lib/dexie.js";
import { supabase } from "../lib/supabase.js";
import { demoProducts } from "../lib/demo.js";
let syncing;
export async function initialize() {
  if (!supabase && !(await db.meta.get("seeded")))
    await db.transaction("rw", db.products, db.meta, async () => {
      await db.products.bulkPut(
        demoProducts.map((p) => ({
          ...p,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        })),
      );
      await db.meta.put({ key: "seeded", value: true });
    });
}
export function validateProduct(p) {
  if (!p.name?.trim()) throw new Error("Укажите название товара");
  for (const key of ["quantity", "min_stock", "buy_price", "sell_price"])
    if (
      !Number.isFinite(Number(p[key])) ||
      Number(p[key]) < 0 ||
      (["quantity", "min_stock"].includes(key) &&
        !Number.isInteger(Number(p[key])))
    )
      throw new Error(
        "Остаток и минимум должны быть целыми, цены — неотрицательными",
      );
  return {
    id: p.id || crypto.randomUUID(),
    name: p.name.trim(),
    sku: p.sku?.trim() || "",
    barcode: p.barcode?.trim() || null,
    category: p.category?.trim() || "",
    quantity: Number(p.quantity),
    min_stock: Number(p.min_stock),
    buy_price: Number(p.buy_price),
    sell_price: Number(p.sell_price),
    created_at: p.created_at || new Date().toISOString(),
  };
}
async function enqueue(payload) {
  if (supabase)
    await db.queue.add({
      operation_id: crypto.randomUUID(),
      payload,
      created_at: new Date().toISOString(),
    });
}
export async function saveProducts(rows) {
  const products = rows.map(validateProduct);
  await db.transaction("rw", db.products, db.queue, async () => {
    const expected = {};
    for (const p of products) {
      expected[p.id] = (await db.products.get(p.id))?.quantity ?? null;
      if (!p.barcode) delete p.barcode;
    }
    await db.products.bulkPut(products);
    await enqueue({ type: "products", products, expected });
  });
}
export async function deleteProduct(id) {
  await db.transaction("rw", db.products, db.queue, async () => {
    await db.products.delete(id);
    await enqueue({ type: "delete", id });
  });
}
export async function sell(cart) {
  if (!cart.length) throw new Error("Корзина пуста");
  const saleId = crypto.randomUUID();
  await db.transaction("rw", db.products, db.movements, db.queue, async () => {
    const items = [];
    for (const row of cart) {
      const p = await db.products.get(row.id);
      if (
        !p ||
        !Number.isInteger(row.qty) ||
        row.qty < 1 ||
        p.quantity < row.qty
      )
        throw new Error(`Недостаточно товара: ${row.name}`);
      if (Number(p.sell_price) !== row.price)
        throw new Error(`Цена изменилась: ${row.name}. Добавьте товар заново.`);
      items.push({
        id: crypto.randomUUID(),
        product_id: p.id,
        product_name: p.name,
        type: "SALE",
        qty: row.qty,
        unit_price: Number(p.sell_price),
        sale_id: saleId,
        created_at: new Date().toISOString(),
      });
      await db.products.update(p.id, { quantity: p.quantity - row.qty });
    }
    await db.movements.bulkPut(items);
    await enqueue({ type: "sale", items });
  });
}
export async function saveSupplier(supplier) {
  const item = {
    id: supplier.id || crypto.randomUUID(),
    name: supplier.name.trim(),
    phone: supplier.phone.trim(),
  };
  if (!item.name) throw new Error("Укажите название");
  await db.transaction("rw", db.suppliers, db.queue, async () => {
    await db.suppliers.put(item);
    await enqueue({ type: "supplier", supplier: item });
  });
}
export async function syncData() {
  if (!supabase || !navigator.onLine) return;
  if (syncing) return syncing;
  syncing = (async () => {
    for (const entry of await db.queue.toArray()) {
      const { error } = await supabase.rpc("sanaq_apply", {
        operation_id: entry.operation_id,
        payload: entry.payload,
      });
      if (error) throw new Error(`Синхронизация: ${error.message}`);
      await db.queue.delete(entry.id);
    }
    const results = await Promise.all(
      ["products", "movements", "suppliers"].map((table) =>
        supabase.from(table).select("*"),
      ),
    );
    for (const result of results) if (result.error) throw result.error;
    await db.transaction(
      "rw",
      db.products,
      db.movements,
      db.suppliers,
      db.queue,
      async () => {
        if (await db.queue.count()) return;
        for (const [i, table] of [
          "products",
          "movements",
          "suppliers",
        ].entries()) {
          await db[table].clear();
          await db[table].bulkPut(
            results[i].data.map((row) => {
              if (table === "products" && !row.barcode) delete row.barcode;
              return row;
            }),
          );
        }
      },
    );
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}
export async function readData() {
  await initialize();
  return {
    products: await db.products.toArray(),
    movements: await db.movements.toArray(),
    suppliers: await db.suppliers.toArray(),
    pending: await db.queue.count(),
  };
}
