import { prisma } from "../lib/prisma";
import { nextOccurrence } from "../utils/dates";
import { impactFor } from "../utils/money";
export async function processDueRecurringTransactions() {
  const due = await prisma.recurringTransaction.findMany({ where: { isActive: true, nextRunAt: { lte: new Date() }, OR: [{ endDate: null }, { endDate: { gte: new Date() } }] } });
  let processed = 0;
  for (const recurring of due) {
    try { await prisma.$transaction(async tx => {
      const execution = await tx.recurringExecution.create({ data: { recurringTransactionId: recurring.id, scheduledDate: recurring.nextRunAt } });
      const transaction = await tx.transaction.create({ data: { userId: recurring.userId, accountId: recurring.accountId, categoryId: recurring.categoryId, type: recurring.type, amount: recurring.amount, description: recurring.description, transactionDate: recurring.nextRunAt } });
      await tx.recurringExecution.update({ where: { id: execution.id }, data: { transactionId: transaction.id } });
      await tx.account.update({ where: { id: recurring.accountId }, data: { currentBalance: { increment: impactFor(recurring.type, recurring.amount) } } });
      await tx.recurringTransaction.update({ where: { id: recurring.id }, data: { nextRunAt: nextOccurrence(recurring.nextRunAt, recurring.frequency), lastProcessedAt: new Date() } });
      await tx.activityLog.create({ data: { userId: recurring.userId, action: "RECURRING_EXECUTED", entityType: "RecurringTransaction", entityId: recurring.id } });
    }); processed++; } catch (error: unknown) { if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) console.error("Recurring execution failed", recurring.id); }
  } return processed;
}
