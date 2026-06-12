import React, { ChangeEvent } from "react";
import { useFieldContext } from "..";
import { cn } from "@/lib/utils";
import { FieldTextarea } from "../../FieldTextarea";

interface TextAreaFieldProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value"
> {
  label?: string;
  description?: string;
}

export const TextAreaField = ({
  label,
  id,
  description,
  className,
  ...textareaProps
}: TextAreaFieldProps) => {
  const field = useFieldContext<string>();

  const { errors, isValid } = field.state.meta;

  const textareaId = id ?? label;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    field.handleChange(e.target.value);
    textareaProps.onChange?.(e);
  };

  return (
    <FieldTextarea
      {...textareaProps}
      id={textareaId}
      label={label}
      description={description}
      invalid={!isValid}
      value={field.state.value ?? ""}
      onChange={handleChange}
      errors={errors}
      className={cn("", className)}
    />
  );
};

TextAreaField.displayName = "TextAreaField";
