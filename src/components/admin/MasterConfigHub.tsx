import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sliders,
  Type,
  Square,
  Maximize2,
  Layout,
  Globe,
  Bot,
  Eye,
  History,
  FileSpreadsheet,
  Save,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Search,
  Check,
  X,
  Upload,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  MasterSystemConfig,
  RoleVisualConfig,
  SupportedFontFamily,
  ButtonSizeMode,
  ModalPresetMode,
  ConfigAuditLogEntry,
  ConfigVersionEntry,
} from '../../types/masterConfig';
import { masterConfigService } from '../../services/masterConfigService';
import { useOfficialLogos } from '../common/OfficialSeals';

interface MasterConfigHubProps {
  initialTab?: string;
  onRefresh?: () => void;
  onNavigateTab?: (tab: string) => void;
}

const FONT_OPTIONS: SupportedFontFamily[] = [
  'Inter',
  'Roboto',
  'Poppins',
  'Montserrat',
  'Open Sans',
  'Nunito',
  'System Default',
];

const PRESET_PALETTES = [
  { name: 'DA Emerald Green', primary: '#00875A', sidebar: '#003C2F', accent: '#10b981' },
  { name: 'Municipal Ocean Blue', primary: '#1e40af', sidebar: '#0f172a', accent: '#38bdf8' },
  { name: 'Agriculture Gold & Bronze', primary: '#d97706', sidebar: '#1a1815', accent: '#f59e0b' },
  { name: 'Forest Biosecurity', primary: '#15803d', sidebar: '#052e16', accent: '#4ade80' },
  { name: 'Slate Executive', primary: '#475569', sidebar: '#0f172a', accent: '#94a3b8' },
];

export const MasterConfigHub: React.FC<MasterConfigHubProps> = ({
  initialTab = 'roles',
  onRefresh,
  onNavigateTab,
}) => {
  // Map incoming URL tab name to internal hub tab
  const resolveInitialTab = (tabName: string): string => {
    if (tabName === 'role_page_config') return 'roles';
    if (tabName === 'system_appearance' || tabName === 'branding_config') return 'appearance';
    if (tabName === 'typography_config') return 'typography';
    if (tabName === 'button_config' || tabName === 'popup_config') return 'buttons_modals';
    if (tabName === 'layout_config') return 'layout';
    if (tabName === 'sidebar_color' || tabName === 'nav_config') return 'sidebar';
    if (tabName === 'chatbot_config') return 'chatbot';
    if (tabName === 'feature_config') return 'features';
    if (tabName === 'version_history') return 'versions';
    if (tabName === 'audit_logs') return 'audit';
    return 'roles';
  };

  const [activeHubTab, setActiveHubTab] = useState<string>(() => resolveInitialTab(initialTab));
  const [selectedRole, setSelectedRole] = useState<'admin' | 'focal' | 'agent'>('admin');
  const [draftConfig, setDraftConfig] = useState<MasterSystemConfig>(() => masterConfigService.getDraftConfig());
  const [publishedConfig, setPublishedConfig] = useState<MasterSystemConfig>(() => masterConfigService.getConfig());
  const [versions, setVersions] = useState<ConfigVersionEntry[]>(() => masterConfigService.getVersions());
  const [auditLogs, setAuditLogs] = useState<ConfigAuditLogEntry[]>(() => masterConfigService.getAuditLogs());

  // Publish / Confirm Modals
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishSummary, setPublishSummary] = useState('Updated appearance and layout parameters');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<'current_role' | 'all'>('current_role');

  // Preview Mode
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewRole, setPreviewRole] = useState<'admin' | 'focal' | 'agent'>('admin');
  const [previewPage, setPreviewPage] = useState<'dashboard' | 'gis' | 'records' | 'takeoff'>('dashboard');

  // Audit search & filter
  const [auditSearch, setAuditSearch] = useState('');

  // Sync draft updates from service
  useEffect(() => {
    const handleDraftUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<MasterSystemConfig>;
      if (customEvt.detail) {
        setDraftConfig(customEvt.detail);
      }
    };
    const handlePublishedUpdate = (e: Event) => {
      const customEvt = e as CustomEvent<MasterSystemConfig>;
      if (customEvt.detail) {
        setPublishedConfig(customEvt.detail);
      }
      setVersions(masterConfigService.getVersions());
      setAuditLogs(masterConfigService.getAuditLogs());
    };

    window.addEventListener('da_master_config_draft_updated', handleDraftUpdate);
    window.addEventListener('da_master_config_updated', handlePublishedUpdate);
    return () => {
      window.removeEventListener('da_master_config_draft_updated', handleDraftUpdate);
      window.removeEventListener('da_master_config_updated', handlePublishedUpdate);
    };
  }, []);

  // Check if draft has uncommitted changes vs published
  const isDraftDirty = JSON.stringify(draftConfig.roles) !== JSON.stringify(publishedConfig.roles) ||
    JSON.stringify(draftConfig.globalBranding) !== JSON.stringify(publishedConfig.globalBranding) ||
    JSON.stringify(draftConfig.chatbotConfig) !== JSON.stringify(publishedConfig.chatbotConfig);

  const activeRoleConfig = draftConfig.roles[selectedRole];

  // Helper update dispatchers
  const updateDraft = (updater: (prev: MasterSystemConfig) => MasterSystemConfig) => {
    const next = updater(draftConfig);
    setDraftConfig(next);
    masterConfigService.saveDraft(next);
  };

  const handleColorChange = (key: keyof typeof activeRoleConfig.colors, val: string) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          colors: {
            ...prev.roles[selectedRole].colors,
            [key]: val,
          },
          // Keep sidebar color synchronized if sidebarColor was changed
          ...(key === 'sidebarColor'
            ? {
                sidebar: {
                  ...prev.roles[selectedRole].sidebar,
                  backgroundColor: val,
                },
              }
            : {}),
        },
      },
    }));
  };

  const handleTypographyChange = (key: keyof typeof activeRoleConfig.typography, field: string, val: any) => {
    updateDraft(prev => {
      if (key === 'fontFamily') {
        return {
          ...prev,
          roles: {
            ...prev.roles,
            [selectedRole]: {
              ...prev.roles[selectedRole],
              typography: {
                ...prev.roles[selectedRole].typography,
                fontFamily: val,
              },
            },
          },
        };
      }
      return {
        ...prev,
        roles: {
          ...prev.roles,
          [selectedRole]: {
            ...prev.roles[selectedRole],
            typography: {
              ...prev.roles[selectedRole].typography,
              [key]: {
                ...(prev.roles[selectedRole].typography as any)[key],
                [field]: val,
              },
            },
          },
        },
      };
    });
  };

  const handleButtonChange = (field: keyof typeof activeRoleConfig.buttons, val: any) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          buttons: {
            ...prev.roles[selectedRole].buttons,
            [field]: val,
          },
        },
      },
    }));
  };

  const handleModalChange = (field: keyof typeof activeRoleConfig.modals, val: any) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          modals: {
            ...prev.roles[selectedRole].modals,
            [field]: val,
          },
        },
      },
    }));
  };

  const handleSidebarChange = (field: keyof typeof activeRoleConfig.sidebar, val: any) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          sidebar: {
            ...prev.roles[selectedRole].sidebar,
            [field]: val,
          },
        },
      },
    }));
  };

  const handleLayoutChange = (field: keyof typeof activeRoleConfig.layout, val: any) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          layout: {
            ...prev.roles[selectedRole].layout,
            [field]: val,
          },
        },
      },
    }));
  };

  const handleFeatureToggle = (featureKey: keyof typeof activeRoleConfig.features) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          features: {
            ...prev.roles[selectedRole].features,
            [featureKey]: !prev.roles[selectedRole].features[featureKey],
          },
        },
      },
    }));
  };

  const handleTextChange = (category: 'menuLabels' | 'pageTitles', key: string, val: string) => {
    updateDraft(prev => ({
      ...prev,
      roles: {
        ...prev.roles,
        [selectedRole]: {
          ...prev.roles[selectedRole],
          text: {
            ...prev.roles[selectedRole].text,
            [category]: {
              ...prev.roles[selectedRole].text[category],
              [key]: val,
            },
          },
        },
      },
    }));
  };

  const handlePublish = async () => {
    await masterConfigService.publishConfig('Super Admin', publishSummary);
    setIsPublishModalOpen(false);
    if (onRefresh) onRefresh();
  };

  const handleDiscard = () => {
    const reverted = masterConfigService.discardDraft();
    setDraftConfig(reverted);
  };

  const handleResetToDefault = () => {
    if (resetTarget === 'current_role') {
      masterConfigService.resetRoleToDefault(selectedRole, 'Super Admin');
    } else {
      masterConfigService.resetSectionToDefault('all', undefined, 'Super Admin');
    }
    setDraftConfig(masterConfigService.getDraftConfig());
    setIsResetModalOpen(false);
  };

  const handleRestoreVersion = async (vNum: number) => {
    if (window.confirm(`Are you sure you want to rollback the entire system to Version v${vNum}?`)) {
      await masterConfigService.restoreVersion(vNum, 'Super Admin');
      setDraftConfig(masterConfigService.getDraftConfig());
      setPublishedConfig(masterConfigService.getConfig());
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ─────────────────────────────────────────────────────────────
          TOP CONTROL BAR & PUBLISH FLOW HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-700 text-white shadow-sm">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Super Admin Master Configuration Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
              v{publishedConfig.version} Published
            </span>
            {isDraftDirty && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                Unpublished Changes
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 max-w-3xl">
            Central visual, layout, and component authority. Customizes Admin, Focal Person, and Agent/Buyer interfaces independently with zero source-code changes.
          </p>
        </div>

        {/* Global Action Workflow Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {isDraftDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Discard Draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setResetTarget('current_role');
              setIsResetModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHubTab('preview')}
            className={`px-3.5 py-2 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeHubTab === 'preview'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          HUB SUB-NAVIGATION TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-stone-200 text-xs font-bold text-stone-600 select-none">
        {[
          { id: 'roles', label: 'Role Page Configuration', icon: Layers },
          { id: 'appearance', label: 'Colors & Branding', icon: Palette },
          { id: 'typography', label: 'Typography', icon: Type },
          { id: 'buttons_modals', label: 'Buttons & Modals', icon: Square },
          { id: 'layout', label: 'Layout & Viewports', icon: Layout },
          { id: 'sidebar', label: 'Sidebar Configuration', icon: Sliders },
          { id: 'chatbot', label: 'Chatbot Configuration', icon: Bot },
          { id: 'features', label: 'Feature Visibility', icon: Eye },
          { id: 'preview', label: 'Live Preview', icon: Monitor },
          { id: 'versions', label: 'Version History', icon: History },
          { id: 'audit', label: 'Audit Logs', icon: FileSpreadsheet },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeHubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveHubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: ROLE PAGE CONFIGURATION ([ADMIN] / [FOCAL] / [AGENT])
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'roles' && (
        <div className="space-y-6">
          {/* 3-Role Isolation Selector */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Select Target Interface:</span>
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200">
                {(['admin', 'focal', 'agent'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                      selectedRole === role
                        ? 'bg-white text-emerald-950 shadow-xs border border-stone-300'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {role === 'admin' ? 'Super Admin / Admin' : role === 'focal' ? 'Focal Person' : 'Agent / Buyer'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Role permissions remain enforced by backend. Appearance is isolated.</span>
            </div>
          </div>

          {/* Quick Config Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 1. Primary Colors Palette */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>Color Configuration</span>
                </h3>
                <span className="text-[10px] font-bold uppercase text-stone-400">{selectedRole}</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Primary Accent', key: 'primaryColor' as const },
                  { label: 'Sidebar Background', key: 'sidebarColor' as const },
                  { label: 'Main Viewport Background', key: 'backgroundColor' as const },
                  { label: 'Button Color', key: 'buttonColor' as const },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-stone-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeRoleConfig.colors[item.key] || '#00875A'}
                        onChange={e => handleColorChange(item.key, e.target.value)}
                        className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-transparent"
                      />
                      <input
                        type="text"
                        value={activeRoleConfig.colors[item.key] || '#00875A'}
                        onChange={e => handleColorChange(item.key, e.target.value)}
                        className="w-20 px-2 py-1 rounded-md border border-stone-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Typography Quick Settings */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-600" />
                  <span>Typography Settings</span>
                </h3>
                <span className="text-[10px] font-bold uppercase text-stone-400">{selectedRole}</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Primary Font Family</label>
                  <select
                    value={activeRoleConfig.typography.fontFamily}
                    onChange={e => handleTypographyChange('fontFamily', '', e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 text-xs font-medium bg-white"
                  >
                    {FONT_OPTIONS.map(font => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Page Title Font Size</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="16"
                      max="36"
                      value={activeRoleConfig.typography.pageTitle?.fontSize || 22}
                      onChange={e => handleTypographyChange('pageTitle', 'fontSize', parseInt(e.target.value, 10))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-12 text-right font-mono text-xs font-bold text-stone-800">
                      {activeRoleConfig.typography.pageTitle?.fontSize || 22}px
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Body Text Font Size</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="11"
                      max="18"
                      value={activeRoleConfig.typography.body?.fontSize || 13}
                      onChange={e => handleTypographyChange('body', 'fontSize', parseInt(e.target.value, 10))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-12 text-right font-mono text-xs font-bold text-stone-800">
                      {activeRoleConfig.typography.body?.fontSize || 13}px
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Primary Button Sizing */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <Square className="w-4 h-4 text-emerald-600" />
                  <span>Button Dimensions</span>
                </h3>
                <span className="text-[10px] font-bold uppercase text-stone-400">{selectedRole}</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Button Height</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="32"
                      max="56"
                      value={activeRoleConfig.buttons.height}
                      onChange={e => handleButtonChange('height', parseInt(e.target.value, 10))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-12 text-right font-mono text-xs font-bold text-stone-800">
                      {activeRoleConfig.buttons.height}px
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700">Border Radius</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={activeRoleConfig.buttons.borderRadius}
                      onChange={e => handleButtonChange('borderRadius', parseInt(e.target.value, 10))}
                      className="flex-1 accent-emerald-600"
                    />
                    <span className="w-12 text-right font-mono text-xs font-bold text-stone-800">
                      {activeRoleConfig.buttons.borderRadius}px
                    </span>
                  </div>
                </div>

                {/* Live Button Preview */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-center">
                  <button
                    type="button"
                    style={{
                      height: `${activeRoleConfig.buttons.height}px`,
                      borderRadius: `${activeRoleConfig.buttons.borderRadius}px`,
                      backgroundColor: activeRoleConfig.colors.buttonColor,
                      paddingLeft: `${activeRoleConfig.buttons.paddingX}px`,
                      paddingRight: `${activeRoleConfig.buttons.paddingX}px`,
                    }}
                    className="text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <span>Sample Primary Button</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Text Customization Section */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Interface Display Text Renaming</h3>
                <p className="text-xs text-stone-500">
                  Rename menu items, dashboard titles, and descriptions without altering database fields or API contracts.
                </p>
              </div>
              <span className="text-xs font-black uppercase px-2.5 py-1 bg-stone-100 rounded-lg text-stone-700">
                {selectedRole.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Dashboard Label</label>
                <input
                  type="text"
                  value={activeRoleConfig.text.menuLabels?.dashboard || 'Dashboard'}
                  onChange={e => handleTextChange('menuLabels', 'dashboard', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Swine Records Label</label>
                <input
                  type="text"
                  value={activeRoleConfig.text.menuLabels?.records || 'Swine Records'}
                  onChange={e => handleTextChange('menuLabels', 'records', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Ready for Take-Off Label</label>
                <input
                  type="text"
                  value={activeRoleConfig.text.menuLabels?.takeoff || 'Ready for Take-Off'}
                  onChange={e => handleTextChange('menuLabels', 'takeoff', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: SYSTEM APPEARANCE & BRANDING
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'appearance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900">Pre-Configured System Color Palettes</h3>
            <p className="text-xs text-stone-500">
              Apply tested government-grade color schemes instantly to the selected role:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_PALETTES.map(palette => (
                <div
                  key={palette.name}
                  onClick={() => {
                    handleColorChange('primaryColor', palette.primary);
                    handleColorChange('sidebarColor', palette.sidebar);
                    handleColorChange('accentColor', palette.accent);
                  }}
                  className="p-3.5 rounded-xl border border-stone-200 hover:border-emerald-500 cursor-pointer transition shadow-2xs hover:shadow-sm space-y-2.5 bg-stone-50/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-stone-800">{palette.name}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Apply</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-white/40 shadow-xs" style={{ backgroundColor: palette.primary }} title="Primary" />
                    <div className="w-7 h-7 rounded-lg border border-white/40 shadow-xs" style={{ backgroundColor: palette.sidebar }} title="Sidebar" />
                    <div className="w-7 h-7 rounded-lg border border-white/40 shadow-xs" style={{ backgroundColor: palette.accent }} title="Accent" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Color Palette Grid */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900">All Theme Colors ({selectedRole.toUpperCase()})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {[
                { label: 'Primary Color', key: 'primaryColor' as const },
                { label: 'Secondary Color', key: 'secondaryColor' as const },
                { label: 'Accent Color', key: 'accentColor' as const },
                { label: 'Sidebar Background', key: 'sidebarColor' as const },
                { label: 'Sidebar Text Color', key: 'sidebarTextColor' as const },
                { label: 'Sidebar Active Color', key: 'sidebarActiveColor' as const },
                { label: 'Header Background', key: 'headerColor' as const },
                { label: 'Header Text Color', key: 'headerTextColor' as const },
                { label: 'Main Background', key: 'backgroundColor' as const },
                { label: 'Card Background', key: 'cardBackground' as const },
                { label: 'Button Color', key: 'buttonColor' as const },
                { label: 'Border Color', key: 'borderColor' as const },
                { label: 'Success Alert', key: 'successColor' as const },
                { label: 'Warning Alert', key: 'warningColor' as const },
                { label: 'Danger Alert', key: 'dangerColor' as const },
                { label: 'Info Alert', key: 'infoColor' as const },
              ].map(item => (
                <div key={item.key} className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-stone-800 text-[11px]">{item.label}</p>
                    <p className="font-mono text-[10px] text-stone-500">{activeRoleConfig.colors[item.key] || '#000000'}</p>
                  </div>
                  <input
                    type="color"
                    value={activeRoleConfig.colors[item.key] || '#00875A'}
                    onChange={e => handleColorChange(item.key, e.target.value)}
                    className="w-8 h-8 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: TYPOGRAPHY
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'typography' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900">Font Families & Hierarchy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700">Primary Font Family</label>
                <select
                  value={activeRoleConfig.typography.fontFamily}
                  onChange={e => handleTypographyChange('fontFamily', '', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400">
                  Applied to body, tables, buttons, and navigation elements.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700">Page Header Font Family</label>
                <select
                  value={activeRoleConfig.typography.pageTitle?.fontFamily || activeRoleConfig.typography.fontFamily}
                  onChange={e => handleTypographyChange('pageTitle', 'fontFamily', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400">
                  Distinct display font for module banners and section headers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: BUTTONS & MODALS
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'buttons_modals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Button Config */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
              <Square className="w-4 h-4 text-emerald-600" />
              <span>Button Customization</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Height: {activeRoleConfig.buttons.height}px</label>
                <input
                  type="range"
                  min="32"
                  max="56"
                  value={activeRoleConfig.buttons.height}
                  onChange={e => handleButtonChange('height', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Border Radius: {activeRoleConfig.buttons.borderRadius}px</label>
                <input
                  type="range"
                  min="0"
                  max="28"
                  value={activeRoleConfig.buttons.borderRadius}
                  onChange={e => handleButtonChange('borderRadius', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Modal & Popup Config */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-emerald-600" />
              <span>Modal & Popup Dimensions</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Default Width: {activeRoleConfig.modals.width}px</label>
                <input
                  type="range"
                  min="480"
                  max="1024"
                  step="20"
                  value={activeRoleConfig.modals.width}
                  onChange={e => handleModalChange('width', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Border Radius: {activeRoleConfig.modals.borderRadius}px</label>
                <input
                  type="range"
                  min="8"
                  max="32"
                  value={activeRoleConfig.modals.borderRadius}
                  onChange={e => handleModalChange('borderRadius', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: LAYOUT & VIEWPORTS
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'layout' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-stone-900">Layout Metrics & Heights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700">
                GIS Biosurveillance Map Height: {activeRoleConfig.layout.gisMapHeight}px
              </label>
              <input
                type="range"
                min="450"
                max="900"
                step="25"
                value={activeRoleConfig.layout.gisMapHeight}
                onChange={e => handleLayoutChange('gisMapHeight', parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700">
                Table Row Height: {activeRoleConfig.layout.tableRowHeight}px
              </label>
              <input
                type="range"
                min="38"
                max="68"
                step="2"
                value={activeRoleConfig.layout.tableRowHeight}
                onChange={e => handleLayoutChange('tableRowHeight', parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700">
                Dashboard Card Spacing: {activeRoleConfig.layout.sectionSpacing}px
              </label>
              <input
                type="range"
                min="12"
                max="32"
                step="2"
                value={activeRoleConfig.layout.sectionSpacing}
                onChange={e => handleLayoutChange('sectionSpacing', parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: CHATBOT CONFIGURATION
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'chatbot' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <span>Biosecurity Assistant Appearance & Dimensions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Chat Window Width: {draftConfig.chatbotConfig.width}px</label>
                <input
                  type="range"
                  min="360"
                  max="520"
                  step="10"
                  value={draftConfig.chatbotConfig.width}
                  onChange={e =>
                    updateDraft(prev => ({
                      ...prev,
                      chatbotConfig: {
                        ...prev.chatbotConfig,
                        width: parseInt(e.target.value, 10),
                      },
                    }))
                  }
                  className="w-full accent-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Chat Window Height: {draftConfig.chatbotConfig.height}px</label>
                <input
                  type="range"
                  min="480"
                  max="700"
                  step="20"
                  value={draftConfig.chatbotConfig.height}
                  onChange={e =>
                    updateDraft(prev => ({
                      ...prev,
                      chatbotConfig: {
                        ...prev.chatbotConfig,
                        height: parseInt(e.target.value, 10),
                      },
                    }))
                  }
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
              <p className="text-xs font-bold text-stone-700">Chatbot Super Admin Command Capabilities</p>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Super Admins can configure appearance in real time by chatting with the assistant using natural language (e.g. <em>"Change Admin sidebar to blue"</em>, <em>"Make GIS map 700px"</em>).
              </p>
              <div className="flex items-center gap-2 pt-2 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2-step verification preview card active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: FEATURE VISIBILITY TOGGLES
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'features' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Feature Visibility by Role</h3>
              <p className="text-xs text-stone-500">
                Toggle menu and component visibility. (Note: Hiding UI elements does NOT bypass backend security permissions).
              </p>
            </div>
            <span className="text-xs font-black uppercase px-2.5 py-1 bg-stone-100 rounded-lg text-stone-700">
              {selectedRole.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'dashboard' as const, label: 'Dashboard Overview' },
              { key: 'gis' as const, label: 'GIS Swine Map' },
              { key: 'records' as const, label: 'Swine Records' },
              { key: 'certificate' as const, label: 'Print Official Reports' },
              { key: 'takeoff' as const, label: 'Ready for Take-Off' },
              { key: 'biosecurity' as const, label: 'Barangay Biosecurity' },
              { key: 'asf_ordinance' as const, label: 'ASF Legal Decrees' },
              { key: 'messages' as const, label: 'Messaging Center' },
              { key: 'barangays' as const, label: 'Manage Barangay' },
              { key: 'account' as const, label: 'User Account' },
            ].map(f => {
              const isChecked = activeRoleConfig.features[f.key] !== false;
              return (
                <label
                  key={f.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100 cursor-pointer transition"
                >
                  <span className="text-xs font-bold text-stone-800">{f.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleFeatureToggle(f.key)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 8: LIVE INTERACTIVE PREVIEW
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-stone-500 uppercase">Role:</span>
              <select
                value={previewRole}
                onChange={e => setPreviewRole(e.target.value as any)}
                className="p-1.5 rounded-lg border border-stone-300 text-xs font-bold bg-white"
              >
                <option value="admin">Admin</option>
                <option value="focal">Focal Person</option>
                <option value="agent">Agent / Buyer</option>
              </select>

              <span className="text-xs font-bold text-stone-500 uppercase ml-2">Page:</span>
              <select
                value={previewPage}
                onChange={e => setPreviewPage(e.target.value as any)}
                className="p-1.5 rounded-lg border border-stone-300 text-xs font-bold bg-white"
              >
                <option value="dashboard">Dashboard</option>
                <option value="gis">GIS Map</option>
                <option value="records">Swine Records</option>
                <option value="takeoff">Take-Off</option>
              </select>
            </div>

            {/* Viewport toggles */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  previewViewport === 'desktop' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('tablet')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  previewViewport === 'tablet' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet (768px)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  previewViewport === 'mobile' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile (375px)</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulation Frame */}
          <div className="flex justify-center p-4 bg-stone-200/80 rounded-3xl border border-stone-300 min-h-[500px] overflow-hidden">
            <div
              style={{
                width: previewViewport === 'mobile' ? '375px' : previewViewport === 'tablet' ? '768px' : '100%',
                backgroundColor: draftConfig.roles[previewRole]?.colors.backgroundColor || '#F4F7F9',
                fontFamily: draftConfig.roles[previewRole]?.typography.fontFamily || 'Inter',
              }}
              className="rounded-2xl shadow-xl border border-stone-300 flex overflow-hidden transition-all duration-300"
            >
              {/* Simulated Sidebar */}
              <div
                style={{
                  backgroundColor: draftConfig.roles[previewRole]?.sidebar.backgroundColor || '#003C2F',
                  width: previewViewport === 'mobile' ? '56px' : '220px',
                }}
                className="p-3 text-white flex flex-col justify-between shrink-0"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                      DA
                    </div>
                    {previewViewport !== 'mobile' && (
                      <span className="font-extrabold text-xs truncate">Hinunangan Swine</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {[
                      { id: 'dashboard', label: draftConfig.roles[previewRole]?.text.menuLabels?.dashboard || 'Dashboard' },
                      { id: 'gis', label: 'GIS Swine Map' },
                      { id: 'records', label: draftConfig.roles[previewRole]?.text.menuLabels?.records || 'Swine Records' },
                      { id: 'takeoff', label: draftConfig.roles[previewRole]?.text.menuLabels?.takeoff || 'Ready for Take-Off' },
                    ].map(item => (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: previewPage === item.id ? draftConfig.roles[previewRole]?.colors.sidebarActiveColor : 'transparent',
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold truncate cursor-pointer"
                      >
                        {previewViewport === 'mobile' ? item.label.charAt(0) : item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Simulated Page Content */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2
                    style={{
                      fontFamily: draftConfig.roles[previewRole]?.typography.pageTitle?.fontFamily || 'Inter',
                      fontSize: `${draftConfig.roles[previewRole]?.typography.pageTitle?.fontSize || 20}px`,
                      fontWeight: 800,
                    }}
                    className="text-stone-900 tracking-tight"
                  >
                    {previewPage === 'dashboard'
                      ? draftConfig.roles[previewRole]?.text.pageTitles?.dashboard || 'Dashboard Overview'
                      : previewPage === 'gis'
                      ? 'GIS Biosurveillance Map'
                      : previewPage === 'records'
                      ? draftConfig.roles[previewRole]?.text.menuLabels?.records || 'Swine Records'
                      : 'Take-Off Queue'}
                  </h2>

                  <button
                    type="button"
                    style={{
                      height: `${draftConfig.roles[previewRole]?.buttons.height || 42}px`,
                      borderRadius: `${draftConfig.roles[previewRole]?.buttons.borderRadius || 10}px`,
                      backgroundColor: draftConfig.roles[previewRole]?.colors.buttonColor || '#00875A',
                    }}
                    className="px-3.5 text-white font-bold text-xs shadow-xs"
                  >
                    + Sample Button
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    style={{
                      backgroundColor: draftConfig.roles[previewRole]?.colors.cardBackground || '#ffffff',
                    }}
                    className="p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1"
                  >
                    <span className="text-[10px] font-bold uppercase text-stone-400">Total Swine</span>
                    <p className="text-lg font-black text-stone-800">1,240 head</p>
                  </div>

                  <div
                    style={{
                      backgroundColor: draftConfig.roles[previewRole]?.colors.cardBackground || '#ffffff',
                    }}
                    className="p-4 rounded-xl border border-stone-200 shadow-2xs space-y-1"
                  >
                    <span className="text-[10px] font-bold uppercase text-stone-400">Ready for Take-Off</span>
                    <p className="text-lg font-black text-emerald-700">185 head</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 9: VERSION HISTORY & ROLLBACK
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'versions' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-stone-900">Release Version History</h3>
            <span className="text-xs text-stone-500 font-semibold">{versions.length} published revisions</span>
          </div>

          <div className="divide-y divide-stone-100">
            {versions.map(v => (
              <div key={v.version} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      v{v.version}
                    </span>
                    <span className="text-xs font-bold text-stone-800">{v.summary}</span>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Published by <strong className="text-stone-600">{v.publishedBy}</strong> on{' '}
                    {new Date(v.publishedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {v.version !== publishedConfig.version && (
                    <button
                      type="button"
                      onClick={() => handleRestoreVersion(v.version)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-bold text-xs transition cursor-pointer"
                    >
                      Rollback to v{v.version}
                    </button>
                  )}
                  {v.version === publishedConfig.version && (
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      Current Live Version
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 10: AUDIT LOGS
      ───────────────────────────────────────────────────────────── */}
      {activeHubTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-stone-900">Configuration Audit Trail</h3>
              <p className="text-xs text-stone-500">
                Immutable records of who modified what, target role, old values, and new values.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit trail..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-black uppercase text-[10px] border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Author</th>
                  <th className="py-2.5 px-3">Target Scope</th>
                  <th className="py-2.5 px-3">Action / Change</th>
                  <th className="py-2.5 px-3">Old Value</th>
                  <th className="py-2.5 px-3">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {auditLogs
                  .filter(l =>
                    auditSearch
                      ? l.what.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        l.who.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        l.targetRole.toLowerCase().includes(auditSearch.toLowerCase())
                      : true
                  )
                  .map(log => (
                    <tr key={log.id} className="hover:bg-stone-50/60">
                      <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900">{log.who}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                          {log.targetRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-800">{log.what}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-500 text-[11px]">{String(log.oldValue)}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold text-[11px]">
                        {String(log.newValue)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL: PUBLISH CHANGES
      ───────────────────────────────────────────────────────────── */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <Send className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-base text-stone-900">Publish System Configuration?</h3>
                <p className="text-xs text-stone-500">Changes will take effect system-wide in real time.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Release Summary / Changelog Note</label>
              <textarea
                value={publishSummary}
                onChange={e => setPublishSummary(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs cursor-pointer shadow-sm"
              >
                Publish Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CONFIRMATION MODAL: RESET TO DEFAULT
      ───────────────────────────────────────────────────────────── */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-rose-100 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-black text-base text-stone-900">Reset Configuration to Default</h3>
                <p className="text-xs text-stone-500">Restore factory baseline styles and dimensions.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 cursor-pointer">
                <input
                  type="radio"
                  name="resetTarget"
                  checked={resetTarget === 'current_role'}
                  onChange={() => setResetTarget('current_role')}
                  className="accent-rose-600"
                />
                <span className="text-xs font-bold text-stone-800">
                  Reset only {selectedRole.toUpperCase()} appearance
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 cursor-pointer">
                <input
                  type="radio"
                  name="resetTarget"
                  checked={resetTarget === 'all'}
                  onChange={() => setResetTarget('all')}
                  className="accent-rose-600"
                />
                <span className="text-xs font-bold text-stone-800">
                  Reset entire system (All roles & components)
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs cursor-pointer hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs cursor-pointer shadow-sm"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

