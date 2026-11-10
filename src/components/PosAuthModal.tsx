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
  Check, 
  Eye, 
  EyeOff, 
  Crown,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PosStaffUser } from '../types';
import { googleSignIn, initAuth } from '../services/googleAuth';
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
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'credentials' | 'verify' | 'set_pin'>('credentials');
  
  // Credentials
  const [name, setName] = useState('Diba Karim (Shop Owner)');
  const [email, setEmail] = useState('dibakarim307@gmail.com');
  const [password, setPassword] = useState('Nimrah@2026');
  const [showPassword, setShowPassword] = useState(false);
  
  // Post-OTP PIN Setup (Sign Up Step 3)
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [verifiedInfo, setVerifiedInfo] = useState<{ name: string; email: string; role: string } | null>(null);

  // Google OAuth State
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // OTP Verification state (during signup)
  const [tempSessionId, setTempSessionId] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [dispatchedEmail, setDispatchedEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  
  // Status & error handling
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Presets for fast 1-tap testing on laptops, tablets, and phones
  const ownerPresets = [
    {
      name: "Diba Karim (Shop Owner)",
      email: "dibakarim307@gmail.com",
      role: "Shop Owner" as const,
      pin: "Nimrah@2026",
      desc: "Executive Partner & Financial Director"
    },
    {
      name: "Nimrah (Proprietor)",
      email: "nimrahcollection1@gmail.com",
      role: "Shop Owner" as const,
      pin: "Nimrah@2026",
      desc: "Primary Boutique Proprietor"
    }
  ];

  const adminPresets = [
    {
      name: "Store Administrator",
      email: "admin@nimrahcollection.co.ke",
      role: "System Admin" as const,
      pin: "Admin@2026",
      desc: "Operations & Inventory Supervisor"
    },
    {
      name: "Fatuma K. (Lead Cashier)",
      email: "fatuma.eastleigh@nimrahcollection.co.ke",
      role: "Lead Cashier" as const,
      pin: "Eastleigh#G7",
      desc: "Eastleigh Shop G7 Terminal Cashier"
    }
  ];

  const handlePortalSwitch = (mode: 'owner' | 'admin') => {
    setPortalMode(mode);
    setErrorMessage('');
    if (mode === 'owner') {
      setName(ownerPresets[0].name);
      setEmail(ownerPresets[0].email);
      setPassword(ownerPresets[0].pin);
    } else {
      setName(adminPresets[0].name);
      setEmail(adminPresets[0].email);
      setPassword(adminPresets[0].pin);
    }
  };

  const handleSelectPreset = (p: typeof ownerPresets[0] | typeof adminPresets[0]) => {
    setName(p.name);
    setEmail(p.email);
    setPassword(p.pin);
    setErrorMessage('');
  };

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Google Auth sync
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

  // 1. Direct Log In: "during log in let them put correct pin and name"
  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!name.trim()) {
      setErrorMessage('Please enter your authorized personnel Name.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your authorized security PIN.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/pos/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          pin: password.trim(),
          requestedRole: portalMode
        })
      });

      const data = await response.json();
      if (response.ok && data.success && data.staff) {
        loginPosStaff(data.staff);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.message || 'Incorrect Name or PIN. Please verify your credentials or click Sign Up.');
      }
    } catch {
      setErrorMessage('Network connection error during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Sign Up With OTP: "during sign up let the pos owner and admin recieve otp to their email"
  const handleSignupWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!name.trim()) {
      setErrorMessage('Please provide your full legal name.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please provide your official email address to receive the verification OTP.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/pos/auth/signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          requestedRole: portalMode,
          gmailToken: googleAccessToken || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTempSessionId(data.tempSessionId);
        setDispatchedEmail(data.email);
        setDeliveryMethod(data.deliveryMethod || 'Email Sent');
        setStep('verify');
        setResendCooldown(45);
        setCodeDigits(['', '', '', '', '', '']);
      } else {
        setErrorMessage(data.message || 'Failed to dispatch verification code to email.');
      }
    } catch {
      setErrorMessage('Network error while requesting verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify Email OTP during Sign Up
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const fullCode = codeDigits.join('');

    if (fullCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code from your email.');
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
        if (data.requiresPinSetup) {
          // Advance to Step 3: Set Security PIN
          setVerifiedInfo({
            name: data.name || name,
            email: data.email || dispatchedEmail,
            role: data.role || (portalMode === 'owner' ? 'Shop Owner' : 'System Admin')
          });
          setStep('set_pin');
          setSuccessNotice(data.message || 'Email verified successfully! Now create your security PIN.');
          setNewPin('');
          setConfirmPin('');
        } else if (data.staff) {
          loginPosStaff(data.staff);
          if (onSuccess) onSuccess();
        }
      } else {
        setErrorMessage(data.message || 'Invalid or expired verification code. Please check your email inbox.');
      }
    } catch {
      setErrorMessage('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Set Security PIN & Unlock POS Terminal (Sign Up Step 3)
  const handleSetSecurityPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!newPin.trim()) {
      setErrorMessage('Please enter a security PIN (at least 4 characters).');
      return;
    }

    if (newPin.trim().length < 4) {
      setErrorMessage('Security PIN must be at least 4 digits or characters.');
      return;
    }

    if (confirmPin && newPin.trim() !== confirmPin.trim()) {
      setErrorMessage('The confirmation PIN does not match. Please verify both PIN entries.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/pos/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempSessionId,
          pin: newPin.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.staff) {
        // Pre-fill local login credentials so future logins are instant
        setName(data.staff.name);
        setPassword(newPin.trim());
        loginPosStaff(data.staff);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.message || 'Failed to save security PIN. Please try again.');
      }
    } catch {
      setErrorMessage('Network error while saving security PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP code
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
        setSuccessNotice(`New verification code dispatched to ${data.destinationEmail}`);
        setTimeout(() => setSuccessNotice(''), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to resend verification code.');
      }
    } catch {
      setErrorMessage('Network error while resending verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP inputs handling
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

  // Google 1-Tap Connect: "also when sign up with google send otp for them to get verified"
  const handleGoogleConnect = async () => {
    setIsGoogleSigningIn(true);
    setErrorMessage('');
    setSuccessNotice('');
    try {
      const res = await googleSignIn();
      if (res && res.user && res.user.email) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        setEmail(res.user.email);
        if (res.user.displayName) setName(res.user.displayName);

        const response = await fetch('/api/pos/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: res.user.email,
            name: res.user.displayName || 'Authorized Google Staff',
            requestedRole: portalMode,
            googleToken: res.accessToken,
            isSignup: authTab === 'signup'
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          if (data.requiresOtpVerification) {
            // Google Sign Up requires email OTP verification
            setTempSessionId(data.tempSessionId);
            setDispatchedEmail(data.email);
            setDeliveryMethod(data.deliveryMethod || 'Google Security Email');
            setStep('verify');
            setResendCooldown(45);
            setCodeDigits(['', '', '', '', '', '']);
            setSuccessNotice(data.message || `Verification code sent to ${data.email}. Check your email to verify.`);
          } else if (data.staff) {
            loginPosStaff(data.staff);
            if (onSuccess) onSuccess();
          }
        } else {
          setErrorMessage(data.message || 'Google account verified, but staff access was not granted.');
        }
      }
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setErrorMessage(err?.message || 'Failed to authenticate with Google');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070709] text-stone-100 flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-amber-400 selection:text-stone-950">
      {/* Background ambient gold gradient glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/25 via-black to-black opacity-80" />

      <div className="relative z-10 w-full max-w-lg bg-[#0f0f14] border border-amber-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Boutique Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full border-2 border-amber-400/80 p-0.5 shadow-xl bg-black overflow-hidden">
            <img 
              src={settings.brandLogoUrl} 
              alt="Nimrah Collection" 
              className="w-full h-full object-cover object-center scale-[2.2] rounded-full"
            />
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
            {settings.storeName}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-stone-400 font-light">
            {settings.storeAddress} · Official Till {settings.mpesaTillNumber}
          </p>
        </div>

        {/* STEP 1: CREDENTIALS (LOGIN OR SIGNUP) */}
        {step === 'credentials' && (
          <div className="space-y-4">
            
            {/* ROLE TOGGLE: SHOP OWNER vs SYSTEM ADMIN */}
            <div className="grid grid-cols-2 gap-2 bg-[#14141c] p-1.5 rounded-2xl border border-stone-800">
              <button
                type="button"
                onClick={() => handlePortalSwitch('owner')}
                className={`py-2.5 sm:py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  portalMode === 'owner'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 shadow-md shadow-amber-950/40'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Shop Owner</span>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-normal ${portalMode === 'owner' ? 'text-stone-900' : 'text-stone-500'}`}>
                  Catalog, Photos &amp; Profits
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePortalSwitch('admin')}
                className={`py-2.5 sm:py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  portalMode === 'admin'
                    ? 'bg-gradient-to-r from-stone-200 to-white text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>System Admin</span>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-normal ${portalMode === 'admin' ? 'text-stone-900' : 'text-stone-500'}`}>
                  Operations &amp; Register
                </span>
              </button>
            </div>

            {/* TAB SELECTOR: LOG IN vs SIGN UP */}
            <div className="flex bg-[#121218] p-1 rounded-xl border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authTab === 'login'
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Log In (Name &amp; PIN)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authTab === 'signup'
                    ? 'bg-amber-400 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sign Up (Email OTP)</span>
              </button>
            </div>

            {/* Role Clearance Notice */}
            <div className={`p-2.5 sm:p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              portalMode === 'owner'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                : 'bg-stone-800/60 border-stone-700 text-stone-300'
            }`}>
              {portalMode === 'owner' ? (
                <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" />
              )}
              <div className="text-[10px] sm:text-[11px] leading-relaxed">
                {authTab === 'login' ? (
                  portalMode === 'owner' ? (
                    <span><strong>Shop Owner Login:</strong> Enter your registered Name and authorized Security PIN to unlock live catalog adding, photo uploads, item removal, and wholesale cost margins.</span>
                  ) : (
                    <span><strong>Admin / Cashier Login:</strong> Enter your Name and PIN to unlock register barcode scanning, sales receipts, and checkout.</span>
                  )
                ) : (
                  <span><strong>{portalMode === 'owner' ? 'Shop Owner' : 'System Admin'} Registration:</strong> Enter your details below. A 6-digit security OTP code will be sent to your email to verify and unlock your account.</span>
                )}
              </div>
            </div>

            {/* Feedback Alert */}
            {errorMessage && (
              <div className="bg-rose-950/70 border border-rose-600/60 p-3 rounded-xl text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* FORM 1: LOG IN WITH NAME & PIN */}
            {authTab === 'login' && (
              <form onSubmit={handlePinLogin} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-300">
                    Your Registered Full Name or Username *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Diba Karim (Shop Owner)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2.5 sm:py-3 bg-[#17171e] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-300">
                      Security PIN / Password *
                    </label>
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      e.g. Nimrah@2026 or your PIN
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter your security PIN..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs font-mono pl-9 pr-10 py-2.5 sm:py-3 bg-[#17171e] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Presets for 1-Tap Autofill on Any Device */}
                <div className="pt-0.5">
                  <div className="text-[10px] font-mono uppercase text-stone-400 mb-1.5 flex items-center justify-between">
                    <span>Authorized {portalMode === 'owner' ? 'Owner' : 'Staff'} Presets:</span>
                    <span className="text-amber-400">Tap to autofill</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(portalMode === 'owner' ? ownerPresets : adminPresets).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          name === p.name 
                            ? 'bg-amber-400/15 border-amber-400/70 text-amber-200' 
                            : 'bg-[#14141a] border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-white flex items-center gap-1 truncate">
                          {p.role === 'Shop Owner' ? <Crown className="w-3 h-3 text-amber-400 shrink-0" /> : <ShieldCheck className="w-3 h-3 text-stone-300 shrink-0" />}
                          <span className="truncate">{p.name}</span>
                        </div>
                        <div className="text-[9px] font-mono text-stone-400 truncate">PIN: {p.pin}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-stone-950" />
                      <span>Log In with Security PIN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM 2: SIGN UP WITH EMAIL OTP */}
            {authTab === 'signup' && (
              <form onSubmit={handleSignupWithOtp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-300">
                    Full Legal Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Diba Karim"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs font-medium pl-9 pr-3 py-2.5 sm:py-3 bg-[#17171e] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-300">
                    Official Email (Where OTP will be received) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                    <input 
                      type="email"
                      required
                      placeholder="e.g. dibakarim307@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs font-mono pl-9 pr-3 py-2.5 sm:py-3 bg-[#17171e] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <span className="text-[10px] text-stone-400 block">
                    A 6-digit OTP code will be sent to this email account immediately.
                  </span>
                </div>

                {/* Notice that PIN is created after verifying OTP */}
                <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block mb-0.5">Two-Step Security Onboarding</span>
                    <span>A 6-digit OTP code will be sent to your email. Once verified, you will set your custom security PIN to log in anytime.</span>
                  </div>
                </div>

                {/* Sign Up Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email OTP...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-stone-950" />
                      <span>Send Verification OTP to Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Google 1-Tap Option */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                <span className="bg-[#0f0f14] px-3 text-stone-500">Or connect with Google</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleConnect}
              disabled={isGoogleSigningIn}
              className="w-full py-2.5 px-3 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-400/50 rounded-xl text-xs font-semibold text-stone-200 hover:text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>
                {isGoogleSigningIn 
                  ? 'Connecting with Google...' 
                  : authTab === 'signup'
                  ? `Sign up with Google (Receive OTP) as ${portalMode === 'owner' ? 'Shop Owner' : 'Admin'}`
                  : `Sign in with Google as ${portalMode === 'owner' ? 'Shop Owner' : 'Admin'}`}
              </span>
            </button>

            {authTab === 'signup' && (
              <p className="text-[10px] text-stone-500 text-center">
                Signing up with Google automatically dispatches a 6-digit OTP code to your Google inbox to verify identity.
              </p>
            )}
          </div>
        )}

        {/* STEP 2: VERIFY EMAIL OTP CODE (FOR SIGN UP) */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center mx-auto text-amber-400">
                <Mail className="w-6 h-6 animate-bounce" />
              </div>

              <h3 className="font-serif text-lg font-bold text-white">
                Enter Email Verification Code
              </h3>

              <p className="text-xs text-stone-300 leading-relaxed max-w-sm mx-auto">
                A 6-digit security code was dispatched to your email:
              </p>
              
              <div className="inline-block bg-[#181822] border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-mono font-bold text-amber-300">
                {dispatchedEmail}
              </div>
            </div>

            {/* Error or Success notification */}
            {errorMessage && (
              <div className="bg-rose-950/70 border border-rose-600/60 p-3 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {successNotice && (
              <div className="bg-emerald-950/70 border border-emerald-600/60 p-3 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">{successNotice}</div>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* 6 Digit Input Boxes */}
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
                    className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold bg-[#171720] border-2 border-stone-700 rounded-xl text-amber-300 focus:outline-none focus:border-amber-400 focus:bg-black transition-all"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code &amp; Proceed to Set PIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Resend and Back actions */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setErrorMessage('');
                }}
                className="text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Form</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={handleResendCode}
                className={`font-semibold cursor-pointer ${
                  resendCooldown > 0 
                    ? 'text-stone-500 cursor-not-allowed' 
                    : 'text-amber-400 hover:underline'
                }`}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SET SECURITY PIN (AFTER EMAIL OTP VERIFIED) */}
        {step === 'set_pin' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Email Verified: {verifiedInfo?.email || dispatchedEmail}</span>
              </div>

              <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                Set Your Security PIN
              </h3>

              <p className="text-xs text-stone-300 leading-relaxed max-w-sm mx-auto">
                Create a security PIN for <strong className="text-amber-300">{verifiedInfo?.name || name}</strong> ({verifiedInfo?.role || (portalMode === 'owner' ? 'Shop Owner' : 'System Admin')}). You will use your Name and this PIN for all future fast logins.
              </p>
            </div>

            {/* Error or Success Feedback */}
            {errorMessage && (
              <div className="bg-rose-950/70 border border-rose-600/60 p-3 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {successNotice && (
              <div className="bg-emerald-950/70 border border-emerald-600/60 p-3 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">{successNotice}</div>
              </div>
            )}

            <form onSubmit={handleSetSecurityPin} className="space-y-3.5">
              {/* PIN input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-300">
                  New Security PIN / Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                  <input 
                    type={showNewPin ? "text" : "password"}
                    required
                    placeholder="Enter 4-8 digit security PIN..."
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-10 py-2.5 sm:py-3 bg-[#17171e] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm PIN input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-300">
                  Confirm Security PIN *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input 
                    type={showConfirmPin ? "text" : "password"}
                    required
                    placeholder="Re-enter your PIN to confirm..."
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-10 py-2.5 sm:py-3 bg-[#17171e] border border-stone-700 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-200 cursor-pointer"
                  >
                    {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons for 1-Tap PIN Choice */}
              <div className="pt-0.5">
                <div className="text-[10px] font-mono uppercase text-stone-400 mb-1 flex items-center justify-between">
                  <span>Fast PIN suggestions:</span>
                  <span className="text-amber-400">Tap to auto-fill</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {['2026', '1234', '0000', 'Nimrah@2026'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setNewPin(preset);
                        setConfirmPin(preset);
                      }}
                      className="py-1.5 px-2 bg-[#171720] hover:bg-stone-800 border border-stone-800 hover:border-amber-400/50 rounded-lg text-[11px] font-mono text-stone-300 hover:text-amber-300 text-center cursor-pointer transition-all truncate"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving PIN &amp; Unlocking POS...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Save PIN &amp; Access POS Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Back action */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('verify');
                  setErrorMessage('');
                }}
                className="text-xs text-stone-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to OTP Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Cancel / Storefront Button */}
        {onCancel && (
          <div className="pt-2 border-t border-stone-800 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            >
              Cancel &amp; Return to Online Boutique Storefront
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
