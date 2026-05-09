'use client';

import { useState } from 'react';
import { useAgents, type AgentRow } from '@/app/components/ChainStore';

const FILTERS = ['All', 'Wallet Analysis', 'Token Research', 'Price Feeds', 'Other'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_KEYWORD: Partial<Record<Filter, string>> = {
  'Wallet Analysis': 'wallet',
  'Token Research':  'token',
  'Price Feeds':     'price',
};

function AgentCard({ agent }: { agent: AgentRow }) {
  return (
    <article
      className={[
        "flex flex-col p-6 rounded-xl backdrop-blur-sm",
        "transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02]",
        agent.active
          ? "bg-white/6 border border-purple/35 hover:border-purple/55 hover:shadow-[0_0_28px_rgba(124,58,237,0.28)]"
          : "bg-white/4 border border-white/8 hover:border-white/20 hover:shadow-[0_0_16px_rgba(255,255,255,0.05)]",
      ].join(" ")}
    >
      {/* Status row */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] tracking-[0.3em] text-muted/60 uppercase font-mono">
          #{agent.id}
        </span>
        {agent.active ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
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

      {/* Name */}
      <h2 className="text-sm font-semibold text-fg mb-2">{agent.name}</h2>

      {/* Capability */}
      <p className="text-xs text-muted leading-relaxed mb-5 grow">
        {agent.capability}
      </p>

      {/* Endpoint */}
      <p className="font-mono text-[10px] text-muted/40 truncate mb-5 pt-4 border-t border-white/8">
        {agent.endpoint}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-warning">
          {agent.price} USDC
        </span>
        <span className="text-[10px] text-muted/50 tracking-wider uppercase">
          / call
        </span>
      </div>
    </article>
  );
}

export default function RegistryPage() {
  const { agents, loading }                 = useAgents();
  const [search, setSearch]                 = useState('');
  const [activeFilter, setActiveFilter]     = useState<Filter>('All');

  const activeCount = agents.filter((a) => a.active).length;

  const filteredAgents = agents.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(q) ||
      a.capability.toLowerCase().includes(q) ||
      a.endpoint.toLowerCase().includes(q);

    const keyword = FILTER_KEYWORD[activeFilter];
    const matchesFilter =
      activeFilter === 'All'
        ? true
        : activeFilter === 'Other'
        ? !Object.values(FILTER_KEYWORD).some((k) => a.capability.toLowerCase().includes(k!))
        : a.capability.toLowerCase().includes(keyword!);

    return matchesSearch && matchesFilter;
  });

  return (
    <main className="relative flex flex-1 flex-col bg-bg text-fg overflow-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-purple/10 blur-[130px]" />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 md:px-16 py-20 flex flex-col flex-1">

        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.35em] text-muted uppercase mb-4">
            Agent Registry
          </p>
          <h1 className="text-3xl font-bold text-fg mb-2">Registered Agents</h1>
          <p className="text-sm text-muted">
            {loading ? 'Loading…' : `${agents.length} agents listed — ${activeCount} active`}
          </p>
        </div>

        {/* ── Search bar ─────────────────────────────────────────── */}
        <div className="relative mb-4">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/40"
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, capability, or pubkey..."
            className="w-full bg-white/4 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-sm text-fg placeholder:text-muted/40 focus:outline-none focus:border-purple/40 focus:bg-white/6 transition-all"
          />
        </div>

        {/* ── Filter chips ────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={[
                'font-mono text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border transition-colors',
                activeFilter === f
                  ? 'bg-purple/20 border-purple/50 text-purple'
                  : 'bg-white/4 border-white/10 text-muted/60 hover:border-white/25 hover:text-fg/70',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-auto">
          {loading && agents.length === 0 ? (
            <p className="col-span-full text-sm text-muted/50 text-center py-12">
              Fetching agents from devnet…
            </p>
          ) : filteredAgents.length === 0 ? (
            <p className="col-span-full text-sm text-muted/50 text-center py-12">
              No agents match your search.
            </p>
          ) : (
            filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/8 mt-16 pt-5 flex justify-between">
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
