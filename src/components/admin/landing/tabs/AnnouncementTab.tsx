import React from 'react';
import { Megaphone, Calendar, Palette, Link as LinkIcon } from 'lucide-react';
import { LandingCmsConfig } from '../../../../types/landingCms';

interface AnnouncementTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

export const AnnouncementTab: React.FC<AnnouncementTabProps> = ({ config, onChange }) => {
  const bar = config.announcement || {
    enabled: true,
    text: 'ASF Biosecurity Alert: Mandatory Hog Inspection & Clearance Active Across All 40 Hinunangan Barangays.',
    linkText: 'Read Executive Order',
    linkUrl: '#biosecurity',
    bgColor: '#f59e0b',
    textColor: '#451a03',
    position: 'top',
  };

  const updateBar = (fields: Partial<typeof bar>) => {
    onChange({ announcement: { ...bar, ...fields } });
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Enable Banner Switch */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Public Announcement & Alert Bar</h3>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bar.enabled}
              onChange={e => updateBar({ enabled: e.target.checked })}
              className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
            <span className="font-bold text-xs text-stone-800">
              {bar.enabled ? 'Banner Active' : 'Banner Disabled'}
            </span>
          </label>
        </div>

        {/* Live Simulation of Banner */}
        <div
          className="p-3.5 rounded-xl font-bold flex items-center justify-between gap-3 text-xs shadow-inner transition"
          style={{
            backgroundColor: bar.bgColor || '#f59e0b',
            color: bar.textColor || '#451a03',
            opacity: bar.enabled ? 1 : 0.4,
          }}
        >
          <div className="flex items-center gap-2 flex-1">
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>{bar.text || 'Sample announcement message appears here.'}</span>
          </div>
          {bar.linkText && (
            <span className="underline uppercase tracking-wider font-black text-[11px] shrink-0">
              {bar.linkText}
            </span>
          )}
        </div>

        {/* Announcement Text Controls */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Banner Advisory / News Text
            </label>
            <textarea
              rows={3}
              value={bar.text}
              onChange={e => updateBar({ text: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 leading-relaxed focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              placeholder="e.g. ASF Biosecurity Advisory or Registration Drive dates..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Call to Action Link Label</label>
              <input
                type="text"
                value={bar.linkText || ''}
                onChange={e => updateBar({ linkText: e.target.value })}
                placeholder="e.g. Read Advisory"
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Target Link URL or Section</label>
              <input
                type="text"
                value={bar.linkUrl || ''}
                onChange={e => updateBar({ linkUrl: e.target.value })}
                placeholder="e.g. #biosecurity or https://..."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Colors & Placement */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Palette className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Banner Styling & Schedule</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bar.bgColor || '#f59e0b'}
                onChange={e => updateBar({ bgColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={bar.bgColor || '#f59e0b'}
                onChange={e => updateBar({ bgColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Text & Icon Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bar.textColor || '#451a03'}
                onChange={e => updateBar({ textColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={bar.textColor || '#451a03'}
                onChange={e => updateBar({ textColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Display Position</label>
            <select
              value={bar.position || 'top'}
              onChange={e => updateBar({ position: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="top">Top of Page (Above Header)</option>
              <option value="below-header">Below Navigation Header</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Scheduled Expiration</label>
            <input
              type="date"
              value={bar.endDate || ''}
              onChange={e => updateBar({ endDate: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
