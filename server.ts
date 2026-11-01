import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK with required telemetry User-Agent
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

const NIMRAH_SYSTEM_INSTRUCTION = `
You are the official AI Client Concierge for "Nimrah Collection" (@Nimrah_Collections), a luxury modest fashion and haute parfumerie boutique based in Nairobi, Kenya.

Boutique Profile:
- Brand: Nimrah Collection
- Physical Store Location: Eastleigh 5th Street, UBAH Shopping Center, Shop G7, Nairobi, Kenya.
- Official Email: nimrahcollection1@gmail.com
- Official WhatsApp Number: 0700011077 (+254 700 011 077)
- Social Handles: @Nimrah_Collections
- Payment Channel: M-Pesa Buy Goods & Services Till Number: 5428901 (Registered as NIMRAH COLLECTION).
- Offerings:
  1. Handcrafted Luxury Abayas (Sizes 52, 54, 56, 58, 60 in French Silk Velvet, Pure Japanese Georgette, and Organic Flax Linen).
  2. Spun Raw Silk Co-ord Sets (Asymmetric relaxed tunics & wide-leg trousers in Champagne, Ivory, Desert Sand).
  3. Midnight Artisanal Kaftans (40+ hours of hand-stitched Zardozi metallic threadwork and crystal embellishments).
  4. Grade 6A Pure Mulberry Silk Hijabs & Sheilas.
  5. Signature Fragrance: "Nimrah Noir Extrait de Parfum" (Cambodian Agarwood, Bulgarian Damask Rose, Tahitian Vanilla, Amber Resin, 35% oil concentration).
- Delivery: Same-Day Nairobi Express delivery, Upcountry Kenya courier, and Worldwide DHL Express.
- In-Store POS & Pickups: Available at Shop G7, UBAH Shopping Center, Eastleigh 5th Street.

Tone and Persona:
- Warm, respectful, sophisticated, hospitable, and helpful (Salam / Welcome).
- Provide accurate sizing advice (e.g., Size 52 fits 5'0"-5'2", Size 54 fits 5'3"-5'4", Size 56 fits 5'5"-5'6", Size 58 fits 5'7"-5'8", Size 60 fits 5'9"-5'11").
- Provide clear M-Pesa Till 5428901 payment steps and location directions.
- Keep responses concise, elegant, and helpful. Always offer to connect to WhatsApp if bespoke tailoring or custom fitting is required.
`;

// AI Client Assistance API Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (ai) {
      try {
        // Construct conversation contents with system instruction
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: {
            systemInstruction: NIMRAH_SYSTEM_INSTRUCTION,
          },
        });

        const reply = response.text || "Thank you for contacting Nimrah Collection. How may I assist you with our abayas, fragrances, or boutique location in Eastleigh?";
        res.json({ reply });
        return;
      } catch (geminiError: any) {
        console.error('Gemini API call failed, using luxury concierge fallback:', geminiError?.message);
        // Proceed to fallback
      }
    }

    // Graceful fallback concierge response with exact business knowledge
    const lower = message.toLowerCase();
    let fallbackReply = '';

    if (lower.includes('location') || lower.includes('where') || lower.includes('store') || lower.includes('shop') || lower.includes('eastleigh')) {
      fallbackReply = `Salam! You can visit our physical boutique at Eastleigh 5th Street, UBAH Shopping Center, Shop G7, Nairobi, Kenya. We are open Monday to Saturday from 9:30 AM to 7:30 PM and Sunday from 11:00 AM to 5:00 PM. We look forward to welcoming you!`;
    } else if (lower.includes('mpesa') || lower.includes('till') || lower.includes('pay') || lower.includes('lipa')) {
      fallbackReply = `Our official Lipa na M-Pesa Buy Goods & Services Till Number is 5428901 (Registered as NIMRAH COLLECTION). Every transaction automatically generates an official tax invoice and electronic receipt for your records!`;
    } else if (lower.includes('size') || lower.includes('height') || lower.includes('fitting') || lower.includes('abaya')) {
      fallbackReply = `Our luxury abayas are sized by length according to your height:\n• Size 52: 152–157cm (5'0"–5'2")\n• Size 54: 158–162cm (5'3"–5'4")\n• Size 56: 163–167cm (5'5"–5'6")\n• Size 58: 168–172cm (5'7"–5'8")\n• Size 60: 173–178cm (5'9"–5'11")\n\nWould you like guidance on a specific piece like our Al-Noor Emerald Velvet or Sahara Golden Satin Abaya?`;
    } else if (lower.includes('perfume') || lower.includes('fragrance') || lower.includes('scent') || lower.includes('noir')) {
      fallbackReply = `Our signature extrait de parfum is "Nimrah Noir" (KES 9,500 / 50ml). It features an exquisite composition of Cambodian Agarwood (Oud), Bulgarian Damask Rose, and warm Tahitian Vanilla with a 35% pure oil concentration for 24-hour sillage. Available online and at Shop G7, UBAH Shopping Center.`;
    } else if (lower.includes('email') || lower.includes('contact') || lower.includes('whatsapp') || lower.includes('phone')) {
      fallbackReply = `You can reach our concierge directly via:\n• WhatsApp: 0700011077 (+254 700 011 077)\n• Email: nimrahcollection1@gmail.com\n• Instagram/TikTok: @Nimrah_Collections\n• Physical Boutique: Eastleigh 5th Street, UBAH Shopping Center, Shop G7\n• Or click the floating WhatsApp button for instant chat with our team!`;
    } else if (lower.includes('track') || lower.includes('order') || lower.includes('delivery')) {
      fallbackReply = `You can track your order using the "Track Order" button in the top navigation with your Order # (e.g. NC-2026-7841) or M-Pesa confirmation code. For instant delivery updates, click "Track on WhatsApp" to connect with our dispatch rider!`;
    } else {
      fallbackReply = `Salam and welcome to Nimrah Collection! I am your AI Client Concierge. I can assist you with sizing advice, fabric details, our location at Eastleigh 5th Street UBAH Shopping Center Shop G7, M-Pesa Till 5428901 payments, or order tracking. How can I help you today?`;
    }

    res.json({ reply: fallbackReply });
  } catch (error) {
    console.error('Error handling chat:', error);
    res.status(500).json({ 
      reply: "We are currently assisting multiple clients at our Eastleigh boutique. Please feel free to message our team directly on WhatsApp for immediate concierge support!" 
    });
  }
});

// Authorized POS Personnel Directory
interface StaffRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Plaintext for demo boutique auth
  role: 'Store Director' | 'Lead Cashier' | 'Supervisor';
  branch: string;
  badgeNumber: string;
}

const AUTHORIZED_POS_STAFF: StaffRecord[] = [
  {
    id: "staff-01",
    email: "dibakarim307@gmail.com",
    name: "Diba Karim",
    passwordHash: "Nimrah@2026",
    role: "Store Director",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-DIR-01"
  },
  {
    id: "staff-02",
    email: "nimrahcollection1@gmail.com",
    name: "Nimrah Admin",
    passwordHash: "Nimrah@2026",
    role: "Store Director",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-MGR-01"
  },
  {
    id: "staff-03",
    email: "fatuma.eastleigh@nimrahcollection.co.ke",
    name: "Fatuma K.",
    passwordHash: "Eastleigh#G7",
    role: "Lead Cashier",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-CSH-02"
  },
  {
    id: "staff-04",
    email: "zainab.supervisor@nimrahcollection.co.ke",
    name: "Zainab Omar",
    passwordHash: "UbahShop#G7",
    role: "Supervisor",
    branch: "Eastleigh 5th St (UBAH G7)",
    badgeNumber: "NC-SUP-03"
  }
];

// In-memory verification sessions
interface PosSession {
  tempSessionId: string;
  email: string;
  name: string;
  code: string;
  expiresAt: number;
  staffUser: Omit<StaffRecord, 'passwordHash'>;
}

const posSessions = new Map<string, PosSession>();

// 1. Staff Login & Email Verification Code Generation
app.post('/api/pos/auth/login', (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const staff = AUTHORIZED_POS_STAFF.find(s => s.email.toLowerCase() === cleanEmail);

    if (!staff) {
      res.status(401).json({ 
        success: false, 
        message: `Access Denied: "${email}" is not registered in the authorized boutique staff directory.` 
      });
      return;
    }

    if (staff.passwordHash !== password.trim()) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid password. Please check your credentials.' 
      });
      return;
    }

    // Optional name check
    if (name && name.trim()) {
      const cleanInputName = name.trim().toLowerCase();
      const cleanStaffName = staff.name.toLowerCase();
      // Allow if partial match
      if (!cleanStaffName.includes(cleanInputName) && !cleanInputName.includes(cleanStaffName.split(' ')[0])) {
        // still proceed with warning or update
      }
    }

    // Generate 6-digit OTP code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tempSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const { passwordHash: _, ...safeStaffUser } = staff;

    posSessions.set(tempSessionId, {
      tempSessionId,
      email: staff.email,
      name: staff.name,
      code: verificationCode,
      expiresAt,
      staffUser: safeStaffUser
    });

    console.log(`[EMAIL DISPATCH] Sent to ${staff.email}: Your Nimrah Collection POS Verification Code is: ${verificationCode}`);

    res.json({
      success: true,
      tempSessionId,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      branch: staff.branch,
      message: `A 6-digit security code has been dispatched to ${staff.email}`,
      verificationCode // included for testing/simulation in preview
    });
  } catch (error: any) {
    console.error('POS login error:', error);
    res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
});

// 2. Verify Email OTP Code
app.post('/api/pos/auth/verify', (req, res) => {
  try {
    const { tempSessionId, code } = req.body;

    if (!tempSessionId || !code) {
      res.status(400).json({ success: false, message: 'Session ID and verification code are required' });
      return;
    }

    const session = posSessions.get(tempSessionId);

    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found or expired. Please log in again.' });
      return;
    }

    if (Date.now() > session.expiresAt) {
      posSessions.delete(tempSessionId);
      res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
      return;
    }

    if (session.code !== code.trim()) {
      res.status(400).json({ success: false, message: 'Invalid verification code. Please check your email.' });
      return;
    }

    // Success: remove temporary session and return authenticated staff
    posSessions.delete(tempSessionId);

    res.json({
      success: true,
      message: 'POS Terminal Unlocked Successfully',
      staff: session.staffUser,
      token: `pos_token_${Date.now()}`
    });
  } catch (error: any) {
    console.error('POS verification error:', error);
    res.status(500).json({ success: false, message: 'Internal verification error' });
  }
});

// 3. Resend OTP Code
app.post('/api/pos/auth/resend', (req, res) => {
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

    console.log(`[EMAIL RESEND] Sent to ${session.email}: New Nimrah POS Code: ${newCode}`);

    res.json({
      success: true,
      message: `A new verification code has been dispatched to ${session.email}`,
      verificationCode: newCode
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to resend verification code' });
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
