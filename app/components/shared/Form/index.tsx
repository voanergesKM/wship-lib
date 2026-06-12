import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

import * as fields from "./fields";
import * as actions from "./actions";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withFieldGroup } = createFormHook({
  fieldComponents: { ...fields },
  formComponents: { ...actions },
  fieldContext,
  formContext,
});
