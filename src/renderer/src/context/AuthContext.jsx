import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!window.electronAPI || !window.electronAPI.getSession) {
          if (mounted) {
            setUser(null);
          }
          return;
        }
        const result = await window.electronAPI.getSession();
        if (mounted) {
          setUser(result && result.success ? result.data : null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (username, password) => {
    if (!window.electronAPI || !window.electronAPI.login) {
      return { success: false, error: 'API non disponible' };
    }
    const result = await window.electronAPI.login(username, password);
    if (result && result.success) {
      setUser(result.data);
    }
    return result;
  };

  const logout = () => {
    setUser(null);
    if (window.electronAPI && window.electronAPI.logout) {
      window.electronAPI.logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
