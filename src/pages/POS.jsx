import { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { useInventoryStore } from "../store/useInventoryStore";
import { sell } from "../api/productsApi";
import { money } from "../lib/utils";
import { useLanguage } from "../lib/i18n";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
export default function POS() {
  const { products, mutate, busy } = useInventory();
  const { t } = useLanguage();
  const { cart, add, change, remove, clear } = useInventoryStore();
  const [search, setSearch] = useState("");
  const [receipt, setReceipt] = useState(null);
  const filtered = products.filter((p) =>
    `${p.name} ${p.barcode} ${p.sku}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const total = cart.reduce((s, p) => s + p.price * p.qty, 0);
  const checkout = async () => {
    if (await mutate(() => sell(cart), "Продажа сохранена")) {
      setReceipt({ total, count: cart.reduce((s, p) => s + p.qty, 0) });
      clear();
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ТОЧКА ПРОДАЖИ</p>
          <h1>{t("Касса")}</h1>
          <p>{t("Быстрые продажи, точный учёт.")}</p>
        </div>
        <span className="page-pill">
          <ShoppingCart size={16} /> SANAQ POS
        </span>
      </div>
      {receipt && (
        <div className="success-banner">
          <CheckCircle2 size={20} />
          Продажа завершена · {receipt.count} шт. · {money(receipt.total)}
          <button onClick={() => setReceipt(null)}>×</button>
        </div>
      )}
      <div className="pos-layout">
        <section>
          <div className="search-field pos-search">
            <Search size={18} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Поиск товара…")}
              aria-label={t("Поиск товара…")}
            />
          </div>
          <div className="product-grid">
            {filtered.map((p) => (
              <button
                className="pos-product"
                key={p.id}
                disabled={!p.quantity || busy}
                onClick={() => add(p)}
              >
                <div className="pos-product-top">
                  <span className="product-icon">
                    <Package size={22} />
                  </span>
                  <span
                    className={p.quantity <= p.min_stock ? "danger-text" : ""}
                  >
                    {p.quantity} {t("шт.")}
                  </span>
                </div>
                <small>{p.category || "Товар"}</small>
                <strong>{p.name}</strong>
                <div>
                  <b>{money(p.sell_price)}</b>
                  <span className="add-icon">
                    <Plus size={16} />
                  </span>
                </div>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty-state">{t("Нет результатов")}</div>
          )}
        </section>
        <Card className="cart">
          <div className="card-header">
            <h2>
              <ShoppingCart size={20} />
              {t("Корзина")} <span>{cart.length}</span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              disabled={!cart.length || busy}
              onClick={clear}
            >
              {t("Очистить")}
            </Button>
          </div>
          {cart.length ? (
            <div className="cart-items">
              {cart.map((p) => (
                <div className="cart-item" key={p.id}>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      {money(p.price)} / {t("шт.")}
                    </small>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить ${p.name}`}
                    disabled={busy}
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <div className="quantity-control">
                    <button
                      disabled={busy}
                      aria-label="Уменьшить"
                      onClick={() =>
                        change(
                          p.id,
                          p.qty - 1,
                          products.find((x) => x.id === p.id)?.quantity || 0,
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{p.qty}</span>
                    <button
                      disabled={busy}
                      aria-label="Увеличить"
                      onClick={() =>
                        change(
                          p.id,
                          p.qty + 1,
                          products.find((x) => x.id === p.id)?.quantity || 0,
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <b>{money(p.price * p.qty)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <ShoppingCart size={40} />
              <h3>{t("Корзина пуста")}</h3>
              <p>{t("Добавьте товары из каталога")}</p>
            </div>
          )}
          <div className="cart-total">
            <div>
              <span>{t("Итого")}</span>
              <strong>{money(total)}</strong>
            </div>
            <Button disabled={!cart.length || busy} onClick={checkout}>
              <CheckCircle2 size={18} />
              {busy ? "Сохраняем…" : t("Продать")}
            </Button>
            <p>Остатки спишутся после продажи</p>
          </div>
        </Card>
      </div>
    </>
  );
}
