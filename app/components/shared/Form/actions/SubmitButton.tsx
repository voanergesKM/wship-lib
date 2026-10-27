import { Button } from "@/components/ui/button";
import { useFormContext } from "..";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "lg" | "icon";
};

export const SubmitButton = ({ label, disabled, size, className }: Props) => {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
      {([isSubmitting, canSubmit]) => {
        const isDisabled = disabled || !canSubmit;

        return (
          <Button
            type="button"
            aria-disabled={isDisabled || isSubmitting}
            isLoading={isSubmitting}
            onClick={form.handleSubmit}
            disabled={isDisabled}
            size={size}
            className={cn(className, "px-10")}
          >
            {label}
          </Button>
        );
      }}
    </form.Subscribe>
  );
};
