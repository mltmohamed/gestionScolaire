import { useState, useEffect } from 'react';
import { teacherAPI } from '@/services/api';

export function useTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await teacherAPI.getAll();
      setTeachers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const createTeacher = async (data) => {
    const result = await teacherAPI.create(data);
    if (result.success) {
      await loadTeachers();
    }
    return result;
  };

  const updateTeacher = async (id, data) => {
    const result = await teacherAPI.update(id, data);
    if (result.success) {
      await loadTeachers();
    }
    return result;
  };

  const deleteTeacher = async (id) => {
    const result = await teacherAPI.delete(id);
    if (result.success) {
      await loadTeachers();
    }
    return result;
  };

  return {
    teachers,
    loading,
    error,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    refresh: loadTeachers,
  };
}
