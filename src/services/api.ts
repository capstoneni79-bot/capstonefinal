import {
  Barangay,
  CertificateTemplate,
  IssuedCertificate,
  MessageItem,
  RegistryFormSchema,
  SidebarTheme,
  SwineRecord,
  UserAccount,
} from '../types.ts';
import { storageService } from './storageService.ts';

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
    // Non-browser or SSR fallback
  }

  return headers;
}

export const authApi = {
  async login(username: string, password: string): Promise<{ user: UserAccount; role: string; assignedBarangay?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({ success: false, error: 'Network error or server unavailable.' }));
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Invalid credentials or login failed.');
    }
    return { user: data.user, role: data.role, assignedBarangay: data.assignedBarangay };
  },
};

export const accountsApi = {
  async getAll(): Promise<UserAccount[]> {
    const res = await fetch('/api/accounts', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load user accounts from database.');
    }
    const data = await res.json();
    return data.data || [];
  },

  async create(user: Partial<UserAccount>): Promise<UserAccount> {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Unable to save user account to database.');
    }
    return data.data;
  },

  async update(id: string, user: Partial<UserAccount>): Promise<UserAccount> {
    const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Unable to update user account in database.');
    }
    return data.data;
  },

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`/api/accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to delete user account from database.');
    }
    return true;
  },
};

export const farmersApi = {
  async getAll(): Promise<any[]> {
    const res = await fetch('/api/farmers', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load farmers from database.');
    }
    const data = await res.json();
    return data.data || [];
  },
};

export const barangaysApi = {
  async getAll(): Promise<Barangay[]> {
    const res = await fetch('/api/barangays', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load barangay statistics from database.');
    }
    const data = await res.json();
    return data.data || [];
  },
};

export const dashboardApi = {
  async getStats(): Promise<any> {
    const res = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load dashboard metrics from database.');
    }
    const data = await res.json();
    return data.data;
  },
};

export const certificatesApi = {
  async getAll(barangay?: string): Promise<IssuedCertificate[]> {
    const url = barangay && barangay !== 'all'
      ? `/api/certificates?filter_barangay=${encodeURIComponent(barangay)}`
      : '/api/certificates';

    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load certificates from database.');
    }
    const data = await res.json();
    return data.data || [];
  },

  async create(cert: Partial<IssuedCertificate>): Promise<IssuedCertificate> {
    const res = await fetch('/api/certificates', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(cert),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Unable to save certificate to database.');
    }
    return data.data;
  },
};

export const messagesApi = {
  async getAll(): Promise<MessageItem[]> {
    const res = await fetch('/api/messages', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load messages from database.');
    }
    const data = await res.json();
    return data.data || [];
  },

  async send(msg: Partial<MessageItem>): Promise<MessageItem> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(msg),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Unable to send message to database.');
    }
    return data.data;
  },

  async markRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/messages/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`/api/messages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },
};

export const mediaApi = {
  async getAll(category?: string): Promise<any[]> {
    const url = category && category !== 'ALL'
      ? `/api/media?category=${encodeURIComponent(category)}`
      : '/api/media';
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Unable to load media from database.');
    }
    const data = await res.json();
    return data.data || [];
  },

  async upload(payload: { fileName: string; fileUrl?: string; base64?: string; category?: string; altText?: string }): Promise<any> {
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || 'Unable to upload media to database.');
    }
    return data.data;
  },

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`/api/media/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },
};

export const settingsApi = {
  async getLandingConfig(): Promise<any> {
    const res = await fetch('/api/landing-config', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    return data?.config;
  },

  async saveLandingConfig(config: any): Promise<any> {
    const res = await fetch('/api/landing-config', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    const data = await res.json().catch(() => null);
    return data?.config;
  },

  async getSidebarTheme(): Promise<SidebarTheme> {
    const res = await fetch('/api/admin/sidebar-theme', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    return data?.theme;
  },

  async saveSidebarTheme(theme: SidebarTheme): Promise<SidebarTheme> {
    const res = await fetch('/api/admin/sidebar-theme', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(theme),
    });
    const data = await res.json().catch(() => null);
    return data?.theme;
  },

  async getRegistryFormSchema(): Promise<RegistryFormSchema> {
    const res = await fetch('/api/admin/registry-form-schema', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => null);
    return data?.schema;
  },

  async saveRegistryFormSchema(schema: RegistryFormSchema): Promise<RegistryFormSchema> {
    const res = await fetch('/api/admin/registry-form-schema', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(schema),
    });
    const data = await res.json().catch(() => null);
    return data?.schema;
  },
};
