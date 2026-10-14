import { cn } from "../../lib/utils";
export function Badge({ className, variant = "default", ...props }) {
  return (
    <span className={cn("badge", `badge-${variant}`, className)} {...props} />
  );
}
