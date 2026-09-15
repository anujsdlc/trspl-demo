// RELAY logo — bold white slanted sans on crimson red badge with location-pin dot

export function RelayLogo({ className, monochrome }: { className?: string; monochrome?: boolean }) {
  const bg = monochrome ? 'transparent' : '#C42127';
  const fg = monochrome ? 'currentColor' : '#FFFFFF';
  return (
    <svg viewBox="0 0 200 88" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Relay">
      <rect width="200" height="88" rx="4" fill={bg} />
      <g transform="skewX(-8)">
        <text
          x="14"
          y="66"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="62"
          fontWeight="900"
          fill={fg}
          letterSpacing="-3"
          style={{ fontStretch: 'condensed' }}
        >
          RELAY.
        </text>
      </g>
      {/* Small pin-circle after the period */}
      <circle cx="176" cy="60" r="6" fill="none" stroke={fg} strokeWidth="3" />
    </svg>
  );
}

export function RelayMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Relay">
      <rect width="40" height="40" rx="4" fill="#C42127" />
      <g transform="skewX(-8)">
        <text
          x="6"
          y="30"
          fontFamily="'Inter', system-ui, sans-serif"
          fontSize="24"
          fontWeight="900"
          fill="#fff"
          letterSpacing="-1"
        >
          R.
        </text>
      </g>
      <circle cx="30" cy="26" r="2.5" fill="none" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}
