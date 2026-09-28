import type { CSSProperties } from 'react';
import { DEFAULT_SIDEBAR_THEME } from '../data/initialFormSchema';
import type { SidebarTheme } from '../types';

export type SidebarThemeStyles = CSSProperties & {
  [key: `--sidebar-${string}`]: string;
};

export function getSidebarThemeStyles(theme: SidebarTheme): SidebarThemeStyles {
  return {
    '--sidebar-background': theme.backgroundColor || DEFAULT_SIDEBAR_THEME.backgroundColor,
    '--sidebar-active': theme.activeMenuColor || DEFAULT_SIDEBAR_THEME.activeMenuColor,
    '--sidebar-hover': theme.hoverColor || DEFAULT_SIDEBAR_THEME.hoverColor,
    '--sidebar-text': theme.menuTextColor || DEFAULT_SIDEBAR_THEME.menuTextColor,
    '--sidebar-active-text': theme.activeTextColor || DEFAULT_SIDEBAR_THEME.activeTextColor,
    '--sidebar-icon': theme.iconColor || DEFAULT_SIDEBAR_THEME.iconColor,
    '--sidebar-divider': theme.sectionDividerColor || DEFAULT_SIDEBAR_THEME.sectionDividerColor,
    '--sidebar-badge': theme.badgeColor || DEFAULT_SIDEBAR_THEME.badgeColor,
  };
}