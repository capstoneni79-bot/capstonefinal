import React from 'react';
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
} from 'lucide-react';
import { UserAccount } from '../../types';

interface AgentAccountViewProps {
  currentUser: UserAccount | null;
  onLogout?: () => void;
}

export const AgentAccountView: React.FC<AgentAccountViewProps> = ({ currentUser, onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Trader Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-3xl flex items-center justify-center shadow-md shrink-0">
          {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'T'}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
              {currentUser?.name || 'Registered Swine Trader'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Accredited Livestock Trader / Agent
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Official Trader ID: <strong className="font-mono text-stone-700">TRD-HIN-{currentUser?.id?.slice(-4) || '8842'}</strong> • Municipality of Hinunangan
          </p>
        </div>
      </div>

      {/* Account Details & Accreditation Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b pb-3 border-stone-100">
            <User className="w-4 h-4 text-emerald-700" />
            <span>Trader Account Information</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-stone-50">
              <span className="text-stone-500">Username:</span>
              <span className="font-semibold text-stone-800">{currentUser?.username || 'trader_agent'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-stone-50">
              <span className="text-stone-500">Contact Number:</span>
              <span className="font-semibold text-stone-800">{currentUser?.phone || '+63 917 555 4321'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-stone-50">
              <span className="text-stone-500">Trading Scope:</span>
              <span className="font-semibold text-stone-800">Municipality of Hinunangan (40 Barangays)</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-stone-50">
              <span className="text-stone-500">Account Role:</span>
              <span className="font-semibold text-amber-800 capitalize">{currentUser?.role || 'agent'} (View-Only Swine Listings)</span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-stone-500">Accreditation Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <FileCheck className="w-3.5 h-3.5" />
                Active & In Good Standing
              </span>
            </div>
          </div>
        </div>

        {/* Biosecurity & Transport Protocol */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-2xl p-6 border border-emerald-800 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-emerald-200 flex items-center gap-2 border-b pb-3 border-emerald-800/80">
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Trader Transport Compliance</span>
          </h2>

          <ul className="space-y-2.5 text-xs text-emerald-100/90 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>Always verify the official <strong>Shipping Permit & Barangay Veterinary Clearance</strong> prior to swine takeoff.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>All livestock vehicles must undergo wheel-bath disinfection at designated municipal checkpoint stations.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span>Swill-fed pigs are strictly prohibited from commercial slaughter routes.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* MAO Livestock Office Support */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          <span>MAO Hinunangan Livestock Coordination Desk</span>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed">
          For verification of ear tag authenticity, permit issuance, or emergency inspection coordination, contact the Municipal Agriculture Office:
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-amber-900 pt-1">
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-700" />
            Office: +63 (053) 589-2041
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-red-700" />
            ASF Rapid Hotline: 0917-890-PIGS
          </span>
        </div>
      </div>
    </div>
  );
};
