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
import { googleSignIn, logoutGoogle, initAuth } from '../services/googleAuth';
import { type User as FirebaseUser } from 'firebase/auth';

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
  const [email, setEmail] = useState('dibakarim307@gmail.com');
  const [name, setName] = useState('Diba Karim (Shop Owner)');
  const [password, setPassword] = useState('Nimrah@2026');
  const [showPassword, setShowPassword] = useState(false);
  
  // Google OAuth / Gmail State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Custom destination email support
  const [customDeliveryEmailEnabled, setCustomDeliveryEmailEnabled] = useState(false);
  const [destinationEmail, setDestinationEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newDestinationEmailInput, setNewDestinationEmailInput] = useState('');
  
  // Verification code stage (Code is kept strictly confidential on server)
  const [tempSessionId, setTempSessionId] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [dispatchedEmail, setDispatchedEmail] = useState('');
  
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

  // Google / Gmail Auth state synchronization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        if (user.email) {
          setEmail(user.email);
          if (user.displayName) setName(user.displayName);
        }
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleConnect = async () => {
    setIsGoogleSigningIn(true);
    setErrorMessage('');
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        if (res.user.email) {
          setEmail(res.user.email);
          if (res.user.displayName) setName(res.user.displayName);
        }
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage(err?.message || 'Failed to authenticate with Google');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

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
        body: JSON.stringify({ 
          email, 
          destinationEmail: (customDeliveryEmailEnabled && destinationEmail.trim()) ? destinationEmail.trim() : email,
          name, 
          password,
          requestedRole: portalMode,
          gmailToken: googleAccessToken || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTempSessionId(data.tempSessionId);
        setDispatchedEmail(data.destinationEmail || data.email);
        setDeliveryMethod(data.deliveryMethod || 'Email Dispatched');
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

  const handleChangeDestinationEmail = async () => {
    if (!newDestinationEmailInput.trim() || !tempSessionId) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/pos/auth/change-otp-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempSessionId,
          newDestinationEmail: newDestinationEmailInput.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDispatchedEmail(data.destinationEmail);
        setDeliveryMethod(data.deliveryMethod || 'Email Sent');
        setIsChangingEmail(false);
        setNewDestinationEmailInput('');
        setResendCooldown(45);
      } else {
        setErrorMessage(data.message || 'Failed to re-route OTP code.');
      }
    } catch {
      setErrorMessage('Network error while re-routing OTP.');
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

            {/* Option to send OTP to any custom email account */}
            <div className="pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={customDeliveryEmailEnabled}
                  onChange={(e) => {
                    setCustomDeliveryEmailEnabled(e.target.checked);
                    if (e.target.checked && !destinationEmail) {
                      setDestinationEmail(email);
                    }
                  }}
                  className="rounded border-stone-700 bg-[#16161c] text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4"
                />
                <span className="font-medium text-[11px] text-amber-200">
                  Send OTP to a separate personal/destination email account
                </span>
              </label>

              {customDeliveryEmailEnabled && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#14141d] border border-amber-500/40 space-y-1 animate-in fade-in">
                  <label className="block text-[11px] font-mono text-amber-300 font-semibold">
                    Destination Email Account (Where OTP will be received) *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-400" />
                    <input
                      type="email"
                      required={customDeliveryEmailEnabled}
                      placeholder="e.g. dibakarim307@gmail.com or personal inbox"
                      value={destinationEmail}
                      onChange={(e) => setDestinationEmail(e.target.value)}
                      className="w-full text-xs font-mono pl-9 pr-3 py-2 bg-[#0c0c10] border border-stone-700 rounded-lg text-white placeholder:text-stone-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <p className="text-[10px] text-stone-400">
                    The 6-digit verification code will be dispatched directly to this inbox.
                  </p>
                </div>
              )}
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

            {/* Google Workspace / Gmail Integration Connect Banner */}
            <div className="p-3 bg-[#13131c] rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <div className="text-xs">
                  {googleUser ? (
                    <div>
                      <div className="text-white font-semibold flex items-center gap-1.5">
                        <span>Connected to Gmail</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono truncate max-w-[200px]">{googleUser.email}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-white font-semibold">Connect Official Gmail Account</div>
                      <div className="text-[10px] text-stone-400">Directly authenticate &amp; dispatch OTPs via Gmail</div>
                    </div>
                  )}
                </div>
              </div>

              {googleUser ? (
                <button
                  type="button"
                  onClick={logoutGoogle}
                  className="px-2.5 py-1 text-[11px] text-stone-400 hover:text-white bg-stone-800 rounded-lg cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={isGoogleSigningIn}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-white text-stone-900 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleSigningIn ? 'Connecting...' : 'Sign in with Google'}
                </button>
              )}
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
              <span>{isLoading ? 'Sending Security Code...' : `Send OTP to Email Account & Authorize`}</span>
            </button>
          </form>
        )}

        {/* STEP 2: EMAIL VERIFICATION CODE (OTP) */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* Real Email Dispatch Delivery Card */}
            <div className="bg-[#14141d] p-4 sm:p-5 rounded-2xl border border-amber-500/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Security OTP Code Dispatched</span>
                </span>
                <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border border-amber-400/40">
                  {deliveryMethod || 'Email Sent'}
                </span>
              </div>

              <div className="text-xs text-stone-200">
                Recipient Email Account: <strong className="text-white font-mono">{dispatchedEmail}</strong>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed font-light">
                Please check your email inbox (and Spam/Junk folder) for the message titled: <strong className="text-stone-300 font-mono">[Nimrah Collection POS] Security Verification Code</strong>.
              </p>

              {/* Action shortcuts */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href="https://mail.google.com/mail/u/0/#search/Nimrah+Collection+POS"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Open Gmail Inbox ↗</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsChangingEmail(!isChangingEmail)}
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl border border-stone-700 transition-colors cursor-pointer"
                >
                  {isChangingEmail ? 'Cancel' : 'Send to another email account'}
                </button>
              </div>

              {/* Inline Change Email Account Drawer */}
              {isChangingEmail && (
                <div className="p-3 bg-stone-900 border border-stone-700 rounded-xl space-y-2 text-xs animate-in fade-in">
                  <label className="block text-stone-300 font-mono text-[11px]">
                    Enter new recipient email address:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newDestinationEmailInput}
                      onChange={(e) => setNewDestinationEmailInput(e.target.value)}
                      placeholder="e.g. dibakarim307@gmail.com"
                      className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-amber-400 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isLoading || !newDestinationEmailInput.trim()}
                      onClick={handleChangeDestinationEmail}
                      className="px-3 py-1.5 bg-amber-400 disabled:opacity-50 text-stone-950 font-bold rounded-lg text-xs hover:bg-amber-300 cursor-pointer"
                    >
                      Resend
                    </button>
                  </div>
                </div>
              )}

              {/* Confidential Security Guarantee */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[10px] text-amber-300">Confidentiality Enforced: OTP sent exclusively to email account</span>
                </div>
                <span className="text-[10px] font-mono text-stone-500">Single-Use (10m)</span>
              </div>
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
