import { Pencil, Trash2, Package } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { money } from "../lib/utils";
import { useLanguage } from "../lib/i18n";
export default function ProductTable({ products, onEdit, onDelete }) {
  const { t } = useLanguage();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {["Товар", "Категория", "Остаток", "Цена продажи", "Статус", ""].map(
            (x, i) => (
              <TableHead key={i}>{t(x)}</TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow
            key={p.id}
            className={p.quantity <= p.min_stock ? "low-row" : ""}
          >
            <TableCell>
              <div className="product-name">
                <span className="product-icon">
                  <Package size={19} />
                </span>
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    {p.sku || "—"} <span>·</span>{" "}
                    {p.barcode || "Без штрих-кода"}
                  </small>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="category">{p.category || "—"}</span>
            </TableCell>
            <TableCell>
              <strong
                className={p.quantity <= p.min_stock ? "danger-text" : ""}
              >
                {p.quantity} {t("шт.")}
              </strong>
              <small className="stock-min">min: {p.min_stock}</small>
            </TableCell>
            <TableCell className="price-cell">{money(p.sell_price)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  p.quantity === 0
                    ? "danger"
                    : p.quantity <= p.min_stock
                      ? "warning"
                      : "success"
                }
              >
                <span className="badge-dot" />
                {t(
                  p.quantity === 0
                    ? "Нет в наличии"
                    : p.quantity <= p.min_stock
                      ? "Заканчиваются"
                      : "В наличии",
                )}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="row-actions">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t("Редактировать товар")}: ${p.name}`}
                  onClick={() => onEdit(p)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t("Удалить")}: ${p.name}`}
                  onClick={() => onDelete(p)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
