import { format, parseISO, eachDayOfInterval, differenceInCalendarDays, isBefore, isAfter, addDays, startOfWeek, endOfWeek } from "date-fns";

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function fmtDayHeader(iso: string): string {
  return format(parseISO(iso), "EEE, MMM d").toUpperCase();
}

export function fmtLongDate(iso: string): string {
  return format(parseISO(iso), "EEEE, MMMM d, yyyy");
}

export function daysBetween(startIso: string, endIso: string): string[] {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  if (isAfter(start, end)) return [startIso];
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

export function tripDayCount(startIso: string, endIso: string): number {
  return differenceInCalendarDays(parseISO(endIso), parseISO(startIso)) + 1;
}

export function compareDateTime(a: { date: string; startTime?: string }, b: { date: string; startTime?: string }): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const at = a.startTime ?? "00:00";
  const bt = b.startTime ?? "00:00";
  return at < bt ? -1 : at > bt ? 1 : 0;
}

export function weekBounds(iso: string): { start: string; end: string; days: string[] } {
  const d = parseISO(iso);
  const s = startOfWeek(d, { weekStartsOn: 1 });
  const e = endOfWeek(d, { weekStartsOn: 1 });
  return {
    start: format(s, "yyyy-MM-dd"),
    end: format(e, "yyyy-MM-dd"),
    days: eachDayOfInterval({ start: s, end: e }).map((x) => format(x, "yyyy-MM-dd")),
  };
}

export function shiftDay(iso: string, delta: number): string {
  return format(addDays(parseISO(iso), delta), "yyyy-MM-dd");
}

export function isBeforeIso(a: string, b: string): boolean {
  return isBefore(parseISO(a), parseISO(b));
}

export function isAfterIso(a: string, b: string): boolean {
  return isAfter(parseISO(a), parseISO(b));
}
