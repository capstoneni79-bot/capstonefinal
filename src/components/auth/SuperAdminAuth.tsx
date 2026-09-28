import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { storageService } from '../../services/storageService';
import { authApi } from '../../services/api';
import { useOfficialLogos } from '../common/OfficialSeals';

interface SuperAdminAuthProps {
  onSuccess: (user: UserAccount) => void;
  onReturnToNormalPortal: () => void;
}

export const SuperAdminAuth: React.FC<SuperAdminAuthProps> = ({
  onSuccess,
  onReturnToNormalPortal,
}) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const logos = useOfficialLogos();
  const sealLogo =
    logos['logo-header'] ||
    logos['logo-system'] ||
    logos['logo-da'] ||
    '/icon.svg';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await authApi.login(usernameOrEmail.trim(), password);
      if (result.role !== 'super_admin' || result.user.role !== 'super_admin') {
        setErrorMsg('Access Denied: This account does not possess Super Administrator privileges.');
        return;
      }

      storageService.setCurrentUser(result.user);
      onSuccess(result.user);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Invalid Super Administrator credentials. Access Denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-radial from-slate-900 via-stone-950 to-black text-stone-100 select-none">
      <div className="w-full max-w-md bg-stone-900/90 rounded-3xl border border-stone-800 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Banner Ribbon */}
        <div className="p-6 pb-5 border-b border-stone-800 bg-gradient-to-b from-stone-800/60 to-stone-900/40 relative">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={onReturnToNormalPortal}
              className="text-stone-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Portal</span>
            </button>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-600/50 text-[10px] font-black text-rose-300 uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Restricted Gateway</span>
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={sealLogo}
                alt="DA Hinunangan Seal"
                className="w-12 h-12 rounded-2xl object-contain bg-black/40 p-1.5 border border-stone-700 shadow-inner"
              />
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-rose-600 text-white">
                <KeyRound className="w-3 h-3" />
              </span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">
                Super Administrator Gateway
              </h1>
              <p className="text-[11px] text-stone-400">
                DA Hinunangan Swine Registry & Biosurveillance
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Super Admin Account / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. superadmin"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-stone-950/80 border border-stone-700 text-white placeholder:text-stone-600 text-xs font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-300 uppercase tracking-wider mb-1.5">
                Master Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-950/80 border border-stone-700 text-white placeholder:text-stone-600 text-xs font-mono focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-stone-500 hover:text-stone-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-950 text-rose-600 focus:ring-rose-500 accent-rose-600"
                />
                <span className="text-[11px]">Remember master session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <span>Verifying Super Administrator credentials...</span>
              ) : (
                <>
                  <span>Authorize Super Admin Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Information */}
          <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full Audit Logging Enabled</span>
            </span>
            <span>Hinunangan Regional Server</span>
          </div>
        </div>
      </div>
    </div>
  );
};
