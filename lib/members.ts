// Skyline members — deterministic seed data + localStorage-backed store.
// Mock demo data: server generates a base list, client persists additions.

import { TIERS, tierFor, type TierKey } from './loyalty';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  tier: TierKey;
  points: number;
  ytdSpend: number;
  lifetimeSpend: number;
  joinDate: string;
  lastVisit: string;
  visits: number;
  favouriteStore: string;
  boardingPassPnr?: string;
  createdInSession?: boolean;
}

const FIRST = [
  'Anjali', 'Rahul', 'Sanjay', 'Priya', 'Kavya', 'Vikram', 'Meera', 'Deepika',
  'Arjun', 'Neha', 'Rohan', 'Isha', 'Aditya', 'Riya', 'Karan', 'Shreya',
  'Nikhil', 'Tanvi', 'Aryan', 'Sneha', 'Aakash', 'Pooja', 'Manish', 'Divya',
  'Siddharth', 'Ananya', 'Varun', 'Kritika', 'Aman', 'Nisha', 'Yash', 'Ritu',
  'Harsh', 'Simran', 'Devansh', 'Aisha', 'Pranav', 'Ishika', 'Ayush', 'Trisha',
  'Ranveer', 'Naina', 'Kabir', 'Aarohi', 'Dhruv', 'Zara', 'Vihaan', 'Myra',
  'Ishaan', 'Saanvi', 'Reyansh', 'Diya', 'Advait', 'Tara', 'Kian', 'Anaya',
];

const LAST = [
  'Krishnan', 'Mehta', 'Iyer', 'Sharma', 'Nair', 'Rao', 'Bhatt', 'Menon',
  'Joshi', 'Reddy', 'Singh', 'Fernandes', 'Chatterjee', 'Pillai', 'Verma',
  'Kaur', 'Das', 'Kapoor', 'Malhotra', 'Gupta', 'Chopra', 'Agarwal', 'Bose',
  'Banerjee', 'Mukherjee', 'Desai', 'Patel', 'Shah', 'Jain', 'Kulkarni',
  'Deshmukh', 'Roy', 'Sen', 'Ghosh', 'Datta', 'Basu', 'Mathur', 'Chauhan',
  'Bhattacharya', 'Saxena', 'Tripathi', 'Mishra', 'Pandey', 'Trivedi',
];

const CITIES = ['Bangalore', 'Delhi', 'Mumbai', 'Gurgaon', 'Kochi', 'Hyderabad',
                'Chennai', 'Pune', 'Goa', 'Indore', 'Kolkata', 'Bhubaneshwar'];

const STORE_CODES = [
  'BLR T2-A', 'BLR T2-B', 'BLR T1-A', 'DEL T3-Intl', 'DEL T3-Dom',
  'BOM T2-Intl', 'HYD T1-A', 'MAA Landside', 'PNQ T1', 'COK T3',
  'GOI MOPA T1', 'CCU T2-A',
];

const PNR_ALPHA = 'ABCDEFGHJKLMNPRSTUVWXYZ23456789';

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function memberId(rng: () => number): string {
  const g1 = Math.floor(rng() * 9000 + 1000);
  const g2 = Math.floor(rng() * 9000 + 1000);
  const g3 = Math.floor(rng() * 9000 + 1000);
  return `TRS-${g1}-${g2}-${g3}`;
}

function pnr(rng: () => number): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += PNR_ALPHA[Math.floor(rng() * PNR_ALPHA.length)];
  return s;
}

function phoneNumber(rng: () => number): string {
  return `+91 9${Math.floor(rng() * 900000000 + 100000000)}`;
}

function daysAgoDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// Hand-curated top members (also shown on the loyalty admin page).
const SEED_MEMBERS: Member[] = [
  { id: 'TRS-8827-4413-9021', name: 'Anjali Krishnan', email: 'anjali.k@gmail.com',    phone: '+91 98450 21100', city: 'Bangalore', tier: 'PLATINUM', points: 12480, ytdSpend: 47200,  lifetimeSpend: 184000, joinDate: '2024-04-11', lastVisit: daysAgoDate(2),  visits: 34, favouriteStore: 'BLR T2-A',   boardingPassPnr: '8XZK2P' },
  { id: 'TRS-8827-1902-4711', name: 'Rahul Mehta',      email: 'rahul.mehta@icloud.com',phone: '+91 98110 44210', city: 'Delhi',     tier: 'GOLD',     points: 6220,  ytdSpend: 22400,  lifetimeSpend: 78500,  joinDate: '2024-06-02', lastVisit: daysAgoDate(5),  visits: 19, favouriteStore: 'DEL T3-Intl' },
  { id: 'TRS-8827-3388-2011', name: 'Sanjay Iyer',      email: 'sanjay.iyer@outlook.com', phone: '+91 98200 33771', city: 'Mumbai',   tier: 'BLACK',    points: 34120, ytdSpend: 128500, lifetimeSpend: 412000, joinDate: '2023-11-19', lastVisit: daysAgoDate(1),  visits: 76, favouriteStore: 'BOM T2-Intl', boardingPassPnr: 'W3H8Y1' },
  { id: 'TRS-8827-5501-7729', name: 'Priya Sharma',     email: 'priya.sharma@gmail.com', phone: '+91 96540 22118', city: 'Gurgaon',   tier: 'SILVER',   points: 890,   ytdSpend: 4200,   lifetimeSpend: 8100,   joinDate: '2025-02-14', lastVisit: daysAgoDate(11), visits: 6,  favouriteStore: 'DEL T3-Dom' },
  { id: 'TRS-8827-9911-4402', name: 'Kavya Nair',       email: 'kavya.n@gmail.com',      phone: '+91 94470 55889', city: 'Kochi',     tier: 'PLATINUM', points: 15790, ytdSpend: 62100,  lifetimeSpend: 198000, joinDate: '2024-01-08', lastVisit: daysAgoDate(3),  visits: 41, favouriteStore: 'COK T3' },
  { id: 'TRS-8827-2244-8801', name: 'Vikram Rao',       email: 'vikram.rao@yahoo.in',    phone: '+91 91060 12034', city: 'Hyderabad', tier: 'GOLD',     points: 8830,  ytdSpend: 27600,  lifetimeSpend: 91000,  joinDate: '2024-08-22', lastVisit: daysAgoDate(4),  visits: 22, favouriteStore: 'HYD T1-A' },
  { id: 'TRS-8827-6677-1155', name: 'Meera Krishnan',   email: 'meera.krishnan@gmail.com', phone: '+91 90070 66401', city: 'Chennai', tier: 'SILVER',   points: 1440,  ytdSpend: 6100,   lifetimeSpend: 14200,  joinDate: '2025-01-28', lastVisit: daysAgoDate(9),  visits: 8,  favouriteStore: 'MAA Landside' },
  { id: 'TRS-8827-4488-9922', name: 'Deepika Bhatt',    email: 'deepika.b@gmail.com',    phone: '+91 89870 30115', city: 'Pune',      tier: 'GOLD',     points: 9210,  ytdSpend: 24800,  lifetimeSpend: 82600,  joinDate: '2024-05-30', lastVisit: daysAgoDate(6),  visits: 25, favouriteStore: 'PNQ T1' },
];

function generateMembers(count: number): Member[] {
  const rng = mulberry32(88274413);
  const out: Member[] = [...SEED_MEMBERS];
  for (let i = 0; i < count; i++) {
    const first = pick(rng, FIRST);
    const last = pick(rng, LAST);
    const name = `${first} ${last}`;
    const city = pick(rng, CITIES);
    const store = pick(rng, STORE_CODES);
    // spend follows a long-tail: most silver, some gold, few platinum, rare black
    const roll = rng();
    let ytdSpend: number;
    if (roll < 0.60) ytdSpend = Math.floor(rng() * 14000 + 300);          // Silver
    else if (roll < 0.85) ytdSpend = Math.floor(rng() * 24000 + 15000);   // Gold
    else if (roll < 0.97) ytdSpend = Math.floor(rng() * 55000 + 40000);   // Platinum
    else ytdSpend = Math.floor(rng() * 220000 + 100000);                  // Black
    const tier = tierFor(ytdSpend);
    const lifetimeMult = 1 + rng() * 3; // 1×–4× of YTD
    const lifetimeSpend = Math.floor(ytdSpend * lifetimeMult);
    const points = Math.floor(ytdSpend * (tier.earn / 100) * (0.4 + rng() * 0.4));
    const joinDaysAgo = Math.floor(rng() * 900) + 20;
    const lastVisitDaysAgo = Math.floor(rng() * 45) + 1;
    const visits = Math.max(1, Math.floor(rng() * 60 * (1 - Math.min(1, lastVisitDaysAgo / 45))));
    const wantsPnr = rng() > 0.4;
    out.push({
      id: memberId(rng),
      name,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@${pick(rng, ['gmail.com', 'outlook.com', 'yahoo.in', 'icloud.com', 'proton.me'])}`,
      phone: phoneNumber(rng),
      city,
      tier: tier.key,
      points,
      ytdSpend,
      lifetimeSpend,
      joinDate: daysAgoDate(joinDaysAgo),
      lastVisit: daysAgoDate(lastVisitDaysAgo),
      visits,
      favouriteStore: store,
      boardingPassPnr: wantsPnr ? pnr(rng) : undefined,
    });
  }
  return out;
}

export const BASE_MEMBERS: Member[] = generateMembers(212);

// Total programme size — what the KPI says. Real records only cover a slice.
export const TOTAL_MEMBERS = 28412;

const STORAGE_KEY = 'trs.loyalty.members.v1';
const DELETED_KEY = 'trs.loyalty.members.deleted.v1';

function isBrowser() {
  return typeof window !== 'undefined';
}

function readAdded(): Member[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Member[]) : [];
  } catch {
    return [];
  }
}

function writeAdded(members: Member[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function readDeleted(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeDeleted(ids: string[]) {
  if (!isBrowser()) return;
  localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
}

export function loadMembers(): Member[] {
  const added = readAdded();
  const deleted = new Set(readDeleted());
  const base = BASE_MEMBERS.filter(m => !deleted.has(m.id));
  return [...added, ...base];
}

export function saveMember(member: Member) {
  const added = readAdded();
  const idx = added.findIndex(m => m.id === member.id);
  if (idx >= 0) added[idx] = member;
  else added.unshift({ ...member, createdInSession: true });
  writeAdded(added);
}

export function updateMember(id: string, patch: Partial<Member>) {
  const added = readAdded();
  const idx = added.findIndex(m => m.id === id);
  if (idx >= 0) {
    added[idx] = { ...added[idx], ...patch };
    writeAdded(added);
    return;
  }
  // If editing a base member, snapshot it into added storage so changes persist.
  const base = BASE_MEMBERS.find(m => m.id === id);
  if (base) {
    added.unshift({ ...base, ...patch });
    writeAdded(added);
  }
}

export function deleteMember(id: string) {
  const added = readAdded();
  const filtered = added.filter(m => m.id !== id);
  if (filtered.length !== added.length) {
    writeAdded(filtered);
    return;
  }
  // Deleting a base member — remember it's hidden.
  const deleted = readDeleted();
  if (!deleted.includes(id)) {
    deleted.push(id);
    writeDeleted(deleted);
  }
}

export function newMemberId(): string {
  const rng = mulberry32(Date.now());
  return memberId(rng);
}

export function suggestedPnr(): string {
  const rng = mulberry32(Date.now() + 1);
  return pnr(rng);
}

export function recomputeTier(ytdSpend: number): TierKey {
  return tierFor(ytdSpend).key;
}

export function tierMeta(key: TierKey) {
  return TIERS.find(t => t.key === key) ?? TIERS[0];
}
