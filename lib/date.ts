import { format } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDateTime(value?: Date | string) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, "dd MMM yyyy HH:mm", { locale: tr });
}

export function formatRange(from?: Date, to?: Date) {
  if (!from || !to) return "Tarih seçilmedi";
  return `${formatDateTime(from)} - ${formatDateTime(to)}`;
}
