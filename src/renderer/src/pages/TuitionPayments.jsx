import React, { useMemo, useState } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
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
  CheckCircle,
  CircleDollarSign,
  Eye,
  Filter,
  GraduationCap,
  Pencil,
  Printer,
  RotateCcw,
  School,
  Search,
  WalletCards,
  XCircle,
} from 'lucide-react';

const MONTHS = [
  { id: 10, short: 'Oct', label: 'Octobre' },
  { id: 11, short: 'Nov', label: 'Novembre' },
  { id: 12, short: 'Déc', label: 'Décembre' },
  { id: 1, short: 'Jan', label: 'Janvier' },
  { id: 2, short: 'Fév', label: 'Février' },
  { id: 3, short: 'Mar', label: 'Mars' },
  { id: 4, short: 'Avr', label: 'Avril' },
  { id: 5, short: 'Mai', label: 'Mai' },
  { id: 6, short: 'Juin', label: 'Juin' },
];

const TRIMESTERS = [
  { id: 101, short: 'T1', label: '1er trimestre', months: [10, 11, 12] },
  { id: 102, short: 'T2', label: '2ème trimestre', months: [1, 2, 3] },
  { id: 103, short: 'T3', label: '3ème trimestre', months: [4, 5, 6] },
];

const SECOND_CYCLE_LEVELS = ['7ème année', '8ème année', '9ème année'];
const currentAcademicYear = (() => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
})();

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-';
const getStudentName = (student) => `${student?.first_name || ''} ${student?.last_name || ''}`.trim();
const isSecondCycle = (level) => SECOND_CYCLE_LEVELS.includes(level);
const parseAmount = (value) => Number(String(value || '').replace(',', '.'));
const periodLabel = (periodId) => {
  const id = Number(periodId);
  return MONTHS.find((month) => month.id === id)?.label
    || TRIMESTERS.find((trimester) => trimester.id === id)?.label
    || 'Échéance non définie';
};

function SelectField({ value, onChange, children, required = false }) {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </select>
  );
}

function StatTile({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    blue: 'bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20',
    green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
    red: 'bg-[#CC0033]/10 text-[#CC0033] border-[#CC0033]/20',
    orange: 'bg-[#FF6600]/10 text-[#FF3300] border-[#FF6600]/20',
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
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
    paid: ['Payé', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'],
    partial: ['Partiel', 'bg-[#FF6600]/10 text-[#FF3300]'],
    unpaid: ['Non payé', 'bg-[#CC0033]/10 text-[#CC0033]'],
    no_fee: ['Aucun frais', 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300'],
  };
  const [label, className] = config[status] || config.unpaid;
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function ProgressBar({ paid, expected }) {
  const percent = expected > 0 ? Math.min(Math.round((paid / expected) * 100), 100) : 0;
  const color = percent >= 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-[#FF6600]' : 'bg-[#CC0033]';
  return (
    <div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{percent}% réglé</p>
    </div>
  );
}

export default function TuitionPayments() {
  const { studentPayments, loading, createStudentPayment, updateStudentPayment } = usePayments();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class_id: 'all',
    status: 'all',
    academic_year: currentAcademicYear,
  });
  const [billingView, setBillingView] = useState('monthly');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    billing_mode: 'monthly',
    period_id: '',
    amount: '',
    payment_method: 'Espèces',
    description: '',
    academic_year: currentAcademicYear,
    payment_date: new Date().toISOString().split('T')[0],
  });

  const classById = useMemo(() => {
    const map = new Map();
    for (const cls of classes) map.set(Number(cls.id), cls);
    return map;
  }, [classes]);

  const tuitionPayments = useMemo(() => (
    studentPayments.filter((payment) => payment.type === 'tuition')
  ), [studentPayments]);

  const getSchedule = (student, mode = billingView) => {
    const cls = classById.get(Number(student?.class_id));
    const tuitionFee = Number(cls?.tuition_fee || 0);
    const secondCycle = isSecondCycle(cls?.level);
    const effectiveMode = secondCycle ? mode : 'monthly';
    const periods = effectiveMode === 'trimester'
      ? TRIMESTERS.map((period) => ({ ...period, expected: tuitionFee / TRIMESTERS.length, mode: 'trimester' }))
      : MONTHS.map((period) => ({ ...period, expected: tuitionFee / MONTHS.length, mode: 'monthly' }));
    return { cls, tuitionFee, secondCycle, mode: effectiveMode, periods };
  };

  const balances = useMemo(() => {
    const result = {};
    for (const student of students) {
      const schedule = getSchedule(student, billingView);
      const payments = tuitionPayments.filter((payment) =>
        Number(payment.student_id) === Number(student.id)
        && (!filters.academic_year || filters.academic_year === 'all' || payment.academic_year === filters.academic_year)
      );

      const periodStates = schedule.periods.map((period) => {
        const periodPayments = payments.filter((payment) => Number(payment.period_month) === Number(period.id));
        const paid = periodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const remaining = Math.max(period.expected - paid, 0);
        const status = period.expected <= 0 ? 'no_fee' : paid >= period.expected ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
        return { ...period, paid, remaining, status, payments: periodPayments };
      });

      const totalExpected = periodStates.reduce((sum, period) => sum + period.expected, 0);
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const totalRemaining = Math.max(totalExpected - totalPaid, 0);
      const status = totalExpected <= 0 ? 'no_fee' : totalPaid >= totalExpected ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

      result[student.id] = { ...schedule, payments, periods: periodStates, totalExpected, totalPaid, totalRemaining, status };
    }
    return result;
  }, [students, classById, tuitionPayments, billingView, filters.academic_year]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const cls = classById.get(Number(student.class_id));
      const balance = balances[student.id];
      const searchable = [student.first_name, student.last_name, student.matricule, cls?.name].filter(Boolean).join(' ').toLowerCase();
      const matchSearch = !q || searchable.includes(q);
      const matchClass = filters.class_id === 'all' || String(student.class_id || '') === String(filters.class_id);
      const matchStatus = filters.status === 'all' || balance?.status === filters.status;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, classById, balances, searchTerm, filters]);

  const pageStats = useMemo(() => {
    const expected = filteredStudents.reduce((sum, student) => sum + Number(balances[student.id]?.totalExpected || 0), 0);
    const paid = filteredStudents.reduce((sum, student) => sum + Number(balances[student.id]?.totalPaid || 0), 0);
    const remaining = Math.max(expected - paid, 0);
    return {
      expected,
      paid,
      remaining,
      paidCount: filteredStudents.filter((student) => balances[student.id]?.status === 'paid').length,
      partialCount: filteredStudents.filter((student) => balances[student.id]?.status === 'partial').length,
    };
  }, [filteredStudents, balances]);

  const academicYearOptions = useMemo(() => {
    const values = new Set([currentAcademicYear]);
    classes.forEach((cls) => cls.academic_year && values.add(cls.academic_year));
    tuitionPayments.forEach((payment) => payment.academic_year && values.add(payment.academic_year));
    return Array.from(values).sort((a, b) => b.localeCompare(a, 'fr'));
  }, [classes, tuitionPayments]);

  const openPaymentDialog = (student, preferredPeriod = null) => {
    const schedule = getSchedule(student, billingView);
    const periods = balances[student.id]?.periods || schedule.periods;
    const nextPeriod = preferredPeriod || periods.find((period) => period.remaining > 0) || periods[0];
    setSelectedStudent(student);
    setEditingPayment(null);
    setFormData({
      student_id: student.id,
      billing_mode: nextPeriod.mode,
      period_id: nextPeriod.id,
      amount: nextPeriod.remaining > 0 ? nextPeriod.remaining.toFixed(2) : '',
      payment_method: 'Espèces',
      description: `Scolarité - ${nextPeriod.label}`,
      academic_year: filters.academic_year === 'all' ? currentAcademicYear : filters.academic_year,
      payment_date: new Date().toISOString().split('T')[0],
    });
    setIsDetailsOpen(false);
    setIsDialogOpen(true);
  };

  const openEditPaymentDialog = (payment, student, period) => {
    setSelectedStudent(student);
    setEditingPayment(payment);
    setFormData({
      student_id: student.id,
      billing_mode: period.mode,
      period_id: period.id,
      amount: String(payment.amount ?? ''),
      payment_method: payment.payment_method || 'Espèces',
      description: payment.description || `Scolarité - ${period.label}`,
      academic_year: payment.academic_year || currentAcademicYear,
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
    });
    setIsDetailsOpen(false);
    setIsDialogOpen(true);
  };

  const selectedBalance = selectedStudent ? balances[selectedStudent.id] : null;
  const selectedSchedule = selectedStudent ? getSchedule(selectedStudent, formData.billing_mode) : null;
  const selectedPeriods = selectedStudent
    ? selectedSchedule.periods.map((period) => {
      const payments = tuitionPayments.filter((payment) =>
        Number(payment.student_id) === Number(selectedStudent.id)
        && Number(payment.period_month) === Number(period.id)
        && payment.academic_year === formData.academic_year
        && Number(payment.id) !== Number(editingPayment?.id)
      );
      const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return { ...period, paid, remaining: Math.max(period.expected - paid, 0) };
    })
    : [];
  const selectedPeriod = selectedPeriods.find((period) => Number(period.id) === Number(formData.period_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseAmount(formData.amount);
    if (!selectedStudent || !formData.period_id) {
      toast.error('Veuillez sélectionner une échéance');
      return;
    }
    if (amount <= 0) {
      toast.error('Le montant doit être supérieur à zéro');
      return;
    }
    if (Number.isNaN(amount)) {
      toast.error('Le montant saisi est invalide');
      return;
    }
    if (selectedPeriod && amount > selectedPeriod.remaining) {
      toast.error(`Montant trop élevé. Reste pour cette échéance : ${formatCurrency(selectedPeriod.remaining)}`);
      return;
    }

    const paymentData = {
      student_id: selectedStudent.id,
      type: 'tuition',
      amount,
      month_total: selectedPeriod?.expected || 0,
      payment_date: formData.payment_date,
      payment_method: formData.payment_method,
      description: formData.description || `Scolarité - ${selectedPeriod?.label || ''}`,
      academic_year: formData.academic_year,
      period_month: Number(formData.period_id),
      period_year: Number(String(formData.academic_year).slice(0, 4)) || new Date().getFullYear(),
    };

    const result = editingPayment
      ? await updateStudentPayment(editingPayment.id, paymentData)
      : await createStudentPayment(paymentData);
    if (result.success) {
      toast.success(editingPayment ? 'Paiement modifié' : 'Paiement enregistré');
      setIsDialogOpen(false);
      const receiptId = editingPayment?.id || result.data?.id;
      printReceipt({ ...paymentData, id: receiptId }, selectedStudent, selectedPeriod);
      setEditingPayment(null);
    } else {
      toast.error(result.error || 'Erreur lors de l’enregistrement');
    }
  };

  const printHtml = (html) => {
    const printWindow = window.open('', '_blank');
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
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 200);
  };

  const printReceipt = (payment, student, period = null) => {
    const cls = classById.get(Number(student?.class_id));
    const expected = Number(payment.month_total || period?.expected || 0);
    const beforePaid = tuitionPayments
      .filter((item) =>
        Number(item.student_id) === Number(student.id)
        && Number(item.period_month) === Number(payment.period_month)
        && item.academic_year === payment.academic_year
        && Number(item.id) !== Number(payment.id)
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paidAfter = beforePaid + Number(payment.amount || 0);
    const remaining = Math.max(expected - paidAfter, 0);

    printHtml(`
      <html>
        <head>
          <title>Reçu scolarité</title>
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
              <p>Frais de scolarité - Établissement LA SAGESSE</p>
              <p>Reçu N° ${String(payment.id || '').padStart(6, '0')}</p>
            </div>
            <div class="grid">
              <div class="box"><strong>Élève</strong><br>${getStudentName(student)}</div>
              <div class="box"><strong>Matricule</strong><br>${student?.matricule || '-'}</div>
              <div class="box"><strong>Classe</strong><br>${cls?.name || 'Non assigné'}</div>
              <div class="box"><strong>Année scolaire</strong><br>${payment.academic_year}</div>
              <div class="box"><strong>Échéance</strong><br>${periodLabel(payment.period_month)}</div>
              <div class="box"><strong>Date</strong><br>${formatDate(payment.payment_date)}</div>
            </div>
            <table>
              <tr><th>Description</th><th>Montant attendu</th><th>Montant payé</th><th>Reste échéance</th></tr>
              <tr>
                <td>${payment.description || 'Paiement scolarité'}</td>
                <td>${formatCurrency(expected)}</td>
                <td class="amount">${formatCurrency(payment.amount)}</td>
                <td>${formatCurrency(remaining)}</td>
              </tr>
            </table>
            <div class="grid">
              <div class="box"><strong>Mode de paiement</strong><br>${payment.payment_method || 'Espèces'}</div>
              <div class="box"><strong>Type</strong><br>${remaining <= 0 ? 'Paiement total de l’échéance' : 'Paiement partiel'}</div>
            </div>
            <div class="footer">
              <span>Signature parent / tuteur</span>
              <span>Cachet et signature direction</span>
            </div>
          </div>
        </body>
      </html>
    `);
  };

  const openDetails = (student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
  };

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold uppercase text-[#003399] dark:text-blue-200">
              <WalletCards className="h-3.5 w-3.5" />
              Scolarité par échéance
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Paiements scolarité</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Premier cycle : paiement mensuel. Second cycle : paiement mensuel ou trimestriel, avec règlement partiel ou total de chaque échéance.
            </p>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-800">
            <button type="button" onClick={() => setBillingView('monthly')} className={`rounded-md px-4 py-2 text-sm font-semibold ${billingView === 'monthly' ? 'bg-[#0066CC] text-white' : 'text-slate-600 dark:text-slate-300'}`}>Mensuel</button>
            <button type="button" onClick={() => setBillingView('trimester')} className={`rounded-md px-4 py-2 text-sm font-semibold ${billingView === 'trimester' ? 'bg-[#0066CC] text-white' : 'text-slate-600 dark:text-slate-300'}`}>Trimestriel second cycle</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={GraduationCap} label="Élèves affichés" value={filteredStudents.length} helper="Selon les filtres" tone="blue" />
        <StatTile icon={CircleDollarSign} label="Attendu" value={formatCurrency(pageStats.expected)} helper="Total échéances" tone="orange" />
        <StatTile icon={CheckCircle} label="Encaissé" value={formatCurrency(pageStats.paid)} helper={`${pageStats.paidCount} dossier(s) soldé(s)`} tone="green" />
        <StatTile icon={XCircle} label="Reste" value={formatCurrency(pageStats.remaining)} helper={`${pageStats.partialCount} dossier(s) partiel(s)`} tone="red" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr_0.9fr_0.9fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nom, matricule, classe..." className="h-10 pl-10" />
          </div>
          <SelectField value={filters.class_id} onChange={(e) => setFilters((prev) => ({ ...prev, class_id: e.target.value }))}>
            <option value="all">Toutes les classes</option>
            {classes.map((cls) => <option key={cls.id} value={cls.id}>{cls.name} - {cls.level}</option>)}
          </SelectField>
          <SelectField value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="all">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="partial">Partiel</option>
            <option value="unpaid">Non payé</option>
            <option value="no_fee">Aucun frais</option>
          </SelectField>
          <SelectField value={filters.academic_year} onChange={(e) => setFilters((prev) => ({ ...prev, academic_year: e.target.value }))}>
            <option value="all">Toutes années</option>
            {academicYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </SelectField>
          <Button type="button" variant="outline" onClick={() => {
            setSearchTerm('');
            setFilters({ class_id: 'all', status: 'all', academic_year: currentAcademicYear });
          }} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <Filter className="h-4 w-4" />
          <span>{filteredStudents.length} résultat(s)</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredStudents.map((student) => {
          const balance = balances[student.id];
          const cls = balance?.cls;
          return (
            <Card key={student.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold text-slate-950 dark:text-white">{getStudentName(student)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{student.matricule || 'Sans matricule'}</span>
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{cls?.name || 'Non assigné'}</span>
                        <span className="rounded-md bg-[#0066CC]/10 px-2.5 py-1 text-xs font-semibold text-[#0066CC]">{balance?.mode === 'trimester' ? 'Trimestriel' : 'Mensuel'}</span>
                        <StatusBadge status={balance?.status} />
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetails(student)} title="Voir les échéances">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(student)} title="Encaisser">
                        <Banknote className="h-4 w-4 text-[#0066CC]" />
                      </Button>
                    </div>
                  </div>
                  <ProgressBar paid={balance?.totalPaid || 0} expected={balance?.totalExpected || 0} />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Attendu</p>
                      <p className="font-bold text-slate-950 dark:text-white">{formatCurrency(balance?.totalExpected)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Payé</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(balance?.totalPaid)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Reste</p>
                      <p className="font-bold text-[#CC0033]">{formatCurrency(balance?.totalRemaining)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {balance?.periods.slice(0, 5).map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => openPaymentDialog(student, period)}
                        className={`rounded-lg border px-2 py-2 text-left text-xs ${period.status === 'paid' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : period.status === 'partial' ? 'border-orange-200 bg-orange-50 text-orange-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                      >
                        <span className="block font-bold">{period.short}</span>
                        <span>{formatCurrency(period.remaining)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(680px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Modifier le paiement' : 'Encaisser la scolarité'}</DialogTitle>
              <DialogDescription>
                Choisissez une échéance puis saisissez un paiement partiel ou le solde total de cette échéance.
              </DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-5 py-5">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="font-bold text-slate-950 dark:text-white">{getStudentName(selectedStudent)}</p>
                  <p className="text-sm text-slate-500">{selectedBalance?.cls?.name || 'Non assigné'} · {selectedBalance?.cls?.level || '-'}</p>
                </div>

                {selectedBalance?.secondCycle && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mode de paiement second cycle</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant={formData.billing_mode === 'monthly' ? 'default' : 'outline'} onClick={() => setFormData((prev) => ({ ...prev, billing_mode: 'monthly', period_id: '' }))}>Mensuel</Button>
                      <Button type="button" variant={formData.billing_mode === 'trimester' ? 'default' : 'outline'} onClick={() => setFormData((prev) => ({ ...prev, billing_mode: 'trimester', period_id: '' }))}>Trimestriel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Échéance *</label>
                  <SelectField value={formData.period_id} onChange={(e) => {
                    const period = selectedPeriods.find((item) => Number(item.id) === Number(e.target.value));
                    setFormData((prev) => ({
                      ...prev,
                      period_id: e.target.value,
                      amount: period?.remaining ? period.remaining.toFixed(2) : '',
                      description: `Scolarité - ${period?.label || ''}`,
                    }));
                  }} required>
                    <option value="">Sélectionner</option>
                    {selectedPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.label} - reste {formatCurrency(period.remaining)}
                      </option>
                    ))}
                  </SelectField>
                </div>

                {selectedPeriod && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Attendu</p><p className="font-bold">{formatCurrency(selectedPeriod.expected)}</p></div>
                    <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Déjà payé</p><p className="font-bold text-emerald-700">{formatCurrency(selectedPeriod.paid)}</p></div>
                    <div className="rounded-lg border p-3"><p className="text-xs text-slate-500">Reste</p><p className="font-bold text-[#CC0033]">{formatCurrency(selectedPeriod.remaining)}</p></div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Montant payé *</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex: 15000 ou 15000,50"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Année scolaire</label>
                    <Input value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Libellé reçu</label>
                    <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setEditingPayment(null);
                setIsDialogOpen(false);
              }}>Annuler</Button>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#005bb8]">
                {editingPayment ? 'Modifier et imprimer' : 'Enregistrer et imprimer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[92vh] w-[min(820px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Échéancier scolarité</DialogTitle>
            <DialogDescription>Suivi des paiements partiels et complets par échéance.</DialogDescription>
          </DialogHeader>
          {selectedStudent && selectedBalance && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/40">
                <p className="font-bold">{getStudentName(selectedStudent)}</p>
                <p className="text-sm text-slate-500">{selectedBalance.cls?.name || 'Non assigné'} · {selectedBalance.mode === 'trimester' ? 'Trimestriel' : 'Mensuel'}</p>
              </div>
              <div className="grid gap-3">
                {selectedBalance.periods.map((period) => (
                  <div key={period.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-950 dark:text-white">{period.label}</p>
                        <p className="text-sm text-slate-500">Attendu {formatCurrency(period.expected)} · payé {formatCurrency(period.paid)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={period.status} />
                        <Button size="sm" variant="outline" onClick={() => openPaymentDialog(selectedStudent, period)}>Encaisser</Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <ProgressBar paid={period.paid} expected={period.expected} />
                    </div>
                    {period.payments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {period.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
                            <span>{formatDate(payment.payment_date)} · {payment.payment_method || 'Espèces'}</span>
                            <div className="flex items-center gap-2">
                              <strong>{formatCurrency(payment.amount)}</strong>
                              <Button variant="ghost" size="icon" onClick={() => openEditPaymentDialog(payment, selectedStudent, period)} title="Modifier">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => printReceipt(payment, selectedStudent, period)} title="Imprimer reçu">
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
