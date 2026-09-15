// TRS Skyline — cross-brand travel loyalty program

export type TierKey = 'SILVER' | 'GOLD' | 'PLATINUM' | 'BLACK';

export interface Tier {
  key: TierKey;
  name: string;
  gradient: string;
  textOn: string;
  threshold: number;  // annual INR spend to reach
  earn: number;       // base points per ₹100
  discount: number;   // % off online orders
  perks: string[];
}

export const TIERS: Tier[] = [
  {
    key: 'SILVER',
    name: 'Skyline Silver',
    gradient: 'from-zinc-300 via-zinc-100 to-zinc-400',
    textOn: 'text-zinc-900',
    threshold: 0,
    earn: 5,
    discount: 2,
    perks: [
      '5 points per ₹100 across all TRS stores',
      'Welcome bonus of 250 points on sign-up',
      'Birthday-month 2× multiplier',
      'Free delivery on orders above ₹599',
    ],
  },
  {
    key: 'GOLD',
    name: 'Skyline Gold',
    gradient: 'from-amber-200 via-yellow-300 to-amber-500',
    textOn: 'text-amber-950',
    threshold: 15000,
    earn: 8,
    discount: 5,
    perks: [
      '8 points per ₹100 · 60% higher earn rate',
      'Priority pickup at any airport store',
      'Complimentary gift-wrap on 3 orders per month',
      'Early access to new arrivals (48h before public)',
      'Free delivery — no minimum',
    ],
  },
  {
    key: 'PLATINUM',
    name: 'Skyline Platinum',
    gradient: 'from-slate-200 via-slate-50 to-slate-300',
    textOn: 'text-slate-900',
    threshold: 40000,
    earn: 12,
    discount: 8,
    perks: [
      '12 points per ₹100 · 2.4× the base rate',
      'Dedicated concierge line — book any title, we source it',
      'Complimentary hot beverage at Relay stores',
      'Fabelle chocolate box on birthday',
      '2 guest passes per year for airport lounge (partner)',
      'Extended shopping window — reserve online, pick up post-security',
    ],
  },
  {
    key: 'BLACK',
    name: 'Skyline Black',
    gradient: 'from-neutral-800 via-neutral-950 to-black',
    textOn: 'text-white',
    threshold: 100000,
    earn: 20,
    discount: 12,
    perks: [
      '20 points per ₹100 · 4× the base rate',
      'Private concierge · WhatsApp shopping',
      'Pashma cashmere styling appointment (1/year)',
      'Complimentary Motech travel kit annually',
      'Airport lounge access (4 visits/year — partner network)',
      'Curated quarterly book box hand-selected by our editors',
      'Complimentary same-day delivery in home city',
    ],
  },
];

export const CATEGORY_MULTIPLIER: Record<string, { mult: number; label: string }> = {
  books:         { mult: 2,   label: 'Books · 2× points' },
  manga:         { mult: 2,   label: 'Manga · 2× points' },
  fiction:       { mult: 2,   label: 'Fiction · 2× points' },
  'non-fiction': { mult: 2,   label: 'Non-Fiction · 2× points' },
  children:      { mult: 2,   label: "Children's · 2× points" },
  tech:          { mult: 3,   label: 'Tech at Motech · 3× points' },
  travel:        { mult: 3,   label: 'Travel essentials · 3× points' },
  cashmere:      { mult: 4,   label: 'Pashma luxury · 4× points' },
  sweets:        { mult: 1.5, label: 'Mishta sweets · 1.5× points' },
  confectionery: { mult: 1.5, label: 'Chocolates · 1.5× points' },
  gifts:         { mult: 2,   label: 'Gifting · 2× points' },
  stationery:    { mult: 1,   label: 'Stationery · base points' },
  toys:          { mult: 1,   label: 'Toys · base points' },
};

export const VOLUME_TIERS = [
  { min: 0,     bonus: 1.0, label: 'Base earn' },
  { min: 2000,  bonus: 1.1, label: '+10% on orders above ₹2,000' },
  { min: 5000,  bonus: 1.25,label: '+25% on orders above ₹5,000' },
  { min: 10000, bonus: 1.5, label: '+50% on orders above ₹10,000' },
];

export const BONUSES = [
  { key: 'signup',    label: 'Sign-up welcome',        points: 250,  freq: 'One-time' },
  { key: 'firstbuy',  label: 'First purchase',          points: 500,  freq: 'One-time' },
  { key: 'referral',  label: 'Refer a friend (per join)',points: 1000, freq: 'Unlimited' },
  { key: 'review',    label: 'Verified review',         points: 100,  freq: 'Per product' },
  { key: 'birthday',  label: 'Birthday month',          points: '2×', freq: 'Annual' },
  { key: 'airport',   label: 'In-store scan at airport',points: 150,  freq: 'Per store visit' },
  { key: 'streak',    label: '3-month spending streak', points: 750,  freq: 'Rolling' },
  { key: 'anniversary',label: 'Membership anniversary', points: 1500, freq: 'Annual' },
];

export const REDEMPTION = {
  ratio: 0.5,           // 1 point = ₹0.50
  minPoints: 200,       // min redeemable
  capPerOrder: 0.20,    // max 20% of order value can be paid with points
};

export function tierFor(annualSpend: number): Tier {
  return [...TIERS].reverse().find(t => annualSpend >= t.threshold) ?? TIERS[0];
}

export function nextTier(current: Tier): Tier | undefined {
  const idx = TIERS.findIndex(t => t.key === current.key);
  return TIERS[idx + 1];
}

export function calculatePoints(opts: {
  amount: number;
  category?: string;
  tier: Tier;
}): { base: number; multiplied: number; volume: number; total: number; breakdown: string[] } {
  const { amount, category, tier } = opts;
  const base = Math.floor((amount / 100) * tier.earn);
  const catMult = category ? (CATEGORY_MULTIPLIER[category]?.mult ?? 1) : 1;
  const multiplied = Math.floor(base * catMult);
  const vol = [...VOLUME_TIERS].reverse().find(v => amount >= v.min)!;
  const total = Math.floor(multiplied * vol.bonus);
  return {
    base,
    multiplied,
    volume: total - multiplied,
    total,
    breakdown: [
      `${tier.earn} pts per ₹100 = ${base} pts`,
      catMult !== 1 ? `Category ${catMult}× → ${multiplied} pts` : '',
      vol.bonus !== 1 ? `Volume bonus +${Math.round((vol.bonus - 1) * 100)}% → ${total} pts` : '',
    ].filter(Boolean),
  };
}

// Demo member
export const DEMO_MEMBER = {
  id: 'TRS-8827-4413-9021',
  name: 'Anjali Krishnan',
  since: '2024-04-11',
  city: 'Bangalore',
  boardingPassPnr: '8XZK2P',
  points: 12480,
  ytdSpend: 47200,
  visits: 34,
  favouriteStore: 'BLR T2-A',
};
