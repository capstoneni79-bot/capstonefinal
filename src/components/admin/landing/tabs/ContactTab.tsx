import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import { LandingCmsConfig } from '../../../../types/landingCms';

interface ContactTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Official Office Details */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Contact Section Headlines & Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-stone-100">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Section Title</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.contactTitleColor || '#064e3b'}
                  onChange={e => onChange({ contactTitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Title Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.contactTitle || 'Contact Us'}
              onChange={e => onChange({ contactTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Section Subtitle</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.contactSubtitleColor || '#78716c'}
                  onChange={e => onChange({ contactSubtitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Subtitle Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.contactSubtitle || 'Reach out to Municipal Agriculture Officers'}
              onChange={e => onChange({ contactSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">Official Office Name</label>
            <input
              type="text"
              value={config.officeName}
              onChange={e => onChange({ officeName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900"
              placeholder="e.g. Municipal Agriculture Office (MAO) Hinunangan"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">Physical Location & Barangay</label>
            <input
              type="text"
              value={config.address}
              onChange={e => onChange({ address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Operating Hours</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={config.officeHours}
                onChange={e => onChange({ officeHours: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-stone-800"
                placeholder="e.g. Monday - Friday: 8:00 AM - 5:00 PM"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Official Inquiry Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={config.contactEmail}
                onChange={e => onChange({ contactEmail: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-stone-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Hotlines & Veterinary Dispatch */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Phone className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Emergency Hotlines & Dispatch Contacts</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">General Office Landline / Phone</label>
            <input
              type="text"
              value={config.contactPhone}
              onChange={e => onChange({ contactPhone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Official Mobile Number</label>
            <input
              type="text"
              value={config.contactMobile || '+63 917 888 2345'}
              onChange={e => onChange({ contactMobile: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
              <label className="font-bold text-red-950 flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                24/7 African Swine Fever (ASF) Rapid Response Emergency Hotline
              </label>
              <input
                type="text"
                value={config.hotlineEmergency}
                onChange={e => onChange({ hotlineEmergency: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-red-300 bg-white font-black text-red-700 text-sm"
                placeholder="+63 917 555 7946"
              />
              <p className="text-[11px] text-red-900/80 leading-relaxed">
                Displayed in red emergency pill on the public landing page for farmers reporting sick pigs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
