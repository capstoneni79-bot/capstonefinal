import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  MapPin,
  Database,
  Printer,
  Users,
  Truck,
  Shield,
  BookOpen,
  MessageSquare,
  LogOut,
  Plus,
  X,
  Palette,
  FileEdit,
  User,
  Globe,
  Camera,
  Activity,
  CheckCircle2,
  Wifi,
  WifiOff,
  Key,
  Server,
  Sliders,
  Type,
  Square,
  Maximize2,
  Layout,
  Bot,
  Eye,
  History,
  FileSpreadsheet,
  Bell,
  Compass,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SidebarTheme, UserAccount, UserRole } from '../../types';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { SealMunicipality, useOfficialLogos } from './OfficialSeals';
import { storageService } from '../../services/storageService';
import { settingsApi } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { getSidebarThemeStyles } from '../../utils/sidebarThemeStyles';

interface SidebarProps {
  currentUser: UserAccount | null;
  currentRole: UserRole | 'landing';
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onSelectRole: (role: UserRole | 'landing', specificUser?: UserAccount) => void;
  unreadCount: number;
  readyTakeoffCount?: number;
  onLogout: () => void;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  currentRole,
  activeTab,
  onSelectTab,
  onSelectRole,
  unreadCount,
  readyTakeoffCount = 0,
  onLogout,
  onClose,
  onOpenLogin,
}) => {
  const { isOnline, isSimulatedOffline, toggleSimulateOffline, pendingQueueCount } = useOfflineStatus();
  const { language, setLanguage, t } = useLanguage();

  const [theme, setTheme] = useState<SidebarTheme>(() => storageService.getSidebarTheme());
  const officialLogos = useOfficialLogos();

  // Resolve single primary logo: theme custom logo > official logos > fallback seal
  const singleLogoUrl =
    theme.logoUrl ||
    officialLogos['logo-sidebar'] ||
    officialLogos['logo-system'] ||
    officialLogos['logo-municipal'] ||
    officialLogos['logo-da'];

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<SidebarTheme>;
      if (customEvent.detail) {
        setTheme(current => ({ ...current, ...customEvent.detail }));
      } else {
        setTheme(storageService.getSidebarTheme());
      }
    };

    window.addEventListener('da_sidebar_theme_change', handleThemeChange);
    settingsApi.getSidebarTheme()
      .then(savedTheme => storageService.saveSidebarTheme(savedTheme))
      .catch(() => {});
    return () => {
      window.removeEventListener('da_sidebar_theme_change', handleThemeChange);
    };
  }, []);

  const handleLanguageChange = (lang: 'en' | 'ceb' | 'fil') => {
    setLanguage(lang);
  };

  const isAgent = currentRole === 'agent' || currentUser?.role === 'agent';
  const isSuperAdmin = currentRole === 'super_admin' || currentUser?.role === 'super_admin';
  const isAdmin = currentRole === 'admin' || currentUser?.role === 'admin';

  return (
    <div
      className="sidebar-theme-root w-full h-full flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none custom-sidebar-scroll transition-colors duration-200"
      style={getSidebarThemeStyles(theme)}
    >
      {/* Top Container */}
      <div className="p-4 pt-4 space-y-3.5 flex-1">
        {/* Header: Official Logo & Municipal Registry Brand */}
        <div className="flex items-center justify-between gap-3 pb-1 border-b" style={{ borderColor: 'var(--sidebar-divider)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group shrink-0">
              {singleLogoUrl ? (
                <img
                  src={singleLogoUrl}
                  alt="Hinunangan Swine Registry Logo"
                  className={`w-10 h-10 object-contain border shadow-sm transition ${
                    theme.logoShape === 'square'
                      ? 'rounded-lg'
                      : theme.logoShape === 'rounded'
                      ? 'rounded-2xl'
                      : 'rounded-full'
                  }`}
                  style={{
                    borderColor: 'var(--sidebar-divider)',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center">
                  <SealMunicipality className="w-10 h-10 shadow-sm" />
                </div>
              )}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab('sidebar_color');
                  }}
                  title="Change Sidebar Logo in Sidebar Configuration"
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md border border-white/40 transition opacity-0 group-hover:opacity-100 cursor-pointer scale-90 hover:scale-100"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="font-extrabold text-[13.5px] leading-tight tracking-tight truncate"
                style={{ color: theme.activeTextColor || '#ffffff' }}
              >
                Hinunangan Swine Registry
              </h2>
              <p
                className="text-[11px] font-medium leading-tight mt-0.5 opacity-80 truncate"
                style={{ color: theme.menuTextColor || '#cbd5e1' }}
              >
                {t('header_location')} • DA-MAO
              </p>
            </div>
          </div>

          {/* Mobile Close Button (Only visible in mobile slide-out drawer) */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-white/10 transition cursor-pointer text-slate-300 shrink-0"
            title={t('nav_close_sidebar')}
            aria-label="Close sidebar drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Card */}
        <div
          onClick={() => {
            if (!currentUser) onOpenLogin();
            else if (isAgent) onSelectTab('account');
          }}
          className="border rounded-2xl p-3 flex items-center gap-3 shadow-inner transition cursor-pointer hover:brightness-110 active:scale-[0.99]"
          style={{
            backgroundColor: 'var(--sidebar-hover)',
            borderColor: 'var(--sidebar-divider)',
          }}
          title={currentUser ? currentUser.name : 'Click to Login'}
        >
          <div
            className="w-9 h-9 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 shadow-md"
            style={{
              backgroundColor: isAgent ? 'var(--sidebar-badge)' : 'var(--sidebar-active)',
              color: 'var(--sidebar-active-text)',
            }}
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'E'}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="font-bold text-xs leading-snug truncate"
              style={{ color: theme.activeTextColor || '#ffffff' }}
            >
              {currentUser?.name || (isAgent ? t('role_agent') : 'Engr. Arnaldo M. Valdez')}
            </div>
            <div
              className="text-[11px] leading-snug truncate mt-0.5 opacity-85"
              style={{ color: theme.menuTextColor || '#cbd5e1' }}
            >
              {currentUser
                ? currentUser.role === 'admin'
                  ? t('role_admin_full')
                  : currentUser.role === 'focal'
                  ? `${t('role_focal')} - Brgy. ${currentUser.assignedBarangay || 'Field'}`
                  : t('role_agent_full')
                : t('role_admin_full')}
            </div>
          </div>
        </div>

        {/* AGENT-SPECIFIC MINIMAL NAVIGATION */}
        {isAgent ? (
          <div className="space-y-1.5 pt-1">
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400/80 flex items-center justify-between">
              <span>{t('nav_trader_portal')}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">AGENT</span>
            </div>

            {/* 1. Ready-to-Sell Swine */}
            <button
              type="button"
              onClick={() => onSelectTab('ready_to_sell')}
              className="sidebar-theme-item w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer"
              data-active={activeTab === 'ready_to_sell' || activeTab === 'dashboard'}
              style={{
                backgroundColor: activeTab === 'ready_to_sell' || activeTab === 'dashboard' ? 'var(--sidebar-active)' : undefined,
                color: activeTab === 'ready_to_sell' || activeTab === 'dashboard' ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              }}
            >
              <div className="flex items-center gap-3 truncate">
                <Truck className="w-4 h-4 shrink-0" style={{ color: 'var(--sidebar-icon)' }} />
                <span className="truncate">{t('nav_ready_to_sell')}</span>
              </div>
              {readyTakeoffCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full font-black text-[10px]" style={{ backgroundColor: 'var(--sidebar-badge)', color: 'var(--sidebar-active-text)' }}>
                  {readyTakeoffCount}
                </span>
              )}
            </button>

            {/* 2. Messages */}
            <button
              type="button"
              onClick={() => onSelectTab('messages')}
              className="sidebar-theme-item w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer"
              data-active={activeTab === 'messages'}
              style={{
                backgroundColor: activeTab === 'messages' ? 'var(--sidebar-active)' : undefined,
                color: activeTab === 'messages' ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              }}
            >
              <div className="flex items-center gap-3 truncate">
                <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'var(--sidebar-icon)' }} />
                <span className="truncate">{t('nav_messages')}</span>
              </div>
              {unreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 3. My Account */}
            <button
              type="button"
              onClick={() => onSelectTab('account')}
              className="sidebar-theme-item w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer"
              data-active={activeTab === 'account'}
              style={{
                backgroundColor: activeTab === 'account' ? 'var(--sidebar-active)' : undefined,
                color: activeTab === 'account' ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
              }}
            >
              <User className="w-4 h-4 shrink-0" style={{ color: 'var(--sidebar-icon)' }} />
              <span className="truncate">{t('nav_my_account')}</span>
            </button>
          </div>
        ) : (
          /* ADMIN & FOCAL PERSON NAVIGATION */
          <>
            {/* Prominent Action Button for Registration */}
            <button
              type="button"
              onClick={() => onSelectTab('add_swine')}
              className="w-full py-2.5 px-3.5 rounded-xl border text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-xs hover:brightness-110 active:scale-[0.99]"
              style={{
                backgroundColor: 'var(--sidebar-hover)',
                borderColor: 'var(--sidebar-divider)',
              }}
            >
              <Plus className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{t('nav_add_swine')}</span>
            </button>

            {/* Navigation Menu List */}
            <div className="space-y-1 pt-0.5">
              {/* 1. Dashboard */}
              <button
                type="button"
                onClick={() => onSelectTab('dashboard')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'dashboard' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'dashboard' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <LayoutGrid
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'dashboard' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_dashboard')}</span>
              </button>

              {/* 2. GIS Swine Map */}
              <button
                type="button"
                onClick={() => onSelectTab('gis')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'gis' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'gis' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <MapPin
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'gis' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_gis_map')}</span>
              </button>

              {/* 3. Swine Records */}
              <button
                type="button"
                onClick={() => onSelectTab('records')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'records' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'records' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <Database
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'records' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_records')}</span>
              </button>

              {/* 4. Print Official Reports */}
              <button
                type="button"
                onClick={() => onSelectTab('certificate')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'certificate' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'certificate' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <Printer
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'certificate' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_reports')}</span>
              </button>

              {/* 5. Ready for Take-Off */}
              <button
                type="button"
                onClick={() => onSelectTab('takeoff')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'takeoff' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'takeoff' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  <Truck
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'takeoff' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_takeoff')}</span>
                </div>
                {readyTakeoffCount > 0 && (
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full text-white font-bold text-[10px]"
                    style={{ backgroundColor: theme.badgeColor || '#2563eb' }}
                  >
                    {readyTakeoffCount}
                  </span>
                )}
              </button>

              {/* 6. Barangay Biosecurity */}
              <button
                type="button"
                onClick={() => onSelectTab('biosecurity')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'biosecurity' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'biosecurity' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <Shield
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'biosecurity' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_biosecurity')}</span>
              </button>

              {/* 7. ASF Legal Decrees (Hidden for Focal Accounts) */}
              {currentUser?.role !== 'focal' && (
                <button
                  type="button"
                  onClick={() => onSelectTab('asf_ordinance')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                  style={{
                    backgroundColor: activeTab === 'asf_ordinance' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                    color: activeTab === 'asf_ordinance' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                  }}
                >
                  <BookOpen
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'asf_ordinance' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_asf_decrees')}</span>
                </button>
              )}

              {/* 8. Messages */}
              <button
                type="button"
                onClick={() => onSelectTab('messages')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'messages' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'messages' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'messages' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_messages')}</span>
                </div>
                {unreadCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* 9. Manage Barangay (Admin & Super Admin) */}
              {(isAdmin || isSuperAdmin) && (
                <button
                  type="button"
                  onClick={() => onSelectTab('barangays')}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                  style={{
                    backgroundColor: activeTab === 'barangays' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                    color: activeTab === 'barangays' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                  }}
                >
                  <MapPin
                    className="w-4 h-4 shrink-0"
                    style={{
                      color: activeTab === 'barangays' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                    }}
                  />
                  <span className="truncate">{t('nav_barangays')}</span>
                </button>
              )}

              {/* 10. My Account (For Focal Person & Admin) */}
              <button
                type="button"
                onClick={() => onSelectTab('account')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                style={{
                  backgroundColor: activeTab === 'account' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                  color: activeTab === 'account' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                }}
              >
                <User
                  className="w-4 h-4 shrink-0"
                  style={{
                    color: activeTab === 'account' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                  }}
                />
                <span className="truncate">{t('nav_my_account')}</span>
              </button>

              {/* ───────────────────── SYSTEM ADMINISTRATION ───────────────────── */}
              {(isSuperAdmin || isAdmin) && (
                <div
                  className="pt-2.5 mt-2.5 border-t space-y-1"
                  style={{ borderColor: theme.sectionDividerColor || '#1e3a8a' }}
                >
                  <div
                    className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-between opacity-70"
                    style={{ color: theme.menuTextColor || '#94a3b8' }}
                  >
                    <span>{t('nav_system_admin')}</span>
                    {isSuperAdmin && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8.5px] font-black tracking-normal">
                        MASTER
                      </span>
                    )}
                  </div>

                  {/* 11. Landing Page CMS (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => onSelectTab('landing_manager')}
                      title="Landing Page CMS"
                      className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                      style={{
                        backgroundColor:
                          activeTab === 'landing_manager' || activeTab === 'landing_settings'
                            ? theme.activeMenuColor || '#2563eb'
                            : 'transparent',
                        color:
                          activeTab === 'landing_manager' || activeTab === 'landing_settings'
                            ? theme.activeTextColor || '#ffffff'
                            : theme.menuTextColor || '#cbd5e1',
                      }}
                    >
                      <Globe
                        className="w-4 h-4 shrink-0"
                        style={{
                          color:
                            activeTab === 'landing_manager' || activeTab === 'landing_settings'
                              ? theme.activeTextColor || '#ffffff'
                              : theme.iconColor || '#93c5fd',
                        }}
                      />
                      <span className="flex-1 min-w-0 truncate">Landing Page CMS</span>
                    </button>
                  )}

                  {/* 12. Registry Form Customization (Both Admin & Super Admin) */}
                  <button
                    type="button"
                    onClick={() => onSelectTab('form_customizer')}
                    title={t('nav_form_customizer')}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                    style={{
                      backgroundColor: activeTab === 'form_customizer' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                      color: activeTab === 'form_customizer' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                    }}
                  >
                    <FileEdit
                      className="w-4 h-4 shrink-0"
                      style={{
                        color: activeTab === 'form_customizer' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                      }}
                    />
                    <span className="flex-1 min-w-0 truncate">Registry Form Customization</span>
                  </button>

                  {/* 13. Sidebar Configuration (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => onSelectTab('sidebar_color')}
                      title="Sidebar Configuration"
                      className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                      style={{
                        backgroundColor: activeTab === 'sidebar_color' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                        color: activeTab === 'sidebar_color' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                      }}
                    >
                      <Palette
                        className="w-4 h-4 shrink-0"
                        style={{
                          color: activeTab === 'sidebar_color' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                        }}
                      />
                      <span className="flex-1 min-w-0 truncate">Sidebar Configuration</span>
                    </button>
                  )}

                  {/* 14. API Configuration (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => onSelectTab('api_config')}
                      title="API Configuration"
                      className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                      style={{
                        backgroundColor: activeTab === 'api_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                        color: activeTab === 'api_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                      }}
                    >
                      <Key
                        className="w-4 h-4 shrink-0"
                        style={{
                          color: activeTab === 'api_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                        }}
                      />
                      <span className="flex-1 min-w-0 truncate">API Configuration</span>
                    </button>
                  )}

                  {/* 15. Database Configuration (SUPER ADMIN ONLY) */}
                  {isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => onSelectTab('database_config')}
                      title="Database Configuration"
                      className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                      style={{
                        backgroundColor: activeTab === 'database_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                        color: activeTab === 'database_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                      }}
                    >
                      <Server
                        className="w-4 h-4 shrink-0"
                        style={{
                          color: activeTab === 'database_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                        }}
                      />
                      <span className="flex-1 min-w-0 truncate">Database Configuration</span>
                    </button>
                  )}

                  {/* 16. User Accounts (SUPER ADMIN & ADMIN) */}
                  {(isSuperAdmin || isAdmin) && (
                    <button
                      type="button"
                      onClick={() => onSelectTab('accounts')}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                      style={{
                        backgroundColor: activeTab === 'accounts' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                        color: activeTab === 'accounts' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                      }}
                    >
                      <Users
                        className="w-4 h-4 shrink-0"
                        style={{
                          color: activeTab === 'accounts' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                        }}
                      />
                      <span className="truncate">User Accounts</span>
                    </button>
                  )}

                  {/* ───────────────────── MASTER CONFIGURATION SUITE (SUPER ADMIN ONLY) ───────────────────── */}
                  {isSuperAdmin && (
                    <>
                      <div
                        className="pt-2 mt-2 border-t px-3.5 py-1 text-[9.5px] font-black uppercase tracking-wider flex items-center opacity-65"
                        style={{
                          borderColor: theme.sectionDividerColor || '#1e3a8a',
                          color: theme.menuTextColor || '#94a3b8',
                        }}
                      >
                        <span>Master Customization</span>
                      </div>

                      {/* System Appearance */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('system_appearance')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'system_appearance' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'system_appearance' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Palette
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'system_appearance' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">System Appearance</span>
                      </button>

                      {/* Role Page Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('role_page_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'role_page_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'role_page_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Layers
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'role_page_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Role Page Configuration</span>
                      </button>

                      {/* Feature Visibility */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('feature_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'feature_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'feature_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Eye
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'feature_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Feature Configuration</span>
                      </button>

                      {/* Component Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('component_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'component_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'component_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Square
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'component_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Component Configuration</span>
                      </button>

                      {/* Chatbot Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('chatbot_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'chatbot_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'chatbot_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Bot
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'chatbot_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Chatbot Configuration</span>
                      </button>

                      {/* Navigation Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('nav_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'nav_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'nav_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Compass
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'nav_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Navigation Configuration</span>
                      </button>

                      {/* Notification Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('notification_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'notification_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'notification_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Bell
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'notification_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Notification Configuration</span>
                      </button>

                      {/* Popup & Modal Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('popup_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'popup_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'popup_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Maximize2
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'popup_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Popup & Modal Configuration</span>
                      </button>

                      {/* Typography Configuration */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('typography_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'typography_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'typography_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Type
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'typography_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Typography</span>
                      </button>

                      {/* Background & Branding */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('branding_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'branding_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'branding_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Sparkles
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'branding_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Background & Branding</span>
                      </button>

                      {/* Layout & Responsive */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('layout_config')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'layout_config' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'layout_config' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <Layout
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'layout_config' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Layout & Responsive</span>
                      </button>

                      {/* Configuration History */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('version_history')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'version_history' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'version_history' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <History
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'version_history' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Configuration History</span>
                      </button>

                      {/* Audit Logs */}
                      <button
                        type="button"
                        onClick={() => onSelectTab('audit_logs')}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition cursor-pointer hover:bg-white/10"
                        style={{
                          backgroundColor: activeTab === 'audit_logs' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                          color: activeTab === 'audit_logs' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
                        }}
                      >
                        <FileSpreadsheet
                          className="w-4 h-4 shrink-0"
                          style={{
                            color: activeTab === 'audit_logs' ? theme.activeTextColor || '#ffffff' : theme.iconColor || '#93c5fd',
                          }}
                        />
                        <span className="truncate">Audit Logs</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Footer Area */}
      <div
        className="p-4 pt-3 pb-4 border-t space-y-3 shrink-0"
        style={{
          backgroundColor: 'var(--sidebar-background)',
          borderColor: 'var(--sidebar-divider)',
        }}
      >
        {/* 3-Way Language Selector */}
        <div className="space-y-1.5">
          <div
            className="flex items-center justify-between text-xs px-0.5 opacity-80"
            style={{ color: theme.menuTextColor || '#cbd5e1' }}
          >
            <span className="font-semibold">{t('common_language')}</span>
            <span className="text-[11px] font-bold text-emerald-400">
              {language === 'en' ? 'English' : language === 'ceb' ? 'Bisaya' : 'Tagalog'}
            </span>
          </div>
          <div
            className="p-1 rounded-xl flex items-center gap-1 border"
            style={{
              backgroundColor: theme.hoverColor || '#0d1733',
              borderColor: theme.sectionDividerColor || '#1e3a8a',
            }}
          >
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                language === 'en'
                  ? 'text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: language === 'en' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                color: language === 'en' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('ceb')}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                language === 'ceb'
                  ? 'text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: language === 'ceb' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                color: language === 'ceb' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
              }}
            >
              CEB
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('fil')}
              className={`flex-1 py-1 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                language === 'fil'
                  ? 'text-white shadow-xs'
                  : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: language === 'fil' ? theme.activeMenuColor || '#2563eb' : 'transparent',
                color: language === 'fil' ? theme.activeTextColor || '#ffffff' : theme.menuTextColor || '#cbd5e1',
              }}
            >
              FIL
            </button>
          </div>
        </div>

        {/* Online / Synced Status */}
        <div className="flex items-center justify-between text-xs px-1 pt-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline && !isSimulatedOffline
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span
              className="font-semibold text-xs opacity-90 truncate"
              style={{ color: theme.activeTextColor || '#ffffff' }}
            >
              {isOnline && !isSimulatedOffline ? t('common_online') : t('common_offline')}
            </span>
          </div>
          <span
            className="font-medium text-[11px] opacity-75 shrink-0"
            style={{ color: theme.iconColor || '#93c5fd' }}
          >
            {pendingQueueCount > 0 ? `${pendingQueueCount} queued` : t('common_synced')}
          </span>
        </div>

        {/* Simulate Offline Mode Toggle */}
        <div
          className="p-2 rounded-xl border flex items-center justify-between gap-2"
          style={{
            backgroundColor: isSimulatedOffline ? 'rgba(245, 158, 11, 0.12)' : theme.hoverColor || '#0d1733',
            borderColor: isSimulatedOffline ? 'rgba(245, 158, 11, 0.35)' : theme.sectionDividerColor || '#1e3a8a',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isSimulatedOffline ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p
                className="text-[11px] font-bold leading-none truncate"
                style={{ color: isSimulatedOffline ? '#fbbf24' : theme.activeTextColor || '#ffffff' }}
              >
                {t('sync_simulate_offline_toggle', 'Simulate Offline')}
              </p>
              <p
                className="text-[9.5px] opacity-75 leading-tight mt-0.5 truncate"
                style={{ color: theme.menuTextColor || '#cbd5e1' }}
              >
                {isSimulatedOffline ? 'Offline Testing Active' : 'Normal Connectivity'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSimulateOffline();
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isSimulatedOffline ? 'bg-amber-500' : 'bg-stone-700'
            }`}
            title="Toggle simulated offline mode for field testing"
            role="switch"
            aria-checked={isSimulatedOffline}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isSimulatedOffline ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Sign Out Action */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-2 text-xs font-bold py-2 px-3 rounded-xl transition cursor-pointer hover:bg-white/10 active:scale-[0.99]"
            style={{ color: theme.menuTextColor || '#cbd5e1' }}
          >
            <LogOut className="w-4 h-4 shrink-0 text-red-400" />
            <span className="truncate">{t('nav_sign_out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
