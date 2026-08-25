import { type ReactNode, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Crosshair,
  Flame,
  Gauge,
  LayoutDashboard,
  ListFilter,
  Menu,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import {
  getGetAnalyticsSummaryQueryKey,
  getGetTradeQueryKey,
  getListTradesQueryKey,
  useCreateTrade,
  useDeleteTrade,
  useGetAnalyticsSummary,
  useGetTrade,
  useListTrades,
  useUpdateTrade,
} from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from "wouter";

const queryClient = new QueryClient();

type LooseTrade = {
  id: number;
  createdAt: string;
  result: string;
  disciplineScore: number;
  beforeAnswers: Record<string, unknown>;
  duringAnswers: Record<string, unknown>;
  afterAnswers: Record<string, unknown>;
  screenshots: string[];
  pnl: number | null;
  mistake: string;
};

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/new-trade", label: "Check in", icon: Crosshair },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const fmtMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "—";
  return `${value >= 0 ? "+" : "−"}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));

const fmtTime = (date: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

function StatusPill({ result }: { result: string }) {
  const config = result === "WIN"
    ? { label: "Win", className: "bg-[hsl(var(--secondary)/.25)] text-[hsl(222_26%_19%)] border-[hsl(var(--secondary)/.5)]" }
    : result === "LOSS"
      ? { label: "Loss", className: "bg-[hsl(var(--accent)/.18)] text-[hsl(8_55%_40%)] border-[hsl(var(--accent)/.4)]" }
      : { label: "Even", className: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]" };
  return <span data-testid={`status-result-${result.toLowerCase()}`} className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.14em] ${config.className}`}>{config.label}</span>;
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[246px] flex-col border-r border-sidebar-border bg-sidebar px-5 py-6 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3 text-sidebar-foreground no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground"><Target size={19} strokeWidth={2.5} /></span>
            <span className="font-display text-[17px] font-bold tracking-[-.04em]">conviction<span className="text-sidebar-primary">.</span></span>
          </Link>
          <button onClick={() => setMobileOpen(false)} data-testid="button-close-menu" className="rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground md:hidden"><X size={18} /></button>
        </div>
        <div className="mt-14 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/40"><span className="h-1.5 w-1.5 rounded-full bg-sidebar-primary" /> Trading desk</div>
        <nav className="mt-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replace(" ", "-")}`} className={`group flex items-center gap-3 rounded-[10px] px-3 py-3 text-[13px] font-semibold transition-all duration-200 ${active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/55 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"}`}>
              <Icon size={17} strokeWidth={active ? 2.4 : 1.8} className={active ? "text-sidebar-primary" : "text-sidebar-foreground/55 group-hover:text-sidebar-primary"} />
              {label}
              {label === "Check in" && <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 py-0.5 text-[9px] font-bold text-sidebar-primary-foreground">+</span>}
            </Link>;
          })}
        </nav>
        <div className="mt-auto rounded-[14px] border border-sidebar-border bg-sidebar-accent/50 p-4">
          <div className="flex items-center gap-2 text-sidebar-primary"><ShieldCheck size={16} /><span className="text-[10px] font-bold uppercase tracking-[.16em]">Today's cue</span></div>
          <p className="mt-3 text-[13px] leading-5 text-sidebar-foreground/70">Process over outcome. One clean decision at a time.</p>
          <div className="mt-4 h-px bg-sidebar-border" />
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[.12em] text-sidebar-foreground/40"><span>Session</span><span className="text-sidebar-primary">Active</span></div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" data-testid="button-overlay-menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[hsl(222_26%_19%/.45)] md:hidden" />}
      <div className="min-h-[100dvh] md:pl-[246px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:px-10">
          <button onClick={() => setMobileOpen(true)} data-testid="button-open-menu" className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={21} /></button>
          <div className="hidden text-[11px] font-bold uppercase tracking-[.18em] text-muted-foreground md:block">{location === "/" ? "Good to see you" : navItems.find((item) => location.startsWith(item.href) && item.href !== "/")?.label ?? "Trading desk"}</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-right sm:block"><span className="block text-[12px] font-semibold">Market open</span><span className="block text-[10px] font-medium text-muted-foreground">NYSE · 09:30—16:00 ET</span></span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-[12px] font-bold text-primary">TR</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div className="animate-rise">
      <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {eyebrow}</div>
      <h1 className="font-display text-[clamp(30px,4vw,49px)] font-bold leading-[.98] tracking-[-.06em]">{title}</h1>
      <p className="mt-3 max-w-xl text-[14px] leading-6 text-muted-foreground">{subtitle}</p>
    </div>
    {action}
  </div>;
}

function Button({ children, variant = "primary", className = "", ...props }: { children: ReactNode; variant?: "primary" | "outline" | "quiet" | "danger"; className?: string; [key: string]: unknown }) {
  const styles = {
    primary: "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_7px_0_hsl(var(--secondary))]",
    outline: "border border-border bg-card text-foreground hover:border-foreground/40 hover:bg-muted",
    quiet: "text-muted-foreground hover:bg-muted hover:text-foreground",
    danger: "border border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.08)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/.14)]",
  };
  return <button {...props} className={`inline-flex items-center justify-center gap-2 rounded-[9px] px-4 py-2.5 text-[12px] font-bold transition-all duration-200 active:translate-y-0 ${styles[variant]} ${className}`}>{children}</button>;
}

function Metric({ label, value, note, accent = "ink", icon: Icon }: { label: string; value: string; note: string; accent?: "ink" | "lime" | "coral"; icon: typeof Activity }) {
  const dot = accent === "lime" ? "bg-secondary" : accent === "coral" ? "bg-accent" : "bg-[hsl(var(--chart-3))]";
  return <div data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`} className="group rounded-[14px] border border-card-border bg-card p-5 transition-transform duration-200 hover:-translate-y-1">
    <div className="flex items-start justify-between"><span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground"><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{label}</span><Icon size={16} className="text-muted-foreground/60 transition-transform group-hover:rotate-12" /></div>
    <div className="mt-6 font-display text-[30px] font-bold tracking-[-.06em]">{value}</div>
    <div className="mt-1 text-[11px] font-medium text-muted-foreground">{note}</div>
  </div>;
}

function MiniLineChart({ values, color = "hsl(var(--chart-3))", fill = false }: { values: number[]; color?: string; fill?: boolean }) {
  if (!values.length) return <div className="flex h-[150px] items-center justify-center text-[12px] text-muted-foreground">No chart data yet</div>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${132 - ((value - min) / spread) * 108}`).join(" ");
  return <svg viewBox="0 0 100 145" preserveAspectRatio="none" className="h-[150px] w-full overflow-visible">
    <line x1="0" y1="132" x2="100" y2="132" stroke="hsl(var(--border))" strokeWidth=".55" />
    <line x1="0" y1="78" x2="100" y2="78" stroke="hsl(var(--border))" strokeWidth=".45" strokeDasharray="2 2" />
    {fill && <polygon points={`0,145 ${points} 100,145`} fill={color} opacity=".11" />}
    <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    {values.map((value, index) => <circle key={`${value}-${index}`} cx={(index / Math.max(values.length - 1, 1)) * 100} cy={132 - ((value - min) / spread) * 108} r="1.8" fill={color} vectorEffect="non-scaling-stroke" />)}
  </svg>;
}

function EmptyState({ title, body, action }: { title: string; body: string; action: ReactNode }) {
  return <div className="quiet-grid flex min-h-[270px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border px-6 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-secondary"><Sparkles size={20} /></span>
    <h3 className="mt-5 font-display text-[19px] font-bold tracking-[-.035em]">{title}</h3>
    <p className="mt-2 max-w-sm text-[13px] leading-5 text-muted-foreground">{body}</p>
    <div className="mt-5">{action}</div>
  </div>;
}

function LoadingBlock() {
  return <div className="animate-pulse space-y-4"><div className="h-7 w-48 rounded bg-muted" /><div className="h-4 w-72 rounded bg-muted" /><div className="mt-8 grid gap-4 md:grid-cols-4"><div className="h-32 rounded-[14px] bg-muted" /><div className="h-32 rounded-[14px] bg-muted" /><div className="h-32 rounded-[14px] bg-muted" /><div className="h-32 rounded-[14px] bg-muted" /></div></div>;
}

function ErrorState({ retry }: { retry: () => void }) {
  return <div className="rounded-[14px] border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.06)] p-6"><div className="flex items-center gap-2 font-semibold text-[hsl(var(--destructive))]"><CircleAlert size={17} /> Could not load this view</div><p className="mt-2 text-[13px] text-muted-foreground">The trading desk is taking a breath. Try again in a moment.</p><Button variant="outline" onClick={retry} data-testid="button-retry"><RotateCcw size={14} /> Retry</Button></div>;
}

function Dashboard() {
  const summaryQuery = useGetAnalyticsSummary({ query: { queryKey: getGetAnalyticsSummaryQueryKey() } });
  const tradesQuery = useListTrades({ query: { queryKey: getListTradesQueryKey() } });
  const summary = summaryQuery.data;
  const trades = ((tradesQuery.data ?? []) as LooseTrade[]).slice().sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  if (summaryQuery.isLoading || tradesQuery.isLoading) return <LoadingBlock />;
  if (summaryQuery.isError || tradesQuery.isError) return <ErrorState retry={() => { summaryQuery.refetch(); tradesQuery.refetch(); }} />;
  const recent = trades.slice(0, 4);
  return <div>
    <PageIntro eyebrow="Tuesday, October 08" title="Stay in the trade." subtitle="A fast read on your process, before the market gets loud." action={<Link href="/new-trade" data-testid="link-start-checkin" className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-primary px-4 py-3 text-[12px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_7px_0_hsl(var(--secondary))]"><Plus size={16} /> Log a trade</Link>} />
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Today's P&L" value={fmtMoney(summary?.todayPnl)} note={`${summary?.todayTrades ?? 0} ${(summary?.todayTrades ?? 0) === 1 ? "trade" : "trades"} logged`} accent="lime" icon={TrendingUp} />
      <Metric label="Win rate" value={`${summary?.winRate ?? 0}%`} note="Across your full sample" accent="ink" icon={BarChart3} />
      <Metric label="Discipline score" value={`${summary?.disciplineScore ?? 0}/100`} note="Your process, not your P&L" accent="coral" icon={Gauge} />
      <Metric label="Current streak" value={`${summary?.currentStreak ?? 0} days`} note="Keep the ritual alive" accent="lime" icon={Flame} />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.85fr]">
      <section className="rounded-[14px] border border-card-border bg-card p-5 md:p-6">
        <div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Performance pulse</div><h2 className="mt-2 font-display text-[22px] font-bold tracking-[-.05em]">P&L over your last {summary?.pnlSeries?.length ?? 0} sessions</h2></div><Link href="/analytics" data-testid="link-view-analytics" className="text-[11px] font-bold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">Full view</Link></div>
        <div className="mt-7"><MiniLineChart values={(summary?.pnlSeries ?? []).map((item) => item.value)} color="hsl(var(--chart-3))" fill /></div>
        <div className="mt-2 flex justify-between text-[10px] font-mono-trading text-muted-foreground"><span>{summary?.pnlSeries?.[0]?.label ?? "Start"}</span><span>{summary?.pnlSeries?.at(-1)?.label ?? "Today"}</span></div>
      </section>
      <section className="rounded-[14px] border border-card-border bg-primary p-5 text-primary-foreground md:p-6">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-secondary"><span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse-soft" /> One-minute reset</div>
        <h2 className="mt-10 max-w-[250px] font-display text-[27px] font-bold leading-[1.02] tracking-[-.06em]">What would the most disciplined version of you do next?</h2>
        <p className="mt-4 text-[13px] leading-5 text-primary-foreground/65">Check in before you click. Your next decision is the only one on the screen.</p>
        <Link href="/new-trade" data-testid="link-reset-checkin" className="mt-8 inline-flex items-center gap-2 text-[12px] font-bold text-secondary underline decoration-secondary/40 underline-offset-4">Start check-in <ArrowUpRight size={14} /></Link>
      </section>
    </div>
    <section className="mt-4 rounded-[14px] border border-card-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Latest entries</div><h2 className="mt-1 font-display text-[20px] font-bold tracking-[-.04em]">Recent trades</h2></div><Link href="/history" data-testid="link-all-history" className="text-[11px] font-bold text-muted-foreground hover:text-foreground">See all <ChevronRight className="ml-1 inline" size={14} /></Link></div>
      {recent.length === 0 ? <div className="p-5"><EmptyState title="Your record starts here." body="The first entry is less about the result and more about making the ritual real." action={<Link href="/new-trade" data-testid="link-empty-first-trade" className="inline-flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2.5 text-[12px] font-bold text-primary-foreground"><Plus size={14} /> Log first trade</Link>} /></div> : <div className="divide-y divide-border">{recent.map((trade) => <TradeRow key={trade.id} trade={trade} />)}</div>}
    </section>
  </div>;
}

function TradeRow({ trade }: { trade: LooseTrade }) {
  return <Link href={`/history/${trade.id}`} data-testid={`row-trade-${trade.id}`} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/60 md:px-6">
    <span className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${trade.result === "WIN" ? "bg-[hsl(var(--secondary)/.22)] text-[hsl(222_26%_19%)]" : trade.result === "LOSS" ? "bg-[hsl(var(--accent)/.16)] text-[hsl(8_55%_40%)]" : "bg-muted text-muted-foreground"}`}>{trade.result === "WIN" ? <ArrowUpRight size={16} /> : trade.result === "LOSS" ? <ArrowDownRight size={16} /> : <span className="h-3 w-3 rounded-full border-2 border-current" />}</span>
    <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold">{fmtDate(trade.createdAt)}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{trade.mistake || "No note attached"} · {fmtTime(trade.createdAt)}</span></span>
    <span className="hidden sm:block"><StatusPill result={trade.result} /></span><span className={`font-mono-trading text-[13px] font-bold ${trade.pnl && trade.pnl > 0 ? "text-[hsl(160_39%_39%)]" : trade.pnl && trade.pnl < 0 ? "text-[hsl(var(--destructive))]" : "text-muted-foreground"}`}>{fmtMoney(trade.pnl)}</span><ChevronRight size={16} className="text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
  </Link>;
}

const defaultForm = { result: "WIN", disciplineScore: 70, before: "", during: "", after: "", pnl: "", mistake: "" };

function NewTrade() {
  const [, setLocation] = useLocation();
  const queryClientRef = useQueryClient();
  const createTrade = useCreateTrade();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(defaultForm);
  const steps = [
    { label: "Before", kicker: "Set the intention", title: "Why are you taking this trade?", prompt: "Name the setup. Name the reason. No story, just the plan.", placeholder: "I am taking this because..." },
    { label: "During", kicker: "Stay with the plan", title: "Are you still trading your idea?", prompt: "A quick check-in while the position is live. Notice, don't narrate.", placeholder: "The market is showing me..." },
    { label: "After", kicker: "Close the loop", title: "What did you learn from this one?", prompt: "The result is data. The reflection is the edge.", placeholder: "Next time, I will..." },
  ];
  const current = steps[step];
  const answerKey = ["before", "during", "after"][step] as "before" | "during" | "after";
  const setValue = (key: string, value: string | number) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = () => {
    createTrade.mutate({ data: { result: form.result as "WIN" | "LOSS" | "BREAKEVEN", disciplineScore: Number(form.disciplineScore), beforeAnswers: { reflection: form.before }, duringAnswers: { reflection: form.during }, afterAnswers: { reflection: form.after }, pnl: form.pnl === "" ? null : Number(form.pnl), mistake: form.mistake } }, {
      onSuccess: (trade) => {
        queryClientRef.invalidateQueries({ queryKey: getListTradesQueryKey() });
        queryClientRef.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() });
        setLocation(`/history/${trade.id}`);
      },
    });
  };
  return <div className="mx-auto max-w-[940px]">
    <PageIntro eyebrow="New trade" title="Make the next one count." subtitle="Three quick moments. A clearer process. No essays required." />
    <div className="mb-8 flex items-center gap-2">
      {steps.map((item, index) => <div key={item.label} className="flex flex-1 items-center gap-2"><span className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${index < step ? "border-secondary bg-secondary text-primary" : index === step ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>{index < step ? <Check size={13} /> : `0${index + 1}`}</span><span className={`hidden text-[11px] font-bold uppercase tracking-[.13em] sm:block ${index === step ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>{index < 2 && <span className="h-px flex-1 bg-border" />}</div>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
      <section className="rounded-[16px] border border-card-border bg-card p-6 md:p-9">
        <div className="text-[10px] font-bold uppercase tracking-[.2em] text-secondary">{current.kicker}</div><h2 className="mt-4 max-w-lg font-display text-[32px] font-bold leading-[1.02] tracking-[-.06em]">{current.title}</h2><p className="mt-3 text-[13px] leading-5 text-muted-foreground">{current.prompt}</p>
        <textarea value={form[answerKey]} onChange={(event) => setValue(answerKey, event.target.value)} data-testid={`textarea-${answerKey}-answer`} placeholder={current.placeholder} className="mt-9 min-h-[170px] w-full resize-none rounded-[11px] border border-input bg-background p-4 text-[14px] leading-6 outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-secondary" />
        {step === 2 && <div className="mt-7 border-t border-border pt-6"><label className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">What was the result?</label><div className="mt-3 grid grid-cols-3 gap-2">{["WIN", "LOSS", "BREAKEVEN"].map((result) => <button key={result} onClick={() => setValue("result", result)} data-testid={`button-result-${result.toLowerCase()}`} className={`rounded-[9px] border px-2 py-3 text-[11px] font-bold uppercase tracking-[.1em] transition-all ${form.result === result ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-foreground/30"}`}>{result === "BREAKEVEN" ? "Even" : result === "WIN" ? "Win" : "Loss"}</button>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">P&L <input type="number" value={form.pnl} onChange={(event) => setValue("pnl", event.target.value)} data-testid="input-pnl" placeholder="0.00" className="mt-2 w-full rounded-[8px] border border-input bg-background px-3 py-2.5 text-[13px] font-mono-trading text-foreground outline-none focus:border-secondary" /></label><label className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">One mistake to remember <input value={form.mistake} onChange={(event) => setValue("mistake", event.target.value)} data-testid="input-mistake" placeholder="Optional, keep it honest" className="mt-2 w-full rounded-[8px] border border-input bg-background px-3 py-2.5 text-[13px] font-sans text-foreground outline-none focus:border-secondary" /></label></div></div>}
        <div className="mt-8 flex items-center justify-between"><Button variant="quiet" onClick={() => step > 0 ? setStep(step - 1) : setLocation("/")} data-testid="button-checkin-back">{step === 0 ? "Cancel" : <><ChevronLeft size={15} /> Back</>}</Button>{step < 2 ? <Button onClick={() => setStep(step + 1)} data-testid="button-checkin-next">Continue <ChevronRight size={15} /></Button> : <Button onClick={submit} disabled={createTrade.isPending} data-testid="button-save-trade">{createTrade.isPending ? "Saving…" : <>Save this trade <Check size={15} /></>}</Button>}</div>
        {createTrade.isError && <p className="mt-4 text-right text-[12px] text-[hsl(var(--destructive))]">Could not save this entry. Try again.</p>}
      </section>
      <aside className="rounded-[16px] bg-[hsl(var(--secondary))] p-6 md:p-8"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-primary/60">Ritual note</span><Zap size={16} className="text-primary/70" /></div><div className="mt-20 font-display text-[26px] font-bold leading-[1.07] tracking-[-.05em] text-primary md:mt-32">{step === 0 ? "Clarity before conviction." : step === 1 ? "Stay curious, not reactive." : "Review without judgement."}</div><div className="mt-8 border-t border-primary/15 pt-4 text-[12px] leading-5 text-primary/65">This takes less than a minute. Consistency compounds quietly.</div></aside>
    </div>
  </div>;
}

function History() {
  const tradesQuery = useListTrades({ query: { queryKey: getListTradesQueryKey() } });
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const trades = useMemo(() => ((tradesQuery.data ?? []) as LooseTrade[]).filter((trade) => (filter === "ALL" || trade.result === filter) && (`${trade.mistake} ${trade.createdAt}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [tradesQuery.data, filter, search]);
  if (tradesQuery.isLoading) return <LoadingBlock />;
  if (tradesQuery.isError) return <ErrorState retry={() => tradesQuery.refetch()} />;
  return <div><PageIntro eyebrow="Your record" title="History, without the noise." subtitle="A clean record of the decisions behind the numbers." action={<Link href="/new-trade" data-testid="link-history-new-trade" className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-primary px-4 py-3 text-[12px] font-bold text-primary-foreground transition-all hover:-translate-y-0.5"><Plus size={16} /> New check-in</Link>} />
    <div className="mb-5 flex flex-col gap-3 rounded-[12px] border border-card-border bg-card p-3 md:flex-row md:items-center"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-history-search" placeholder="Search your notes..." className="w-full rounded-[8px] bg-muted/60 py-2.5 pl-9 pr-3 text-[12px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-secondary" /></div><div className="flex items-center gap-1 overflow-auto"><ListFilter size={14} className="mx-2 shrink-0 text-muted-foreground" />{["ALL", "WIN", "LOSS", "BREAKEVEN"].map((item) => <button key={item} onClick={() => setFilter(item)} data-testid={`button-filter-${item.toLowerCase()}`} className={`shrink-0 rounded-[7px] px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] transition-colors ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{item === "BREAKEVEN" ? "Even" : item === "ALL" ? "All" : item[0] + item.slice(1).toLowerCase()}</button>)}</div></div>
    <section className="overflow-hidden rounded-[14px] border border-card-border bg-card"><div className="hidden grid-cols-[1.5fr_.7fr_.7fr_32px] gap-4 border-b border-border px-6 py-3 text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground md:grid"><span>Date</span><span>Process</span><span className="text-right">Result</span><span /></div>{trades.length === 0 ? <div className="p-5"><EmptyState title={search || filter !== "ALL" ? "Nothing matches that filter." : "No trades logged yet."} body={search || filter !== "ALL" ? "Try a different search or clear the filter." : "Start with one honest check-in. Your record will follow."} action={search || filter !== "ALL" ? <Button variant="outline" onClick={() => { setSearch(""); setFilter("ALL"); }} data-testid="button-clear-filters">Clear filters</Button> : <Link href="/new-trade" data-testid="link-history-empty-new" className="inline-flex items-center gap-2 rounded-[9px] bg-primary px-4 py-2.5 text-[12px] font-bold text-primary-foreground"><Plus size={14} /> Log first trade</Link>} /></div> : <div className="divide-y divide-border">{trades.map((trade) => <Link key={trade.id} href={`/history/${trade.id}`} data-testid={`row-history-trade-${trade.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/60 md:grid-cols-[1.5fr_.7fr_.7fr_32px] md:gap-4 md:px-6"><span><span className="block text-[13px] font-bold">{fmtDate(trade.createdAt)}</span><span className="mt-1 block text-[11px] text-muted-foreground">{fmtTime(trade.createdAt)} · {trade.mistake || "No mistake noted"}</span></span><span className="hidden text-[12px] font-semibold text-muted-foreground md:block">{trade.disciplineScore}<span className="ml-1 text-[10px] font-normal">/100</span></span><span className="flex items-center gap-3 md:justify-end"><StatusPill result={trade.result} /><span className="font-mono-trading text-[12px] font-bold">{fmtMoney(trade.pnl)}</span></span><ChevronRight size={15} className="hidden text-muted-foreground/50 transition-transform group-hover:translate-x-1 md:block" /></Link>)}</div>}</section>
  </div>;
}

function TradeDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClientRef = useQueryClient();
  const id = Number(params.id);
  const tradeQuery = useGetTrade(id, { query: { enabled: !!id, queryKey: getGetTradeQueryKey(id) } });
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();
  const [editing, setEditing] = useState(false);
  const trade = tradeQuery.data as LooseTrade | undefined;
  const [draft, setDraft] = useState({ result: "", disciplineScore: "", pnl: "", mistake: "" });
  if (tradeQuery.isLoading) return <LoadingBlock />;
  if (tradeQuery.isError || !trade) return <ErrorState retry={() => tradeQuery.refetch()} />;
  const startEditing = () => { setDraft({ result: trade.result, disciplineScore: String(trade.disciplineScore), pnl: trade.pnl === null ? "" : String(trade.pnl), mistake: trade.mistake }); setEditing(true); };
  const save = () => updateTrade.mutate({ id, data: { result: draft.result as "WIN" | "LOSS" | "BREAKEVEN", disciplineScore: Number(draft.disciplineScore), pnl: draft.pnl === "" ? null : Number(draft.pnl), mistake: draft.mistake } }, { onSuccess: () => { setEditing(false); queryClientRef.invalidateQueries({ queryKey: getGetTradeQueryKey(id) }); queryClientRef.invalidateQueries({ queryKey: getListTradesQueryKey() }); queryClientRef.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() }); } });
  const remove = () => { if (window.confirm("Delete this trade from your record?")) deleteTrade.mutate({ id }, { onSuccess: () => { queryClientRef.invalidateQueries({ queryKey: getListTradesQueryKey() }); queryClientRef.invalidateQueries({ queryKey: getGetAnalyticsSummaryQueryKey() }); setLocation("/history"); } }); };
  const answer = (group: Record<string, unknown>) => Object.values(group)[0] as string || "No reflection captured.";
  return <div className="mx-auto max-w-[1020px]"><button onClick={() => setLocation("/history")} data-testid="button-back-history" className="mb-7 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground hover:text-foreground"><ChevronLeft size={15} /> History</button>
    <PageIntro eyebrow={`${fmtDate(trade.createdAt)} · ${fmtTime(trade.createdAt)}`} title="Trade debrief." subtitle="A quick look at the decision, the execution, and the lesson." action={<div className="flex gap-2"><Button variant="outline" onClick={editing ? () => setEditing(false) : startEditing} data-testid="button-edit-trade">{editing ? <><X size={14} /> Cancel</> : <><Pencil size={14} /> Edit</>}</Button><Button variant="danger" onClick={remove} disabled={deleteTrade.isPending} data-testid="button-delete-trade"><Trash2 size={14} /> Delete</Button></div>} />
    {editing && <section className="mb-4 rounded-[14px] border border-secondary bg-[hsl(var(--secondary)/.12)] p-5"><div className="grid gap-4 sm:grid-cols-4"><label className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Result<select value={draft.result} onChange={(event) => setDraft({ ...draft, result: event.target.value })} data-testid="select-edit-result" className="mt-2 w-full rounded-[8px] border border-input bg-card px-3 py-2 text-[12px] outline-none"><option value="WIN">Win</option><option value="LOSS">Loss</option><option value="BREAKEVEN">Even</option></select></label><label className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">Discipline<input type="number" min="0" max="100" value={draft.disciplineScore} onChange={(event) => setDraft({ ...draft, disciplineScore: event.target.value })} data-testid="input-edit-discipline" className="mt-2 w-full rounded-[8px] border border-input bg-card px-3 py-2 text-[12px] outline-none" /></label><label className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground">P&L<input type="number" value={draft.pnl} onChange={(event) => setDraft({ ...draft, pnl: event.target.value })} data-testid="input-edit-pnl" className="mt-2 w-full rounded-[8px] border border-input bg-card px-3 py-2 text-[12px] outline-none" /></label><label className="text-[10px] font-bold uppercase tracking-[.13em] text-muted-foreground sm:col-span-1">Mistake<input value={draft.mistake} onChange={(event) => setDraft({ ...draft, mistake: event.target.value })} data-testid="input-edit-mistake" className="mt-2 w-full rounded-[8px] border border-input bg-card px-3 py-2 text-[12px] outline-none" /></label></div><Button onClick={save} disabled={updateTrade.isPending} className="mt-4" data-testid="button-save-edit">{updateTrade.isPending ? "Saving…" : <><Check size={14} /> Save changes</>}</Button></section>}
    <div className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><section className="rounded-[14px] border border-card-border bg-primary p-6 text-primary-foreground"><div className="flex items-start justify-between"><StatusPill result={trade.result} /><span className="font-mono-trading text-[11px] text-primary-foreground/55">#{String(trade.id).padStart(4, "0")}</span></div><div className="mt-12 text-[10px] font-bold uppercase tracking-[.16em] text-primary-foreground/50">Trade result</div><div className="mt-2 font-display text-[48px] font-bold tracking-[-.08em]">{fmtMoney(trade.pnl)}</div><div className="mt-7 flex items-end justify-between border-t border-primary-foreground/15 pt-5"><div><div className="text-[10px] uppercase tracking-[.15em] text-primary-foreground/50">Discipline</div><div className="mt-1 font-display text-[25px] font-bold">{trade.disciplineScore}<span className="text-[13px] text-primary-foreground/45"> / 100</span></div></div><div className="h-12 w-12 rounded-full border-[5px] border-secondary/30 border-t-secondary" /></div></section><section className="space-y-3">{[["Before", answer(trade.beforeAnswers), "bg-[hsl(var(--chart-3)/.1)]"], ["During", answer(trade.duringAnswers), "bg-[hsl(var(--secondary)/.13)]"], ["After", answer(trade.afterAnswers), "bg-[hsl(var(--accent)/.1)]"]].map(([label, text, bg]) => <div key={label} className={`rounded-[12px] border border-card-border ${bg} p-5`}><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label} reflection</div><p data-testid={`text-${label.toLowerCase()}-reflection`} className="mt-3 text-[14px] leading-6">{text}</p></div>)}</section></div>
    <section className="mt-4 rounded-[14px] border border-card-border bg-card p-5 md:p-6"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground"><CircleCheck size={16} className="text-secondary" /> The thing to carry forward</div><p className="mt-4 text-[16px] font-semibold leading-7">{trade.mistake || "No mistake noted. Keep the clean process visible."}</p></section>
  </div>;
}

function Analytics() {
  const summaryQuery = useGetAnalyticsSummary({ query: { queryKey: getGetAnalyticsSummaryQueryKey() } });
  const tradesQuery = useListTrades({ query: { queryKey: getListTradesQueryKey() } });
  const summary = summaryQuery.data;
  const trades = (tradesQuery.data ?? []) as LooseTrade[];
  if (summaryQuery.isLoading || tradesQuery.isLoading) return <LoadingBlock />;
  if (summaryQuery.isError || tradesQuery.isError) return <ErrorState retry={() => { summaryQuery.refetch(); tradesQuery.refetch(); }} />;
  const discipline = summary?.disciplineSeries ?? [];
  const best = trades.filter((trade) => trade.pnl !== null).sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))[0];
  return <div><PageIntro eyebrow="Read the pattern" title="Performance, with context." subtitle="Numbers are useful. Numbers connected to your behaviour are actionable." action={<div className="flex items-center gap-2 rounded-[9px] border border-border bg-card px-3 py-2.5 text-[11px] font-bold text-muted-foreground"><Activity size={15} className="text-secondary" /> All time</div>} />
    <div className="grid gap-3 md:grid-cols-3"><Metric label="Total trades" value={String(summary?.totalTrades ?? 0)} note="Your complete sample" accent="ink" icon={Activity} /><Metric label="Average discipline" value={`${summary?.disciplineScore ?? 0}/100`} note="Keep this above outcome noise" accent="lime" icon={ShieldCheck} /><Metric label="Best trade" value={fmtMoney(best?.pnl)} note={best ? fmtDate(best.createdAt) : "Your next one is unwritten"} accent="coral" icon={TrendingUp} /></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><section className="rounded-[14px] border border-card-border bg-card p-5 md:p-6"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">P&L curve</div><h2 className="mt-2 font-display text-[22px] font-bold tracking-[-.05em]">Outcome over time</h2></div><span className="rounded-full bg-[hsl(var(--chart-3)/.1)] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--chart-3))]">USD</span></div><div className="mt-8"><MiniLineChart values={(summary?.pnlSeries ?? []).map((item) => item.value)} color="hsl(var(--chart-3))" fill /></div><div className="mt-2 flex justify-between text-[10px] font-mono-trading text-muted-foreground"><span>{summary?.pnlSeries?.[0]?.label ?? "Start"}</span><span>{summary?.pnlSeries?.at(-1)?.label ?? "Now"}</span></div></section><section className="rounded-[14px] border border-card-border bg-card p-5 md:p-6"><div className="flex items-start justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Process curve</div><h2 className="mt-2 font-display text-[22px] font-bold tracking-[-.05em]">Discipline over time</h2></div><span className="rounded-full bg-[hsl(var(--secondary)/.3)] px-2.5 py-1 text-[10px] font-bold text-primary">0—100</span></div><div className="mt-8"><MiniLineChart values={discipline.map((item) => item.value)} color="hsl(var(--secondary))" /></div><div className="mt-2 flex justify-between text-[10px] font-mono-trading text-muted-foreground"><span>{discipline[0]?.label ?? "Start"}</span><span>{discipline.at(-1)?.label ?? "Now"}</span></div></section></div>
    <section className="mt-4 grid gap-4 md:grid-cols-[1fr_.8fr]"><div className="rounded-[14px] border border-card-border bg-card p-5 md:p-6"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">A useful distinction</div><h2 className="mt-3 max-w-lg font-display text-[25px] font-bold leading-[1.05] tracking-[-.05em]">A good result can come from a bad process. Track the difference.</h2><div className="mt-6 grid gap-2 sm:grid-cols-2"><div className="rounded-[10px] bg-[hsl(var(--secondary)/.15)] p-4"><div className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">The aim</div><div className="mt-3 text-[13px] font-semibold">Make decisions you can repeat.</div></div><div className="rounded-[10px] bg-[hsl(var(--accent)/.1)] p-4"><div className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">The noise</div><div className="mt-3 text-[13px] font-semibold">Let one outcome define you.</div></div></div></div><div className="rounded-[14px] bg-primary p-6 text-primary-foreground"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-secondary"><Gauge size={15} /> Your current read</div><div className="mt-10 font-display text-[42px] font-bold tracking-[-.08em]">{summary?.disciplineScore ?? 0}<span className="text-[18px] text-primary-foreground/50"> / 100</span></div><p className="mt-2 text-[13px] leading-5 text-primary-foreground/65">{(summary?.disciplineScore ?? 0) >= 70 ? "The process is showing up. Protect the habit." : "Keep it simple. One honest check-in shifts the curve."}</p><Link href="/new-trade" data-testid="link-analytics-checkin" className="mt-8 inline-flex items-center gap-2 text-[12px] font-bold text-secondary">Log the next one <ArrowUpRight size={14} /></Link></div></section>
  </div>;
}

function Router() {
  return <RoutedErrorBoundary><AppShell><Switch><Route path="/" component={Dashboard} /><Route path="/new-trade" component={NewTrade} /><Route path="/history/:id" component={TradeDetail} /><Route path="/history" component={History} /><Route path="/analytics" component={Analytics} /><Route component={NotFound} /></Switch></AppShell></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;