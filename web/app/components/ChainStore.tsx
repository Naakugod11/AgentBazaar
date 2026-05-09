'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { BN } from '@anchor-lang/core';
import { getReadProgram, getConnection, PROGRAM_ID } from '@/app/lib/program';

// ─── Exported row types (match the shapes registry/floor pages expect) ─────────

export type AgentRow = {
  id: string;       // zero-padded index: '001', '002', …
  name: string;
  capability: string;
  endpoint: string;
  price: string;    // USDC string e.g. '0.05'
  active: boolean;  // on-chain presence → always true
};

export type TradeStatus = 'ESCROWED' | 'SETTLED' | 'EXPIRED';

export type TradeRow = {
  id: string;       // truncated account pubkey
  consumer: string; // truncated wallet
  provider: string; // truncated wallet
  amount: string;   // USDC string
  status: TradeStatus;
  time: string;     // HH:MM:SS from delivery deadline
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseStatus(raw: unknown): TradeStatus {
  const r = raw as Record<string, unknown>;
  if (r.settled  !== undefined) return 'SETTLED';
  if (r.proposed !== undefined || r.accepted !== undefined) return 'ESCROWED';
  return 'EXPIRED';
}

function trunc(key: string): string {
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function formatTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

// ─── Context ──────────────────────────────────────────────────────────────────

type ChainState = {
  agents:  AgentRow[];
  jobs:    TradeRow[];
  loading: boolean;
};

const ChainContext = createContext<ChainState>({
  agents: [], jobs: [], loading: true,
});

export function ChainStoreProvider({ children }: { children: React.ReactNode }) {
  const [agents,  setAgents]  = useState<AgentRow[]>([]);
  const [jobs,    setJobs]    = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const program    = getReadProgram();
    const connection = getConnection();

    async function fetchAll() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accounts = program.account as any;
        const [rawAgents, rawJobs] = await Promise.all([
          accounts.agentAccount.all(),
          accounts.jobOffer.all(),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAgents(rawAgents.map((a: any, i: number) => ({
          id:         String(i + 1).padStart(3, '0'),
          name:       a.account.name as string,
          capability: a.account.capability as string,
          endpoint:   a.account.endpoint as string,
          price:      ((a.account.priceHint as BN).toNumber() / 1_000_000).toFixed(2),
          active:     true,
        })));

        const agentByOwner = new Map<string, string>(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rawAgents.map((a: any) => [
            (a.account.owner as { toBase58(): string }).toBase58(),
            a.account.name as string,
          ])
        );
        const nameOrTrunc = (pubkey: { toBase58(): string }) => {
          const key = pubkey.toBase58();
          return agentByOwner.get(key) ?? trunc(key);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sorted = [...rawJobs].sort((a: any, b: any) =>
          (b.account.acceptanceDeadline as BN).toNumber() -
          (a.account.acceptanceDeadline as BN).toNumber()
        );
        setJobs(sorted.map((j: any) => ({
          id:       trunc(j.publicKey.toBase58()),
          consumer: nameOrTrunc(j.account.consumer),
          provider: nameOrTrunc(j.account.provider),
          amount:   ((j.account.offerAmount as BN).toNumber() / 1_000_000).toFixed(2),
          status:   parseStatus(j.account.status),
          time:     formatTime((j.account.acceptanceDeadline as BN).toNumber() - 120),
        })));
      } catch (err) {
        console.error('[ChainStore] fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();

    // WebSocket subscription — fires instantly when an account changes
    const subId = connection.onProgramAccountChange(
      PROGRAM_ID,
      () => { fetchAll(); },
      'confirmed',
    );

    // Polling fallback — public devnet RPC WebSocket is unreliable
    const pollId = setInterval(fetchAll, 5_000);

    return () => {
      connection.removeProgramAccountChangeListener(subId);
      clearInterval(pollId);
    };
  }, []);

  return (
    <ChainContext.Provider value={{ agents, jobs, loading }}>
      {children}
    </ChainContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAgents() {
  const { agents, loading } = useContext(ChainContext);
  return { agents, loading };
}

export function useJobs() {
  const { jobs, loading } = useContext(ChainContext);
  return { jobs, loading };
}
