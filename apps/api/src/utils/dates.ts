import { addDays, addMonths, addWeeks, addYears } from "./date-polyfill";
import type { Frequency } from "@prisma/client";
export const nextOccurrence = (date: Date, frequency: Frequency) => ({ DAILY: addDays(date, 1), WEEKLY: addWeeks(date, 1), MONTHLY: addMonths(date, 1), YEARLY: addYears(date, 1) })[frequency];
