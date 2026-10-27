import { z } from "zod";
import { PERMISSION_KEYS } from "@/lib/permissions/catalog";
export const profileInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(500).default(""),
    permissions: z
      .array(z.enum(PERMISSION_KEYS))
      .max(PERMISSION_KEYS.length)
      .refine(
        (values) => new Set(values).size === values.length,
        "Дозволи не повинні повторюватися",
      ),
  })
  .strict();
export const userUpdateSchema = z
  .object({
    isActive: z.boolean().optional(),
    permissionProfileId: z.string().min(1).max(100).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Не вказано змін");
