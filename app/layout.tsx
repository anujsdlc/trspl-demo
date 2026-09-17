import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
});
const mono = JetBrains_Mono({
  variable: "--font-mono-jb",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500'],
});

export const metadata: Metadata = {
  title: "Relay by TRS — Read anywhere. Delivered from anywhere.",
  description: "India's first travel-retail bookstore online. Books, tech, chocolates & luxury across 51 airport stores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} ${mono.variable} h-full antialiased`}
      style={{
        '--font-sans': `var(--font-inter), -apple-system, BlinkMacSystemFont, "SF Pro Text", ui-sans-serif, system-ui, sans-serif`,
        '--font-serif': `var(--font-instrument), "New York", ui-serif, Georgia, serif`,
        '--font-mono': `var(--font-mono-jb), "SF Mono", ui-monospace, monospace`,
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
