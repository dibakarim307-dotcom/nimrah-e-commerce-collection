import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Crown, 
  Eye, 
  EyeOff, 
  Building2, 
  Save, 
  RefreshCw, 
  Fingerprint, 
  Sparkles,
  FileText,
  BadgeCheck,
  UserCheck,
  ShieldAlert,
  Terminal,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { PosStaffUser } from '../types';

interface StaffCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSwitchRole?: () => void;
}

interface VaultStaffRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  badgeNumber: string;
  branch: string;
  clearanceTier: string;
  maskedCredential: string;
  mfaRequired: boolean;
  status: string;
  lastAudit: string;
}

export const StaffCredentialsModal: React.FC<StaffCredentialsModalProps> = ({
  isOpen,
  onClose,
  onRequestSwitchRole
}) => {
  const { posStaffUser, settings, logoutPosStaff } = useStore();

  const [activeTab, setActiveTab] = useState<'badge' | 'clearance' | 'update_pwd' | 'vault'>('badge');
  
  // Update password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Shop Owner credential override state
  const [vaultRecords, setVaultRecords] = useState<VaultStaffRecord[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [selectedStaffForReset, setSelectedStaffForReset] = useState<VaultStaffRecord | null>(null);
  const [ownerOverridePassword, setOwnerOverridePassword] = useState('');
  const [newStaffAssignedPassword, setNewStaffAssignedPassword] = useState('');
  const [overrideSuccessMsg, setOverrideSuccessMsg] = useState('');

  const isOwner = posStaffUser?.role === 'Shop Owner';

  // Fetch credentials vault for Shop Owner
  const fetchVault = async () => {
    setIsLoadingVault(true);
    try {
      const res = await fetch('/api/pos/auth/credentials-vault');
      const data = await res.json();
      if (data.success && data.vaultRecords) {
        setVaultRecords(data.vaultRecords);
      }
    } catch (err) {
      console.error('Failed to load credentials vault', err);
    } finally {
      setIsLoadingVault(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchVault();
    }
  }, [isOpen]);

  if (!isOpen || !posStaffUser) return null;

  // Handle personal password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword) {
      setFeedback({ type: 'error', message: 'Current password is required to verify identity.' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'New security password/PIN must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/pos/auth/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: posStaffUser.email,
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setFeedback({ 
          type: 'success', 
          message: data.message || 'Credentials updated successfully. Please note down your new password!' 
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchVault();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update credentials' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Network error communicating with authentication server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle owner resetting another staff's credentials
  const handleOwnerResetStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForReset) return;

    try {
      const res = await fetch('/api/pos/auth/reset-staff-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerEmail: posStaffUser.email,
          ownerPassword: ownerOverridePassword,
          targetEmail: selectedStaffForReset.email,
          newPassword: newStaffAssignedPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        setOverrideSuccessMsg(`Credentials for ${selectedStaffForReset.name} successfully updated to: "${newStaffAssignedPassword}"`);
        setOwnerOverridePassword('');
        setNewStaffAssignedPassword('');
        fetchVault();
        setTimeout(() => setOverrideSuccessMsg(''), 5000);
      } else {
        alert(data.message || 'Failed to reset staff credential');
      }
    } catch {
      alert('Error updating staff credential');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-[#0f0f14] border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Banner */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isOwner 
            ? 'bg-gradient-to-r from-amber-950/60 via-[#19150d] to-amber-950/60 border-amber-500/30' 
            : 'bg-[#14141c] border-stone-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${
              isOwner 
                ? 'bg-amber-400 text-stone-950 border-amber-300' 
                : 'bg-stone-800 text-stone-200 border-stone-700'
            }`}>
              {isOwner ? <Crown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white tracking-wide">
                  Security Credentials &amp; Clearance
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isOwner ? 'bg-amber-400 text-stone-950' : 'bg-stone-800 text-stone-300'
                }`}>
                  {isOwner ? 'Executive Tier 1' : 'Operational Tier 2'}
                </span>
              </div>
              <p className="text-xs text-stone-400 font-light">
                {posStaffUser.name} · {posStaffUser.badgeNumber} · {posStaffUser.branch}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800/80 transition-colors cursor-pointer"
            aria-label="Close credentials modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-stone-800 bg-[#121218] px-6 gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('badge')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'badge'
                ? isOwner 
                  ? 'border-amber-400 text-amber-300' 
                  : 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            <span>Digital ID Badge</span>
          </button>

          <button
            onClick={() => setActiveTab('clearance')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'clearance'
                ? isOwner 
                  ? 'border-amber-400 text-amber-300' 
                  : 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Confidentiality Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('update_pwd')}
            className={`py-3 px-3.5 border-b-2 font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'update_pwd'
                ? isOwner 
                  ? 'border-amber-400 text-amber-300' 
                  : 'border-white text-white'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Update Password / PIN</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('vault')}
              className={`py-3 px-3.5 border-b-2 font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'vault'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-amber-500/70 hover:text-amber-400'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Boutique Vault Directory</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: DIGITAL SECURITY ID BADGE */}
          {activeTab === 'badge' && (
            <div className="space-y-6">
              {/* Virtual Badge Card */}
              <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 border shadow-2xl ${
                isOwner 
                  ? 'bg-gradient-to-br from-[#1e170c] via-[#14120f] to-[#241a0b] border-amber-500/40 text-amber-100 shadow-amber-950/20' 
                  : 'bg-gradient-to-br from-[#171720] via-[#121217] to-[#1c1c24] border-stone-700 text-stone-200 shadow-black/40'
              }`}>
                {/* Holographic Watermark Badge */}
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-48 h-48 text-white" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  {/* Left: Store identity & Avatar */}
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-serif text-2xl font-bold border shadow-lg ${
                      isOwner 
                        ? 'bg-amber-400 text-stone-950 border-amber-300' 
                        : 'bg-stone-800 text-white border-stone-600'
                    }`}>
                      {posStaffUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                          isOwner ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-stone-800 text-stone-300 border border-stone-700'
                        }`}>
                          {posStaffUser.role}
                        </span>
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 2FA Active
                        </span>
                      </div>
                      <h3 className="text-xl font-serif font-bold text-white mt-1">
                        {posStaffUser.name}
                      </h3>
                      <p className="text-xs font-mono text-stone-400">
                        {posStaffUser.email}
                      </p>
                    </div>
                  </div>

                  {/* Right: Badge Number & Chip */}
                  <div className="sm:text-right space-y-1">
                    <div className="text-[10px] uppercase font-mono tracking-widest text-stone-400">Personnel Badge ID</div>
                    <div className="text-xl font-mono font-extrabold tracking-wider text-amber-300">
                      {posStaffUser.badgeNumber}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">
                      Branch: Eastleigh UBAH Shop G7
                    </div>
                  </div>
                </div>

                {/* Microchip & Security Classification bar */}
                <div className="mt-8 pt-5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Fingerprint className="w-4 h-4 text-amber-400" />
                    <span>Clearance: {isOwner ? 'Tier 1 Sovereign Access (Unrestricted)' : 'Tier 2 Operational POS (Restock & Billing)'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    <span>Session: Active (Till 5428901 Verified)</span>
                  </div>
                </div>
              </div>

              {/* Status callout */}
              <div className="p-4 bg-[#14141c] rounded-2xl border border-stone-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">Active Credential Verification</h4>
                    <p className="text-xs text-stone-400 leading-relaxed font-light">
                      This terminal session is authenticated with your registered staff email and security password. 
                      Transactions processed during this session will be recorded under your badge ID <span className="font-mono text-amber-300 font-bold">{posStaffUser.badgeNumber}</span> on official invoices and M-Pesa Till receipts.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    logoutPosStaff();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  Switch / Lock Out
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CONFIDENTIALITY MATRIX */}
          {activeTab === 'clearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Confidential Separation Protocol</span>
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Proprietary boutique data is partitioned strictly between Shop Owner and System Admin to prevent unauthorized disclosure of wholesale margins and merchant settlement keys.
                </p>
              </div>

              {/* Matrix Table */}
              <div className="bg-[#121218] rounded-2xl border border-stone-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#161620] text-stone-400 border-b border-stone-800 text-[11px] uppercase">
                    <tr>
                      <th className="py-3 px-4">System Domain</th>
                      <th className="py-3 px-4">👑 Shop Owner (Tier 1)</th>
                      <th className="py-3 px-4">🛡️ System Admin (Tier 2)</th>
                      <th className="py-3 px-4">Confidentiality Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Boutique Gross Profit &amp; P&amp;L</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Full Access</td>
                      <td className="py-3 px-4 text-rose-400">✗ Redacted &amp; Masked</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[10px]">
                          RESTRICTED
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Wholesale Cost (COGS)</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Full Visibility &amp; Edit</td>
                      <td className="py-3 px-4 text-rose-400">✗ Hidden [Confidential]</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[10px]">
                          RESTRICTED
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Till 5428901 Merchant Balance</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Live Settlement Ledger</td>
                      <td className="py-3 px-4 text-rose-400">✗ Blocked</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[10px]">
                          RESTRICTED
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">KRA Tax PIN &amp; VAT Settings</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Full Modification</td>
                      <td className="py-3 px-4 text-rose-400">✗ Read-Only on Receipts</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[10px]">
                          PROTECTED
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Staff Password Reset Authority</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Sovereign Master Reset</td>
                      <td className="py-3 px-4 text-rose-400">✗ Own Password Only</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 text-[10px]">
                          PROTECTED
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Barcode Scanner &amp; POS Sales</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Unrestricted</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Unrestricted</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px]">
                          OPERATIONAL
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-white font-medium">Inventory Stock Intake &amp; Restock</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Unrestricted</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">✓ Unrestricted</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 text-[10px]">
                          OPERATIONAL
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Clearance explanation */}
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-white">Current Clearance Level: {posStaffUser.role}</strong>. 
                  {isOwner 
                    ? ' You hold Sovereign Executive clearance (Tier 1). You can review all confidential financials, live till settlements, wholesale unit costs, and administer staff credentials.' 
                    : ' You hold Operational Terminal clearance (Tier 2). To access wholesale cost margins, profit & loss, or boutique tax configurations, switch to an authorized Shop Owner credential account.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: UPDATE SECURITY CREDENTIALS */}
          {activeTab === 'update_pwd' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Update Security Password / PIN</span>
                </h3>
                <p className="text-xs text-stone-400 font-light mt-0.5">
                  Change the password used to authenticate your personnel badge at POS login and receipt verification.
                </p>
              </div>

              {feedback && (
                <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-950/40 text-emerald-200 border-emerald-800' 
                    : 'bg-rose-950/40 text-rose-200 border-rose-800'
                }`}>
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                {/* Registered Email (Read-only) */}
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-400 mb-1.5">
                    Registered Personnel Email
                  </label>
                  <input
                    type="email"
                    value={posStaffUser.email}
                    disabled
                    className="w-full bg-[#181822] border border-stone-800 rounded-xl px-4 py-2.5 text-xs text-stone-300 font-mono cursor-not-allowed opacity-80"
                  />
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-400 mb-1.5">
                    Current Password / Security PIN <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password..."
                      required
                      className="w-full bg-[#14141c] border border-stone-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-stone-600 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-400 mb-1.5">
                    New Security Password / PIN <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password (min 6 chars)..."
                      required
                      className="w-full bg-[#14141c] border border-stone-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-stone-600 outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-mono uppercase text-stone-400 mb-1.5">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password..."
                    required
                    className="w-full bg-[#14141c] border border-stone-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-stone-600 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-amber-950/40"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Updating Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save &amp; Update Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: BOUTIQUE VAULT DIRECTORY (OWNER ONLY) */}
          {activeTab === 'vault' && isOwner && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Sovereign Credentials Vault</span>
                  </h3>
                  <p className="text-xs text-stone-400 font-light mt-0.5">
                    Executive overview of all authorized personnel credentials, masked keys, and clearance tiers.
                  </p>
                </div>
                <button
                  onClick={fetchVault}
                  className="p-2 text-xs text-stone-400 hover:text-white bg-[#14141c] border border-stone-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVault ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {overrideSuccessMsg && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{overrideSuccessMsg}</span>
                </div>
              )}

              {/* Staff Records Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultRecords.map(staff => (
                  <div 
                    key={staff.id}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      staff.role === 'Shop Owner' 
                        ? 'bg-[#18140c] border-amber-500/40' 
                        : 'bg-[#14141c] border-stone-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{staff.name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            staff.role === 'Shop Owner' 
                              ? 'bg-amber-400 text-stone-950' 
                              : 'bg-stone-800 text-stone-300'
                          }`}>
                            {staff.badgeNumber}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 font-mono mt-0.5">{staff.email}</div>
                      </div>

                      <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                        {staff.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono pt-2 border-t border-stone-800/60">
                      <div className="flex justify-between text-stone-400">
                        <span>Clearance:</span>
                        <span className="text-stone-200">{staff.clearanceTier.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Stored PIN Hash:</span>
                        <span className="text-amber-300 font-mono">{staff.maskedCredential}</span>
                      </div>
                      <div className="flex justify-between text-stone-400">
                        <span>Branch Station:</span>
                        <span className="text-stone-300">{staff.branch}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedStaffForReset(staff)}
                        className="w-full py-1.5 text-xs text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Reset Staff Password as Owner →
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reset dialog if staff selected */}
              {selectedStaffForReset && (
                <div className="p-5 bg-[#1a160c] border border-amber-500/40 rounded-2xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Executive Password Reset for: {selectedStaffForReset.name} ({selectedStaffForReset.email})</span>
                    </h4>
                    <button
                      onClick={() => setSelectedStaffForReset(null)}
                      className="text-stone-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleOwnerResetStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-stone-400 font-mono mb-1">Your Owner Password (Verification)</label>
                      <input
                        type="password"
                        required
                        value={ownerOverridePassword}
                        onChange={(e) => setOwnerOverridePassword(e.target.value)}
                        placeholder="Enter your Shop Owner password..."
                        className="w-full bg-[#121218] border border-stone-800 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-400 font-mono mb-1">New Password for {selectedStaffForReset.name}</label>
                      <input
                        type="text"
                        required
                        value={newStaffAssignedPassword}
                        onChange={(e) => setNewStaffAssignedPassword(e.target.value)}
                        placeholder="e.g. Nimrah@2027 or Cashier#G7"
                        className="w-full bg-[#121218] border border-stone-800 rounded-lg px-3 py-2 text-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 pt-1">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg cursor-pointer"
                      >
                        Apply Sovereign Credential Override
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-4 border-t border-stone-800 bg-[#121218] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Encrypted POS Session · Till 5428901 · Eastleigh 5th St Shop G7</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
