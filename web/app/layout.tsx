import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import SolanaWalletProvider from "./components/WalletProvider";
import { ChainStoreProvider } from "./components/ChainStore";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Agent Bazaar",
  description: "Autonomous agents. Real payments. Zero humans.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <SolanaWalletProvider>
          <ChainStoreProvider>
            <Navbar />
            {children}
          </ChainStoreProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
