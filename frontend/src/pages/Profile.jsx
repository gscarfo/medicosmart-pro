import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../utils/storage';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: user?.title || 'Dott.',
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      updateUser(user.id, formData);
      updateProfile(formData);
      setEditing(false);
      success('Profilo aggiornato con successo!');
    } catch (err) {
      showError('Errore durante l\'aggiornamento del profilo');
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setFormData({
      title: user?.title || 'Dott.',
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setEditing(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="page-title">Profilo Medico</h1>

      {/* Card informazioni */}
      <div className="card mb-6">
        <div className="card-header flex items-center justify-between">
          <div>
            <h2 className="section-title mb-1">Informazioni Personali</h2>
            <p className="text-sm text-gray-500">I dati che appariranno sulle tue ricette</p>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Modifica
            </button>
          )}
        </div>

        <div className="card-body">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Nome e Cognome *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Mario Rossi"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="input-label">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="mario.rossi@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="input-label">
                    Telefono *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="+39 333 1234567"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="input-label">
                  Indirizzo Studio *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Via Roma 123, 00100 Roma"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Questo indirizzo apparirà nell'intestazione di ogni ricetta
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  Salva Modifiche
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Annulla
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-700">
                    {formData.title} {formData.fullName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {formData.title} {formData.fullName}
                  </h3>
                  <p className="text-gray-500">Medico Chirurgo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{formData.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Telefono</p>
                    <p className="text-sm font-medium text-gray-900">{formData.phone || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Indirizzo Studio</p>
                    <p className="text-sm font-medium text-gray-900">{formData.address || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Anteprima ricetta */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title mb-1">Anteprima Intestazione Ricetta</h2>
          <p className="text-sm text-gray-500">Così apparirà l'intestazione sulle tue ricette</p>
        </div>

        <div className="card-body bg-gray-50">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="border-b-2 border-primary-600 pb-4 mb-4">
              <h3 className="text-lg font-bold text-primary-700">RICETTA MEDICA</h3>
            </div>

            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-900">{formData.title} {formData.fullName}</p>
              <p className="text-gray-600">{formData.address}</p>
              <p className="text-gray-600">Tel: {formData.phone} | Email: {formData.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
