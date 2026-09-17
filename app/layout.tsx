import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600'],
});

export const metadata: Metadata = {
  title: "Relay by TRS — Read anywhere. Delivered from anywhere.",
  description: "India's first travel-retail bookstore online. Books, tech, chocolates & luxury across 51 airport stores.",
  appleWebApp: {
    capable: true,
    title: 'Relay',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#CA0538',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      style={{
        '--font-sans': `var(--font-geist), -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", ui-sans-serif, system-ui, sans-serif`,
        '--font-display': `var(--font-geist), -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", ui-sans-serif, system-ui, sans-serif`,
        '--font-mono': `var(--font-geist-mono), "SF Mono", ui-monospace, monospace`,
      } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
