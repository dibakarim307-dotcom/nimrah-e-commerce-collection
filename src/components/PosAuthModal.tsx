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
  EyeOff
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PosStaffUser } from '../types';

interface PosAuthModalProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PosAuthModal: React.FC<PosAuthModalProps> = ({ onSuccess, onCancel }) => {
  const { settings, loginPosStaff, setActiveView } = useStore();

  const [step, setStep] = useState<'credentials' | 'verify'>('credentials');
  
  // Credentials
  const [email, setEmail] = useState('dibakarim307@gmail.com');
  const [name, setName] = useState('Diba Karim');
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

  // Quick staff presets for testing convenience
  const staffPresets = [
    {
      name: "Diba Karim",
      email: "dibakarim307@gmail.com",
      role: "Store Director",
      password: "Nimrah@2026"
    },
    {
      name: "Nimrah Admin",
      email: "nimrahcollection1@gmail.com",
      role: "Store Director",
      password: "Nimrah@2026"
    },
    {
      name: "Fatuma K.",
      email: "fatuma.eastleigh@nimrahcollection.co.ke",
      role: "Lead Cashier",
      password: "Eastleigh#G7"
    },
    {
      name: "Zainab Omar",
      email: "zainab.supervisor@nimrahcollection.co.ke",
      role: "Supervisor",
      password: "UbahShop#G7"
    }
  ];

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSelectPreset = (p: typeof staffPresets[0]) => {
    setEmail(p.email);
    setName(p.name);
    setPassword(p.password);
    setErrorMessage('');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both authorized staff email and password.');
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
      // Pasting full 6-digit code
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
        body: JSON.stringify({
          tempSessionId,
          code: fullCode
        })
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

      <div className="relative z-10 w-full max-w-md bg-[#0f0f14] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black space-y-6">
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
          <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300/80">
            POS Terminal · Restricted Access
          </div>
          <p className="text-[11px] text-stone-400 font-light">
            {settings.storeAddress}
          </p>
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
                Authorized Staff Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input 
                  type="email"
                  required
                  placeholder="e.g. dibakarim307@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-mono pl-9 pr-3 py-2.5 bg-[#17171e] border border-stone-800 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-stone-300">
                Personnel Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input 
                  type="text"
                  required
                  placeholder="e.g. Diba Karim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#17171e] border border-stone-800 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-stone-300">
                Register Security Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-mono pl-9 pr-10 py-2.5 bg-[#17171e] border border-stone-800 rounded-xl text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-500 hover:text-stone-300 text-xs cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Fill Authorized Staff Selector */}
            <div className="bg-[#141419] p-3 rounded-2xl border border-stone-800/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-stone-400 block tracking-wider font-semibold">
                Authorized Personnel Directory:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {staffPresets.map((st) => (
                  <button
                    key={st.email}
                    type="button"
                    onClick={() => handleSelectPreset(st)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      email.toLowerCase() === st.email.toLowerCase()
                        ? 'bg-amber-950/80 border-amber-400/70 text-amber-200 shadow-xs'
                        : 'bg-[#1b1b22] border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate text-white">{st.name}</div>
                    <div className="text-[9px] text-amber-400/90 font-mono">{st.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In & Request Email Code'}</span>
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
                  <span>Incoming Verification Email</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  SENT
                </span>
              </div>

              <div className="text-xs text-stone-200">
                To: <strong className="text-white font-mono">{dispatchedEmail}</strong>
              </div>
              <div className="text-[11px] text-stone-300 italic">
                "Your Nimrah Collection POS Register One-Time Code is: <strong className="font-mono text-amber-300 text-sm">{receivedEmailCode}</strong>"
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
                Enter 6-Digit Email Code
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
              className="w-full py-3.5 px-4 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-xl transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Security Token...' : 'Unlock POS Register Terminal'}</span>
            </button>

            {/* Resend & Back actions */}
            <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change Email / Account</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendCode}
                className="text-amber-400 hover:text-amber-300 disabled:text-stone-600 font-medium cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Back to Storefront Link */}
        <div className="pt-2 border-t border-stone-800 text-center">
          <button
            type="button"
            onClick={() => {
              if (onCancel) onCancel();
              else setActiveView('storefront');
            }}
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
          >
            ← Return to Nimrah Collection Storefront
          </button>
        </div>
      </div>
    </div>
  );
};
