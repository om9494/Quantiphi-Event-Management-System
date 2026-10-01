import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMeApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Called after successful login/register
  const login = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Re-hydrate user from token on first load
  useEffect(() => {
    const hydrateUser = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await getMeApi();
        setUser(data.user);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    hydrateUser();
  }, []); // run once on mount

  // Listen for 401 events from the axios interceptor
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuth: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for easy consumption in components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
