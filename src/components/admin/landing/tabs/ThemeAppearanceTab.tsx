import React from 'react';
import { Palette, Type, Sun, Moon, Sparkles } from 'lucide-react';
import { LandingCmsConfig, ThemeConfig } from '../../../../types/landingCms';

interface ThemeAppearanceTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

const COLOR_PRESETS: { name: string; theme: Partial<ThemeConfig> }[] = [
  {
    name: 'DA Official Forest & Emerald',
    theme: {
      primaryColor: '#047857',
      secondaryColor: '#064e3b',
      accentColor: '#f59e0b',
      backgroundColor: '#f8fafc',
      textColor: '#1c1917',
      headingColor: '#064e3b',
      buttonColor: '#047857',
      buttonTextColor: '#ffffff',
    },
  },
  {
    name: 'SLSU Academic Gold & Evergreen',
    theme: {
      primaryColor: '#15803d',
      secondaryColor: '#14532d',
      accentColor: '#eab308',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      headingColor: '#14532d',
      buttonColor: '#15803d',
      buttonTextColor: '#ffffff',
    },
  },
  {
    name: 'Southern Leyte Coastal Teal & Cyan',
    theme: {
      primaryColor: '#0f766e',
      secondaryColor: '#134e4a',
      accentColor: '#0284c7',
      backgroundColor: '#f0fdfa',
      textColor: '#134e4a',
      headingColor: '#134e4a',
      buttonColor: '#0f766e',
      buttonTextColor: '#ffffff',
    },
  },
  {
    name: 'Modern Executive Slate & Ochre',
    theme: {
      primaryColor: '#334155',
      secondaryColor: '#0f172a',
      accentColor: '#d97706',
      backgroundColor: '#f8fafc',
      textColor: '#334155',
      headingColor: '#0f172a',
      buttonColor: '#0f172a',
      buttonTextColor: '#ffffff',
    },
  },
];

export const ThemeAppearanceTab: React.FC<ThemeAppearanceTabProps> = ({ config, onChange }) => {
  const theme = config.theme || {
    primaryColor: '#047857',
    secondaryColor: '#064e3b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1c1917',
    headingColor: '#064e3b',
    buttonColor: '#047857',
    buttonTextColor: '#ffffff',
    borderColor: '#e7e5e4',
    headingFont: 'system-ui',
    bodyFont: 'system-ui',
    baseFontSize: '16px',
    colorMode: 'light',
    borderRadius: 'large',
    shadowDepth: 'subtle',
  };

  const updateTheme = (fields: Partial<ThemeConfig>) => {
    onChange({ theme: { ...theme, ...fields } });
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Quick Color Presets */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Official Institutional Color Schemes</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.name}
              type="button"
              onClick={() => updateTheme(preset.theme)}
              className="p-3 rounded-xl border border-stone-200 hover:border-emerald-600 bg-stone-50 hover:bg-white text-left transition cursor-pointer space-y-2 group shadow-2xs"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.theme.primaryColor }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.theme.secondaryColor }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10"
                  style={{ backgroundColor: preset.theme.accentColor }}
                />
              </div>
              <p className="font-bold text-stone-900 text-xs leading-tight group-hover:text-emerald-800">
                {preset.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Palette Editor */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Palette className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Color Palette Customizer</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Primary Color (Brand)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={e => updateTheme({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={e => updateTheme({ primaryColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Secondary (Deep Green)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={e => updateTheme({ secondaryColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.secondaryColor}
                onChange={e => updateTheme({ secondaryColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Accent (Gold/Highlight)</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.accentColor}
                onChange={e => updateTheme({ accentColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.accentColor}
                onChange={e => updateTheme({ accentColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Heading Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.headingColor}
                onChange={e => updateTheme({ headingColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.headingColor}
                onChange={e => updateTheme({ headingColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Button Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.buttonColor}
                onChange={e => updateTheme({ buttonColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.buttonColor}
                onChange={e => updateTheme({ buttonColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Button Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.buttonTextColor}
                onChange={e => updateTheme({ buttonTextColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.buttonTextColor}
                onChange={e => updateTheme({ buttonTextColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Body Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.textColor}
                onChange={e => updateTheme({ textColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.textColor}
                onChange={e => updateTheme({ textColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Page Canvas Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={e => updateTheme({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={theme.backgroundColor}
                onChange={e => updateTheme({ backgroundColor: e.target.value })}
                className="w-full px-2.5 py-1 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography & Geometric Styling */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Type className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Typography & Geometric Radii</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Heading Typography</label>
            <select
              value={theme.headingFont}
              onChange={e => updateTheme({ headingFont: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="system-ui">System Sans-Serif</option>
              <option value="Merriweather, serif">Merriweather (Editorial Serif)</option>
              <option value="Playfair Display, serif">Playfair Display (Premium Serif)</option>
              <option value="Poppins, sans-serif">Poppins (Modern Geometric)</option>
              <option value="Roboto, sans-serif">Roboto</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Body Typography</label>
            <select
              value={theme.bodyFont}
              onChange={e => updateTheme({ bodyFont: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="system-ui">System Sans-Serif</option>
              <option value="Open Sans, sans-serif">Open Sans</option>
              <option value="Lato, sans-serif">Lato</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Corner Radii</label>
            <select
              value={theme.borderRadius}
              onChange={e => updateTheme({ borderRadius: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="none">None (Sharp Corners - 0px)</option>
              <option value="small">Small (6px)</option>
              <option value="medium">Medium (10px)</option>
              <option value="large">Large (16px Modern)</option>
              <option value="full">Pill / Rounded Full</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Shadow Depth</label>
            <select
              value={theme.shadowDepth}
              onChange={e => updateTheme({ shadowDepth: e.target.value as any })}
              className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
            >
              <option value="none">None (Flat Clean)</option>
              <option value="subtle">Subtle (Soft Elevation)</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong (High Contrast)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
