import { SwineRecord } from '../types.ts';
import { storageService } from './storageService.ts';

export interface SwineApiQueryParams {
  barangay?: string;
  search?: string;
  status?: string;
  readyToSell?: boolean;
  isArchived?: boolean;
  page?: number;
  perPage?: number;
}

export interface SwineApiResponse {
  success: boolean;
  data: SwineRecord[];
  total: number;
  count: number;
  scope?: string;
  error?: string;
}

export interface SingleSwineApiResponse {
  success: boolean;
  data?: SwineRecord;
  record?: SwineRecord;
  error?: string;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const user = storageService.getCurrentUser();
    if (user) {
      headers['x-user-role'] = user.role || 'focal';
      headers['x-user-id'] = user.id || '';
      headers['x-user-name'] = user.username || user.name || '';
      if (user.assignedBarangay) {
        headers['x-user-assigned-barangay'] = user.assignedBarangay;
      }
      if (user.barangay_id) {
        headers['x-user-barangay-id'] = user.barangay_id;
      }
    }
  } catch {
    // Ignore error in non-browser environments
  }

  return headers;
}

export const swineApi = {
  /**
   * Fetch all swine records from the database via backend API.
   */
  async getAll(params?: SwineApiQueryParams): Promise<{ records: SwineRecord[]; total: number }> {
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

    const queryString = searchParams.toString();
    const endpoint = `/api/swine-records${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const message = errJson?.error || 'Unable to connect to the Swine Registry database. Please check the backend connection.';
      throw new Error(message);
    }

    const data: SwineApiResponse = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to retrieve swine records.');
    }

    return {
      records: data.data || [],
      total: data.total ?? (data.data ? data.data.length : 0),
    };
  },

  /**
   * Fetch a single swine record by database ID or Tag ID.
   */
  async getById(id: string): Promise<SwineRecord> {
    const res = await fetch(`/api/swine-records/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || 'Unable to retrieve swine record from the database.');
    }

    const result: SingleSwineApiResponse = await res.json();
    const record = result.data || result.record;
    if (!record) {
      throw new Error('Swine record not found in the database.');
    }
    return record;
  },

  /**
   * Save a newly created swine record directly to the database.
   */
  async create(record: Partial<SwineRecord>): Promise<SwineRecord> {
    const res = await fetch('/api/swine-records', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(record),
    });

    const data: SingleSwineApiResponse = await res.json().catch(() => ({ success: false, error: 'Invalid response from server' }));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Unable to save swine record to the database.');
    }

    return (data.data || data.record || record) as SwineRecord;
  },

  /**
   * Update an existing swine record in the database.
   */
  async update(id: string, record: Partial<SwineRecord>): Promise<SwineRecord> {
    const res = await fetch(`/api/swine-records/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(record),
    });

    const data: SingleSwineApiResponse = await res.json().catch(() => ({ success: false, error: 'Invalid response from server' }));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Unable to update swine record in the database.');
    }

    return (data.data || data.record || record) as SwineRecord;
  },

  /**
   * Delete a swine record from the database.
   */
  async delete(id: string): Promise<boolean> {
    const res = await fetch(`/api/swine-records/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || 'Unable to delete swine record from the database.');
    }

    return true;
  },

  /**
   * Bulk delete swine records from the database.
   */
  async bulkDelete(ids: string[]): Promise<number> {
    const res = await fetch('/api/swine-records/bulk-delete', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(errJson?.error || 'Unable to bulk delete swine records from the database.');
    }

    const data = await res.json();
    return data.deletedCount ?? ids.length;
  },

  /**
   * Update sell status in the database.
   */
  async toggleSell(id: string, readyToSell: boolean, priceEstimate?: number): Promise<SwineRecord> {
    const res = await fetch(`/api/swine-records/${encodeURIComponent(id)}/sell`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ readyToSell, priceEstimate }),
    });

    const data: SingleSwineApiResponse = await res.json().catch(() => ({ success: false, error: 'Invalid response from server' }));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Unable to update sale status in the database.');
    }

    return (data.data || data.record) as SwineRecord;
  },
};
