import { cn } from "../../lib/utils";
export function Card({ className, ...props }) {
  return <section className={cn("card", className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn("card-header", className)} {...props} />;
}
export function CardTitle(props) {
  return <h2 {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn("card-content", className)} {...props} />;
}
