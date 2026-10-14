import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InventoryProvider } from "./hooks/useInventory";
import { LanguageProvider } from "./lib/i18n";
import Layout from "./components/Layout";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const POS = lazy(() => import("./pages/POS"));
const Scan = lazy(() => import("./pages/Scan"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, networkMode: "always" },
  },
});
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <InventoryProvider>
          <BrowserRouter>
            <Suspense
              fallback={<div className="empty-state">SANAQ · Загрузка…</div>}
            >
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="pos" element={<POS />} />
                  <Route path="scan" element={<Scan />} />
                  <Route path="suppliers" element={<Suppliers />} />
                  <Route
                    path="*"
                    element={
                      <div className="empty-state">
                        Страница не найдена. <Link to="/">На главную</Link>
                      </div>
                    }
                  />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </InventoryProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
