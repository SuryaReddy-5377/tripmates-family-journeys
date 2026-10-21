import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { ArrowRight, ChevronDown, Download, HandCoins, Paperclip, Plus, Receipt, Scale, Wallet, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, Money, PartyAvatar, StatCard } from "@/components/app/bits";
import { AddExpenseForm, categoryIcons } from "@/components/app/AddExpenseForm";
import { RepaymentForm } from "@/components/app/RepaymentForm";
import { ResponsiveModal } from "@/components/app/ResponsiveModal";
import { cn } from "@/lib/utils";
import { confirmSettlement, useAppState } from "@/lib/store";
import { computeShares, formatINR, type Transfer } from "@/lib/ledger";
import { CURRENT_USER_ID, people } from "@/lib/sample-data";
import { categoryLabel, downloadText, expensesCsv, firstName, partyName, personName, tripLedger, tripStatus } from "@/lib/trips";
import type { Expense, ExpenseCategory } from "@/lib/types";

type Tab = "expenses" | "balances" | "repayments" | "breakdown";

export const Route = createFileRoute("/_app/trips/$tripId/expenses")({
  validateSearch: (s: Record<string, unknown>): { add?: boolean; tab?: Tab } => ({
    add: s.add === true || s.add === "true" ? true : undefined,
    tab: s.tab === "balances" || s.tab === "repayments" || s.tab === "breakdown" || s.tab === "expenses" ? s.tab : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trip expenses — TripMates" },
      { name: "description", content: "Shared expenses, balances and repayments for this trip, to the paisa." },
      { property: "og:title", content: "Trip expenses — TripMates" },
      { property: "og:description", content: "Shared expenses, balances and repayments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TripExpenses,
});

const PAGE = 20;
const isAdmin = people.find((p) => p.id === CURRENT_USER_ID)?.role === "family_admin";

function TripExpenses() {
  const { tripId } = Route.useParams();
  const { add, tab = "expenses" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const state = useAppState();
  const ledger = useMemo(() => tripLedger(state, tripId), [state, tripId]);
  const { trip, expenses, settlements, balances, transfers, total, byCategory } = ledger;
  const [repay, setRepay] = useState<{ open: boolean; suggestion?: Transfer; key: number }>({ open: false, key: 0 });
  const [addKey, setAddKey] = useState(0);
  const [limit, setLimit] = useState(PAGE);
  const completed = tripStatus(trip) === "completed";

  const my = balances.find((b) => b.partyId === CURRENT_USER_ID);
  const sorted = expenses.slice().sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const groups = groupByDate(sorted.slice(0, limit));
  const budgetPct = trip.budget > 0 ? Math.round((total / trip.budget) * 100) : 0;

  const setAdd = (open: boolean) => {
    if (open) setAddKey((k) => k + 1);
    navigate({ search: (s) => ({ ...s, add: open ? true : undefined }), replace: true });
  };
  const openRepay = (suggestion?: Transfer) => setRepay((r) => ({ open: true, suggestion, key: r.key + 1 }));

  return (
    <div className="grid gap-5">
      {completed && (
        <div className="rounded-2xl border bg-secondary p-4 text-sm text-secondary-foreground">
          <strong className="font-semibold">Final statement.</strong> This trip is complete — export the statement or settle what's left.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total spent" icon={<Wallet />} value={<Money paise={total} />} hint={`${expenses.length} expenses`} />
        <StatCard label="Your balance" icon={<Scale />} value={<Money paise={my?.net ?? 0} signed />} hint={!my || my.net === 0 ? "All settled" : my.net > 0 ? "You get back" : "You owe"} />
        <StatCard label="Your share" icon={<Receipt />} value={<Money paise={my?.share ?? 0} />} hint={`You paid ${formatINR(my?.paid ?? 0)}`} />
        <StatCard
          label="Budget"
          icon={<PiggyBank />}
          value={trip.budget > 0 ? <span className={cn("tabular font-semibold", budgetPct > 100 && "text-destructive")}>{budgetPct}%</span> : "—"}
          hint={trip.budget > 0 ? `${formatINR(Math.max(0, trip.budget - total), { compact: true })} left of ${formatINR(trip.budget, { compact: true })}` : "No budget set"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAdd(true)} className="flex-1 sm:flex-none"><Plus /> Add expense</Button>
        <Button variant="secondary" onClick={() => openRepay()} className="flex-1 sm:flex-none"><HandCoins /> Record repayment</Button>
        <Button
          variant="outline"
          onClick={() => {
            downloadText(`${trip.name.replace(/[^\w]+/g, "-")}-statement.csv`, expensesCsv(state, tripId));
            toast.success("Statement exported");
          }}
        >
          <Download /> CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => navigate({ search: (s) => ({ ...s, tab: v as Tab }), replace: true })}>
        <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl bg-muted p-1 sm:w-auto sm:inline-grid">
          {(["expenses", "balances", "repayments", "breakdown"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="h-9 rounded-lg px-2 text-xs font-semibold capitalize sm:px-4 sm:text-sm data-[state=active]:bg-card data-[state=active]:shadow-soft">
              {t === "breakdown" ? "Report" : t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          {sorted.length === 0 ? (
            <EmptyState icon={<Receipt />} title="No expenses yet" body="Add the first one — it'll be split only among the people you select." action={<Button onClick={() => setAdd(true)}>Add expense</Button>} />
          ) : (
            <div className="grid gap-5">
              {groups.map(([date, list]) => (
                <section key={date}>
                  <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground">{format(parseISO(date), "EEE, d MMM yyyy")}</h3>
                  <ul className="grid gap-2">
                    {list.map((e) => (
                      <ExpenseRow key={e.id} e={e} />
                    ))}
                  </ul>
                </section>
              ))}
              {limit < sorted.length && (
                <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)} className="justify-self-center">
                  Show more ({sorted.length - limit})
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="balances" className="mt-4 grid gap-6">
          <section>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Settle up</h3>
            {transfers.length === 0 ? (
              <p className="rounded-2xl border bg-success-soft p-4 text-sm font-medium text-success">Everyone is settled. Nothing owed.</p>
            ) : (
              <ul className="grid gap-2">
                {transfers.map((t) => (
                  <li key={`${t.from}-${t.to}`} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-soft">
                    <PartyAvatar id={t.from} size="sm" />
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <PartyAvatar id={t.to} size="sm" />
                    <p className="min-w-0 flex-1 text-sm text-foreground">
                      <span className="font-semibold">{firstName(t.from)}</span> pays <span className="font-semibold">{firstName(t.to)}</span>
                    </p>
                    <Money paise={t.amount} className="text-sm" />
                    <Button size="sm" variant="secondary" onClick={() => openRepay(t)}>Record</Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Everyone's balance</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {balances
                .slice()
                .sort((a, b) => b.net - a.net)
                .map((b) => (
                  <li key={b.partyId} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <PartyAvatar id={b.partyId} />
                      <p className="flex-1 truncate font-semibold text-foreground">{partyName(b.partyId)}</p>
                      <Money paise={b.net} signed />
                    </div>
                    <dl className="mt-3 grid grid-cols-4 gap-2 text-xs">
                      <Cell label="Paid" v={b.paid} />
                      <Cell label="Share" v={b.share} />
                      <Cell label="Repaid" v={b.repaymentsSent} />
                      <Cell label="Received" v={b.repaymentsReceived} />
                    </dl>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Balance = paid − share + repaid − received. Positive means they get money back.</p>
          </section>
        </TabsContent>

        <TabsContent value="repayments" className="mt-4">
          {settlements.length === 0 ? (
            <EmptyState icon={<HandCoins />} title="No repayments yet" body="Partial repayments are welcome — record them as they happen." />
          ) : (
            <ul className="grid gap-2">
              {settlements
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
                    <PartyAvatar id={s.from} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{firstName(s.from)}</span> → <span className="font-semibold">{firstName(s.to)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(s.date), "d MMM yyyy")} · recorded by {personName(s.recordedBy)}
                        {s.note && ` · ${s.note}`}
                      </p>
                    </div>
                    <Money paise={s.amount} className="text-sm" />
                    <Badge variant={s.status === "confirmed" ? "success" : s.status === "pending" ? "warning" : "secondary"} className="capitalize">{s.status}</Badge>
                    {s.status === "pending" && (s.to === CURRENT_USER_ID || isAdmin) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          confirmSettlement(s.id);
                          toast.success("Repayment confirmed — balances updated");
                        }}
                      >
                        Confirm
                      </Button>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="mt-4 grid gap-6">
          <section className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 text-lg font-semibold text-foreground">By category</h3>
            {total === 0 ? (
              <p className="text-sm text-muted-foreground">No spending yet.</p>
            ) : (
              <ul className="grid gap-3">
                {Object.entries(byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, amt]) => {
                    const Icon = categoryIcons[cat as ExpenseCategory];
                    const pct = Math.round((amt / total) * 100);
                    return (
                      <li key={cat}>
                        <div className="mb-1 flex items-center gap-2 text-sm">
                          <Icon className="h-4 w-4 text-accent" aria-hidden />
                          <span className="flex-1 font-medium text-foreground">{categoryLabel[cat as ExpenseCategory]}</span>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                          <Money paise={amt} className="text-sm" />
                        </div>
                        <Progress value={pct} className="h-2" />
                      </li>
                    );
                  })}
              </ul>
            )}
          </section>
          <section className="rounded-2xl border bg-card p-4">
            <h3 className="mb-3 text-lg font-semibold text-foreground">Budget vs actual</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-muted-foreground">Budget</p><Money paise={trip.budget} /></div>
              <div><p className="text-muted-foreground">Actual</p><Money paise={total} /></div>
              <div><p className="text-muted-foreground">{total > trip.budget ? "Over by" : "Remaining"}</p><Money paise={Math.abs(trip.budget - total)} className={total > trip.budget ? "text-destructive" : "text-success"} /></div>
            </div>
            {trip.budget > 0 && <Progress value={Math.min(100, budgetPct)} className="mt-3 h-2" />}
          </section>
        </TabsContent>
      </Tabs>

      <ResponsiveModal open={!!add} onOpenChange={setAdd} title="Add expense" description={trip.name}>
        <AddExpenseForm key={addKey} trip={trip} onDone={() => setAdd(false)} />
      </ResponsiveModal>
      <ResponsiveModal open={repay.open} onOpenChange={(o) => setRepay((r) => ({ ...r, open: o }))} title="Record repayment" description={trip.name}>
        <RepaymentForm key={repay.key} trip={trip} suggestion={repay.suggestion} onDone={() => setRepay((r) => ({ ...r, open: false }))} />
      </ResponsiveModal>
    </div>
  );
}

function Cell({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-semibold text-foreground">{formatINR(v, { compact: true })}</dd>
    </div>
  );
}

function groupByDate(list: Expense[]): [string, Expense[]][] {
  const m = new Map<string, Expense[]>();
  for (const e of list) m.set(e.date, [...(m.get(e.date) ?? []), e]);
  return Array.from(m.entries());
}

function ExpenseRow({ e }: { e: Expense }) {
  const [open, setOpen] = useState(false);
  const Icon = categoryIcons[e.category];
  const shares = useMemo(() => computeShares(e), [e]);
  return (
    <li className="overflow-hidden rounded-2xl border bg-card">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{e.description}</p>
          <p className="truncate text-xs text-muted-foreground">
            {firstName(e.paidBy)} paid · {e.participants.length} sharing{e.splitMethod === "shares" && " by headcount"}
          </p>
        </div>
        {e.hasReceipt && <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Has receipt" />}
        <Money paise={e.amount} className="text-sm" />
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="border-t bg-muted/40 p-3">
          <ul className="grid gap-1.5">
            {Object.entries(shares).map(([id, amt]) => (
              <li key={id} className="flex items-center gap-2 text-sm">
                <PartyAvatar id={id} size="sm" />
                <span className="flex-1 text-foreground">{partyName(id)}</span>
                <span className="tabular font-medium text-foreground">{formatINR(amt)}</span>
              </li>
            ))}
          </ul>
          {e.notes && <p className="mt-3 text-sm text-muted-foreground">“{e.notes}”</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            {categoryLabel[e.category]} · added by {personName(e.createdBy)} · {format(parseISO(e.createdAt), "d MMM, h:mm a")}
          </p>
        </div>
      )}
    </li>
  );
}
