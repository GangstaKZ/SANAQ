import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowRight,
  Download,
  Wallet,
  Package,
  TriangleAlert,
  Layers,
  Plus,
  CalendarDays,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { useLanguage } from "../lib/i18n";
import { getAnalytics } from "../lib/analytics";
import { money } from "../lib/utils";
import { exportPdf } from "../lib/exportPdf";
import KpiCard from "../components/KpiCard";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
export default function Dashboard() {
  const { products, movements, setNotice } = useInventory();
  const { t, lang } = useLanguage();
  const data = getAnalytics(products, movements);
  const { low, days, today, week, stockValue, units, recent, salesToday } =
    data;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SANAQ · {t("Сегодня").toUpperCase()}</p>
          <h1>
            {t("Обзор")}
            <span className="heading-dot">.</span>
          </h1>
          <p>{t("Ваш магазин в цифрах. Всё важное — на одном экране.")}</p>
        </div>
        <div className="page-actions">
          <span className="date-label">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString(lang === "kk" ? "kk-KZ" : "ru-KZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button
            variant="outline"
            onClick={() => exportPdf(data).catch((e) => setNotice(e.message))}
          >
            <Download size={17} />
            {t("Экспорт PDF")}
          </Button>
        </div>
      </div>
      <div className="welcome-banner">
        <div>
          <span className="welcome-label">
            <span className="live-dot" />
            {t("Склад под контролем")}
          </span>
          <h2>
            {lang === "ru"
              ? "Большой порядок для малого бизнеса."
              : "Шағын бизнеске үлкен тәртіп."}
          </h2>
          <p>
            {lang === "ru"
              ? "Товары, продажи и остатки — всё на своём месте."
              : "Тауарлар, сатылымдар, қалдықтар — бәрі өз орнында."}
          </p>
          <Button asChild>
            <Link to="/pos">
              <Plus size={17} />
              {lang === "ru" ? "Новая продажа" : "Жаңа сатылым"}
              <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-circle" />
          <div className="art-box box-back">
            <Package />
          </div>
          <div className="art-box box-front">
            <Package />
            <div className="barcode-lines" />
          </div>
          <div className="art-check">
            <CheckCircle2 size={30} />
          </div>
          <span className="art-spark">+</span>
        </div>
      </div>
      <div className="kpi-grid">
        <KpiCard
          title={t("Продажи сегодня")}
          value={money(today)}
          icon={Wallet}
          description={`${new Set(salesToday.map((s) => s.sale_id || s.id)).size} продаж за сегодня`}
          tone="kpi-green"
        />
        <KpiCard
          title={t("Товаров мало")}
          value={low.length}
          icon={TriangleAlert}
          description={
            low.length ? "Пора пополнить запасы" : "Все остатки в норме"
          }
          tone="kpi-amber"
        />
        <KpiCard
          title={t("Стоимость склада")}
          value={money(stockValue)}
          icon={Layers}
          description="По закупочной стоимости"
        />
        <KpiCard
          title={t("Всего товаров")}
          value={products.length}
          icon={Package}
          description={`${units} единиц на складе`}
        />
      </div>
      <div className="dashboard-grid">
        <Card className="sales-chart">
          <div className="card-header">
            <div>
              <h2>{t("Продажи за неделю")}</h2>
              <p>Динамика выручки вашего магазина</p>
            </div>
            <span className="subtle-chip">{t("Последние 7 дней")}</span>
          </div>
          <div className="chart-summary">
            <strong>{money(week)}</strong>
            <span>
              <span className="legend-dot" />
              Выручка
            </span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={days}
                margin={{ top: 15, right: 15, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#19bd75" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#19bd75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 5"
                  vertical={false}
                  stroke="#e9edf2"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8b96a5" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#8b96a5" }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                  width={48}
                  domain={[0, (max) => Math.max(max, 1000)]}
                />
                <Tooltip
                  formatter={(v) => [money(v), "Выручка"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5eaf0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#16b876"
                  strokeWidth={3}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!week && (
            <p className="chart-empty-note">
              Первая продажа появится здесь сразу после оформления на кассе.
            </p>
          )}
        </Card>
        <Card className="attention-card">
          <div className="card-header">
            <div>
              <h2>{t("Требуют внимания")}</h2>
              <p>Топ-5 товаров с низким остатком</p>
            </div>
            <span className="attention-icon">
              <TriangleAlert size={19} />
            </span>
          </div>
          <div className="attention-list">
            {low.length ? (
              low.slice(0, 5).map((p) => (
                <div className="attention-item" key={p.id}>
                  <span className="product-icon">
                    <Package size={18} />
                  </span>
                  <div>
                    <strong>{p.name}</strong>
                    <small>
                      Минимум: {p.min_stock} {t("шт.")}
                    </small>
                  </div>
                  <Badge variant={p.quantity === 0 ? "danger" : "warning"}>
                    {p.quantity} {t("шт.")}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <CheckCircle2 />
                <p>Все товары в достатке</p>
              </div>
            )}
          </div>
          <Link className="card-bottom-link" to="/products?status=low">
            {t("Открыть каталог")}
            <ArrowRight size={16} />
          </Link>
        </Card>
      </div>
      <Card className="recent-card">
        <div className="card-header">
          <div>
            <h2>{lang === "ru" ? "Последние продажи" : "Соңғы сатылымдар"}</h2>
            <p>Последние 5 проданных позиций</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/pos">
              {t("Касса")}
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        </div>
        {recent.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Товар")}</th>
                  <th>Количество</th>
                  <th>Сумма</th>
                  <th>Время</th>
                  <th>{t("Статус")}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="product-name">
                        <span className="product-icon">
                          <ShoppingBag size={17} />
                        </span>
                        <strong>
                          {s.product_name ||
                            products.find((p) => p.id === s.product_id)?.name ||
                            "Удалённый товар"}
                        </strong>
                      </div>
                    </td>
                    <td>
                      {s.qty} {t("шт.")}
                    </td>
                    <td className="price-cell">
                      {money(s.qty * s.unit_price)}
                    </td>
                    <td>
                      {new Date(s.created_at).toLocaleString("ru-KZ", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <Badge variant="success">Сохранено</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="recent-empty">
            <span className="product-icon">
              <ShoppingBag size={22} />
            </span>
            <div>
              <strong>История продаж начинается здесь</strong>
              <p>Оформите первую продажу — мы сохраним все детали.</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/pos">
                Открыть кассу
                <ArrowRight size={15} />
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}
