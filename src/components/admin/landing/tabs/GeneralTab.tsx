import React from 'react';
import { Globe, Image as ImageIcon, Mail, Phone, MapPin, Compass, Upload } from 'lucide-react';
import { LandingCmsConfig } from '../../../../types/landingCms';

interface GeneralTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ config, onChange, onOpenMediaPicker }) => {
  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Basic Website Info */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Globe className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">General Website Identity</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Official Website Name</label>
            <input
              type="text"
              value={config.siteName}
              onChange={e => onChange({ siteName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. DA HINUNANGAN SWINE REGISTRY"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Website Subtitle / Office Tagline</label>
            <input
              type="text"
              value={config.siteSubtitle}
              onChange={e => onChange({ siteSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. Department of Agriculture & Municipal Agriculture Office"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">Browser Page Title (&lt;title&gt;)</label>
            <input
              type="text"
              value={config.browserTitle}
              onChange={e => onChange({ browserTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
            <p className="text-[11px] text-stone-400 mt-1">Appears in browser tabs and search engine bookmarks.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">Meta Description (SEO & Social Sharing)</label>
            <textarea
              rows={2}
              value={config.metaDescription}
              onChange={e => onChange({ metaDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">Search Keywords (Comma Separated)</label>
            <input
              type="text"
              value={config.metaKeywords}
              onChange={e => onChange({ metaKeywords: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-700 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* System Logo & Favicon */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Compass className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Favicon & System Logo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Browser Tab Favicon</label>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer transition">
                <Upload className="w-3 h-3" />
                <span>Import Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        onChange({ faviconUrl: reader.result });
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={config.faviconUrl || '/icon.svg'}
                alt="Favicon"
                className="w-10 h-10 p-1 rounded-xl border border-stone-200 object-contain bg-stone-50"
              />
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  placeholder="Paste image URL or click Import Photo"
                  value={config.faviconUrl}
                  onChange={e => onChange({ faviconUrl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-[11px] font-mono"
                />
                {config.faviconUrl && config.faviconUrl !== '/icon.svg' && (
                  <button
                    type="button"
                    onClick={() => onChange({ faviconUrl: '/icon.svg' })}
                    className="text-[10px] text-stone-400 hover:text-red-600 font-medium transition cursor-pointer"
                  >
                    Reset default icon
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">System Logo</label>
              <label className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg cursor-pointer transition">
                <Upload className="w-3 h-3" />
                <span>Import Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        onChange({ systemLogoUrl: reader.result });
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={config.systemLogoUrl || '/icon.svg'}
                alt="System Logo"
                className="w-10 h-10 p-1 rounded-xl border border-stone-200 object-contain bg-stone-50"
              />
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  placeholder="Paste image URL or click Import Photo"
                  value={config.systemLogoUrl}
                  onChange={e => onChange({ systemLogoUrl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-[11px] font-mono"
                />
                {config.systemLogoUrl && config.systemLogoUrl !== '/icon.svg' && (
                  <button
                    type="button"
                    onClick={() => onChange({ systemLogoUrl: '/icon.svg' })}
                    className="text-[10px] text-stone-400 hover:text-red-600 font-medium transition cursor-pointer"
                  >
                    Reset default logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Address & Communication */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Official Physical & Contact Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Official Email Address</label>
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

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Office Telephone / Hotline</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={config.contactPhone}
                onChange={e => onChange({ contactPhone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-stone-800"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-700 mb-1">Office Physical Address</label>
            <input
              type="text"
              value={config.address}
              onChange={e => onChange({ address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
