import { describe, expect, it } from "vitest";
import {
  computeBalances,
  computeShares,
  formatINR,
  parseRupeesToPaise,
  splitEqual,
  type ExpenseInput,
  type SettlementInput,
} from "@/lib/ledger";

describe("TripMates 2.0 - Selective Family Expense Splitting & Zero-Sum Ledger", () => {
  it("selective splitting: 10 people on trip, 6 eat lunch, 1 person pays ₹3,000, 4 get no share", () => {
    const tripParties = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"];
    const eaters = ["p1", "p2", "p3", "p4", "p5", "p6"]; // 6 people ate

    const lunchExpense: ExpenseInput = {
      id: "lunch-1",
      amount: 300000, // ₹3,000 in integer paise
      paidBy: "p1", // p1 paid the total bill
      participants: eaters,
      splitMethod: "equal",
    };

    const shares = computeShares(lunchExpense);

    // Each of the 6 eaters gets exactly ₹500 (50,000 paise)
    eaters.forEach((id) => {
      expect(shares[id]).toBe(50000);
    });

    // The remaining 4 people receive no share
    ["p7", "p8", "p9", "p10"].forEach((id) => {
      expect(shares[id]).toBeUndefined();
    });

    // Shares sum strictly equals 300,000 paise
    const totalShares = Object.values(shares).reduce((a, b) => a + b, 0);
    expect(totalShares).toBe(300000);
  });

  it("payer is NOT in split if they did not participate (e.g. uncle buys gifts for nieces)", () => {
    const giftExpense: ExpenseInput = {
      id: "gift-1",
      amount: 240000, // ₹2,400
      paidBy: "uncle_ramesh",
      participants: ["niece_pooja", "niece_ananya"],
      splitMethod: "equal",
    };

    const shares = computeShares(giftExpense);

    expect(shares["uncle_ramesh"]).toBeUndefined();
    expect(shares["niece_pooja"]).toBe(120000);
    expect(shares["niece_ananya"]).toBe(120000);

    const balances = computeBalances({
      parties: ["uncle_ramesh", "niece_pooja", "niece_ananya"],
      expenses: [giftExpense],
      settlements: [],
    });

    const uncle = balances.find((b) => b.partyId === "uncle_ramesh")!;
    const pooja = balances.find((b) => b.partyId === "niece_pooja")!;
    const ananya = balances.find((b) => b.partyId === "niece_ananya")!;

    expect(uncle.net).toBe(240000); // Uncle is owed ₹2,400
    expect(pooja.net).toBe(-120000); // Pooja owes ₹1,200
    expect(ananya.net).toBe(-120000); // Ananya owes ₹1,200

    // Strict zero-sum invariant
    expect(uncle.net + pooja.net + ananya.net).toBe(0);
  });

  it("partial repayment adjusts balances towards zero without acting as new expense", () => {
    const parties = ["alice", "bob"];
    const hotel: ExpenseInput = {
      id: "hotel",
      amount: 1000000, // ₹10,000
      paidBy: "alice",
      participants: ["alice", "bob"],
      splitMethod: "equal",
    };

    // Before settlement: Bob owes ₹5,000 (-500,000 paise)
    let balances = computeBalances({ parties, expenses: [hotel], settlements: [] });
    expect(balances.find((b) => b.partyId === "bob")!.net).toBe(-500000);
    expect(balances.find((b) => b.partyId === "alice")!.net).toBe(500000);

    // Bob sends partial repayment of ₹3,000 (300,000 paise) to Alice
    const partialPay: SettlementInput = {
      id: "set-1",
      from: "bob",
      to: "alice",
      amount: 300000,
      status: "confirmed",
    };

    balances = computeBalances({ parties, expenses: [hotel], settlements: [partialPay] });
    const bob = balances.find((b) => b.partyId === "bob")!;
    const alice = balances.find((b) => b.partyId === "alice")!;

    expect(bob.net).toBe(-200000); // Bob now owes only ₹2,000
    expect(alice.net).toBe(200000); // Alice is now owed only ₹2,000
    expect(bob.net + alice.net).toBe(0);

    // After remaining ₹2,000 settlement
    const finalPay: SettlementInput = {
      id: "set-2",
      from: "bob",
      to: "alice",
      amount: 200000,
      status: "confirmed",
    };

    balances = computeBalances({ parties, expenses: [hotel], settlements: [partialPay, finalPay] });
    expect(balances.find((b) => b.partyId === "bob")!.net).toBe(0);
    expect(balances.find((b) => b.partyId === "alice")!.net).toBe(0);
  });

  it("largest-remainder paise distribution across tricky 3-way split", () => {
    // ₹100.00 among 3 people: 33.34, 33.33, 33.33
    const split = splitEqual(10000, ["p1", "p2", "p3"]);
    const p1 = split["p1"] ?? 0;
    const p2 = split["p2"] ?? 0;
    const p3 = split["p3"] ?? 0;
    expect(p1 + p2 + p3).toBe(10000);
    expect([p1, p2, p3].sort()).toEqual([3333, 3333, 3334]);
  });
});
