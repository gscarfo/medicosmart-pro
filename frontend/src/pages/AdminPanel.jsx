import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUsers, saveUser, updateUser, deleteUser, generateId } from '../utils/storage';
import { formatDate } from '../utils/pdfGenerator';

const AdminPanel = () => {
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'doctor',
    title: 'Dott.',
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers.filter(u => u.id !== currentUser?.id)); // Esclude se stesso
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    if (!formData.username.trim()) {
      showError('Inserisci un username');
      return false;
    }
    if (!editingUser && !formData.password) {
      showError('Inserisci una password');
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      showError('La password deve essere di almeno 6 caratteri');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (editingUser) {
        // Aggiorna utente esistente
        const updates = {
          username: formData.username,
          role: formData.role,
          title: formData.title,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        };

        if (formData.password) {
          updates.password = formData.password;
        }

        updateUser(editingUser.id, updates);
        success('Utente aggiornato con successo!');
      } else {
        // Crea nuovo utente
        const newUser = {
          id: generateId(),
          username: formData.username,
          password: formData.password,
          role: formData.role,
          title: formData.title,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          createdAt: new Date().toISOString()
        };
        saveUser(newUser);
        success('Utente creato con successo!');
      }

      closeModal();
      loadUsers();
    } catch (err) {
      showError('Errore durante il salvataggio');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      title: user.title || 'Dott.',
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    });
    setShowModal(true);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente? Questa azione è irreversibile.')) {
      try {
        deleteUser(userId);
        success('Utente eliminato con successo!');
        loadUsers();
      } catch (err) {
        showError('Errore durante l\'eliminazione');
      }
    }
  };

  const handleToggleStatus = (user) => {
    // Simula attivazione/disattivazione
    const newStatus = user.role === 'active' ? 'inactive' : 'active';
    updateUser(user.id, { role: newStatus });
    success(`Utente ${newStatus === 'active' ? 'attivato' : 'disattivato'} con successo!`);
    loadUsers();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'doctor',
      title: 'Dott.',
      fullName: '',
      email: '',
      phone: '',
      address: ''
    });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Amministratore', color: 'badge-danger' };
      case 'doctor':
        return { label: 'Medico', color: 'badge-info' };
      default:
        return { label: role, color: 'badge-warning' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-1">Gestione Utenti</h1>
          <p className="text-gray-500">Amministra gli account dei medici registrati</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Nuovo Utente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Totale Utenti</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amministratori</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Medici</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => u.role === 'doctor').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Utente</th>
                <th className="table-header">Ruolo</th>
                <th className="table-header">Contatti</th>
                <th className="table-header">Registrato</th>
                <th className="table-header text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((user) => {
                  const roleInfo = getRoleLabel(user.role);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-600">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.title || ''} {user.fullName || user.username}
                            </p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {user.email && <p className="text-gray-600">{user.email}</p>}
                          {user.phone && <p className="text-gray-400">{user.phone}</p>}
                        </div>
                      </td>
                      <td className="table-cell text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Modifica"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Elimina"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-2">Nessun utente registrato</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Aggiungi il primo utente
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingUser ? 'Aggiorna i dati dell\'utente' : 'Crea un nuovo account utente'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="role" className="input-label">
                  Ruolo
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="doctor">Medico</option>
                  <option value="admin">Amministratore</option>
                </select>
              </div>

              <div>
                <label htmlFor="username" className="input-label">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="username"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="input-label">
                  Password {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder={editingUser ? 'Lascia vuoto per non modificare' : 'Minimo 6 caratteri'}
                  minLength={6}
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="title" className="input-label">
                    Titolo
                  </label>
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="Dott.">Dott.</option>
                    <option value="Dott.ssa">Dott.ssa</option>
                    <option value="Prof.">Prof.</option>
                    <option value="Prof.ssa">Prof.ssa</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Dr.ssa">Dr.ssa</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fullName" className="input-label">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Mario Rossi"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="input-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="mario.rossi@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="input-label">
                  Telefono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="+39 333 1234567"
                />
              </div>

              <div>
                <label htmlFor="address" className="input-label">
                  Indirizzo Studio
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Via Roma 123, 00100 Roma"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingUser ? 'Aggiorna' : 'Crea Utente'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
