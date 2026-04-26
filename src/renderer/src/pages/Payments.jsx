import React, { useState } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, GraduationCap, Shirt, Users, TrendingUp, CheckCircle, XCircle, Eye, DollarSign, Pencil, Trash2, Printer, AlertCircle } from 'lucide-react';
import { ConfirmHardDeleteDialog } from '@/components/ui/alert-dialog';

export default function Payments() {
  const {
    studentPayments,
    teacherPayments,
    loading,
    createStudentPayment,
    createTeacherPayment,
    updateStudentPayment,
    deleteStudentPayment,
    updateTeacherPayment,
    deleteTeacherPayment,
  } = usePayments();
  const { students } = useStudents();
  const { teachers } = useTeachers();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();

  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isTeacherDialogOpen, setIsTeacherDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tuition');
  const [searchTerm, setSearchTerm] = useState('');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, payment: null });

  const [editingPayment, setEditingPayment] = useState(null);

  const [filters, setFilters] = useState({
    class_id: 'all',
    payment_method: 'all',
    academic_year: 'all',
    teacher_id: 'all',
    period_year: 'all',
    period_month: 'all',
  });

  // Statistiques calculées basées sur les données filtrées
  const stats = React.useMemo(() => {
    if (activeTab === 'teachers') {
      const filtered = teacherPayments.filter((p) => {
        const q = (searchTerm || '').trim().toLowerCase();
        const matchSearch = !q
          ? true
          : (`${p.first_name || ''} ${p.last_name || ''}`).toLowerCase().includes(q);

        const matchTeacher = filters.teacher_id === 'all' ? true : String(p.teacher_id || '') === String(filters.teacher_id);
        const matchMethod =
          filters.payment_method === 'all' ? true : String(p.payment_method || '').trim() === String(filters.payment_method || '').trim();
        const matchYear = filters.period_year === 'all' ? true : String(p.period_year || '') === String(filters.period_year);
        const matchMonth = filters.period_month === 'all' ? true : String(p.period_month || '') === String(filters.period_month);

        return matchSearch && matchTeacher && matchMethod && matchYear && matchMonth;
      });

      const totalPaid = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const uniqueTeachersPaid = new Set(filtered.map(p => p.teacher_id)).size;
      
      // Calculer le total attendu en fonction des enseignants filtrés
      const filteredTeacherIds = filters.teacher_id === 'all' 
        ? new Set(teachers.map(t => t.id))
        : new Set([filters.teacher_id]);
      const relevantTeachers = teachers.filter(t => filteredTeacherIds.has(t.id));
      const totalExpectedSalary = relevantTeachers.reduce((sum, t) => sum + (t.salary || 0), 0);
      
      return {
        totalAmount: totalPaid,
        totalExpected: totalExpectedSalary,
        countPaid: uniqueTeachersPaid,
        countUnpaid: relevantTeachers.length - uniqueTeachersPaid,
        label: "Salaires Versés",
        subLabel: "Enseignants Payés",
        unpaidLabel: "Restants à Payer",
        expectedLabel: "Total Salaires Attendus"
      };
    } else {
      const filtered = studentPayments.filter((p) => {
        const q = (searchTerm || '').trim().toLowerCase();
        const matchSearch = !q
          ? true
          : (`${p.first_name || ''} ${p.last_name || ''}`).toLowerCase().includes(q);

        const matchType = p.type === (activeTab === 'tuition' ? 'tuition' : 'uniform');
        const matchClass = filters.class_id === 'all' ? true : String(p.class_id || '') === String(filters.class_id);
        const matchMethod =
          filters.payment_method === 'all' ? true : String(p.payment_method || '').trim() === String(filters.payment_method || '').trim();
        const matchYear =
          filters.academic_year === 'all' ? true : String(p.academic_year || '').trim() === String(filters.academic_year || '').trim();

        return matchSearch && matchType && matchClass && matchMethod && matchYear;
      });

      const totalAmount = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const studentsWhoPaid = new Set(filtered.map(p => p.student_id)).size;
      
      // Calculer le total attendu en fonction des frais de classe
      const relevantStudents = filters.class_id === 'all' 
        ? students 
        : students.filter(s => String(s.class_id) === String(filters.class_id));
      
      const totalExpectedFees = relevantStudents.reduce((sum, s) => {
        const cls = s.class_id ? classById.get(String(s.class_id)) : null;
        const fee = activeTab === 'tuition' 
          ? (cls?.tuition_fee || 0) 
          : (cls?.uniform_fee || 0);
        return sum + fee;
      }, 0);
      
      // Calculer le total restant à payer
      const totalRemaining = relevantStudents.reduce((sum, s) => {
        const balance = getStudentBalance(s.id, activeTab === 'tuition' ? 'tuition' : 'uniform');
        return sum + balance.remaining;
      }, 0);
      
      return {
        totalAmount,
        totalExpected: totalExpectedFees,
        totalRemaining,
        countPaid: studentsWhoPaid,
        countUnpaid: relevantStudents.length - studentsWhoPaid,
        label: activeTab === 'tuition' ? "Scolarité Collectée" : "Ventes Tenues",
        subLabel: "Élèves ayant payé",
        unpaidLabel: "N'ayant pas payé",
        expectedLabel: activeTab === 'tuition' ? "Total Frais Scolarité" : "Total Frais Tenues"
      };
    }
  }, [activeTab, studentPayments, teacherPayments, students, teachers, filters, searchTerm, classById, getStudentBalance]);

  const [studentFormData, setStudentFormData] = useState({
    student_id: '',
    type: 'tuition',
    amount: '',
    month_total: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Espèces',
    description: '',
    academic_year: '2025-2026',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
  });

  const [teacherFormData, setTeacherFormData] = useState({
    teacher_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Espèces',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    description: '',
  });

  const [studentDialogFilters, setStudentDialogFilters] = useState({
    search: '',
    class_id: 'all',
    academic_year: 'all',
  });

  const [teacherDialogSearch, setTeacherDialogSearch] = useState('');

  // États pour afficher les informations de solde et salaire
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
  const [selectedTeacherInfo, setSelectedTeacherInfo] = useState(null);
  const [selectedMonthInfo, setSelectedMonthInfo] = useState(null); // Info paiement mensuel scolarité
  const [selectedTuitionPaymentIds, setSelectedTuitionPaymentIds] = useState([]);

  // Constantes pour les mois scolaires (Octobre à Juin = 9 mois)
  const ALL_MONTHS = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  const classById = React.useMemo(() => {
    const map = new Map();
    for (const c of classes) {
      if (c && c.id != null) map.set(String(c.id), c);
    }
    return map;
  }, [classes]);

  const classAcademicYearOptions = React.useMemo(() => {
    const values = new Set();
    for (const c of classes) {
      const y = String(c.academic_year || '').trim();
      if (y) values.add(y);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [classes]);

  // Fonction pour calculer le solde restant d'un élève
  const getStudentBalance = React.useCallback((studentId, paymentType) => {
    if (!studentId) return { totalFee: 0, paidAmount: 0, remaining: 0 };
    
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return { totalFee: 0, paidAmount: 0, remaining: 0 };
    
    const studentClass = student.class_id ? classById.get(String(student.class_id)) : null;
    const totalFee = paymentType === 'tuition' 
      ? (studentClass?.tuition_fee || 0) 
      : (studentClass?.uniform_fee || 0);
    
    // Calculer le total déjà payé par cet élève pour ce type
    const paidAmount = studentPayments
      .filter(p => String(p.student_id) === String(studentId) && p.type === paymentType)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const remaining = Math.max(0, totalFee - paidAmount);
    return { totalFee, paidAmount, remaining, studentClass };
  }, [students, studentPayments, classById]);

  // Fonction pour calculer les informations de paiement mensuel scolarité
  const getMonthlyTuitionInfo = React.useCallback((studentId, month, year, monthTotalOverride) => {
    if (!studentId || !month || !year) return null;
    
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return null;
    
    const studentClass = student.class_id ? classById.get(String(student.class_id)) : null;

    const paymentsForThisMonth = studentPayments.filter(p => 
      String(p.student_id) === String(studentId) &&
      p.type === 'tuition' &&
      p.period_month === month &&
      p.period_year === year
    );

    const storedMonthTotal = paymentsForThisMonth
      .map(p => p.month_total)
      .find(v => v !== null && v !== undefined && String(v).trim() !== '');

    const monthTotalRaw = storedMonthTotal ?? monthTotalOverride;
    const monthTotal = Number(monthTotalRaw || 0);
    
    // Calculer ce qui a déjà été payé pour ce mois spécifique
    const paidForThisMonth = paymentsForThisMonth.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    // Pour la modification, exclure le paiement en cours d'édition
    const editingId = editingPayment?.id;
    const paidExcludingEditing = editingId 
      ? paidForThisMonth - (studentPayments.find(p => p.id === editingId)?.amount || 0)
      : paidForThisMonth;
    
    const remainingForMonth = Math.max(0, monthTotal - paidExcludingEditing);
    const isFullyPaid = monthTotal > 0 && remainingForMonth <= 0;
    const isPartiallyPaid = monthTotal > 0 && paidExcludingEditing > 0 && remainingForMonth > 0;
    
    return {
      monthTotal,
      hasStoredMonthTotal: storedMonthTotal !== null && storedMonthTotal !== undefined && String(storedMonthTotal).trim() !== '',
      paidForThisMonth: paidExcludingEditing,
      remainingForMonth,
      isFullyPaid,
      isPartiallyPaid,
      monthLabel: ALL_MONTHS.find(m => m.value === month)?.label || '',
      studentClass,
    };
  }, [students, studentPayments, classById, editingPayment]);

  // Fonction pour calculer le salaire restant d'un enseignant
  const getTeacherSalaryInfo = React.useCallback((teacherId) => {
    if (!teacherId) return { salary: 0, paidThisMonth: 0, remaining: 0 };
    
    const teacher = teachers.find(t => String(t.id) === String(teacherId));
    if (!teacher) return { salary: 0, paidThisMonth: 0, remaining: 0 };
    
    const salary = teacher.salary || 0;
    const currentMonth = teacherFormData.period_month;
    const currentYear = teacherFormData.period_year;
    
    // Calculer ce qui a déjà été payé ce mois-ci
    const paidThisMonth = teacherPayments
      .filter(p => 
        String(p.teacher_id) === String(teacherId) && 
        p.period_month === currentMonth && 
        p.period_year === currentYear
      )
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    // Pour la modification, exclure le paiement en cours d'édition
    const editingId = editingPayment?.id;
    const paidExcludingEditing = editingId 
      ? paidThisMonth - (teacherPayments.find(p => p.id === editingId)?.amount || 0)
      : paidThisMonth;
    
    const remaining = Math.max(0, salary - paidExcludingEditing);
    return { salary, paidThisMonth: paidExcludingEditing, remaining, teacher };
  }, [teachers, teacherPayments, teacherFormData.period_month, teacherFormData.period_year, editingPayment]);

  // Mettre à jour les infos élève sélectionné
  React.useEffect(() => {
    if (studentFormData.student_id) {
      const balance = getStudentBalance(studentFormData.student_id, studentFormData.type);
      setSelectedStudentInfo(balance);
    } else {
      setSelectedStudentInfo(null);
    }
  }, [studentFormData.student_id, studentFormData.type, getStudentBalance]);

  // Mettre à jour les infos mensuelles scolarité
  React.useEffect(() => {
    if (studentFormData.student_id && studentFormData.type === 'tuition') {
      const monthInfo = getMonthlyTuitionInfo(
        studentFormData.student_id, 
        studentFormData.period_month, 
        studentFormData.period_year,
        studentFormData.month_total
      );
      setSelectedMonthInfo(monthInfo);
      
      // Si on a un month_total enregistré en DB, le refléter dans le formulaire
      if (monthInfo && monthInfo.hasStoredMonthTotal && String(studentFormData.month_total || '').trim() === '') {
        setStudentFormData(prev => ({ ...prev, month_total: String(monthInfo.monthTotal || '') }));
      }

      // Pré-remplir le montant avec le reste dû pour ce mois si création
      if (!editingPayment && monthInfo && monthInfo.remainingForMonth > 0 && !studentFormData.amount) {
        setStudentFormData(prev => ({ ...prev, amount: String(monthInfo.remainingForMonth) }));
      }
    } else {
      setSelectedMonthInfo(null);
    }
  }, [studentFormData.student_id, studentFormData.type, studentFormData.period_month, studentFormData.period_year, studentFormData.month_total, getMonthlyTuitionInfo, editingPayment]);

  React.useEffect(() => {
    if (activeTab !== 'tuition' && selectedTuitionPaymentIds.length > 0) {
      setSelectedTuitionPaymentIds([]);
    }
  }, [activeTab, selectedTuitionPaymentIds.length]);

  const tuitionMonthsOverview = React.useMemo(() => {
    if (!studentFormData.student_id || studentFormData.type !== 'tuition' || !studentFormData.period_year) return [];
    return ALL_MONTHS.map((m) => {
      const info = getMonthlyTuitionInfo(studentFormData.student_id, m.value, studentFormData.period_year);
      const monthTotal = Number(info?.monthTotal || 0);
      const paid = Number(info?.paidForThisMonth || 0);
      const isFullyPaid = Boolean(info?.isFullyPaid);
      const isPartiallyPaid = Boolean(info?.isPartiallyPaid);

      let status = 'unpaid';
      if (isFullyPaid) status = 'paid';
      else if (isPartiallyPaid) status = 'partial';
      else if (monthTotal > 0 && paid === 0) status = 'unpaid';

      return {
        month: m,
        info,
        status,
        monthTotal,
        paid,
      };
    });
  }, [studentFormData.student_id, studentFormData.type, studentFormData.period_year, getMonthlyTuitionInfo]);

  // Mettre à jour les infos enseignant sélectionné
  React.useEffect(() => {
    if (teacherFormData.teacher_id) {
      const info = getTeacherSalaryInfo(teacherFormData.teacher_id);
      setSelectedTeacherInfo(info);
      // Pré-remplir le montant avec le solde restant si création
      if (!editingPayment && info.remaining > 0 && !teacherFormData.amount) {
        setTeacherFormData(prev => ({ ...prev, amount: String(info.remaining) }));
      }
    } else {
      setSelectedTeacherInfo(null);
    }
  }, [teacherFormData.teacher_id, getTeacherSalaryInfo, editingPayment, teacherFormData.period_month, teacherFormData.period_year]);

  const filteredStudentsForDialog = React.useMemo(() => {
    const q = String(studentDialogFilters.search || '').trim().toLowerCase();
    return students.filter((s) => {
      const first = String(s.first_name || '').toLowerCase();
      const last = String(s.last_name || '').toLowerCase();
      const mat = String(s.matricule || '').toLowerCase();
      const matchSearch = !q
        ? true
        : first.includes(q) || last.includes(q) || mat.includes(q) || `${last} ${first}`.includes(q);

      const matchClass =
        studentDialogFilters.class_id === 'all'
          ? true
          : String(s.class_id || '') === String(studentDialogFilters.class_id);

      const cls = s.class_id != null ? classById.get(String(s.class_id)) : null;
      const matchYear =
        studentDialogFilters.academic_year === 'all'
          ? true
          : String(cls?.academic_year || '').trim() === String(studentDialogFilters.academic_year || '').trim();

      return matchSearch && matchClass && matchYear;
    });
  }, [students, studentDialogFilters, classById]);

  const filteredTeachersForDialog = React.useMemo(() => {
    const q = String(teacherDialogSearch || '').trim().toLowerCase();
    return teachers.filter((t) => {
      if (!q) return true;
      const first = String(t.first_name || '').toLowerCase();
      const last = String(t.last_name || '').toLowerCase();
      const spec = String(t.specialty || '').toLowerCase();
      return first.includes(q) || last.includes(q) || `${last} ${first}`.includes(q) || spec.includes(q);
    });
  }, [teachers, teacherDialogSearch]);

  const paymentMethodOptions = React.useMemo(() => {
    const values = new Set();
    for (const p of studentPayments) {
      const m = String(p.payment_method || '').trim();
      if (m) values.add(m);
    }
    for (const p of teacherPayments) {
      const m = String(p.payment_method || '').trim();
      if (m) values.add(m);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [studentPayments, teacherPayments]);

  const academicYearOptions = React.useMemo(() => {
    const values = new Set();
    for (const p of studentPayments) {
      const y = String(p.academic_year || '').trim();
      if (y) values.add(y);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [studentPayments]);

  const periodYearOptions = React.useMemo(() => {
    const values = new Set();
    for (const p of teacherPayments) {
      const y = p.period_year;
      if (y !== null && y !== undefined && String(y).trim()) values.add(String(y));
    }
    return Array.from(values).sort((a, b) => Number(a) - Number(b));
  }, [teacherPayments]);

  const filteredStudentPayments = studentPayments.filter((p) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch = !q
      ? true
      : (`${p.first_name || ''} ${p.last_name || ''}`).toLowerCase().includes(q);

    const matchType = p.type === (activeTab === 'tuition' ? 'tuition' : 'uniform');
    const matchClass = filters.class_id === 'all' ? true : String(p.class_id || '') === String(filters.class_id);
    const matchMethod =
      filters.payment_method === 'all' ? true : String(p.payment_method || '').trim() === String(filters.payment_method || '').trim();
    const matchYear =
      filters.academic_year === 'all' ? true : String(p.academic_year || '').trim() === String(filters.academic_year || '').trim();

    return matchSearch && matchType && matchClass && matchMethod && matchYear;
  });

  const filteredTeacherPayments = teacherPayments.filter((p) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch = !q
      ? true
      : (`${p.first_name || ''} ${p.last_name || ''}`).toLowerCase().includes(q);

    const matchTeacher = filters.teacher_id === 'all' ? true : String(p.teacher_id || '') === String(filters.teacher_id);
    const matchMethod =
      filters.payment_method === 'all' ? true : String(p.payment_method || '').trim() === String(filters.payment_method || '').trim();
    const matchYear = filters.period_year === 'all' ? true : String(p.period_year || '') === String(filters.period_year);
    const matchMonth = filters.period_month === 'all' ? true : String(p.period_month || '') === String(filters.period_month);

    return matchSearch && matchTeacher && matchMethod && matchYear && matchMonth;
  });

  const handleOpenStudentDialog = (type) => {
    setEditingPayment(null);
    setActiveTab(type);
    setSelectedStudentInfo(null);
    setSelectedMonthInfo(null);
    setStudentDialogFilters({
      search: '',
      class_id: 'all',
      academic_year: 'all',
    });
    
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();
    // Définir l'année scolaire par défaut (ex: 2024-2025)
    const defaultAcademicYear = currentMonth >= 9 ? `${currentYear}-${currentYear + 1}` : `${currentYear - 1}-${currentYear}`;
    
    setStudentFormData({
      ...studentFormData,
      type: type,
      student_id: '',
      amount: '',
      month_total: '',
      payment_date: new Date().toISOString().split('T')[0],
      description: '',
      academic_year: defaultAcademicYear,
      period_month: currentMonth,
      period_year: currentYear,
    });
    setIsStudentDialogOpen(true);
  };

  const handleOpenTeacherDialog = () => {
    setEditingPayment(null);
    setTeacherDialogSearch('');
    setTeacherFormData({
      teacher_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Espèces',
      period_month: new Date().getMonth() + 1,
      period_year: new Date().getFullYear(),
      description: '',
    });
    setIsTeacherDialogOpen(true);
  };

  const handleEditPayment = (payment) => {
    if (activeTab === 'teachers') {
      setEditingPayment({ _kind: 'teacher', id: payment.id });
      setTeacherFormData({
        teacher_id: String(payment.teacher_id || ''),
        amount: String(payment.amount || ''),
        payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        payment_method: payment.payment_method || 'Espèces',
        period_month: payment.period_month || new Date().getMonth() + 1,
        period_year: payment.period_year || new Date().getFullYear(),
        description: payment.description || '',
      });
      setIsTeacherDialogOpen(true);
      return;
    }

    setEditingPayment({ _kind: 'student', id: payment.id });
    setStudentFormData({
      student_id: String(payment.student_id || ''),
      type: payment.type || (activeTab === 'uniform' ? 'uniform' : 'tuition'),
      amount: String(payment.amount || ''),
      month_total: String(payment.month_total || ''),
      payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'Espèces',
      description: payment.description || '',
      academic_year: payment.academic_year || '2025-2026',
      period_month: payment.period_month || new Date().getMonth() + 1,
      period_year: payment.period_year || new Date().getFullYear(),
    });
    setIsStudentDialogOpen(true);
  };

  const handleDeletePayment = (payment) => {
    if (!payment || !payment.id) return;
    setDeleteDialog({ open: true, payment });
  };

  const handleConfirmDelete = async () => {
    const payment = deleteDialog.payment;
    if (!payment || !payment.id) return;

    try {
      let result;
      if (activeTab === 'teachers') {
        result = await deleteTeacherPayment(payment.id);
      } else {
        result = await deleteStudentPayment(payment.id);
      }

      if (result && result.success) {
        toast.success('Paiement supprimé');
      } else {
        toast.error((result && result.error) || 'Erreur suppression');
      }
    } catch (error) {
      toast.error(error.message || 'Erreur suppression');
    }
    setDeleteDialog({ open: false, payment: null });
  };

  const handleViewPayment = (payment) => {
    setViewingPayment({ ...payment, _kind: activeTab === 'teachers' ? 'teacher' : 'student' });
    setIsViewDialogOpen(true);
  };

  const handlePrintTuitionSelectionReceipt = () => {
    try {
      const selected = (studentPayments || []).filter(
        (p) => p && p.type === 'tuition' && selectedTuitionPaymentIds.includes(p.id)
      );

      if (selected.length === 0) {
        toast.error('Aucun paiement sélectionné');
        return;
      }

      const uniqueStudentIds = Array.from(new Set(selected.map((p) => String(p.student_id || '')).filter(Boolean)));
      if (uniqueStudentIds.length !== 1) {
        toast.error('Sélection invalide: veuillez sélectionner les paiements d\'un seul élève');
        return;
      }

      const studentId = uniqueStudentIds[0];
      const any = selected[0];
      const studentName = `${any.first_name || ''} ${any.last_name || ''}`.trim();
      const className = String(any.class_name || '');
      const academicYear = String(any.academic_year || '');

      const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

      const monthKeys = Array.from(
        new Set(
          selected
            .filter((p) => p.period_month && p.period_year)
            .map((p) => `${p.period_year}-${String(p.period_month).padStart(2, '0')}`)
        )
      ).sort();

      const monthBlocks = monthKeys.map((key) => {
        const [yStr, mStr] = key.split('-');
        const y = Number(yStr);
        const m = Number(mStr);
        const info = getMonthlyTuitionInfo(studentId, m, y);

        const monthTotal = Number(info?.monthTotal || 0);
        const paid = Number(info?.paidForThisMonth || 0);
        const remaining = Number(info?.remainingForMonth || 0);

        const paymentsThisMonth = (studentPayments || [])
          .filter(
            (p) =>
              String(p.student_id || '') === String(studentId) &&
              p.type === 'tuition' &&
              Number(p.period_month) === m &&
              Number(p.period_year) === y &&
              selectedTuitionPaymentIds.includes(p.id)
          )
          .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));

        const rows = paymentsThisMonth
          .map(
            (p) => `
              <tr>
                <td style="padding:6px;border:1px solid #ccc;">${new Date(p.payment_date).toLocaleDateString('fr-FR')}</td>
                <td style="padding:6px;border:1px solid #ccc;text-align:right;">${Number(p.amount || 0).toLocaleString()} FCFA</td>
                <td style="padding:6px;border:1px solid #ccc;">${String(p.payment_method || 'Espèces')}</td>
              </tr>
            `
          )
          .join('');

        return `
          <div style="margin-top:18px;">
            <h3 style="margin:0 0 8px 0; font-size: 16px;">${months[m - 1]} ${y}</h3>
            <div style="display:flex; gap:14px; font-size: 13px; margin-bottom: 10px;">
              <div><strong>Total du mois:</strong> ${monthTotal.toLocaleString()} FCFA</div>
              <div><strong>Payé:</strong> ${paid.toLocaleString()} FCFA</div>
              <div><strong>Reste:</strong> ${remaining.toLocaleString()} FCFA</div>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size: 13px;">
              <thead>
                <tr>
                  <th style="padding:6px;border:1px solid #ccc; text-align:left;">Date</th>
                  <th style="padding:6px;border:1px solid #ccc; text-align:right;">Montant</th>
                  <th style="padding:6px;border:1px solid #ccc; text-align:left;">Méthode</th>
                </tr>
              </thead>
              <tbody>
                ${rows || `<tr><td colspan="3" style="padding:8px;border:1px solid #ccc; text-align:center; color:#666;">Aucun paiement</td></tr>`}
              </tbody>
            </table>
          </div>
        `;
      });

      const totalSelected = selected.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      toast.warning("Préparation de l'impression...");
      const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Reçu Scolarité (Sélection)</title>
            <style>
              @media print {
                body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none !important; }
              }
              body { font-family: 'Times New Roman', Georgia, serif; margin: 20px; background: #f5f5f5; }
              .receipt { border: 4px double #000; padding: 28px; max-width: 780px; margin: 0 auto; background: white; }
              .header { text-align: center; margin-bottom: 18px; }
              .header h1 { font-size: 22px; font-weight: bold; text-transform: uppercase; text-decoration: underline; margin: 0; }
              .info { display:flex; justify-content: space-between; gap: 10px; font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 14px; }
              .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 18px; background: #0066CC; color: #fff; border: none; border-radius: 5px; cursor:pointer; font-weight:bold; }
              .close-btn { position: fixed; top: 20px; right: 130px; padding: 10px 18px; background: #666; color: #fff; border: none; border-radius: 5px; cursor:pointer; font-weight:bold; }
              .summary { font-size: 14px; margin: 10px 0 0 0; }
            </style>
          </head>
          <body>
            <button class="print-btn no-print" onclick="doPrint()">Imprimer</button>
            <button class="close-btn no-print" onclick="window.close()">Fermer</button>
            <div class="receipt">
              <div class="header">
                <h1>Reçu de Paiement - Scolarité</h1>
                <div style="margin-top:6px; font-size: 14px;">Ecole Privée LA SAGESSE - Kalabancoro</div>
              </div>
              <div class="info">
                <div>
                  <div><strong>Élève:</strong> ${studentName}</div>
                  ${className ? `<div><strong>Classe:</strong> ${className}</div>` : ''}
                </div>
                <div style="text-align:right;">
                  <div><strong>Année scolaire:</strong> ${academicYear || '-'}</div>
                  <div><strong>Imprimé le:</strong> ${new Date().toLocaleString('fr-FR')}</div>
                </div>
              </div>
              <div class="summary"><strong>Total sélectionné:</strong> ${Number(totalSelected || 0).toLocaleString()} FCFA</div>
              ${monthBlocks.join('')}
            </div>
            <script>
              function doPrint() {
                const btns = document.querySelectorAll('.no-print');
                btns.forEach(b => b.style.display = 'none');
                window.print();
                setTimeout(() => { btns.forEach(b => b.style.display = ''); }, 500);
              }
              window.onload = function() { setTimeout(() => { try { doPrint(); } catch(e) {} }, 250); }
            </script>
          </body>
        </html>
      `;

      // Fallback iframe si popup bloquée
      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.setAttribute('aria-hidden', 'true');
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow?.document;
        if (!doc) throw new Error('Impossible de préparer l\'impression');
        doc.open();
        doc.write(receiptHTML);
        doc.close();
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } finally {
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }
        }, 200);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          // noop
        }
      }, 600);
    } catch (err) {
      toast.error(err?.message || 'Erreur impression');
    }
  };

  const handlePrintReceipt = (payment) => {
    try {
      toast.warning('Préparation de l\'impression...');

      // Ouvrir d'abord la fenêtre (doit être déclenché directement par l'action utilisateur)
      const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');

      // Fallback si la popup est bloquée: imprimer via iframe invisible
      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        try {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          iframe.setAttribute('aria-hidden', 'true');
          document.body.appendChild(iframe);

          const p = { ...payment, _kind: activeTab === 'teachers' ? 'teacher' : 'student' };
          const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

          const doc = iframe.contentWindow?.document;
          if (!doc) throw new Error('Impossible de préparer l\'impression');

          doc.open();
          doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reçu</title></head><body></body></html>`);
          doc.close();

          iframe.contentWindow.document.body.innerHTML = `
            <div style="font-family: 'Times New Roman', Georgia, serif; padding: 20px;">
              <h2 style="text-align:center; text-decoration: underline;">Reçu de Paiement</h2>
              <p><strong>N° Reçu:</strong> ${String(p.id).padStart(6, '0')}</p>
              <p><strong>Date:</strong> ${new Date(p.payment_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Reçu de:</strong> ${p.first_name} ${p.last_name}</p>
              <p><strong>Montant:</strong> ${Number(p.amount).toLocaleString()} FCFA</p>
              <p><strong>Motif:</strong> ${p._kind === 'teacher'
                ? `Salaire - ${months[(p.period_month || 1) - 1]} ${p.period_year}`
                : (p.type === 'uniform' ? 'Achat de tenue scolaire' : 'Frais de scolarité')}
              </p>
            </div>
          `;

          setTimeout(() => {
            try {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            } finally {
              setTimeout(() => document.body.removeChild(iframe), 1000);
            }
          }, 200);
          return;
        } catch (e) {
          toast.error('Impression impossible. Vérifiez que les popups ne sont pas bloqués.');
          return;
        }
      }
    
      const p = { ...payment, _kind: activeTab === 'teachers' ? 'teacher' : 'student' };
      const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
      
      const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reçu de Paiement #${String(p.id).padStart(6, '0')}</title>
          <style>
            @media print {
              body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
              .receipt { border: 4px double #000 !important; }
            }
            body { 
              font-family: 'Times New Roman', Georgia, serif; 
              margin: 20px; 
              background: #f5f5f5;
            }
            .receipt { 
              border: 4px double #000; 
              padding: 40px; 
              max-width: 700px; 
              margin: 0 auto; 
              background: white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { font-size: 28px; font-weight: bold; text-transform: uppercase; text-decoration: underline; margin: 0; color: #000; }
            .header p { margin: 8px 0; font-size: 14px; }
            .info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 15px; }
            .details { margin: 25px 0; font-size: 16px; line-height: 2.2; }
            .details p { margin: 12px 0; }
            .amount { 
              font-weight: bold; 
              border: 2px solid #000; 
              background: #f0f0f0; 
              padding: 8px 15px; 
              display: inline-block;
              font-size: 18px;
            }
            .signature { display: flex; justify-content: space-between; margin-top: 70px; }
            .signature div { text-align: center; width: 45%; }
            .signature .line { border-bottom: 1px solid #000; width: 100%; margin: 50px auto 15px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
            .print-btn {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 24px;
              background: #0066CC;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .print-btn:hover { background: #0052a3; }
            .close-btn {
              position: fixed;
              top: 20px;
              right: 130px;
              padding: 12px 24px;
              background: #666;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
            }
            .close-btn:hover { background: #555; }
          </style>
        </head>
        <body>
          <button class="print-btn no-print" onclick="doPrint()">🖨️ Imprimer</button>
          <button class="close-btn no-print" onclick="window.close()">❌ Fermer</button>
          
          <div class="receipt">
            <div class="header">
              <h1>Reçu de Paiement</h1>
              <p style="font-size: 16px; margin-top: 10px;">Ecole Privée LA SAGESSE - Kalabancoro</p>
              <p style="font-style: italic; color: #555;">"L'éducation est la clé du futur"</p>
            </div>
            
            <div class="info">
              <div>
                <p><strong>N° Reçu:</strong> ${String(p.id).padStart(6, '0')}</p>
                <p><strong>Date:</strong> ${new Date(p.payment_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>Année Scolaire:</strong> ${p.academic_year || p.period_year || '-'}</p>
              </div>
            </div>
            
            <div class="details">
              <p>Reçu de : <strong style="font-size: 18px;">${p.first_name} ${p.last_name}</strong></p>
              <p>La somme de (en chiffres) : <span class="amount">${Number(p.amount).toLocaleString()} FCFA</span></p>
              <p>Motif du paiement : <strong><em style="font-size: 17px;">
                ${p._kind === 'teacher' 
                  ? `Salaire - ${months[(p.period_month || 1) - 1]} ${p.period_year}`
                  : (p.type === 'uniform' ? 'Achat de tenue scolaire' : 'Frais de scolarité')}
              </em></strong></p>
              <p>Méthode de paiement : <strong>${p.payment_method || 'Espèces'}</strong></p>
              ${p.description ? `<p style="font-size: 15px; font-style: italic; margin-top: 15px;">Observation : ${p.description}</p>` : ''}
            </div>
            
            <div class="signature">
              <div>
                <p class="line"></p>
                <p><strong>Le Parent / Bénéficiaire</strong></p>
              </div>
              <div>
                <p class="line"></p>
                <p><strong>Le Comptable / Direction</strong></p>
                <p style="font-size: 12px; font-style: italic; margin-top: 5px;">(Cachet et Signature)</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Imprimé le ${new Date().toLocaleString('fr-FR')} via SchoolManage</p>
              <p style="font-size: 10px; margin-top: 5px;">Ce reçu est un document officiel - Conservez-le précieusement</p>
            </div>
          </div>
          
          <script>
            function doPrint() {
              const btns = document.querySelectorAll('.no-print');
              btns.forEach(b => b.style.display = 'none');
              window.print();
              setTimeout(() => {
                btns.forEach(b => b.style.display = '');
              }, 500);
            }
            
            // Auto-print après chargement
            window.onload = function() {
              setTimeout(() => {
                try {
                  doPrint();
                } catch (e) {
                  // noop
                }
              }, 250);
            }
          </script>
        </body>
      </html>
    `;
    
      printWindow.document.open();
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      
      // Focus sur la nouvelle fenêtre
      printWindow.focus();

      // Sécurité: relancer print côté parent (certaines configurations Electron n'exécutent pas onload)
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          // noop
        }
      }, 600);
    } catch (err) {
      toast.error(err?.message || 'Erreur impression');
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    
    // Validation : vérifier que le montant ne dépasse pas le solde restant
    const amount = Number(studentFormData.amount || 0);
    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    
    // Validation selon le type de paiement
    if (studentFormData.type === 'tuition') {
      const monthTotal = Number(studentFormData.month_total || 0);
      if (monthTotal <= 0) {
        toast.error('Veuillez renseigner le montant total du mois');
        return;
      }

      // Pour la scolarité : vérifier la limite mensuelle
      const monthInfo = getMonthlyTuitionInfo(
        studentFormData.student_id,
        studentFormData.period_month,
        studentFormData.period_year,
        monthTotal
      );
      
      if (!monthInfo) {
        toast.error('Impossible de calculer les informations mensuelles');
        return;
      }
      
      // Vérifier si le mois est déjà totalement payé
      if (monthInfo.isFullyPaid) {
        toast.error(`${monthInfo.monthLabel} ${studentFormData.period_year} est déjà totalement payé. Impossible d'ajouter un nouveau paiement.`);
        return;
      }

      // Si un month_total existe déjà en DB, on ne permet pas de le changer (cohérence)
      if (monthInfo.hasStoredMonthTotal && Number(monthInfo.monthTotal || 0) !== monthTotal) {
        toast.error(`Le montant total pour ${monthInfo.monthLabel} est déjà défini à ${Number(monthInfo.monthTotal || 0).toLocaleString()} FCFA`);
        return;
      }
      
      // Pour une modification, ajouter le montant actuel au solde disponible
      const editingAmount = (editingPayment && editingPayment._kind === 'student') 
        ? (studentPayments.find(p => p.id === editingPayment.id)?.amount || 0)
        : 0;
      const maxAllowed = monthInfo.remainingForMonth + editingAmount;
      
      if (amount > maxAllowed) {
        toast.error(`Montant trop élevé pour ${monthInfo.monthLabel}. Reste à payer : ${monthInfo.remainingForMonth.toLocaleString()} FCFA`);
        return;
      }
    } else {
      // Pour les tenues : vérifier la limite globale (comportement existant)
      const balance = getStudentBalance(studentFormData.student_id, studentFormData.type);
      
      // Pour une modification, ajouter le montant actuel au solde disponible
      const editingAmount = (editingPayment && editingPayment._kind === 'student') 
        ? (studentPayments.find(p => p.id === editingPayment.id)?.amount || 0)
        : 0;
      const maxAllowed = balance.remaining + editingAmount;
      
      if (amount > maxAllowed) {
        toast.error(`Montant trop élevé. Solde restant : ${maxAllowed.toLocaleString()} FCFA`);
        return;
      }
    }
    
    try {
      // Normaliser month_total
      const payload = studentFormData.type === 'tuition'
        ? { ...studentFormData, month_total: Number(studentFormData.month_total || 0) }
        : studentFormData;
      const result = editingPayment && editingPayment._kind === 'student'
        ? await updateStudentPayment(editingPayment.id, payload)
        : await createStudentPayment(payload);
      if (result.success) {
        toast.success(editingPayment && editingPayment._kind === 'student' ? 'Paiement modifié avec succès !' : 'Paiement enregistré avec succès !');
        setIsStudentDialogOpen(false);
        setEditingPayment(null);
        setSelectedStudentInfo(null);
        setSelectedMonthInfo(null);
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    
    // Validation : vérifier que le montant ne dépasse pas le salaire restant
    const amount = Number(teacherFormData.amount || 0);
    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }
    
    // Calculer le salaire restant pour ce mois
    const salaryInfo = getTeacherSalaryInfo(teacherFormData.teacher_id);
    const maxAllowed = salaryInfo.remaining;
    
    if (amount > maxAllowed) {
      toast.error(`Montant trop élevé. Salaire restant pour ce mois : ${maxAllowed.toLocaleString()} FCFA`);
      return;
    }
    
    try {
      const result = editingPayment && editingPayment._kind === 'teacher'
        ? await updateTeacherPayment(editingPayment.id, teacherFormData)
        : await createTeacherPayment(teacherFormData);
      if (result.success) {
        toast.success(editingPayment && editingPayment._kind === 'teacher' ? 'Paiement modifié avec succès !' : 'Paiement enseignant enregistré avec succès !');
        setIsTeacherDialogOpen(false);
        setEditingPayment(null);
        setSelectedTeacherInfo(null);
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Paiements</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenStudentDialog('tuition')} className="bg-primary text-white">
            <GraduationCap className="mr-2 h-4 w-4" /> Nouveau Paiement Scolarité
          </Button>
          <Button onClick={() => handleOpenStudentDialog('uniform')} variant="outline">
            <Shirt className="mr-2 h-4 w-4" /> Nouveau Paiement Tenue
          </Button>
          <Button onClick={handleOpenTeacherDialog} variant="secondary">
            <Users className="mr-2 h-4 w-4" /> Paiement Enseignant
          </Button>
        </div>
      </div>

      {/* Cartes de Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#0066CC]/10 to-[#003399]/10 border-black/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stats.label}</p>
                <h3 className="text-2xl font-bold mt-1 text-[#0066CC]">
                  {stats.totalAmount.toLocaleString()} FCFA
                </h3>
              </div>
              <div className="h-12 w-12 bg-[#0066CC]/15 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#FF6600]/10 to-[#FF3300]/10 border-black/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stats.subLabel}</p>
                <h3 className="text-2xl font-bold mt-1 text-[#FF3300]">
                  {stats.countPaid}
                </h3>
              </div>
              <div className="h-12 w-12 bg-[#FF6600]/15 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-[#FF3300]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#CC0033]/10 to-[#CC0033]/5 border-black/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stats.unpaidLabel}</p>
                <h3 className="text-2xl font-bold mt-1 text-[#CC0033]">
                  {stats.countUnpaid}
                </h3>
              </div>
              <div className="h-12 w-12 bg-[#CC0033]/15 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-[#CC0033]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="tuition" 
            onClick={() => setActiveTab('tuition')}
            data-state={activeTab === 'tuition' ? 'active' : 'inactive'}
          >
            Frais de Scolarité
          </TabsTrigger>
          <TabsTrigger 
            value="uniform" 
            onClick={() => setActiveTab('uniform')}
            data-state={activeTab === 'uniform' ? 'active' : 'inactive'}
          >
            Tenues Scolaires
          </TabsTrigger>
          <TabsTrigger 
            value="teachers" 
            onClick={() => setActiveTab('teachers')}
            data-state={activeTab === 'teachers' ? 'active' : 'inactive'}
          >
            Salaires Enseignants
          </TabsTrigger>
        </TabsList>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {activeTab === 'tuition' ? 'Historique Scolarité' : 
                 activeTab === 'uniform' ? 'Historique Tenues' : 'Historique Enseignants'}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              {activeTab !== 'teachers' ? (
                <>
                  <select
                    value={filters.class_id}
                    onChange={(e) => setFilters((prev) => ({ ...prev, class_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les classes</option>
                    <option value="">Non assigné</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.payment_method}
                    onChange={(e) => setFilters((prev) => ({ ...prev, payment_method: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les méthodes</option>
                    {paymentMethodOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.academic_year}
                    onChange={(e) => setFilters((prev) => ({ ...prev, academic_year: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les années</option>
                    {academicYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <select
                    value={filters.teacher_id}
                    onChange={(e) => setFilters((prev) => ({ ...prev, teacher_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Tous les enseignants</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.payment_method}
                    onChange={(e) => setFilters((prev) => ({ ...prev, payment_method: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les méthodes</option>
                    {paymentMethodOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.period_year}
                    onChange={(e) => setFilters((prev) => ({ ...prev, period_year: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les années</option>
                    {periodYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.period_month}
                    onChange={(e) => setFilters((prev) => ({ ...prev, period_month: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Tous les mois</option>
                    {months.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    class_id: 'all',
                    payment_method: 'all',
                    academic_year: 'all',
                    teacher_id: 'all',
                    period_year: 'all',
                    period_month: 'all',
                  });
                }}
              >
                Réinitialiser
              </Button>

              {activeTab === 'tuition' && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={selectedTuitionPaymentIds.length === 0}
                  onClick={handlePrintTuitionSelectionReceipt}
                >
                  <Printer className="h-4 w-4 mr-2" /> Imprimer sélection
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === 'tuition' && (
                    <TableHead style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        aria-label="Tout sélectionner"
                        checked={
                          (activeTab === 'tuition'
                            ? filteredStudentPayments.filter((p) => p.type === 'tuition')
                            : []).length > 0 &&
                          filteredStudentPayments
                            .filter((p) => p.type === 'tuition')
                            .every((p) => selectedTuitionPaymentIds.includes(p.id))
                        }
                        onChange={(e) => {
                          const tuitionRows = filteredStudentPayments.filter((p) => p.type === 'tuition');
                          if (e.target.checked) {
                            setSelectedTuitionPaymentIds(tuitionRows.map((p) => p.id));
                          } else {
                            setSelectedTuitionPaymentIds([]);
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Date</TableHead>
                  <TableHead>{activeTab === 'teachers' ? 'Enseignant' : 'Élève'}</TableHead>
                  {activeTab !== 'teachers' && <TableHead>Classe</TableHead>}
                  {activeTab === 'tuition' && <TableHead>Mois</TableHead>}
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  {activeTab === 'teachers' && <TableHead>Période</TableHead>}
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'tuition' ? 9 : 7} className="text-center py-10">Chargement...</TableCell>
                  </TableRow>
                ) : (activeTab === 'teachers' ? filteredTeacherPayments : filteredStudentPayments).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'tuition' ? 9 : 7} className="text-center py-10">Aucun paiement trouvé</TableCell>
                  </TableRow>
                ) : (activeTab === 'teachers' ? filteredTeacherPayments : filteredStudentPayments).map((p) => (
                  <TableRow key={p.id}>
                    {activeTab === 'tuition' && (
                      <TableCell>
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner paiement ${p.id}`}
                          checked={selectedTuitionPaymentIds.includes(p.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSelectedTuitionPaymentIds((prev) => {
                              if (checked) return prev.includes(p.id) ? prev : [...prev, p.id];
                              return prev.filter((id) => id !== p.id);
                            });
                          }}
                        />
                      </TableCell>
                    )}
                    <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                    {activeTab !== 'teachers' && <TableCell>{p.class_name || 'N/A'}</TableCell>}
                    {activeTab === 'tuition' && (
                      <TableCell>
                        {p.period_month && p.period_year ? (
                          <span className="text-sm">
                            {ALL_MONTHS.find(m => m.value === p.period_month)?.label || months[p.period_month - 1]} {p.period_year}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="font-bold text-[#FF3300]">{p.amount.toLocaleString()} FCFA</TableCell>
                    <TableCell>{p.payment_method}</TableCell>
                    {activeTab === 'teachers' && (
                      <TableCell>{months[p.period_month - 1]} {p.period_year}</TableCell>
                    )}
                    <TableCell>{p.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewPayment(p)}
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePrintReceipt(p);
                          }}
                          title="Imprimer reçu"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPayment(p)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePayment(p)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>

      {/* Dialog de visualisation */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du paiement</DialogTitle>
            <DialogDescription>
              Visualisation du paiement sélectionné.
            </DialogDescription>
          </DialogHeader>

          {viewingPayment && (
            <div className="py-2 space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-[#FF6600]/10 via-white to-[#FF3300]/10 dark:from-[#FF6600]/20 dark:via-black dark:to-[#FF3300]/20 p-5">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#FF6600]/15 flex items-center justify-center border border-white/20 text-[#FF3300]">
                    <DollarSign className="h-8 w-8" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold tracking-tight text-black dark:text-white truncate">
                      {viewingPayment.first_name} {viewingPayment.last_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-black dark:text-white border border-black/10 dark:border-white/10">
                        {new Date(viewingPayment.payment_date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-black dark:text-white border border-black/10 dark:border-white/10">
                        {Number(viewingPayment.amount).toLocaleString()} FCFA
                      </span>
                      {viewingPayment._kind === 'student' && (
                        <span className="inline-flex items-center rounded-full bg-[#0066CC]/10 text-[#003399] border border-[#0066CC]/20 px-3 py-1 text-xs font-semibold dark:text-white">
                          {viewingPayment.type === 'uniform' ? 'Tenue' : 'Scolarité'}
                        </span>
                      )}
                      {viewingPayment._kind === 'teacher' && (
                        <span className="inline-flex items-center rounded-full bg-[#0066CC]/10 text-[#003399] border border-[#0066CC]/20 px-3 py-1 text-xs font-semibold dark:text-white">
                          Salaire
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-black dark:text-white">Informations</p>
                  <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#FF6600] to-[#FF3300]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {viewingPayment._kind === 'student' && (
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Classe</p>
                      <p className="text-sm font-semibold">{viewingPayment.class_name || 'N/A'}</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                    <p className="text-[11px] text-muted-foreground">Méthode</p>
                    <p className="text-sm font-semibold">{viewingPayment.payment_method || '-'}</p>
                  </div>

                  {viewingPayment._kind === 'teacher' && (
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Période</p>
                      <p className="text-sm font-semibold">{months[(viewingPayment.period_month || 1) - 1]} {viewingPayment.period_year || ''}</p>
                    </div>
                  )}

                  <div className="sm:col-span-2 rounded-xl border border-black/10 dark:border-white/10 p-3">
                    <p className="text-[11px] text-muted-foreground">Description</p>
                    <p className="text-sm font-semibold">{viewingPayment.description || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Paiement Élève */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleStudentSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPayment && editingPayment._kind === 'student'
                  ? 'Modifier le paiement'
                  : (studentFormData.type === 'tuition' ? 'Nouveau Paiement Scolarité' : 'Nouveau Paiement Tenue')}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous pour enregistrer le paiement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un élève (nom / matricule)..."
                    className="pl-8"
                    value={studentDialogFilters.search}
                    onChange={(e) => setStudentDialogFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={studentDialogFilters.class_id}
                    onChange={(e) => setStudentDialogFilters((prev) => ({ ...prev, class_id: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les classes</option>
                    <option value="">Non assigné</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={studentDialogFilters.academic_year}
                    onChange={(e) => setStudentDialogFilters((prev) => ({ ...prev, academic_year: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">Toutes les années</option>
                    {classAcademicYearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Élève</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={studentFormData.student_id}
                  onChange={(e) => setStudentFormData({ ...studentFormData, student_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un élève</option>
                  {filteredStudentsForDialog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} - {s.class_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Affichage des informations de solde global (uniquement pour tenues) */}
              {studentFormData.type === 'uniform' && selectedStudentInfo && selectedStudentInfo.totalFee > 0 && (
                <div className={`p-3 rounded-lg border ${selectedStudentInfo.remaining === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className={`h-4 w-4 ${selectedStudentInfo.remaining === 0 ? 'text-green-600' : 'text-amber-600'}`} />
                    <span className={`text-sm font-semibold ${selectedStudentInfo.remaining === 0 ? 'text-green-800' : 'text-amber-800'}`}>
                      Informations Tenues
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Frais total:</span>
                      <p className="font-semibold">{selectedStudentInfo.totalFee.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Déjà payé:</span>
                      <p className="font-semibold text-green-600">{selectedStudentInfo.paidAmount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reste:</span>
                      <p className={`font-semibold ${selectedStudentInfo.remaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedStudentInfo.remaining.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sélection du mois pour la scolarité (AVANT le montant) */}
              {studentFormData.type === 'tuition' && (
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Année *</label>
                    <Input
                      type="number"
                      value={studentFormData.period_year}
                      onChange={(e) => setStudentFormData({ ...studentFormData, period_year: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Mois de paiement *</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {ALL_MONTHS.map((m) => {
                        const row = tuitionMonthsOverview.find((x) => x.month.value === m.value);
                        const isSelected = Number(studentFormData.period_month) === Number(m.value);
                        const isBlocked = Boolean(row?.info?.isFullyPaid);

                        const colorClass = row?.status === 'paid'
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : row?.status === 'partial'
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-red-50 border-red-200 text-red-800';

                        return (
                          <button
                            key={m.value}
                            type="button"
                            disabled={isBlocked}
                            onClick={() => {
                              setStudentFormData((prev) => {
                                const info = getMonthlyTuitionInfo(prev.student_id, m.value, prev.period_year);
                                const nextMonthTotal = info?.hasStoredMonthTotal ? String(info.monthTotal || '') : '';
                                return {
                                  ...prev,
                                  period_month: m.value,
                                  month_total: nextMonthTotal,
                                  amount: '',
                                };
                              });
                            }}
                            className={`w-full rounded-md border px-2 py-2 text-xs font-semibold transition-all ${colorClass} ${
                              isSelected ? 'ring-2 ring-offset-2 ring-ring' : ''
                            } ${isBlocked ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-95'}`}
                            title={
                              row?.status === 'paid'
                                ? `Payé (${Number(row?.paid || 0).toLocaleString()} / ${Number(row?.monthTotal || 0).toLocaleString()} FCFA)`
                                : row?.status === 'partial'
                                  ? `Partiel (${Number(row?.paid || 0).toLocaleString()} / ${Number(row?.monthTotal || 0).toLocaleString()} FCFA)`
                                  : 'Non payé'
                            }
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>{m.label}</span>
                              {row?.status === 'paid' ? (
                                <span className="text-[10px]">PAYÉ</span>
                              ) : row?.status === 'partial' ? (
                                <span className="text-[10px]">PARTIEL</span>
                              ) : (
                                <span className="text-[10px]">NON</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Les mois totalement payés sont bloqués.
                    </p>
                  </div>
                </div>
              )}

              {/* Montant total du mois (saisie manuelle, requis pour la scolarité) */}
              {studentFormData.type === 'tuition' && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Montant total du mois (FCFA) *</label>
                  <Input
                    type="number"
                    value={studentFormData.month_total}
                    onChange={(e) => {
                      const next = String(e.target.value ?? '').replace(/,/g, '');
                      setStudentFormData((prev) => ({ ...prev, month_total: next }));
                    }}
                    min={0}
                    disabled={selectedMonthInfo?.hasStoredMonthTotal}
                    required
                  />
                  {selectedMonthInfo?.hasStoredMonthTotal && (
                    <p className="text-xs text-muted-foreground">
                      Montant total déjà défini pour ce mois (verrouillé)
                    </p>
                  )}
                </div>
              )}

              {/* Affichage des informations mensuelles pour la scolarité */}
              {studentFormData.type === 'tuition' && selectedMonthInfo && selectedStudentInfo?.studentClass?.tuition_fee > 0 && (
                <div className={`p-4 rounded-lg border-2 ${
                  selectedMonthInfo.isFullyPaid 
                    ? 'bg-green-100 border-green-400' 
                    : selectedMonthInfo.isPartiallyPaid 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-amber-50 border-amber-300'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-5 w-5 ${
                        selectedMonthInfo.isFullyPaid 
                          ? 'text-green-600' 
                          : selectedMonthInfo.isPartiallyPaid 
                            ? 'text-blue-600' 
                            : 'text-amber-600'
                      }`} />
                      <span className={`text-sm font-bold ${
                        selectedMonthInfo.isFullyPaid 
                          ? 'text-green-800' 
                          : selectedMonthInfo.isPartiallyPaid 
                            ? 'text-blue-800' 
                            : 'text-amber-800'
                      }`}>
                        {selectedMonthInfo.monthLabel} {studentFormData.period_year}
                        {selectedMonthInfo.isFullyPaid && ' ✓ TOTLEMENT PAYÉ'}
                        {selectedMonthInfo.isPartiallyPaid && ' (Paiement partiel)'}
                        {!selectedMonthInfo.isFullyPaid && !selectedMonthInfo.isPartiallyPaid && ' (Non payé)'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ALL_MONTHS.find(m => m.value === studentFormData.period_month)?.label || ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white p-2 rounded border">
                      <span className="text-muted-foreground block text-xs">Total du mois:</span>
                      <p className="font-bold text-base">{Number(selectedMonthInfo.monthTotal || 0).toLocaleString()} FCFA</p>
                      <span className="text-xs text-muted-foreground">
                        (saisi manuellement)
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-muted-foreground block text-xs">Payé ce mois:</span>
                      <p className={`font-bold text-base ${selectedMonthInfo.paidForThisMonth > 0 ? 'text-green-600' : ''}`}>
                        {selectedMonthInfo.paidForThisMonth.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <span className="text-muted-foreground block text-xs">Reste à payer:</span>
                      <p className={`font-bold text-base ${selectedMonthInfo.remainingForMonth === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedMonthInfo.remainingForMonth.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                  
                  
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Montant à payer (FCFA) {studentFormData.type === 'tuition' && selectedMonthInfo && '*'}
                  </label>
                  <Input
                    type="number"
                    value={studentFormData.amount}
                    onChange={(e) => {
                      const next = String(e.target.value ?? '').replace(/,/g, '');
                      setStudentFormData((prev) => ({ ...prev, amount: next }));
                    }}
                    max={studentFormData.type === 'tuition' ? selectedMonthInfo?.remainingForMonth : selectedStudentInfo?.remaining}
                    disabled={studentFormData.type === 'tuition' && selectedMonthInfo?.isFullyPaid}
                    required
                  />
                  {studentFormData.type === 'tuition' && selectedMonthInfo && (
                    <p className="text-xs text-muted-foreground">
                      {selectedMonthInfo.isFullyPaid 
                        ? 'Ce mois est déjà totalement payé'
                        : `Max: ${selectedMonthInfo.remainingForMonth.toLocaleString()} FCFA pour ${selectedMonthInfo.monthLabel}`
                      }
                    </p>
                  )}
                  {studentFormData.type === 'uniform' && selectedStudentInfo && selectedStudentInfo.remaining > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Max: {selectedStudentInfo.remaining.toLocaleString()} FCFA
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date de paiement *</label>
                  <Input
                    type="date"
                    value={studentFormData.payment_date}
                    onChange={(e) => setStudentFormData({ ...studentFormData, payment_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Méthode</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={studentFormData.payment_method}
                    onChange={(e) => setStudentFormData({ ...studentFormData, payment_method: e.target.value })}
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Virement">Virement</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Mobile Money">Mobile Money</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Année Académique</label>
                  <Input
                    value={studentFormData.academic_year}
                    onChange={(e) => setStudentFormData({ ...studentFormData, academic_year: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={studentFormData.description}
                  onChange={(e) => setStudentFormData({ ...studentFormData, description: e.target.value })}
                  placeholder="Ex: Premier versement, Paiement complet..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsStudentDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingPayment && editingPayment._kind === 'student' ? 'Modifier' : 'Enregistrer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Paiement Enseignant */}
      <Dialog open={isTeacherDialogOpen} onOpenChange={setIsTeacherDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleTeacherSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPayment && editingPayment._kind === 'teacher' ? 'Modifier le paiement' : 'Paiement de Salaire Enseignant'}</DialogTitle>
              <DialogDescription>
                Enregistrez le paiement mensuel d'un enseignant.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un enseignant (nom / spécialité)..."
                  className="pl-8"
                  value={teacherDialogSearch}
                  onChange={(e) => setTeacherDialogSearch(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Enseignant</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={teacherFormData.teacher_id}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, teacher_id: e.target.value })}
                  required
                >
                  <option value="">Sélectionner un enseignant</option>
                  {filteredTeachersForDialog.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.first_name} {t.last_name} - {t.specialty} (Salaire: {(t.salary || 0).toLocaleString()} FCFA)
                    </option>
                  ))}
                </select>
              </div>

              {/* Affichage des informations de salaire */}
              {selectedTeacherInfo && selectedTeacherInfo.salary > 0 && (
                <div className={`p-3 rounded-lg border ${selectedTeacherInfo.remaining === 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className={`h-4 w-4 ${selectedTeacherInfo.remaining === 0 ? 'text-green-600' : 'text-blue-600'}`} />
                    <span className={`text-sm font-semibold ${selectedTeacherInfo.remaining === 0 ? 'text-green-800' : 'text-blue-800'}`}>
                      Informations Salaire - {months[(teacherFormData.period_month || 1) - 1]} {teacherFormData.period_year}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Salaire mensuel:</span>
                      <p className="font-semibold">{selectedTeacherInfo.salary.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Déjà payé ce mois:</span>
                      <p className="font-semibold text-amber-600">{selectedTeacherInfo.paidThisMonth.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reste à payer:</span>
                      <p className={`font-semibold ${selectedTeacherInfo.remaining === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedTeacherInfo.remaining.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Montant (FCFA)</label>
                  <Input
                    type="number"
                    value={teacherFormData.amount}
                    onChange={(e) => {
                      const next = String(e.target.value ?? '').replace(/,/g, '');
                      setTeacherFormData((prev) => ({ ...prev, amount: next }));
                    }}
                    required
                  />
                  {selectedTeacherInfo && selectedTeacherInfo.remaining > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Max: {selectedTeacherInfo.remaining.toLocaleString()} FCFA
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date de Paiement</label>
                  <Input
                    type="date"
                    value={teacherFormData.payment_date}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, payment_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mois</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={teacherFormData.period_month}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, period_month: parseInt(e.target.value) })}
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Année</label>
                  <Input
                    type="number"
                    value={teacherFormData.period_year}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, period_year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={teacherFormData.description}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, description: e.target.value })}
                  placeholder="Ex: Salaire du mois, Prime..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTeacherDialogOpen(false)}>Annuler</Button>
              <Button type="submit">{editingPayment && editingPayment._kind === 'teacher' ? 'Modifier' : 'Enregistrer le Paiement'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de confirmation de suppression */}
      <ConfirmHardDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, payment: open ? deleteDialog.payment : null })}
        onConfirm={handleConfirmDelete}
        title="Supprimer le paiement"
        itemName={deleteDialog.payment ? `${deleteDialog.payment.first_name} ${deleteDialog.payment.last_name} - ${Number(deleteDialog.payment.amount).toLocaleString()} FCFA` : ''}
        warnings={[
          'Ce paiement sera définitivement supprimé',
          'Cette action est irréversible'
        ]}
      />
      
      {ToastComponent}

      {/* Style pour l'impression */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Composant de Reçu Invisible (visible uniquement à l'impression) */}
      {viewingPayment && (
        <div id="receipt-print" className="hidden print:block font-serif">
          <div className="border-4 border-double border-black p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold uppercase underline">Reçu de Paiement</h1>
              <p className="text-sm mt-1">Ecole Privée LA SAGESSE - Kalabancoro</p>
              <p className="text-xs italic">"L'éducation est la clé du futur"</p>
            </div>

            <div className="flex justify-between mb-8 text-sm">
              <div>
                <p><strong>N° Reçu:</strong> {String(viewingPayment.id).padStart(6, '0')}</p>
                <p><strong>Date:</strong> {new Date(viewingPayment.payment_date).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right">
                <p><strong>Année Scolaire:</strong> {viewingPayment.academic_year || '-'}</p>
              </div>
            </div>

            <div className="space-y-4 text-lg">
              <p>Reçu de : <span className="font-bold border-b border-dotted border-black px-2">{viewingPayment.first_name} {viewingPayment.last_name}</span></p>
              
              <p>La somme de (en chiffres) : <span className="font-bold border border-black bg-gray-100 px-4 py-1">{Number(viewingPayment.amount).toLocaleString()} FCFA</span></p>
              
              <p>Motif du paiement : <span className="font-bold italic">
                {viewingPayment._kind === 'teacher' 
                  ? `Salaire - ${months[(viewingPayment.period_month || 1) - 1]} ${viewingPayment.period_year}`
                  : (viewingPayment.type === 'uniform' ? 'Achat de tenue scolaire' : 'Frais de scolarité')}
              </span></p>

              <p>Méthode : <span className="font-medium">{viewingPayment.payment_method || 'Espèces'}</span></p>
              
              {viewingPayment.description && (
                <p className="text-sm italic">Observation : {viewingPayment.description}</p>
              )}
            </div>

            <div className="mt-12 flex justify-between">
              <div className="text-center">
                <p className="underline font-bold">Le Parent / Bénéficiaire</p>
                <div className="h-20"></div>
              </div>
              <div className="text-center">
                <p className="underline font-bold">Le Comptable / Direction</p>
                <div className="h-20"></div>
                <p className="text-xs italic">(Cachet et Signature)</p>
              </div>
            </div>

            <div className="mt-8 text-[10px] text-center text-gray-500 border-t pt-2">
              Imprimé le {new Date().toLocaleString('fr-FR')} via SchoolManage
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
