import {
  INITIAL_ACCOUNTS,
  INITIAL_BARANGAYS,
  INITIAL_BIOSECURITY_AUDITS,
  INITIAL_BIOSECURITY_INCIDENTS,
  INITIAL_CERTIFICATE_CONFIG,
  INITIAL_DYNAMIC_FIELDS,
  INITIAL_ISSUED_CERTIFICATES,
  INITIAL_LANDING_CONFIG,
  INITIAL_MARKETING_ALERTS,
  INITIAL_MESSAGES,
  INITIAL_SWINE_RECORDS,
  INITIAL_TAKEOFF_RECORDS,
} from '../data/initialData';
import { ALL_ASF_REGULATIONS } from '../data/asfRegulationsData';
import { INITIAL_CERTIFICATE_TEMPLATES } from '../data/certificateTemplates';
import { DEFAULT_SIDEBAR_THEME, INITIAL_REGISTRY_FORM_SCHEMA } from '../data/initialFormSchema';
import {
  ASFRegulatoryDocument,
  Barangay,
  BarangayBiosecurityAudit,
  BiosecurityIncident,
  CertificateConfig,
  CertificateTemplate,
  DynamicFormField,
  IssuedCertificate,
  LandingPageConfig,
  MarketingAlert,
  MessageItem,
  OfflineQueueItem,
  RegistryFormField,
  RegistryFormSchema,
  SidebarTheme,
  SwineRecord,
  SwineTakeoffRecord,
  TransmittalLetter,
  UserAccount,
} from '../types';
import { LegalImportHistoryRecord } from '../types/legalImport';
import { indexedDbService } from './indexedDbService';
import {
  calculateSwineAge,
  classifyFarmScale,
  getBarangayASFZone,
  getEstimatedWeightRange,
  isValidPigIdTag,
  validateSwineRecordForSave,
} from '../utils/swineRegistryLogic';

const STORAGE_KEYS = {
  SWINE: 'da_hinunangan_swine_records_v1',
  BARANGAYS: 'da_hinunangan_barangays_v1',
  ACCOUNTS: 'da_hinunangan_accounts_v1',
  MESSAGES: 'da_hinunangan_messages_v1',
  CERT_CONFIG: 'da_hinunangan_cert_config_v1',
  CERT_ISSUED: 'da_hinunangan_cert_issued_v1',
  CERT_TEMPLATES: 'da_hinunangan_cert_templates_v2',
  TRANSMITTAL_LETTERS: 'da_hinunangan_transmittal_letters_v1',
  LANDING: 'da_hinunangan_landing_config_v1',
  DYNAMIC_FORM: 'da_hinunangan_dynamic_form_v1',
  OFFLINE_QUEUE: 'da_hinunangan_offline_queue_v1',
  CURRENT_USER: 'da_hinunangan_current_user_v1',
  SIMULATED_OFFLINE: 'da_hinunangan_simulated_offline_v1',
  BIOSECURITY_AUDITS: 'da_hinunangan_biosecurity_audits_v1',
  BIOSECURITY_INCIDENTS: 'da_hinunangan_biosecurity_incidents_v1',
  MARKETING_ALERTS: 'da_hinunangan_marketing_alerts_v1',
  TAKEOFF_RECORDS: 'da_hinunangan_takeoff_records_v1',
  ASF_REGULATIONS: 'da_hinunangan_asf_regulations_v1',
  LEGAL_IMPORT_HISTORY: 'da_hinunangan_legal_import_history_v1',
  SIDEBAR_THEME: 'da_hinunangan_sidebar_theme_v1',
  REGISTRY_FORM_SCHEMA: 'da_hinunangan_registry_form_schema_v1',
  REGISTRY_FORM_SCHEMA_DRAFT: 'da_hinunangan_registry_form_schema_draft_v1',
};

// Safe LocalStorage helpers
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing localStorage key "${key}":`, err);
  }
}

// Auto-empty records one-time migration to ensure browser session clears data records while preserving all text
try {
  if (typeof window !== 'undefined' && localStorage.getItem('da_records_emptied_sept2026_v1') !== 'true') {
    localStorage.setItem(STORAGE_KEYS.SWINE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CERT_ISSUED, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TAKEOFF_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MARKETING_ALERTS, JSON.stringify([]));

    // Clear logo collections from landing CMS config if stored, keeping text intact
    const landingStr = localStorage.getItem(STORAGE_KEYS.LANDING);
    if (landingStr) {
      try {
        const landing = JSON.parse(landingStr);
        landing.footerLogos = [];
        landing.officialLogos = [];
        landing.mediaItems = [];
        localStorage.setItem(STORAGE_KEYS.LANDING, JSON.stringify(landing));
      } catch {
        // ignore
      }
    }
    localStorage.setItem('da_records_emptied_sept2026_v1', 'true');
  }
} catch {
  // ignore
}

export const storageService = {
  // Empty all records utility while keeping all text, accounts, and barangays
  emptyAllRecordsExceptText(): void {
    setItem(STORAGE_KEYS.SWINE, []);
    setItem(STORAGE_KEYS.CERT_ISSUED, []);
    setItem(STORAGE_KEYS.TAKEOFF_RECORDS, []);
    setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, []);
    setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, []);
    setItem(STORAGE_KEYS.MARKETING_ALERTS, []);
    const landing = this.getLandingConfig();
    landing.footerLogos = [];
    landing.officialLogos = [];
    landing.mediaItems = [];
    this.saveLandingConfig(landing);
  },

  // Simulated offline mode toggle for testing
  getSimulatedOffline(): boolean {
    return getItem<boolean>(STORAGE_KEYS.SIMULATED_OFFLINE, false);
  },

  setSimulatedOffline(status: boolean): void {
    setItem(STORAGE_KEYS.SIMULATED_OFFLINE, status);
    window.dispatchEvent(new CustomEvent('da_connectivity_change', { detail: { isSimulatedOffline: status } }));
  },

  isEffectiveOffline(): boolean {
    if (this.getSimulatedOffline()) return true;
    return typeof navigator !== 'undefined' && !navigator.onLine;
  },

  // Swine Records
  getSwineRecords(): SwineRecord[] {
    const stored = getItem<SwineRecord[] | null>(STORAGE_KEYS.SWINE, null);
    if (stored === null || stored.length === 0) {
      return [];
    }
    // Existing Data Compatibility: Normalize legacy 11-digit formatted contacts (e.g. 0917-888-9999 -> 09178889999)
    let hasNormalized = false;
    const normalized = stored.map(record => {
      if (record.farmerContact && typeof record.farmerContact === 'string') {
        const digits = record.farmerContact.replace(/\D/g, '');
        if (digits.length === 11 && record.farmerContact !== digits) {
          hasNormalized = true;
          return { ...record, farmerContact: digits };
        }
      }
      return record;
    });

    if (hasNormalized) {
      setItem(STORAGE_KEYS.SWINE, normalized);
    }
    return normalized;
  },

  async fetchSwineRecords(params?: { barangay?: string; search?: string; status?: string; readyToSell?: boolean; isArchived?: boolean; page?: number; perPage?: number }): Promise<{ records: SwineRecord[]; total: number }> {
    if (this.isEffectiveOffline()) {
      let records = this.getSwineRecords();
      if (params?.barangay && params.barangay !== 'all') {
        records = records.filter(r => (r.barangay || '').toLowerCase() === params.barangay!.toLowerCase());
      }
      if (params?.status && params.status !== 'all') {
        records = records.filter(r => (r.status || '').toLowerCase() === params.status!.toLowerCase());
      }
      if (params?.readyToSell !== undefined) {
        records = records.filter(r => Boolean(r.readyToSell || r.status === 'ready_to_sell') === params.readyToSell);
      }
      if (params?.isArchived !== undefined) {
        records = records.filter(r => Boolean(r.isArchived) === params.isArchived);
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        records = records.filter(r =>
          (r.pigIdTag || '').toLowerCase().includes(q) ||
          (r.farmerName || '').toLowerCase().includes(q) ||
          (r.barangay || '').toLowerCase().includes(q) ||
          (r.breed || '').toLowerCase().includes(q)
        );
      }
      return { records, total: records.length };
    }

    try {
      const searchParams = new URLSearchParams();
      if (params?.barangay && params.barangay !== 'all') {
        searchParams.set('barangay', params.barangay);
      }
      if (params?.search) {
        searchParams.set('search', params.search);
      }
      if (params?.status && params.status !== 'all') {
        searchParams.set('status', params.status);
      }
      if (params?.readyToSell !== undefined) {
        searchParams.set('readyToSell', String(params.readyToSell));
      }
      if (params?.isArchived !== undefined) {
        searchParams.set('isArchived', String(params.isArchived));
      }
      if (params?.page) {
        searchParams.set('page', String(params.page));
      }
      if (params?.perPage) {
        searchParams.set('per_page', String(params.perPage));
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const user = this.getCurrentUser();
      if (user) {
        headers['x-user-role'] = user.role || 'focal';
        headers['x-user-id'] = user.id || '';
        headers['x-user-name'] = user.username || user.name || '';
        if (user.assignedBarangay) headers['x-user-assigned-barangay'] = user.assignedBarangay;
        if (user.barangay_id) headers['x-user-barangay-id'] = user.barangay_id;
      }

      const queryString = searchParams.toString();
      const endpoint = `/api/swine-records${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(endpoint, { method: 'GET', headers });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          const records: SwineRecord[] = json.data;
          this.saveSwineRecords(records);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('swine_records_updated', { detail: records }));
          }
          return { records, total: json.total ?? records.length };
        }
      }
    } catch (err) {
      console.warn('Network fetch failed, serving from local cache:', err);
    }

    let local = this.getSwineRecords();
    if (params?.barangay && params.barangay !== 'all') {
      local = local.filter(r => (r.barangay || '').toLowerCase() === params.barangay!.toLowerCase());
    }
    if (params?.status && params.status !== 'all') {
      local = local.filter(r => (r.status || '').toLowerCase() === params.status!.toLowerCase());
    }
    if (params?.readyToSell !== undefined) {
      local = local.filter(r => Boolean(r.readyToSell || r.status === 'ready_to_sell') === params.readyToSell);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      local = local.filter(r =>
        (r.pigIdTag || '').toLowerCase().includes(q) ||
        (r.farmerName || '').toLowerCase().includes(q) ||
        (r.barangay || '').toLowerCase().includes(q)
      );
    }
    return { records: local, total: local.length };
  },

  saveSwineRecords(records: SwineRecord[]): void {
    setItem(STORAGE_KEYS.SWINE, records);
    if (typeof window !== 'undefined') {
      indexedDbService.putBatch('swineRecords', records).catch(() => {});
    }
  },

  addSwineRecord(record: SwineRecord): void {
    // Backend/Database Layer Validation: Contact number must be valid Philippine mobile format
    const contactDigits = (record.farmerContact || '').replace(/\D/g, '');
    if (!record.farmerContact || typeof record.farmerContact !== 'string' || !(contactDigits.length === 10 || contactDigits.length === 11 || contactDigits.length === 12)) {
      throw new Error('Contact number must be a valid Philippine mobile number.');
    }

    const records = this.getSwineRecords();
    const isOffline = this.isEffectiveOffline();

    // Comprehensive validation
    const pigIdTag = (record.pigIdTag || record.earTagNo || '').trim();
    const validation = validateSwineRecordForSave(
      {
        ...record,
        pigIdTag,
      },
      records
    );
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || 'Invalid swine record data.');
    }

    // Derive calculated fields consistently
    const ageResult = calculateSwineAge(record.birthDate);
    const safeDays = ageResult.isValid ? ageResult.days : (record.ageDays || 0);
    const safeMonths = ageResult.isValid ? ageResult.months : (record.ageMonths || 0);
    const estimatedWeightKg = getEstimatedWeightRange(safeDays);
    const farmScale = record.farmScale || classifyFarmScale(record.penCapacity || (record.farmType === 'commercial' ? 50 : 5));
    const asfZone = record.asfZone || getBarangayASFZone(record.barangay);

    const newRecord: SwineRecord = {
      ...record,
      pigIdTag,
      earTagNo: pigIdTag,
      ageDays: safeDays,
      ageMonths: safeMonths,
      estimatedWeightKg,
      actualWeightKg: record.actualWeightKg !== undefined ? record.actualWeightKg : (record.weightKg || null),
      weightKg: record.weightKg || (record.actualWeightKg ? Number(record.actualWeightKg) : 60),
      farmScale,
      asfZone,
      farmerContact: record.farmerContact.trim(),
      isSynced: !isOffline,
      updatedAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    this.saveSwineRecords(records);

    // Sync to backend API if reachable
    if (!isOffline && typeof fetch !== 'undefined') {
      fetch('/api/swine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      }).catch(() => {});
    }

    if (isOffline) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action: 'create',
        entity: 'swine',
        data: newRecord,
        timestamp: new Date().toISOString(),
      });
    }
  },

  updateSwineRecord(updated: SwineRecord): void {
    // Backend/Database Layer Validation: Contact number must be valid Philippine mobile format
    const contactDigits = (updated.farmerContact || '').replace(/\D/g, '');
    if (!updated.farmerContact || typeof updated.farmerContact !== 'string' || !(contactDigits.length === 10 || contactDigits.length === 11 || contactDigits.length === 12)) {
      throw new Error('Contact number must be a valid Philippine mobile number.');
    }

    const records = this.getSwineRecords();
    const isOffline = this.isEffectiveOffline();
    const index = records.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      const existing = records[index];
      // Pig ID Tag must remain immutable when editing
      const pigIdTag = existing.pigIdTag || existing.earTagNo || updated.pigIdTag || updated.earTagNo;

      const validation = validateSwineRecordForSave(
        {
          ...updated,
          pigIdTag,
        },
        records,
        updated.id
      );
      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid swine record data.');
      }

      const ageResult = calculateSwineAge(updated.birthDate);
      const safeDays = ageResult.isValid ? ageResult.days : (updated.ageDays || 0);
      const safeMonths = ageResult.isValid ? ageResult.months : (updated.ageMonths || 0);
      const estimatedWeightKg = getEstimatedWeightRange(safeDays);
      const farmScale = updated.farmScale || classifyFarmScale(updated.penCapacity || (updated.farmType === 'commercial' ? 50 : 5));
      const asfZone = updated.asfZone || getBarangayASFZone(updated.barangay);

      records[index] = {
        ...updated,
        pigIdTag,
        earTagNo: pigIdTag,
        ageDays: safeDays,
        ageMonths: safeMonths,
        estimatedWeightKg,
        actualWeightKg: updated.actualWeightKg !== undefined ? updated.actualWeightKg : (updated.weightKg || null),
        farmScale,
        asfZone,
        farmerContact: updated.farmerContact.trim(),
        isSynced: !isOffline,
        updatedAt: new Date().toISOString(),
      };
      this.saveSwineRecords(records);

      if (!isOffline && typeof fetch !== 'undefined') {
        fetch(`/api/swine/${updated.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(records[index]),
        }).catch(() => {});
      }

      if (isOffline) {
        this.enqueueOfflineAction({
          id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          action: 'update',
          entity: 'swine',
          data: records[index],
          timestamp: new Date().toISOString(),
        });
      }
    }
  },

  deleteSwineRecord(id: string): void {
    const records = this.getSwineRecords();
    const filtered = records.filter(r => r.id !== id);
    this.saveSwineRecords(filtered);

    if (this.isEffectiveOffline()) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action: 'delete',
        entity: 'swine',
        data: { id },
        timestamp: new Date().toISOString(),
      });
    } else {
      const user = this.getCurrentUser();
      fetch(`/api/swine/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || 'admin',
          'x-user-name': user?.name || 'Administrator',
          'x-user-id': user?.id || 'admin',
        },
      }).catch(err => console.warn('Cloud SQL delete sync notice:', err));
    }
  },

  deleteSwineRecords(ids: string[]): void {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    const records = this.getSwineRecords();
    const filtered = records.filter(r => !idSet.has(r.id));
    this.saveSwineRecords(filtered);

    if (this.isEffectiveOffline()) {
      ids.forEach(id => {
        this.enqueueOfflineAction({
          id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          action: 'delete',
          entity: 'swine',
          data: { id },
          timestamp: new Date().toISOString(),
        });
      });
    } else {
      const user = this.getCurrentUser();
      fetch('/api/swine/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'admin',
          'x-user-name': user?.name || 'Administrator',
          'x-user-id': user?.id || 'admin',
        },
        body: JSON.stringify({ ids }),
      }).catch(err => console.warn('Cloud SQL bulk delete sync notice:', err));
    }
  },

  deleteAllSwineRecords(): void {
    const allRecords = this.getSwineRecords();
    const ids = allRecords.map(r => r.id);
    this.saveSwineRecords([]);

    if (this.isEffectiveOffline()) {
      ids.forEach(id => {
        this.enqueueOfflineAction({
          id: 'queue-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          action: 'delete',
          entity: 'swine',
          data: { id },
          timestamp: new Date().toISOString(),
        });
      });
    } else {
      const user = this.getCurrentUser();
      fetch('/api/swine/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'admin',
          'x-user-name': user?.name || 'Administrator',
          'x-user-id': user?.id || 'admin',
        },
        body: JSON.stringify({ ids }),
      }).catch(err => console.warn('Cloud SQL bulk delete sync notice:', err));
    }
  },

  toggleSellStatus(id: string, readyToSell: boolean): void {
    const records = this.getSwineRecords();
    const item = records.find(r => r.id === id);
    if (item) {
      item.readyToSell = readyToSell;
      if (readyToSell && item.status !== 'ready_to_sell') {
        item.status = 'ready_to_sell';
      } else if (!readyToSell && item.status === 'ready_to_sell') {
        item.status = 'healthy';
      }
      this.updateSwineRecord(item);
    }
  },

  markAsSold(id: string): void {
    const records = this.getSwineRecords();
    const item = records.find(r => r.id === id);
    if (item) {
      item.status = 'sold';
      item.readyToSell = false;
      this.updateSwineRecord(item);
    }
  },

  toggleArchiveStatus(id: string): void {
    const records = this.getSwineRecords();
    const item = records.find(r => r.id === id);
    if (item) {
      item.isArchived = !item.isArchived;
      this.updateSwineRecord(item);
    }
  },

  // Barangays
  getBarangays(): Barangay[] {
    const stored = getItem<Barangay[] | null>(STORAGE_KEYS.BARANGAYS, null);
    if (!stored || stored.length < 40) {
      setItem(STORAGE_KEYS.BARANGAYS, INITIAL_BARANGAYS);
      return INITIAL_BARANGAYS;
    }
    // Ensure accurate coordinates from INITIAL_BARANGAYS are preserved
    const updated = stored.map(b => {
      const official = INITIAL_BARANGAYS.find(ib => ib.name.toLowerCase() === b.name.toLowerCase());
      if (official && (b.latitude !== official.latitude || b.longitude !== official.longitude)) {
        return { ...b, latitude: official.latitude, longitude: official.longitude };
      }
      return b;
    });
    return updated;
  },

  saveBarangays(barangays: Barangay[]): void {
    setItem(STORAGE_KEYS.BARANGAYS, barangays);
  },

  // Accounts
  getAccounts(): UserAccount[] {
    const stored = getItem<UserAccount[] | null>(STORAGE_KEYS.ACCOUNTS, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
      return INITIAL_ACCOUNTS;
    }
    let changed = false;
    INITIAL_ACCOUNTS.forEach(acc => {
      if (!stored.some(s => s.username === acc.username || s.id === acc.id)) {
        stored.push(acc);
        changed = true;
      }
    });
    if (changed) {
      setItem(STORAGE_KEYS.ACCOUNTS, stored);
    }
    return stored;
  },

  saveAccounts(accounts: UserAccount[]): void {
    setItem(STORAGE_KEYS.ACCOUNTS, accounts);
  },

  saveUserAccount(account: UserAccount): void {
    const list = this.getAccounts();
    const idx = list.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...account };
    } else {
      list.push(account);
    }
    this.saveAccounts(list);
  },

  deleteUserAccount(id: string): void {
    const list = this.getAccounts().filter(a => a.id !== id);
    this.saveAccounts(list);
  },

  saveBarangay(barangay: Barangay): void {
    const list = this.getBarangays();
    const idx = list.findIndex(b => b.id === barangay.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...barangay };
    } else {
      list.push(barangay);
    }
    this.saveBarangays(list);
  },

  deleteBarangay(id: string): void {
    const list = this.getBarangays().filter(b => b.id !== id);
    this.saveBarangays(list);
  },

  sendMessage(msg: MessageItem): void {
    const item: MessageItem = {
      ...msg,
      targetBarangay: msg.targetBarangay || msg.recipientBarangay || 'all',
      recipientBarangay: msg.recipientBarangay || msg.targetBarangay || 'all',
      isRead: false,
    };
    this.addMessage(item);
  },

  markMessageAsRead(id: string, userId?: string): void {
    const list = this.getMessages();
    const item = list.find(m => m.id === id);
    if (item) {
      item.isRead = true;
      if (userId) {
        if (!item.readBy) item.readBy = [];
        if (!item.readBy.includes(userId)) {
          item.readBy.push(userId);
        }
      }
      this.saveMessages(list);
    }
  },

  exportFullBackup(): any {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      swine: this.getSwineRecords(),
      barangays: this.getBarangays(),
      accounts: this.getAccounts(),
      messages: this.getMessages(),
      certConfig: this.getCertificateConfig(),
      issuedCertificates: this.getIssuedCertificates(),
      landingConfig: this.getLandingConfig(),
      dynamicFields: this.getDynamicFields(),
      biosecurityAudits: this.getBiosecurityAudits(),
      biosecurityIncidents: this.getBiosecurityIncidents(),
      marketingAlerts: this.getMarketingAlerts(),
      takeoffRecords: this.getTakeoffRecords(),
    };
  },

  restoreFullBackup(data: any): boolean {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (data.swine) setItem(STORAGE_KEYS.SWINE, data.swine);
      if (data.barangays) setItem(STORAGE_KEYS.BARANGAYS, data.barangays);
      if (data.accounts) setItem(STORAGE_KEYS.ACCOUNTS, data.accounts);
      if (data.messages) setItem(STORAGE_KEYS.MESSAGES, data.messages);
      if (data.certConfig) setItem(STORAGE_KEYS.CERT_CONFIG, data.certConfig);
      if (data.issuedCertificates) setItem(STORAGE_KEYS.CERT_ISSUED, data.issuedCertificates);
      if (data.landingConfig) setItem(STORAGE_KEYS.LANDING, data.landingConfig);
      if (data.dynamicFields) setItem(STORAGE_KEYS.DYNAMIC_FORM, data.dynamicFields);
      if (data.biosecurityAudits) setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, data.biosecurityAudits);
      if (data.biosecurityIncidents) setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, data.biosecurityIncidents);
      if (data.marketingAlerts) setItem(STORAGE_KEYS.MARKETING_ALERTS, data.marketingAlerts);
      if (data.takeoffRecords) setItem(STORAGE_KEYS.TAKEOFF_RECORDS, data.takeoffRecords);
      return true;
    } catch (err) {
      console.error('Failed to restore backup:', err);
      return false;
    }
  },

  getCurrentUser(): UserAccount | null {
    return getItem<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: UserAccount | null): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  // Messages
  getMessages(): MessageItem[] {
    const stored = getItem<MessageItem[] | null>(STORAGE_KEYS.MESSAGES, null);
    const raw = stored || [];
    return raw.map(m => ({
      ...m,
      subject: m.subject || m.title || 'Official Advisory',
      title: m.title || m.subject || 'Official Advisory',
      body: m.body || m.content || '',
      content: m.content || m.body || '',
      recipientBarangay: m.recipientBarangay || m.targetBarangay || 'all',
      targetBarangay: m.targetBarangay || m.recipientBarangay || 'all',
      timestamp: m.timestamp || m.createdAt || new Date().toISOString(),
      createdAt: m.createdAt || m.timestamp || new Date().toISOString(),
      priority: m.priority || 'normal',
      senderName: m.senderName || 'Municipal Agriculture Office',
      readBy: m.readBy || [],
      isRead: m.isRead ?? false,
    }));
  },

  saveMessages(messages: MessageItem[]): void {
    setItem(STORAGE_KEYS.MESSAGES, messages);
  },

  addMessage(msg: MessageItem): void {
    const messages = this.getMessages();
    messages.unshift(msg);
    this.saveMessages(messages);

    if (this.isEffectiveOffline()) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now(),
        action: 'create',
        entity: 'message',
        data: msg,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Certificate Templates System (Dynamic & Multi-Barangay)
  getCertificateTemplates(): CertificateTemplate[] {
    const stored = getItem<CertificateTemplate[] | null>(STORAGE_KEYS.CERT_TEMPLATES, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.CERT_TEMPLATES, INITIAL_CERTIFICATE_TEMPLATES);
      return INITIAL_CERTIFICATE_TEMPLATES;
    }
    return stored;
  },

  saveCertificateTemplates(templates: CertificateTemplate[]): void {
    setItem(STORAGE_KEYS.CERT_TEMPLATES, templates);
  },

  getCertificateTemplateById(id: string): CertificateTemplate | undefined {
    const templates = this.getCertificateTemplates();
    return templates.find(t => t.id === id);
  },

  getCertificateTemplateForBarangay(barangayName: string, docType?: string): CertificateTemplate {
    const templates = this.getCertificateTemplates();
    const cleanBrgy = (barangayName || '').trim().toLowerCase();

    // 1. Exact match for barangay and docType
    if (docType) {
      const match = templates.find(
        t => t.barangay.toLowerCase() === cleanBrgy && t.documentType.toLowerCase() === docType.toLowerCase() && t.isActive
      );
      if (match) return match;
    }

    // 2. Exact match for barangay
    const brgyMatch = templates.find(
      t => t.barangay.toLowerCase() === cleanBrgy && t.isActive
    );
    if (brgyMatch) return brgyMatch;

    // 3. Fallback matching name pattern
    if (cleanBrgy.includes('nava')) {
      const nava = templates.find(t => t.id.includes('nava') || t.barangay.toLowerCase().includes('nava'));
      if (nava) return nava;
    }
    if (cleanBrgy.includes('nueva esperanza')) {
      const ne = templates.find(t => t.id.includes('nueva-esperanza') || t.barangay.toLowerCase().includes('nueva esperanza'));
      if (ne) return ne;
    }
    if (cleanBrgy.includes('tuburan')) {
      const tub = templates.find(t => t.id.includes('tuburan') || t.barangay.toLowerCase().includes('tuburan'));
      if (tub) return tub;
    }

    // 4. Default to first active template or Nava
    return templates.find(t => t.isActive) || INITIAL_CERTIFICATE_TEMPLATES[0];
  },

  saveCertificateTemplate(template: CertificateTemplate): void {
    const templates = this.getCertificateTemplates();
    const idx = templates.findIndex(t => t.id === template.id);
    const updatedTemplate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      templates[idx] = updatedTemplate;
    } else {
      templates.push(updatedTemplate);
    }
    this.saveCertificateTemplates(templates);
  },

  deleteCertificateTemplate(id: string): void {
    const templates = this.getCertificateTemplates().filter(t => t.id !== id);
    this.saveCertificateTemplates(templates);
  },

  resetCertificateTemplatesToDefault(): void {
    setItem(STORAGE_KEYS.CERT_TEMPLATES, INITIAL_CERTIFICATE_TEMPLATES);
  },

  // Certificate Config & Issued
  getCertificateConfig(): CertificateConfig {
    return getItem<CertificateConfig>(STORAGE_KEYS.CERT_CONFIG, INITIAL_CERTIFICATE_CONFIG);
  },

  saveCertificateConfig(config: CertificateConfig): void {
    setItem(STORAGE_KEYS.CERT_CONFIG, config);
  },

  getAllIssuedCertificatesUnfiltered(): IssuedCertificate[] {
    const list = getItem<IssuedCertificate[]>(STORAGE_KEYS.CERT_ISSUED, []);
    return list || [];
  },

  getIssuedCertificates(user?: UserAccount | null): IssuedCertificate[] {
    const list = this.getAllIssuedCertificatesUnfiltered();
    if (!user || user.role === 'admin') {
      return list;
    }

    const userBarangayId =
      user.barangay_id ||
      (user.assignedBarangay ? `brgy-${user.assignedBarangay.toLowerCase().replace(/\s+/g, '-')}` : '');
    const userBarangayName = (user.assignedBarangay || '').trim().toLowerCase();

    return list.filter(c => {
      const matchId = Boolean(c.barangay_id && userBarangayId && c.barangay_id === userBarangayId);
      const matchFarmer = Boolean(
        c.farmerBarangay && userBarangayName && c.farmerBarangay.trim().toLowerCase() === userBarangayName
      );
      const matchIssuer = Boolean(
        c.issuingBarangay && userBarangayName && c.issuingBarangay.trim().toLowerCase() === userBarangayName
      );
      return matchId || matchFarmer || matchIssuer;
    });
  },

  checkCertificateAccess(
    certNo: string,
    user?: UserAccount | null
  ): { authorized: boolean; certificate?: IssuedCertificate; error?: string } {
    const list = this.getAllIssuedCertificatesUnfiltered();
    const cert = list.find(c => c.certificateNo === certNo);
    if (!cert) {
      return { authorized: false, error: 'Certificate record was not found in the official registry.' };
    }
    if (!user || user.role === 'admin') {
      return { authorized: true, certificate: cert };
    }

    const userBarangayId =
      user.barangay_id ||
      (user.assignedBarangay ? `brgy-${user.assignedBarangay.toLowerCase().replace(/\s+/g, '-')}` : '');
    const userBarangayName = (user.assignedBarangay || '').trim().toLowerCase();

    const matchId = Boolean(cert.barangay_id && userBarangayId && cert.barangay_id === userBarangayId);
    const matchFarmer = Boolean(
      cert.farmerBarangay && userBarangayName && cert.farmerBarangay.trim().toLowerCase() === userBarangayName
    );
    const matchIssuer = Boolean(
      cert.issuingBarangay && userBarangayName && cert.issuingBarangay.trim().toLowerCase() === userBarangayName
    );

    if (matchId || matchFarmer || matchIssuer) {
      return { authorized: true, certificate: cert };
    }

    const certBarangay = cert.farmerBarangay || cert.issuingBarangay || 'another barangay';
    return {
      authorized: false,
      error: `Access Denied: You are not authorized to view this certificate. It belongs to Barangay ${certBarangay}. Your account is assigned strictly to Barangay ${user.assignedBarangay || user.barangay_id}.`,
    };
  },

  saveIssuedCertificates(list: IssuedCertificate[]): void {
    setItem(STORAGE_KEYS.CERT_ISSUED, list);
  },

  deleteIssuedCertificate(certNo: string, user?: UserAccount | null): void {
    const list = this.getAllIssuedCertificatesUnfiltered().filter(c => c.certificateNo !== certNo);
    this.saveIssuedCertificates(list);

    // Sync deletion with Express backend
    try {
      fetch(`/api/certificates/${encodeURIComponent(certNo)}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': user?.role || 'admin',
          'x-user-barangay-id': user?.barangay_id || '',
          'x-user-barangay-name': user?.assignedBarangay || '',
        },
      }).catch(err => console.warn('Backend API certificate delete sync warning:', err));
    } catch {
      // offline fallback
    }
  },

  updateIssuedCertificate(cert: IssuedCertificate): void {
    const list = this.getAllIssuedCertificatesUnfiltered();
    const idx = list.findIndex(c => c.certificateNo === cert.certificateNo);
    if (idx !== -1) {
      list[idx] = cert;
      this.saveIssuedCertificates(list);
    }
  },

  issueCertificate(cert: IssuedCertificate, user?: UserAccount | null): void {
    const list = this.getAllIssuedCertificatesUnfiltered();
    list.unshift(cert);
    setItem(STORAGE_KEYS.CERT_ISSUED, list);

    // Sync issuance with Express backend
    try {
      fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'focal',
          'x-user-barangay-id': user?.barangay_id || '',
          'x-user-barangay-name': user?.assignedBarangay || '',
        },
        body: JSON.stringify(cert),
      }).catch(err => console.warn('Backend API certificate issue sync warning:', err));
    } catch {
      // offline fallback
    }

    if (this.isEffectiveOffline()) {
      this.enqueueOfflineAction({
        id: 'queue-' + Date.now(),
        action: 'create',
        entity: 'certificate',
        data: cert,
        timestamp: new Date().toISOString(),
      });
    }
  },

  async fetchIssuedCertificatesFromApi(user?: UserAccount | null): Promise<IssuedCertificate[]> {
    try {
      const headers: Record<string, string> = {};
      if (user?.role) headers['x-user-role'] = user.role;
      if (user?.barangay_id) headers['x-user-barangay-id'] = user.barangay_id;
      if (user?.assignedBarangay) headers['x-user-barangay-name'] = user.assignedBarangay;

      const res = await fetch('/api/certificates', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API certificate fetch warning, using local cache:', err);
    }
    return this.getIssuedCertificates(user);
  },

  async fetchOfficialReportFromApi(
    params: { barangay?: string; type?: string; startDate?: string; endDate?: string },
    user?: UserAccount | null
  ): Promise<IssuedCertificate[]> {
    try {
      const query = new URLSearchParams();
      if (params.barangay) query.set('barangay', params.barangay);
      if (params.type) query.set('type', params.type);
      if (params.startDate) query.set('startDate', params.startDate);
      if (params.endDate) query.set('endDate', params.endDate);

      const headers: Record<string, string> = {};
      if (user?.role) headers['x-user-role'] = user.role;
      if (user?.barangay_id) headers['x-user-barangay-id'] = user.barangay_id;
      if (user?.assignedBarangay) headers['x-user-barangay-name'] = user.assignedBarangay;

      const res = await fetch(`/api/reports/official?${query.toString()}`, { headers });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API report fetch warning, using local filtering:', err);
    }
    return this.getIssuedCertificates(user);
  },

  // Transmittal Letters Management
  getTransmittalLetters(): TransmittalLetter[] {
    const defaultLetters: TransmittalLetter[] = [
      {
        id: 'transmittal-2026-001',
        refNo: 'TM-OMAS-2026-042',
        date: new Date().toISOString().split('T')[0],
        from: 'Engr. Arnel M. Vasquez',
        fromTitle: 'Municipal Agriculturist',
        to: 'Provincial Veterinary Office (PVO)\nProvince of Southern Leyte\nCapitol Site, Asuncion, Maasin City',
        toTitle: 'Provincial Veterinarian',
        subject: 'TRANSMITTAL OF SWINE BIOSECURITY & MASTERLIST REGISTRY FOR CY 2026',
        barangay: 'All 40 Barangays of Hinunangan',
        municipality: 'Hinunangan',
        province: 'Southern Leyte',
        documentCount: 40,
        documentList: [
          'Official Masterlist of Registered Swine Raisers (CY 2026)',
          'Barangay Biosecurity Assessment Compliance Audits (40 Barangays)',
          'ASF Movement Clearances and Veterinary Inspection Certificates',
          'Municipal ASF Executive Order & Zoning Compliance Report',
        ],
        preparedBy: 'HON. VICENTE T. MADRONERO JR.',
        preparedByTitle: 'LGU Hinunangan Swine Registry Coordinator',
        verifiedBy: 'RANDY N. BURLAZA',
        verifiedByTitle: 'Barangay Biosecurity Officer (BBO)',
        approvedBy: 'ENGR. ARNEL M. VASQUEZ',
        approvedByTitle: 'Municipal Agriculturist',
        contentTemplate: `Respectfully transmitting herewith the attached official documents from the Department of Agriculture - Office of the Municipal Agriculturist (DA-OMAS), Municipality of Hinunangan, Southern Leyte:

1. {{document_list}}

These documents certify that the swine raisers within the {{barangay}}, Municipality of {{municipality}}, Province of {{province}} have been duly audited and verified under the National African Swine Fever Prevention and Control Program (BABay ASF).

For your information, verification, and official record.`,
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'transmittal-2026-002',
        refNo: 'TM-OMAS-2026-088',
        date: new Date().toISOString().split('T')[0],
        from: 'Engr. Arnel M. Vasquez',
        fromTitle: 'Municipal Agriculturist',
        to: 'Bureau of Animal Industry (BAI) - Region VIII\nDepartment of Agriculture Regional Field Office 8\nKanhuraw Hill, Tacloban City',
        toTitle: 'Regional Executive Director',
        subject: 'MUNICIPAL SWINE DISPATCH & BARANGAY CLEARANCES TRANSMITTAL',
        barangay: 'Barangays Nava, Nueva Esperanza, and Tuburan',
        municipality: 'Hinunangan',
        province: 'Southern Leyte',
        documentCount: 18,
        documentList: [
          'Barangay Livestock Transit & Slaughter Clearances',
          'Veterinary Health Certificates (VHC) Batch Dispatches',
          'Swine Ear Tag Geo-Verification Records',
        ],
        preparedBy: 'HON. VICENTE T. MADRONERO JR.',
        preparedByTitle: 'Punong Barangay & Agriculture Committee Chair',
        verifiedBy: 'RANDY N. BURLAZA',
        verifiedByTitle: 'Municipal Livestock Inspector',
        approvedBy: 'ENGR. ARNEL M. VASQUEZ',
        approvedByTitle: 'Municipal Agriculturist',
        contentTemplate: `Respectfully submitting to your good office the consolidated livestock certifications and biosecurity clearances for the Municipality of {{municipality}}, {{province}}:

{{document_list}}

Total Documents Transmitted: {{document_count}} set(s).
Prepared for regional trade accreditation and ASF Green Zone maintenance.`,
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const stored = getItem<TransmittalLetter[] | null>(STORAGE_KEYS.TRANSMITTAL_LETTERS, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.TRANSMITTAL_LETTERS, defaultLetters);
      return defaultLetters;
    }
    return stored;
  },

  saveTransmittalLetters(letters: TransmittalLetter[]): void {
    setItem(STORAGE_KEYS.TRANSMITTAL_LETTERS, letters);
  },

  getTransmittalLetterById(id: string): TransmittalLetter | undefined {
    return this.getTransmittalLetters().find(l => l.id === id);
  },

  saveTransmittalLetter(letter: TransmittalLetter): void {
    const list = this.getTransmittalLetters();
    const idx = list.findIndex(l => l.id === letter.id);
    const updated = {
      ...letter,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    this.saveTransmittalLetters(list);
  },

  deleteTransmittalLetter(id: string): void {
    const list = this.getTransmittalLetters().filter(l => l.id !== id);
    this.saveTransmittalLetters(list);
  },

  // Landing Page Customization
  getLandingConfig(): LandingPageConfig {
    return getItem<LandingPageConfig>(STORAGE_KEYS.LANDING, INITIAL_LANDING_CONFIG);
  },

  saveLandingConfig(config: LandingPageConfig, user?: UserAccount | null): void {
    setItem(STORAGE_KEYS.LANDING, config);

    // Sync with backend Express API
    try {
      fetch('/api/landing/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user?.role || 'admin',
          'x-user-name': user?.name || 'Administrator',
        },
        body: JSON.stringify(config),
      }).catch(err => console.warn('Landing config backend sync warning:', err));
    } catch {
      // offline fallback
    }
  },

  async fetchLandingConfigFromApi(): Promise<LandingPageConfig> {
    try {
      const res = await fetch('/api/landing/settings');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json.data) {
          setItem(STORAGE_KEYS.LANDING, json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API landing config fetch warning, using local cache:', err);
    }
    return this.getLandingConfig();
  },

  // Dynamic Form Config
  getDynamicFields(): DynamicFormField[] {
    const stored = getItem<DynamicFormField[] | null>(STORAGE_KEYS.DYNAMIC_FORM, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.DYNAMIC_FORM, INITIAL_DYNAMIC_FIELDS);
      return INITIAL_DYNAMIC_FIELDS;
    }
    return stored;
  },

  saveDynamicFields(fields: DynamicFormField[]): void {
    setItem(STORAGE_KEYS.DYNAMIC_FORM, fields);
  },

  saveDynamicField(field: DynamicFormField): void {
    const list = this.getDynamicFields();
    const idx = list.findIndex(f => f.id === field.id);
    if (idx >= 0) {
      list[idx] = field;
    } else {
      list.push(field);
    }
    this.saveDynamicFields(list);

    // Also synchronize field directly into current RegistryFormSchema so both are in 100% sync
    try {
      const schema = this.getRegistryFormSchema();
      const targetSecId = field.section === 'farmer' ? 'sec_farmer' : field.section === 'swine' ? 'sec_swine' : 'sec_biosecurity';
      let sec = schema.sections.find(s => s.id === targetSecId);
      if (!sec) {
        sec = schema.sections[0];
      }
      if (sec) {
        const regField: RegistryFormField = {
          id: field.id,
          fieldKey: field.id.replace(/^dyn-/, '').toLowerCase(),
          label: field.label,
          type: field.type === 'select' ? 'dropdown' : field.type === 'checkbox' ? 'checkbox' : field.type === 'number' ? 'number' : 'text',
          placeholder: field.placeholder,
          required: field.required,
          visible: field.enabled !== false,
          options: field.options,
        };
        const fIdx = sec.fields.findIndex(f => f.id === field.id);
        if (fIdx >= 0) {
          sec.fields[fIdx] = regField;
        } else {
          sec.fields.push(regField);
        }
        this.saveRegistryFormSchema(schema);
      }
    } catch {
      // ignore
    }
  },

  deleteDynamicField(id: string): void {
    const list = this.getDynamicFields().filter(f => f.id !== id);
    this.saveDynamicFields(list);

    // Also remove or hide from schema
    try {
      const schema = this.getRegistryFormSchema();
      let changed = false;
      schema.sections.forEach(sec => {
        const initialLen = sec.fields.length;
        sec.fields = sec.fields.filter(f => f.id !== id);
        if (sec.fields.length !== initialLen) changed = true;
      });
      if (changed) {
        this.saveRegistryFormSchema(schema);
      }
    } catch {
      // ignore
    }
  },

  // Offline Queue
  getOfflineQueue(): OfflineQueueItem[] {
    return getItem<OfflineQueueItem[]>(STORAGE_KEYS.OFFLINE_QUEUE, []);
  },

  enqueueOfflineAction(item: OfflineQueueItem): void {
    const queue = this.getOfflineQueue();
    queue.push(item);
    setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
    window.dispatchEvent(new CustomEvent('da_offline_queue_update', { detail: { count: queue.length } }));

    if (typeof window !== 'undefined') {
      const dataObj = item.data as Record<string, any> | undefined;
      indexedDbService.enqueueSyncItem(
        item.action as any,
        item.entity as any,
        dataObj?.id || item.id,
        item.data
      ).catch(() => {});
    }
  },

  clearOfflineQueue(): void {
    setItem(STORAGE_KEYS.OFFLINE_QUEUE, []);
    window.dispatchEvent(new CustomEvent('da_offline_queue_update', { detail: { count: 0 } }));
  },

  // Sync Offline Queue
  syncOfflineQueue(): { success: boolean; syncedCount: number } {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    // Mark all existing swine records as synced
    const swine = this.getSwineRecords();
    const updatedSwine = swine.map(s => ({ ...s, isSynced: true }));
    this.saveSwineRecords(updatedSwine);

    const count = queue.length;
    this.clearOfflineQueue();
    return { success: true, syncedCount: count };
  },

  // Barangay Biosecurity Audits
  getBiosecurityAudits(): BarangayBiosecurityAudit[] {
    const stored = getItem<BarangayBiosecurityAudit[] | null>(STORAGE_KEYS.BIOSECURITY_AUDITS, null);
    return stored || [];
  },

  saveBiosecurityAudits(audits: BarangayBiosecurityAudit[]): void {
    setItem(STORAGE_KEYS.BIOSECURITY_AUDITS, audits);
  },

  saveBiosecurityAudit(audit: BarangayBiosecurityAudit): void {
    const list = this.getBiosecurityAudits();
    const idx = list.findIndex(a => a.id === audit.id || a.barangay.toLowerCase() === audit.barangay.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...audit, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...audit, updatedAt: new Date().toISOString() });
    }
    this.saveBiosecurityAudits(list);
  },

  deleteBiosecurityAudit(id: string): void {
    const list = this.getBiosecurityAudits().filter(a => a.id !== id);
    this.saveBiosecurityAudits(list);
  },

  // Biosecurity Incidents
  getBiosecurityIncidents(): BiosecurityIncident[] {
    const stored = getItem<BiosecurityIncident[] | null>(STORAGE_KEYS.BIOSECURITY_INCIDENTS, null);
    return stored || [];
  },

  saveBiosecurityIncidents(incidents: BiosecurityIncident[]): void {
    setItem(STORAGE_KEYS.BIOSECURITY_INCIDENTS, incidents);
  },

  addBiosecurityIncident(incident: BiosecurityIncident): void {
    const list = this.getBiosecurityIncidents();
    list.unshift({ ...incident, updatedAt: new Date().toISOString() });
    this.saveBiosecurityIncidents(list);
  },

  updateBiosecurityIncident(updated: BiosecurityIncident): void {
    const list = this.getBiosecurityIncidents();
    const idx = list.findIndex(i => i.id === updated.id);
    if (idx >= 0) {
      list[idx] = { ...updated, updatedAt: new Date().toISOString() };
      this.saveBiosecurityIncidents(list);
    }
  },

  // Swine Marketing Alerts
  getMarketingAlerts(): MarketingAlert[] {
    const stored = getItem<MarketingAlert[] | null>(STORAGE_KEYS.MARKETING_ALERTS, null);
    return stored || [];
  },

  saveMarketingAlerts(alerts: MarketingAlert[]): void {
    setItem(STORAGE_KEYS.MARKETING_ALERTS, alerts);
  },

  addMarketingAlert(alert: MarketingAlert): void {
    const list = this.getMarketingAlerts();
    list.unshift(alert);
    this.saveMarketingAlerts(list);
  },

  updateMarketingAlert(alert: MarketingAlert): void {
    const list = this.getMarketingAlerts();
    const idx = list.findIndex(a => a.id === alert.id);
    if (idx >= 0) {
      list[idx] = alert;
      this.saveMarketingAlerts(list);
    }
  },

  toggleMarketingAlertStatus(id: string): void {
    const list = this.getMarketingAlerts();
    const item = list.find(a => a.id === id);
    if (item) {
      item.isActive = !item.isActive;
      this.saveMarketingAlerts(list);
    }
  },

  deleteMarketingAlert(id: string): void {
    const list = this.getMarketingAlerts().filter(a => a.id !== id);
    this.saveMarketingAlerts(list);
  },

  // Swine Take-Off Records
  getTakeoffRecords(): SwineTakeoffRecord[] {
    const stored = getItem<SwineTakeoffRecord[] | null>(STORAGE_KEYS.TAKEOFF_RECORDS, null);
    return stored || [];
  },

  saveTakeoffRecords(records: SwineTakeoffRecord[]): void {
    setItem(STORAGE_KEYS.TAKEOFF_RECORDS, records);
  },

  addTakeoffRecord(record: SwineTakeoffRecord): void {
    const list = this.getTakeoffRecords();
    list.unshift(record);
    this.saveTakeoffRecords(list);
  },

  updateTakeoffRecord(record: SwineTakeoffRecord): void {
    const list = this.getTakeoffRecords();
    const idx = list.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      list[idx] = { ...record, updatedAt: new Date().toISOString() };
      this.saveTakeoffRecords(list);
    }
  },

  deleteTakeoffRecord(id: string): void {
    const list = this.getTakeoffRecords().filter(r => r.id !== id);
    this.saveTakeoffRecords(list);
  },

  // African Swine Fever (ASF) Regulations & Executive Orders / Legal Decrees
  getAsfRegulations(): ASFRegulatoryDocument[] {
    const stored = getItem<ASFRegulatoryDocument[] | null>(STORAGE_KEYS.ASF_REGULATIONS, null);
    if (!stored || stored.length === 0 || !stored.some(d => d.id === 'mo-hinunangan-2025-59' && d.articles && d.articles.length >= 10)) {
      setItem(STORAGE_KEYS.ASF_REGULATIONS, ALL_ASF_REGULATIONS);
      return ALL_ASF_REGULATIONS;
    }
    // Deduplicate by ID to guarantee unique keys across all components and storage
    const seenIds = new Set<string>();
    const deduplicated: ASFRegulatoryDocument[] = [];
    for (const doc of stored) {
      if (doc && doc.id && !seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        deduplicated.push(doc);
      }
    }
    if (deduplicated.length !== stored.length) {
      setItem(STORAGE_KEYS.ASF_REGULATIONS, deduplicated);
    }
    return deduplicated;
  },

  saveAsfRegulations(docs: ASFRegulatoryDocument[]): void {
    const seenIds = new Set<string>();
    const deduplicated = docs.filter(d => {
      if (!d || !d.id || seenIds.has(d.id)) return false;
      seenIds.add(d.id);
      return true;
    });
    setItem(STORAGE_KEYS.ASF_REGULATIONS, deduplicated);
  },

  updateAsfRegulation(doc: ASFRegulatoryDocument, performedBy?: string, changeSummary?: string): void {
    const list = this.getAsfRegulations();
    const idx = list.findIndex(d => d.id === doc.id);
    
    // Auto add version and audit
    const updatedDoc: ASFRegulatoryDocument = { ...doc };
    if (changeSummary) {
      const versions = updatedDoc.versionHistory || [];
      const newVersion = (versions[0]?.version || 1) + 1;
      updatedDoc.versionHistory = [
        {
          version: newVersion,
          updatedAt: new Date().toISOString(),
          updatedBy: performedBy || 'System Admin',
          changeSummary,
        },
        ...versions,
      ];
      
      const logs = updatedDoc.auditLogs || [];
      updatedDoc.auditLogs = [
        {
          id: `log-${Date.now()}`,
          action: 'edited',
          timestamp: new Date().toISOString(),
          performedBy: performedBy || 'System Admin',
          details: changeSummary,
        },
        ...logs,
      ];
    }

    if (idx >= 0) {
      list[idx] = updatedDoc;
    } else {
      list.push(updatedDoc);
    }
    this.saveAsfRegulations(list);

    // Sync update to Express backend API
    try {
      fetch(`/api/legal-documents/${encodeURIComponent(updatedDoc.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-user-name': performedBy || 'System Admin',
        },
        body: JSON.stringify(updatedDoc),
      }).catch(err => console.warn('Legal document API update warning:', err));
    } catch {
      // offline fallback
    }
  },

  addAsfRegulation(doc: ASFRegulatoryDocument, performedBy?: string): void {
    const list = this.getAsfRegulations();
    const existingIndex = list.findIndex(d => d.id === doc.id);
    const newDoc: ASFRegulatoryDocument = {
      ...doc,
      id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: doc.status || 'active',
      versionHistory: doc.versionHistory || [
        {
          version: 1,
          updatedAt: new Date().toISOString(),
          updatedBy: performedBy || 'System Admin',
          changeSummary: 'Document created and enacted in system.',
        },
      ],
      auditLogs: doc.auditLogs || [
        {
          id: `log-${Date.now()}`,
          action: 'created',
          timestamp: new Date().toISOString(),
          performedBy: performedBy || 'System Admin',
          details: `Document ${doc.officialNumber} created.`,
        },
      ],
    };
    if (existingIndex >= 0) {
      list[existingIndex] = newDoc;
    } else {
      list.unshift(newDoc);
    }
    this.saveAsfRegulations(list);

    // Sync create to Express backend API
    try {
      fetch('/api/legal-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          'x-user-name': performedBy || 'System Admin',
        },
        body: JSON.stringify(newDoc),
      }).catch(err => console.warn('Legal document API create warning:', err));
    } catch {
      // offline fallback
    }
  },

  archiveAsfRegulation(id: string, performedBy?: string): void {
    const list = this.getAsfRegulations();
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: 'archived',
        isArchived: true,
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            action: 'archived',
            timestamp: new Date().toISOString(),
            performedBy: performedBy || 'System Admin',
            details: 'Document moved to archive.',
          },
          ...(list[idx].auditLogs || []),
        ],
      };
      this.saveAsfRegulations(list);

      try {
        fetch(`/api/legal-documents/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'admin',
            'x-user-name': performedBy || 'System Admin',
          },
          body: JSON.stringify(list[idx]),
        }).catch(err => console.warn('Legal document API archive warning:', err));
      } catch {
        // offline fallback
      }
    }
  },

  restoreAsfRegulation(id: string, performedBy?: string): void {
    const list = this.getAsfRegulations();
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: 'active',
        isArchived: false,
        auditLogs: [
          {
            id: `log-${Date.now()}`,
            action: 'restored',
            timestamp: new Date().toISOString(),
            performedBy: performedBy || 'System Admin',
            details: 'Document restored to active status.',
          },
          ...(list[idx].auditLogs || []),
        ],
      };
      this.saveAsfRegulations(list);

      try {
        fetch(`/api/legal-documents/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'admin',
            'x-user-name': performedBy || 'System Admin',
          },
          body: JSON.stringify(list[idx]),
        }).catch(err => console.warn('Legal document API restore warning:', err));
      } catch {
        // offline fallback
      }
    }
  },

  deleteAsfRegulation(id: string, performedBy?: string): void {
    const list = this.getAsfRegulations().filter(d => d.id !== id);
    this.saveAsfRegulations(list);

    try {
      fetch(`/api/legal-documents/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'admin',
          'x-user-name': performedBy || 'System Admin',
        },
      }).catch(err => console.warn('Legal document API delete warning:', err));
    } catch {
      // offline fallback
    }
  },

  async fetchAsfRegulationsFromApi(): Promise<ASFRegulatoryDocument[]> {
    try {
      const res = await fetch('/api/legal-documents');
      if (res.ok) {
        const json = await res.json();
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setItem(STORAGE_KEYS.ASF_REGULATIONS, json.data);
          return json.data;
        }
      }
    } catch (err) {
      console.warn('API legal regulations fetch warning, using local cache:', err);
    }
    return this.getAsfRegulations();
  },

  resetAsfRegulations(): ASFRegulatoryDocument[] {
    setItem(STORAGE_KEYS.ASF_REGULATIONS, ALL_ASF_REGULATIONS);
    return ALL_ASF_REGULATIONS;
  },

  // Legal Document Import History
  getLegalImportHistory(): LegalImportHistoryRecord[] {
    const defaultHistory: LegalImportHistoryRecord[] = [
      {
        id: 'hist-init-1',
        fileName: 'Ordinance_No_2025_59_Hinunangan.pdf',
        fileType: 'PDF',
        fileSize: '1.8 MB',
        documentTitle: 'AN ORDINANCE REGULATING THE OPERATIONS OF COMMERCIAL AND BACKYARD PIGGERY, POULTRY, AND OTHER LIVESTOCK OR ANIMAL FARMS IN HINUNANGAN, SOUTHERN LEYTE',
        documentNumber: '2025-59',
        documentType: 'Municipal Ordinance',
        category: 'ordinance',
        jurisdiction: 'Municipality of Hinunangan, Southern Leyte',
        importedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        importedBy: 'Admin (Hon. Gezar S. Ngoho Sponsor)',
        status: 'Successful',
        sectionsDetected: 25,
        articlesDetected: 10,
        documentId: 'mo-hinunangan-2025-59',
        notes: 'Full legal structure with 10 Articles and 25 Sections recognized.',
      },
      {
        id: 'hist-init-2',
        fileName: 'Resolution_No_376_Series_2026.pdf',
        fileType: 'PDF',
        fileSize: '840 KB',
        documentTitle: 'RESOLUTION MANDATING SYSTEMATIC REGISTRATION AND GEOREFERENCING OF LOCAL BREEDERS',
        documentNumber: '376',
        documentType: 'Resolution',
        category: 'resolution',
        jurisdiction: 'Municipality of Hinunangan, Southern Leyte',
        importedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        importedBy: 'Admin (Hon. Aida T. Bulingit Author)',
        status: 'Successful',
        sectionsDetected: 4,
        articlesDetected: 1,
        documentId: 'res-hinunangan-2026-376',
        notes: 'Resolution on swine census and georeferencing imported.',
      },
    ];

    const stored = getItem<LegalImportHistoryRecord[] | null>(STORAGE_KEYS.LEGAL_IMPORT_HISTORY, null);
    if (!stored || stored.length === 0) {
      setItem(STORAGE_KEYS.LEGAL_IMPORT_HISTORY, defaultHistory);
      return defaultHistory;
    }
    return stored;
  },

  saveLegalImportHistory(history: LegalImportHistoryRecord[]): void {
    setItem(STORAGE_KEYS.LEGAL_IMPORT_HISTORY, history);
  },

  addLegalImportHistory(record: LegalImportHistoryRecord): void {
    const list = this.getLegalImportHistory();
    list.unshift(record);
    this.saveLegalImportHistory(list);
  },

  deleteLegalImportHistory(id: string): void {
    const list = this.getLegalImportHistory().filter(h => h.id !== id);
    this.saveLegalImportHistory(list);
  },

  // Deep search across all legal documents, articles, sections, and provisions
  searchLegalDocumentsDeep(query: string): {
    document: ASFRegulatoryDocument;
    matches: {
      type: 'title' | 'number' | 'tag' | 'author' | 'article' | 'section';
      label: string;
      snippet: string;
      articleId?: string;
      sectionId?: string;
    }[];
  }[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const docs = this.getAsfRegulations();
    const results: {
      document: ASFRegulatoryDocument;
      matches: {
        type: 'title' | 'number' | 'tag' | 'author' | 'article' | 'section';
        label: string;
        snippet: string;
        articleId?: string;
        sectionId?: string;
      }[];
    }[] = [];

    docs.forEach(doc => {
      const docMatches: {
        type: 'title' | 'number' | 'tag' | 'author' | 'article' | 'section';
        label: string;
        snippet: string;
        articleId?: string;
        sectionId?: string;
      }[] = [];

      if (doc.title.toLowerCase().includes(q)) {
        docMatches.push({
          type: 'title',
          label: 'Official Title Match',
          snippet: doc.title,
        });
      }
      if (doc.officialNumber.toLowerCase().includes(q)) {
        docMatches.push({
          type: 'number',
          label: 'Document Number Match',
          snippet: `${doc.type} No. ${doc.officialNumber}`,
        });
      }
      if (doc.author && doc.author.toLowerCase().includes(q)) {
        docMatches.push({
          type: 'author',
          label: 'Author / Sponsor Match',
          snippet: `Author: ${doc.author}`,
        });
      }
      if (doc.tags && doc.tags.some(t => t.toLowerCase().includes(q))) {
        const matchedTags = doc.tags.filter(t => t.toLowerCase().includes(q));
        docMatches.push({
          type: 'tag',
          label: 'Tag Match',
          snippet: matchedTags.join(', '),
        });
      }

      // Search inside Articles & Sections
      (doc.articles || []).forEach(art => {
        if (art.articleTitle.toLowerCase().includes(q) || art.articleNumber.toLowerCase().includes(q)) {
          docMatches.push({
            type: 'article',
            label: `${art.articleNumber} Header`,
            snippet: `${art.articleNumber} - ${art.articleTitle}`,
            articleId: art.id,
          });
        }

        art.sections.forEach(sec => {
          const secTitleMatch = sec.sectionTitle.toLowerCase().includes(q) || sec.sectionNumber.toLowerCase().includes(q);
          const secContentMatch = sec.content.toLowerCase().includes(q);

          if (secTitleMatch || secContentMatch) {
            let snippet = sec.content;
            const idx = sec.content.toLowerCase().indexOf(q);
            if (idx >= 0) {
              const start = Math.max(0, idx - 60);
              const end = Math.min(sec.content.length, idx + q.length + 80);
              snippet = (start > 0 ? '...' : '') + sec.content.slice(start, end) + (end < sec.content.length ? '...' : '');
            } else {
              snippet = sec.content.slice(0, 120) + (sec.content.length > 120 ? '...' : '');
            }

            docMatches.push({
              type: 'section',
              label: `${sec.sectionNumber} (${sec.sectionTitle})`,
              snippet,
              articleId: art.id,
              sectionId: sec.id,
            });
          }
        });
      });

      if (docMatches.length > 0) {
        results.push({
          document: doc,
          matches: docMatches,
        });
      }
    });

    return results;
  },

  // Sidebar Theme Customization
  getSidebarTheme(): SidebarTheme {
    return getItem<SidebarTheme>(STORAGE_KEYS.SIDEBAR_THEME, DEFAULT_SIDEBAR_THEME);
  },

  saveSidebarTheme(theme: SidebarTheme): void {
    setItem(STORAGE_KEYS.SIDEBAR_THEME, theme);
    window.dispatchEvent(new CustomEvent('da_sidebar_theme_change', { detail: theme }));
  },

  resetSidebarTheme(): SidebarTheme {
    setItem(STORAGE_KEYS.SIDEBAR_THEME, DEFAULT_SIDEBAR_THEME);
    window.dispatchEvent(new CustomEvent('da_sidebar_theme_change', { detail: DEFAULT_SIDEBAR_THEME }));
    return DEFAULT_SIDEBAR_THEME;
  },

  // Registry Form Customization Schema
  getRegistryFormSchema(): RegistryFormSchema {
    const stored = getItem<RegistryFormSchema | null>(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, null);
    if (!stored || !stored.sections || stored.sections.length === 0) {
      setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, INITIAL_REGISTRY_FORM_SCHEMA);
      return INITIAL_REGISTRY_FORM_SCHEMA;
    }
    const hasOrdinanceField = stored.sections.some(s => s.fields?.some(f => f.id === 'fld_governing_ordinance'));
    if (!hasOrdinanceField) {
      const docSec = stored.sections.find(s => s.id === 'sec_documents') || stored.sections[stored.sections.length - 1];
      if (docSec) {
        docSec.fields.unshift({
          id: 'fld_governing_ordinance',
          label: 'Applicable Municipal Ordinance / Legal Decree',
          type: 'dropdown',
          placeholder: 'Select Applicable Ordinance or Resolution',
          helpText: 'Official legal mandate and environmental buffer standards enforced for this farm',
          required: true,
          visible: true,
          options: [
            'Municipal Ordinance No. 2025-59 (Piggery & Poultry Regulation Ordinance - Baboyang Walang Amoy & Setbacks)',
            'Resolution No. 376 Series of 2026 (Local Breeders & Backyard Raisers Registration with OMAS)',
            'Provincial Ordinance No. 2023-144 (Southern Leyte Provincial Bantay ASF Ordinance)',
            'Municipal Executive Order No. 12-2023 (Hinunangan ASF Border Disinfection & Biosecurity Protocols)',
            'Provincial Ordinance No. 2021-018 (Swine Biosecurity & Inter-Barangay Movement Permitting)',
          ],
          defaultValue: 'Municipal Ordinance No. 2025-59 (Piggery & Poultry Regulation Ordinance - Baboyang Walang Amoy & Setbacks)',
        });
      }
    }
    return stored;
  },

  saveRegistryFormSchema(schema: RegistryFormSchema): void {
    const published = {
      ...schema,
      isPublished: true,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, published);
    // Also update draft to match published
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, published);
    window.dispatchEvent(new CustomEvent('da_registry_schema_change', { detail: published }));
    if (typeof fetch !== 'undefined') {
      fetch('/api/registry-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(published),
      }).catch(() => {});
    }
  },

  getRegistryFormDraft(): RegistryFormSchema {
    const draft = getItem<RegistryFormSchema | null>(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, null);
    if (draft && draft.sections && draft.sections.length > 0) {
      return draft;
    }
    return this.getRegistryFormSchema();
  },

  saveRegistryFormDraft(schema: RegistryFormSchema): void {
    const updated = {
      ...schema,
      lastUpdated: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, updated);
    // Ensure the main form schema is synchronized immediately with latest admin customization settings
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, updated);
    window.dispatchEvent(new CustomEvent('da_registry_schema_change', { detail: updated }));
    if (typeof fetch !== 'undefined') {
      fetch('/api/registry-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  },

  resetRegistryFormSchema(): RegistryFormSchema {
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA, INITIAL_REGISTRY_FORM_SCHEMA);
    setItem(STORAGE_KEYS.REGISTRY_FORM_SCHEMA_DRAFT, INITIAL_REGISTRY_FORM_SCHEMA);
    window.dispatchEvent(new CustomEvent('da_registry_schema_change', { detail: INITIAL_REGISTRY_FORM_SCHEMA }));
    if (typeof fetch !== 'undefined') {
      fetch('/api/registry-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(INITIAL_REGISTRY_FORM_SCHEMA),
      }).catch(() => {});
    }
    return INITIAL_REGISTRY_FORM_SCHEMA;
  },

  // Backup and Restore
  exportAllData(): string {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      swine: this.getSwineRecords(),
      barangays: this.getBarangays(),
      accounts: this.getAccounts(),
      messages: this.getMessages(),
      certConfig: this.getCertificateConfig(),
      issuedCertificates: this.getIssuedCertificates(),
      landingConfig: this.getLandingConfig(),
      dynamicFields: this.getDynamicFields(),
    };
    return JSON.stringify(fullBackup, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.swine) setItem(STORAGE_KEYS.SWINE, data.swine);
      if (data.barangays) setItem(STORAGE_KEYS.BARANGAYS, data.barangays);
      if (data.accounts) setItem(STORAGE_KEYS.ACCOUNTS, data.accounts);
      if (data.messages) setItem(STORAGE_KEYS.MESSAGES, data.messages);
      if (data.certConfig) setItem(STORAGE_KEYS.CERT_CONFIG, data.certConfig);
      if (data.issuedCertificates) setItem(STORAGE_KEYS.CERT_ISSUED, data.issuedCertificates);
      if (data.landingConfig) setItem(STORAGE_KEYS.LANDING, data.landingConfig);
      if (data.dynamicFields) setItem(STORAGE_KEYS.DYNAMIC_FORM, data.dynamicFields);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  resetToDefaults(): void {
    localStorage.clear();
    window.location.reload();
  },
};
