import {
  MasterSystemConfig,
  RoleVisualConfig,
  ConfigAuditLogEntry,
  ConfigVersionEntry,
  ProposedConfigChange,
} from '../types/masterConfig';
import {
  DEFAULT_MASTER_CONFIG,
  DEFAULT_ADMIN_VISUAL_CONFIG,
  DEFAULT_FOCAL_VISUAL_CONFIG,
  DEFAULT_AGENT_VISUAL_CONFIG,
} from '../data/defaultMasterConfig';

const STORAGE_KEY_PUBLISHED = 'da_master_system_config_published';
const STORAGE_KEY_DRAFT = 'da_master_system_config_draft';
const STORAGE_KEY_VERSIONS = 'da_master_config_versions';
const STORAGE_KEY_AUDIT_LOGS = 'da_master_config_audit_logs';

class MasterConfigService {
  private memoryPublished: MasterSystemConfig;
  private memoryDraft: MasterSystemConfig;
  private memoryVersions: ConfigVersionEntry[];
  private memoryAuditLogs: ConfigAuditLogEntry[];

  constructor() {
    this.memoryPublished = this.loadFromStorage(STORAGE_KEY_PUBLISHED, DEFAULT_MASTER_CONFIG);
    this.memoryDraft = this.loadFromStorage(STORAGE_KEY_DRAFT, this.memoryPublished);
    this.memoryVersions = this.loadFromStorage(STORAGE_KEY_VERSIONS, [
      {
        version: 1,
        publishedAt: new Date().toISOString(),
        publishedBy: 'System Super Admin',
        summary: 'Initial System Baseline Configuration',
        snapshot: DEFAULT_MASTER_CONFIG,
      },
    ]);
    this.memoryAuditLogs = this.loadFromStorage(STORAGE_KEY_AUDIT_LOGS, [
      {
        id: 'log-init-1',
        who: 'SUPER ADMIN',
        what: 'System Initialized with Standard DA Hinunangan Theme',
        oldValue: 'None',
        newValue: 'Standard Baseline',
        targetRole: 'All Roles',
        targetComponent: 'System Theme',
        timestamp: new Date().toISOString(),
      },
    ]);

    // Initial background fetch from API
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncWithBackend().catch(() => {});
      }, 100);
    }
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...fallback, ...parsed };
      }
    } catch (e) {
      console.warn(`Error loading ${key} from storage:`, e);
    }
    return fallback;
  }

  private saveToStorage(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn(`Error saving ${key} to storage:`, e);
    }
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const res = await fetch('/api/config/master');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.config) {
          this.memoryPublished = json.config;
          this.saveToStorage(STORAGE_KEY_PUBLISHED, this.memoryPublished);
          if (json.versions) {
            this.memoryVersions = json.versions;
            this.saveToStorage(STORAGE_KEY_VERSIONS, this.memoryVersions);
          }
          if (json.auditLogs) {
            this.memoryAuditLogs = json.auditLogs;
            this.saveToStorage(STORAGE_KEY_AUDIT_LOGS, this.memoryAuditLogs);
          }
          this.notifyConfigUpdated();
        }
      }
    } catch {
      // Local storage fallback operates normally
    }
  }

  public getConfig(): MasterSystemConfig {
    return { ...this.memoryPublished };
  }

  public getDraftConfig(): MasterSystemConfig {
    return { ...this.memoryDraft };
  }

  public getRoleConfig(role: 'admin' | 'focal' | 'agent'): RoleVisualConfig {
    return this.memoryPublished.roles[role] || DEFAULT_ADMIN_VISUAL_CONFIG;
  }

  public getDraftRoleConfig(role: 'admin' | 'focal' | 'agent'): RoleVisualConfig {
    return this.memoryDraft.roles[role] || DEFAULT_ADMIN_VISUAL_CONFIG;
  }

  public saveDraft(draft: MasterSystemConfig): void {
    this.memoryDraft = { ...draft };
    this.saveToStorage(STORAGE_KEY_DRAFT, this.memoryDraft);

    // Sync draft with backend non-blockingly
    fetch('/api/config/master/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft }),
    }).catch(() => {});

    this.notifyDraftUpdated();
  }

  public async publishConfig(
    updatedBy: string = 'Super Admin',
    summary: string = 'Applied system configuration updates'
  ): Promise<MasterSystemConfig> {
    const nextVersion = (this.memoryPublished.version || 1) + 1;
    const now = new Date().toISOString();

    const published: MasterSystemConfig = {
      ...this.memoryDraft,
      version: nextVersion,
      updatedAt: now,
      updatedBy,
    };

    // Record audit log
    const auditEntry: ConfigAuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      who: updatedBy,
      what: summary,
      oldValue: `v${this.memoryPublished.version}`,
      newValue: `v${nextVersion}`,
      targetRole: 'Master Configuration',
      targetComponent: 'Full System Theme',
      timestamp: now,
    };

    this.memoryAuditLogs.unshift(auditEntry);
    this.saveToStorage(STORAGE_KEY_AUDIT_LOGS, this.memoryAuditLogs);

    // Record version snapshot
    const versionEntry: ConfigVersionEntry = {
      version: nextVersion,
      publishedAt: now,
      publishedBy: updatedBy,
      summary,
      snapshot: JSON.parse(JSON.stringify(published)),
    };

    this.memoryVersions.unshift(versionEntry);
    this.saveToStorage(STORAGE_KEY_VERSIONS, this.memoryVersions);

    // Set published
    this.memoryPublished = published;
    this.saveToStorage(STORAGE_KEY_PUBLISHED, this.memoryPublished);

    // Reset draft to match published
    this.memoryDraft = { ...published };
    this.saveToStorage(STORAGE_KEY_DRAFT, this.memoryDraft);

    // Post to backend
    try {
      await fetch('/api/config/master/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'super_admin',
        },
        body: JSON.stringify({
          config: published,
          summary,
          updatedBy,
        }),
      });
    } catch (e) {
      console.warn('Backend sync failed, stored in browser:', e);
    }

    this.notifyConfigUpdated();
    return this.memoryPublished;
  }

  public discardDraft(): MasterSystemConfig {
    this.memoryDraft = JSON.parse(JSON.stringify(this.memoryPublished));
    this.saveToStorage(STORAGE_KEY_DRAFT, this.memoryDraft);
    this.notifyDraftUpdated();
    return this.memoryDraft;
  }

  public resetRoleToDefault(role: 'admin' | 'focal' | 'agent', resetBy: string = 'Super Admin'): void {
    const defaultRoleConfig =
      role === 'admin'
        ? DEFAULT_ADMIN_VISUAL_CONFIG
        : role === 'focal'
        ? DEFAULT_FOCAL_VISUAL_CONFIG
        : DEFAULT_AGENT_VISUAL_CONFIG;

    this.memoryDraft.roles[role] = JSON.parse(JSON.stringify(defaultRoleConfig));
    this.saveDraft(this.memoryDraft);

    this.addAuditLog({
      who: resetBy,
      what: `Reset ${role.toUpperCase()} Visual Configuration to Factory Defaults`,
      oldValue: 'Customized Values',
      newValue: 'System Defaults',
      targetRole: role.toUpperCase(),
      targetComponent: 'Visual Theme',
    });
  }

  public resetSectionToDefault(
    section: 'sidebar' | 'typography' | 'buttons' | 'modals' | 'layout' | 'background' | 'branding' | 'chatbot' | 'all',
    targetRole?: 'admin' | 'focal' | 'agent',
    resetBy: string = 'Super Admin'
  ): void {
    if (section === 'all') {
      this.memoryDraft = JSON.parse(JSON.stringify(DEFAULT_MASTER_CONFIG));
    } else if (section === 'branding') {
      this.memoryDraft.globalBranding = JSON.parse(JSON.stringify(DEFAULT_MASTER_CONFIG.globalBranding));
    } else if (section === 'chatbot') {
      this.memoryDraft.chatbotConfig = JSON.parse(JSON.stringify(DEFAULT_MASTER_CONFIG.chatbotConfig));
    } else if (targetRole) {
      const defaultRole =
        targetRole === 'admin'
          ? DEFAULT_ADMIN_VISUAL_CONFIG
          : targetRole === 'focal'
          ? DEFAULT_FOCAL_VISUAL_CONFIG
          : DEFAULT_AGENT_VISUAL_CONFIG;

      if (section === 'sidebar') this.memoryDraft.roles[targetRole].sidebar = JSON.parse(JSON.stringify(defaultRole.sidebar));
      else if (section === 'typography') this.memoryDraft.roles[targetRole].typography = JSON.parse(JSON.stringify(defaultRole.typography));
      else if (section === 'buttons') this.memoryDraft.roles[targetRole].buttons = JSON.parse(JSON.stringify(defaultRole.buttons));
      else if (section === 'modals') this.memoryDraft.roles[targetRole].modals = JSON.parse(JSON.stringify(defaultRole.modals));
      else if (section === 'layout') this.memoryDraft.roles[targetRole].layout = JSON.parse(JSON.stringify(defaultRole.layout));
      else if (section === 'background') this.memoryDraft.roles[targetRole].background = JSON.parse(JSON.stringify(defaultRole.background));
    }

    this.saveDraft(this.memoryDraft);

    this.addAuditLog({
      who: resetBy,
      what: `Reset ${section} configuration to default${targetRole ? ` for ${targetRole.toUpperCase()}` : ''}`,
      oldValue: 'Custom Value',
      newValue: 'Factory Default',
      targetRole: targetRole || 'System-wide',
      targetComponent: section,
    });
  }

  public getVersions(): ConfigVersionEntry[] {
    return [...this.memoryVersions];
  }

  public async restoreVersion(
    versionNum: number,
    restoredBy: string = 'Super Admin'
  ): Promise<MasterSystemConfig | null> {
    const targetVersion = this.memoryVersions.find(v => v.version === versionNum);
    if (!targetVersion || !targetVersion.snapshot) return null;

    const restoredSnapshot = JSON.parse(JSON.stringify(targetVersion.snapshot));
    const nextVersion = (this.memoryPublished.version || 1) + 1;
    const now = new Date().toISOString();

    restoredSnapshot.version = nextVersion;
    restoredSnapshot.updatedAt = now;
    restoredSnapshot.updatedBy = `${restoredBy} (Restored from v${versionNum})`;

    this.memoryPublished = restoredSnapshot;
    this.memoryDraft = JSON.parse(JSON.stringify(restoredSnapshot));
    this.saveToStorage(STORAGE_KEY_PUBLISHED, this.memoryPublished);
    this.saveToStorage(STORAGE_KEY_DRAFT, this.memoryDraft);

    this.addAuditLog({
      who: restoredBy,
      what: `Restored Configuration from Version v${versionNum}`,
      oldValue: `v${this.memoryPublished.version - 1}`,
      newValue: `v${nextVersion}`,
      targetRole: 'System Master Configuration',
      targetComponent: 'Full Rollback',
    });

    const newVersionEntry: ConfigVersionEntry = {
      version: nextVersion,
      publishedAt: now,
      publishedBy: restoredBy,
      summary: `Restored baseline from v${versionNum}`,
      snapshot: restoredSnapshot,
    };
    this.memoryVersions.unshift(newVersionEntry);
    this.saveToStorage(STORAGE_KEY_VERSIONS, this.memoryVersions);

    // Call API restore
    try {
      await fetch(`/api/config/master/restore/${versionNum}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'super_admin' },
      });
    } catch {}

    this.notifyConfigUpdated();
    return this.memoryPublished;
  }

  public getAuditLogs(): ConfigAuditLogEntry[] {
    return [...this.memoryAuditLogs];
  }

  public addAuditLog(entry: Omit<ConfigAuditLogEntry, 'id' | 'timestamp'>): void {
    const fullEntry: ConfigAuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.memoryAuditLogs.unshift(fullEntry);
    this.saveToStorage(STORAGE_KEY_AUDIT_LOGS, this.memoryAuditLogs);

    // Push to backend
    fetch('/api/config/master/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEntry),
    }).catch(() => {});
  }

  /**
   * Applies a proposed configuration change from the Super Admin Configuration Assistant.
   */
  public async applyProposedChange(
    change: ProposedConfigChange,
    updatedBy: string = 'Super Admin Chatbot'
  ): Promise<boolean> {
    try {
      const draft = { ...this.memoryDraft };
      const roles: Array<'admin' | 'focal' | 'agent'> =
        change.targetRole === 'all'
          ? ['admin', 'focal', 'agent']
          : [change.targetRole as 'admin' | 'focal' | 'agent'];

      for (const r of roles) {
        if (!draft.roles[r]) continue;

        if (change.category === 'color') {
          (draft.roles[r].colors as any)[change.property] = change.proposedValue;
          if (change.property === 'sidebarColor') {
            draft.roles[r].sidebar.backgroundColor = change.proposedValue;
          }
        } else if (change.category === 'typography') {
          if (change.property === 'fontFamily') {
            draft.roles[r].typography.fontFamily = change.proposedValue;
            // Also update main elements
            draft.roles[r].typography.sidebar.fontFamily = change.proposedValue;
            draft.roles[r].typography.pageTitle.fontFamily = change.proposedValue;
            draft.roles[r].typography.body.fontFamily = change.proposedValue;
            draft.roles[r].typography.button.fontFamily = change.proposedValue;
          } else if ((draft.roles[r].typography as any)[change.property]) {
            if (change.subProperty) {
              ((draft.roles[r].typography as any)[change.property] as any)[change.subProperty] = change.proposedValue;
            } else {
              (draft.roles[r].typography as any)[change.property] = change.proposedValue;
            }
          }
        } else if (change.category === 'button') {
          (draft.roles[r].buttons as any)[change.property] = change.proposedValue;
        } else if (change.category === 'modal') {
          (draft.roles[r].modals as any)[change.property] = change.proposedValue;
        } else if (change.category === 'sidebar') {
          (draft.roles[r].sidebar as any)[change.property] = change.proposedValue;
          if (change.property === 'backgroundColor') {
            draft.roles[r].colors.sidebarColor = change.proposedValue;
          }
        } else if (change.category === 'layout') {
          (draft.roles[r].layout as any)[change.property] = change.proposedValue;
        } else if (change.category === 'background') {
          (draft.roles[r].background as any)[change.property] = change.proposedValue;
        } else if (change.category === 'text') {
          if (change.property === 'menuLabels') {
            if (change.subProperty) {
              draft.roles[r].text.menuLabels[change.subProperty] = change.proposedValue;
            }
          } else if (change.property === 'pageTitles' && change.subProperty) {
            draft.roles[r].text.pageTitles[change.subProperty] = change.proposedValue;
          } else if (change.property === 'dashboardDescription') {
            draft.roles[r].text.dashboardDescription = change.proposedValue;
          }
        } else if (change.category === 'feature') {
          (draft.roles[r].features as any)[change.property] = Boolean(change.proposedValue);
        }
      }

      if (change.category === 'chatbot') {
        (draft.chatbotConfig as any)[change.property] = change.proposedValue;
      } else if (change.category === 'branding') {
        (draft.globalBranding as any)[change.property] = change.proposedValue;
      }

      // Save draft and immediately publish to make it active
      this.memoryDraft = draft;
      await this.publishConfig(updatedBy, change.description);

      return true;
    } catch (e) {
      console.error('Failed to apply proposed config change:', e);
      return false;
    }
  }

  private notifyConfigUpdated(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('da_master_config_updated', {
          detail: this.memoryPublished,
        })
      );
      // Also sync sidebar theme event for backwards compatibility
      if (this.memoryPublished.roles.admin?.sidebar) {
        window.dispatchEvent(
          new CustomEvent('da_sidebar_theme_change', {
            detail: {
              backgroundColor: this.memoryPublished.roles.admin.sidebar.backgroundColor,
              activeMenuColor: this.memoryPublished.roles.admin.colors.sidebarActiveColor,
              activeTextColor: '#ffffff',
              menuTextColor: this.memoryPublished.roles.admin.sidebar.textColor,
              hoverColor: this.memoryPublished.roles.admin.sidebar.hoverColor,
            },
          })
        );
      }
    }
  }

  private notifyDraftUpdated(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('da_master_config_draft_updated', {
          detail: this.memoryDraft,
        })
      );
    }
  }
}

export const masterConfigService = new MasterConfigService();

