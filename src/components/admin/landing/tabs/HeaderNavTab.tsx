import React, { useState } from 'react';
import { Menu, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Palette, ExternalLink } from 'lucide-react';
import { LandingCmsConfig, NavItem } from '../../../../types/landingCms';

interface HeaderNavTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

export const HeaderNavTab: React.FC<HeaderNavTabProps> = ({ config, onChange }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('#');

  const navItems = config.navItems || [];

  const handleToggleVisible = (id: string) => {
    const updated = navItems.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    onChange({ navItems: updated });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= navItems.length) return;
    const clone = [...navItems];
    const temp = clone[index];
    clone[index] = clone[newIdx];
    clone[newIdx] = temp;
    onChange({ navItems: clone.map((item, idx) => ({ ...item, order: idx + 1 })) });
  };

  const handleDelete = (id: string) => {
    const updated = navItems.filter(item => item.id !== id);
    onChange({ navItems: updated });
  };

  const handleUpdateItem = (id: string, updates: Partial<NavItem>) => {
    const updated = navItems.map(item => (item.id === id ? { ...item, ...updates } : item));
    onChange({ navItems: updated });
  };

  const handleAddNavItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const newItem: NavItem = {
      id: 'nav-' + Date.now(),
      label: newLabel.trim(),
      href: newHref.trim() || '#',
      visible: true,
      order: navItems.length + 1,
    };
    onChange({ navItems: [...navItems, newItem] });
    setNewLabel('');
    setNewHref('#');
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Header Dimensions & Appearance */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <Palette className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Header Styling & Dimensions</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Office Brand Title</label>
            <input
              type="text"
              value={config.headerTitle || 'Municipal Agriculture Office - Hinunangan'}
              onChange={e => onChange({ headerTitle: e.target.value })}
              placeholder="Municipal Agriculture Office - Hinunangan"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Header Subtitle</label>
            <input
              type="text"
              value={config.headerSubtitle || 'Swine Farm Registry and Georeferencing'}
              onChange={e => onChange({ headerSubtitle: e.target.value })}
              placeholder="Swine Farm Registry and Georeferencing"
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-medium text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Header Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.headerBgColor || '#064e3b'}
                onChange={e => onChange({ headerBgColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.headerBgColor || '#064e3b'}
                onChange={e => onChange({ headerBgColor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Header Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.headerTextColor || '#ffffff'}
                onChange={e => onChange({ headerTextColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.headerTextColor || '#ffffff'}
                onChange={e => onChange({ headerTextColor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Header Height: {config.headerHeight || 72}px
            </label>
            <input
              type="range"
              min={56}
              max={100}
              value={config.headerHeight || 72}
              onChange={e => onChange({ headerHeight: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Logo Width / Scale: {config.headerLogoWidth || 44}px
            </label>
            <input
              type="range"
              min={32}
              max={80}
              value={config.headerLogoWidth || 44}
              onChange={e => onChange({ headerLogoWidth: Number(e.target.value) })}
              className="w-full cursor-pointer accent-emerald-700"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Header Button Label</label>
            <input
              type="text"
              value={config.headerButtonText}
              onChange={e => onChange({ headerButtonText: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300"
              placeholder="e.g. Sign In / Access Portal"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Header Button Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.headerButtonColor || '#10b981'}
                onChange={e => onChange({ headerButtonColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={config.headerButtonColor || '#10b981'}
                onChange={e => onChange({ headerButtonColor: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Manager */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div className="flex items-center gap-2">
            <Menu className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Navigation Menu Items</h3>
          </div>
          <span className="text-[11px] text-stone-500">{navItems.length} Items Configured</span>
        </div>

        {/* Nav Items List */}
        <div className="space-y-2">
          {navItems.map((item, index) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                item.visible ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1">
                <span className="w-6 text-center font-mono text-stone-400 text-[11px]">#{index + 1}</span>
                <input
                  type="text"
                  value={item.label}
                  onChange={e => handleUpdateItem(item.id, { label: e.target.value })}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-bold text-stone-900 w-32 sm:w-44 focus:ring-1 focus:ring-emerald-600"
                />
                <input
                  type="text"
                  value={item.href}
                  onChange={e => handleUpdateItem(item.id, { href: e.target.value })}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-stone-600 font-mono text-[11px] flex-1 focus:ring-1 focus:ring-emerald-600"
                  placeholder="#section-id or URL"
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleVisible(item.id)}
                  title={item.visible ? 'Hide link' : 'Show link'}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  {item.visible ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={index === navItems.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Nav Item */}
        <form onSubmit={handleAddNavItem} className="pt-3 border-t border-stone-100 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="New Menu Label (e.g. FAQ)"
            className="px-3 py-1.5 rounded-xl border border-stone-300 w-44"
          />
          <input
            type="text"
            value={newHref}
            onChange={e => setNewHref(e.target.value)}
            placeholder="Target Anchor / URL (e.g. #faq)"
            className="px-3 py-1.5 rounded-xl border border-stone-300 flex-1 font-mono text-[11px]"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Navigation Item
          </button>
        </form>
      </div>
    </div>
  );
};
