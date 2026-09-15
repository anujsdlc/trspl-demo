// 51 real TRS store locations from the brand deck
// Brand codes: RLY (Relay), CB (Choco Bay), MSH (Mishta), SML (Smilen), PSH (Pashma), GLD (Glady's), MTC (Motech)

export type StoreBrand = 'RLY' | 'CB' | 'MSH' | 'SML' | 'PSH' | 'GLD' | 'MTC';

export interface Store {
  id: string;
  code: string;
  brand: StoreBrand;
  city: string;
  location: string;
  terminal: string;
  type: 'airport' | 'landside';
  airportCode?: string;
  pincode: string;
  coords: [number, number];
  status: 'live' | 'sync' | 'offline';
  hours: string;
  mgr: string;
}

const cityMeta: Record<string, { pincode: string; coords: [number, number]; airport: string }> = {
  Delhi: { pincode: '110037', coords: [28.5562, 77.1000], airport: 'DEL' },
  Gurgaon: { pincode: '122001', coords: [28.4595, 77.0266], airport: 'DEL' },
  Bangalore: { pincode: '560300', coords: [13.1986, 77.7066], airport: 'BLR' },
  Mumbai: { pincode: '400099', coords: [19.0896, 72.8656], airport: 'BOM' },
  Hyderabad: { pincode: '500409', coords: [17.2403, 78.4294], airport: 'HYD' },
  Goa: { pincode: '403722', coords: [15.3808, 73.8314], airport: 'GOI' },
  Chennai: { pincode: '600027', coords: [12.9941, 80.1709], airport: 'MAA' },
  Pune: { pincode: '411032', coords: [18.5822, 73.9197], airport: 'PNQ' },
  Kochi: { pincode: '683111', coords: [10.1520, 76.4019], airport: 'COK' },
  Indore: { pincode: '453112', coords: [22.7218, 75.8011], airport: 'IDR' },
  Kolkata: { pincode: '700052', coords: [22.6520, 88.4463], airport: 'CCU' },
  Bhubaneshwar: { pincode: '751020', coords: [20.2521, 85.8175], airport: 'BBI' },
};

const managers = [
  'A. Kapoor', 'R. Mehta', 'S. Iyer', 'P. Sharma', 'K. Nair', 'V. Rao',
  'M. Krishnan', 'D. Bhatt', 'N. Joshi', 'J. Menon', 'L. Reddy', 'H. Singh',
  'T. Fernandes', 'B. Chatterjee', 'C. Pillai', 'G. Verma', 'O. Kaur', 'E. Das',
];

const brandCounts: Record<string, [StoreBrand, number, { city: string; terminals?: string[] }[]][]> = {};

const RELAY: [StoreBrand, string, string[]][] = [
  ['RLY', 'Delhi', ['T3-Intl', 'T3-Dom']],
  ['RLY', 'Gurgaon', ['Landside']],
  ['RLY', 'Bangalore', ['T2-A', 'T2-B', 'T2-C', 'T1-A', 'T1-B', 'T1-C', 'T2-D']],
  ['RLY', 'Mumbai', ['T2-Intl', 'T2-Dom']],
  ['RLY', 'Hyderabad', ['T1-A', 'T1-B', 'T1-C']],
  ['RLY', 'Goa (MOPA)', ['T1', 'T2', 'GOX']],
  ['RLY', 'Chennai', ['Landside']],
  ['RLY', 'Pune', ['T1', 'T2']],
  ['RLY', 'Kochi', ['T3']],
  ['RLY', 'Indore', ['T1', 'T2', 'T3', 'T4']],
];

const CHOCO: [StoreBrand, string, string[]][] = [
  ['CB', 'Goa (MOPA)', ['T1', 'T2']],
  ['CB', 'Delhi', ['T3-A', 'T3-B', 'T3-C']],
  ['CB', 'Bhubaneshwar', ['T1']],
  ['CB', 'Hyderabad', ['T1']],
  ['CB', 'Kochi', ['T3']],
];

const MISHTA: [StoreBrand, string, string[]][] = [
  ['MSH', 'Goa (MOPA)', ['T1']],
  ['MSH', 'Kolkata', ['T2-A', 'T2-B']],
  ['MSH', 'Chennai', ['T4-A', 'T4-B', 'T4-C']],
  ['MSH', 'Bhubaneshwar', ['T1']],
];

const SMILEN: [StoreBrand, string, string[]][] = [
  ['SML', 'Hyderabad', ['T1-A', 'T1-B', 'T1-C']],
  ['SML', 'Pune', ['T1']],
  ['SML', 'Kochi', ['T3']],
];

const PASHMA: [StoreBrand, string, string[]][] = [['PSH', 'Bangalore', ['T2-Intl']]];
const GLADYS: [StoreBrand, string, string[]][] = [['GLD', 'Goa (MOPA)', ['T1']]];
const MOTECH: [StoreBrand, string, string[]][] = [
  ['MTC', 'Kochi', ['T3']],
  ['MTC', 'Indore', ['T1']],
];

const allRows = [...RELAY, ...CHOCO, ...MISHTA, ...SMILEN, ...PASHMA, ...GLADYS, ...MOTECH];

export const STORES: Store[] = [];
let idx = 0;
for (const [brand, city, terminals] of allRows) {
  const cityKey = city.replace(/ \(MOPA\)/, '');
  const meta = cityMeta[cityKey] || cityMeta.Delhi;
  const isLandside = city === 'Gurgaon' || city === 'Chennai';
  for (const t of terminals) {
    idx++;
    const jitter = (idx * 13) % 100 / 10000;
    STORES.push({
      id: `s${idx.toString().padStart(3, '0')}`,
      code: `${brand}-${meta.airport}-${idx.toString().padStart(2, '0')}`,
      brand,
      city,
      location: `${city} ${t}`,
      terminal: t,
      type: isLandside ? 'landside' : 'airport',
      airportCode: isLandside ? undefined : meta.airport,
      pincode: meta.pincode,
      coords: [meta.coords[0] + jitter, meta.coords[1] + jitter],
      status: idx % 17 === 0 ? 'sync' : idx % 31 === 0 ? 'offline' : 'live',
      hours: isLandside ? '10:00 – 22:00' : '05:00 – 23:30',
      mgr: managers[idx % managers.length],
    });
  }
}

export const BRAND_META: Record<StoreBrand, { name: string; color: string; category: string }> = {
  RLY: { name: 'Relay',     color: '#C42127', category: 'Books · Tech · Snacks · Gifts' },
  CB:  { name: 'Choco Bay', color: '#6B4423', category: 'Confectionery' },
  MSH: { name: 'Mishta',    color: '#5A3A2A', category: 'Indian Sweets' },
  SML: { name: 'Smilen',    color: '#20A39E', category: 'Confectionery · Gifting' },
  PSH: { name: 'Pashma',    color: '#B02936', category: 'Cashmere · Luxury' },
  GLD: { name: "Glady's",   color: '#E8A317', category: 'Premium Chocolates' },
  MTC: { name: 'Motech',    color: '#D6D200', category: 'Tech & Travel Accessories' },
};

export const CITIES = [...new Set(STORES.map(s => s.city))].sort();
export const AIRPORTS = [...new Set(STORES.filter(s => s.airportCode).map(s => s.airportCode!))].sort();

// Only Relay stores carry books
export const BOOK_STORES = STORES.filter(s => s.brand === 'RLY');
