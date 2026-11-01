import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  User, 
  Store as StoreIcon,
  Copy,
  Check,
  Eye,
  EyeOff,
  Crown,
  ShieldAlert
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PosStaffUser } from '../types';

interface PosAuthModalProps {
  initialRole?: 'owner' | 'admin';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PosAuthModal: React.FC<PosAuthModalProps> = ({ 
  initialRole = 'owner',
  onSuccess, 
  onCancel 
}) => {
  const { settings, loginPosStaff, setActiveView } = useStore();

  const [portalMode, setPortalMode] = useState<'owner' | 'admin'>(initialRole);
  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');
  
  // Credentials
  const [email, setEmail] = useState('nimrahcollection1@gmail.com');
  const [name, setName] = useState('Nimrah (Proprietor)');
  const [password, setPassword] = useState('Nimrah@2026');
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification code stage
  const [tempSessionId, setTempSessionId] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [dispatchedEmail, setDispatchedEmail] = useState('');
  const [receivedEmailCode, setReceivedEmailCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Status & error handling
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Shop Owner presets
  const ownerPresets = [
    {
      name: "Nimrah (Proprietor)",
      email: "nimrahcollection1@gmail.com",
      role: "Shop Owner" as const,
      password: "Nimrah@2026",
      desc: "Primary Boutique Proprietor & Account Holder"
    },
    {
      name: "Diba Karim (Shop Owner)",
      email: "dibakarim307@gmail.com",
      role: "Shop Owner" as const,
      password: "Nimrah@2026",
      desc: "Executive Partner & Financial Director"
    }
  ];

  // Admin presets
  const adminPresets = [
    {
      name: "Store Administrator",
      email: "admin@nimrahcollection.co.ke",
      role: "System Admin" as const,
      password: "Admin@2026",
      desc: "Operations & Inventory Supervisor"
    },
    {
      name: "Fatuma K. (Lead Cashier)",
      email: "fatuma.eastleigh@nimrahcollection.co.ke",
      role: "Lead Cashier" as const,
      password: "Eastleigh#G7",
      desc: "Eastleigh Shop G7 Terminal Cashier"
    }
  ];

  const handlePortalSwitch = (mode: 'owner' | 'admin') => {
    setPortalMode(mode);
    setErrorMessage('');
    if (mode === 'owner') {
      setEmail(ownerPresets[0].email);
      setName(ownerPresets[0].name);
      setPassword(ownerPresets[0].password);
    } else {
      setEmail(adminPresets[0].email);
      setName(adminPresets[0].name);
      setPassword(adminPresets[0].password);
    }
  };

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSelectPreset = (p: typeof ownerPresets[0] | typeof adminPresets[0]) => {
    setEmail(p.email);
    setName(p.name);
    setPassword(p.password);
    setErrorMessage('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both authorized personnel email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/pos/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTempSessionId(data.tempSessionId);
        setDispatchedEmail(data.email);
        setReceivedEmailCode(data.verificationCode);
        setStep('verify');
        setResendCooldown(45);
      } else {
        setErrorMessage(data.message || 'Access denied. You must be an authorized personnel.');
      }
    } catch (err) {
      console.error('POS login network error:', err);
      setErrorMessage('Could not connect to authentication server. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const clean = value.replace(/[^0-9]/g, '').slice(0, 6);
      if (clean.length === 6) {
        setCodeDigits(clean.split(''));
        document.getElementById(`otp-input-5`)?.focus();
        return;
      }
    }

    const digit = value.slice(-1).replace(/[^0-9]/g, '');
    const newDigits = [...codeDigits];
    newDigits[index] = digit;
    setCodeDigits(newDigits);

    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleAutoFillCode = () => {
    if (receivedEmailCode) {
      setCodeDigits(receivedEmailCode.split(''));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const fullCode = codeDigits.join('');

    if (fullCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit code sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/pos/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempSessionId, code: fullCode })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        loginPosStaff(data.staff);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.message || 'Invalid or expired code. Please check your email.');
      }
    } catch (err) {
      setErrorMessage('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || !tempSessionId) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/pos/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempSessionId })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setReceivedEmailCode(data.verificationCode);
        setResendCooldown(45);
      } else {
        setErrorMessage(data.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      setErrorMessage('Network error while resending verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-stone-100 flex flex-col justify-center items-center p-4 selection:bg-amber-400 selection:text-stone-950">
      {/* Background ambient gold gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-black to-black opacity-80" />

      <div className="relative z-10 w-full max-w-lg bg-[#0f0f14] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black space-y-6">
        {/* Boutique Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto rounded-full border-2 border-amber-400/80 p-0.5 shadow-xl bg-black overflow-hidden">
            <img 
              src={settings.brandLogoUrl} 
              alt="Nimrah Collection" 
              className="w-full h-full object-cover object-center scale-[2.2] rounded-full"
            />
          </div>

          <h2 className="font-serif text-2xl font-bold tracking-tight text-gold-gradient">
            {settings.storeName}
          </h2>
          <p className="text-[11px] text-stone-400 font-light">
            {settings.storeAddress}
          </p>
        </div>

        {/* ROLE SELECTION TABS: SHOP OWNER vs ADMIN */}
        {step === 'credentials' && (
          <div className="grid grid-cols-2 gap-2 bg-[#14141c] p-1.5 rounded-2xl border border-stone-800">
            <button
              type="button"
              onClick={() => handlePortalSwitch('owner')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                portalMode === 'owner'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 shadow-lg shadow-amber-950/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
                <Crown className="w-3.5 h-3.5" />
                <span>Shop Owner</span>
              </div>
              <span className={`text-[10px] font-normal ${portalMode === 'owner' ? 'text-stone-900' : 'text-stone-500'}`}>
                Full Financial &amp; P&amp;L Control
              </span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('admin')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                portalMode === 'admin'
                  ? 'bg-gradient-to-r from-stone-200 to-white text-stone-950 shadow-lg'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>System Admin</span>
              </div>
              <span className={`text-[10px] font-normal ${portalMode === 'admin' ? 'text-stone-900' : 'text-stone-500'}`}>
                Operations &amp; Register Terminal
              </span>
            </button>
          </div>
        )}

        {/* Security Scope Description */}
        <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
          portalMode === 'owner'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-stone-800/60 border-stone-700 text-stone-300'
        }`}>
          {portalMode === 'owner' ? (
            <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
          )}
          <div className="text-[11px] leading-relaxed">
            {portalMode === 'owner' ? (
              <span><strong>Shop Owner Clearance:</strong> Grants unrestricted sovereignty over gross profit calculations, live M-Pesa Till 5428901 settlement tracking, cost margins, wholesale price overrides, and staff authorization directory.</span>
            ) : (
              <span><strong>System Admin Clearance:</strong> Grants operational terminal access for barcode sales, rapid stock quantity adjustments, shift closures, receipt printing, and order refunds. Confidential profit margins remain hidden.</span>
            )}
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="bg-rose-950/70 border border-rose-600/60 p-3 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1 text-[11px] leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* STEP 1: PERSONNEL CREDENTIALS */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-stone-300">
                {portalMode === 'owner' ? 'Shop Owner Email *' : 'System Admin Email *'}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-3 ${portalMode === 'owner' ? 'text-amber-400' : 'text-stone-300'}`} />
                <input 
                  type="email"
                  required
                  placeholder={portalMode === 'owner' ? "e.g. nimrahcollection1@gmail.com" : "e.g. admin@nimrahcollection.co.ke"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-mono pl-9 pr-3 py-2.5 bg-[#17171e] border border-stone-800 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-stone-300">
                Authorized Personnel Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  required
                  placeholder="e.g. Nimrah (Proprietor)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#17171e] border border-stone-800 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-stone-300">
                Security Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-mono pl-9 pr-10 py-2.5 bg-[#17171e] border border-stone-800 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-500 hover:text-stone-300 text-xs cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Presets for Demo & Testing */}
            <div className="pt-1">
              <div className="text-[10px] font-mono uppercase text-stone-500 mb-1.5 flex items-center justify-between">
                <span>Authorized {portalMode === 'owner' ? 'Shop Owner' : 'Admin'} Accounts:</span>
                <span className="text-amber-400/80">Click to autofill</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(portalMode === 'owner' ? ownerPresets : adminPresets).map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      email === p.email 
                        ? 'bg-amber-400/10 border-amber-400/70 text-amber-200' 
                        : 'bg-[#14141a] border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-white flex items-center gap-1">
                      {p.role === 'Shop Owner' ? <Crown className="w-3 h-3 text-amber-400" /> : <ShieldCheck className="w-3 h-3 text-stone-300" />}
                      <span className="truncate">{p.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-stone-400 truncate">{p.email}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'owner'
                  ? 'text-stone-950 bg-amber-400 hover:bg-amber-300 shadow-amber-950/40'
                  : 'text-stone-950 bg-stone-200 hover:bg-white shadow-stone-950/40'
              } disabled:opacity-50`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Identity...' : `Sign In as ${portalMode === 'owner' ? 'Shop Owner' : 'Admin'} & Request Code`}</span>
            </button>
          </form>
        )}

        {/* STEP 2: EMAIL VERIFICATION CODE (OTP) */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Simulation Notification Preview of the incoming email */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-black p-4 rounded-2xl border border-emerald-500/40 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Incoming Security Email</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  SENT
                </span>
              </div>

              <div className="text-xs text-stone-200">
                To: <strong className="text-white font-mono">{dispatchedEmail}</strong>
              </div>
              <div className="text-[11px] text-stone-300 italic">
                "Your Nimrah Collection POS One-Time Code is: <strong className="font-mono text-amber-300 text-sm">{receivedEmailCode}</strong>"
              </div>

              {receivedEmailCode && (
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFillCode}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Auto-Fill {receivedEmailCode}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(receivedEmailCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-black/40 hover:bg-black/60 text-emerald-200 text-[11px] rounded-lg border border-emerald-500/30 flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6-box OTP Input */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-center text-stone-300">
                Enter 6-Digit Email Code Sent to {dispatchedEmail}
              </label>

              <div className="flex justify-center gap-2 sm:gap-2.5">
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono bg-[#16161c] border border-amber-500/30 rounded-xl text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all shadow-inner"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || codeDigits.join('').length !== 6}
              className={`w-full py-3.5 px-4 text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                portalMode === 'owner'
                  ? 'text-stone-950 bg-amber-400 hover:bg-amber-300 shadow-amber-950/40'
                  : 'text-stone-950 bg-stone-200 hover:bg-white shadow-stone-950/40'
              } disabled:opacity-40`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Security Token...' : `Unlock ${portalMode === 'owner' ? 'Shop Owner' : 'Admin'} POS Register`}</span>
            </button>

            {/* Resend & Back actions */}
            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change Email / Role</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendCode}
                className="text-amber-400 hover:text-amber-300 disabled:text-stone-600 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Back to Storefront */}
        <div className="pt-2 border-t border-stone-800/80 text-center">
          <button
            type="button"
            onClick={onCancel || (() => setActiveView('storefront'))}
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
          >
            ← Return to Online Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
