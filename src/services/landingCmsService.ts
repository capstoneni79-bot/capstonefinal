import { INITIAL_LANDING_CMS_CONFIG } from '../data/initialLandingCmsData';
import { LandingCmsConfig, LegalDocumentsLandingConfig, MediaItem } from '../types/landingCms';
import { storageService } from './storageService';

const CMS_STORAGE_KEYS = {
  PUBLISHED: 'da_hinunangan_landing_cms_published_v2',
  DRAFT: 'da_hinunangan_landing_cms_draft_v2',
};

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
  if (!config.legalDocumentsConfig) {
    config.legalDocumentsConfig = { ...DEFAULT_LEGAL_DOCUMENTS_CONFIG };
  }
  return config;
}

function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed reading ${key} from storage:`, e);
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e: any) {
    console.error(`Failed writing ${key} to storage:`, e);
    // If quota exceeded, attempt intelligent trimming of excess media items
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
      try {
        const valObj = value as any;
        if (valObj && typeof valObj === 'object') {
          const trimmed = { ...valObj };
          if (Array.isArray(trimmed.mediaItems)) {
            trimmed.mediaItems = trimmed.mediaItems.slice(0, 25);
          }
          if (Array.isArray(trimmed.galleryPhotos)) {
            trimmed.galleryPhotos = trimmed.galleryPhotos.slice(0, 20);
          }
          localStorage.setItem(key, JSON.stringify(trimmed));
        }
      } catch (innerErr) {
        console.warn('Storage fallback trim also encountered limit:', innerErr);
      }
    }
  }
}

export const landingCmsService = {
  getPublishedConfig(): LandingCmsConfig {
    const data = getLocalItem<LandingCmsConfig | null>(CMS_STORAGE_KEYS.PUBLISHED, null);
    if (!data) {
      const initial = ensureLegalConfig({ ...INITIAL_LANDING_CMS_CONFIG });
      setLocalItem(CMS_STORAGE_KEYS.PUBLISHED, initial);
      return initial;
    }
    return ensureLegalConfig(data);
  },

  getDraftConfig(): LandingCmsConfig {
    const draft = getLocalItem<LandingCmsConfig | null>(CMS_STORAGE_KEYS.DRAFT, null);
    if (draft) return ensureLegalConfig(draft);
    return this.getPublishedConfig();
  },

  saveDraft(config: LandingCmsConfig): void {
    const draft = { ...config, status: 'draft' as const };
    setLocalItem(CMS_STORAGE_KEYS.DRAFT, draft);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('da_landing_draft_updated', { detail: draft }));
    }, 0);
  },

  publish(config: LandingCmsConfig): LandingCmsConfig {
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const published: LandingCmsConfig = {
      ...config,
      status: 'published',
      lastUpdated: nowStr,
    };

    setLocalItem(CMS_STORAGE_KEYS.PUBLISHED, published);
    setLocalItem(CMS_STORAGE_KEYS.DRAFT, published);

    // Sync legacy storageService landing config so other components remain in sync
    try {
      const legacy = storageService.getLandingConfig();
      storageService.saveLandingConfig({
        ...legacy,
        headerTitle: published.siteName,
        headerSubtitle: published.siteSubtitle,
        heroTitle: published.heroTitle,
        heroSubtitle: published.heroSubtitle,
        heroBannerUrl: published.heroBackgroundUrl,
        bannerNotice: published.announcement.enabled ? published.announcement.text : '',
        announcementText: published.announcement.text,
        contactPhone: published.contactPhone,
        contactEmail: published.contactEmail,
        emergencyHotline: published.hotlineEmergency,
        themeColor: published.theme.primaryColor,
        logoUrl: published.systemLogoUrl,
      });
    } catch (e) {
      console.warn('Syncing legacy landing config failed:', e);
    }

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('da_landing_cms_updated', { detail: published }));
    }, 0);
    return published;
  },

  resetDraft(): LandingCmsConfig {
    const pub = this.getPublishedConfig();
    setLocalItem(CMS_STORAGE_KEYS.DRAFT, pub);
    return pub;
  },

  restoreDefaults(): LandingCmsConfig {
    setLocalItem(CMS_STORAGE_KEYS.PUBLISHED, INITIAL_LANDING_CMS_CONFIG);
    setLocalItem(CMS_STORAGE_KEYS.DRAFT, INITIAL_LANDING_CMS_CONFIG);
    window.dispatchEvent(new CustomEvent('da_landing_cms_updated', { detail: INITIAL_LANDING_CMS_CONFIG }));
    return INITIAL_LANDING_CMS_CONFIG;
  },

  addMediaItem(item: Omit<MediaItem, 'id' | 'uploadDate'>): MediaItem {
    const newItem: MediaItem = {
      ...item,
      id: 'med-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      uploadDate: new Date().toISOString().split('T')[0],
    };
    const draft = this.getDraftConfig();
    const updatedMedia = [newItem, ...(draft.mediaItems || [])];
    const updatedConfig = { ...draft, mediaItems: updatedMedia };
    this.saveDraft(updatedConfig);
    return newItem;
  },

  deleteMediaItem(id: string): void {
    const draft = this.getDraftConfig();
    const updatedMedia = (draft.mediaItems || []).filter(m => m.id !== id);
    this.saveDraft({ ...draft, mediaItems: updatedMedia });
  },

  updateMediaItem(updated: MediaItem): void {
    const draft = this.getDraftConfig();
    const list = [...(draft.mediaItems || [])];
    const idx = list.findIndex(m => m.id === updated.id);
    if (idx >= 0) {
      list[idx] = updated;
      this.saveDraft({ ...draft, mediaItems: list });
    }
  },

  updateOfficialLogo(logoId: string, updates: Partial<import('../types/landingCms').OfficialLogoItem>): LandingCmsConfig {
    const draft = this.getDraftConfig();
    const currentLogos = draft.officialLogos || [];
    const updatedLogos = currentLogos.map(l => (l.id === logoId ? { ...l, ...updates } : l));
    const newConfig = { ...draft, officialLogos: updatedLogos };
    this.saveDraft(newConfig);
    // Also publish so it's live across public portal immediately
    return this.publish(newConfig);
  },

  reorderOfficialLogos(newLogos: import('../types/landingCms').OfficialLogoItem[]): LandingCmsConfig {
    const draft = this.getDraftConfig();
    const updated = newLogos.map((l, idx) => ({ ...l, order: idx + 1 }));
    const newConfig = { ...draft, officialLogos: updated };
    this.saveDraft(newConfig);
    return this.publish(newConfig);
  },
};

