import { Prisma, TransactionType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError, notFound } from "../lib/errors";
import { impactFor, money } from "../utils/money";

type TxInput = { accountId: string; categoryId?: string | null; type: TransactionType; amount: string | number; description: string; notes?: string | null; merchant?: string | null; transactionDate: Date };
const ownAccount = async (tx: Prisma.TransactionClient, userId: string, id: string) => {
  const account = await tx.account.findFirst({ where: { id, userId } }); if (!account) throw notFound("Account"); return account;
};
const ownCategory = async (tx: Prisma.TransactionClient, userId: string, id?: string | null) => {
  if (!id) return null; const c = await tx.category.findFirst({ where: { id, OR: [{ userId }, { userId: null }] } }); if (!c) throw notFound("Category"); return c;
};
export async function createTransaction(userId: string, input: TxInput) {
  if (input.type.startsWith("TRANSFER")) throw new AppError(422, "INVALID_TRANSACTION_TYPE", "Use the transfers endpoint for transfers");
  const amount = money(input.amount); if (amount.lte(0)) throw new AppError(422, "INVALID_AMOUNT", "Amount must be greater than zero");
  return prisma.$transaction(async tx => {
    await ownAccount(tx, userId, input.accountId); await ownCategory(tx, userId, input.categoryId);
    const record = await tx.transaction.create({ data: { ...input, amount, userId, categoryId: input.categoryId || null } });
    await tx.account.update({ where: { id: input.accountId }, data: { currentBalance: { increment: impactFor(input.type, amount) } } });
    await tx.activityLog.create({ data: { userId, action: "TRANSACTION_CREATED", entityType: "Transaction", entityId: record.id, metadata: { type: input.type, amount: amount.toString() } } });
    return record;
  });
}
export async function updateTransaction(userId: string, id: string, input: Partial<TxInput>) {
  return prisma.$transaction(async tx => {
    const previous = await tx.transaction.findFirst({ where: { id, userId } }); if (!previous) throw notFound("Transaction");
    if (previous.type.startsWith("TRANSFER")) throw new AppError(422, "TRANSFER_IMMUTABLE", "Edit a transfer through the transfers workflow");
    const merged = { ...previous, ...input, amount: input.amount ? money(input.amount) : previous.amount, categoryId: input.categoryId === undefined ? previous.categoryId : input.categoryId };
    if (merged.type.startsWith("TRANSFER") || merged.amount.lte(0)) throw new AppError(422, "INVALID_TRANSACTION", "Use a positive non-transfer amount");
    await ownAccount(tx, userId, merged.accountId); await ownCategory(tx, userId, merged.categoryId);
    await tx.account.update({ where: { id: previous.accountId }, data: { currentBalance: { decrement: impactFor(previous.type, previous.amount) } } });
    const record = await tx.transaction.update({ where: { id }, data: { accountId: merged.accountId, categoryId: merged.categoryId, type: merged.type, amount: merged.amount, description: merged.description, notes: merged.notes, merchant: merged.merchant, transactionDate: merged.transactionDate } });
    await tx.account.update({ where: { id: merged.accountId }, data: { currentBalance: { increment: impactFor(merged.type, merged.amount) } } });
    return record;
  });
}
export async function deleteTransaction(userId: string, id: string) {
  return prisma.$transaction(async tx => {
    const record = await tx.transaction.findFirst({ where: { id, userId } }); if (!record) throw notFound("Transaction");
    if (record.type.startsWith("TRANSFER")) throw new AppError(422, "TRANSFER_IMMUTABLE", "Delete a transfer through the transfers workflow");
    await tx.account.update({ where: { id: record.accountId }, data: { currentBalance: { decrement: impactFor(record.type, record.amount) } } });
    await tx.transaction.delete({ where: { id } });
    await tx.activityLog.create({ data: { userId, action: "TRANSACTION_DELETED", entityType: "Transaction", entityId: id } });
  });
}
