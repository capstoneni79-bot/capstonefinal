import React, { useState, useMemo } from 'react';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Building2,
  FileCheck,
  Truck,
  Award,
  AlertCircle,
  HelpCircle,
  Lock,
  Save,
  CheckCircle2,
  LogOut,
  Sparkles,
  Layers,
  Activity,
  Calendar,
} from 'lucide-react';
import { UserAccount, SwineRecord, Barangay } from '../../types';
import { storageService } from '../../services/storageService';

interface UserAccountViewProps {
  currentUser: UserAccount | null;
  onLogout?: () => void;
  onUpdateUser?: (updated: UserAccount) => void;
  swineList?: SwineRecord[];
  barangays?: Barangay[];
}

export const UserAccountView: React.FC<UserAccountViewProps> = ({
  currentUser,
  onLogout,
  onUpdateUser,
  swineList = [],
  barangays = [],
}) => {
  // Profile Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Barangay Swine Stats for Focal Person
  const assignedBarangay = currentUser?.assignedBarangay;
  const barangaySwine = useMemo(() => {
    if (!assignedBarangay) return [];
    return swineList.filter(
      s => (s.barangay || '').toLowerCase() === assignedBarangay.toLowerCase()
    );
  }, [swineList, assignedBarangay]);

  const activeSwineCount = useMemo(() => {
    return barangaySwine.filter(s => !s.isArchived && s.status !== 'deceased' && s.status !== 'sold').length;
  }, [barangaySwine]);

  const healthySwineCount = useMemo(() => {
    return barangaySwine.filter(s => (s.healthStatus || 'healthy').toLowerCase() === 'healthy').length;
  }, [barangaySwine]);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated: UserAccount = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      phone: phone.trim() || currentUser.phone,
    };

    storageService.saveUserAccount(updated);
    storageService.setCurrentUser(updated);
    if (onUpdateUser) onUpdateUser(updated);

    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!currentUser) return;

    if (currentUser.password && currentPassword !== currentUser.password) {
      setPasswordError('Current password does not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const updated: UserAccount = {
      ...currentUser,
      password: newPassword,
    };

    storageService.saveUserAccount(updated);
    storageService.setCurrentUser(updated);
    if (onUpdateUser) onUpdateUser(updated);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(true);
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  const isFocal = currentUser?.role === 'focal';
  const isAdmin = currentUser?.role === 'admin';
  const isAgent = currentUser?.role === 'agent';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Account Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-20 h-20 rounded-2xl text-white font-black text-3xl flex items-center justify-center shadow-md shrink-0 ${
            isFocal
              ? 'bg-gradient-to-br from-emerald-700 to-teal-900'
              : isAdmin
              ? 'bg-gradient-to-br from-blue-700 to-indigo-900'
              : 'bg-gradient-to-br from-amber-600 to-amber-800'
          }`}>
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
                {currentUser?.name || 'Authorized Account'}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                isFocal
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : isAdmin
                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isFocal
                  ? 'Barangay Agricultural Focal Person'
                  : isAdmin
                  ? 'System Administrator / MAO Officer'
                  : 'Accredited Livestock Agent / Trader'}
              </span>
            </div>

            <p className="text-xs text-stone-500 flex flex-wrap items-center gap-2">
              <span>Account ID: <strong className="font-mono text-stone-700">{currentUser?.id || 'ACC-8821'}</strong></span>
              <span>•</span>
              <span>Username: <strong className="font-semibold text-stone-800">@{currentUser?.username || 'user'}</strong></span>
              {isFocal && assignedBarangay && (
                <>
                  <span>•</span>
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    Brgy. {assignedBarangay}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border border-stone-200 hover:border-rose-300 font-bold text-xs flex items-center gap-2 transition cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Barangay Focal Statistics & Jurisdiction Highlights */}
      {isFocal && assignedBarangay && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Assigned Jurisdiction</span>
            <div className="text-xl font-black text-emerald-950 flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Brgy. {assignedBarangay}</span>
            </div>
            <p className="text-[11px] text-stone-400">Municipality of Hinunangan, Southern Leyte</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Registered Swine</span>
            <div className="text-2xl font-black text-stone-900 flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>{barangaySwine.length} Heads</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold">{activeSwineCount} active in backyard & farm registries</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Biosecurity & Health Rate</span>
            <div className="text-2xl font-black text-emerald-800 flex items-center gap-1.5">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>{barangaySwine.length > 0 ? Math.round((healthySwineCount / barangaySwine.length) * 100) : 100}%</span>
            </div>
            <p className="text-[11px] text-stone-400">{healthySwineCount} verified clinically healthy</p>
          </div>
        </div>
      )}

      {/* Profile & Security Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Edit Profile Information */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h2 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Officer Profile & Contact Info</span>
            </h2>
            {profileSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" /> Updated!
              </span>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Full Legal / Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maria L. Santos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Official Mobile / Contact Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0917-123-4501"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold text-stone-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <p className="text-[10px] text-stone-400 mt-1">Used for SMS takeoff dispatch and emergency ASF biosecurity alerts.</p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Username:</span>
                <span className="font-semibold text-stone-800">@{currentUser?.username || 'user'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-medium">Assigned Role:</span>
                <span className="font-bold text-emerald-900 uppercase text-[11px]">{currentUser?.role || 'focal'}</span>
              </div>
              {currentUser?.assignedBarangay && (
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Assigned Barangay:</span>
                  <span className="font-bold text-emerald-800">Barangay {currentUser.assignedBarangay}</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Security & Password */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <h2 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span>Account Security & Password</span>
            </h2>
            {passwordSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" /> Password Changed!
              </span>
            )}
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <p className="text-[11px] text-stone-400">
              Keep your credentials secure. As a designated officer, your login authorizes swine registrations, certificate verifications, and syndromic reports.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold flex items-center gap-2 shadow-xs cursor-pointer transition"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Role Responsibilities & Municipal Support */}
      <div className="bg-gradient-to-br from-stone-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 border border-emerald-900 shadow-md space-y-4">
        <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>Barangay Biosecurity & ASF Task Force Protocols</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-300 leading-relaxed">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" /> 1. Registration & Ear Tagging
            </span>
            <p>Ensure backyard and semi-commercial hog raisers in your barangay are registered with GPS coordinates and official ear tags.</p>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-emerald-400" /> 2. 24-Hour Syndromic Reporting
            </span>
            <p>Report any sudden fever, abnormal mortalities, or skin hemorrhages to the Municipal Agriculture Office immediately.</p>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" /> 3. Movement & Take-off Verification
            </span>
            <p>Conduct pre-movement clinical inspections and ensure official Shipping Permits / Clearances are verified prior to livestock transit.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
