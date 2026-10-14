import { dayKey } from "./utils.js";
export function getAnalytics(products, movements, now = new Date()) {
  const sales = movements.filter((m) => m.type === "SALE");
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - 6 + i);
    const key = dayKey(d);
    return {
      key,
      label: d.toLocaleDateString("ru-KZ", { day: "numeric", month: "short" }),
      value: sales
        .filter((s) => dayKey(s.created_at) === key)
        .reduce((sum, s) => sum + Number(s.unit_price || 0) * s.qty, 0),
    };
  });
  return {
    days,
    today: days[6].value,
    week: days.reduce((s, d) => s + d.value, 0),
    stockValue: products.reduce(
      (s, p) => s + Number(p.buy_price) * p.quantity,
      0,
    ),
    units: products.reduce((s, p) => s + p.quantity, 0),
    low: products
      .filter((p) => p.quantity <= p.min_stock)
      .sort((a, b) => a.quantity - a.min_stock - (b.quantity - b.min_stock)),
    salesToday: sales.filter((s) => dayKey(s.created_at) === dayKey(now)),
    recent: [...sales]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5),
  };
}
