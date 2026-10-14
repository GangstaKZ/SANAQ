import { Card } from "./ui/card";
export default function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "",
}) {
  return (
    <Card className={`kpi ${tone}`}>
      <div className="kpi-top">
        <span>{title}</span>
        <span className="kpi-icon">
          <Icon size={20} />
        </span>
      </div>
      <strong className="kpi-value">{value}</strong>
      <p>{description}</p>
    </Card>
  );
}
