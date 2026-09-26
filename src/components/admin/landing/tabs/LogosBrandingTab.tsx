import React, { useState } from 'react';
import { ShieldCheck, Plus } from 'lucide-react';
import { LandingCmsConfig, OfficialLogoItem } from '../../../../types/landingCms';
import { InsigniaCard } from '../../media/InsigniaCard';
import { landingCmsService } from '../../../../services/landingCmsService';

interface LogosBrandingTabProps {
  config: LandingCmsConfig;
  onChange: (updates: Partial<LandingCmsConfig>) => void;
  onOpenMediaPicker?: (targetField: string) => void;
}

export const LogosBrandingTab: React.FC<LogosBrandingTabProps> = ({
  config,
  onChange,
}) => {
  const [newInstitution, setNewInstitution] = useState('');
  const [newName, setNewName] = useState('');

  const logos = config.officialLogos || [];

  const handleUpdate = (id: string, updates: Partial<OfficialLogoItem>) => {
    const updated = logos.map(l => (l.id === id ? { ...l, ...updates } : l));
    onChange({ officialLogos: updated });
    landingCmsService.updateOfficialLogo(id, updates);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= logos.length) return;
    const clone = [...logos];
    const temp = clone[index];
    clone[index] = clone[newIdx];
    clone[newIdx] = temp;
    const reordered = clone.map((l, i) => ({ ...l, order: i + 1 }));
    onChange({ officialLogos: reordered });
    landingCmsService.reorderOfficialLogos(reordered);
  };

  const handleDelete = (logo: OfficialLogoItem) => {
    const remaining = logos.filter(l => l.id !== logo.id);
    onChange({ officialLogos: remaining });
    landingCmsService.reorderOfficialLogos(remaining);
  };

  const handleAddLogo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstitution.trim()) return;
    const item: OfficialLogoItem = {
      id: 'logo-' + Date.now(),
      institution: newInstitution.trim(),
      name: newName.trim() || newInstitution.trim(),
      placement: 'hero',
      size: 44,
      sizePx: 44,
      margin: 8,
      visible: true,
      mobileVisible: true,
      order: logos.length + 1,
      vectorComponent: 'SealDA',
    };
    const updated = [...logos, item];
    onChange({ officialLogos: updated });
    landingCmsService.saveDraft({ ...config, officialLogos: updated });
    landingCmsService.publish({ ...config, officialLogos: updated });
    setNewInstitution('');
    setNewName('');
  };

  return (
    <div className="space-y-6 text-xs text-stone-800">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
          <h3 className="font-bold text-sm">Official Seals, Insignias & University Emblems</h3>
        </div>
        <p className="text-emerald-100/90 text-xs leading-relaxed max-w-2xl">
          Configure official institutional seals for the Municipality of Hinunangan, Department of Agriculture (DA),
          Southern Leyte State University (SLSU), SLSU Extension Center, and National Animal Health Task Force. Each emblem can be changed independently with device import or URL link.
        </p>
      </div>

      {/* Logos List Grid */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b pb-3 border-stone-100">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Configured Official Insignias</h3>
            <p className="text-[11px] text-stone-500">Each insignia can be modified or replaced independently with live previews.</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            {logos.length} Emblems
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logos.map((logo, idx) => (
            <InsigniaCard
              key={logo.id}
              logo={logo}
              index={idx}
              totalLogos={logos.length}
              onUpdateLogo={handleUpdate}
              onMoveLogo={handleMove}
              onDeleteLogo={handleDelete}
              onToast={() => {}}
            />
          ))}
        </div>

        {/* Add Emblem Form */}
        <form onSubmit={handleAddLogo} className="pt-4 border-t border-stone-100 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={newInstitution}
            onChange={e => setNewInstitution(e.target.value)}
            placeholder="Institution (e.g. SLSU San Juan Campus)"
            className="px-3 py-2 rounded-xl border border-stone-300 w-56 text-xs"
          />
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Badge title / insignia description"
            className="px-3 py-2 rounded-xl border border-stone-300 flex-1 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Official Seal
          </button>
        </form>
      </div>
    </div>
  );
};

