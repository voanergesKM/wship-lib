import { z } from "zod";
import { ACTIVITY_KEYS } from "./catalog";
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );
export const activitySearchSchema = z
  .object({
    sort: optional(z.string().max(30)),
    direction: optional(z.enum(["asc", "desc"])),
    actor: optional(z.string().trim().max(100)),
    group: optional(z.string().trim().max(100)),
    action: optional(z.enum(ACTIVITY_KEYS)),
    source: optional(z.enum(["server", "client"])),
    from: optional(z.iso.date()),
    to: optional(z.iso.date()),
    page: z.coerce.number().int().min(1).max(100000).catch(1),
  })
  .refine(
    (value) => !value.from || !value.to || value.from <= value.to,
    "Дата початку має бути раніше дати завершення",
  );

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Kyiv",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
// Resolve Kyiv midnight rather than assuming a fixed UTC offset (DST days
// can contain 23/25 hours). Inputs are validated ISO calendar dates.
export function kyivDayStart(day: string): Date {
  const wallTime = Date.parse(`${day}T00:00:00.000Z`);
  let candidate = wallTime;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(candidate))
        .map((part) => [part.type, part.value]),
    );
    const local = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    candidate = wallTime - (local - candidate);
  }
  return new Date(candidate);
}
export function activityDateRange(from?: string, to?: string) {
  const after = to
    ? new Date(Date.parse(`${to}T00:00:00.000Z`) + 86400000)
        .toISOString()
        .slice(0, 10)
    : undefined;
  return {
    ...(from ? { $gte: kyivDayStart(from) } : {}),
    ...(after ? { $lt: kyivDayStart(after) } : {}),
  };
}
