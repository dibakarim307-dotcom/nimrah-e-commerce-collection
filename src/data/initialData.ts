import { Product, StoreSettings, Order } from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "Nimrah Collection",
  brandTagline: "Haute Modesty & Artisanal Parfumerie",
  mpesaTillNumber: "5428901",
  mpesaStoreName: "NIMRAH COLLECTION",
  whatsappNumber: "0700011077",
  contactEmail: "nimrahcollection1@gmail.com",
  storeAddress: "Eastleigh 5th Street, UBAH Shopping Center, Shop G7, Nairobi, Kenya",
  storePhone: "0700011077",
  socialHandle: "@Nimrah_Collections",
  brandLogoUrl: "/assets/aistudio/IMG-20261031-WA0002_37814c74.jpg",
  kraPin: "P051892341Z",
  vatRate: 0.16,
  currency: "KES"
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-01",
    name: "Al-Noor Emerald Velvet Abaya",
    sku: "NC-ABY-01",
    barcode: "616400192831",
    category: "Abayas",
    collection: "Royal Velvet 2026",
    price: 14500,
    costPrice: 7800,
    stock: 8,
    lowStockThreshold: 4,
    sizes: ["52", "54", "56", "58", "60"],
    colors: [
      { name: "Deep Emerald", hex: "#064e3b" },
      { name: "Onyx Black", hex: "#18181b" },
      { name: "Midnight Navy", hex: "#0f172a" }
    ],
    images: ["/src/assets/images/product_emerald_abaya_1793448135180.jpg"],
    description: "An architectural masterpiece crafted from heavyweight French silk velvet. Features intricate hand-stitched beadwork along the cuffs, concealed magnetic front fastenings, and a coordinating pure chiffon Sheila scarf.",
    fabric: "Premium French Silk Velvet & Chiffon Sheila",
    careInstructions: "Specialist Dry Clean Only",
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 38
  },
  {
    id: "prod-02",
    name: "Aura Champagne Silk Co-ord Set",
    sku: "NC-CRD-02",
    barcode: "616400192832",
    category: "Co-ords & Sets",
    collection: "Atelier Raw Silk",
    price: 16800,
    costPrice: 9200,
    stock: 12,
    lowStockThreshold: 5,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Champagne Gold", hex: "#d4af37" },
      { name: "Pristine Ivory", hex: "#fdfbf7" },
      { name: "Desert Sand", hex: "#c2a688" }
    ],
    images: ["/src/assets/images/product_silk_coord_1793448136345.jpg"],
    description: "Tailored from pure raw spun silk, this two-piece set features an asymmetric draped tunic with structured cuffs paired with wide-leg relaxed trousers. Designed for effortless modern luxury and understated elegance.",
    fabric: "100% Spun Raw Silk",
    careInstructions: "Dry Clean or Gentle Hand Wash in Cold Water",
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 24
  },
  {
    id: "prod-03",
    name: "Layla Midnight Embellished Kaftan",
    sku: "NC-KFT-03",
    barcode: "616400192833",
    category: "Artisanal Kaftans",
    collection: "Nocturne Evening",
    price: 22500,
    costPrice: 12500,
    stock: 4,
    lowStockThreshold: 3,
    sizes: ["Free Size (Standard)", "Free Size (Tall)"],
    colors: [
      { name: "Sapphire Royal", hex: "#1e3a8a" },
      { name: "Deep Ruby", hex: "#881337" },
      { name: "Pure Gold", hex: "#ca8a04" }
    ],
    images: ["/src/assets/images/product_artisan_kaftan_1793448136736.jpg"],
    description: "Handcrafted by master artisans with over 40 hours of metallic zardozi and crystalline embroidery framing the neckline and sleeve borders. Graceful sweeping silhouette with inner waist-cinching ties.",
    fabric: "Rich Moroccan Crepe & Metallic Zari Work",
    careInstructions: "Specialist Luxury Dry Clean",
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 19
  },
  {
    id: "prod-04",
    name: "Nimrah Noir Extrait de Parfum (50ml)",
    sku: "NC-FRG-04",
    barcode: "616400192834",
    category: "Signature Fragrance",
    collection: "Haute Parfumerie",
    price: 9500,
    costPrice: 4200,
    stock: 25,
    lowStockThreshold: 6,
    sizes: ["50ml Extrait", "100ml Extrait"],
    colors: [
      { name: "Amber Noir Flacon", hex: "#78350f" }
    ],
    images: ["/src/assets/images/product_signature_perfume_1793448136885.jpg"],
    description: "Our signature boutique extrait de parfum. A hypnotic, lingering blend of smoky Cambodian Agarwood, Bulgarian Damask Rose, Tahitian Vanilla bean, and warm amber resin with a 35% oil concentration for 24-hour sillage.",
    fabric: "Bespoke Italian Amber Glass Flacon with Magnetic Onyx Cap",
    careInstructions: "Store in cool dark environment away from direct sunlight",
    isFeatured: true,
    rating: 5.0,
    reviewsCount: 62
  },
  {
    id: "prod-05",
    name: "Sahara Golden Satin Open Abaya",
    sku: "NC-ABY-05",
    barcode: "616400192835",
    category: "Abayas",
    collection: "Desert Luminary",
    price: 13900,
    costPrice: 7000,
    stock: 6,
    lowStockThreshold: 3,
    sizes: ["52", "54", "56", "58", "60"],
    colors: [
      { name: "Liquid Gold", hex: "#eab308" },
      { name: "Caramel Bronze", hex: "#78350f" }
    ],
    images: ["/src/assets/images/hero_nimrah_collection_1793448134362.jpg"],
    description: "Fluid, lustrous heavy satin abaya with a subtle micro-pleated drape and hand-tasseled belt. Worn open as a statement duster over our silk co-ords or secured for formal occasions.",
    fabric: "Heavy Mulberry Silk-Blend Satin",
    careInstructions: "Delicate Steam & Dry Clean",
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 15
  },
  {
    id: "prod-06",
    name: "Medina Pure Mulberry Silk Hijab",
    sku: "NC-HJB-06",
    barcode: "616400192836",
    category: "Luxury Hijabs",
    collection: "Essential Silks",
    price: 3200,
    costPrice: 1400,
    stock: 30,
    lowStockThreshold: 10,
    sizes: ["Standard 180cm x 75cm", "Maxi 200cm x 100cm"],
    colors: [
      { name: "Champagne", hex: "#e7e5e4" },
      { name: "Sage Mist", hex: "#84a98c" },
      { name: "Espresso", hex: "#3e2723" },
      { name: "Dusty Rose", hex: "#be9b9d" }
    ],
    images: ["/src/assets/images/product_silk_coord_1793448136345.jpg"],
    description: "Ultra-breathable 100% Grade 6A Mulberry Silk with hand-rolled borders. Naturally hypoallergenic and gentle on hair, delivering a subtle lustrous sheen for daily or celebratory wear.",
    fabric: "100% Grade 6A Pure Mulberry Silk (16mm)",
    careInstructions: "Hand wash cold with silk detergent",
    isFeatured: false,
    rating: 4.9,
    reviewsCount: 47
  },
  {
    id: "prod-07",
    name: "Sultana 18K Gold-Plated Cuff Bracelet",
    sku: "NC-ACC-07",
    barcode: "616400192837",
    category: "Accessories",
    collection: "Atelier Bijoux",
    price: 5800,
    costPrice: 2200,
    stock: 14,
    lowStockThreshold: 5,
    sizes: ["Adjustable One Size"],
    colors: [
      { name: "18K Yellow Gold", hex: "#eab308" },
      { name: "Platinum White", hex: "#e2e8f0" }
    ],
    images: ["/src/assets/images/product_artisan_kaftan_1793448136736.jpg"],
    description: "Sculpted architectural open cuff adorned with geometric Islamic arch motifs and hand-set zircon stones. Finished in triple-layer 18K yellow gold plating with anti-tarnish coating.",
    fabric: "18K Gold Plated Brass & Pavé Cubic Zirconia",
    careInstructions: "Wipe with soft jewelry microfiber cloth",
    isFeatured: false,
    rating: 4.7,
    reviewsCount: 18
  },
  {
    id: "prod-08",
    name: "Zahra Pleated Linen Kimono Abaya",
    sku: "NC-ABY-08",
    barcode: "616400192838",
    category: "Abayas",
    collection: "Everyday Modesty",
    price: 11200,
    costPrice: 5600,
    stock: 9,
    lowStockThreshold: 4,
    sizes: ["52", "54", "56", "58"],
    colors: [
      { name: "Terracotta Sand", hex: "#9a3412" },
      { name: "Olive Earth", hex: "#3f6212" },
      { name: "Charcoal Slate", hex: "#334155" }
    ],
    images: ["/src/assets/images/product_emerald_abaya_1793448135180.jpg"],
    description: "Breathable natural flax linen abaya with accordian pleats down the back and kimono flared sleeves. Includes deep discrete side pockets and a matching woven tassel tie.",
    fabric: "100% Organic European Flax Linen",
    careInstructions: "Machine wash cold delicate cycle, hang dry",
    isFeatured: false,
    rating: 4.8,
    reviewsCount: 22
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "NC-2026-7841",
    source: "pos",
    items: [
      {
        productId: "prod-01",
        product: INITIAL_PRODUCTS[0],
        selectedSize: "56",
        selectedColor: INITIAL_PRODUCTS[0].colors[0],
        quantity: 1,
        unitPrice: 14500
      },
      {
        productId: "prod-04",
        product: INITIAL_PRODUCTS[3],
        selectedSize: "50ml Extrait",
        selectedColor: INITIAL_PRODUCTS[3].colors[0],
        quantity: 1,
        unitPrice: 9500
      }
    ],
    subtotal: 24000,
    discount: 1000,
    discountCode: "BOUTIQUE-VIP",
    tax: 3172.41,
    shippingFee: 0,
    total: 23000,
    customer: {
      name: "Amina Hassan",
      phone: "+254 722 890 123",
      email: "amina.h@outlook.com",
      city: "Nairobi (In-Store Eastleigh Shop G7)"
    },
    payment: {
      method: "mpesa_till",
      status: "completed",
      mpesaDetails: {
        tillNumber: "5428901",
        phoneNumber: "254722890123",
        transactionCode: "QJD82KLA89",
        merchantName: "NIMRAH COLLECTION",
        amount: 23000,
        timestamp: "2026-10-31 11:24 AM"
      }
    },
    status: "confirmed",
    createdAt: "2026-10-31T11:24:00+03:00",
    cashierName: "Fatuma K. (Eastleigh G7 Branch)"
  },
  {
    id: "NC-2026-7840",
    source: "online",
    items: [
      {
        productId: "prod-02",
        product: INITIAL_PRODUCTS[1],
        selectedSize: "M",
        selectedColor: INITIAL_PRODUCTS[1].colors[0],
        quantity: 1,
        unitPrice: 16800
      }
    ],
    subtotal: 16800,
    discount: 0,
    tax: 2317.24,
    shippingFee: 500,
    total: 17300,
    customer: {
      name: "Zainab Omar",
      phone: "+254 719 456 789",
      email: "zainab.omar@gmail.com",
      address: "House 14, Riverside Drive Villas",
      city: "Nairobi",
      notes: "Please call before arrival"
    },
    payment: {
      method: "mpesa_till",
      status: "completed",
      mpesaDetails: {
        tillNumber: "5428901",
        phoneNumber: "254719456789",
        transactionCode: "QKD91JMN44",
        merchantName: "NIMRAH COLLECTION",
        amount: 17300,
        timestamp: "2026-10-31 09:45 AM"
      }
    },
    status: "processing",
    createdAt: "2026-10-31T09:45:00+03:00"
  }
];
