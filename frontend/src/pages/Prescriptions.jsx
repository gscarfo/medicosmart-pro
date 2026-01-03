import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPatients, getPrescriptions, savePrescription, deletePrescription } from '../utils/storage';
import { generatePrescriptionPDF, formatDate, printPDF, downloadPDF } from '../utils/pdfGenerator';

const Prescriptions = () => {
  const { user } = useAuth();
  const { success, error: showError, info } = useToast();
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [prescriptionContent, setPrescriptionContent] = useState('');
  const [sendingMode, setSendingMode] = useState(null);

  const prescriptionRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = () => {
    if (!user) return;

    const patientsList = getPatients(user.id);
    const prescriptionsList = getPrescriptions(user.id);

    setPatients(patientsList);
    setPrescriptions(
      prescriptionsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    );
    setLoading(false);
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchPatient(`${patient.firstName} ${patient.lastName}`);
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      showError('Seleziona un paziente');
      return;
    }

    if (!prescriptionContent.trim()) {
      showError('Inserisci il contenuto della prescrizione');
      return;
    }

    try {
      const prescriptionData = {
        doctorId: user.id,
        patientId: selectedPatient.id,
        content: prescriptionContent
      };

      const newPrescription = savePrescription(prescriptionData);
      setPrescriptions(prev => [newPrescription, ...prev]);

      success('Prescrizione creata con successo!');
      handleSendPrescription(newPrescription, 'print');

      // Reset form
      setShowNewPrescription(false);
      setSelectedPatient(null);
      setSearchPatient('');
      setPrescriptionContent('');
    } catch (err) {
      showError('Errore durante la creazione della prescrizione');
    }
  };

  const handleSendPrescription = (prescription, mode) => {
    if (!prescription) {
      showError('Seleziona una prescrizione');
      return;
    }

    const patient = patients.find(p => p.id === prescription.patientId);
    if (!patient) {
      showError('Paziente non trovato');
      return;
    }

    setSendingMode(mode);

    // Genera il PDF
    generatePrescriptionPDF(prescription, user, patient, (pdfBlob) => {
      switch (mode) {
        case 'print':
          // Apri dialogo stampa
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const printWindow = window.open(pdfUrl, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              printWindow.print();
            };
          }
          success('PDF aperto per la stampa');
          break;

        case 'email':
          // Simula invio email
          if (patient.email) {
            info(`Email inviata a ${patient.email}`);
            success('Email inviata con successo!');
          } else {
            showError('Il paziente non ha un\'email registrata');
          }
          break;

        case 'sms':
          // Simula invio SMS
          if (patient.phone) {
            info(`SMS inviato a ${patient.phone}`);
            success('SMS inviato con successo!');
          } else {
            showError('Il paziente non ha un numero di telefono registrato');
          }
          break;

        case 'download':
          // Scarica il PDF
          const link = document.createElement('a');
          link.href = URL.createObjectURL(pdfBlob);
          link.download = `ricetta_${patient.lastName}_${formatDate(prescription.createdAt).replace(/\//g, '-')}.pdf`;
          link.click();
          success('PDF scaricato con successo!');
          break;

        default:
          break;
      }

      setSendingMode(null);
    });
  };

  const handleDeletePrescription = (prescriptionId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa prescrizione?')) {
      try {
        deletePrescription(prescriptionId);
        setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId));
        success('Prescrizione eliminata con successo!');
      } catch (err) {
        showError('Errore durante l\'eliminazione');
      }
    }
  };

  const filteredPatients = searchPatient
    ? patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchPatient.toLowerCase()) ||
        (p.fiscalCode && p.fiscalCode.toLowerCase().includes(searchPatient.toLowerCase()))
      ).slice(0, 5)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Caricamento prescrizioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title mb-1">Prescrizioni</h1>
          <p className="text-gray-500">Crea e gestisci le ricette mediche</p>
        </div>
        <button
          onClick={() => setShowNewPrescription(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuova Prescrizione
        </button>
      </div>

      {/* Lista prescrizioni */}
      <div className="card">
        <div className="card-header">
          <h2 className="section-title mb-0">Storico Prescrizioni</h2>
        </div>

        {prescriptions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {prescriptions.map((prescription) => {
              const patient = patients.find(p => p.id === prescription.patientId);

              return (
                <div key={prescription.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-700">
                            {patient ? `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}` : '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient ? `${patient.firstName} ${patient.lastName}` : 'Paziente non trovato'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {patient?.birthDate && `${formatDate(patient.birthDate)} • `}
                            {formatDate(prescription.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 pl-13">
                        {prescription.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 lg:flex-col lg:gap-1">
                      <button
                        onClick={() => handleSendPrescription(prescription, 'print')}
                        disabled={sendingMode}
                        className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
                        title="Stampa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span className="hidden sm:inline">Stampa</span>
                      </button>

                      <button
                        onClick={() => handleSendPrescription(prescription, 'email')}
                        disabled={sendingMode}
                        className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
                        title="Invia Email"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Email</span>
                      </button>

                      <button
                        onClick={() => handleSendPrescription(prescription, 'sms')}
                        disabled={sendingMode}
                        className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
                        title="Invia SMS"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="hidden sm:inline">SMS</span>
                      </button>

                      <button
                        onClick={() => handleDeletePrescription(prescription.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">Nessuna prescrizione ancora</p>
            <button
              onClick={() => setShowNewPrescription(true)}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Crea la prima prescrizione
            </button>
          </div>
        )}
      </div>

      {/* Modal nuova prescrizione */}
      {showNewPrescription && (
        <div className="modal-overlay" onClick={() => setShowNewPrescription(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Nuova Prescrizione Medica</h3>
              <p className="text-sm text-gray-500 mt-1">Compila la ricetta per il paziente</p>
            </div>

            <form onSubmit={handleCreatePrescription} className="p-6 space-y-6">
              {/* Selezione paziente */}
              <div>
                <label className="input-label">Paziente *</label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchPatient}
                    onChange={(e) => {
                      setSearchPatient(e.target.value);
                      setSelectedPatient(null);
                    }}
                    className="input-field pl-10"
                    placeholder="Cerca paziente per nome o codice fiscale..."
                  />

                  {/* Dropdown risultati */}
                  {filteredPatients.length > 0 && !selectedPatient && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                        >
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-700">
                              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(patient.birthDate)} • {patient.fiscalCode || 'N/A'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-green-800">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                        <p className="text-sm text-green-600">
                          Nato/a il {formatDate(selectedPatient.birthDate)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchPatient('');
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Contenuto prescrizione */}
              <div>
                <label htmlFor="content" className="input-label">
                  Prescrizione *
                </label>
                <textarea
                  id="content"
                  value={prescriptionContent}
                  onChange={(e) => setPrescriptionContent(e.target.value)}
                  className="input-field min-h-[200px]"
                  placeholder="Scrivi qui la prescrizione medica...

Esempio:
- Farmaco 1: 1 compressa al giorno per 7 giorni
- Farmaco 2: 2 compresse al giorno lontano dai pasti
- Riposo assoluto per 3 giorni"
                  required
                />
              </div>

              {/* Anteprima intestazione */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Anteprima Intestazione</p>
                <div className="bg-white border border-gray-200 rounded p-4">
                  <div className="border-b-2 border-primary-600 pb-2 mb-2">
                    <p className="text-sm font-bold text-primary-700">RICETTA MEDICA</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.title || 'Dott.'} {user?.fullName}
                  </p>
                  <p className="text-sm text-gray-600">{user?.address}</p>
                  <p className="text-sm text-gray-600">Tel: {user?.phone}</p>

                  {selectedPatient && (
                    <>
                      <div className="my-3 border-t border-dashed border-gray-300"></div>
                      <p className="text-sm font-medium text-gray-900">
                        Paziente: {selectedPatient.firstName} {selectedPatient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Data di nascita: {formatDate(selectedPatient.birthDate)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Crea e Stampa
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPrescription(false)}
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

export default Prescriptions;
