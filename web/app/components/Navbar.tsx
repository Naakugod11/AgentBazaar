'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const LINKS = [
  { label: 'Home',        href: '/' },
  { label: 'Floor',       href: '/floor' },
  { label: 'Registry',    href: '/registry' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'History',     href: '/history' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6 md:px-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span className="[font-family:var(--font-jetbrains-mono)] text-sm font-medium tracking-tight text-fg/90">
            agent baz<span className="text-purple">aa</span>r
          </span>
        </Link>

        {/* Nav links + wallet */}
        <div className="flex items-center gap-6 md:gap-8">
          <nav className="flex items-center gap-7 md:gap-9">
            {LINKS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'font-mono text-[10px] tracking-[0.3em] uppercase transition-colors',
                    'border-b-2 pb-px',
                    active
                      ? 'text-purple border-purple/70'
                      : 'text-muted border-transparent hover:text-fg/80',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {mounted
            ? <WalletMultiButton className="wallet-nav-btn" />
            : <div className="h-9 w-[130px] rounded-lg" />}
        </div>

      </div>
    </header>
  );
}
