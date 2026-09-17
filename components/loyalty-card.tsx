'use client';

import { Plane, Sparkles } from 'lucide-react';
import { DEMO_MEMBER, TIERS, tierFor } from '@/lib/loyalty';

// Static QR SVG (deterministic pattern)
function QRPattern({ seed }: { seed: string }) {
  // Generate a deterministic 21x21 QR-like grid
  const size = 21;
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      cells[y][x] = (hash % 100) > 55;
    }
  }
  // Force finder patterns at 3 corners
  const finder = [[0,0],[0,size-7],[size-7,0]];
  for (const [oy, ox] of finder) {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const edge = y === 0 || y === 6 || x === 0 || x === 6;
      const inner = y >= 2 && y <= 4 && x >= 2 && x <= 4;
      cells[oy+y][ox+x] = edge || inner;
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <rect width={size} height={size} fill="white" />
      {cells.flatMap((row, y) => row.map((on, x) =>
        on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="black" /> : null
      ))}
    </svg>
  );
}

export function LoyaltyCardPreview() {
  const tier = tierFor(DEMO_MEMBER.ytdSpend);

  return (
    <div className="relative max-w-[440px] mx-auto">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-[color:var(--color-crimson)]/15 blur-3xl rounded-full -z-10" />

      <div className="holo aspect-[1.586/1] rounded-[22px] px-7 py-6 md:px-8 md:py-7 text-white shadow-[0_20px_60px_-20px_rgba(196,33,39,0.55)] relative overflow-hidden">
        {/* Top row — programme + tier */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.35em] text-white/55 font-mono">Travel Retail Services</div>
            <div className="font-serif text-[26px] mt-1 tracking-tight leading-none">Skyline</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/55 font-mono">{tier.name}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-white/90">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase tracking-wider">{tier.earn}× base rate</span>
            </div>
          </div>
        </div>

        {/* Member identity */}
        <div className="relative z-10 mt-5 md:mt-6">
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-mono">Member</div>
          <div className="font-serif text-[19px] md:text-[22px] mt-1 leading-tight">{DEMO_MEMBER.name}</div>
          <div className="font-mono text-[11px] mt-1.5 text-white/65 tracking-wider">{DEMO_MEMBER.id}</div>
        </div>

        {/* Bottom row — balance + QR with breathing room */}
        <div className="relative z-10 mt-4 md:mt-5 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-mono">Points balance</div>
            <div className="editorial-num text-[34px] md:text-[38px] leading-none mt-1">
              {DEMO_MEMBER.points.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-white/45 font-mono mt-1 tracking-wider">Member since Apr 2024</div>
          </div>
          <div className="shrink-0 w-[72px] h-[72px] md:w-20 md:h-20 bg-white rounded-lg p-2 shadow-inner">
            <QRPattern seed={DEMO_MEMBER.id} />
          </div>
        </div>

        {/* Plane deco */}
        <Plane className="absolute top-8 right-32 w-8 h-8 text-white/10 rotate-45 pointer-events-none" />
      </div>

      {/* Card back preview (offset shadow) */}
      <div className="absolute -bottom-4 -left-4 -right-4 h-8 bg-black/15 blur-md rounded-full -z-10" />

      {/* Boarding-pass style tab */}
      <div className="mt-3 flex items-center gap-3 justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-[color:var(--color-ink-muted)]">
        <div>Valid across all TRS stores</div>
        <div>Tap to add to Apple Wallet</div>
      </div>
    </div>
  );
}
