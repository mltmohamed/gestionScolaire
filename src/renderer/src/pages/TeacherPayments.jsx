import React, { useMemo, useState } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useTeachers } from '@/hooks/useTeachers';
import { useToast } from '@/hooks/useToast.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Banknote,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Pencil,
  Printer,
  RotateCcw,
  Search,
  TrendingUp,
  UserRound,
  Wallet,
} from 'lucide-react';

const months = [
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

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-';
const parseAmount = (value) => Number(String(value || '').replace(',', '.'));
const getTeacherName = (teacher) => `${teacher?.first_name || ''} ${teacher?.last_name || ''}`.trim();
const getMonthLabel = (value) => months.find((month) => month.value === Number(value))?.label || '-';

function SelectField({ value, onChange, children, required = false, disabled = false }) {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </select>
  );
}

function StatTile({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    blue: 'bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20',
    green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
    orange: 'bg-[#FF6600]/10 text-[#FF3300] border-[#FF6600]/20',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800',
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 truncate text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const config = {
    paid: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
    partial: 'bg-[#FF6600]/10 text-[#FF3300] border-[#FF6600]/20',
    unpaid: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300',
    no_salary: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800',
  };
  const labels = {
    paid: 'Payé',
    partial: 'Partiel',
    unpaid: 'Non payé',
    no_salary: 'Salaire non défini',
  };

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${config[status]}`}>
      {labels[status]}
    </span>
  );
}

function ProgressBar({ paid, total }) {
  const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const color = percentage >= 100 ? 'bg-emerald-500' : percentage > 0 ? 'bg-[#FF6600]' : 'bg-slate-300';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

export default function TeacherPayments() {
  const { teacherPayments, loading, createTeacherPayment, updateTeacherPayment } = usePayments();
  const { teachers } = useTeachers();
  const { toast, ToastComponent } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    teacher_id: 'all',
    period_month: currentMonth,
    period_year: currentYear,
    status: 'all',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    teacher_id: '',
    amount: '',
    payment_method: 'Espèces',
    period_month: currentMonth,
    period_year: currentYear,
    payment_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const teacherStats = useMemo(() => {
    const stats = {};

    teachers.forEach((teacher) => {
      const payments = teacherPayments.filter((payment) =>
        Number(payment.teacher_id) === Number(teacher.id)
        && Number(payment.period_month) === Number(filters.period_month)
        && Number(payment.period_year) === Number(filters.period_year)
      );
      const expectedSalary = Number(teacher.salary || 0);
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const remaining = Math.max(expectedSalary - totalPaid, 0);

      stats[teacher.id] = {
        payments,
        expectedSalary,
        totalPaid,
        remaining,
        paymentCount: payments.length,
        status: expectedSalary > 0
          ? totalPaid >= expectedSalary
            ? 'paid'
            : totalPaid > 0
              ? 'partial'
              : 'unpaid'
          : 'no_salary',
      };
    });

    return stats;
  }, [teachers, teacherPayments, filters.period_month, filters.period_year]);

  const filteredTeachers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const stats = teacherStats[teacher.id];
      const searchable = [teacher.first_name, teacher.last_name, teacher.phone, teacher.specialty]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchSearch = !q || searchable.includes(q);
      const matchTeacher = filters.teacher_id === 'all' || String(teacher.id) === String(filters.teacher_id);
      const matchStatus = filters.status === 'all' || stats?.status === filters.status;
      return matchSearch && matchTeacher && matchStatus;
    });
  }, [teachers, teacherStats, searchTerm, filters]);

  const pageStats = useMemo(() => {
    const totalExpected = filteredTeachers.reduce((sum, teacher) => sum + Number(teacherStats[teacher.id]?.expectedSalary || 0), 0);
    const totalPaid = filteredTeachers.reduce((sum, teacher) => sum + Number(teacherStats[teacher.id]?.totalPaid || 0), 0);
    return {
      totalExpected,
      totalPaid,
      totalRemaining: Math.max(totalExpected - totalPaid, 0),
      paidCount: filteredTeachers.filter((teacher) => teacherStats[teacher.id]?.status === 'paid').length,
      partialCount: filteredTeachers.filter((teacher) => teacherStats[teacher.id]?.status === 'partial').length,
    };
  }, [filteredTeachers, teacherStats]);

  const getStatsForForm = () => {
    const teacher = teachers.find((item) => Number(item.id) === Number(formData.teacher_id));
    if (!teacher) return { teacher: null, salary: 0, paidExcludingEdit: 0, remaining: 0 };
    const salary = Number(teacher.salary || 0);
    const paidExcludingEdit = teacherPayments
      .filter((payment) =>
        Number(payment.teacher_id) === Number(teacher.id)
        && Number(payment.period_month) === Number(formData.period_month)
        && Number(payment.period_year) === Number(formData.period_year)
        && Number(payment.id) !== Number(editingPayment?.id)
      )
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    return {
      teacher,
      salary,
      paidExcludingEdit,
      remaining: Math.max(salary - paidExcludingEdit, 0),
    };
  };

  const openPaymentDialog = (teacher = null) => {
    const stats = teacher ? teacherStats[teacher.id] : null;
    setSelectedTeacher(teacher);
    setEditingPayment(null);
    setFormData({
      teacher_id: teacher?.id || '',
      amount: stats?.remaining ? String(stats.remaining) : '',
      payment_method: 'Espèces',
      period_month: filters.period_month,
      period_year: filters.period_year,
      payment_date: new Date().toISOString().split('T')[0],
      description: teacher ? `Salaire ${getMonthLabel(filters.period_month)} ${filters.period_year}` : '',
    });
    setIsDetailsOpen(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (payment, teacher) => {
    setSelectedTeacher(teacher);
    setEditingPayment(payment);
    setFormData({
      teacher_id: payment.teacher_id || teacher?.id || '',
      amount: String(payment.amount || ''),
      payment_method: payment.payment_method || 'Espèces',
      period_month: Number(payment.period_month || filters.period_month),
      period_year: Number(payment.period_year || filters.period_year),
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      description: payment.description || '',
    });
    setIsDetailsOpen(false);
    setIsDialogOpen(true);
  };

  const handleTeacherChange = (teacherId) => {
    const teacher = teachers.find((item) => Number(item.id) === Number(teacherId));
    setSelectedTeacher(teacher || null);
    setFormData((prev) => {
      const stats = teacher ? teacherStats[teacher.id] : null;
      return {
        ...prev,
        teacher_id: teacherId,
        amount: stats?.remaining ? String(stats.remaining) : '',
        description: teacher ? `Salaire ${getMonthLabel(prev.period_month)} ${prev.period_year}` : '',
      };
    });
  };

  const handlePeriodChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: Number(value) };
      const teacher = teachers.find((item) => Number(item.id) === Number(next.teacher_id));
      const paid = teacherPayments
        .filter((payment) =>
          Number(payment.teacher_id) === Number(next.teacher_id)
          && Number(payment.period_month) === Number(next.period_month)
          && Number(payment.period_year) === Number(next.period_year)
          && Number(payment.id) !== Number(editingPayment?.id)
        )
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const remaining = Math.max(Number(teacher?.salary || 0) - paid, 0);
      return {
        ...next,
        amount: remaining ? String(remaining) : next.amount,
        description: teacher ? `Salaire ${getMonthLabel(next.period_month)} ${next.period_year}` : next.description,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseAmount(formData.amount);
    const salaryInfo = getStatsForForm();

    if (!salaryInfo.teacher) {
      toast.error('Veuillez sélectionner un enseignant');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    if (salaryInfo.salary <= 0) {
      toast.error('Définissez d’abord le salaire mensuel dans la fiche professeur');
      return;
    }
    if (amount > salaryInfo.remaining) {
      toast.error(`Le montant dépasse le reste à payer (${formatCurrency(salaryInfo.remaining)})`);
      return;
    }

    const data = {
      teacher_id: salaryInfo.teacher.id,
      amount,
      payment_method: formData.payment_method,
      period_month: Number(formData.period_month),
      period_year: Number(formData.period_year),
      payment_date: formData.payment_date,
      description: formData.description || `Salaire ${getMonthLabel(formData.period_month)} ${formData.period_year}`,
    };

    const result = editingPayment
      ? await updateTeacherPayment(editingPayment.id, data)
      : await createTeacherPayment(data);

    if (result.success) {
      toast.success(editingPayment ? 'Paiement modifié' : 'Paiement enregistré');
      setIsDialogOpen(false);
      setEditingPayment(null);
      printReceipt({ ...data, id: editingPayment?.id || result.data?.id }, salaryInfo.teacher);
    } else {
      toast.error(result.error || "Erreur lors de l'enregistrement");
    }
  };

  const printHtml = (html) => {
    const win = window.open('', '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => document.body.removeChild(iframe), 1000);
        }
      }, 200);
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 200);
  };

  const printReceipt = (payment, teacher) => {
    printHtml(`
      <html>
        <head>
          <title>Reçu salaire enseignant</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #111827; }
            .receipt { border: 2px solid #111827; padding: 24px; max-width: 760px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin: 18px 0; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #eff6ff; }
            .amount { font-size: 24px; font-weight: 800; color: #0066CC; }
            .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>REÇU DE PAIEMENT</h1>
              <p>Salaire enseignant - Établissement LA SAGESSE</p>
              <p>Reçu N° ${String(payment.id || '').padStart(6, '0')}</p>
            </div>
            <div class="grid">
              <div class="box"><strong>Enseignant</strong><br>${getTeacherName(teacher)}</div>
              <div class="box"><strong>Spécialité</strong><br>${teacher?.specialty || '-'}</div>
              <div class="box"><strong>Période</strong><br>${getMonthLabel(payment.period_month)} ${payment.period_year}</div>
              <div class="box"><strong>Date</strong><br>${formatDate(payment.payment_date)}</div>
              <div class="box"><strong>Téléphone</strong><br>${teacher?.phone || '-'}</div>
              <div class="box"><strong>Mode</strong><br>${payment.payment_method || 'Espèces'}</div>
            </div>
            <table>
              <tr><th>Description</th><th>Montant</th></tr>
              <tr>
                <td>${payment.description || '-'}</td>
                <td class="amount">${formatCurrency(payment.amount)}</td>
              </tr>
            </table>
            <div class="footer">
              <span>Signature enseignant</span>
              <span>Cachet et signature direction</span>
            </div>
          </div>
        </body>
      </html>
    `);
  };

  const printReport = () => {
    const rows = filteredTeachers.map((teacher) => {
      const stats = teacherStats[teacher.id];
      return `
        <tr>
          <td>${getTeacherName(teacher)}</td>
          <td>${teacher.specialty || '-'}</td>
          <td>${formatCurrency(stats?.expectedSalary)}</td>
          <td>${formatCurrency(stats?.totalPaid)}</td>
          <td>${formatCurrency(stats?.remaining)}</td>
          <td>${stats?.status === 'paid' ? 'Payé' : stats?.status === 'partial' ? 'Partiel' : stats?.status === 'no_salary' ? 'Salaire non défini' : 'Non payé'}</td>
        </tr>
      `;
    }).join('');

    printHtml(`
      <html>
        <head>
          <title>Rapport salaires enseignants</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 28px; color: #111827; }
            h1, h2 { text-align: center; margin: 4px 0; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
            .box { border: 1px solid #cbd5e1; background: #f8fafc; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #cbd5e1; padding: 9px; text-align: left; }
            th { background: #eff6ff; }
            .footer { margin-top: 28px; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>RAPPORT DES SALAIRES</h1>
          <h2>${getMonthLabel(filters.period_month)} ${filters.period_year}</h2>
          <div class="summary">
            <div class="box"><strong>Salaires attendus</strong><br>${formatCurrency(pageStats.totalExpected)}</div>
            <div class="box"><strong>Déjà payé</strong><br>${formatCurrency(pageStats.totalPaid)}</div>
            <div class="box"><strong>Reste à payer</strong><br>${formatCurrency(pageStats.totalRemaining)}</div>
          </div>
          <table>
            <tr><th>Enseignant</th><th>Spécialité</th><th>Salaire</th><th>Payé</th><th>Reste</th><th>Statut</th></tr>
            ${rows}
          </table>
          <div class="footer">Document généré le ${formatDate(new Date())}</div>
        </body>
      </html>
    `);
  };

  const openDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDetailsOpen(true);
  };

  const selectedStats = selectedTeacher ? teacherStats[selectedTeacher.id] : null;
  const formStats = getStatsForForm();
  const formAmount = parseAmount(formData.amount);
  const remainingAfterPayment = Math.max(formStats.remaining - (Number.isFinite(formAmount) ? formAmount : 0), 0);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
          <RotateCcw className="h-5 w-5 animate-spin text-[#0066CC]" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des paiements</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 fade-in">
      {ToastComponent}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold uppercase text-[#003399] dark:text-blue-200">
              <Wallet className="h-3.5 w-3.5" />
              Paie mensuelle
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Paiements enseignants</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Suivez les salaires mensuels, encaissez un paiement total ou partiel, modifiez une erreur et imprimez un reçu clair.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={printReport} className="h-11 gap-2">
              <Printer className="h-4 w-4" />
              Rapport
            </Button>
            <Button onClick={() => openPaymentDialog()} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
              <Banknote className="h-4 w-4" />
              Nouveau paiement
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={UserRound} label="Enseignants affichés" value={filteredTeachers.length} helper={`${pageStats.paidCount} payés, ${pageStats.partialCount} partiels`} tone="blue" />
        <StatTile icon={Wallet} label="Salaires attendus" value={formatCurrency(pageStats.totalExpected)} helper={`${getMonthLabel(filters.period_month)} ${filters.period_year}`} tone="slate" />
        <StatTile icon={CheckCircle2} label="Déjà payé" value={formatCurrency(pageStats.totalPaid)} helper="Selon les filtres" tone="green" />
        <StatTile icon={Clock3} label="Reste à payer" value={formatCurrency(pageStats.totalRemaining)} helper="Solde de la période" tone="orange" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.9fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nom, téléphone, spécialité..." className="h-10 pl-10" />
          </div>
          <SelectField value={filters.teacher_id} onChange={(e) => setFilters((prev) => ({ ...prev, teacher_id: e.target.value }))}>
            <option value="all">Tous les enseignants</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{getTeacherName(teacher)}</option>)}
          </SelectField>
          <SelectField value={filters.period_month} onChange={(e) => setFilters((prev) => ({ ...prev, period_month: Number(e.target.value) }))}>
            {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
          </SelectField>
          <SelectField value={filters.period_year} onChange={(e) => setFilters((prev) => ({ ...prev, period_year: Number(e.target.value) }))}>
            {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </SelectField>
          <SelectField value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="all">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="partial">Partiel</option>
            <option value="unpaid">Non payé</option>
            <option value="no_salary">Salaire non défini</option>
          </SelectField>
          <Button type="button" variant="outline" onClick={() => {
            setSearchTerm('');
            setFilters({ teacher_id: 'all', period_month: currentMonth, period_year: currentYear, status: 'all' });
          }} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Filter className="h-4 w-4" />
          <span>{filteredTeachers.length} résultat(s)</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => {
          const stats = teacherStats[teacher.id];
          return (
            <Card key={teacher.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-slate-950 dark:text-white">{getTeacherName(teacher)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{teacher.specialty || 'Spécialité non renseignée'}</span>
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{teacher.phone || 'Sans téléphone'}</span>
                      <StatusBadge status={stats.status} />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDetails(teacher)} title="Historique">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(teacher)} title="Encaisser" disabled={stats.status === 'paid' || stats.status === 'no_salary'}>
                      <Banknote className="h-4 w-4 text-[#0066CC]" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Salaire mensuel</p>
                    <p className="font-bold">{formatCurrency(stats.expectedSalary)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Payé</p>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.totalPaid)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500">Reste</p>
                    <p className="font-bold text-[#FF3300]">{formatCurrency(stats.remaining)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar paid={stats.totalPaid} total={stats.expectedSalary} />
                  <span className="w-12 text-right text-xs font-semibold text-slate-500">
                    {stats.expectedSalary > 0 ? `${Math.min((stats.totalPaid / stats.expectedSalary) * 100, 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
            Aucun enseignant trouvé pour ces filtres.
          </div>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(660px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Modifier le paiement' : 'Nouveau paiement enseignant'}</DialogTitle>
              <DialogDescription>Le salaire mensuel est renseigné dans la fiche professeur. Ici, vous encaissez tout ou une partie du mois choisi.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enseignant *</label>
                <SelectField value={formData.teacher_id} onChange={(e) => handleTeacherChange(e.target.value)} required disabled={!!editingPayment}>
                  <option value="">Sélectionner</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{getTeacherName(teacher)} - {teacher.specialty || 'Non spécifiée'}</option>
                  ))}
                </SelectField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mois *</label>
                  <SelectField value={formData.period_month} onChange={(e) => handlePeriodChange('period_month', e.target.value)} required>
                    {months.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
                  </SelectField>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Année *</label>
                  <SelectField value={formData.period_year} onChange={(e) => handlePeriodChange('period_year', e.target.value)} required>
                    {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
                  </SelectField>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Montant *</label>
                  <Input type="text" inputMode="decimal" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mode</label>
                  <SelectField value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}>
                    <option value="Espèces">Espèces</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Virement bancaire">Virement bancaire</option>
                    <option value="Chèque">Chèque</option>
                  </SelectField>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <TrendingUp className="h-4 w-4 text-[#0066CC]" />
                    Solde après paiement
                  </p>
                  <p className="mt-2 text-slate-500">Salaire : {formatCurrency(formStats.salary)}</p>
                  <p className="text-slate-500">Déjà payé : {formatCurrency(formStats.paidExcludingEdit)}</p>
                  <p className="font-bold text-[#FF3300]">Reste : {formatCurrency(remainingAfterPayment)}</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: acompte, régularisation..." />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#005bb8]">{editingPayment ? 'Modifier et imprimer' : 'Enregistrer et imprimer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[92vh] w-[min(820px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historique des paiements</DialogTitle>
            <DialogDescription>{getMonthLabel(filters.period_month)} {filters.period_year}</DialogDescription>
          </DialogHeader>
          {selectedTeacher && selectedStats && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold">{getTeacherName(selectedTeacher)}</p>
                    <p className="text-sm text-slate-500">{selectedTeacher.specialty || 'Non spécifiée'} · {selectedTeacher.phone || 'Sans téléphone'}</p>
                  </div>
                  <StatusBadge status={selectedStats.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div><p className="text-xs text-slate-500">Salaire</p><p className="font-bold">{formatCurrency(selectedStats.expectedSalary)}</p></div>
                  <div><p className="text-xs text-slate-500">Payé</p><p className="font-bold text-emerald-700">{formatCurrency(selectedStats.totalPaid)}</p></div>
                  <div><p className="text-xs text-slate-500">Reste</p><p className="font-bold text-[#FF3300]">{formatCurrency(selectedStats.remaining)}</p></div>
                </div>
              </div>
              {selectedStats.payments.length > 0 ? (
                <div className="space-y-2">
                  {selectedStats.payments.map((payment) => (
                    <div key={payment.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-slate-500">{formatDate(payment.payment_date)} · {payment.payment_method || 'Espèces'} · {payment.description || '-'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(payment, selectedTeacher)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => printReceipt(payment, selectedTeacher)} title="Imprimer reçu">
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">Aucun paiement enregistré pour cette période.</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDetailsOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
