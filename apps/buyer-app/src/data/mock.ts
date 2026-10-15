import type { ProductKind } from '../components/Illustrations';

export const DELIVERY_FEE = 150;
const MIN = 60000;
const HOUR = 3600000;
const t0 = Date.now();

/** Every seller on GEKEL does wholesale. Some also sell single pieces at retail size — there is no retail-only seller. */
export type SellerType = 'wholesale' | 'both';
export const SELLER_LABEL: Record<SellerType, string> = { wholesale: 'Wholesaler', both: 'Wholesale + Retail' };

export interface Supplier {
  id: string;
  name: string;
  market: string;
  type: SellerType;
  rating: number;
  reviewCount: number;
  verified: boolean;
  categories: string[]; // Category ids, see CATEGORIES below
  sameDay: boolean;
  till: string;
  online: boolean;
  lastSeen: number; // ms timestamp
  responseMins: number;
  since: string;
  about: string;
  location: { lat: number; lng: number; building: string; floor?: string; shop: string; landmark: string };
}

export interface PriceCompare {
  /** What people typically pay on general online marketplaces (no names, just the number). */
  onlineAvg: number;
  /** What a normal retail shop would charge for one piece. */
  retailShop: number;
}

export interface Warranty {
  days: number;
  note: string;
}

export interface Product {
  id: string;
  name: string;
  category: string; // Category id
  price: number;
  oldPrice?: number;
  flashEndsAt?: number;
  wholesale?: { minQty: number; unitPrice: number };
  compare?: PriceCompare;
  warranty?: Warranty;
  kind: ProductKind;
  tint: string;
  badge?: 'Flash' | 'Popular';
  supplierId: string;
  sameDay: boolean;
  description: string;
  /** Real photo URL from your API; replaces the vector art when set. */
  image?: string;
}

/* ─────────── Categories: unique Kenyan aisles, not a copy of any other app's menu ─────────── */
export interface Category { id: string; name: string; subtitle: string; icon: string; color: string }

// TODO: fetch this from GET /api/v1/categories once the app is online-first; kept identical to the API's list for now.
export const CATEGORIES: Category[] = [
  { id: 'viatu', name: 'Viatu Mtaani', subtitle: 'Shoes, sneakers & sandals', icon: 'footsteps', color: '#FBE3D3' },
  { id: 'mavazi', name: 'Mavazi', subtitle: 'Clothes for the whole family', icon: 'shirt', color: '#F3E3D2' },
  { id: 'mtumba', name: 'Mtumba Gems', subtitle: 'Quality second-hand finds', icon: 'pricetags', color: '#E9E5E0' },
  { id: 'vito', name: 'Vito & Mikoba', subtitle: 'Bags, watches & accessories', icon: 'watch', color: '#E4E8EE' },
  { id: 'simu', name: 'Simu & Gadgets', subtitle: 'Phones, buds & chargers', icon: 'phone-portrait', color: '#E6E3DE' },
  { id: 'duka-la-mama', name: 'Duka la Mama', subtitle: 'Kitchen & household', icon: 'restaurant', color: '#FDEBC8' },
  { id: 'nyumba', name: 'Nyumba Poa', subtitle: 'Home, curtains & décor', icon: 'home', color: '#F6E7DA' },
  { id: 'fundi', name: 'Fundi Tools', subtitle: 'Hardware & workshop tools', icon: 'hammer', color: '#DDE6EE' },
  { id: 'kiosk', name: 'Kiosk Stock', subtitle: 'Bulk for shops & kiosks', icon: 'cube', color: '#E3F1E4' },
  { id: 'saloon', name: 'Saloon & Kinyozi', subtitle: 'Hair, beauty & barber kit', icon: 'cut', color: '#FBE4EA' },
  { id: 'shule', name: 'Shule Ready', subtitle: 'School wear & stationery', icon: 'school', color: '#E3E8F8' },
  { id: 'mtoto', name: 'Mama & Mtoto', subtitle: 'Baby & kids', icon: 'happy', color: '#FFF1C9' },
  { id: 'boda', name: 'Boda & Auto', subtitle: 'Motorbike & car spares', icon: 'speedometer', color: '#E6E6E6' },
  { id: 'harusi', name: 'Harusi & Events', subtitle: 'Weddings, parties & church', icon: 'sparkles', color: '#F7E3F5' },
  { id: 'mkulima', name: 'Mkulima Inputs', subtitle: 'Seeds, feeds & farm tools', icon: 'leaf', color: '#E3F1D9' },
];
export const categoryById = (id: string): Category | undefined => CATEGORIES.find((c) => c.id === id);
export const categoryName = (id: string): string => categoryById(id)?.name ?? id;

export const MARKETS = ['Eastleigh', 'Gikomba', 'Kamukunji', 'Town stalls'];

// TODO: replace all of this with API data
export const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Eastleigh Kicks', market: 'Eastleigh', type: 'both', rating: 4.8, reviewCount: 214, verified: true, categories: ['viatu'], sameDay: true, till: '5123401', online: true, lastSeen: t0, responseMins: 4, since: '2021', about: 'Sneakers and sports shoes straight from the Eastleigh wholesale lanes. Single pairs and bulk cartons both available.', location: { lat: -1.2745, lng: 36.8485, building: 'Kamukunji Plaza, Garissa Lodge Rd', floor: 'Floor 1', shop: 'Shop B14', landmark: 'Opposite the Eastleigh 1st Avenue petrol station' } },
  { id: 's2', name: 'Gikomba Fashion Hub', market: 'Gikomba', type: 'wholesale', rating: 4.6, reviewCount: 389, verified: true, categories: ['mavazi', 'mtumba'], sameDay: true, till: '6098712', online: false, lastSeen: t0 - 25 * MIN, responseMins: 12, since: '2019', about: 'Bales and bulk lots of clothing, bags and accessories. Minimum quantities apply for wholesale prices.', location: { lat: -1.2862, lng: 36.8405, building: 'Gikomba Market, Lane 4', shop: 'Stall 212', landmark: 'Next to the Gikomba clothes bale yard' } },
  { id: 's3', name: 'Luthuli Electronics', market: 'Town stalls', type: 'both', rating: 4.7, reviewCount: 156, verified: true, categories: ['simu'], sameDay: true, till: '4471290', online: true, lastSeen: t0, responseMins: 6, since: '2022', about: 'Phone accessories, earbuds and small electronics. Every item is tested before sealing. Small bulk orders welcome.', location: { lat: -1.2836, lng: 36.8269, building: 'Kimathi House, Luthuli Avenue', floor: 'Floor 2', shop: 'Shop 14', landmark: 'Behind Afya Centre' } },
  { id: 's4', name: 'Kamukunji Time Co.', market: 'Kamukunji', type: 'both', rating: 4.5, reviewCount: 98, verified: true, categories: ['vito'], sameDay: false, till: '7765432', online: false, lastSeen: t0 - 3 * HOUR, responseMins: 20, since: '2020', about: 'Watches, belts and wallets. Single pieces on the shelf, wholesale by the dozen.', location: { lat: -1.2829, lng: 36.8338, building: 'Kamukunji Grounds, Row C', shop: 'Stall 33', landmark: 'Near the Kamukunji grounds main gate' } },
  { id: 's5', name: 'Moi Avenue Scents', market: 'Town stalls', type: 'both', rating: 4.4, reviewCount: 61, verified: false, categories: ['saloon'], sameDay: true, till: '3302178', online: false, lastSeen: t0 - 50 * MIN, responseMins: 15, since: '2023', about: 'Perfumes and body sprays in 50ml and 100ml bottles. Bulk pricing for salons and kiosks.', location: { lat: -1.2838, lng: 36.8236, building: 'Sasa Mall, Moi Avenue', floor: 'Ground floor', shop: 'Shop G7', landmark: 'Opposite Kenya Cinema' } },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nike Air Jordan', category: 'viatu', price: 1650, oldPrice: 2200, flashEndsAt: t0 + 2.5 * HOUR, wholesale: { minQty: 6, unitPrice: 1400 }, compare: { onlineAvg: 2400, retailShop: 2800 }, kind: 'sneaker', tint: '#FBE3D3', badge: 'Flash', supplierId: 's1', sameDay: true,
    description: 'Mid-top sneakers sourced straight from an Eastleigh stall. Sizes 38 to 45 available, inspected before sealing.' },
  { id: 'p2', name: 'Leather Handbag', category: 'vito', price: 2100, wholesale: { minQty: 5, unitPrice: 1700 }, compare: { onlineAvg: 2900, retailShop: 3200 }, kind: 'bag', tint: '#F3E3D2', badge: 'Popular', supplierId: 's2', sameDay: false,
    description: 'Structured faux-leather handbag with gold clasp and two inner pockets. Photographed on pickup.' },
  { id: 'p3', name: 'Wireless Buds', category: 'simu', price: 1200, oldPrice: 1500, flashEndsAt: t0 + 1.7 * HOUR, wholesale: { minQty: 10, unitPrice: 950 }, compare: { onlineAvg: 1800, retailShop: 2200 }, warranty: { days: 7, note: '7-day swap for a dead unit, handled with the supplier in chat.' }, kind: 'buds', tint: '#E6E3DE', supplierId: 's3', sameDay: true,
    description: 'Bluetooth 5.0 earbuds with charging case. Tested on the spot before we seal the box.' },
  { id: 'p4', name: "Men's Watch", category: 'vito', price: 1850, wholesale: { minQty: 6, unitPrice: 1500 }, compare: { onlineAvg: 2600, retailShop: 3000 }, warranty: { days: 30, note: '30-day warranty against a faulty movement.' }, kind: 'watch', tint: '#E4E8EE', supplierId: 's4', sameDay: true,
    description: 'Analog watch with leather strap and navy dial. Battery and strap checked before packing.' },
  { id: 'p5', name: 'Perfume 50ml', category: 'saloon', price: 950, oldPrice: 1300, flashEndsAt: t0 + 0.9 * HOUR, wholesale: { minQty: 12, unitPrice: 750 }, compare: { onlineAvg: 1400, retailShop: 1600 }, kind: 'perfume', tint: '#FBE4EA', supplierId: 's5', sameDay: true,
    description: '50ml eau de parfum, floral and light. Seal checked and photographed at the stall.' },
  { id: 'p6', name: 'Black Hoodie', category: 'mavazi', price: 1800, wholesale: { minQty: 6, unitPrice: 1400 }, compare: { onlineAvg: 2300, retailShop: 2600 }, kind: 'hoodie', tint: '#E9E5E0', supplierId: 's2', sameDay: false,
    description: 'Heavy cotton pullover hoodie, black, sizes S to XXL. Chosen from Gikomba wholesale stock.' },
];

export const SAMPLE_REVIEWS = [
  { id: 'v1', name: 'Mercy W.', stars: 5, text: 'Exactly what I asked for and sealed properly. The photo proof helped a lot.', when: '2 days ago' },
  { id: 'v2', name: 'Otieno K.', stars: 4, text: 'Good prices and quick replies. Delivery took a bit longer than expected.', when: '1 week ago' },
  { id: 'v3', name: 'Amina S.', stars: 5, text: 'Bought 12 pieces for my online shop. Wholesale price was honest.', when: '3 weeks ago' },
];

export const REQUEST_STAGES = ['Request sent', 'GEKEL is looking for you', 'Found, price confirmed', 'Packed & tamper-sealed', 'Rider on the way', 'Delivered'];
export const REQUEST_SEARCH_DAYS = 3; // our promise: we look for up to 3 days before telling you we couldn't find it
export const ORDER_STAGES = ['Awaiting payment', 'Payment confirmed', 'Packed & sealed', 'Rider on the way', 'Delivered'];
export const DELIVERED = ORDER_STAGES.length - 1;

export interface AppNotification {
  id: string;
  icon: 'pricetag' | 'shield-checkmark' | 'bicycle' | 'sparkles' | 'storefront' | 'gift';
  title: string;
  body: string;
  time: string;
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', icon: 'pricetag', title: 'Price confirmed', body: 'Wanjiru confirmed KSh 1,800 for your black hoodie.', time: '12m ago' },
  { id: 'n2', icon: 'shield-checkmark', title: 'Packed & sealed', body: 'Your Wireless Buds are sealed. Seal GKL-48213, photo proof attached.', time: '1h ago' },
  { id: 'n3', icon: 'bicycle', title: 'Rider is on the way', body: 'Brian is 15 minutes from your door.', time: '2h ago' },
  { id: 'n4', icon: 'sparkles', title: 'Flash deals are live', body: 'Nike Air Jordan at KSh 1,650. Ends soon.', time: 'Yesterday' },
];

export const formatKsh = (n: number) => `KSh ${n.toLocaleString('en-KE')}`;

export const timeAgo = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/* ─────────── Delivery, fees and Kenya-specific data ─────────── */
export const SERVICE_FEE = 50;
export const COUNTIES = ['Nairobi', 'Kiambu', 'Machakos', 'Kajiado', 'Mombasa', 'Nakuru', 'Kisumu', 'Other'];
export const PICKUP_POINTS = ['Eastleigh Hub', 'CBD · Tom Mboya St', 'Westlands · Sarit Centre', 'Ngong Rd · Prestige Plaza'];

/**
 * We run ONE motorbike rider while we grow, covering Nairobi. For a buyer anywhere else,
 * the rider hands the sealed parcel to a long-distance courier or Sacco that the BUYER chooses —
 * a Sacco that already runs that route is usually cheaper and faster than a generic courier.
 */
export interface TransportOption { id: string; name: string; kind: 'courier' | 'sacco'; counties: string[] /* '*' = every county */ }
export const REGIONAL_TRANSPORT: TransportOption[] = [
  { id: 'fargo', name: 'Fargo Courier', kind: 'courier', counties: ['*'] },
  { id: 'easycoach', name: 'Easy Coach Parcels', kind: 'courier', counties: ['*'] },
  { id: 'modern-coast', name: 'Modern Coast Parcels', kind: 'courier', counties: ['*'] },
  { id: 'guardian', name: 'Guardian Coach', kind: 'sacco', counties: ['Kisumu'] },
  { id: 'super-metro', name: 'Super Metro', kind: 'sacco', counties: ['Kajiado'] }, // serves Kitengela
];
export const transportFor = (county: string): TransportOption[] =>
  REGIONAL_TRANSPORT.filter((t) => t.counties.includes('*') || t.counties.includes(county));

export interface DeliveryChoice {
  method: 'rider' | 'courier';
  speed: 'standard' | 'express'; // rider only. Express = one rider, shop straight to buyer
  dest: 'door' | 'pickup';
  pickupPoint?: string;
  courier?: string; // transport option name, when method === 'courier'
  pay: 'now' | 'later'; // later = on delivery (rider) or at collection (courier)
}

/** Delivery fee. Extra shops in one bundle add a small pickup surcharge. */
export const deliveryFee = (c: DeliveryChoice, stops: number) => {
  const extra = Math.max(0, stops - 1);
  if (c.method === 'courier') return (c.dest === 'door' ? 450 : 350) + extra * 100;
  const base = c.speed === 'express' ? 350 : 150;
  return base + (c.dest === 'pickup' ? -50 : 0) + extra * (c.speed === 'express' ? 100 : 50);
};

export const MARKET_STATUS = [
  { name: 'Eastleigh', status: 'Busy', until: '7pm', tone: 'red' },
  { name: 'Gikomba', status: 'Open', until: '6pm', tone: 'green' },
  { name: 'Kamukunji', status: 'Quiet', until: '6pm', tone: 'amber' },
  { name: 'Town stalls', status: 'Open', until: '8pm', tone: 'green' },
] as const;

/** Scripted courier scan events (same structure real couriers return). */
export const courierScript = (town: string, rider = 'Peter Kamau (+254 700 000 333)') => [
  'Package received at Nairobi Sorting Center, estimated arrival within 1-3 working days.',
  'Your package has arrived at Nairobi Sorting Center, will ship to next station',
  'Loaded at Nairobi Sorting Center, Next stop: Utalii sorting center.',
  `Left Nairobi Sorting Center and shipped to ${town}.`,
  'Your package has arrived at Utalii sorting center, will ship to next station',
  `In Transit: Courier ${rider} will deliver your package within 1-3 working days (excluding holidays and weekends).`,
  'Signed successfully. Please contact us via app message if you have any problem.',
];

export const GREETINGS = {
  morning: ['Habari ya asubuhi', 'Ni asubuhi poa'],
  afternoon: ['Mchana mwema', 'Mambo vipi'],
  evening: ['Habari ya jioni', 'Niaje, jioni njema'],
};

/* ─────────── Gekel Errands: local jobs beyond "buy and deliver" ─────────── */
export interface ErrandType { id: string; title: string; blurb: string; icon: string }
export const ERRAND_TYPES: ErrandType[] = [
  { id: 'queue', title: 'Stand in a queue', blurb: 'Banking, NHIF, NTSA, KRA — we queue, you skip it', icon: 'people-outline' },
  { id: 'documents', title: 'Collect or deliver documents', blurb: 'ID, certificates, contracts between offices', icon: 'document-text-outline' },
  { id: 'bills', title: 'Pay a bill in person', blurb: 'Landlord, utility office, anywhere that needs a human', icon: 'receipt-outline' },
  { id: 'parcel', title: 'Hand-deliver something', blurb: 'Keys, gifts, a forgotten bag — to someone in Nairobi', icon: 'gift-outline' },
  { id: 'grocery', title: 'Grocery run', blurb: "Give us a list from the nearest shop, we'll shop and deliver", icon: 'basket-outline' },
  { id: 'other', title: 'Something else', blurb: 'Describe it and we will tell you if we can help', icon: 'help-buoy-outline' },
];

/* ─────────── GEKEL Points: simple loyalty rewards ─────────── */
export interface Reward { id: string; title: string; cost: number; icon: string; kind: 'delivery' | 'discount' | 'airtime' }
export const REWARDS: Reward[] = [
  { id: 'free-delivery', title: 'Free standard delivery (1 order)', cost: 150, icon: 'bicycle', kind: 'delivery' },
  { id: 'disc-100', title: 'KSh 100 off your next order', cost: 300, icon: 'pricetag', kind: 'discount' },
  { id: 'disc-300', title: 'KSh 300 off your next order', cost: 800, icon: 'pricetag', kind: 'discount' },
  { id: 'airtime-50', title: 'KSh 50 Safaricom airtime', cost: 500, icon: 'call', kind: 'airtime' },
  { id: 'airtime-100', title: 'KSh 100 Safaricom airtime', cost: 950, icon: 'call', kind: 'airtime' },
];
