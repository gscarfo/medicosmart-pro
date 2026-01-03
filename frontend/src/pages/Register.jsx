import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const { register } = useAuth();
  const { error: showError, success } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    title: 'Dott.',
    fullName: '',
    email: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Inserisci un username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'L\'username deve essere di almeno 3 caratteri';
    }

    if (!formData.password) {
      newErrors.password = 'Inserisci una password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La password deve essere di almeno 6 caratteri';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Le password non coincidono';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Inserisci il tuo nome completo';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Inserisci la tua email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Inserisci un\'email valida';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Inserisci il tuo numero di telefono';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Inserisci l\'indirizzo dello studio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    const result = await register(formData.username, formData.password, 'doctor');

    if (result.success) {
      // Aggiorna il profilo con i dati aggiuntivi
      const { updateProfile } = useAuth();
      updateProfile({
        title: formData.title,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
      });
      success('Registrazione completata con successo! Benvenuto in MedicoSmart.');
      navigate('/dashboard');
    } else {
      showError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo e titolo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl shadow-lg mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MedicoSmart</h1>
          <p className="text-gray-500 mt-1">Registrati per iniziare</p>
        </div>

        {/* Card registrazione */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Crea il tuo account</h2>
            <p className="text-sm text-gray-500">Compila tutti i campi richiesti</p>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Titolo e Nome */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
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
                <div className="col-span-2">
                  <label htmlFor="fullName" className="input-label">
                    Nome e Cognome *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`input-field ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Mario Rossi"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>
              </div>

              {/* Email e Telefono */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="mario.rossi@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
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
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+39 333 1234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Indirizzo studio */}
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
                  className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Via Roma 123, 00100 Roma"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <hr className="border-gray-200" />

              {/* Credenziali */}
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
                  className={`input-field ${errors.username ? 'border-red-500' : ''}`}
                  placeholder="Scegli un username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="input-label">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Minimo 6 caratteri"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="input-label">
                    Conferma Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Ripeti la password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registrazione in corso...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span>Registrati</span>
                  </>
                )}
              </button>
            </form>

            {/* Link login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Hai già un account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Accedi
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2024 MedicoSmart. Tutti i diritti riservati.
        </p>
      </div>
    </div>
  );
};

export default Register;
