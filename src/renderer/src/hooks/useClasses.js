import { useState, useEffect } from 'react';
import { classAPI } from '@/services/api';

export function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classAPI.getAll();
      setClasses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const createClass = async (data) => {
    const result = await classAPI.create(data);
    if (result.success) {
      await loadClasses();
    }
    return result;
  };

  const updateClass = async (id, data) => {
    const result = await classAPI.update(id, data);
    if (result.success) {
      await loadClasses();
    }
    return result;
  };

  const deleteClass = async (id) => {
    const result = await classAPI.delete(id);
    if (result.success) {
      await loadClasses();
    }
    return result;
  };

  return {
    classes,
    loading,
    error,
    createClass,
    updateClass,
    deleteClass,
    refresh: loadClasses,
  };
}
