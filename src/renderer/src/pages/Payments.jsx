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
import { Search, GraduationCap, Shirt, Users, TrendingUp, CheckCircle, XCircle, Eye, DollarSign, Pencil, Trash2 } from 'lucide-react';
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

  // Statistiques calculées
  const stats = React.useMemo(() => {
    if (activeTab === 'teachers') {
      const totalPaid = teacherPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const uniqueTeachersPaid = new Set(teacherPayments.map(p => p.teacher_id)).size;
      const totalTeachers = teachers.length;
      return {
        totalAmount: totalPaid,
        countPaid: uniqueTeachersPaid,
        countUnpaid: totalTeachers - uniqueTeachersPaid,
        label: "Salaires Versés",
        subLabel: "Enseignants Payés",
        unpaidLabel: "Restants"
      };
    } else {
      const currentPayments = studentPayments.filter(p => p.type === activeTab);
      const totalAmount = currentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const studentsWhoPaid = new Set(currentPayments.map(p => p.student_id)).size;
      const totalStudents = students.length;
      return {
        totalAmount,
        countPaid: studentsWhoPaid,
        countUnpaid: totalStudents - studentsWhoPaid,
        label: activeTab === 'tuition' ? "Scolarité Totale" : "Ventes Tenues",
        subLabel: "Élèves ayant payé",
        unpaidLabel: "N'ayant pas payé"
      };
    }
  }, [activeTab, studentPayments, teacherPayments, students, teachers]);

  const [studentFormData, setStudentFormData] = useState({
    student_id: '',
    type: 'tuition',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Espèces',
    description: '',
    academic_year: '2025-2026',
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
    setStudentDialogFilters({
      search: '',
      class_id: 'all',
      academic_year: 'all',
    });
    setStudentFormData({
      ...studentFormData,
      type: type,
      student_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      description: '',
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
      payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'Espèces',
      description: payment.description || '',
      academic_year: payment.academic_year || '2025-2026',
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

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = editingPayment && editingPayment._kind === 'student'
        ? await updateStudentPayment(editingPayment.id, studentFormData)
        : await createStudentPayment(studentFormData);
      if (result.success) {
        toast.success(editingPayment && editingPayment._kind === 'student' ? 'Paiement modifié avec succès !' : 'Paiement enregistré avec succès !');
        setIsStudentDialogOpen(false);
        setEditingPayment(null);
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = editingPayment && editingPayment._kind === 'teacher'
        ? await updateTeacherPayment(editingPayment.id, teacherFormData)
        : await createTeacherPayment(teacherFormData);
      if (result.success) {
        toast.success(editingPayment && editingPayment._kind === 'teacher' ? 'Paiement modifié avec succès !' : 'Paiement enseignant enregistré avec succès !');
        setIsTeacherDialogOpen(false);
        setEditingPayment(null);
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
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>{activeTab === 'teachers' ? 'Enseignant' : 'Élève'}</TableHead>
                  {activeTab !== 'teachers' && <TableHead>Classe</TableHead>}
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
                    <TableCell colSpan={8} className="text-center py-10">Chargement...</TableCell>
                  </TableRow>
                ) : (activeTab === 'teachers' ? filteredTeacherPayments : filteredStudentPayments).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">Aucun paiement trouvé</TableCell>
                  </TableRow>
                ) : (activeTab === 'teachers' ? filteredTeacherPayments : filteredStudentPayments).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                    {activeTab !== 'teachers' && <TableCell>{p.class_name || 'N/A'}</TableCell>}
                    <TableCell className="font-bold text-[#FF3300]">{p.amount.toLocaleString()} FCFA</TableCell>
                    <TableCell>{p.payment_method}</TableCell>
                    {activeTab === 'teachers' && (
                      <TableCell>{months[p.period_month - 1]} {p.period_year}</TableCell>
                    )}
                    <TableCell>{p.description || '-'}</TableCell>
                    <TableCell>
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
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Montant (FCFA)</label>
                  <Input
                    type="number"
                    value={studentFormData.amount}
                    onChange={(e) => {
                      const next = String(e.target.value ?? '').replace(/,/g, '');
                      setStudentFormData((prev) => ({ ...prev, amount: next }));
                    }}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Date</label>
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
                      {t.first_name} {t.last_name} - {t.specialty}
                    </option>
                  ))}
                </select>
              </div>
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
    </div>
  );
}
