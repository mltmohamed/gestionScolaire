import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardAPI } from '@/services/api';

export function useDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasLoadedRef = useRef(false);
  const requestIdRef = useRef(0);

  const loadDashboardData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isInitialLoad = !hasLoadedRef.current;

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const data = await dashboardAPI.getStats();
      if (requestId !== requestIdRef.current) {
        return { success: false, ignored: true };
      }

      setStats(data);
      const updatedAt = new Date();
      setLastUpdated(updatedAt);
      hasLoadedRef.current = true;
      return { success: true, updatedAt };
    } catch (err) {
      const message = err?.message || 'Une erreur inattendue empêche le chargement du tableau de bord.';
      if (requestId === requestIdRef.current) {
        setError(message);
      }
      return { success: false, error: message };
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadDashboardData]);

  return {
    stats,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh: loadDashboardData,
  };
}
