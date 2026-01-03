import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatients, getPrescriptions } from '../utils/storage';
import { formatDate } from '../utils/pdfGenerator';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayPrescriptions: 0,
    weekPrescriptions: 0
  });
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = () => {
    if (!user) return;

    const patients = getPatients(user.id);
    const prescriptions = getPrescriptions(user.id);

    const today = new Date().toDateString();
    const todayPres = prescriptions.filter(p => new Date(p.createdAt).toDateString() === today);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekPres = prescriptions.filter(p => new Date(p.createdAt) >= weekAgo);

    // Ultime 5 prescrizioni
    const sortedPrescriptions = [...prescriptions]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    setStats({
      totalPatients: patients.length,
      todayPrescriptions: todayPres.length,
      weekPrescriptions: weekPres.length
    });

    setRecentPrescriptions(sortedPrescriptions);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buonpomeriggio';
    return 'Buonasera';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.title || 'Dott.'} {user?.fullName || user?.username}
        </h1>
        <p className="text-gray-500 mt-1">
          Ecco un riepilogo delle tue attività di oggi
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Totale Pazienti</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prescrizioni Oggi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayPrescriptions}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Questa Settimana</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weekPrescriptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Azioni rapide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Link to="/prescriptions" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Nuova Prescrizione</h3>
              <p className="text-gray-500 text-sm">Crea rapidamente una nuova ricetta medica</p>
            </div>
          </div>
        </Link>

        <Link to="/patients" className="card p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Registra Paziente</h3>
              <p className="text-gray-500 text-sm">Aggiungi un nuovo paziente al tuo archivio</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Ultime prescrizioni */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Ultime Prescrizioni</h3>
          <Link to="/prescriptions" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Vedi tutte
          </Link>
        </div>

        {recentPrescriptions.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {recentPrescriptions.map((prescription) => {
              const patients = getPatients(user.id);
              const patient = patients.find(p => p.id === prescription.patientId);

              return (
                <div key={prescription.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient ? `${patient.firstName} ${patient.lastName}` : 'Paziente non trovato'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                        {prescription.content.substring(0, 80)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(prescription.createdAt)}</p>
                      <span className="badge badge-success">Completata</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">Nessuna prescrizione ancora</p>
            <Link to="/prescriptions" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              Crea la prima prescrizione
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
