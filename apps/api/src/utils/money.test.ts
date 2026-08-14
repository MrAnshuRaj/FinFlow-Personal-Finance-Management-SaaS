import { describe, expect, it } from "vitest";
import { money, impactFor } from "./money";

describe("financial amount utilities", () => {
  it("keeps decimal amounts at two places", () => {
    expect(money("125.678").toString()).toBe("125.68");
  });
  it("applies correct signed account impacts", () => {
    expect(impactFor("INCOME", money("500")).toString()).toBe("500");
    expect(impactFor("EXPENSE", money("500")).toString()).toBe("-500");
    expect(impactFor("TRANSFER_IN", money("500")).toString()).toBe("500");
    expect(impactFor("TRANSFER_OUT", money("500")).toString()).toBe("-500");
  });
});
