// Brand wordmarks — official artwork for Choco Bay, Mishta, Motech, and
// Smilen (PNGs in public/brands/). Pashma and Glady's still fall back to
// typographic SVG approximations until the source artwork is provided.

import Image from 'next/image';

interface MarkProps {
  className?: string;
  /** Optional foreground color override — honoured only by the SVG
   *  fallback marks. PNG marks preserve their brand palette; wrap them in
   *  a coloured background or apply a filter at the call site if needed. */
  color?: string;
}

function PngMark({ src, w, h, alt, className }: { src: string; w: number; h: number; alt: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={className}
      style={{ objectFit: 'contain', width: 'auto' }}
      unoptimized
      priority
    />
  );
}

export function ChocoBayMark({ className }: MarkProps) {
  return <PngMark src="/brands/choco-bay.png" w={3160} h={635} alt="Choco Bay" className={className} />;
}

export function MishtaMark({ className }: MarkProps) {
  return <PngMark src="/brands/mishta.png" w={3160} h={960} alt="Mishta" className={className} />;
}

export function MotechMark({ className }: MarkProps) {
  return <PngMark src="/brands/motech.png" w={3160} h={1195} alt="Motech" className={className} />;
}

export function SmilenMark({ className }: MarkProps) {
  return <PngMark src="/brands/smilen.png" w={3160} h={961} alt="Smilen" className={className} />;
}

// === SVG fallbacks (still awaiting official artwork) ===

export function PashmaMark({ className, color = '#B02936' }: MarkProps) {
  return (
    <svg viewBox="0 0 260 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Pashma">
      <text
        x="0" y="46"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize="52"
        fontWeight="900"
        fontStyle="italic"
        fill={color}
      >Pashma</text>
    </svg>
  );
}

export function GladysMark({ className, color = '#E8A317' }: MarkProps) {
  return (
    <svg viewBox="0 0 240 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Glady's">
      <text
        x="0" y="46"
        fontFamily="var(--font-serif), Georgia, serif"
        fontSize="48"
        fontWeight="700"
        fontStyle="italic"
        fill={color}
      >Glady&apos;s</text>
    </svg>
  );
}
