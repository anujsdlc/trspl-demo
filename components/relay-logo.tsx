// RELAY logo — uses the official supplied PNG artwork.
// public/relay-logo.png contains the RELAY. wordmark on the red brand
// square with the pin-dot terminal. This component is the single place
// the app renders it, so anywhere we want the logo we import from here.

import Image from 'next/image';

interface LogoProps {
  className?: string;
  /** Rare cases where we need a knocked-out mono version (e.g. print or
   *  dark-on-light contexts). When true we fall back to a simple SVG that
   *  matches the wordmark shape in `currentColor`. */
  monochrome?: boolean;
}

const LOGO_SRC = '/relay-logo.png';
// Intrinsic pixel dimensions of the artwork — required by next/image so
// it can reserve layout space without shifting.
const INTRINSIC_W = 1650;
const INTRINSIC_H = 787;

export function RelayLogo({ className, monochrome }: LogoProps) {
  if (monochrome) return <MonoRelay className={className} />;
  return (
    <Image
      src={LOGO_SRC}
      alt="Relay"
      width={INTRINSIC_W}
      height={INTRINSIC_H}
      className={className}
      priority
      unoptimized
    />
  );
}

export function RelayMark({ className }: { className?: string }) {
  // Small variant (formerly a red square with a lone R) — now the same
  // official wordmark, just scaled small. Keeps a consistent brand look.
  return (
    <Image
      src={LOGO_SRC}
      alt="Relay"
      width={INTRINSIC_W}
      height={INTRINSIC_H}
      className={className}
      priority
      unoptimized
    />
  );
}

function MonoRelay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 88" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Relay">
      <g transform="skewX(-8)">
        <text
          x="18"
          y="66"
          fontFamily="var(--font-display), 'Inter', system-ui, sans-serif"
          fontSize="62"
          fontWeight="900"
          fill="currentColor"
          letterSpacing="-2.5"
        >
          RELAY
        </text>
      </g>
      <circle cx="172" cy="60" r="7" fill="none" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  );
}
