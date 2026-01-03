// API Configuration for MedicoSmart Pro
// Update this URL after deploying the backend to Railway

const API_URL = import.meta.env.VITE_API_URL || 'https://medicosmart-api.up.railway.app';

const api = {
  baseUrl: API_URL,

  // Utility per le richieste
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    // Recupera il token
    const token = localStorage.getItem('medicosmart_token');

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Errore nella richiesta');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Autenticazione
  auth: {
    async login(username, password) {
      return api.request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
    },

    async register(userData) {
      return api.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async me() {
      return api.request('/api/auth/me');
    },

    async updatePassword(currentPassword, newPassword) {
      return api.request('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    }
  },

  // Pazienti
  patients: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/api/patients${query ? `?${query}` : ''}`);
    },

    async getById(id) {
      return api.request(`/api/patients/${id}`);
    },

    async create(patientData) {
      return api.request('/api/patients', {
        method: 'POST',
        body: JSON.stringify(patientData)
      });
    },

    async update(id, patientData) {
      return api.request(`/api/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patientData)
      });
    },

    async delete(id) {
      return api.request(`/api/patients/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Prescrizioni
  prescriptions: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/api/prescriptions${query ? `?${query}` : ''}`);
    },

    async getById(id) {
      return api.request(`/api/prescriptions/${id}`);
    },

    async create(prescriptionData) {
      return api.request('/api/prescriptions', {
        method: 'POST',
        body: JSON.stringify(prescriptionData)
      });
    },

    async sign(id) {
      return api.request(`/api/prescriptions/${id}/sign`, {
        method: 'POST'
      });
    },

    async send(id, type, recipient) {
      return api.request(`/api/prescriptions/${id}/send`, {
        method: 'POST',
        body: JSON.stringify({ type, recipient })
      });
    },

    async download(id) {
      const token = localStorage.getItem('medicosmart_token');
      window.open(`${API_URL}/api/prescriptions/${id}/download`, '_blank');
    },

    async delete(id) {
      return api.request(`/api/prescriptions/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Admin
  admin: {
    async getUsers(params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/api/admin${query ? `?${query}` : ''}`);
    },

    async getStats() {
      return api.request('/api/admin/stats');
    },

    async createUser(userData) {
      return api.request('/api/admin', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async updateUser(id, userData) {
      return api.request(`/api/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
    },

    async deleteUser(id) {
      return api.request(`/api/admin/${id}`, {
        method: 'DELETE'
      });
    }
  }
};

export default api;
