import { useState } from "react";
import { Link } from "react-router-dom";
import { ScanLine, Package, ArrowRight, Search } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import { useInventory } from "../hooks/useInventory";
import { useInventoryStore } from "../store/useInventoryStore";
import { useLanguage } from "../lib/i18n";
import { money } from "../lib/utils";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
export default function Scan() {
  const { products, setNotice } = useInventory();
  const { add, cart } = useInventoryStore();
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(null);
  const product = products.find((p) => p.barcode === searched);
  const find = (text) => {
    setCode(text);
    setSearched(text.trim());
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">БЫСТРЫЙ ПОИСК</p>
          <h1>{t("Сканер")}</h1>
          <p>{t("Найдите товар по штрих-коду.")}</p>
        </div>
        <span className="page-pill">
          <ScanLine size={16} />
          Камера или ручной ввод
        </span>
      </div>
      <div className="scan-layout">
        <Card className="scan-card">
          <BarcodeScanner onScan={find} />
          <div className="or-divider">или введите код вручную</div>
          <form
            className="barcode-form"
            onSubmit={(e) => {
              e.preventDefault();
              find(code);
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="Например, 487000100001"
              aria-label={t("Штрих-код")}
            />
            <Button>
              <Search size={17} />
              {t("Найти")}
            </Button>
          </form>
        </Card>
        <Card className="scan-result">
          <div className="card-header">
            <h2>Результат поиска</h2>
          </div>
          {product ? (
            <div className="result-content">
              <span className="large-product-icon">
                <Package size={36} />
              </span>
              <p className="eyebrow">{product.category}</p>
              <h2>{product.name}</h2>
              <p className="muted">{product.barcode}</p>
              <dl>
                <div>
                  <dt>{t("Остаток")}</dt>
                  <dd>
                    {product.quantity} {t("шт.")}
                  </dd>
                </div>
                <div>
                  <dt>{t("Цена продажи")}</dt>
                  <dd>{money(product.sell_price)}</dd>
                </div>
              </dl>
              <Button
                disabled={
                  product.quantity < 1 ||
                  (cart.find((x) => x.id === product.id)?.qty || 0) >=
                    product.quantity
                }
                onClick={() => {
                  add(product);
                  setNotice("Товар добавлен в корзину");
                }}
              >
                {t("Добавить в корзину")}
              </Button>
              <Link className="text-link" to="/pos">
                Перейти в кассу <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="empty-state">
              <ScanLine size={44} />
              <h3>{searched ? "Товар не найден" : "Готовы к сканированию"}</h3>
              <p>
                {searched
                  ? `Код ${searched} отсутствует в каталоге.`
                  : "Здесь появятся название, цена и остаток товара."}
              </p>
              {searched && (
                <Button asChild variant="outline">
                  <Link to="/products">{t("Открыть каталог")}</Link>
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
