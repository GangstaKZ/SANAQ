import { useState } from "react";
import { Plus, Truck, Phone, Pencil } from "lucide-react";
import { useInventory } from "../hooks/useInventory";
import { useLanguage } from "../lib/i18n";
import { saveSupplier } from "../api/productsApi";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
export default function Suppliers() {
  const { suppliers, mutate, busy } = useInventory();
  const { t } = useLanguage();
  const [form, setForm] = useState(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ПАРТНЁРЫ МАГАЗИНА</p>
          <h1>{t("Поставщики")}</h1>
          <p>{t("Контакты ваших партнёров в одном месте.")}</p>
        </div>
        <Button onClick={() => setForm({ name: "", phone: "" })}>
          <Plus size={18} />
          {t("Добавить поставщика")}
        </Button>
      </div>
      {suppliers.length ? (
        <div className="supplier-grid">
          {suppliers.map((s) => (
            <Card key={s.id} className="supplier-card">
              <span className="product-icon">
                <Truck size={24} />
              </span>
              <h2>{s.name}</h2>
              <p>
                <Phone size={16} />
                {s.phone || "Телефон не указан"}
              </p>
              <Button variant="outline" onClick={() => setForm(s)}>
                <Pencil size={15} />
                Изменить
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="empty-state">
            <Truck size={42} />
            <h3>Ваши партнёры будут здесь</h3>
            <p>
              Добавьте первого поставщика, чтобы держать контакты под рукой.
            </p>
            <Button onClick={() => setForm({ name: "", phone: "" })}>
              <Plus size={16} />
              {t("Добавить поставщика")}
            </Button>
          </div>
        </Card>
      )}
      <Dialog open={!!form} onOpenChange={(open) => !open && setForm(null)}>
        <DialogContent>
          <DialogTitle>{t("Поставщики")}</DialogTitle>
          <DialogDescription>
            Название компании и контактный телефон.
          </DialogDescription>
          {form && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await mutate(() => saveSupplier(form), "Поставщик сохранён")
                )
                  setForm(null);
              }}
            >
              <div className="form-grid">
                <label>
                  {t("Название")}
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  {t("Телефон")}
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="dialog-actions">
                <Button disabled={busy}>{t("Сохранить")}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
