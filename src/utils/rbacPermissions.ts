import { UserRole } from '../types';

/**
 * DA Hinunangan Centralized Role-Based Access Control (RBAC)
 * Defines permissible navigation items and operational capabilities for each role.
 */

export type NavigationItemId =
  // Main Navigation (1-10)
  | 'dashboard'
  | 'gis'
  | 'records'
  | 'certificate'
  | 'takeoff'
  | 'biosecurity'
  | 'asf_ordinance'
  | 'messages'
  | 'barangays'
  | 'account'
  // System Administration (11-16)
  | 'landing_manager'
  | 'form_customizer'
  | 'sidebar_color'
  | 'api_config'
  | 'database_config'
  | 'accounts'
  // Super Admin Master Configuration Modules
  | 'system_appearance'
  | 'role_page_config'
  | 'feature_config'
  | 'component_config'
  | 'chatbot_config'
  | 'nav_config'
  | 'notification_config'
  | 'popup_config'
  | 'button_config'
  | 'typography_config'
  | 'branding_config'
  | 'layout_config'
  | 'backup_config'
  | 'version_history'
  | 'audit_logs'
  // Action/Secondary Tabs
  | 'add_swine'
  | 'marketing_alerts';

/**
 * EXACT SIDEBAR NAVIGATION PERMISSIONS & ORDERING
 */
export const SIDEBAR_PERMISSIONS: Record<UserRole, NavigationItemId[]> = {
  // 1. SUPER ADMIN: ALL ITEMS IN EXACT ORDER
  super_admin: [
    // Main Navigation (1-10)
    'dashboard',
    'gis',
    'records',
    'certificate',
    'takeoff',
    'biosecurity',
    'asf_ordinance',
    'messages',
    'barangays',
    'account',
    // System Administration (11-16)
    'landing_manager',
    'form_customizer',
    'sidebar_color',
    'api_config',
    'database_config',
    'accounts',
    // Super Admin Master Configuration Modules
    'system_appearance',
    'role_page_config',
    'feature_config',
    'component_config',
    'chatbot_config',
    'nav_config',
    'notification_config',
    'popup_config',
    'typography_config',
    'branding_config',
    'layout_config',
    'backup_config',
    'audit_logs',
  ],

  // 2. ADMIN: 10 MAIN + REGISTRY FORM CUSTOMIZATION + USER ACCOUNTS
  admin: [
    // Main Navigation (1-10)
    'dashboard',
    'gis',
    'records',
    'certificate',
    'takeoff',
    'biosecurity',
    'asf_ordinance',
    'messages',
    'barangays',
    'account',
    // Allowed System Administration (11-12)
    'form_customizer',
    'accounts',
  ],

  // 3. FOCAL PERSON: BARANGAY-LEVEL MONITORING
  focal: [
    'dashboard',
    'gis',
    'records',
    'certificate',
    'takeoff',
    'biosecurity',
    'messages',
    'account',
  ],

  // 4. AGENT / BUYER: LOGISTICS & MOVEMENT
  agent: [
    'dashboard',
    'gis',
    'records',
    'certificate',
    'takeoff',
    'messages',
    'account',
  ],
};

/**
 * System Administration items exclusively reserved for Super Admin
 */
export const SUPER_ADMIN_ONLY_TABS: NavigationItemId[] = [
  'landing_manager',
  'sidebar_color',
  'api_config',
  'database_config',
  'system_appearance',
  'role_page_config',
  'feature_config',
  'component_config',
  'chatbot_config',
  'nav_config',
  'notification_config',
  'popup_config',
  'button_config',
  'typography_config',
  'branding_config',
  'layout_config',
  'backup_config',
  'version_history',
  'audit_logs',
];

/**
 * Check if a role has access to a specific navigation item or tab
 */
export function hasPermission(role: UserRole | 'landing' | undefined, item: string): boolean {
  if (!role || role === 'landing') return false;
  if (role === 'super_admin') return true;
  // Non-sidebar operational views accessible to authenticated users
  if (item === 'add_swine' || item === 'marketing_alerts') return true;

  const allowedItems = SIDEBAR_PERMISSIONS[role as UserRole];
  if (!allowedItems) return false;
  return allowedItems.includes(item as NavigationItemId);
}

/**
 * Check if a tab is strictly a Super Admin module
 */
export function isSuperAdminOnlyTab(tab: string): boolean {
  return SUPER_ADMIN_ONLY_TABS.includes(tab as NavigationItemId);
}

