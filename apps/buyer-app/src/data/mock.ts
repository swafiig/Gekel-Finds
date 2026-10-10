import type { ProductKind } from '../components/Illustrations';

export const DELIVERY_FEE = 150;
const MIN = 60000;
const HOUR = 3600000;
const t0 = Date.now();

export type SellerType = 'wholesale' | 'retail' | 'both';
export const SELLER_LABEL: Record<SellerType, string> = { wholesale: 'Wholesaler', retail: 'Retailer', both: 'Wholesale + Retail' };

export interface Supplier {
  id: string;
  name: string;
  market: string;
  type: SellerType;
  rating: number;
  reviewCount: number;
  verified: boolean;
  categories: string[];
  sameDay: boolean;
  till: string;
  online: boolean;
  lastSeen: number; // ms timestamp
  responseMins: number;
  since: string;
  about: string;
  location: { lat: number; lng: number; building: string; floor?: string; shop: string; landmark: string };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  flashEndsAt?: number;
  wholesale?: { minQty: number; unitPrice: number };
  kind: ProductKind;
  tint: string;
  badge?: 'Flash' | 'Popular';
  supplierId: string;
  sameDay: boolean;
  description: string;
  /** Real photo URL from your API; replaces the vector art when set. */
  image?: string;
}

// TODO: replace all of this with API data
export const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Eastleigh Kicks', market: 'Eastleigh', type: 'both', rating: 4.8, reviewCount: 214, verified: true, categories: ['Footwear'], sameDay: true, till: '5123401', online: true, lastSeen: t0, responseMins: 4, since: '2021', about: 'Sneakers and sports shoes straight from the Eastleigh wholesale lanes. Retail pairs and bulk cartons available.' , location: { lat: -1.2745, lng: 36.8485, building: 'Kamukunji Plaza, Garissa Lodge Rd', floor: 'Floor 1', shop: 'Shop B14', landmark: 'Opposite the Eastleigh 1st Avenue petrol station' } },
  { id: 's2', name: 'Gikomba Fashion Hub', market: 'Gikomba', type: 'wholesale', rating: 4.6, reviewCount: 389, verified: true, categories: ['Fashion', 'Clothing'], sameDay: true, till: '6098712', online: false, lastSeen: t0 - 25 * MIN, responseMins: 12, since: '2019', about: 'Bales and bulk lots of clothing, bags and accessories. Minimum quantities apply for wholesale prices.' , location: { lat: -1.2862, lng: 36.8405, building: 'Gikomba Market, Lane 4', shop: 'Stall 212', landmark: 'Next to the Gikomba clothes bale yard' } },
  { id: 's3', name: 'Luthuli Electronics', market: 'Town stalls', type: 'retail', rating: 4.7, reviewCount: 156, verified: true, categories: ['Electronics'], sameDay: true, till: '4471290', online: true, lastSeen: t0, responseMins: 6, since: '2022', about: 'Phones accessories, earbuds and small electronics. Every item is tested before sealing.' , location: { lat: -1.2836, lng: 36.8269, building: 'Kimathi House, Luthuli Avenue', floor: 'Floor 2', shop: 'Shop 14', landmark: 'Behind Afya Centre' } },
  { id: 's4', name: 'Kamukunji Time Co.', market: 'Kamukunji', type: 'both', rating: 4.5, reviewCount: 98, verified: true, categories: ['Accessories'], sameDay: false, till: '7765432', online: false, lastSeen: t0 - 3 * HOUR, responseMins: 20, since: '2020', about: 'Watches, belts and wallets. Retail on the shelf, wholesale by the dozen.' , location: { lat: -1.2829, lng: 36.8338, building: 'Kamukunji Grounds, Row C', shop: 'Stall 33', landmark: 'Near the Kamukunji grounds main gate' } },
  { id: 's5', name: 'Moi Avenue Scents', market: 'Town stalls', type: 'retail', rating: 4.4, reviewCount: 61, verified: false, categories: ['Beauty'], sameDay: true, till: '3302178', online: false, lastSeen: t0 - 50 * MIN, responseMins: 15, since: '2023', about: 'Perfumes and body sprays in 50ml and 100ml bottles.' , location: { lat: -1.2838, lng: 36.8236, building: 'Sasa Mall, Moi Avenue', floor: 'Ground floor', shop: 'Shop G7', landmark: 'Opposite Kenya Cinema' } },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nike Air Jordan', category: 'Footwear', price: 1650, oldPrice: 2200, flashEndsAt: t0 + 2.5 * HOUR, wholesale: { minQty: 6, unitPrice: 1400 }, kind: 'sneaker', tint: '#FBE3D3', badge: 'Flash', supplierId: 's1', sameDay: true,
    description: 'Mid-top sneakers sourced straight from an Eastleigh stall. Sizes 38 to 45 available, inspected before sealing.' },
  { id: 'p2', name: 'Leather Handbag', category: 'Fashion', price: 2100, wholesale: { minQty: 5, unitPrice: 1700 }, kind: 'bag', tint: '#F3E3D2', badge: 'Popular', supplierId: 's2', sameDay: false,
    description: 'Structured faux-leather handbag with gold clasp and two inner pockets. Photographed on pickup.' },
  { id: 'p3', name: 'Wireless Buds', category: 'Electronics', price: 1200, oldPrice: 1500, flashEndsAt: t0 + 1.7 * HOUR, wholesale: { minQty: 10, unitPrice: 950 }, kind: 'buds', tint: '#E6E3DE', supplierId: 's3', sameDay: true,
    description: 'Bluetooth 5.0 earbuds with charging case. Tested on the spot before we seal the box.' },
  { id: 'p4', name: "Men's Watch", category: 'Accessories', price: 1850, wholesale: { minQty: 6, unitPrice: 1500 }, kind: 'watch', tint: '#E4E8EE', supplierId: 's4', sameDay: true,
    description: 'Analog watch with leather strap and navy dial. Battery and strap checked before packing.' },
  { id: 'p5', name: 'Perfume 50ml', category: 'Beauty', price: 950, oldPrice: 1300, flashEndsAt: t0 + 0.9 * HOUR, wholesale: { minQty: 12, unitPrice: 750 }, kind: 'perfume', tint: '#FBE4EA', supplierId: 's5', sameDay: true,
    description: '50ml eau de parfum, floral and light. Seal checked and photographed at the stall.' },
  { id: 'p6', name: 'Black Hoodie', category: 'Clothing', price: 1800, wholesale: { minQty: 6, unitPrice: 1400 }, kind: 'hoodie', tint: '#E9E5E0', supplierId: 's2', sameDay: false,
    description: 'Heavy cotton pullover hoodie, black, sizes S to XXL. Chosen from Gikomba wholesale stock.' },
];

export const SAMPLE_REVIEWS = [
  { id: 'v1', name: 'Mercy W.', stars: 5, text: 'Exactly what I asked for and sealed properly. The photo proof helped a lot.', when: '2 days ago' },
  { id: 'v2', name: 'Otieno K.', stars: 4, text: 'Good prices and quick replies. Delivery took a bit longer than expected.', when: '1 week ago' },
  { id: 'v3', name: 'Amina S.', stars: 5, text: 'Bought 12 pieces for my online shop. Wholesale price was honest.', when: '3 weeks ago' },
];

export const CATEGORIES = ['Footwear', 'Fashion', 'Clothing', 'Electronics', 'Accessories', 'Beauty'];
export const MARKETS = ['Eastleigh', 'Gikomba', 'Kamukunji', 'Town stalls'];

export const REQUEST_STAGES = ['Request sent', 'Searching the markets', 'Found, price confirmed', 'Packed & tamper-sealed', 'Rider on the way', 'Delivered'];
export const ORDER_STAGES = ['Awaiting payment', 'Payment confirmed', 'Packed & sealed', 'Rider on the way', 'Delivered'];
export const DELIVERED = ORDER_STAGES.length - 1;

export interface AppNotification {
  id: string;
  icon: 'pricetag' | 'shield-checkmark' | 'bicycle' | 'sparkles';
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
export const COURIERS = ['Fargo Courier', 'Easy Coach Parcels', 'Modern Coast', 'Super Metro Parcels'];
export const PICKUP_POINTS = ['Eastleigh Hub', 'CBD · Tom Mboya St', 'Westlands · Sarit Centre', 'Ngong Rd · Prestige Plaza'];

export interface DeliveryChoice {
  method: 'rider' | 'courier';
  speed: 'standard' | 'express'; // rider only. Express = one rider, shop straight to buyer
  dest: 'door' | 'pickup';
  pickupPoint?: string;
  courier?: string;
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
