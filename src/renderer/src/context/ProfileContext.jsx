import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const ProfileContext = createContext(undefined);

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  role: 'Administrateur',
  photo: null,
};

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      let loaded = null;

      // 1) source principale: settings.json via IPC (persiste même si le port Vite change)
      try {
        if (window.electronAPI && window.electronAPI.getProfile) {
          const result = await window.electronAPI.getProfile();
          const data = result && result.success ? result.data : null;
          if (data && typeof data === 'object') {
            loaded = data;
          }
        }
      } catch {
        // ignorer
      }

      // 2) fallback: localStorage
      if (!loaded) {
        try {
          const raw = localStorage.getItem('settings.profile');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              loaded = parsed;
            }
          }
        } catch {
          // ignorer
        }
      }

      if (!mounted) return;

      if (loaded) {
        setProfile((prev) => ({ ...prev, ...loaded }));
      }

      setHydrated(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    // Appliquer un nom par défaut basé sur l'utilisateur connecté seulement si le profil est vide
    if (user && user.username) {
      setProfile((prev) => {
        if (prev && String(prev.name || '').trim()) return prev;
        return { ...prev, name: user.username };
      });
      return;
    }
    setProfile((prev) => {
      if (prev && String(prev.name || '').trim()) return prev;
      return { ...prev, name: 'Admin' };
    });
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    // localStorage (fallback)
    try {
      localStorage.setItem('settings.profile', JSON.stringify(profile));
    } catch {
      // ignorer
    }

    // persistance durable via IPC
    (async () => {
      try {
        if (!window.electronAPI || !window.electronAPI.setProfile) return;
        const result = await window.electronAPI.setProfile(profile);
        if (cancelled) return;
        if (!result || !result.success) {
          // ignorer
        }
      } catch {
        // ignorer
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, hydrated]);

  const initials = useMemo(() => {
    const n = (profile.name || '').trim();
    if (!n) return 'A';
    const parts = n.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    const value = (first + last).toUpperCase();
    return value || 'A';
  }, [profile.name]);

  const value = useMemo(() => ({ profile, setProfile, initials }), [profile, initials]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
