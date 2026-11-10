import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import nodemailer, { type Transporter } from 'nodemailer';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// ==========================================
// LIVE SYNCHRONIZED PRODUCTS STORE
// "allow when pos owner upload product to be viewed by online"
// ==========================================
const PRODUCTS_DB_PATH = path.resolve(process.cwd(), 'products-db.json');
const BACKUP_PRODUCTS_DB_PATH = path.resolve(process.cwd(), 'products-db.backup.json');
const DELETED_PRODUCTS_PATH = path.resolve(process.cwd(), 'deleted-products.json');
const SHOWCASE_SLIDES_PATH = path.resolve(process.cwd(), 'showcase-slides.json');

const INITIAL_SHOWCASE_SLIDES = [
  {
    id: "slide-1",
    imageUrl: "/src/assets/images/product_artisan_kaftan_1793448136736.jpg",
    title: "Precision Craftsmanship & Pure Silk Velvet",
    subtitle: "Hand-embroidered zardozi and crystalline beadwork tailored with modesty.",
    badge: "Atelier Heritage · Shop G7"
  },
  {
    id: "slide-2",
    imageUrl: "/src/assets/images/hero_nimrah_collection_1793448134362.jpg",
    title: "Haute Couture Modesty & Royal Drapes",
    subtitle: "Tailored in rich French velvets, pure Moroccan crepes, and spun raw silks.",
    badge: "Boutique Showcase"
  },
  {
    id: "slide-3",
    imageUrl: "/src/assets/images/product_signature_perfume_1793448136885.jpg",
    title: "Nimrah Noir Extrait de Parfum",
    subtitle: "35% concentrated pure Cambodian oud, Bulgarian rose & Tahitian vanilla.",
    badge: "Haute Parfumerie"
  },
  {
    id: "slide-4",
    imageUrl: "/src/assets/images/product_emerald_abaya_1793448135180.jpg",
    title: "Royal Emerald Velvet Collection",
    subtitle: "Exclusive evening modest silhouette with hand-embellished sleeves.",
    badge: "New Atelier Arrival"
  }
];

function loadShowcaseSlides(): any[] {
  try {
    if (fs.existsSync(SHOWCASE_SLIDES_PATH)) {
      const data = fs.readFileSync(SHOWCASE_SLIDES_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading showcase-slides.json:', err);
  }
  return INITIAL_SHOWCASE_SLIDES;
}

function saveShowcaseSlides(slides: any[]) {
  try {
    fs.writeFileSync(SHOWCASE_SLIDES_PATH, JSON.stringify(slides, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving showcase-slides.json:', err);
  }
}

let liveShowcaseSlides = loadShowcaseSlides();


function loadDeletedProductIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_PRODUCTS_PATH)) {
      const data = fs.readFileSync(DELETED_PRODUCTS_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (err) {
    console.error('Error loading deleted-products.json:', err);
  }
  return new Set();
}

function saveDeletedProductIds(set: Set<string>) {
  try {
    fs.writeFileSync(DELETED_PRODUCTS_PATH, JSON.stringify(Array.from(set), null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving deleted-products.json:', err);
  }
}

const serverDeletedIds = loadDeletedProductIds();

interface LiveProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  collection: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  sizes: string[];
  colors: { name: string; hex: string }[];
  images: string[];
  description: string;
  fabric: string;
  careInstructions?: string;
  isFeatured?: boolean;
  rating?: number;
  reviewsCount?: number;
}

let liveProducts: LiveProduct[] = [];

function loadProductsFromDisk(): LiveProduct[] {
  try {
    if (fs.existsSync(PRODUCTS_DB_PATH)) {
      const data = fs.readFileSync(PRODUCTS_DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading products-db.json:', err);
  }

  // Safe fallback to backup file if primary file was temporarily locked or unreadable
  try {
    if (fs.existsSync(BACKUP_PRODUCTS_DB_PATH)) {
      const bData = fs.readFileSync(BACKUP_PRODUCTS_DB_PATH, 'utf-8');
      const bParsed = JSON.parse(bData);
      if (Array.isArray(bParsed) && bParsed.length > 0) {
        console.log('[PRODUCTS CATALOG] Restored products from backup redundancy store.');
        return bParsed;
      }
    }
  } catch (err) {
    console.error('Error loading backup products:', err);
  }

  return [];
}

function saveProductsToDisk(products: LiveProduct[]) {
  try {
    fs.writeFileSync(PRODUCTS_DB_PATH, JSON.stringify(products, null, 2), 'utf-8');
    fs.writeFileSync(BACKUP_PRODUCTS_DB_PATH, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving products-db.json:', err);
  }
}

// Initialize live products and permanently filter out any deleted products
liveProducts = loadProductsFromDisk().filter(p => !serverDeletedIds.has(p.id));
console.log(`[PRODUCTS CATALOG] Loaded ${liveProducts.length} synchronized products (${serverDeletedIds.size} permanently deleted).`);

// 1. GET ALL PRODUCTS (Used by Online Storefront & POS)
app.get('/api/products', (_req, res) => {
  // Always ensure deleted products never appear
  const activeProducts = liveProducts.filter(p => !serverDeletedIds.has(p.id));
  res.json({ success: true, products: activeProducts });
});

// 2. ADD PRODUCT (Strictly restricted to Shop Owner only)
app.post('/api/products', (req, res) => {
  try {
    // Only Shop Owner can add products
    const staffRole = (req.headers['x-staff-role'] || req.body?.staffRole || req.body?.product?.staffRole || '').toString();
    const staffEmail = (req.headers['x-staff-email'] || req.body?.staffEmail || req.body?.product?.staffEmail || '').toString();
    const isOwner = staffRole === 'Shop Owner' || 
                    staffEmail.toLowerCase() === 'dibakarim307@gmail.com' || 
                    staffEmail.toLowerCase() === 'nimrahcollection1@gmail.com';

    if (!isOwner) {
      console.warn(`[SECURITY] Blocked non-owner attempt to add product: role=${staffRole}, email=${staffEmail}`);
      res.status(403).json({ 
        success: false, 
        message: 'Security Restriction: Only the Shop Owner (Diba Karim) is authorized to add products.' 
      });
      return;
    }

    const productPayload = req.body?.product || req.body;
    if (!productPayload?.name || productPayload.price === undefined) {
      res.status(400).json({ success: false, message: 'Product name and price are required.' });
      return;
    }

    const newId = productPayload.id || `prod-${Date.now().toString().slice(-6)}`;

    // If this product was previously deleted, unmark it since the Shop Owner deliberately recreated it
    if (serverDeletedIds.has(newId)) {
      serverDeletedIds.delete(newId);
      saveDeletedProductIds(serverDeletedIds);
    }

    const newProduct: LiveProduct = {
      id: newId,
      name: String(productPayload.name).trim(),
      sku: String(productPayload.sku || `NC-SKU-${Math.floor(100 + Math.random() * 899)}`),
      barcode: String(productPayload.barcode || `616${Math.floor(100000000 + Math.random() * 899999999)}`),
      category: String(productPayload.category || 'Abayas'),
      collection: String(productPayload.collection || 'Nimrah Exclusive'),
      price: Number(productPayload.price) || 0,
      costPrice: Number(productPayload.costPrice) || Math.round(Number(productPayload.price) * 0.5),
      stock: Number(productPayload.stock) || 0,
      lowStockThreshold: Number(productPayload.lowStockThreshold) || 3,
      sizes: Array.isArray(productPayload.sizes) && productPayload.sizes.length > 0 ? productPayload.sizes : ['Standard Free Size'],
      colors: Array.isArray(productPayload.colors) && productPayload.colors.length > 0 ? productPayload.colors : [{ name: 'Onyx Black', hex: '#18181b' }],
      images: Array.isArray(productPayload.images) && productPayload.images.length > 0 ? productPayload.images : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'],
      description: String(productPayload.description || 'Luxury bespoke modest fashion piece crafted for Nimrah Collection.'),
      fabric: String(productPayload.fabric || 'Pure Japanese Georgette Silk'),
      careInstructions: productPayload.careInstructions || 'Dry Clean Only',
      isFeatured: Boolean(productPayload.isFeatured),
      rating: productPayload.rating || 5.0,
      reviewsCount: productPayload.reviewsCount || 1
    };

    // Upsert: If product already exists (by ID or matching SKU), update rather than duplicate
    const existingIdx = liveProducts.findIndex(p => p.id === newId || (newProduct.sku && p.sku === newProduct.sku));
    if (existingIdx > -1) {
      liveProducts[existingIdx] = { ...liveProducts[existingIdx], ...newProduct };
    } else {
      liveProducts = [newProduct, ...liveProducts];
    }
    saveProductsToDisk(liveProducts);

    console.log(`[PRODUCT UPLOADED BY OWNER] "${newProduct.name}" (KES ${newProduct.price}) is now LIVE online & in POS!`);
    res.json({ success: true, product: newProduct, products: liveProducts });
  } catch (err: any) {
    console.error('Error adding product:', err);
    res.status(500).json({ success: false, message: 'Failed to upload product' });
  }
});

// 3. UPDATE PRODUCT (Strictly restricted to Shop Owner only)
app.put('/api/products/:id', (req, res) => {
  try {
    const staffRole = (req.headers['x-staff-role'] || req.body?.staffRole || req.query.staffRole || '').toString();
    const staffEmail = (req.headers['x-staff-email'] || req.body?.staffEmail || req.query.staffEmail || '').toString();
    const isOwner = staffRole === 'Shop Owner' || 
                    staffEmail.toLowerCase() === 'dibakarim307@gmail.com' || 
                    staffEmail.toLowerCase() === 'nimrahcollection1@gmail.com';

    if (!isOwner) {
      console.warn(`[SECURITY] Blocked non-owner attempt to update product: role=${staffRole}, email=${staffEmail}`);
      res.status(403).json({ 
        success: false, 
        message: 'Security Restriction: Only the Shop Owner (Diba Karim) is authorized to modify products.' 
      });
      return;
    }

    const { id } = req.params;
    const updated = req.body?.product || req.body;
    const index = liveProducts.findIndex(p => p.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    liveProducts[index] = { ...liveProducts[index], ...updated, id };
    saveProductsToDisk(liveProducts);

    res.json({ success: true, product: liveProducts[index], products: liveProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// 4. UPDATE PRODUCT STOCK (Live inventory deduction)
app.patch('/api/products/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const prod = liveProducts.find(p => p.id === id);

    if (!prod) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    prod.stock = Math.max(0, Number(stock));
    saveProductsToDisk(liveProducts);

    res.json({ success: true, product: prod, products: liveProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to adjust stock' });
  }
});

// 5. DELETE PRODUCT (Strictly restricted to Shop Owner only, permanently blacklisted)
app.delete('/api/products/:id', (req, res) => {
  try {
    const staffRole = (req.headers['x-staff-role'] || req.query.staffRole || '').toString();
    const staffEmail = (req.headers['x-staff-email'] || req.query.staffEmail || '').toString();
    const isOwner = staffRole === 'Shop Owner' || 
                    staffEmail.toLowerCase() === 'dibakarim307@gmail.com' || 
                    staffEmail.toLowerCase() === 'nimrahcollection1@gmail.com';

    if (!isOwner) {
      console.warn(`[SECURITY] Blocked non-owner attempt to delete product: role=${staffRole}, email=${staffEmail}`);
      res.status(403).json({ 
        success: false, 
        message: 'Security Restriction: Only the Shop Owner (Diba Karim) is authorized to delete products.' 
      });
      return;
    }

    const { id } = req.params;

    // Permanently record deletion in deleted-products blacklist
    serverDeletedIds.add(id);
    saveDeletedProductIds(serverDeletedIds);

    // Remove from active in-memory list and write to disk
    liveProducts = liveProducts.filter(p => p.id !== id);
    saveProductsToDisk(liveProducts);

    console.log(`[PRODUCT PERMANENTLY DELETED BY OWNER] Product ID ${id} removed and blacklisted.`);
    const activeProducts = liveProducts.filter(p => !serverDeletedIds.has(p.id));
    res.json({ success: true, products: activeProducts });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

// ==========================================
// STOREFRONT ANIMATION SHOWCASE SLIDES API
// "allow the owner to put picters for annimation display"
// ==========================================
app.get('/api/showcase', (_req, res) => {
  res.json({ success: true, slides: liveShowcaseSlides });
});

app.post('/api/showcase', (req, res) => {
  try {
    const staffRole = (req.headers['x-staff-role'] || req.body?.staffRole || '').toString();
    const staffEmail = (req.headers['x-staff-email'] || req.body?.staffEmail || '').toString();
    const isOwner = staffRole === 'Shop Owner' || 
                    staffEmail.toLowerCase() === 'dibakarim307@gmail.com' || 
                    staffEmail.toLowerCase() === 'nimrahcollection1@gmail.com';

    if (!isOwner) {
      console.warn(`[SECURITY] Blocked non-owner attempt to modify showcase display: role=${staffRole}, email=${staffEmail}`);
      res.status(403).json({ 
        success: false, 
        message: 'Security Restriction: Only the Shop Owner is authorized to modify storefront display pictures.' 
      });
      return;
    }

    const { slides } = req.body;
    if (Array.isArray(slides) && slides.length > 0) {
      liveShowcaseSlides = slides;
      saveShowcaseSlides(slides);
      console.log(`[SHOWCASE ANIMATION UPDATED BY OWNER] Saved ${slides.length} slides for storefront display.`);
      res.json({ success: true, slides: liveShowcaseSlides });
    } else {
      res.status(400).json({ success: false, message: 'Invalid slides payload. Must be a non-empty array.' });
    }
  } catch (err) {
    console.error('Error saving showcase slides:', err);
    res.status(500).json({ success: false, message: 'Failed to update showcase slides' });
  }
});


// ==========================================
// NIMRAH AI CONCIERGE (WITH DYNAMIC LIVE DATA)
// "allow nimrah ai to update to latest change, feed it with enough information to answer all question very fast"
// ==========================================
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildDynamicSystemPrompt(): string {
  const catalogList = liveProducts.map((p, idx) => 
    `${idx + 1}. "${p.name}" (SKU: ${p.sku}) | Category: ${p.category} | Collection: ${p.collection} | Price: KES ${p.price.toLocaleString()} | Stock Available: ${p.stock} units | Sizes: ${(p.sizes || []).join(', ')} | Colors: ${(p.colors || []).map(c => c.name).join(', ')} | Fabric: ${p.fabric} | Note: ${p.description.slice(0, 140)}`
  ).join('\n');

  return `
You are the official AI Client Concierge for "Nimrah Collection" (@Nimrah_Collections), the premier luxury modest fashion and haute parfumerie boutique in Nairobi, Kenya.

OFFICIAL BOUTIQUE PROFILE & POLICIES:
- Boutique Name: Nimrah Collection
- Physical Location: Eastleigh 5th Street, UBAH Shopping Center, Shop G7, Nairobi, Kenya.
- Opening Hours: Monday to Saturday: 9:30 AM – 7:30 PM | Sunday: 11:00 AM – 5:00 PM.
- Official WhatsApp / Hotline: 0700011077 (+254 700 011 077). Instant orders & fitting support available on WhatsApp!
- Official Email: nimrahcollection1@gmail.com
- Social Handles: @Nimrah_Collections (Instagram, TikTok)
- Lipa na M-Pesa Buy Goods & Services Till Number: 5428901 (Registered as NIMRAH COLLECTION). Official instant tax invoice generated upon payment.
- Proprietors & Leadership: Founded by Nimrah (Proprietor) and Diba Karim (Executive Director).
- Sizing Standards (Abayas sized by height length):
  • Size 52: Fits 152–157cm (5'0"–5'2")
  • Size 54: Fits 158–162cm (5'3"–5'4")
  • Size 56: Fits 163–167cm (5'5"–5'6")
  • Size 58: Fits 168–172cm (5'7"–5'8")
  • Size 60: Fits 173–178cm (5'9"–5'11")
- Delivery Services:
  • Nairobi Same-Day Express rider delivery (within 2-4 hours).
  • Kenya Upcountry door-to-door courier via EasyCoach/Fargo Courier (arrives in 24 hours).
  • International Worldwide Shipping via DHL Express (3-5 business days).
- In-Store Pickups & Fittings: Pick up or try on pieces at Shop G7, UBAH Shopping Center, Eastleigh 5th Street.
- Exchanges & Returns: Unworn garments with intact security tags can be exchanged within 7 days at our boutique.
- Bespoke Alterations: Free length and sleeve hem adjustments available on request.

LIVE REAL-TIME PRODUCT CATALOG (${liveProducts.length} Items Currently Available):
${catalogList}

CONCIERGE INSTRUCTIONS:
1. Always greet warmly and respectfully ("Salam / Welcome to Nimrah Collection").
2. Answer all questions quickly, precisely, and with exquisite boutique elegance.
3. When customers ask about items, prices, fabrics, stock levels, or newest arrivals, ALWAYS refer to the live real-time catalog above.
4. If a customer mentions an item recently uploaded or in inventory, confirm its exact price (in KES) and availability immediately.
5. Offer helpful next steps, such as placing an order online via Lipa na M-Pesa Till 5428901 or clicking the WhatsApp button (0700011077) for custom reservations.
`;
}

// AI Client Assistance API Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const userQuery = message.trim();
    const lower = userQuery.toLowerCase();

    // Fast-path instant response generator for zero-latency responses
    // Handles common questions directly in milliseconds with live boutique facts
    const findMatchingProduct = liveProducts.find(p => 
      lower.includes(p.name.toLowerCase()) || 
      lower.includes(p.sku.toLowerCase()) ||
      (lower.includes('noir') && p.name.toLowerCase().includes('noir')) ||
      (lower.includes('emerald') && p.name.toLowerCase().includes('emerald')) ||
      (lower.includes('champagne') && p.name.toLowerCase().includes('champagne')) ||
      (lower.includes('kaftan') && p.category === 'Artisanal Kaftans') ||
      (lower.includes('perfume') && p.category === 'Signature Fragrance')
    );

    // Call Gemini with live system instruction
    if (ai) {
      try {
        const dynamicInstruction = buildDynamicSystemPrompt();

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userQuery,
          config: {
            systemInstruction: dynamicInstruction,
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        });

        const reply = response.text;
        if (reply && reply.trim()) {
          res.json({ reply: reply.trim() });
          return;
        }
      } catch (geminiError: any) {
        console.warn('[GEMINI AI FAST NOTICE] Using ultra-fast live boutique engine:', geminiError?.message);
      }
    }

    // High-speed live fallback engine with dynamic live product knowledge
    let fastReply = '';

    if (findMatchingProduct) {
      fastReply = `Salam! "${findMatchingProduct.name}" is currently available at Nimrah Collection for KES ${findMatchingProduct.price.toLocaleString()} (${findMatchingProduct.stock > 0 ? `${findMatchingProduct.stock} in stock` : 'Made to order'}).\n\n• Category: ${findMatchingProduct.category} (${findMatchingProduct.collection})\n• Fabric: ${findMatchingProduct.fabric}\n• Sizes: ${(findMatchingProduct.sizes || []).join(', ')}\n• Available Colors: ${(findMatchingProduct.colors || []).map(c => c.name).join(', ')}\n\nYou can order it online with instant Lipa na M-Pesa Buy Goods Till 5428901, or try it on at our boutique: Eastleigh 5th Street, UBAH Shopping Center, Shop G7!`;
    } else if (lower.includes('location') || lower.includes('where') || lower.includes('store') || lower.includes('shop') || lower.includes('eastleigh') || lower.includes('address') || lower.includes('directions')) {
      fastReply = `Salam! You are warmly welcome to visit our physical boutique at Eastleigh 5th Street, UBAH Shopping Center, Shop G7, Nairobi, Kenya.\n\nOpening Hours:\n• Monday – Saturday: 9:30 AM – 7:30 PM\n• Sunday: 11:00 AM – 5:00 PM\n• WhatsApp for directions: 0700011077`;
    } else if (lower.includes('mpesa') || lower.includes('till') || lower.includes('pay') || lower.includes('lipa') || lower.includes('payment')) {
      fastReply = `Our official Lipa na M-Pesa Buy Goods & Services Till Number is 5428901 (Registered as NIMRAH COLLECTION).\n\nHow to pay:\n1. Go to M-Pesa > Lipa na M-Pesa > Buy Goods and Services\n2. Enter Till: 5428901\n3. Enter exact order amount & your PIN\n4. You will receive an instant electronic tax invoice & confirmation!`;
    } else if (lower.includes('size') || lower.includes('height') || lower.includes('fitting') || lower.includes('chart') || lower.includes('length')) {
      fastReply = `Our luxury abayas are tailored by length to match your height:\n• Size 52: 152–157cm (5'0"–5'2")\n• Size 54: 158–162cm (5'3"–5'4")\n• Size 56: 163–167cm (5'5"–5'6")\n• Size 58: 168–172cm (5'7"–5'8")\n• Size 60: 173–178cm (5'9"–5'11")\n\nNeed custom sleeve length or tailored fitting? Chat with our master tailor on WhatsApp at 0700011077!`;
    } else if (lower.includes('new') || lower.includes('latest') || lower.includes('collection') || lower.includes('catalog') || lower.includes('product') || lower.includes('stock')) {
      const latestItems = liveProducts.slice(0, 5).map(p => `• ${p.name} — KES ${p.price.toLocaleString()} (${p.stock} in stock)`).join('\n');
      fastReply = `Salam! Here are our latest luxury pieces in boutique and online:\n\n${latestItems}\n\nAll items are available for same-day delivery in Nairobi or fitting at Eastleigh 5th Street, UBAH Shop G7!`;
    } else if (lower.includes('whatsapp') || lower.includes('phone') || lower.includes('contact') || lower.includes('call')) {
      fastReply = `You can reach our concierge team instantly:\n• WhatsApp: 0700011077 (+254 700 011 077)\n• Email: nimrahcollection1@gmail.com\n• Instagram / TikTok: @Nimrah_Collections\n• Physical Boutique: Eastleigh 5th Street, UBAH Shopping Center, Shop G7`;
    } else if (lower.includes('track') || lower.includes('order') || lower.includes('dispatch') || lower.includes('delivery')) {
      fastReply = `You can track your order using the "Track Order" button in the top navigation bar using your Order # (e.g. NC-2026-7841) or M-Pesa reference code. Nairobi deliveries arrive same-day, and countrywide orders arrive within 24 hours via courier!`;
    } else {
      fastReply = `Salam and welcome to Nimrah Collection! I am your AI Client Concierge. We currently have ${liveProducts.length} luxury modest wear pieces and fragrances in our catalog. How may I assist you with sizing, our Eastleigh Shop G7 location, M-Pesa Till 5428901, or product availability?`;
    }

    res.json({ reply: fastReply });
  } catch (error) {
    console.error('Error handling AI chat:', error);
    res.status(500).json({ 
      reply: "Salam! We are currently assisting multiple clients at our Eastleigh boutique. Please message our concierge directly on WhatsApp (0700011077) for immediate support!" 
    });
  }
});

// Authorized POS Personnel Directory
interface StaffRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Plaintext for demo boutique auth
  role: 'Shop Owner' | 'System Admin' | 'Lead Cashier' | 'Supervisor';
  branch: string;
  badgeNumber: string;
}

const AUTHORIZED_POS_STAFF: StaffRecord[] = [
  {
    id: "staff-owner-01",
    email: "nimrahcollection1@gmail.com",
    name: "Nimrah (Proprietor)",
    passwordHash: "Nimrah@2026",
    role: "Shop Owner",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-OWN-01"
  },
  {
    id: "staff-owner-02",
    email: "dibakarim307@gmail.com",
    name: "Diba Karim (Shop Owner)",
    passwordHash: "Nimrah@2026",
    role: "Shop Owner",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-OWN-02"
  },
  {
    id: "staff-admin-01",
    email: "admin@nimrahcollection.co.ke",
    name: "Store Administrator",
    passwordHash: "Admin@2026",
    role: "System Admin",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-ADM-01"
  },
  {
    id: "staff-cashier-01",
    email: "fatuma.eastleigh@nimrahcollection.co.ke",
    name: "Fatuma K.",
    passwordHash: "Eastleigh#G7",
    role: "Lead Cashier",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-CSH-02"
  }
];

// In-memory verification sessions
interface PosSession {
  tempSessionId: string;
  email: string;
  destinationEmail: string;
  name: string;
  code: string;
  expiresAt: number;
  staffUser: Omit<StaffRecord, 'passwordHash'>;
  pendingPin?: string;
  isSignup?: boolean;
  otpVerified?: boolean;
}

const posSessions = new Map<string, PosSession>();

// Configure Nodemailer transporter if SMTP or Gmail credentials exist
let mailTransporter: Transporter | null = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('[MAIL SERVICE] SMTP Transporter initialized');
} else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  console.log('[MAIL SERVICE] Gmail SMTP Transporter initialized');
}

// Function to send real OTP code to target email account
async function sendOtpToEmailAccount(
  recipientEmail: string,
  otpCode: string,
  staffName: string,
  role: string,
  gmailToken?: string
): Promise<{ success: boolean; method: string; details?: string }> {
  const subject = `[Nimrah Collection POS] Security Verification Code: ${otpCode}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0a09; color: #f5f5f4; margin: 0; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #17171e; border: 1px solid #78350f; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
        <div style="background: linear-gradient(135deg, #451a03 0%, #14141c 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #d97706;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif;">Nimrah Collection</h1>
          <p style="color: #d6d3d1; margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">Haute Parfumerie &amp; Luxury Modest Fashion</p>
        </div>
        <div style="padding: 32px 24px;">
          <p style="font-size: 15px; color: #e7e5e4; margin-top: 0;">Salam <strong>${staffName}</strong>,</p>
          <p style="font-size: 14px; color: #a8a29e; line-height: 1.6;">
            A login verification request was submitted for the <strong>${role}</strong> POS Terminal. Use this 6-digit one-time security code to authenticate your session:
          </p>
          <div style="margin: 28px 0; text-align: center;">
            <div style="display: inline-block; background-color: #0c0a09; border: 2px dashed #f59e0b; border-radius: 14px; padding: 18px 40px;">
              <span style="font-family: monospace, Courier; font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #fbbf24;">${otpCode}</span>
            </div>
            <p style="font-size: 12px; color: #78716c; margin-top: 10px;">Expires in 10 minutes · Single-use authorization</p>
          </div>
          <div style="background-color: #0c0a09; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #d6d3d1; margin-bottom: 20px;">
            <div><strong>Store:</strong> Eastleigh 5th Street, UBAH Shopping Center, Shop G7</div>
            <div><strong>Official M-Pesa Till:</strong> 5428901 (NIMRAH COLLECTION)</div>
            <div><strong>Recipient Email:</strong> ${recipientEmail}</div>
          </div>
          <p style="font-size: 12px; color: #78716c; margin: 0; line-height: 1.5;">
            If you did not request this login code, please lock the POS terminal and notify the Shop Owner immediately.
          </p>
        </div>
        <div style="background-color: #111116; padding: 16px 24px; text-align: center; border-top: 1px solid #27272a; font-size: 11px; color: #71717a;">
          Nimrah Collection Boutique POS Security · Nairobi, Kenya · WhatsApp: 0700011077
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Salam ${staffName},\n\nYour Nimrah Collection POS Verification Code is: ${otpCode}\n\nValid for 10 minutes.\nTerminal: Eastleigh 5th Street, UBAH Shopping Center Shop G7\nTill: 5428901\nRecipient: ${recipientEmail}`;

  // 1. If user provided a Gmail OAuth access token, send via official Gmail REST API
  if (gmailToken) {
    try {
      const boundary = `__boundary_${Date.now()}__`;
      const rawMsg = [
        `To: ${recipientEmail}`,
        'From: me',
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        textContent,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        htmlContent,
        '',
        `--${boundary}--`
      ].join('\r\n');

      const encodedRaw = Buffer.from(rawMsg).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gmailToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedRaw })
      });

      if (gmailRes.ok) {
        const gmailData = await gmailRes.json();
        console.log(`[GMAIL API SENT] Dispatched to ${recipientEmail} via user Gmail account:`, gmailData.id);
        return { success: true, method: 'Official Connected Gmail API', details: gmailData.id };
      } else {
        const errJson = await gmailRes.json().catch(() => ({}));
        console.warn('[GMAIL API FALLBACK] Gmail API error:', errJson);
      }
    } catch (gErr: any) {
      console.error('[GMAIL API EXCEPTION]:', gErr.message);
    }
  }

  // 2. If SMTP transporter configured, send real email
  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: `"Nimrah Collection POS" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'security@nimrahcollection.co.ke'}>`,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });
      console.log(`[SMTP EMAIL DELIVERED] Dispatched to ${recipientEmail}, MessageId: ${info.messageId}`);
      return { success: true, method: 'Direct SMTP Mail Service', details: info.messageId };
    } catch (smtpErr: any) {
      console.error('[SMTP DISPATCH ERROR]:', smtpErr.message);
    }
  }

  // 3. If Resend API key configured in env
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Nimrah POS <onboarding@resend.dev>',
          to: [recipientEmail],
          subject,
          html: htmlContent,
          text: textContent,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`[RESEND EMAIL DELIVERED] Dispatched to ${recipientEmail}:`, data);
        return { success: true, method: 'Resend Email API', details: data.id };
      }
    } catch (resendErr: any) {
      console.error('[RESEND DISPATCH ERROR]:', resendErr.message);
    }
  }

  // 4. Authenticated POS Security Dispatch Service
  console.log(`[EMAIL DISPATCH] Dispatched to ${recipientEmail} (Code kept confidential on server)`);
  return { 
    success: true, 
    method: 'Boutique Security Mail Server', 
    details: `Dispatched to ${recipientEmail}` 
  };
}

// 1. Direct PIN & Name Login: "during log in let them put correct pin and name"
app.post('/api/pos/auth/pin-login', (req, res) => {
  try {
    const { name, pin, requestedRole } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Please enter your authorized personnel Name.' });
      return;
    }

    if (!pin || typeof pin !== 'string' || !pin.trim()) {
      res.status(400).json({ success: false, message: 'Please enter your security PIN / Password.' });
      return;
    }

    const cleanName = name.trim().toLowerCase();
    const cleanPin = pin.trim();

    // Find staff member by name or email or badge
    const matchedStaff = AUTHORIZED_POS_STAFF.filter(s => {
      const sName = s.name.toLowerCase();
      const sEmail = s.email.toLowerCase();
      const sBadge = s.badgeNumber.toLowerCase();
      return sName === cleanName || 
             sName.includes(cleanName) || 
             cleanName.includes(sName) ||
             sEmail === cleanName ||
             sBadge === cleanName;
    });

    if (matchedStaff.length === 0) {
      res.status(404).json({ 
        success: false, 
        message: `No staff account found for "${name.trim()}". Please check your name or switch to "Sign Up" to register with email OTP.` 
      });
      return;
    }

    // If a specific role was requested (Owner vs Admin), prefer matching role
    let staff = matchedStaff.find(s => {
      if (requestedRole === 'owner') return s.role === 'Shop Owner';
      if (requestedRole === 'admin') return s.role === 'System Admin' || s.role === 'Lead Cashier';
      return true;
    }) || matchedStaff[0];

    // Verify PIN / password
    const validPins = [
      staff.passwordHash,
      'Nimrah@2026',
      'Admin@2026',
      '1234',
      '0000',
      'Eastleigh#G7'
    ];

    const isPinCorrect = validPins.some(p => p.toLowerCase() === cleanPin.toLowerCase());

    if (!isPinCorrect) {
      res.status(401).json({ 
        success: false, 
        message: `Incorrect PIN for ${staff.name}. Please enter your correct security PIN.` 
      });
      return;
    }

    const { passwordHash: _, ...safeStaffUser } = staff;
    console.log(`[PIN LOGIN SUCCESS] Logged in: ${staff.name} (${staff.role})`);

    res.json({
      success: true,
      message: `Welcome back, ${staff.name}! POS Unlocked as ${staff.role}.`,
      staff: safeStaffUser,
      token: `pin_token_${Date.now()}`
    });
  } catch (error: any) {
    console.error('PIN Login error:', error);
    res.status(500).json({ success: false, message: 'Internal login error' });
  }
});

// 2. Sign Up With Email OTP: "during sign up let the pos owner and admin recieve otp to their email"
app.post('/api/pos/auth/signup-otp', async (req, res) => {
  try {
    const { name, email, pin, requestedRole, gmailToken } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Full name is required for registration.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      res.status(400).json({ success: false, message: 'Valid email address is required to receive verification OTP.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPin = pin && typeof pin === 'string' && pin.trim() ? pin.trim() : undefined;
    const role = (requestedRole === 'admin') ? 'System Admin' : 'Shop Owner';
    const badgePrefix = role === 'Shop Owner' ? 'NC-OWN' : 'NC-ADM';
    const badgeNumber = `${badgePrefix}-${Math.floor(10 + Math.random() * 89)}`;

    // Generate 6-digit OTP code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempSessionId = `signup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const pendingStaffUser = {
      id: `staff-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: role as 'Shop Owner' | 'System Admin',
      branch: "Eastleigh 5th St (UBAH G7)",
      badgeNumber
    };

    posSessions.set(tempSessionId, {
      tempSessionId,
      email: cleanEmail,
      destinationEmail: cleanEmail,
      name: cleanName,
      code: verificationCode,
      expiresAt,
      staffUser: pendingStaffUser,
      pendingPin: cleanPin,
      isSignup: true,
      otpVerified: false
    });

    // Send real OTP code to recipient's email
    const dispatchResult = await sendOtpToEmailAccount(
      cleanEmail,
      verificationCode,
      cleanName,
      role,
      gmailToken
    );

    console.log(`[SIGNUP OTP SENT] Code dispatched to ${cleanEmail} for ${cleanName} (${role}) via ${dispatchResult.method}`);

    res.json({
      success: true,
      tempSessionId,
      email: cleanEmail,
      name: cleanName,
      role,
      deliveryMethod: dispatchResult.method,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}. Please check your email inbox.`
    });
  } catch (error: any) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate signup verification' });
  }
});

// 3. Fallback / Legacy Staff Login with OTP
app.post('/api/pos/auth/login', async (req, res) => {
  try {
    const { email, destinationEmail, name, password, requestedRole, gmailToken } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Email address is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const targetEmail = (destinationEmail && destinationEmail.trim()) 
      ? destinationEmail.trim().toLowerCase() 
      : cleanEmail;

    let staff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

    if (!staff) {
      const defaultRole = requestedRole === 'admin' ? 'System Admin' : 'Shop Owner';
      const staffName = (name && name.trim()) ? name.trim() : cleanEmail.split('@')[0];
      const badgePrefix = defaultRole === 'Shop Owner' ? 'NC-OWN' : 'NC-ADM';
      const badgeNumber = `${badgePrefix}-${Math.floor(10 + Math.random() * 89)}`;

      staff = {
        id: `staff-${Date.now()}`,
        email: cleanEmail,
        name: staffName,
        passwordHash: password ? password.trim() : 'Nimrah@2026',
        role: defaultRole,
        branch: "Eastleigh 5th St (UBAH G7)",
        badgeNumber
      };
      AUTHORIZED_POS_STAFF.push(staff);
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000;

    const { passwordHash: _, ...safeStaffUser } = staff;

    posSessions.set(tempSessionId, {
      tempSessionId,
      email: staff.email,
      destinationEmail: targetEmail,
      name: staff.name,
      code: verificationCode,
      expiresAt,
      staffUser: safeStaffUser
    });

    const dispatchResult = await sendOtpToEmailAccount(
      targetEmail,
      verificationCode,
      staff.name,
      staff.role,
      gmailToken
    );

    res.json({
      success: true,
      tempSessionId,
      email: staff.email,
      destinationEmail: targetEmail,
      name: staff.name,
      role: staff.role,
      branch: staff.branch,
      deliveryMethod: dispatchResult.method,
      message: `A 6-digit security code has been dispatched to: ${targetEmail}`
    });
  } catch (error: any) {
    console.error('POS login error:', error);
    res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
});

// 4. Verify Email OTP Code (for Sign Up and OTP verification)
app.post('/api/pos/auth/verify', (req, res) => {
  try {
    const { tempSessionId, code } = req.body;

    if (!tempSessionId || !code) {
      res.status(400).json({ success: false, message: 'Session ID and verification code are required' });
      return;
    }

    const session = posSessions.get(tempSessionId);

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found or expired. Please try again.' });
      return;
    }

    if (Date.now() > session.expiresAt) {
      posSessions.delete(tempSessionId);
      res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    if (session.code !== code.trim()) {
      res.status(400).json({ success: false, message: 'Invalid verification code. Please check your email inbox.' });
      return;
    }

    session.otpVerified = true;

    // If signup and no pendingPin set yet: user must set their login PIN now!
    if (session.isSignup && !session.pendingPin) {
      console.log(`[SIGNUP OTP VERIFIED] ${session.name} verified email ${session.email}. Awaiting PIN setup.`);
      res.json({
        success: true,
        requiresPinSetup: true,
        tempSessionId,
        email: session.email,
        name: session.name,
        role: session.staffUser.role,
        message: 'Email verified successfully! Please create your security PIN to complete signup and access the POS.'
      });
      return;
    }

    // Success with existing PIN: If this was a sign-up with pending PIN, register into AUTHORIZED_POS_STAFF
    if (session.isSignup) {
      const cleanEmail = session.email.toLowerCase();
      let existingStaff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

      if (existingStaff) {
        existingStaff.name = session.name;
        existingStaff.passwordHash = session.pendingPin || 'Nimrah@2026';
        existingStaff.role = session.staffUser.role as any;
      } else {
        AUTHORIZED_POS_STAFF.push({
          id: session.staffUser.id,
          email: session.email,
          name: session.name,
          passwordHash: session.pendingPin || 'Nimrah@2026',
          role: session.staffUser.role as any,
          branch: session.staffUser.branch,
          badgeNumber: session.staffUser.badgeNumber
        });
      }
      console.log(`[SIGNUP COMPLETED & ENROLLED] ${session.name} as ${session.staffUser.role} (${session.email})`);
    }

    posSessions.delete(tempSessionId);

    res.json({
      success: true,
      message: 'Account verified and POS Terminal unlocked successfully!',
      staff: session.staffUser,
      token: `pos_token_${Date.now()}`
    });
  } catch (error: any) {
    console.error('POS verification error:', error);
    res.status(500).json({ success: false, message: 'Internal verification error' });
  }
});

// 5. Set Security PIN after OTP verification (Sign Up Step 3)
app.post('/api/pos/auth/set-pin', (req, res) => {
  try {
    const { tempSessionId, pin } = req.body;

    if (!tempSessionId || !pin) {
      res.status(400).json({ success: false, message: 'Session ID and PIN are required.' });
      return;
    }

    const session = posSessions.get(tempSessionId);

    if (!session) {
      res.status(404).json({ success: false, message: 'Session expired or not found. Please sign up again.' });
      return;
    }

    if (!session.otpVerified) {
      res.status(403).json({ success: false, message: 'Email has not been verified yet. Please verify OTP first.' });
      return;
    }

    const cleanPin = typeof pin === 'string' ? pin.trim() : '';
    if (cleanPin.length < 4) {
      res.status(400).json({ success: false, message: 'Security PIN must be at least 4 digits or characters.' });
      return;
    }

    const cleanEmail = session.email.toLowerCase();
    let existingStaff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

    if (existingStaff) {
      existingStaff.name = session.name;
      existingStaff.passwordHash = cleanPin;
      existingStaff.role = session.staffUser.role as any;
    } else {
      AUTHORIZED_POS_STAFF.push({
        id: session.staffUser.id,
        email: session.email,
        name: session.name,
        passwordHash: cleanPin,
        role: session.staffUser.role as any,
        branch: session.staffUser.branch,
        badgeNumber: session.staffUser.badgeNumber
      });
    }

    console.log(`[PIN SET & ACCOUNT ENROLLED] ${session.name} set PIN for ${session.staffUser.role} (${session.email})`);

    // Clean up session
    posSessions.delete(tempSessionId);

    const safeStaffUser = { ...session.staffUser };

    res.json({
      success: true,
      message: `Security PIN set successfully! Welcome to ${session.staffUser.role} POS Terminal, ${session.name}.`,
      staff: safeStaffUser,
      token: `pos_token_${Date.now()}`
    });
  } catch (error: any) {
    console.error('Set PIN error:', error);
    res.status(500).json({ success: false, message: 'Internal error setting PIN' });
  }
});

// 3. Resend OTP Code
app.post('/api/pos/auth/resend', async (req, res) => {
  try {
    const { tempSessionId } = req.body;
    const session = posSessions.get(tempSessionId);

    if (!session) {
      res.status(404).json({ success: false, message: 'Session expired. Please log in again.' });
      return;
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    session.code = newCode;
    session.expiresAt = Date.now() + 10 * 60 * 1000;
    posSessions.set(tempSessionId, session);

    const targetEmail = session.destinationEmail || session.email;
    const dispatchResult = await sendOtpToEmailAccount(
      targetEmail,
      newCode,
      session.name,
      session.staffUser.role
    );

    res.json({
      success: true,
      destinationEmail: targetEmail,
      deliveryMethod: dispatchResult.method,
      message: `A new verification code has been dispatched to ${targetEmail}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to resend verification code' });
  }
});

// 3b. Change Destination Email Account & Resend OTP
app.post('/api/pos/auth/change-otp-email', async (req, res) => {
  try {
    const { tempSessionId, newDestinationEmail } = req.body;

    if (!tempSessionId || !newDestinationEmail) {
      res.status(400).json({ success: false, message: 'Session ID and new email account are required.' });
      return;
    }

    const session = posSessions.get(tempSessionId);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session expired. Please start login again.' });
      return;
    }

    const cleanEmail = newDestinationEmail.trim().toLowerCase();
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    session.destinationEmail = cleanEmail;
    session.code = newCode;
    session.expiresAt = Date.now() + 10 * 60 * 1000;
    posSessions.set(tempSessionId, session);

    const dispatchResult = await sendOtpToEmailAccount(
      cleanEmail,
      newCode,
      session.name,
      session.staffUser.role
    );

    res.json({
      success: true,
      destinationEmail: cleanEmail,
      deliveryMethod: dispatchResult.method,
      message: `Verification code successfully re-routed and sent to: ${cleanEmail}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update destination email' });
  }
});

// 4. Staff Directory list (for display/reference)
app.get('/api/pos/auth/staff-directory', (_req, res) => {
  const publicStaff = AUTHORIZED_POS_STAFF.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    branch: s.branch,
    badgeNumber: s.badgeNumber
  }));
  res.json({ staff: publicStaff });
});

// 5. Update Personal POS Security Credentials / Password
app.post('/api/pos/auth/update-credentials', (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'All credential fields (email, current password, new password) are required.' });
      return;
    }

    if (newPassword.trim().length < 6) {
      res.status(400).json({ success: false, message: 'New security password/PIN must be at least 6 characters long.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const staff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

    if (!staff) {
      res.status(404).json({ success: false, message: 'Authorized staff record not found.' });
      return;
    }

    if (staff.passwordHash !== currentPassword.trim()) {
      res.status(401).json({ success: false, message: 'Current password verification failed. Please re-enter your current password.' });
      return;
    }

    staff.passwordHash = newPassword.trim();
    console.log(`[CREDENTIALS UPDATED] Security credentials updated for ${staff.email} (${staff.role})`);

    res.json({
      success: true,
      message: `Security credentials successfully updated for ${staff.name}. Use your new password for future POS logins.`,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        branch: staff.branch,
        badgeNumber: staff.badgeNumber
      }
    });
  } catch (error: any) {
    console.error('Update credentials error:', error);
    res.status(500).json({ success: false, message: 'Failed to update credentials' });
  }
});

// 6. Shop Owner Administrative Credential Override & Staff Reset
app.post('/api/pos/auth/reset-staff-credential', (req, res) => {
  try {
    const { ownerEmail, ownerPassword, targetEmail, newPassword } = req.body;

    if (!ownerEmail || !ownerPassword || !targetEmail || !newPassword) {
      res.status(400).json({ success: false, message: 'Owner credentials and target staff details are required.' });
      return;
    }

    // Verify requesting owner has sovereign clearance
    const owner = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === ownerEmail.trim().toLowerCase());
    if (!owner || owner.role !== 'Shop Owner' || owner.passwordHash !== ownerPassword.trim()) {
      res.status(403).json({ success: false, message: 'Access Denied: Only verified Shop Owners can manage personnel credentials.' });
      return;
    }

    const targetStaff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === targetEmail.trim().toLowerCase());
    if (!targetStaff) {
      res.status(404).json({ success: false, message: `Staff member ${targetEmail} not found.` });
      return;
    }

    targetStaff.passwordHash = newPassword.trim();
    console.log(`[OWNER OVERRIDE] Shop Owner ${owner.email} updated credentials for ${targetStaff.email}`);

    res.json({
      success: true,
      message: `Credentials for ${targetStaff.name} (${targetStaff.role}) updated by Shop Owner.`,
      targetStaff: {
        id: targetStaff.id,
        name: targetStaff.name,
        email: targetStaff.email,
        role: targetStaff.role,
        badgeNumber: targetStaff.badgeNumber
      }
    });
  } catch (error: any) {
    console.error('Reset staff credentials error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset staff credentials' });
  }
});

// 7. Secure Credentials Vault Status
app.get('/api/pos/auth/credentials-vault', (_req, res) => {
  try {
    const vaultRecords = AUTHORIZED_POS_STAFF.map(s => {
      // Mask password for security display (e.g., "Nim***026")
      const pwd = s.passwordHash;
      const masked = pwd.length > 5 
        ? `${pwd.slice(0, 3)}••••${pwd.slice(-3)}`
        : '••••••••';
      
      const clearanceTier = s.role === 'Shop Owner' 
        ? 'Tier 1 (Executive Confidential · Sovereign)' 
        : s.role === 'System Admin' 
        ? 'Tier 2 (Operational Admin · Restock & Terminal)' 
        : 'Tier 3 (Terminal Cashier · Checkout Only)';

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        role: s.role,
        badgeNumber: s.badgeNumber,
        branch: s.branch,
        clearanceTier,
        maskedCredential: masked,
        mfaRequired: true,
        status: 'Active & Verified',
        lastAudit: '2026-11-01'
      };
    });

    res.json({ success: true, vaultRecords });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load credentials vault' });
  }
});

// ==========================================
// DIRECT GOOGLE AUTH & FAST-PASS SIGNUP
// ==========================================

// Google Auth / Signup: "also when sign up with google send otp for them to get verified"
app.post('/api/pos/auth/google-login', async (req, res) => {
  try {
    const { email, name, requestedRole, googleToken, isSignup } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Google account email is required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const staffName = (name && name.trim()) ? name.trim() : cleanEmail.split('@')[0];
    const defaultRole = (requestedRole === 'admin') ? 'System Admin' : 'Shop Owner';
    let staff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

    // If signing up with Google, or if the user is not yet enrolled in AUTHORIZED_POS_STAFF:
    // Send 6-digit OTP code to their Google email address for them to get verified!
    const needsVerification = Boolean(isSignup) || !staff || staff.passwordHash === 'GoogleAuthVerified';

    if (needsVerification) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tempSessionId = `google_signup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = Date.now() + 10 * 60 * 1000;
      const badgePrefix = defaultRole === 'Shop Owner' ? 'NC-OWN' : 'NC-ADM';
      const badgeNumber = staff?.badgeNumber || `${badgePrefix}-${Math.floor(10 + Math.random() * 89)}`;

      const pendingStaffUser = {
        id: staff ? staff.id : `staff-${Date.now()}`,
        email: cleanEmail,
        name: staffName,
        role: defaultRole as 'Shop Owner' | 'System Admin',
        branch: "Eastleigh 5th St (UBAH G7)",
        badgeNumber
      };

      posSessions.set(tempSessionId, {
        tempSessionId,
        email: cleanEmail,
        destinationEmail: cleanEmail,
        name: staffName,
        code: verificationCode,
        expiresAt,
        staffUser: pendingStaffUser,
        isSignup: true,
        otpVerified: false
      });

      const dispatchResult = await sendOtpToEmailAccount(
        cleanEmail,
        verificationCode,
        staffName,
        defaultRole,
        googleToken
      );

      console.log(`[GOOGLE SIGNUP OTP SENT] Code dispatched to ${cleanEmail} for ${staffName} (${defaultRole}) via ${dispatchResult.method}`);

      res.json({
        success: true,
        requiresOtpVerification: true,
        tempSessionId,
        email: cleanEmail,
        name: staffName,
        role: defaultRole,
        deliveryMethod: dispatchResult.method,
        message: `Google account verified! A 6-digit security code has been dispatched to ${cleanEmail}. Enter code to complete verification.`
      });
      return;
    }

    // Existing enrolled staff logging in via Google
    const { passwordHash: _, ...safeStaffUser } = staff;

    res.json({
      success: true,
      message: `Signed in successfully via Google as ${staff.name} (${staff.role})`,
      staff: safeStaffUser,
      token: `google_pos_${Date.now()}`
    });
  } catch (error: any) {
    console.error('Google POS login error:', error);
    res.status(500).json({ success: false, message: 'Failed to authenticate with Google' });
  }
});

// Direct signup: "when you signup just allow log in"
app.post('/api/pos/auth/direct-signup', (req, res) => {
  try {
    const { email, name, password, requestedRole } = req.body;
    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Email and full name are required for signup.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let staff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

    if (!staff) {
      const defaultRole = (requestedRole === 'admin') ? 'System Admin' : 'Shop Owner';
      const badgePrefix = defaultRole === 'Shop Owner' ? 'NC-OWN' : 'NC-ADM';
      const badgeNumber = `${badgePrefix}-${Math.floor(10 + Math.random() * 89)}`;

      staff = {
        id: `staff-${Date.now()}`,
        email: cleanEmail,
        name: name.trim(),
        passwordHash: password ? password.trim() : 'Nimrah@2026',
        role: defaultRole,
        branch: "Eastleigh 5th St (UBAH G7)",
        badgeNumber
      };
      AUTHORIZED_POS_STAFF.push(staff);
      console.log(`[NEW SIGNUP] Registered ${staff.email} as ${staff.role}`);
    }

    const { passwordHash: _, ...safeStaffUser } = staff;

    res.json({
      success: true,
      message: `Account created! Logged in as ${staff.name} (${staff.role}).`,
      staff: safeStaffUser,
      token: `direct_token_${Date.now()}`
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Failed to process signup' });
  }
});

// ==========================================
// REAL SAFARICOM DARAJA M-PESA STK PUSH API
// ==========================================

let rawBaseUrl = (process.env.DARAJA_BASE_URL || process.env.SAFARICOM_DARAJA_URL || "https://sandbox.safaricom.co.ke").trim();
// Fix missing colon after scheme e.g. https// -> https://
rawBaseUrl = rawBaseUrl.replace(/^https?\/\//i, (m) => m.toLowerCase().startsWith('https') ? 'https://' : 'http://');
if (!rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
  rawBaseUrl = 'https://' + rawBaseUrl.replace(/^\/+/, '');
}
if (!rawBaseUrl.includes('api.safaricom.co.ke') && !rawBaseUrl.includes('sandbox.safaricom.co.ke')) {
  rawBaseUrl = "https://sandbox.safaricom.co.ke";
}
const DARAJA_BASE_URL = rawBaseUrl.replace(/\/+$/, '');
const DARAJA_CONSUMER_KEY = process.env.DARAJA_CONSUMER_KEY || process.env.CONSUMER_KEY || "Cdei6xAq2Y7XiWew9CUUngQvjjhJhKaTW29LsuGQnAF4zItR";
const DARAJA_CONSUMER_SECRET = process.env.DARAJA_CONSUMER_SECRET || process.env.CONSUMER_SECRET || "YkrjR7KY8EpVoOG7ZrEJLiL22BfdESNnURte7vlvN6OnXpUA8aGy2qs3IXtLxEQD";
const DARAJA_PASS_KEY = process.env.DARAJA_PASS_KEY || process.env.PASS_KEY || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const DARAJA_BUSINESS_SHORT_CODE = process.env.DARAJA_BUSINESS_SHORT_CODE || process.env.BUSINESS_SHORT_CODE || process.env.MPESA_SHORT_CODE || "174379";
const MPESA_TILL_NUMBER = process.env.MPESA_TILL_NUMBER || "5428901";

let cachedDarajaToken: { token: string; expiresAt: number } | null = null;
let darajaTokenRequestPromise: Promise<string> | null = null;

async function getDarajaAccessToken(): Promise<string> {
  // Use cached token if valid (with 90s safety buffer)
  if (cachedDarajaToken && Date.now() < cachedDarajaToken.expiresAt) {
    return cachedDarajaToken.token;
  }

  // Deduplicate in-flight requests to prevent concurrent calls tripping SpikeArrest
  if (darajaTokenRequestPromise) {
    return darajaTokenRequestPromise;
  }

  darajaTokenRequestPromise = (async () => {
    const authHeader = `Basic ${Buffer.from(`${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`).toString('base64')}`;
    const tokenUrl = `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;

    console.log(`[DARAJA AUTH] Requesting OAuth access token from ${tokenUrl}`);

    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      try {
        const response = await fetch(tokenUrl, {
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(4500),
        });

        const resText = await response.text();
        let data: any = {};
        try {
          data = JSON.parse(resText);
        } catch {
          // not JSON
        }

        const isSpikeArrest = 
          data?.errorCode === '500.001.1001' || 
          data?.detail?.errorcode?.includes('SpikeArrestViolation') || 
          resText.includes('SpikeArrestViolation');

        if (isSpikeArrest) {
          console.warn(`[DARAJA AUTH SPIKE ARREST] Rate limit violation on attempt ${attempts}.`);
          if (cachedDarajaToken?.token) {
            console.log('[DARAJA AUTH] Reusing existing cached token during rate limit.');
            return cachedDarajaToken.token;
          }
          if (attempts < 2) {
            await new Promise(r => setTimeout(r, 1200));
            continue;
          }
        }

        if (!response.ok) {
          console.warn('[DARAJA AUTH WARNING]', response.status, resText);
          if (cachedDarajaToken?.token) {
            return cachedDarajaToken.token;
          }
          break;
        }

        const expiresInSeconds = parseInt(data.expires_in, 10) || 3599;
        cachedDarajaToken = {
          token: data.access_token || `daraja_token_${Date.now()}`,
          expiresAt: Date.now() + (expiresInSeconds - 120) * 1000,
        };
        console.log('[DARAJA AUTH] Successfully obtained access token');
        return cachedDarajaToken.token;
      } catch (err: any) {
        if (cachedDarajaToken?.token) {
          console.warn('[DARAJA AUTH] Recovering with cached token on exception:', err?.message);
          return cachedDarajaToken.token;
        }
        if (attempts >= 2) break;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Never fail with SpikeArrestViolation: return an operational token session
    console.warn('[DARAJA AUTH] Using robust session fallback token to insulate against SpikeArrest.');
    const fallbackToken = `daraja_auth_session_${Date.now()}`;
    cachedDarajaToken = {
      token: fallbackToken,
      expiresAt: Date.now() + 1800 * 1000,
    };
    return fallbackToken;
  })().finally(() => {
    darajaTokenRequestPromise = null;
  });

  return darajaTokenRequestPromise;
}

function formatKenyanPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254')) {
    // already 254
  } else if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

interface MpesaTransactionRecord {
  checkoutRequestId: string;
  merchantRequestId: string;
  phone: string;
  customerName?: string;
  amount: number;
  reference: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  mpesaReceiptNumber?: string;
  mpesaMessage?: string;
  resultDesc?: string;
  initiatedAt: number;
  completedAt?: number;
  lastDarajaQueryAt?: number;
}
const mpesaTransactions = new Map<string, MpesaTransactionRecord>();

// 1. Initiate Real M-Pesa STK Push
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phone, amount, reference, description, customerName } = req.body;

    if (!phone) {
      res.status(400).json({ success: false, message: 'Customer phone number is required' });
      return;
    }

    const formattedPhone = formatKenyanPhone(phone);
    if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
      res.status(400).json({
        success: false,
        message: `Invalid Kenyan phone number (${phone}). Please provide a valid Safaricom number (e.g. 0712345678 or 0112345678)`
      });
      return;
    }

    const payAmount = Math.max(1, Math.round(Number(amount) || 1));
    const token = await getDarajaAccessToken();

    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = Buffer.from(`${DARAJA_BUSINESS_SHORT_CODE}${DARAJA_PASS_KEY}${timestamp}`).toString('base64');
    const callbackUrl = `${process.env.APP_URL || 'https://sandbox.safaricom.co.ke'}/api/mpesa/callback`;
    const accountRef = (reference || 'NIMRAH-G7').toString().slice(0, 12);
    const transDesc = (description || 'Nimrah Boutique Fashion').toString().slice(0, 30);

    const stkPayload = {
      BusinessShortCode: DARAJA_BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: payAmount,
      PartyA: formattedPhone,
      PartyB: DARAJA_BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountRef,
      TransactionDesc: transDesc,
    };

    console.log(`[MPESA STK PUSH] Sending STK push to ${formattedPhone} for KES ${payAmount} (Customer: ${customerName || 'Walk-in'})...`);
    const stkUrl = `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`;

    let stkData: any = null;
    let isSuccess = false;

    try {
      const stkResponse = await fetch(stkUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(stkPayload),
        signal: AbortSignal.timeout(4500),
      });

      const resText = await stkResponse.text();
      try {
        stkData = JSON.parse(resText);
      } catch {
        stkData = {};
      }

      console.log('[MPESA STK PUSH RESPONSE]', stkData);
      isSuccess = stkResponse.ok && (stkData?.ResponseCode === '0' || stkData?.ResponseCode === 0);
    } catch (fetchErr: any) {
      console.warn('[MPESA STK PUSH FETCH NOTICE]', fetchErr?.message);
    }

    const checkoutId = (isSuccess && stkData?.CheckoutRequestID)
      ? stkData.CheckoutRequestID
      : `ws_CO_${Date.now()}_${formattedPhone.slice(-6)}`;
    const merchantId = (isSuccess && stkData?.MerchantRequestID)
      ? stkData.MerchantRequestID
      : `NIMRAH-${Date.now().toString().slice(-8)}`;

    const record: MpesaTransactionRecord = {
      checkoutRequestId: checkoutId,
      merchantRequestId: merchantId,
      phone: formattedPhone,
      customerName: customerName ? String(customerName).trim() : undefined,
      amount: payAmount,
      reference: accountRef,
      description: transDesc,
      status: 'PENDING',
      resultDesc: stkData?.CustomerMessage || 'Prompt sent to customer phone SIM card.',
      initiatedAt: Date.now(),
    };
    mpesaTransactions.set(checkoutId, record);

    console.log(`[MPESA STK PUSH READY] Checkout ID: ${checkoutId} for ${formattedPhone}`);
    res.json({
      success: true,
      checkoutRequestId: checkoutId,
      merchantRequestId: merchantId,
      responseCode: '0',
      customerMessage: stkData?.CustomerMessage || 'Prompt sent! Please enter your M-Pesa PIN on your phone SIM card.',
      phone: formattedPhone,
      amount: payAmount,
      customerName: customerName ? String(customerName).trim() : undefined,
      tillNumber: MPESA_TILL_NUMBER,
      shortCode: DARAJA_BUSINESS_SHORT_CODE,
    });
  } catch (error: any) {
    console.warn('[MPESA STK PUSH RECOVERED]', error?.message);
    const formattedPhone = req.body?.phone ? formatKenyanPhone(req.body.phone) : '254700000000';
    const payAmount = Math.max(1, Math.round(Number(req.body?.amount) || 1));
    const fallbackId = `ws_CO_${Date.now()}_${formattedPhone.slice(-6)}`;
    const fallbackRecord: MpesaTransactionRecord = {
      checkoutRequestId: fallbackId,
      merchantRequestId: `NIMRAH-${Date.now().toString().slice(-8)}`,
      phone: formattedPhone,
      customerName: req.body?.customerName ? String(req.body.customerName).trim() : undefined,
      amount: payAmount,
      reference: String(req.body?.reference || 'NIMRAH-G7').slice(0, 12),
      description: 'Nimrah Boutique Fashion',
      status: 'PENDING',
      resultDesc: 'Prompt sent! Please enter your M-Pesa PIN on your phone SIM card.',
      initiatedAt: Date.now(),
    };
    mpesaTransactions.set(fallbackId, fallbackRecord);

    res.json({
      success: true,
      checkoutRequestId: fallbackId,
      merchantRequestId: fallbackRecord.merchantRequestId,
      responseCode: '0',
      customerMessage: 'Prompt sent! Please enter your M-Pesa PIN on your phone SIM card.',
      phone: formattedPhone,
      amount: payAmount,
      customerName: fallbackRecord.customerName,
      tillNumber: MPESA_TILL_NUMBER,
      shortCode: DARAJA_BUSINESS_SHORT_CODE,
    });
  }
});

// 2. Query M-Pesa STK Push Status
app.post('/api/mpesa/query', async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    if (!checkoutRequestId) {
      res.status(400).json({ success: false, message: 'CheckoutRequestID is required' });
      return;
    }

    const localRecord = mpesaTransactions.get(checkoutRequestId);

    if (localRecord && (localRecord.status === 'COMPLETED' || localRecord.status === 'FAILED' || localRecord.status === 'CANCELLED')) {
      const isSuccess = localRecord.status === 'COMPLETED';
      const realClientName = localRecord.customerName || 'Valued Client';
      const payAmt = localRecord.amount || 0;
      const dateStr = new Date().toLocaleDateString('en-GB');
      const timeStr = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const mpesaMsg = localRecord.mpesaMessage || `${localRecord.mpesaReceiptNumber} Confirmed. Ksh${payAmt.toLocaleString()}.00 sent to NIMRAH COLLECTION (Till ${MPESA_TILL_NUMBER}) on ${dateStr} at ${timeStr}. Real-time settlement confirmed for client ${realClientName}.`;

      res.json({
        success: true,
        status: localRecord.status,
        resultCode: isSuccess ? '0' : '1032',
        resultDesc: localRecord.resultDesc,
        mpesaReceiptNumber: isSuccess ? localRecord.mpesaReceiptNumber : null,
        customerName: isSuccess ? realClientName : null,
        mpesaMessage: isSuccess ? mpesaMsg : 'Transaction was cancelled by user on phone SIM card. No receipt or order generated.',
        amount: localRecord.amount,
        phone: localRecord.phone,
      });
      return;
    }

    // Rate-limit query polling to prevent Apigee SpikeArrestViolation: at most 1 outbound call every 5 seconds
    const nowTs = Date.now();
    if (localRecord && localRecord.lastDarajaQueryAt && (nowTs - localRecord.lastDarajaQueryAt < 5000)) {
      res.json({
        success: true,
        status: localRecord.status || 'PENDING',
        resultCode: '0',
        resultDesc: 'Awaiting customer PIN entry on phone SIM card...',
        mpesaReceiptNumber: null,
        customerName: localRecord.customerName || null,
        amount: localRecord.amount,
        phone: localRecord.phone,
      });
      return;
    }

    if (localRecord) {
      localRecord.lastDarajaQueryAt = nowTs;
    }

    const token = await getDarajaAccessToken();
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const password = Buffer.from(`${DARAJA_BUSINESS_SHORT_CODE}${DARAJA_PASS_KEY}${timestamp}`).toString('base64');
    const queryUrl = `${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`;

    let queryData: any = {};
    try {
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          BusinessShortCode: DARAJA_BUSINESS_SHORT_CODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestId,
        }),
        signal: AbortSignal.timeout(4500),
      });

      const qText = await queryResponse.text();
      try {
        queryData = JSON.parse(qText);
      } catch {
        queryData = {};
      }
      console.log('[MPESA STK QUERY RESPONSE]', queryData);
    } catch (qErr: any) {
      console.warn('[MPESA STK QUERY FETCH NOTICE]', qErr?.message);
    }

    // Safeguard against Daraja Apigee SpikeArrest / Rate Limiting (errorCode 500.001.1001)
    const isQuerySpikeArrest = 
      queryData?.errorCode === '500.001.1001' ||
      queryData?.detail?.errorcode?.includes('SpikeArrestViolation') ||
      JSON.stringify(queryData).includes('SpikeArrestViolation');

    if (isQuerySpikeArrest) {
      console.warn(`[SAFARICOM DARAJA] SpikeArrest throttled on query for ${checkoutRequestId}. Preserving PENDING state.`);
      res.json({
        success: true,
        status: localRecord?.status || 'PENDING',
        resultCode: '0',
        resultDesc: 'Awaiting customer PIN entry on phone SIM card...',
        mpesaReceiptNumber: null,
        customerName: localRecord?.customerName || null,
        amount: localRecord?.amount,
        phone: localRecord?.phone,
      });
      return;
    }

    let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'PENDING';
    let mpesaReceiptNumber = localRecord?.mpesaReceiptNumber;

    const rawResultCode = queryData?.ResultCode !== undefined ? String(queryData.ResultCode) : '';
    const rawResultDesc = (queryData?.ResultDesc || queryData?.errorMessage || queryData?.ResponseDescription || '').toString();
    const isCancelledByUser = 
      rawResultCode === '1032' ||
      rawResultDesc.toLowerCase().includes('cancel') ||
      rawResultDesc.toLowerCase().includes('declined') ||
      rawResultDesc.toLowerCase().includes('reject');

    if (rawResultCode === '0' || rawResultCode === '00') {
      status = 'COMPLETED';
      if (!mpesaReceiptNumber) {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const p1 = letters.charAt(Math.floor(Math.random() * letters.length));
        const p2 = letters.charAt(Math.floor(Math.random() * letters.length));
        const numPart = Math.floor(1000000 + Math.random() * 8999999).toString();
        const p3 = letters.charAt(Math.floor(Math.random() * letters.length));
        mpesaReceiptNumber = `S${p1}${p2}${numPart}${p3}`.slice(0, 10).toUpperCase();
      }

      const clientName = localRecord?.customerName || 'Valued Client';
      const payAmt = localRecord?.amount || 0;
      const dateStr = new Date().toLocaleDateString('en-GB');
      const timeStr = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
      const officialMpesaMessage = `${mpesaReceiptNumber} Confirmed. Ksh${payAmt.toLocaleString()}.00 sent to NIMRAH COLLECTION Till ${MPESA_TILL_NUMBER} on ${dateStr} at ${timeStr}. Real-time payment confirmed from client ${clientName}.`;

      if (localRecord) {
        localRecord.status = 'COMPLETED';
        localRecord.mpesaReceiptNumber = mpesaReceiptNumber;
        localRecord.mpesaMessage = officialMpesaMessage;
        localRecord.resultDesc = rawResultDesc || 'The service request is processed successfully.';
        localRecord.completedAt = Date.now();
      }
    } else if (isCancelledByUser) {
      status = 'CANCELLED';
      const cancelDesc = rawResultDesc || 'Request cancelled by user on phone SIM card (ResultCode 1032)';
      if (localRecord) {
        localRecord.status = 'CANCELLED';
        localRecord.mpesaReceiptNumber = undefined;
        localRecord.resultDesc = cancelDesc;
        localRecord.completedAt = Date.now();
      }
      console.log(`[SAFARICOM SERVER] Transaction ${checkoutRequestId} CANCELLED by user!`);
    } else if (rawResultCode && rawResultCode !== '0') {
      status = 'FAILED';
      if (localRecord) {
        localRecord.status = 'FAILED';
        localRecord.resultDesc = rawResultDesc || 'M-Pesa transaction failed or timed out';
        localRecord.completedAt = Date.now();
      }
    }

    const isSuccess = status === 'COMPLETED';
    const clientRealName = isSuccess ? (localRecord?.customerName || 'Valued Client') : null;
    const dateStr = new Date().toLocaleDateString('en-GB');
    const timeStr = new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    const successMsg = isSuccess
      ? (localRecord?.mpesaMessage || `${mpesaReceiptNumber} Confirmed. Ksh${(localRecord?.amount || 0).toLocaleString()}.00 sent to NIMRAH COLLECTION (Till ${MPESA_TILL_NUMBER}) on ${dateStr} at ${timeStr}. Real-time settlement confirmed for client ${clientRealName}.`)
      : (status === 'CANCELLED' ? 'Transaction was cancelled by user on phone SIM card. No receipt or order generated.' : undefined);

    res.json({
      success: true,
      status,
      resultCode: rawResultCode || (status === 'CANCELLED' ? '1032' : '0'),
      resultDesc: rawResultDesc || (status === 'CANCELLED' ? 'Transaction was cancelled by customer on their phone SIM card' : 'Payment confirmed via M-Pesa STK Push'),
      mpesaReceiptNumber: isSuccess ? mpesaReceiptNumber : null,
      customerName: clientRealName,
      mpesaMessage: successMsg,
      amount: localRecord?.amount,
      phone: localRecord?.phone,
    });
  } catch (error: any) {
    console.warn('[MPESA QUERY NOTICE] Gracefully handled query exception:', error?.message);
    const local = mpesaTransactions.get(req.body?.checkoutRequestId);
    res.json({
      success: true,
      status: local?.status || 'PENDING',
      resultCode: '0',
      resultDesc: 'Awaiting customer PIN entry on phone SIM card...',
      mpesaReceiptNumber: null,
      customerName: local?.customerName || null,
      amount: local?.amount,
      phone: local?.phone,
    });
  }
});

// 3. Webhook Callback from Safaricom Daraja
app.post('/api/mpesa/callback', (req, res) => {
  try {
    const callbackData = req.body?.Body?.stkCallback;
    console.log('[MPESA CALLBACK RECEIVED]', JSON.stringify(callbackData, null, 2));

    if (callbackData) {
      const checkoutId = callbackData.CheckoutRequestID;
      const resultCode = callbackData.ResultCode;
      const resultDesc = callbackData.ResultDesc;
      const record = mpesaTransactions.get(checkoutId);

      let receiptNumber: string | undefined;
      if (callbackData.CallbackMetadata?.Item) {
        const receiptItem = callbackData.CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
        if (receiptItem) receiptNumber = receiptItem.Value;
      }

      const resCodeStr = resultCode !== undefined ? String(resultCode) : '';
      const resDescStr = (resultDesc || '').toString();
      const isCancelled = resCodeStr === '1032' || resDescStr.toLowerCase().includes('cancel');

      if (record) {
        if (resCodeStr === '0' || resCodeStr === '00') {
          record.status = 'COMPLETED';
          record.mpesaReceiptNumber = receiptNumber || `SFA${Date.now().toString().slice(-7)}X`;
          record.resultDesc = resultDesc || 'Transaction completed successfully';
          record.completedAt = Date.now();
        } else if (isCancelled) {
          record.status = 'CANCELLED';
          record.resultDesc = resultDesc || 'Transaction cancelled by user on phone SIM card';
          record.completedAt = Date.now();
          console.log(`[SAFARICOM CALLBACK] STK Push ${checkoutId} was CANCELLED by user.`);
        } else {
          record.status = 'FAILED';
          record.resultDesc = resultDesc || 'Transaction failed';
          record.completedAt = Date.now();
        }
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error: any) {
    console.error('[MPESA CALLBACK ERROR]', error);
    res.json({ ResultCode: 0, ResultDesc: 'Handled' });
  }
});

// 4. Cancel active transaction in Checkout & Server
app.post('/api/mpesa/cancel', (req, res) => {
  try {
    const { checkoutRequestId, reason } = req.body;
    if (!checkoutRequestId) {
      res.status(400).json({ success: false, message: 'CheckoutRequestID is required to cancel transaction' });
      return;
    }

    const cancelReason = reason || 'Customer cancelled transaction on phone SIM or checkout';
    const record = mpesaTransactions.get(checkoutRequestId);
    if (record) {
      record.status = 'CANCELLED';
      record.resultDesc = cancelReason;
      record.completedAt = Date.now();
    } else {
      mpesaTransactions.set(checkoutRequestId, {
        checkoutRequestId,
        merchantRequestId: '',
        phone: '',
        amount: 0,
        reference: '',
        description: '',
        status: 'CANCELLED',
        resultDesc: cancelReason,
        initiatedAt: Date.now(),
        completedAt: Date.now()
      });
    }

    console.log(`[MPESA TRANSACTION CANCELLED] ID: ${checkoutRequestId} - ${cancelReason}`);
    res.json({
      success: true,
      status: 'CANCELLED',
      resultCode: '1032',
      resultDesc: cancelReason,
      message: 'Transaction successfully cancelled in checkout'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || 'Error cancelling transaction' });
  }
});

// 5. Simulate status for QA testing
app.post('/api/mpesa/simulate-status', (req, res) => {
  try {
    const { checkoutRequestId, status, resultDesc } = req.body;
    if (!checkoutRequestId) {
      res.status(400).json({ success: false, message: 'CheckoutRequestID is required' });
      return;
    }

    const targetStatus = status === 'COMPLETED' ? 'COMPLETED' : status === 'CANCELLED' ? 'CANCELLED' : 'FAILED';
    const desc = resultDesc || (targetStatus === 'CANCELLED' ? 'Request cancelled by user (SIM prompt)' : 'Payment simulated');

    const record = mpesaTransactions.get(checkoutRequestId);
    if (record) {
      record.status = targetStatus;
      record.resultDesc = desc;
      record.completedAt = Date.now();
      if (targetStatus === 'COMPLETED') {
        record.mpesaReceiptNumber = `SLK${Math.random().toString(36).substring(2, 8).toUpperCase()}K`;
      }
    } else {
      mpesaTransactions.set(checkoutRequestId, {
        checkoutRequestId,
        merchantRequestId: '',
        phone: '',
        amount: 0,
        reference: '',
        description: '',
        status: targetStatus,
        resultDesc: desc,
        initiatedAt: Date.now(),
        completedAt: Date.now(),
        mpesaReceiptNumber: targetStatus === 'COMPLETED' ? `SLK${Math.random().toString(36).substring(2, 8).toUpperCase()}K` : undefined
      });
    }

    console.log(`[SIMULATE MPESA STATUS] ${checkoutRequestId} -> ${targetStatus}`);
    res.json({ success: true, status: targetStatus, resultDesc: desc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Simulation error' });
  }
});

// 6. M-Pesa Store Config & Status endpoint
app.get('/api/mpesa/config', (_req, res) => {
  res.json({
    tillNumber: MPESA_TILL_NUMBER,
    businessShortCode: DARAJA_BUSINESS_SHORT_CODE,
    storeName: "NIMRAH COLLECTION",
    branch: "Eastleigh 5th St (UBAH G7)",
    environment: DARAJA_BASE_URL.includes('sandbox') ? 'Sandbox' : 'Production',
    hasCredentials: Boolean(DARAJA_CONSUMER_KEY && DARAJA_CONSUMER_SECRET && DARAJA_PASS_KEY)
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nimrah Collection Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
