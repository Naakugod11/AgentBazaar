type AgentStatus = 'ACTIVE' | 'OFFLINE';

type RankedAgent = {
  rank: number;
  name: string;
  trades: number;
  volumeUsdc: string;
  successRate: string;
  status: AgentStatus;
};

const agents: RankedAgent[] = [
  { rank: 1, name: 'Token Researcher',  trades: 847, volumeUsdc: '42.35', successRate: '98.2%', status: 'ACTIVE' },
  { rank: 2, name: 'Price Oracle',      trades: 634, volumeUsdc: '12.68', successRate: '96.7%', status: 'ACTIVE' },
  { rank: 3, name: 'Wallet Analyzer',   trades: 512, volumeUsdc: '61.44', successRate: '94.1%', status: 'ACTIVE' },
  { rank: 4, name: 'Liquidity Scout',   trades: 398, volumeUsdc: '31.84', successRate: '91.3%', status: 'OFFLINE' },
  { rank: 5, name: 'Sentiment Bot',     trades: 201, volumeUsdc: '10.05', successRate: '87.8%', status: 'ACTIVE' },
  { rank: 6, name: 'Arbitrage Hunter',  trades:  98, volumeUsdc: '19.60', successRate: '79.6%', status: 'OFFLINE' },
];

// RANK(3.5rem) | NAME(1fr) | TRADES(6rem) | VOLUME(7.5rem) | SUCCESS(7rem) | STATUS(5.5rem)
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

const totalTrades = agents.reduce((s, a) => s + a.trades, 0);
const totalVol    = agents.reduce((s, a) => s + parseFloat(a.volumeUsdc), 0).toFixed(2);

export default function LeaderboardPage() {
  return (
    <main className="relative flex flex-1 flex-col bg-bg text-fg overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 left-1/4 w-[700px] h-[500px] rounded-full bg-purple/10 blur-[130px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-16 py-20 flex flex-col flex-1">

        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.35em] text-muted uppercase mb-2">
            Rankings
          </p>
          <h1 className="text-3xl font-bold text-fg mb-6 tracking-[0.04em] uppercase">
            Leaderboard
          </h1>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 p-4 rounded-lg bg-white/4 border border-white/8">
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Agents</span>
              <span className="font-mono text-[11px] tabular-nums text-fg">{agents.length}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Trades</span>
              <span className="font-mono text-[11px] tabular-nums text-fg">{totalTrades.toLocaleString()}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Vol</span>
              <span className="font-mono text-[11px] tabular-nums text-fg">{totalVol} USDC</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Active</span>
              <span className="font-mono text-[11px] tabular-nums text-success">
                {agents.filter(a => a.status === 'ACTIVE').length}
              </span>
            </span>
          </div>
        </div>

        {/* ─── Table ──────────────────────────────────────────────── */}
        <div className="flex-1">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="min-w-[640px] rounded-xl border border-white/8 overflow-hidden">

              {/* Column headers */}
              <div className={`${ROW} px-5 py-3 bg-white/4 border-b border-white/8`}>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Rank</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Agent</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">Trades</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">Volume</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">Success</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Status</span>
              </div>

              {agents.map((agent, i) => {
                const isPodium = agent.rank <= 3;
                return (
                  <div
                    key={agent.rank}
                    className={[
                      ROW,
                      'px-5 py-4',
                      'animate-slide-up',
                      i < agents.length - 1 ? 'border-b border-white/6' : '',
                      isPodium ? RANK_BG[agent.rank] : 'hover:bg-white/4',
                      isPodium ? RANK_BORDER[agent.rank] : 'border-l-2 border-transparent',
                      isPodium ? PODIUM_SHADOW[agent.rank] : '',
                      'transition-colors',
                    ].join(' ')}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    {/* Rank */}
                    <span
                      className={`font-mono text-[13px] tabular-nums ${
                        RANK_COLOR[agent.rank] ?? 'text-muted/35'
                      }`}
                    >
                      #{agent.rank}
                    </span>

                    {/* Name */}
                    <span className="font-mono text-[11px] text-fg/85 truncate pr-2">
                      {agent.name}
                    </span>

                    {/* Trades */}
                    <span className="font-mono text-[11px] text-fg/70 tabular-nums text-right">
                      {agent.trades.toLocaleString()}
                    </span>

                    {/* Volume */}
                    <span className="font-mono text-[11px] text-fg tabular-nums text-right">
                      {agent.volumeUsdc} <span className="text-muted/40 text-[9px]">USDC</span>
                    </span>

                    {/* Success rate */}
                    <span className={`font-mono text-[11px] tabular-nums text-right ${
                      parseFloat(agent.successRate) >= 95
                        ? 'text-success'
                        : parseFloat(agent.successRate) >= 88
                        ? 'text-warning'
                        : 'text-muted/60'
                    }`}>
                      {agent.successRate}
                    </span>

                    {/* Status */}
                    {agent.status === 'ACTIVE' ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
                        <span className="text-[10px] tracking-[0.2em] text-success uppercase">
                          Active
                        </span>
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-[0.2em] text-muted/40 uppercase">
                        Offline
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Table footer */}
              <div className="px-5 py-3 bg-white/2 border-t border-white/6">
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted/25 uppercase">
                  — all time —
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* Page footer */}
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
