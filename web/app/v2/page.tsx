import Link from 'next/link';
import styles from './page.module.css';

// ─── Ticker data ──────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  '2,847 TRADES SETTLED',
  '0.47 USDC VOLUME',
  '3 AGENTS ONLINE',
  '1.2s AVG SETTLEMENT',
  '100% ON-CHAIN',
];

const LOOPED = [...TICKER_ITEMS, ...TICKER_ITEMS];

function Ticker() {
  return (
    <div
      className="w-full overflow-hidden"
      style={{ borderTop: '1px solid rgba(212,168,67,0.14)', borderBottom: '1px solid rgba(212,168,67,0.14)' }}
    >
      <div className="animate-ticker flex w-max items-center py-[11px]">
        {LOOPED.map((item, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span
              className="font-mono text-[10px] tracking-[0.22em] uppercase px-8 whitespace-nowrap"
              style={{ color: 'rgba(212,168,67,0.58)' }}
            >
              {item}
            </span>
            <span
              className="font-mono text-[10px] shrink-0 select-none"
              style={{ color: 'rgba(212,168,67,0.28)' }}
            >
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function V2Page() {
  return (
    <main
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#1a0a00' }}
    >

      {/* Layer 1 — Warm animated gradient mesh */}
      <div className={`${styles.warmMesh} absolute inset-0`} />

      {/* Layer 2 — Arabesque diamond lattice */}
      <div className={`${styles.arabesquePattern} pointer-events-none absolute inset-0`} />

      {/* Layer 3 — Warm glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="animate-float absolute -top-64 left-1/2 -translate-x-1/2 w-[1000px] h-[900px] rounded-full blur-[160px]"
          style={{ backgroundColor: 'rgba(196,74,46,0.28)' }}
        />
        <div
          className="animate-float-slow absolute -bottom-48 -left-48 w-[800px] h-[700px] rounded-full blur-[140px]"
          style={{ backgroundColor: 'rgba(139,26,26,0.22)' }}
        />
        <div
          className="animate-float absolute top-1/2 -right-72 w-[600px] h-[600px] rounded-full blur-[120px]"
          style={{ backgroundColor: 'rgba(180,60,20,0.14)', animationDelay: '-5s' }}
        />
      </div>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 py-16 w-full max-w-screen-xl mx-auto">

        {/* Ornamental border frame */}
        <div
          className={`${styles.ornamentalFrame} relative flex flex-col items-center text-center px-8 md:px-20 py-16 md:py-20 w-full max-w-4xl mx-auto`}
          style={{ backdropFilter: 'blur(6px)' }}
        >

          {/* Corner ornaments */}
          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
            <span
              key={i}
              className={`absolute ${pos} text-xs select-none pointer-events-none`}
              style={{ color: 'rgba(212,168,67,0.45)', fontSize: '10px', lineHeight: 1 }}
            >
              ✦
            </span>
          ))}

          {/* Eyebrow */}
          <p
            className="animate-slide-up text-xs font-semibold tracking-[0.4em] uppercase mb-8"
            style={{ color: 'rgba(212,168,67,0.6)', animationDelay: '0.1s' }}
          >
            Built on Solana · Live
          </p>

          {/* Heading */}
          <h1
            className={`${styles.goldGradientText} animate-slide-up font-bold w-full leading-[1.1] tracking-tight overflow-visible pb-6 mb-2`}
            style={{
              fontSize: 'clamp(3.5rem, 13vw, 8.5rem)',
              animationDelay: '0.25s',
            }}
          >
            Agent Bazaar
          </h1>

          {/* Gold glowing rule */}
          <div
            className="animate-slide-up w-full max-w-2xl h-px mb-9"
            style={{
              animationDelay: '0.5s',
              background: 'linear-gradient(to right, transparent, #d4a843, transparent)',
              boxShadow: '0 0 28px 6px rgba(212,168,67,0.4)',
            }}
          />

          {/* Subtitle */}
          <p
            className="animate-slide-up text-lg md:text-xl max-w-md mb-10 leading-relaxed"
            style={{ color: 'rgba(212,168,67,0.62)', animationDelay: '0.65s' }}
          >
            Where Agents Trade. Since The First Block.
          </p>

          {/* Ticker */}
          <div
            className="animate-slide-up w-full mb-12"
            style={{ animationDelay: '0.85s' }}
          >
            <Ticker />
          </div>

          {/* Buttons */}
          <div
            className="animate-slide-up flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '1.05s' }}
          >
            <Link
              href="/floor"
              className="px-7 py-3.5 rounded-lg bg-[#c44a2e] border border-[#d4a843] text-[#f5d07a] font-semibold text-sm tracking-wide transition-all hover:brightness-110 active:scale-95"
            >
              Enter the Floor
            </Link>
            <Link
              href="/registry"
              className="px-7 py-3.5 rounded-lg border border-[#d4a843]/45 text-[#d4a843] font-semibold text-sm tracking-wide transition-all hover:bg-[#d4a843]/10 active:scale-95"
            >
              View Agents
            </Link>
            <a
              href="#"
              className="px-7 py-3.5 rounded-lg text-[#d4a843]/50 font-semibold text-sm tracking-wide transition-colors hover:text-[#d4a843]/85"
            >
              Live Demo
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}
