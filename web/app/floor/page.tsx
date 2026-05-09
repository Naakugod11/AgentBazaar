'use client';

import { useState } from 'react';
import { useJobs, type TradeRow, type TradeStatus } from '@/app/components/ChainStore';

type Status = TradeStatus;

const statusStyles: Record<Status, string> = {
  ESCROWED: "bg-purple/15 text-purple  border border-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.45)]",
  SETTLED:  "bg-success/15 text-success border border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.45)]",
  EXPIRED:  "bg-warning/15 text-warning border border-warning/30",
};

const statValueClass: Record<Status, string> = {
  ESCROWED: "text-purple",
  SETTLED:  "text-success",
  EXPIRED:  "text-warning",
};

// TX(8rem) | Flow(1fr) | Amount(5.5rem) | Status(9rem) | Time(5rem)
const ROW = "grid grid-cols-[8rem_1fr_5.5rem_9rem_5rem] items-center gap-x-5";

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-[3px] rounded-full ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-fg",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">
        {label}
      </span>
      <span className={`font-mono text-[11px] tabular-nums ${valueClass}`}>
        {value}
      </span>
    </span>
  );
}

export default function FloorPage() {
  const { jobs: trades, loading }   = useJobs();
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL');

  const filteredTrades: TradeRow[] = statusFilter === 'ALL'
    ? trades
    : trades.filter((t) => t.status === statusFilter);

  // Stats computed from all trades (not filtered)
  const totalVol = trades
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    .toFixed(2);

  const tally = {
    ESCROWED: trades.filter((t) => t.status === 'ESCROWED').length,
    SETTLED:  trades.filter((t) => t.status === 'SETTLED').length,
    EXPIRED:  trades.filter((t) => t.status === 'EXPIRED').length,
  };

  return (
    <main className="relative flex flex-1 flex-col bg-bg text-fg overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-purple/10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-16 flex flex-col flex-1 py-20">

        {/* ─── Header ───────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs tracking-[0.35em] text-muted uppercase">
              The Floor
            </p>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple animate-live-pulse" />
              <span className="text-[10px] tracking-[0.3em] text-muted/60 uppercase">
                Live
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-fg">Trade Feed</h1>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | Status)}
              className="font-mono text-[10px] tracking-[0.2em] uppercase bg-white/4 border border-white/10 rounded-lg px-3 py-2 text-muted/70 cursor-pointer hover:border-white/25 hover:text-fg/80 focus:outline-none focus:border-purple/40 transition-colors appearance-none"
            >
              <option value="ALL">All Trades</option>
              <option value="SETTLED">Settled</option>
              <option value="ESCROWED">Escrowed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 p-4 rounded-lg bg-white/4 border border-white/8">
            <Stat label="Vol"      value={loading ? '…' : `${totalVol} USDC`} />
            <Stat label="Trades"   value={loading ? '…' : String(trades.length)} />
            <Stat label="Escrowed" value={loading ? '…' : String(tally.ESCROWED)} valueClass={statValueClass.ESCROWED} />
            <Stat label="Settled"  value={loading ? '…' : String(tally.SETTLED)}  valueClass={statValueClass.SETTLED} />
            <Stat label="Expired"  value={loading ? '…' : String(tally.EXPIRED)}  valueClass={statValueClass.EXPIRED} />
          </div>
        </div>

        {/* ─── Feed table ───────────────────────────────────────── */}
        <div className="flex-1">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="min-w-[640px] rounded-xl border border-white/8 overflow-hidden">

              {/* Column headers */}
              <div className={`${ROW} px-5 py-3 bg-white/4 border-b border-white/8`}>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">TX</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Flow</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">USDC</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Status</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">Time</span>
              </div>

              {/* Trade rows */}
              {loading && filteredTrades.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <span className="font-mono text-[10px] text-muted/40">Fetching trades from devnet…</span>
                </div>
              ) : filteredTrades.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <span className="font-mono text-[10px] text-muted/40">No trades match this filter.</span>
                </div>
              ) : (
                filteredTrades.map((trade, i) => (
                  <div
                    key={trade.id}
                    className={[
                      ROW,
                      "px-5 py-4",
                      "animate-slide-up",
                      i < filteredTrades.length - 1 ? "border-b border-white/6" : "",
                      "hover:bg-white/4 transition-colors",
                    ].join(" ")}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <span className="font-mono text-[10px] text-muted/40 tracking-wide">
                      {trade.id}
                    </span>
                    <span className="font-mono text-[11px] text-fg/80 truncate pr-2">
                      {trade.consumer}{" "}
                      <span className="text-muted/40">→</span>{" "}
                      {trade.provider}
                    </span>
                    <span className="font-mono text-[11px] text-fg tabular-nums">
                      {trade.amount}
                    </span>
                    <StatusPill status={trade.status} />
                    <span className="font-mono text-[10px] text-muted/50 tabular-nums text-right">
                      {trade.time}
                    </span>
                  </div>
                ))
              )}

              {/* Feed tail */}
              <div className="px-5 py-3 bg-white/2 border-t border-white/6">
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted/25 uppercase">
                  — end of block —
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 mt-12 pt-5 flex justify-between">
          <span className="text-[10px] tracking-[0.35em] text-muted/30 uppercase">
            Agent Bazaar
          </span>
          <span className="text-[10px] tracking-[0.35em] text-muted/30 uppercase">
            Solana
          </span>
        </div>

      </div>
    </main>
  );
}
