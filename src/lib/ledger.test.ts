import { describe, expect, it } from "vitest";
import {
  computeBalances,
  computeShares,
  csvCell,
  formatINR,
  LedgerError,
  paiseToDecimalString,
  parseRupeesToPaise,
  splitEqual,
  suggestTransfers,
  totalSpent,
  validateExpense,
  validateSettlement,
  type ExpenseInput,
  type SettlementInput,
} from "./ledger";

const sum = (r: Record<string, number>) => Object.values(r).reduce((s, v) => s + v, 0);

describe("parseRupeesToPaise", () => {
  it("parses rupees and paise without floating point", () => {
    expect(parseRupeesToPaise("1,250.50")).toBe(125050);
    expect(parseRupeesToPaise("₹ 99")).toBe(9900);
    expect(parseRupeesToPaise("0.1")).toBe(10);
    expect(parseRupeesToPaise("12.05")).toBe(1205);
  });
  it("rejects more than two decimals, negatives and garbage", () => {
    expect(parseRupeesToPaise("1.234")).toBeNull();
    expect(parseRupeesToPaise("-5")).toBeNull();
    expect(parseRupeesToPaise("abc")).toBeNull();
    expect(parseRupeesToPaise("")).toBeNull();
  });
});

describe("equal split", () => {
  it("₹100 among 3 people gives 33.34 / 33.33 / 33.33 and adds up exactly", () => {
    const r = splitEqual(10000, ["c", "a", "b"]);
    expect(r).toEqual({ a: 3334, b: 3333, c: 3333 });
    expect(sum(r)).toBe(10000);
  });
  it("remainder distribution does not depend on input order", () => {
    expect(splitEqual(10001, ["z", "y", "x"])).toEqual(splitEqual(10001, ["x", "y", "z"]));
  });
  it("always sums to the exact amount across many awkward totals", () => {
    for (let amount = 1; amount < 5000; amount += 37) {
      for (let n = 1; n <= 9; n++) {
        const ids = Array.from({ length: n }, (_, i) => `p${i}`);
        const r = splitEqual(amount, ids);
        expect(sum(r)).toBe(amount);
        const vals = Object.values(r);
        expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(1);
      }
    }
  });
  it("never includes non-participants", () => {
    const shares = computeShares({ id: "e", amount: 9000, paidBy: "a", participants: ["a", "b"], splitMethod: "equal" });
    expect(Object.keys(shares).sort()).toEqual(["a", "b"]);
  });
});

describe("shares and exact splits", () => {
  it("family-level party with 4 shares pays 4x an individual", () => {
    const r = computeShares({
      id: "e", amount: 50000, paidBy: "surya", participants: ["surya", "raoFamily"],
      splitMethod: "shares", splitValues: { surya: 1, raoFamily: 4 },
    });
    expect(r).toEqual({ raoFamily: 40000, surya: 10000 });
  });
  it("exact split must add up to the total", () => {
    expect(() =>
      computeShares({ id: "e", amount: 1000, paidBy: "a", participants: ["a", "b"], splitMethod: "exact", splitValues: { a: 400, b: 500 } }),
    ).toThrow(LedgerError);
  });
});

describe("validation", () => {
  const parties = ["a", "b", "c"];
  it("rejects a payer who is not on the trip", () => {
    expect(() => validateExpense({ id: "e", amount: 100, paidBy: "x", participants: ["a"], splitMethod: "equal" }, parties)).toThrow(/Payer/);
  });
  it("rejects a participant who is not on the trip", () => {
    expect(() => validateExpense({ id: "e", amount: 100, paidBy: "a", participants: ["a", "x"], splitMethod: "equal" }, parties)).toThrow(/participant/);
  });
  it("rejects zero amounts and empty participant lists", () => {
    expect(() => validateExpense({ id: "e", amount: 0, paidBy: "a", participants: ["a"], splitMethod: "equal" }, parties)).toThrow();
    expect(() => validateExpense({ id: "e", amount: 100, paidBy: "a", participants: [], splitMethod: "equal" }, parties)).toThrow();
  });
  it("rejects repayments to yourself or from outsiders", () => {
    expect(() => validateSettlement({ id: "s", from: "a", to: "a", amount: 100, status: "confirmed" }, parties)).toThrow();
    expect(() => validateSettlement({ id: "s", from: "x", to: "a", amount: 100, status: "confirmed" }, parties)).toThrow();
  });
});

describe("sample trip: several payers, a non-attendee, partial repayment, rounding", () => {
  // Five people on the trip ledger; Dev did not attend dinner or the boat.
  const parties = ["anil", "bhavna", "chitra", "dev", "esha"];
  const expenses: ExpenseInput[] = [
    { id: "hotel", amount: 1500000, paidBy: "anil", participants: parties, splitMethod: "equal", category: "accommodation" }, // ₹15,000
    { id: "dinner", amount: 320050, paidBy: "bhavna", participants: ["anil", "bhavna", "chitra", "esha"], splitMethod: "equal", category: "food" }, // ₹3,200.50
    { id: "boat", amount: 100000, paidBy: "chitra", participants: ["anil", "bhavna", "chitra"], splitMethod: "equal", category: "tickets" }, // ₹1,000 / 3
    { id: "fuel", amount: 250000, paidBy: "dev", participants: parties, splitMethod: "equal", category: "fuel" }, // ₹2,500
  ];
  const settlements: SettlementInput[] = [
    { id: "s1", from: "esha", to: "anil", amount: 200000, status: "confirmed" }, // partial
    { id: "s2", from: "chitra", to: "anil", amount: 50000, status: "pending" }, // ignored until confirmed
    { id: "s3", from: "dev", to: "anil", amount: 99999, status: "reversed" }, // ignored
  ];

  const balances = computeBalances({ parties, expenses, settlements });
  const byId = Object.fromEntries(balances.map((b) => [b.partyId, b]));

  it("total spending is the sum of expenses only", () => {
    expect(totalSpent(expenses)).toBe(2170050);
  });

  it("allocated shares add up exactly to total spending", () => {
    expect(balances.reduce((s, b) => s + b.share, 0)).toBe(2170050);
  });

  it("non-attendee Dev has no dinner or boat share", () => {
    // hotel 300000 + fuel 50000
    expect(byId.dev.share).toBe(350000);
  });

  it("computes exact per-person figures including rounding remainders", () => {
    // dinner 320050 / 4 = 80012.5 → anil 80013, bhavna 80013, chitra 80012, esha 80012
    // boat 100000 / 3 → anil 33334, bhavna 33333, chitra 33333
    expect(byId.anil.share).toBe(300000 + 80013 + 33334 + 50000);
    expect(byId.esha.share).toBe(300000 + 80012 + 50000);
    expect(byId.anil.net).toBe(1500000 - 463347 - 200000);
    expect(byId.esha.net).toBe(0 - 430012 + 200000);
  });

  it("net balances always sum to zero", () => {
    expect(balances.reduce((s, b) => s + b.net, 0)).toBe(0);
  });

  it("only confirmed repayments affect balances, and never total spending", () => {
    const without = computeBalances({ parties, expenses, settlements: [] });
    const anilBefore = without.find((b) => b.partyId === "anil")!.net;
    expect(byId.anil.net).toBe(anilBefore - 200000);
    expect(byId.chitra.repaymentsSent).toBe(0);
    expect(byId.dev.repaymentsSent).toBe(0);
    expect(totalSpent(expenses)).toBe(2170050);
  });

  it("suggested transfers settle everyone to exactly zero", () => {
    const transfers = suggestTransfers(balances);
    const after = computeBalances({
      parties,
      expenses,
      settlements: [
        ...settlements,
        ...transfers.map((t, i) => ({ id: `t${i}`, ...t, status: "confirmed" as const })),
      ],
    });
    for (const b of after) expect(b.net).toBe(0);
    expect(transfers.length).toBeLessThanOrEqual(parties.length - 1);
  });

  it("voided expenses are excluded from totals and balances", () => {
    const voided = expenses.map((e) => (e.id === "fuel" ? { ...e, voided: true } : e));
    expect(totalSpent(voided)).toBe(2170050 - 250000);
    expect(computeBalances({ parties, expenses: voided, settlements: [] }).find((b) => b.partyId === "dev")!.paid).toBe(0);
  });
});

describe("formatting", () => {
  it("formats paise as INR with Indian grouping", () => {
    expect(formatINR(12345678)).toBe("₹1,23,456.78");
    expect(formatINR(-5)).toBe("-₹0.05");
    expect(paiseToDecimalString(125005)).toBe("1250.05");
  });
  it("escapes CSV cells and blocks formula injection", () => {
    expect(csvCell('Dinner, "Thali"')).toBe('"Dinner, ""Thali"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
  });
});
