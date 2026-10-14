import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Upload,
  Search,
  Package,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { useDebounce } from "../hooks/useDebounce";
import { saveProducts, deleteProduct } from "../api/productsApi";
import { useLanguage } from "../lib/i18n";
import ProductTable from "../components/ProductTable";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
const blank = {
  name: "",
  sku: "",
  barcode: "",
  quantity: 0,
  min_stock: 5,
  buy_price: 0,
  sell_price: 0,
  category: "",
};
export default function Products() {
  const { products, mutate, busy, setNotice } = useInventory();
  const { t } = useLanguage();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "all";
  const [search, setSearch] = useState("");
  const term = useDebounce(search).toLowerCase();
  const [form, setForm] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [category, setCategory] = useState("");
  const file = useRef();
  const low = products.filter((p) => p.quantity <= p.min_stock);
  const filtered = products.filter(
    (p) =>
      `${p.name} ${p.sku} ${p.barcode}`.toLowerCase().includes(term) &&
      (!category || p.category === category) &&
      (status === "all" ||
        (status === "low"
          ? p.quantity <= p.min_stock
          : status === "out"
            ? p.quantity === 0
            : p.quantity > p.min_stock)),
  );
  const submit = async (e) => {
    e.preventDefault();
    if (await mutate(() => saveProducts([form]), "Товар сохранён"))
      setForm(null);
  };
  const importFile = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;
    try {
      if (picked.size > 5 * 1024 * 1024)
        throw new Error("Максимальный размер файла — 5 МБ");
      const XLSX = await import("xlsx");
      const book = XLSX.read(await picked.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], {
        defval: "",
      });
      if (!rows.length) throw new Error("Файл пуст");
      const mapped = rows.map((r, i) => {
        const p = {};
        for (const [key, ru] of Object.entries({
          name: "Название",
          sku: "Артикул",
          barcode: "Штрих-код",
          quantity: "Остаток",
          min_stock: "Минимальный остаток",
          buy_price: "Цена закупки",
          sell_price: "Цена продажи",
          category: "Категория",
        }))
          p[key] = r[key] ?? r[ru] ?? blank[key];
        p.barcode = String(p.barcode);
        p.sku = String(p.sku);
        p.name = String(p.name);
        p.category = String(p.category);
        if (!p.name) throw new Error(`Строка ${i + 2}: нет названия`);
        const existing = products.find(
          (x) => p.barcode && x.barcode === p.barcode,
        );
        return {
          ...p,
          ...(existing
            ? { id: existing.id, created_at: existing.created_at }
            : {}),
        };
      });
      const codes = mapped.map((p) => p.barcode).filter(Boolean);
      if (new Set(codes).size !== codes.length)
        throw new Error("В файле повторяются штрих-коды");
      await mutate(
        () => saveProducts(mapped),
        `Импортировано товаров: ${mapped.length}`,
      );
    } catch (err) {
      setNotice(err.message);
    }
  };
  const template = async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet([
      {
        name: "Пример товара",
        sku: "SKU001",
        barcode: "487000100021",
        quantity: 10,
        min_stock: 5,
        buy_price: 300,
        sell_price: 450,
        category: "Бакалея",
      },
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Товары");
    XLSX.writeFile(book, "SANAQ-template.xlsx");
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">КАТАЛОГ МАГАЗИНА</p>
          <h1>
            {t("Товары")} <span className="title-count">{products.length}</span>
          </h1>
          <p>{t("Управляйте ассортиментом и следите за остатками.")}</p>
        </div>
        <div className="page-actions">
          <Button
            variant="outline"
            onClick={() => file.current.click()}
            disabled={busy}
          >
            <Upload size={17} />
            {t("Импорт Excel")}
          </Button>
          <input
            hidden
            ref={file}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={importFile}
          />
          <Button onClick={() => setForm({ ...blank })}>
            <Plus size={18} />
            {t("Добавить товар")}
          </Button>
        </div>
      </div>
      {low.length > 0 && (
        <div className="inventory-alert">
          <div className="alert-symbol">!</div>
          <div>
            <strong>
              {t("Нужно заказать")}: {low.length}
            </strong>
            <p>
              Проверьте товары с низким остатком и пополните запасы вовремя.
            </p>
          </div>
          <Button variant="ghost" onClick={() => setParams({ status: "low" })}>
            Посмотреть →
          </Button>
        </div>
      )}
      <Card className="catalog-card">
        <div className="catalog-tabs">
          {[
            ["all", "Все товары", products.length],
            ["low", "Заканчиваются", low.length],
            [
              "out",
              "Нет в наличии",
              products.filter((p) => !p.quantity).length,
            ],
          ].map(([key, label, count]) => (
            <button
              key={key}
              className={status === key ? "active" : ""}
              onClick={() => setParams({ status: key })}
            >
              {t(label)}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={18} />
            <Input
              placeholder={t("Поиск товара…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("Поиск товара…")}
            />
          </div>
          <div className="filter-field">
            <SlidersHorizontal size={16} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label={t("Категория")}
            >
              <option value="">Все категории</option>
              {[
                ...new Set(products.map((p) => p.category).filter(Boolean)),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={template}>
            <Download size={16} />
            Шаблон Excel
          </Button>
        </div>
        {filtered.length ? (
          <ProductTable
            products={filtered}
            onEdit={setForm}
            onDelete={setRemoving}
          />
        ) : (
          <div className="empty-state">
            <Package size={36} />
            <h3>{t("Нет результатов")}</h3>
            <p>Измените поиск или добавьте первый товар.</p>
          </div>
        )}
        <div className="table-footer">
          Показано {filtered.length} из {products.length} товаров
          <span>Остатки обновляются автоматически</span>
        </div>
      </Card>
      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogTitle>
            {t(form?.id ? "Редактировать товар" : "Новый товар")}
          </DialogTitle>
          <DialogDescription>
            Укажите данные товара и минимальный запас.
          </DialogDescription>
          {form && (
            <form onSubmit={submit}>
              <div className="form-grid">
                {Object.entries({
                  name: "Название",
                  sku: "Артикул",
                  barcode: "Штрих-код",
                  category: "Категория",
                  quantity: "Остаток",
                  min_stock: "Минимальный остаток",
                  buy_price: "Цена закупки",
                  sell_price: "Цена продажи",
                }).map(([key, label]) => (
                  <label key={key}>
                    {t(label)}
                    <Input
                      value={form[key] ?? ""}
                      required={key === "name"}
                      type={
                        [
                          "quantity",
                          "min_stock",
                          "buy_price",
                          "sell_price",
                        ].includes(key)
                          ? "number"
                          : "text"
                      }
                      min="0"
                      step={key.includes("price") ? "0.01" : "1"}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="dialog-actions">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setForm(null)}
                >
                  {t("Отмена")}
                </Button>
                <Button disabled={busy}>{t("Сохранить")}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <DialogContent>
          <DialogTitle>Удалить товар?</DialogTitle>
          <DialogDescription>
            «{removing?.name}» будет удалён из каталога. Это действие нельзя
            отменить.
          </DialogDescription>
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setRemoving(null)}>
              {t("Отмена")}
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(() => deleteProduct(removing.id), "Товар удалён")
                )
                  setRemoving(null);
              }}
            >
              {t("Удалить")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
