import { useCallback, useState } from 'react';
import { bulletinAPI } from '@/services/api';

export function useBulletin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getBulletin = useCallback(async (studentId, academicYear) => {
    try {
      setLoading(true);
      const data = await bulletinAPI.get(studentId, academicYear);
      setError(null);
      return data;
    } catch (e) {
      setError(e?.message || 'Erreur chargement bulletin');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBulletin = useCallback(async (studentId, academicYear, payload) => {
    try {
      setLoading(true);
      const res = await bulletinAPI.save(studentId, academicYear, payload);
      if (!res?.success) {
        throw new Error(res?.error || 'Erreur sauvegarde bulletin');
      }
      setError(null);
      return res;
    } catch (e) {
      setError(e?.message || 'Erreur sauvegarde bulletin');
      return { success: false, error: e?.message || 'Erreur sauvegarde bulletin' };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getBulletin,
    saveBulletin,
  };
}
