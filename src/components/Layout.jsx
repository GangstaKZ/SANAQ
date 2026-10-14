import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  ShoppingCart,
  Truck,
  Bell,
  Menu,
  X,
  ChevronRight,
  Wifi,
  WifiOff,
  Store,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import SanaqLogo from "./SanaqLogo";
import { useInventory } from "../hooks/useInventory";
import { useLanguage } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
const navigation = [
  ["/", "Обзор", LayoutDashboard],
  ["/products", "Товары", Package],
  ["/pos", "Касса", ShoppingCart],
  ["/scan", "Сканер", ScanLine],
  ["/suppliers", "Поставщики", Truck],
];
export default function Layout() {
  const [open, setOpen] = useState(false);
  const { products, online, pending, notice, syncError, sync, loading, error } =
    useInventory();
  const { t, lang, setLang } = useLanguage();
  const low = products.filter((p) => p.quantity <= p.min_stock).length;
  return (
    <div className="app-shell">
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <Link to="/" className="sidebar-brand">
          <SanaqLogo light />
        </Link>
        <button
          className="mobile-close"
          onClick={() => setOpen(false)}
          aria-label="Закрыть меню"
        >
          <X />
        </button>
        <div className="workspace">
          <span className="store-icon">
            <Store size={20} />
          </span>
          <div>
            <strong>Мой магазин</strong>
            <small>Рабочее пространство</small>
          </div>
          <ChevronRight size={16} />
        </div>
        <p className="nav-caption">
          {lang === "ru" ? "УПРАВЛЕНИЕ" : "БАСҚАРУ"}
        </p>
        <nav>
          {navigation.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={() => setOpen(false)}
            >
              <Icon size={20} />
              <span>{t(label)}</span>
              {path === "/products" && (
                <span className="nav-count">{products.length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">
              <ScanLine size={24} />
            </span>
            <strong>
              {lang === "ru"
                ? "Меньше рутины. Больше дела."
                : "Аз жұмыс. Көп нәтиже."}
            </strong>
            <p>
              {lang === "ru"
                ? "Наведите камеру на штрих-код, чтобы найти товар."
                : "Тауарды табу үшін штрихкодты сканерлеңіз."}
            </p>
            <Link to="/scan">
              {t("Сканер")} <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="sidebar-footer">
            <span className="avatar">S</span>
            <div>
              <strong>SANAQ Workspace</strong>
              <small>Малый бизнес · Казахстан</small>
            </div>
            <span className="live-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header>
          <div className="header-left">
            <Button
              variant="ghost"
              size="icon"
              className="menu-button"
              onClick={() => setOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu />
            </Button>
            <SanaqLogo />
            <span className="header-divider" />
            <span className="header-label">{t("Управление магазином")}</span>
          </div>
          <div className="header-actions">
            <Link className="stock-alert" to="/products?status=low">
              <Bell size={16} />
              <span>
                {t("Нужно заказать")}: <b>{low}</b>
              </span>
            </Link>
            <button
              className="language"
              onClick={() => setLang(lang === "ru" ? "kk" : "ru")}
              aria-label="Переключить язык"
            >
              {lang.toUpperCase()} <span>⌄</span>
            </button>
            <div className="avatar header-avatar">S</div>
          </div>
        </header>
        <main>
          <div className="connection-line">
            <span>
              <span className={`status-dot ${online ? "" : "offline"}`} />
              {supabase
                ? online
                  ? "Supabase · онлайн"
                  : "Офлайн · изменения на устройстве"
                : lang === "ru"
                  ? "Локальный магазин · данные на этом устройстве"
                  : "Жергілікті дүкен · деректер осы құрылғыда"}
            </span>
            <span>
              {pending > 0
                ? `Ожидают синхронизации: ${pending}`
                : "SANAQ / " + t("Склад под контролем")}
              {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            </span>
          </div>
          {syncError && (
            <div className="error-banner">
              <span>
                {syncError}. Изменения сохранены на устройстве; очередь ожидает
                отправки.
              </span>
              <Button variant="outline" size="sm" onClick={sync}>
                <RefreshCw size={14} />
                Повторить
              </Button>
            </div>
          )}
          {error ? (
            <div className="error-banner">{error}</div>
          ) : loading ? (
            <div className="empty-state">Загружаем ваш магазин…</div>
          ) : (
            <Outlet />
          )}
          <footer>
            SANAQ <span>барлық тауар бақылауда</span>
            <span>Сделано для вашего бизнеса</span>
          </footer>
        </main>
      </div>
      {notice && (
        <div role="status" className="toast">
          {notice}
        </div>
      )}
    </div>
  );
}
