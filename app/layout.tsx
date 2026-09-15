import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: 'swap' });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: 'swap' });
const mono = JetBrains_Mono({ variable: "--font-mono-jb", subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "Relay by TRS — Read anywhere. Delivered from anywhere.",
  description: "India's first travel-retail bookstore online. Books, tech, chocolates & luxury across 51 airport stores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${mono.variable} h-full antialiased`}
      style={{
        '--font-sans': `var(--font-inter), ui-sans-serif, system-ui, sans-serif`,
        '--font-serif': `var(--font-fraunces), Georgia, serif`,
        '--font-mono': `var(--font-mono-jb), ui-monospace, monospace`,
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
