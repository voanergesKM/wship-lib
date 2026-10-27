export function adminDate(value: string | undefined) {
  return value
    ? new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Kyiv",
      }).format(new Date(value))
    : "Немає даних";
}
