// Utilità per la gestione del LocalStorage
const STORAGE_KEYS = {
  USERS: 'medicosmart_users',
  CURRENT_USER: 'medicosmart_current_user',
  PATIENTS: 'medicosmart_patients',
  PRESCRIPTIONS: 'medicosmart_prescriptions',
};

// Inizializza i dati di default se non esistono
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: 'admin',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS)) {
    localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify([]));
  }
};

// Gestione Utenti
export const getUsers = () => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS);
  return users ? JSON.parse(users) : [];
};

export const saveUser = (user) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const updateUser = (userId, updates) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};

export const deleteUser = (userId) => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
};

export const findUserByUsername = (username) => {
  const users = getUsers();
  return users.find(u => u.username === username);
};

export const findUserById = (id) => {
  const users = getUsers();
  return users.find(u => u.id === id);
};

// Sessione Corrente
export const setCurrentUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

export const getCurrentUser = () => {
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return user ? JSON.parse(user) : null;
};

export const clearCurrentUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Gestione Pazienti
export const getPatients = (doctorId) => {
  const patients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
  const allPatients = patients ? JSON.parse(patients) : [];
  return allPatients.filter(p => p.doctorId === doctorId);
};

export const savePatient = (patient) => {
  const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
  const newPatient = {
    ...patient,
    id: 'pat_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  patients.push(newPatient);
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  return newPatient;
};

export const updatePatient = (patientId, updates) => {
  const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
  const index = patients.findIndex(p => p.id === patientId);
  if (index !== -1) {
    patients[index] = { ...patients[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }
};

export const deletePatient = (patientId) => {
  const patients = JSON.parse(localStorage.getItem(STORAGE_KEYS.PATIENTS) || '[]');
  const filtered = patients.filter(p => p.id !== patientId);
  localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(filtered));
};

export const searchPatients = (doctorId, query) => {
  const patients = getPatients(doctorId);
  const lowerQuery = query.toLowerCase();
  return patients.filter(p =>
    p.firstName.toLowerCase().includes(lowerQuery) ||
    p.lastName.toLowerCase().includes(lowerQuery) ||
    (p.fiscalCode && p.fiscalCode.toLowerCase().includes(lowerQuery))
  );
};

// Gestione Prescrizioni
export const getPrescriptions = (doctorId) => {
  const prescriptions = localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS);
  const allPrescriptions = prescriptions ? JSON.parse(prescriptions) : [];
  return allPrescriptions.filter(p => p.doctorId === doctorId);
};

export const getPatientPrescriptions = (patientId) => {
  const prescriptions = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS) || '[]');
  return prescriptions.filter(p => p.patientId === patientId);
};

export const savePrescription = (prescription) => {
  const prescriptions = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS) || '[]');
  const newPrescription = {
    ...prescription,
    id: 'rx_' + Date.now(),
    createdAt: new Date().toISOString()
  };
  prescriptions.push(newPrescription);
  localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(prescriptions));
  return newPrescription;
};

export const deletePrescription = (prescriptionId) => {
  const prescriptions = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRESCRIPTIONS) || '[]');
  const filtered = prescriptions.filter(p => p.id !== prescriptionId);
  localStorage.setItem(STORAGE_KEYS.PRESCRIPTIONS, JSON.stringify(filtered));
};

// Generatore ID univoco
export const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};
