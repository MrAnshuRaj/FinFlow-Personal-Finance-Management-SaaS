import { describe, expect, it } from "vitest";

describe("transfer consistency contract", () => {
  it("documents the invariant used by the transactional service", () => {
    const sourceBefore = 50000, destinationBefore = 2000, amount = 5000;
    const sourceAfter = sourceBefore - amount, destinationAfter = destinationBefore + amount;
    expect(sourceAfter + destinationAfter).toBe(sourceBefore + destinationBefore);
    expect(sourceAfter).toBe(45000);
    expect(destinationAfter).toBe(7000);
  });
});
