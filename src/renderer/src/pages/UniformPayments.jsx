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
  Eye,
  Filter,
  Pencil,
  Printer,
  Receipt,
  RotateCcw,
  Search,
  Shirt,
  ShoppingBag,
  Trophy,
  Users,
} from 'lucide-react';

const currentAcademicYear = (() => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
})();

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '-';
const parseAmount = (value) => Number(String(value || '').replace(',', '.'));
const getStudentName = (student) => `${student?.first_name || ''} ${student?.last_name || ''}`.trim();

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

function getUniformMeta(payment) {
  const raw = String(payment.description || '');
  const kind = raw.includes('[sport]') ? 'sport' : 'class';
  const qtyMatch = raw.match(/\[qty:(\d+)\]/);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : Number(payment.period_month || 1);
  const label = kind === 'sport' ? 'Tenue sportive' : 'Tenue de classe';
  return { kind, quantity: quantity || 1, label };
}

function cleanDescription(description) {
  return String(description || '')
    .replace(/\[(sport|class)\]/g, '')
    .replace(/\[qty:\d+\]/g, '')
    .trim();
}

export default function UniformPayments() {
  const { studentPayments, loading, createStudentPayment, updateStudentPayment } = usePayments();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class_id: 'all',
    kind: 'all',
    academic_year: currentAcademicYear,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    kind: 'class',
    quantity: 1,
    unit_price: '',
    payment_method: 'Espèces',
    academic_year: currentAcademicYear,
    payment_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const classById = useMemo(() => {
    const map = new Map();
    classes.forEach((cls) => map.set(Number(cls.id), cls));
    return map;
  }, [classes]);

  const uniformPayments = useMemo(() => (
    studentPayments.filter((payment) => payment.type === 'uniform')
  ), [studentPayments]);

  const getPriceForStudent = (student, kind) => {
    const cls = classById.get(Number(student?.class_id));
    if (!cls) return 0;
    if (kind === 'sport') return Number(cls.uniform_sport_fee || 0);
    return Number(cls.uniform_class_fee ?? cls.uniform_fee ?? 0);
  };

  const enrichedStudents = useMemo(() => students.map((student) => {
    const cls = classById.get(Number(student.class_id));
    const payments = uniformPayments.filter((payment) =>
      Number(payment.student_id) === Number(student.id)
      && (filters.academic_year === 'all' || payment.academic_year === filters.academic_year)
    );
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const classCount = payments.filter((payment) => getUniformMeta(payment).kind === 'class').reduce((sum, payment) => sum + getUniformMeta(payment).quantity, 0);
    const sportCount = payments.filter((payment) => getUniformMeta(payment).kind === 'sport').reduce((sum, payment) => sum + getUniformMeta(payment).quantity, 0);
    return { ...student, class_name: cls?.name || '', class_level: cls?.level || '', payments, total, classCount, sportCount };
  }), [students, classById, uniformPayments, filters.academic_year]);

  const filteredStudents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return enrichedStudents.filter((student) => {
      const searchable = [student.first_name, student.last_name, student.matricule, student.class_name].filter(Boolean).join(' ').toLowerCase();
      const matchSearch = !q || searchable.includes(q);
      const matchClass = filters.class_id === 'all' || String(student.class_id || '') === String(filters.class_id);
      const matchKind = filters.kind === 'all' || (filters.kind === 'class' ? student.classCount > 0 : student.sportCount > 0);
      return matchSearch && matchClass && matchKind;
    });
  }, [enrichedStudents, searchTerm, filters]);

  const pageStats = useMemo(() => {
    const payments = filteredStudents.flatMap((student) => student.payments);
    const total = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const classQty = payments.filter((payment) => getUniformMeta(payment).kind === 'class').reduce((sum, payment) => sum + getUniformMeta(payment).quantity, 0);
    const sportQty = payments.filter((payment) => getUniformMeta(payment).kind === 'sport').reduce((sum, payment) => sum + getUniformMeta(payment).quantity, 0);
    return { total, classQty, sportQty, buyers: filteredStudents.filter((student) => student.payments.length > 0).length };
  }, [filteredStudents]);

  const academicYearOptions = useMemo(() => {
    const values = new Set([currentAcademicYear]);
    classes.forEach((cls) => cls.academic_year && values.add(cls.academic_year));
    uniformPayments.forEach((payment) => payment.academic_year && values.add(payment.academic_year));
    return Array.from(values).sort((a, b) => b.localeCompare(a, 'fr'));
  }, [classes, uniformPayments]);

  const openPaymentDialog = (student = null, kind = 'class') => {
    const unitPrice = student ? getPriceForStudent(student, kind) : '';
    setSelectedStudent(student);
    setEditingPayment(null);
    setFormData({
      student_id: student?.id || '',
      kind,
      quantity: 1,
      unit_price: unitPrice ? String(unitPrice) : '',
      payment_method: 'Espèces',
      academic_year: filters.academic_year === 'all' ? currentAcademicYear : filters.academic_year,
      payment_date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsDetailsOpen(false);
    setIsDialogOpen(true);
  };

  const openEditDialog = (payment, student) => {
    const meta = getUniformMeta(payment);
    setSelectedStudent(student);
    setEditingPayment(payment);
    setFormData({
      student_id: student.id,
      kind: meta.kind,
      quantity: meta.quantity,
      unit_price: meta.quantity > 0 ? String(Number(payment.amount || 0) / meta.quantity) : String(payment.amount || 0),
      payment_method: payment.payment_method || 'Espèces',
      academic_year: payment.academic_year || currentAcademicYear,
      payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
      note: cleanDescription(payment.description),
    });
    setIsDetailsOpen(false);
    setIsDialogOpen(true);
  };

  const handleStudentChange = (studentId) => {
    const student = students.find((item) => Number(item.id) === Number(studentId));
    setSelectedStudent(student || null);
    setFormData((prev) => ({
      ...prev,
      student_id: studentId,
      unit_price: student ? String(getPriceForStudent(student, prev.kind)) : '',
    }));
  };

  const handleKindChange = (kind) => {
    setFormData((prev) => ({
      ...prev,
      kind,
      unit_price: selectedStudent ? String(getPriceForStudent(selectedStudent, kind)) : prev.unit_price,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const student = selectedStudent || students.find((item) => Number(item.id) === Number(formData.student_id));
    const quantity = Number(formData.quantity || 1);
    const unitPrice = parseAmount(formData.unit_price);
    if (!student) {
      toast.error('Veuillez sélectionner un élève');
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || quantity <= 0) {
      toast.error('Prix ou quantité invalide');
      return;
    }
    const meta = formData.kind === 'sport' ? '[sport]' : '[class]';
    const amount = unitPrice * quantity;
    const label = formData.kind === 'sport' ? 'Tenue sportive' : 'Tenue de classe';
    const description = `${meta}[qty:${quantity}] ${label}${formData.note ? ` - ${formData.note}` : ''}`;
    const data = {
      student_id: student.id,
      type: 'uniform',
      amount,
      month_total: unitPrice,
      payment_date: formData.payment_date,
      payment_method: formData.payment_method,
      description,
      academic_year: formData.academic_year,
      period_month: quantity,
      period_year: Number(String(formData.academic_year).slice(0, 4)) || new Date().getFullYear(),
    };
    const result = editingPayment
      ? await updateStudentPayment(editingPayment.id, data)
      : await createStudentPayment(data);
    if (result.success) {
      toast.success(editingPayment ? 'Achat modifié' : 'Achat enregistré');
      setIsDialogOpen(false);
      setEditingPayment(null);
      printReceipt({ ...data, id: editingPayment?.id || result.data?.id }, student);
    } else {
      toast.error(result.error || 'Erreur lors de l’enregistrement');
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

  const printReceipt = (payment, student) => {
    const meta = getUniformMeta(payment);
    const cls = classById.get(Number(student?.class_id));
    const unit = Number(payment.month_total || (Number(payment.amount || 0) / meta.quantity));
    printHtml(`
      <html>
        <head>
          <title>Reçu tenue scolaire</title>
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
              <h1>REÇU DE TENUE SCOLAIRE</h1>
              <p>Établissement LA SAGESSE</p>
              <p>Reçu N° ${String(payment.id || '').padStart(6, '0')}</p>
            </div>
            <div class="grid">
              <div class="box"><strong>Élève</strong><br>${getStudentName(student)}</div>
              <div class="box"><strong>Matricule</strong><br>${student?.matricule || '-'}</div>
              <div class="box"><strong>Classe</strong><br>${cls?.name || 'Non assigné'}</div>
              <div class="box"><strong>Année scolaire</strong><br>${payment.academic_year || '-'}</div>
              <div class="box"><strong>Date</strong><br>${formatDate(payment.payment_date)}</div>
              <div class="box"><strong>Mode</strong><br>${payment.payment_method || 'Espèces'}</div>
            </div>
            <table>
              <tr><th>Article</th><th>Quantité</th><th>Prix unitaire</th><th>Total</th></tr>
              <tr>
                <td>${meta.label}</td>
                <td>${meta.quantity}</td>
                <td>${formatCurrency(unit)}</td>
                <td class="amount">${formatCurrency(payment.amount)}</td>
              </tr>
            </table>
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

  const previewUnitPrice = parseAmount(formData.unit_price);
  const previewTotal = Number.isFinite(previewUnitPrice)
    ? previewUnitPrice * Number(formData.quantity || 0)
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
          <RotateCcw className="h-5 w-5 animate-spin text-[#0066CC]" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des tenues</span>
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
              <Shirt className="h-3.5 w-3.5" />
              Ventes de tenues
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Paiements tenues scolaires</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Enregistrez des achats complets de tenue de classe ou sportive. Un élève peut acheter plusieurs fois, avec quantité et reçu dédiés.
            </p>
          </div>
          <Button onClick={() => openPaymentDialog()} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
            <ShoppingBag className="h-4 w-4" />
            Nouvel achat
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Élèves affichés" value={filteredStudents.length} helper={`${pageStats.buyers} avec achat`} tone="blue" />
        <StatTile icon={Shirt} label="Tenues classe" value={pageStats.classQty} helper="Quantités vendues" tone="orange" />
        <StatTile icon={Trophy} label="Tenues sport" value={pageStats.sportQty} helper="Quantités vendues" tone="orange" />
        <StatTile icon={Receipt} label="Total encaissé" value={formatCurrency(pageStats.total)} helper="Selon les filtres" tone="green" />
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
          <SelectField value={filters.kind} onChange={(e) => setFilters((prev) => ({ ...prev, kind: e.target.value }))}>
            <option value="all">Tous les achats</option>
            <option value="class">Tenue de classe</option>
            <option value="sport">Tenue sportive</option>
          </SelectField>
          <SelectField value={filters.academic_year} onChange={(e) => setFilters((prev) => ({ ...prev, academic_year: e.target.value }))}>
            <option value="all">Toutes années</option>
            {academicYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </SelectField>
          <Button type="button" variant="outline" onClick={() => {
            setSearchTerm('');
            setFilters({ class_id: 'all', kind: 'all', academic_year: currentAcademicYear });
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
        {filteredStudents.map((student) => (
          <Card key={student.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-slate-950 dark:text-white">{getStudentName(student)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{student.matricule || 'Sans matricule'}</span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">{student.class_name || 'Non assigné'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openDetails(student)} title="Historique">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(student, 'class')} title="Tenue de classe">
                    <Shirt className="h-4 w-4 text-[#0066CC]" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(student, 'sport')} title="Tenue sportive">
                    <Trophy className="h-4 w-4 text-[#FF6600]" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Tenue classe</p>
                  <p className="font-bold">{student.classCount}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Tenue sport</p>
                  <p className="font-bold">{student.sportCount}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(student.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(620px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingPayment ? 'Modifier l’achat' : 'Nouvel achat de tenue'}</DialogTitle>
              <DialogDescription>Aucun paiement partiel : choisissez le type, la quantité et le prix unitaire.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Élève *</label>
                <SelectField value={formData.student_id} onChange={(e) => handleStudentChange(e.target.value)} required>
                  <option value="">Sélectionner</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>{getStudentName(student)} - {classById.get(Number(student.class_id))?.name || 'Non assigné'}</option>
                  ))}
                </SelectField>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={formData.kind === 'class' ? 'default' : 'outline'} onClick={() => handleKindChange('class')}>Tenue de classe</Button>
                <Button type="button" variant={formData.kind === 'sport' ? 'default' : 'outline'} onClick={() => handleKindChange('sport')}>Tenue sportive</Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantité *</label>
                  <Input type="number" min="1" step="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prix unitaire *</label>
                  <Input type="text" inputMode="decimal" value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })} required />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total</label>
                  <Input value={formatCurrency(previewTotal)} disabled />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Note</label>
                  <Input value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Ex: taille, remarque..." />
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
            <DialogTitle>Historique des achats de tenue</DialogTitle>
            <DialogDescription>Chaque ligne correspond à un achat complet.</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900/40">
                <p className="font-bold">{getStudentName(selectedStudent)}</p>
                <p className="text-sm text-slate-500">{selectedStudent.class_name || 'Non assigné'}</p>
              </div>
              {(selectedStudent.payments || []).length > 0 ? (
                <div className="space-y-2">
                  {selectedStudent.payments.map((payment) => {
                    const meta = getUniformMeta(payment);
                    return (
                      <div key={payment.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">{meta.label} x{meta.quantity}</p>
                          <p className="text-sm text-slate-500">{formatDate(payment.payment_date)} · {payment.payment_method || 'Espèces'} · {cleanDescription(payment.description)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <strong>{formatCurrency(payment.amount)}</strong>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(payment, selectedStudent)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => printReceipt(payment, selectedStudent)} title="Imprimer reçu">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">Aucun achat enregistré.</div>
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
