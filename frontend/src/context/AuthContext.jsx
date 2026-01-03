import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getUsers,
  saveUser,
  updateUser,
  initializeStorage
} from '../utils/storage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const users = getUsers();
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      setCurrentUser(foundUser);
      setUser(foundUser);
      return { success: true, user: foundUser };
    }

    return { success: false, error: 'Username o password non validi' };
  };

  const register = async (username, password, role = 'doctor') => {
    const users = getUsers();

    if (users.find(u => u.username === username)) {
      return { success: false, error: 'Username già in uso' };
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    saveUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    clearCurrentUser();
    setUser(null);
  };

  const updateProfile = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      updateUser(user.id, updates);
      setCurrentUser(updatedUser);
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
