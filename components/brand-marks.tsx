// Brand wordmarks — typographic approximations of each TRS sub-brand

export function ChocoBayMark({ className, color = '#6B4423' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 260 44" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Choco Bay">
      <text
        x="0" y="32"
        fontFamily="'Fraunces', 'Playfair Display', Georgia, serif"
        fontSize="34"
        fontWeight="400"
        letterSpacing="1"
        fill={color}
      >CHOCO BAY</text>
      {/* Swirl */}
      <g transform="translate(228, 22)" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
        <circle cx="0" cy="0" r="12" />
        <path d="M -6 0 Q -6 -6 0 -6 Q 6 -6 6 0 Q 6 3 3 3 Q 0 3 0 0" />
      </g>
    </svg>
  );
}

export function PashmaMark({ className, color = '#B02936' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 260 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Pashma">
      <text
        x="0" y="46"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="52"
        fontWeight="900"
        fontStyle="italic"
        fill={color}
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >Pashma</text>
    </svg>
  );
}

export function MotechMark({ className, color = '#F1E71D' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 300 88" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Motech">
      {/* Stacked "mo" — condensed lowercase */}
      <text
        x="0" y="52"
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize="42"
        fontWeight="900"
        letterSpacing="-3"
        fill={color}
      >mo</text>
      {/* TECH — bold chunky */}
      <text
        x="64" y="72"
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize="82"
        fontWeight="900"
        letterSpacing="-4"
        fill={color}
      >TECH</text>
    </svg>
  );
}

export function MishtaMark({ className, color = '#5A3A2A' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 240 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Mishta">
      <text
        x="0" y="46"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="48"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="-1"
        fill={color}
      >Mishta</text>
    </svg>
  );
}

export function SmilenMark({ className, color = '#20A39E' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 220 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Smilen">
      <text
        x="0" y="46"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="46"
        fontWeight="400"
        fill={color}
      >smilen</text>
    </svg>
  );
}

export function GladysMark({ className, color = '#E8A317' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 240 60" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Glady's">
      <text
        x="0" y="46"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="48"
        fontWeight="700"
        fontStyle="italic"
        fill={color}
      >Glady&apos;s</text>
    </svg>
  );
}
