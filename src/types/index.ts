export interface ProductColor {
  name: string;
  hex: string;
}

export type ProductCategory = 
  | 'Abayas' 
  | 'Co-ords & Sets' 
  | 'Artisanal Kaftans' 
  | 'Luxury Hijabs' 
  | 'Signature Fragrance' 
  | 'Accessories';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: ProductCategory;
  collection: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  sizes: string[];
  colors: ProductColor[];
  images: string[];
  description: string;
  fabric: string;
  careInstructions?: string;
  isFeatured?: boolean;
  rating: number;
  reviewsCount: number;
}

export interface CartItem {
  productId: string;
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
  unitPrice: number;
}

export type PaymentMethod = 'mpesa_till' | 'cash' | 'card' | 'split';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface MpesaPaymentDetails {
  tillNumber: string;
  phoneNumber: string;
  transactionCode: string;
  merchantName: string;
  amount: number;
  timestamp: string;
  reference?: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  mpesaDetails?: MpesaPaymentDetails;
  cashReceived?: number;
  cashChange?: number;
  cardLast4?: string;
}

export type OrderSource = 'online' | 'pos' | 'whatsapp';
export type OrderStatus = 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  source: OrderSource;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  tax: number;
  shippingFee: number;
  total: number;
  customer: OrderCustomer;
  payment: OrderPayment;
  status: OrderStatus;
  createdAt: string;
  cashierName?: string;
}

export interface HeldCart {
  id: string;
  createdAt: string;
  label: string;
  items: CartItem[];
  customerName?: string;
}

export interface StoreSettings {
  storeName: string;
  brandTagline: string;
  mpesaTillNumber: string;
  mpesaStoreName: string;
  whatsappNumber: string;
  contactEmail: string;
  storeAddress: string;
  storePhone: string;
  socialHandle: string;
  brandLogoUrl: string;
  kraPin: string;
  vatRate: number;
  currency: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

export type PosRole = 'Shop Owner' | 'System Admin' | 'Lead Cashier' | 'Supervisor';

export interface PosStaffUser {
  id: string;
  name: string;
  email: string;
  role: PosRole;
  branch: string;
  badgeNumber: string;
}

export interface PosVerificationSession {
  tempSessionId: string;
  email: string;
  staffName: string;
  code: string;
  expiresAt: number;
}


