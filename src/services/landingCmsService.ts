import { INITIAL_LANDING_CMS_CONFIG } from '../data/initialLandingCmsData';
import { LandingCmsConfig, LegalDocumentsLandingConfig, MediaItem } from '../types/landingCms';
import { storageService } from './storageService';

export const DEFAULT_LEGAL_DOCUMENTS_CONFIG: LegalDocumentsLandingConfig = {
  showLegalDocuments: true,
  sectionTitle: 'Legal Decrees & Ordinances',
  sectionSubtitle: 'Official statutory framework, zoning ordinances, and regulatory resolutions enacted by the Municipality of Hinunangan',
  showLatestDocuments: true,
  showFeaturedDocuments: true,
  showSearch: true,
  maxFeaturedDocuments: 5,
  featuredDocumentIds: ['mo-hinunangan-2025-59', 'res-hinunangan-376-2026'],
  showDocumentNumber: true,
  showTitle: true,
  showDate: true,
  showCategory: true,
  showViewButton: true,
};

function ensureLegalConfig(config: LandingCmsConfig): LandingCmsConfig {
  return config.legalDocumentsConfig
    ? config
    : { ...config, legalDocumentsConfig: { ...DEFAULT_LEGAL_DOCUMENTS_CONFIG } };
}

let publishedSnapshot = ensureLegalConfig({ ...INITIAL_LANDING_CMS_CONFIG });
let draftSnapshot = publishedSnapshot;

function getAuthHeaders(): Record<string, string> {
  const user = storageService.getCurrentUser();
  return {
    'Content-Type': 'application/json',
    ...(user ? {
      'x-user-role': user.role,
      'x-user-id': user.id,
      'x-user-name': user.username || user.email.split('@')[0],
    } : {}),
  };
}

async function readConfigResponse(path: string): Promise<LandingCmsConfig> {
  const response = await fetch(path, {
    method: 'GET',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || !data.config) {
    throw new Error(data?.error || `Unable to load landing page configuration (HTTP ${response.status}).`);
  }
  return ensureLegalConfig(data.config as LandingCmsConfig);
}

async function writeConfig(path: string, method: 'PUT' | 'POST', config: LandingCmsConfig): Promise<LandingCmsConfig> {
  const response = await fetch(path, {
    method,
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true || !data.config) {
    throw new Error(data?.error || `Unable to save landing page configuration (HTTP ${response.status}).`);
  }
  return ensureLegalConfig(data.config as LandingCmsConfig);
}

function dispatchConfigUpdate(eventName: 'da_landing_cms_updated' | 'da_landing_draft_updated', config: LandingCmsConfig): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail: config }));
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Unable to read the selected media file.'));
    reader.onerror = () => reject(new Error('Unable to read the selected media file.'));
    reader.readAsDataURL(file);
  });
}

export const landingCmsService = {
  // These synchronous getters are in-memory snapshots only; callers should load from the API on mount.
  getPublishedConfig(): LandingCmsConfig {
    return publishedSnapshot;
  },

  getDraftConfig(): LandingCmsConfig {
    return draftSnapshot;
  },

  async loadPublishedConfig(): Promise<LandingCmsConfig> {
    const config = await readConfigResponse('/api/landing-cms/published');
    publishedSnapshot = config;
    dispatchConfigUpdate('da_landing_cms_updated', config);
    return config;
  },

  async loadDraftConfig(): Promise<LandingCmsConfig> {
    const config = await readConfigResponse('/api/admin/landing-cms/draft');
    draftSnapshot = config;
    dispatchConfigUpdate('da_landing_draft_updated', config);
    return config;
  },

  async saveDraft(config: LandingCmsConfig): Promise<LandingCmsConfig> {
    const draft = await writeConfig('/api/admin/landing-cms/draft', 'PUT', {
      ...config,
      status: 'draft',
    });
    draftSnapshot = draft;
    dispatchConfigUpdate('da_landing_draft_updated', draft);
    return draft;
  },

  async publish(config: LandingCmsConfig): Promise<LandingCmsConfig> {
    const published = await writeConfig('/api/admin/landing-cms/publish', 'POST', {
      ...config,
      status: 'published',
    });
    publishedSnapshot = published;
    draftSnapshot = published;
    dispatchConfigUpdate('da_landing_cms_updated', published);
    dispatchConfigUpdate('da_landing_draft_updated', published);
    return published;
  },

  async resetDraft(): Promise<LandingCmsConfig> {
    const published = await this.loadPublishedConfig();
    return this.saveDraft(published);
  },

  async restoreDefaults(): Promise<LandingCmsConfig> {
    return this.publish(ensureLegalConfig({ ...INITIAL_LANDING_CMS_CONFIG }));
  },

  async uploadAsset(file: File, category = 'other'): Promise<{
    filePath: string;
    fileUrl: string;
    fileSize: number;
    fileName: string;
    mimeType: string;
  }> {
    if (file.size === 0 || file.size > 15 * 1024 * 1024) {
      throw new Error('The selected file is empty or exceeds the 15 MB limit.');
    }
    const base64 = await readFileAsDataUrl(file);
    const response = await fetch('/api/admin/landing-cms/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64,
        category,
      }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.success !== true || typeof data.fileUrl !== 'string' || data.fileUrl.startsWith('blob:')) {
      throw new Error(data?.error || `Unable to upload landing page media (HTTP ${response.status}).`);
    }
    return {
      filePath: data.filePath,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      fileName: data.fileName,
      mimeType: data.mimeType,
    };
  },

  async addMediaItem(item: Omit<MediaItem, 'id' | 'uploadDate'>): Promise<MediaItem> {
    const newItem: MediaItem = {
      ...item,
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      uploadDate: new Date().toISOString().slice(0, 10),
    };
    await this.saveDraft({ ...draftSnapshot, mediaItems: [newItem, ...(draftSnapshot.mediaItems || [])] });
    return newItem;
  },

  async deleteMediaItem(id: string): Promise<void> {
    await this.saveDraft({ ...draftSnapshot, mediaItems: (draftSnapshot.mediaItems || []).filter(item => item.id !== id) });
  },

  async updateMediaItem(updated: MediaItem): Promise<void> {
    const mediaItems = [...(draftSnapshot.mediaItems || [])];
    const index = mediaItems.findIndex(item => item.id === updated.id);
    if (index < 0) return;
    mediaItems[index] = updated;
    await this.saveDraft({ ...draftSnapshot, mediaItems });
  },

  async updateOfficialLogo(logoId: string, updates: Partial<import('../types/landingCms').OfficialLogoItem>): Promise<LandingCmsConfig> {
    const officialLogos = (draftSnapshot.officialLogos || []).map(logo => logo.id === logoId ? { ...logo, ...updates } : logo);
    return this.publish({ ...draftSnapshot, officialLogos });
  },

  async reorderOfficialLogos(newLogos: import('../types/landingCms').OfficialLogoItem[]): Promise<LandingCmsConfig> {
    const officialLogos = newLogos.map((logo, index) => ({ ...logo, order: index + 1 }));
    return this.publish({ ...draftSnapshot, officialLogos });
  },
};
