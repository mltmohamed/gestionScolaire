import { useState, useEffect } from 'react';
import { studentAPI } from '@/services/api';

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getAll();
      setStudents(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const createStudent = async (data) => {
    const result = await studentAPI.create(data);
    if (result.success) {
      await loadStudents();
    }
    return result;
  };

  const updateStudent = async (id, data) => {
    const result = await studentAPI.update(id, data);
    if (result.success) {
      await loadStudents();
    }
    return result;
  };

  const deleteStudent = async (id) => {
    const result = await studentAPI.delete(id);
    if (result.success) {
      await loadStudents();
    }
    return result;
  };

  const deactivateStudent = async (id) => {
    const result = await studentAPI.deactivate(id);
    if (result.success) {
      await loadStudents();
    }
    return result;
  };

  const activateStudent = async (id) => {
    const result = await studentAPI.activate(id);
    if (result.success) {
      await loadStudents();
    }
    return result;
  };

  const hardDeleteStudent = async (id) => {
    const result = await studentAPI.hardDelete(id);
    if (result.success) {
      await loadStudents();
    }
    return result;
  };

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    deactivateStudent,
    activateStudent,
    hardDeleteStudent,
    refresh: loadStudents,
  };
}
