// BalanceVault Client API Layer
const API_BASE = '/api';

class ApiService {
  static getToken() {
    return localStorage.getItem('bv_token');
  }

  static setToken(token) {
    if (token) {
      localStorage.setItem('bv_token', token);
    } else {
      localStorage.removeItem('bv_token');
    }
  }

  static async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // Health
  static getHealth() { return this.request('/health'); }
  static getReady() { return this.request('/ready'); }

  // Bootstrap
  static getBootstrapStatus() { return this.request('/auth/bootstrap/status'); }
  static bootstrapAdmin(data) {
    return this.request('/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Auth
  static register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static login(data) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  static getMe() { return this.request('/auth/me'); }

  // Accounts & Money Movement
  static getAccounts() { return this.request('/accounts'); }
  static createAccount(data) {
    return this.request('/accounts/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  static deposit(data) {
    return this.request('/accounts/deposit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  static transfer(data) {
    return this.request('/accounts/transfer', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  static getAccountLedger(id) { return this.request(`/accounts/${id}/ledger`); }

  // Onboarding
  static getOnboardingStatus() { return this.request('/onboarding/status'); }
  static submitOnboarding(data) {
    return this.request('/onboarding/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Admin
  static getAdminStats() { return this.request('/admin/stats'); }
  static getAdminUsers() { return this.request('/admin/users'); }
  static updateUserStatus(id, status) {
    return this.request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
  static getAdminOnboarding() { return this.request('/admin/onboarding'); }
  static reviewOnboarding(id, decision, reviewerNotes) {
    return this.request(`/admin/onboarding/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewerNotes })
    });
  }
  static getAuditLogs() { return this.request('/admin/audit-logs'); }
  static verifyLedger() { return this.request('/admin/ledger/verify'); }
}

export default ApiService;

