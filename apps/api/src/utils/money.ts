import { Prisma } from "@prisma/client";
export const money = (value: string | number | Prisma.Decimal) => new Prisma.Decimal(value).toDecimalPlaces(2);
export const impactFor = (type: "INCOME" | "EXPENSE" | "TRANSFER_IN" | "TRANSFER_OUT", amount: Prisma.Decimal) => type === "INCOME" || type === "TRANSFER_IN" ? amount : amount.negated();
