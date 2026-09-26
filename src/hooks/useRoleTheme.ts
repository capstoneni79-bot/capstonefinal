import { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { MasterSystemConfig, RoleVisualConfig, SupportedFontFamily } from '../types/masterConfig';
import { masterConfigService } from '../services/masterConfigService';
import { DEFAULT_ADMIN_VISUAL_CONFIG } from '../data/defaultMasterConfig';

const GOOGLE_FONTS_MAP: Record<SupportedFontFamily, string> = {
  Inter: 'Inter:wght@400;500;600;700;800',
  Roboto: 'Roboto:wght@400;500;700',
  Poppins: 'Poppins:wght@400;500;600;700;800',
  Montserrat: 'Montserrat:wght@400;500;600;700;800',
  'Open Sans': 'Open+Sans:wght@400;600;700',
  Nunito: 'Nunito:wght@400;600;700;800',
  'System Default': '',
};

function ensureGoogleFontLoaded(fontFamily: SupportedFontFamily) {
  if (typeof document === 'undefined' || fontFamily === 'System Default') return;
  const fontQuery = GOOGLE_FONTS_MAP[fontFamily];
  if (!fontQuery) return;

  const id = `da-font-${fontFamily.toLowerCase().replace(/\s+/g, '-')}`;
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap`;
    document.head.appendChild(link);
  }
}

export function useRoleTheme(role: UserRole | 'landing') {
  const [config, setConfig] = useState<MasterSystemConfig>(() => masterConfigService.getConfig());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<MasterSystemConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(masterConfigService.getConfig());
      }
    };

    window.addEventListener('da_master_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('da_master_config_updated', handleUpdate);
    };
  }, []);

  // Determine target role config:
  // super_admin & admin use config.roles.admin
  // focal uses config.roles.focal
  // agent uses config.roles.agent
  const targetKey: 'admin' | 'focal' | 'agent' =
    role === 'focal' ? 'focal' : role === 'agent' ? 'agent' : 'admin';

  const roleConfig: RoleVisualConfig = config.roles[targetKey] || DEFAULT_ADMIN_VISUAL_CONFIG;

  // Load target font family dynamically
  useEffect(() => {
    if (roleConfig.typography?.fontFamily) {
      ensureGoogleFontLoaded(roleConfig.typography.fontFamily);
    }
    if (roleConfig.typography?.pageTitle?.fontFamily) {
      ensureGoogleFontLoaded(roleConfig.typography.pageTitle.fontFamily);
    }
  }, [roleConfig.typography?.fontFamily, roleConfig.typography?.pageTitle?.fontFamily]);

  const fontStyle = {
    fontFamily:
      roleConfig.typography?.fontFamily === 'System Default'
        ? 'system-ui, -apple-system, sans-serif'
        : `'${roleConfig.typography?.fontFamily}', sans-serif`,
  };

  const pageTitleStyle = {
    fontFamily:
      roleConfig.typography?.pageTitle?.fontFamily === 'System Default'
        ? 'system-ui, -apple-system, sans-serif'
        : `'${roleConfig.typography?.pageTitle?.fontFamily || roleConfig.typography?.fontFamily}', sans-serif`,
    fontSize: `${roleConfig.typography?.pageTitle?.fontSize || 22}px`,
    fontWeight: roleConfig.typography?.pageTitle?.fontWeight || 800,
  };

  const primaryButtonStyle = {
    backgroundColor: roleConfig.colors?.buttonColor || '#00875A',
    color: '#ffffff',
    height: `${roleConfig.buttons?.height || 42}px`,
    borderRadius: `${roleConfig.buttons?.borderRadius || 10}px`,
    fontSize: `${roleConfig.buttons?.fontSize || 13}px`,
    fontWeight: roleConfig.buttons?.fontWeight || 700,
    paddingLeft: `${roleConfig.buttons?.paddingX || 16}px`,
    paddingRight: `${roleConfig.buttons?.paddingX || 16}px`,
  };

  const sidebarStyle = {
    backgroundColor: roleConfig.sidebar?.backgroundColor || roleConfig.colors?.sidebarColor || '#003C2F',
    width: `${roleConfig.sidebar?.width || 288}px`,
    color: roleConfig.sidebar?.textColor || '#cbd5e1',
  };

  const getCustomText = (
    category: 'menuLabels' | 'pageTitles' | 'sectionTitles' | 'buttonLabels' | 'helperTexts' | 'emptyStateMessages',
    key: string,
    fallback: string
  ): string => {
    return roleConfig.text?.[category]?.[key] || fallback;
  };

  return {
    config,
    roleConfig,
    colors: roleConfig.colors,
    typography: roleConfig.typography,
    buttons: roleConfig.buttons,
    modals: roleConfig.modals,
    sidebar: roleConfig.sidebar,
    layout: roleConfig.layout,
    background: roleConfig.background,
    text: roleConfig.text,
    features: roleConfig.features,
    branding: config.globalBranding,
    chatbot: config.chatbotConfig,
    fontStyle,
    pageTitleStyle,
    primaryButtonStyle,
    sidebarStyle,
    getCustomText,
  };
}

