import { useState, useEffect } from 'react';
import { paymentAPI } from '@/services/api';

export function usePayments() {
  const [studentPayments, setStudentPayments] = useState([]);
  const [teacherPayments, setTeacherPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const [studentData, teacherData] = await Promise.all([
        paymentAPI.getStudentPayments(),
        paymentAPI.getTeacherPayments()
      ]);
      setStudentPayments(studentData);
      setTeacherPayments(teacherData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const createStudentPayment = async (data) => {
    const result = await paymentAPI.createStudentPayment(data);
    if (result.success) {
      await loadPayments();
    }
    return result;
  };

  const createTeacherPayment = async (data) => {
    const result = await paymentAPI.createTeacherPayment(data);
    if (result.success) {
      await loadPayments();
    }
    return result;
  };

  return {
    studentPayments,
    teacherPayments,
    loading,
    error,
    createStudentPayment,
    createTeacherPayment,
    refresh: loadPayments,
  };
}
