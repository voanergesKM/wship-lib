import { Loader2 } from "lucide-react";

export function ButtonSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0"
      data-icon="inline-start"
    >
      <Loader2 className="animate-spin" aria-hidden="true" />
    </span>
  );
}
