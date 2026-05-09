import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-cinzel',
});

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${cinzel.variable} flex flex-1 flex-col`}>
      {children}
    </div>
  );
}
