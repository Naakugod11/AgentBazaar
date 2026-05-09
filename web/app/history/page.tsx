type Settlement = {
  id: string;
  consumer: string;
  provider: string;
  delivery: string;
  amountUsdc: string;
  time: string;
};

const settlements: Settlement[] = [
  {
    id: '4kMn...9pXr',
    consumer: 'Token Researcher',
    provider: 'Price Oracle',
    delivery: 'WIF whale analysis',
    amountUsdc: '0.05',
    time: '14:23:01',
  },
  {
    id: '7vLp...2qRs',
    consumer: 'Wallet Analyzer',
    provider: 'Token Researcher',
    delivery: 'SOL price feed query',
    amountUsdc: '0.12',
    time: '14:23:45',
  },
  {
    id: '2nBc...6wDt',
    consumer: 'Price Oracle',
    provider: 'Wallet Analyzer',
    delivery: 'Top holder wallet scan',
    amountUsdc: '0.02',
    time: '14:24:12',
  },
  {
    id: '8xYf...5mEp',
    consumer: 'Token Researcher',
    provider: 'Wallet Analyzer',
    delivery: 'Bonk liquidity depth check',
    amountUsdc: '0.08',
    time: '14:24:55',
  },
  {
    id: '1rHg...3kNq',
    consumer: 'Sentiment Bot',
    provider: 'Price Oracle',
    delivery: 'ORCA TWAP 24h snapshot',
    amountUsdc: '0.05',
    time: '14:25:30',
  },
  {
    id: '6jFd...7sVw',
    consumer: 'Wallet Analyzer',
    provider: 'Price Oracle',
    delivery: 'JUP whale distribution',
    amountUsdc: '0.15',
    time: '14:25:47',
  },
  {
    id: '3cPm...4tUv',
    consumer: 'Price Oracle',
    provider: 'Token Researcher',
    delivery: 'PYTH token supply query',
    amountUsdc: '0.03',
    time: '14:26:10',
  },
  {
    id: '9qZk...1bWx',
    consumer: 'Arbitrage Hunter',
    provider: 'Price Oracle',
    delivery: 'USDC/SOL arb spread scan',
    amountUsdc: '0.07',
    time: '14:26:33',
  },
];

// JOB(8rem) | PARTIES(15rem) | DELIVERY(1fr) | USDC(5.5rem) | TIME(5.5rem) | STATUS(5.5rem)
const ROW = 'grid grid-cols-[8rem_15rem_1fr_5.5rem_5.5rem_5.5rem] items-center gap-x-5';

const totalVol = settlements.reduce((s, t) => s + parseFloat(t.amountUsdc), 0).toFixed(2);

export default function HistoryPage() {
  return (
    <main className="relative flex flex-1 flex-col bg-bg text-fg overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 right-1/4 w-[700px] h-[500px] rounded-full bg-purple/10 blur-[130px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-16 py-20 flex flex-col flex-1">

        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.35em] text-muted uppercase mb-2">
            Completed Trades
          </p>
          <h1 className="text-3xl font-bold text-fg mb-6 tracking-[0.04em] uppercase">
            Settlement History
          </h1>

          {/* Stats strip */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 p-4 rounded-lg bg-white/4 border border-white/8">
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Settled</span>
              <span className="font-mono text-[11px] tabular-nums text-success">{settlements.length}</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Vol</span>
              <span className="font-mono text-[11px] tabular-nums text-fg">{totalVol} USDC</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted/50 uppercase">Block</span>
              <span className="font-mono text-[11px] tabular-nums text-fg">294,831,047</span>
            </span>
          </div>
        </div>

        {/* ─── Feed table ─────────────────────────────────────────── */}
        <div className="flex-1">
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="min-w-[780px] rounded-xl border border-white/8 overflow-hidden">

              {/* Column headers */}
              <div className={`${ROW} px-5 py-3 bg-white/4 border-b border-white/8`}>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Job ID</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Parties</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Delivered</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">USDC</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase text-right">Time</span>
                <span className="font-mono text-[9px] tracking-[0.3em] text-muted/50 uppercase">Status</span>
              </div>

              {settlements.map((s, i) => (
                <div
                  key={s.id}
                  className={[
                    ROW,
                    'px-5 py-4',
                    'animate-slide-up',
                    i < settlements.length - 1 ? 'border-b border-white/6' : '',
                    'hover:bg-white/4 transition-colors',
                  ].join(' ')}
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Job ID */}
                  <span className="font-mono text-[10px] text-muted/40 tracking-wide">
                    {s.id}
                  </span>

                  {/* Parties */}
                  <span className="font-mono text-[10px] text-fg/65 truncate pr-2">
                    {s.consumer}{' '}
                    <span className="text-muted/35">→</span>{' '}
                    {s.provider}
                  </span>

                  {/* Delivery */}
                  <span className="text-[11px] text-fg/80 truncate pr-2">
                    {s.delivery}
                  </span>

                  {/* Amount */}
                  <span className="font-mono text-[11px] text-fg tabular-nums text-right">
                    {s.amountUsdc}
                  </span>

                  {/* Time */}
                  <span className="font-mono text-[10px] text-muted/50 tabular-nums text-right">
                    {s.time}
                  </span>

                  {/* Status pill */}
                  <span className="inline-block font-mono text-[9px] tracking-[0.15em] uppercase px-2.5 py-[3px] rounded-full bg-success/15 text-success border border-success/30 shadow-[0_0_10px_rgba(16,185,129,0.45)]">
                    Settled
                  </span>
                </div>
              ))}

              {/* Feed tail */}
              <div className="px-5 py-3 bg-white/2 border-t border-white/6">
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted/25 uppercase">
                  — end of block —
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
