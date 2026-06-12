import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FieldTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  invalid?: boolean;
  errors?: any[];
}

export function FieldTextarea({
  label,
  id,
  description,
  className,
  invalid,
  errors,
  ...textareaProps
}: FieldTextareaProps) {
  const textareaId = id ?? label;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    textareaProps.onChange?.(e);
  };

  return (
    <Field className={cn(" ", className)}>
      {label && (
        <FieldLabel data-invalid={invalid} htmlFor={textareaId}>
          {label}
        </FieldLabel>
      )}

      <Textarea
        data-invalid={invalid}
        aria-invalid={invalid}
        id={textareaId}
        value={textareaProps.value ?? ""}
        onChange={handleChange}
        {...textareaProps}
      />

      {description && <FieldDescription>{description}</FieldDescription>}

      {!!errors?.length && <FieldError errors={errors} />}
    </Field>
  );
}
