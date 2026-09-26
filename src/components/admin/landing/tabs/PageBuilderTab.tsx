import React, { useState } from 'react';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Sliders,
  GripVertical,
} from 'lucide-react';
import { LandingCmsConfig, LandingSectionItem } from '../../../../types/landingCms';

interface PageBuilderTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
}

export const PageBuilderTab: React.FC<PageBuilderTabProps> = ({ config, onChange }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  const sections = config.sections || [];

  const handleToggle = (id: string) => {
    const updated = sections.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onChange({ sections: updated });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const clone = [...sections];
    const temp = clone[index];
    clone[index] = clone[newIdx];
    clone[newIdx] = temp;
    onChange({ sections: clone.map((s, i) => ({ ...s, order: i + 1 })) });
  };

  const handleUpdate = (id: string, updates: Partial<LandingSectionItem>) => {
    const updated = sections.map(s => (s.id === id ? { ...s, ...updates } : s));
    onChange({ sections: updated });
  };

  const handleDelete = (id: string) => {
    onChange({ sections: sections.filter(s => s.id !== id) });
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const item: LandingSectionItem = {
      id: 'custom-' + Date.now(),
      sectionType: 'custom',
      name: newTitle.trim(),
      customTitle: newTitle.trim(),
      customSubtitle: newSubtitle.trim() || undefined,
      enabled: true,
      order: sections.length + 1,
      padding: 'medium',
    };
    onChange({ sections: [...sections, item] });
    setNewTitle('');
    setNewSubtitle('');
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-stone-900 text-sm">Visual Page Builder & Section Hierarchy</h3>
        </div>
        <p className="text-stone-500 leading-relaxed text-xs">
          Reorder page blocks with up/down controls, toggle section visibility, adjust vertical container spacing,
          and define custom content sections for agricultural advisories.
        </p>
      </div>

      {/* Sections List */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <span className="font-bold text-stone-900 text-xs">Page Sections Hierarchy</span>
          <span className="text-[11px] text-stone-400">
            {sections.filter(s => s.enabled).length} of {sections.length} Sections Active
          </span>
        </div>

        <div className="space-y-2.5">
          {sections.map((section, idx) => (
            <div
              key={section.id}
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                section.enabled ? 'bg-stone-50 border-stone-200' : 'bg-stone-100/60 border-stone-200 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-stone-300" />
                <span className="font-mono text-stone-400 text-[11px] w-5">#{idx + 1}</span>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs">{section.name}</h4>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Type: {section.sectionType}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:self-center">
                {/* Custom Title Override if needed */}
                <input
                  type="text"
                  value={section.customTitle || ''}
                  onChange={e => handleUpdate(section.id, { customTitle: e.target.value })}
                  placeholder="Custom section title override"
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-[11px] w-48 hidden md:block"
                />

                {/* Padding Selection */}
                <select
                  value={section.padding || 'medium'}
                  onChange={e => handleUpdate(section.id, { padding: e.target.value as any })}
                  className="px-2 py-1 rounded-lg border border-stone-300 bg-white text-[10px]"
                >
                  <option value="small">Compact</option>
                  <option value="medium">Default Spacing</option>
                  <option value="large">Spacious</option>
                </select>

                {/* Visibility */}
                <button
                  type="button"
                  onClick={() => handleToggle(section.id)}
                  title={section.enabled ? 'Hide Section' : 'Show Section'}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 cursor-pointer"
                >
                  {section.enabled ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Reorder Buttons */}
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, 'up')}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={() => handleMove(idx, 'down')}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Delete only if custom */}
                {section.sectionType === 'custom' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(section.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Section */}
        <form onSubmit={handleAddCustomSection} className="pt-4 border-t border-stone-100 flex flex-wrap gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Custom Section Title (e.g. ASF FAQ)"
            className="px-3 py-1.5 rounded-xl border border-stone-300 w-56"
          />
          <input
            type="text"
            value={newSubtitle}
            onChange={e => setNewSubtitle(e.target.value)}
            placeholder="Section Subtitle"
            className="px-3 py-1.5 rounded-xl border border-stone-300 flex-1"
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Section
          </button>
        </form>
      </div>
    </div>
  );
};
