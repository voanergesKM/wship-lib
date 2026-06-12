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

  const getIsDisabled = (disabledField: boolean): boolean => {
    return disabled || disabledField;
  };

  return (
    <form.Subscribe
      selector={(state) => [state.isSubmitting, state.canSubmit]}
    >
      {([isSubmitting, canSubmit]) => {
        const isFormDisabled = isSubmitting || !canSubmit;
        const disabled = getIsDisabled(isFormDisabled);

        return (
          <Button
            type="button"
            aria-disabled={disabled}
            onClick={form.handleSubmit}
            disabled={disabled}
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
