import React, { ChangeEvent } from "react";
import { useFieldContext } from "..";
import { cn } from "@/lib/utils";
import { FieldInput } from "../../FieldInput";

interface TextFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value"
> {
  label?: string;
  description?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const TextField = ({
  label,
  id,
  description,
  className,
  ...inputProps
}: TextFieldProps) => {
  const field = useFieldContext<string>();

  const { errors, isValid } = field.state.meta;

  const inputId = id ?? label;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    field.handleChange(e.target.value);
    inputProps.onChange?.(e);
  };

  return (
    <FieldInput
      {...inputProps}
      id={inputId}
      label={label}
      description={description}
      invalid={!isValid}
      value={field.state.value ?? ""}
      onChange={handleChange}
      errors={errors}
      className={cn("", className)}
      startAdornment={inputProps.startAdornment}
      endAdornment={inputProps.endAdornment}
    />
  );
};

TextField.displayName = "TextField";
