import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { api } from '../services/api';

const STORAGE_KEY = 'studyai.auth';
const AuthContext = createContext(null);

function readStoredAuth() {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return {
      token: null,
      usuario: null
    };
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return {
      token: null,
      usuario: null
    };
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    token: null,
    usuario: null
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedAuth = readStoredAuth();
    setAuthState(storedAuth);
    api.setAuthToken(storedAuth.token);
    setIsReady(true);
  }, []);

  const saveAuth = (nextState) => {
    setAuthState(nextState);
    api.setAuthToken(nextState.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const clearAuth = () => {
    setAuthState({
      token: null,
      usuario: null
    });
    api.setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    const nextState = {
      token: response.token,
      usuario: response.usuario
    };

    saveAuth(nextState);
    return response;
  };

  const register = async (payload) => {
    return authService.register(payload);
  };

  const value = useMemo(
    () => ({
      token: authState.token,
      usuario: authState.usuario,
      isAuthenticated: Boolean(authState.token),
      isReady,
      login,
      register,
      logout: clearAuth
    }),
    [authState, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
