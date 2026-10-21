import { useMemo } from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle,
  Coins,
  CreditCard,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppState } from "@/lib/store";
import { formatINR, computeShares } from "@/lib/ledger";
import type { Trip, ExpenseCategory } from "@/lib/types";

interface TripBudgetViewProps {
  trip: Trip;
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  accommodation: "#0d9488", // teal-600
  transport: "#0284c7", // sky-600
  food: "#f59e0b", // amber-500
  tickets: "#8b5cf6", // purple-500
  fuel: "#ef4444", // red-500
  shopping: "#ec4899", // pink-500
  groceries: "#10b981", // emerald-500
  other: "#64748b", // slate-500
};

export function TripBudgetView({ trip }: TripBudgetViewProps) {
  const { expenses, people, families } = useAppState();
  const tripExpenses = expenses.filter((e) => e.tripId === trip.id && !e.voided);

  const totalSpent = useMemo(
    () => tripExpenses.reduce((sum, e) => sum + e.amount, 0),
    [tripExpenses],
  );

  const budget = trip.budget || 1;
  const remainingBudget = budget - totalSpent;
  const percentUsed = Math.min(100, Math.round((totalSpent / budget) * 100));
  const isOverBudget = totalSpent > budget;
  const isNearBudget = percentUsed >= 80 && !isOverBudget;

  const activeParticipantsCount = trip.participants.filter((p) => p.rsvp !== "declined").length || 1;
  const perPersonBudget = Math.round(budget / activeParticipantsCount);
  const perPersonSpent = Math.round(totalSpent / activeParticipantsCount);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    tripExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([cat, amount]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      category: cat as ExpenseCategory,
      value: amount / 100, // In Rupees for chart readability
      paise: amount,
    }));
  }, [tripExpenses]);

  // Family breakdown
  const familyData = useMemo(() => {
    const map: Record<string, number> = {};
    tripExpenses.forEach((e) => {
      const shares = computeShares(e);
      Object.entries(shares).forEach(([partyId, shareAmt]) => {
        const person = people.find((p) => p.id === partyId);
        const famId = person ? person.familyId : "other";
        map[famId] = (map[famId] || 0) + shareAmt;
      });
    });
    return Object.entries(map).map(([famId, paise]) => {
      const fam = families.find((f) => f.id === famId);
      return {
        name: fam ? fam.name : "Other",
        rupees: paise / 100,
        paise,
      };
    });
  }, [tripExpenses, people, families]);

  // Member breakdown
  const memberData = useMemo(() => {
    const map: Record<string, number> = {};
    tripExpenses.forEach((e) => {
      const shares = computeShares(e);
      Object.entries(shares).forEach(([partyId, shareAmt]) => {
        map[partyId] = (map[partyId] || 0) + shareAmt;
      });
    });
    return Object.entries(map)
      .map(([partyId, paise]) => {
        const person = people.find((p) => p.id === partyId);
        return {
          name: person ? person.name : partyId,
          rupees: paise / 100,
          paise,
        };
      })
      .sort((a, b) => b.paise - a.paise);
  }, [tripExpenses, people]);

  return (
    <div className="grid gap-6">
      {/* BUDGET WARNING BANNERS */}
      {isOverBudget && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive-foreground fade-up">
          <div className="flex items-center gap-2 font-bold text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Budget Exceeded</span>
          </div>
          <div className="mt-1 text-xs text-foreground/90">
            Total spending has exceeded the allocated trip budget of {formatINR(budget)} by{" "}
            <span className="font-bold text-destructive">{formatINR(totalSpent - budget)}</span>.
          </div>
        </div>
      )}

      {isNearBudget && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-200 fade-up">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Budget Alert ({percentUsed}% used)</span>
          </div>
          <div className="mt-1 text-xs">
            Trip expenses are approaching the allocated ceiling. {formatINR(remainingBudget)} remaining.
          </div>
        </div>
      )}

      {/* TOP STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Budget</span>
            <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-foreground">{formatINR(budget)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Allocated trip limit</div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Spent</span>
            <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-foreground">{formatINR(totalSpent)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{percentUsed}% of budget utilized</div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Remaining Funds</span>
            <Coins className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div
            className={cn(
              "mt-2 text-2xl font-bold font-display",
              remainingBudget < 0 ? "text-destructive" : "text-foreground",
            )}
          >
            {formatINR(remainingBudget)}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Available balance</div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Per Person Avg</span>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-display text-foreground">{formatINR(perPersonSpent)}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Budget: {formatINR(perPersonBudget)} / person</div>
        </div>
      </div>

      {/* BUDGET PROGRESS BAR */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft space-y-2">
        <div className="flex justify-between text-xs font-bold text-foreground">
          <span>Budget Burn Rate</span>
          <span>
            {formatINR(totalSpent)} of {formatINR(budget)} ({percentUsed}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isOverBudget ? "bg-destructive" : isNearBudget ? "bg-amber-500" : "bg-teal-600",
            )}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* ANALYTICS CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CATEGORY BREAKDOWN */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft flex flex-col">
          <h3 className="font-display text-base font-bold text-foreground mb-4">Spending by Category</h3>
          {categoryData.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No expenses recorded yet.</div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2 h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLORS[entry.category] || "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Amount"]} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                {categoryData.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || "#64748b" }}
                      />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{formatINR(item.paise)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FAMILY CONTRIBUTION BAR CHART */}
        <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft flex flex-col">
          <h3 className="font-display text-base font-bold text-foreground mb-4">Spending by Family</h3>
          {familyData.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No expenses recorded yet.</div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={familyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Share"]} />
                  <Bar dataKey="rupees" fill="#0d9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* MEMBER BREAKDOWN TABLE */}
      <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-soft">
        <h3 className="font-display text-base font-bold text-foreground mb-3">Individual Member Consumption</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/80 text-muted-foreground">
                <th className="pb-2 font-semibold">Member</th>
                <th className="pb-2 font-semibold">Share Amount</th>
                <th className="pb-2 font-semibold">% of Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {memberData.map((m) => {
                const pct = totalSpent > 0 ? Math.round((m.paise / totalSpent) * 100) : 0;
                return (
                  <tr key={m.name} className="py-2.5">
                    <td className="py-2.5 font-semibold text-foreground">{m.name}</td>
                    <td className="py-2.5 font-bold text-foreground">{formatINR(m.paise)}</td>
                    <td className="py-2.5 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{pct}%</span>
                        <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
