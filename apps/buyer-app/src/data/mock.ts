import type { ProductKind } from '../components/Illustrations';

export const DELIVERY_FEE = 150;

export interface Supplier {
  id: string;
  name: string;
  market: string;
  rating: number;
  verified: boolean;
  categories: string[];
  sameDay: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  kind: ProductKind;
  tint: string;
  badge?: 'Flash' | 'Popular';
  supplierId: string;
  sameDay: boolean;
  description: string;
  /** Optional real photo URL from your API. When set it replaces the vector art. */
  image?: string;
}

// TODO: replace all of this with API data
export const SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'Eastleigh Kicks', market: 'Eastleigh', rating: 4.8, verified: true, categories: ['Footwear'], sameDay: true },
  { id: 's2', name: 'Gikomba Fashion Hub', market: 'Gikomba', rating: 4.6, verified: true, categories: ['Fashion', 'Clothing'], sameDay: true },
  { id: 's3', name: 'Luthuli Electronics', market: 'Town stalls', rating: 4.7, verified: true, categories: ['Electronics'], sameDay: true },
  { id: 's4', name: 'Kamukunji Time Co.', market: 'Kamukunji', rating: 4.5, verified: true, categories: ['Accessories'], sameDay: false },
  { id: 's5', name: 'Moi Avenue Scents', market: 'Town stalls', rating: 4.4, verified: false, categories: ['Beauty'], sameDay: true },
];

export const PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nike Air Jordan', category: 'Footwear', price: 1650, kind: 'sneaker', tint: '#FBE3D3', badge: 'Flash', supplierId: 's1', sameDay: true,
    description: 'Mid-top sneakers sourced straight from an Eastleigh stall. Sizes 38 to 45 available, inspected before sealing.' },
  { id: 'p2', name: 'Leather Handbag', category: 'Fashion', price: 2100, kind: 'bag', tint: '#F3E3D2', badge: 'Popular', supplierId: 's2', sameDay: false,
    description: 'Structured faux-leather handbag with gold clasp and two inner pockets. Photographed on pickup.' },
  { id: 'p3', name: 'Wireless Buds', category: 'Electronics', price: 1200, kind: 'buds', tint: '#E6E3DE', supplierId: 's3', sameDay: true,
    description: 'Bluetooth 5.0 earbuds with charging case. Tested on the spot before we seal the box.' },
  { id: 'p4', name: "Men's Watch", category: 'Accessories', price: 1850, kind: 'watch', tint: '#E4E8EE', supplierId: 's4', sameDay: true,
    description: 'Analog watch with leather strap and navy dial. Battery and strap checked before packing.' },
  { id: 'p5', name: 'Perfume 50ml', category: 'Beauty', price: 950, kind: 'perfume', tint: '#FBE4EA', supplierId: 's5', sameDay: true,
    description: '50ml eau de parfum, floral and light. Seal checked and photographed at the stall.' },
  { id: 'p6', name: 'Black Hoodie', category: 'Clothing', price: 1800, kind: 'hoodie', tint: '#E9E5E0', supplierId: 's2', sameDay: false,
    description: 'Heavy cotton pullover hoodie, black, sizes S to XXL. Chosen from Gikomba wholesale stock.' },
];

export const CATEGORIES = ['Footwear', 'Fashion', 'Clothing', 'Electronics', 'Accessories', 'Beauty'];
export const MARKETS = ['Eastleigh', 'Gikomba', 'Kamukunji', 'Town stalls'];

export const REQUEST_STAGES = [
  'Request sent',
  'Searching the markets',
  'Found, price confirmed',
  'Packed & tamper-sealed',
  'Rider on the way',
  'Delivered',
];
export const ORDER_STAGES = ['Order confirmed', 'Packed & sealed', 'Rider on the way', 'Delivered'];

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
  { id: 'n4', icon: 'sparkles', title: 'New finds for you', body: 'Flash deal: Nike Air Jordan at KSh 1,650 today.', time: 'Yesterday' },
];

export const formatKsh = (n: number) => `KSh ${n.toLocaleString('en-KE')}`;

export const timeAgo = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};
