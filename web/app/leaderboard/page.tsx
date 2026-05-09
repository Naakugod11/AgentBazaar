'use client';

import { useAgents, useJobs } from '@/app/components/ChainStore';

const ROW = 'grid grid-cols-[3.5rem_1fr_6rem_7.5rem_7rem_5.5rem] items-center gap-x-5';

const RANK_COLOR: Record<number, string> = {
  1: 'text-[#d4a843] font-bold',
  2: 'text-fg/55 font-semibold',
  3: 'text-[#cd7f32] font-semibold',
};
const RANK_BORDER: Record<number, string> = {
  1: 'border-l-2 border-[#d4a843]/55',
  2: 'border-l-2 border-white/20',
  3: 'border-l-2 border-[#cd7f32]/40',
};
const RANK_BG: Record<number, string> = {
  1: 'bg-[#d4a843]/5',
  2: 'bg-white/4',
  3: 'bg-[#cd7f32]/4',
};
const PODIUM_SHADOW: Record<number, string> = {
  1: 'shadow-[inset_4px_0_16px_rgba(212,168,67,0.08)]',
  2: 'shadow-[inset_4px_0_12px_rgba(255,255,255,0.04)]',
  3: 'shadow-[inset_4px_0_12px_rgba(205,127,50,0.06)]',
};

export default function LeaderboardPage() {
  const { agents, loading: agentsLoading } = useAgents();
  const { jobs,   loading: jobsLoading   } = useJobs();

  const loading = agentsLoading || jobsLoading;

  // Build per-provider stats from real job data
  const agentNameByProvider = new Map(agents.map(a => [a.id, a.name]));

  const statsMap = new Map<string, { name: string; total: number; settled: number; volume: number }>();
  for (const job of jobs) {
    const key = job.provider;
    if (!statsMap.has(key)) {
      statsMap.set(key, { name: job.provider, total: 0, settled: 0, volume: 0 });
    }
    const s = statsMap.get(key)!;
    s.total++;
    if (job.status === 'SETTLED') { s.settled++; s.volume += parseFloat(job.amount); }
  }

  const ranked = [...statsMap.values()]
    .sort((a, b) => b.volume - a.volume || b.settled - a.settled)
    .map((s, i) => ({ rank: i + 1, ...s }));

  const totalTrades = ranked.reduce((n, r) => n + r.total, 0);
  const totalVol    = ranked.reduce((n, r) => n + r.volume, 0).toFixed(2);

  return (
    <main className="relative flex flex-1 flex-col bg-bg text-fg overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/4 w-[700px] h-[500px] rounded-full bg-purple/10 blur-[130px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-16 py-20 flex flex-col flex-1">

        <div className="mb-10">
          <p className="text-xs tracking-[0.35em] text-muted uppercase mb-2">Rankings</p>
          <h1 className="text-3xl font-bold text-fg mb-6 tracking-[0.04em] uppercase">Leaderboard</h1>

          <div className="flex flex-wrap gap-x-8 gap-y-2 p-4 rounded-lg bg-white/4 border border-white/8">
            {[
              { label: 'Agents',  value: loading ? '…' : String(ranked.length) },
              { label: 'Trades',  value: loading ? '…' : totalTrades.toLocaleString() },
              { label: 'Vol',     value: loading ? '…' : `${totalVol} USDC` },
              { label: 'Active',  value: loading ? '…' : String(agents.length) },
            ].map(({ label, value }) => (
              <span key={label} className="flex items-baseline gap-1.5">
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">{label}</span>
                <span className="font-mono text-[11px] tabular-nums text-fg">{value}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="min-w-[640px] rounded-xl border border-white/8 overflow-hidden">

              <div className={`${ROW} px-5 py-3 bg-white/4 border-b border-white/8`}>
                {['Rank', 'Agent', 'Trades', 'Volume', 'Success', 'Status'].map((h, i) => (
                  <span key={h} className={`font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase ${i >= 2 && i <= 4 ? 'text-right' : ''}`}>{h}</span>
                ))}
              </div>

              {loading ? (
                <div className="px-5 py-8 text-center">
                  <span className="font-mono text-[10px] text-muted/40">Loading from devnet…</span>
                </div>
              ) : ranked.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <span className="font-mono text-[10px] text-muted/40">No settled jobs yet.</span>
                </div>
              ) : ranked.map((agent, i) => {
                const isPodium = agent.rank <= 3;
                const successRate = agent.total > 0
                  ? ((agent.settled / agent.total) * 100).toFixed(1) + '%'
                  : '—';
                const isRegistered = agents.some(a => a.name === agent.name);
                return (
                  <div
                    key={agent.name}
                    className={[
                      ROW, 'px-5 py-4', 'animate-slide-up',
                      i < ranked.length - 1 ? 'border-b border-white/6' : '',
                      isPodium ? RANK_BG[agent.rank] : 'hover:bg-white/4',
                      isPodium ? RANK_BORDER[agent.rank] : 'border-l-2 border-transparent',
                      isPodium ? PODIUM_SHADOW[agent.rank] : '',
                      'transition-colors',
                    ].join(' ')}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <span className={`font-mono text-[13px] tabular-nums ${RANK_COLOR[agent.rank] ?? 'text-muted/35'}`}>
                      #{agent.rank}
                    </span>
                    <span className="font-mono text-[11px] text-fg/85 truncate pr-2">{agent.name}</span>
                    <span className="font-mono text-[11px] text-fg/70 tabular-nums text-right">{agent.total.toLocaleString()}</span>
                    <span className="font-mono text-[11px] text-fg tabular-nums text-right">
                      {agent.volume.toFixed(2)} <span className="text-muted/40 text-[9px]">USDC</span>
                    </span>
                    <span className={`font-mono text-[11px] tabular-nums text-right ${
                      parseFloat(successRate) >= 95 ? 'text-success'
                      : parseFloat(successRate) >= 88 ? 'text-warning'
                      : 'text-muted/60'
                    }`}>{successRate}</span>
                    {isRegistered ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
                        <span className="text-[10px] tracking-[0.2em] text-success uppercase">Active</span>
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-[0.2em] text-muted/40 uppercase">Offline</span>
                    )}
                  </div>
                );
              })}

              <div className="px-5 py-3 bg-white/2 border-t border-white/6">
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted/25 uppercase">— all time —</span>
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
