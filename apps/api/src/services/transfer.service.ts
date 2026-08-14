import { prisma } from "../lib/prisma";
import { AppError, notFound } from "../lib/errors";
import { money } from "../utils/money";
export async function createTransfer(userId: string, input: { sourceAccountId: string; destinationAccountId: string; amount: string | number; description?: string; transferDate: Date }) {
  const amount = money(input.amount); if (amount.lte(0)) throw new AppError(422, "INVALID_AMOUNT", "Amount must be greater than zero");
  if (input.sourceAccountId === input.destinationAccountId) throw new AppError(422, "SAME_ACCOUNT", "Choose two different accounts");
  return prisma.$transaction(async tx => {
    const [source, destination] = await Promise.all([tx.account.findFirst({ where: { id: input.sourceAccountId, userId } }), tx.account.findFirst({ where: { id: input.destinationAccountId, userId } })]);
    if (!source || !destination) throw notFound("Account");
    if (source.currentBalance.lt(amount)) throw new AppError(422, "INSUFFICIENT_FUNDS", "Source account has insufficient funds");
    const outgoing = await tx.transaction.create({ data: { userId, accountId: source.id, type: "TRANSFER_OUT", amount, description: input.description || `Transfer to ${destination.name}`, transactionDate: input.transferDate } });
    const incoming = await tx.transaction.create({ data: { userId, accountId: destination.id, type: "TRANSFER_IN", amount, description: input.description || `Transfer from ${source.name}`, transactionDate: input.transferDate } });
    await tx.account.update({ where: { id: source.id }, data: { currentBalance: { decrement: amount } } });
    await tx.account.update({ where: { id: destination.id }, data: { currentBalance: { increment: amount } } });
    const transfer = await tx.transfer.create({ data: { userId, sourceAccountId: source.id, destinationAccountId: destination.id, amount, transferDate: input.transferDate, description: input.description, outgoingTransactionId: outgoing.id, incomingTransactionId: incoming.id } });
    await tx.activityLog.create({ data: { userId, action: "TRANSFER_COMPLETED", entityType: "Transfer", entityId: transfer.id, metadata: { amount: amount.toString(), source: source.name, destination: destination.name } } });
    return transfer;
  });
}
