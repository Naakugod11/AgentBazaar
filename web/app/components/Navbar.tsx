'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { label: 'Home',        href: '/' },
  { label: 'Floor',       href: '/floor' },
  { label: 'Registry',    href: '/registry' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'History',     href: '/history' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6 md:px-16">

        {/* Logo */}
        <Link
          href="/"
          className="[font-family:var(--font-jetbrains-mono)] text-[11px] font-semibold tracking-[0.32em] text-fg/90 uppercase hover:text-fg transition-colors"
        >
          Agent Bazaar
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-7 md:gap-9">
          {LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'font-mono text-[10px] tracking-[0.3em] uppercase transition-colors',
                  'border-b-2 pb-px',                   // reserve underline space on all items
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

      </div>
    </header>
  );
}
