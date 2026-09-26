import React, { useState } from 'react';
import { BarChart3, Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { LandingCmsConfig, StatItem } from '../../../../types/landingCms';

interface StatisticsTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({ config, onChange }) => {
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const stats = config.stats || [];

  const handleToggleVisible = (id: string) => {
    onChange({
      stats: stats.map(s => (s.id === id ? { ...s, visible: !s.visible } : s)),
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= stats.length) return;
    const clone = [...stats];
    const temp = clone[index];
    clone[index] = clone[newIdx];
    clone[newIdx] = temp;
    onChange({ stats: clone.map((s, i) => ({ ...s, order: i + 1 })) });
  };

  const handleDelete = (id: string) => {
    onChange({ stats: stats.filter(s => s.id !== id) });
  };

  const handleUpdateStat = (id: string, updates: Partial<StatItem>) => {
    onChange({
      stats: stats.map(s => (s.id === id ? { ...s, ...updates } : s)),
    });
  };

  const handleAddStat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const newStat: StatItem = {
      id: 'stat-' + Date.now(),
      label: newLabel.trim(),
      value: newValue.trim() || '0',
      description: newDesc.trim() || undefined,
      icon: 'BarChart3',
      visible: true,
      order: stats.length + 1,
    };
    onChange({ stats: [...stats, newStat] });
    setNewValue('');
    setNewLabel('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Headlines */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b pb-3 border-stone-100">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Statistics Section Headlines</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Section Title</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.statsTitleColor || '#064e3b'}
                  onChange={e => onChange({ statsTitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Title Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.statsTitle}
              onChange={e => onChange({ statsTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-stone-700">Section Subtitle</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Font Color:</span>
                <input
                  type="color"
                  value={config.statsSubtitleColor || '#78716c'}
                  onChange={e => onChange({ statsSubtitleColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-stone-300 cursor-pointer p-0.5"
                  title="Subtitle Font Color"
                />
              </div>
            </div>
            <input
              type="text"
              value={config.statsSubtitle}
              onChange={e => onChange({ statsSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Counters List */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <h3 className="font-bold text-stone-900 text-sm">Key Performance Metrics & Live Counters</h3>
          <span className="text-[11px] text-stone-400">{stats.length} Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <div
              key={stat.id}
              className={`p-4 rounded-xl border space-y-2 transition ${
                stat.visible ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-stone-400 text-[11px]">#{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(stat.id)}
                    className="p-1 rounded-md hover:bg-stone-200 text-stone-600 cursor-pointer"
                  >
                    {stat.visible ? <Eye className="w-3.5 h-3.5 text-emerald-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 rounded-md hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === stats.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 rounded-md hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(stat.id)}
                    className="p-1 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Display Number / Stat</label>
                  <input
                    type="text"
                    value={stat.value}
                    onChange={e => handleUpdateStat(stat.id, { value: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-black text-emerald-800 text-base"
                    placeholder="e.g. 1,420+"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-stone-500 mb-0.5">Label / Title</label>
                  <input
                    type="text"
                    value={stat.label}
                    onChange={e => handleUpdateStat(stat.id, { label: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-lg border border-stone-300 bg-white font-bold text-stone-900"
                    placeholder="e.g. Registered Swine"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-stone-500 mb-0.5">Subtitle / Small Caption</label>
                <input
                  type="text"
                  value={stat.description || ''}
                  onChange={e => handleUpdateStat(stat.id, { description: e.target.value })}
                  className="w-full px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[11px] text-stone-600"
                  placeholder="e.g. Micro-chipped & Ear-tagged"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Stat Form */}
        <form onSubmit={handleAddStat} className="pt-3 border-t border-stone-100 flex flex-wrap gap-2 items-end">
          <div className="w-28">
            <label className="block text-[10px] text-stone-500 mb-1">Value</label>
            <input
              type="text"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="e.g. 99.4%"
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 font-bold"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] text-stone-500 mb-1">Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. ASF Negative Clearance"
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[10px] text-stone-500 mb-1">Caption</label>
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="e.g. Certified BAI Bio-secure"
              className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Metric
          </button>
        </form>
      </div>
    </div>
  );
};
