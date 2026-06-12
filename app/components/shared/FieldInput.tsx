import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  invalid?: boolean;
  errors?: any[];
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export function FieldInput({
  label,
  id,
  description,
  className,
  invalid,
  errors,
  startAdornment,
  endAdornment,
  ...inputProps
}: FieldInputProps) {
  const inputId = id ?? label;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    inputProps.onChange?.(e);
  };

  return (
    <Field className={cn(" ", className)}>
      {label && (
        <FieldLabel data-invalid={invalid} htmlFor={inputId}>
          {label}
        </FieldLabel>
      )}

      <div className="relative flex items-center">
        {startAdornment && (
          <div className="pointer-events-none absolute left-3 flex items-center justify-center text-muted-foreground">
            {startAdornment}
          </div>
        )}
        <Input
          data-invalid={invalid}
          aria-invalid={invalid}
          id={inputId}
          value={inputProps.value ?? ""}
          onChange={handleChange}
          className={cn(startAdornment && "pl-10", endAdornment && "pr-10")}
          {...inputProps}
        />
        {endAdornment && (
          <div className="pointer-events-none absolute right-3 flex items-center justify-center text-muted-foreground">
            {endAdornment}
          </div>
        )}
      </div>

      {description && <FieldDescription>{description}</FieldDescription>}

      {!!errors?.length && <FieldError errors={errors} />}
    </Field>
  );
}
