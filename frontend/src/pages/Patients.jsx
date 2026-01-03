import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPatients, savePatient, deletePatient, searchPatients } from '../utils/storage';
import { formatDate, formatDateForInput } from '../utils/pdfGenerator';

const Patients = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    fiscalCode: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadPatients();
  }, [user, searchQuery]);

  const loadPatients = () => {
    if (!user) return;

    if (searchQuery.trim()) {
      setPatients(searchPatients(user.id, searchQuery));
    } else {
      setPatients(getPatients(user.id));
    }
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
    if (!formData.firstName.trim()) {
      showError('Inserisci il nome del paziente');
      return false;
    }
    if (!formData.lastName.trim()) {
      showError('Inserisci il cognome del paziente');
      return false;
    }
    if (!formData.birthDate) {
      showError('Inserisci la data di nascita');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const patientData = {
        ...formData,
        doctorId: user.id
      };

      if (editingPatient) {
        // Update existing patient
        const updatedPatients = patients.map(p =>
          p.id === editingPatient.id ? { ...p, ...formData } : p
        );
        setPatients(updatedPatients);
        success('Paziente aggiornato con successo!');
      } else {
        // Add new patient
        const newPatient = savePatient(patientData);
        setPatients(prev => [...prev, newPatient]);
        success('Paziente registrato con successo!');
      }

      closeModal();
    } catch (err) {
      showError('Errore durante il salvataggio del paziente');
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    setFormData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: formatDateForInput(patient.birthDate),
      fiscalCode: patient.fiscalCode || '',
      phone: patient.phone || '',
      email: patient.email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (patientId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo paziente?')) {
      try {
        deletePatient(patientId);
        setPatients(prev => prev.filter(p => p.id !== patientId));
        success('Paziente eliminato con successo!');
      } catch (err) {
        showError('Errore durante l\'eliminazione del paziente');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPatient(null);
    setFormData({
      firstName: '',
      lastName: '',
      birthDate: '',
      fiscalCode: '',
      phone: '',
      email: ''
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Caricamento pazienti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-1">Gestione Pazienti</h1>
          <p className="text-gray-500">Visualizza e gestisci i tuoi pazienti</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Nuovo Paziente
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="p-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca paziente per nome, cognome o codice fiscale..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Paziente</th>
                <th className="table-header">Data di Nascita</th>
                <th className="table-header">Codice Fiscale</th>
                <th className="table-header">Contatti</th>
                <th className="table-header text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-700">
                            {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {calculateAge(patient.birthDate)} anni
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {formatDate(patient.birthDate)}
                    </td>
                    <td className="table-cell font-mono text-sm">
                      {patient.fiscalCode || '-'}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm">
                        {patient.phone && (
                          <p className="text-gray-600">{patient.phone}</p>
                        )}
                        {patient.email && (
                          <p className="text-gray-400 text-xs">{patient.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Modifica"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id)}
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-2">Nessun paziente trovato</p>
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        Aggiungi il primo paziente
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        Totale pazienti: <span className="font-semibold text-gray-900">{patients.length}</span>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPatient ? 'Modifica Paziente' : 'Nuovo Paziente'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingPatient ? 'Aggiorna i dati del paziente' : 'Inserisci i dati del nuovo paziente'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="input-label">
                    Nome *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Mario"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="input-label">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Rossi"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="birthDate" className="input-label">
                  Data di Nascita *
                </label>
                <input
                  type="date"
                  id="birthDate"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="fiscalCode" className="input-label">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  id="fiscalCode"
                  name="fiscalCode"
                  value={formData.fiscalCode}
                  onChange={handleChange}
                  className="input-field font-mono"
                  placeholder="RSSMRA80A01H501Q"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingPatient ? 'Aggiorna' : 'Salva'}
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

export default Patients;
