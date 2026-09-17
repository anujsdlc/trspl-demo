// RELAY logo — bold white slanted sans on crimson red badge with a
// pin-dot circle in place of the terminal period.

const RELAY_RED = '#ca0538';

export function RelayLogo({ className, monochrome }: { className?: string; monochrome?: boolean }) {
  const bg = monochrome ? 'transparent' : RELAY_RED;
  const fg = monochrome ? 'currentColor' : '#FFFFFF';
  return (
    <svg viewBox="0 0 200 88" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Relay">
      <rect width="200" height="88" rx="6" fill={bg} />
      <g transform="skewX(-8)">
        <text
          x="18"
          y="66"
          fontFamily="var(--font-display), 'Inter', system-ui, sans-serif"
          fontSize="62"
          fontWeight="900"
          fill={fg}
          letterSpacing="-2.5"
          style={{ fontStretch: 'condensed' }}
        >
          RELAY
        </text>
      </g>
      {/* Pin-dot replacing the period */}
      <circle cx="172" cy="60" r="7" fill="none" stroke={fg} strokeWidth="3.5" />
    </svg>
  );
}

export function RelayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Relay">
      <rect width="40" height="40" rx="6" fill={RELAY_RED} />
      <g transform="skewX(-8)">
        <text
          x="7"
          y="30"
          fontFamily="var(--font-display), 'Inter', system-ui, sans-serif"
          fontSize="24"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="-1"
        >
          R
        </text>
      </g>
      <circle cx="30" cy="26" r="3" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
    </svg>
  );
}
