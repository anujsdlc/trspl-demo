'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

interface SafeImageProps extends Omit<ImageProps, 'onError' | 'alt'> {
  alt: string;
  /** Text used to seed the fallback tile (usually the product title). */
  fallbackSeed?: string;
}

/**
 * Wraps next/image with an onError fallback so a broken CDN link never
 * shows an empty box. Falls through to a branded, seed-tinted tile that
 * paints the first letter of the product title.
 *
 * Every product photo in the demo is temporary reference imagery — real
 * photography lands post-store-launch.
 */
export function SafeImage({ alt, fallbackSeed, className, ...rest }: SafeImageProps) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return <ImagePlaceholder seed={fallbackSeed || alt} className={className as string} />;
  }

  return (
    <Image
      {...rest}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}

/** Deterministic gradient palette from the seed string. Keeps the tile
 *  looking like a real photo cell rather than a raw error state. */
function ImagePlaceholder({ seed, className }: { seed: string; className?: string }) {
  const hash = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const palettes: [string, string][] = [
    ['#FEE9EC', '#FCD1D6'],
    ['#F5EFE4', '#EDE4D0'],
    ['#EEF3F7', '#DDE6EF'],
    ['#F2ECE0', '#E8DDC7'],
    ['#F5F5F7', '#E5E5EA'],
    ['#FDF2F4', '#F5D9DC'],
  ];
  const [from, to] = palettes[hash % palettes.length];
  const initial = seed.trim().charAt(0).toUpperCase() || 'R';
  return (
    <div
      className={`relative flex items-center justify-center ${className || ''}`}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
      }}
      aria-label={seed}
    >
      <div className="font-serif text-4xl md:text-5xl text-[color:var(--color-ink)] opacity-40 select-none">
        {initial}
      </div>
      <div className="absolute bottom-2 right-2 text-[8px] uppercase tracking-widest font-mono text-[color:var(--color-ink-muted)]">
        reference
      </div>
    </div>
  );
}
