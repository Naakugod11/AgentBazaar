'use client';

import { useJobs } from '@/app/components/ChainStore';

const ROW = 'grid grid-cols-[8rem_1fr_5.5rem_5.5rem_5.5rem] items-center gap-x-5';

export default function HistoryPage() {
  const { jobs, loading } = useJobs();

  const settled = jobs.filter(j => j.status === 'SETTLED');
  const totalVol = settled.reduce((s, j) => s + parseFloat(j.amount), 0).toFixed(2);

  return (
    <main className="relative flex flex-1 flex-col bg-bg text-fg overflow-hidden">
      <div className="pointer-events-none absolute top-0 right-1/4 w-[700px] h-[500px] rounded-full bg-purple/10 blur-[130px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-16 py-20 flex flex-col flex-1">

        <div className="mb-10">
          <p className="text-xs tracking-[0.35em] text-muted uppercase mb-2">Completed Trades</p>
          <h1 className="text-3xl font-bold text-fg mb-6 tracking-[0.04em] uppercase">Settlement History</h1>

          <div className="flex flex-wrap gap-x-8 gap-y-2 p-4 rounded-lg bg-white/4 border border-white/8">
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Settled</span>
              <span className="font-mono text-[11px] tabular-nums text-success">{loading ? '…' : settled.length}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Vol</span>
              <span className="font-mono text-[11px] tabular-nums text-fg">{loading ? '…' : `${totalVol} USDC`}</span>
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="min-w-[600px] rounded-xl border border-white/8 overflow-hidden">

              <div className={`${ROW} px-5 py-3 bg-white/4 border-b border-white/8`}>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">TX</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Flow</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">USDC</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">Time</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Status</span>
              </div>

              {loading ? (
                <div className="px-5 py-8 text-center">
                  <span className="font-mono text-[10px] text-muted/40">Fetching from devnet…</span>
                </div>
              ) : settled.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <span className="font-mono text-[10px] text-muted/40">No settled trades yet.</span>
                </div>
              ) : settled.map((job, i) => (
                <div
                  key={job.id}
                  className={[
                    ROW, 'px-5 py-4', 'animate-slide-up',
                    i < settled.length - 1 ? 'border-b border-white/6' : '',
                    'hover:bg-white/4 transition-colors',
                  ].join(' ')}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <span className="font-mono text-[10px] text-muted/40 tracking-wide">{job.id}</span>
                  <span className="font-mono text-[11px] text-fg/80 truncate pr-2">
                    {job.consumer} <span className="text-muted/40">→</span> {job.provider}
                  </span>
                  <span className="font-mono text-[11px] text-fg tabular-nums text-right">{job.amount}</span>
                  <span className="font-mono text-[10px] text-muted/50 tabular-nums text-right">{job.time}</span>
                  <span className="inline-block font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-[3px] rounded-full bg-success/15 text-success border border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.45)]">
                    Settled
                  </span>
                </div>
              ))}

              <div className="px-5 py-3 bg-white/2 border-t border-white/6">
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted/25 uppercase">— end of block —</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 mt-12 pt-5 flex justify-between">
          <span className="text-[10px] tracking-[0.35em] text-muted/30 uppercase">Agent Bazaar</span>
          <span className="text-[10px] tracking-[0.35em] text-muted/30 uppercase">Solana</span>
        </div>
      </div>
    </main>
  );
}
