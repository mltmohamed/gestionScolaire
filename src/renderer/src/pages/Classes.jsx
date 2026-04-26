import React, { useMemo, useState } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { useTeachers } from '@/hooks/useTeachers';
import { useToast } from '@/hooks/useToast.jsx';
import { classAPI } from '@/services/api';
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
  BookOpen,
  Calendar,
  CircleDollarSign,
  Eye,
  Filter,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  School,
  Search,
  ShieldCheck,
  Shirt,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { ConfirmHardDeleteDialog } from '@/components/ui/alert-dialog';

const COLLEGE_LEVELS = ['7ème année', '8ème année', '9ème année'];

const LEVEL_OPTIONS = [
  "Jardin d'enfant",
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
  '7ème année',
  '8ème année',
  '9ème année',
];

const emptyForm = {
  name: '',
  level: '',
  academic_year: '2025-2026',
  max_students: 30,
  teacher_id: '',
  teacher_ids: [],
  tuition_fee: 0,
  uniform_fee: 0,
  uniform_class_fee: 0,
  uniform_sport_fee: 0,
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
const formatNumber = (value) => Number(value || 0).toLocaleString('fr-FR');
const isCollegeLevel = (level) => COLLEGE_LEVELS.includes(level);

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
        <RotateCcw className="h-5 w-5 animate-spin text-[#0066CC]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des classes</span>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, children, className = '', required = false }) {
  return (
    <select
      value={value}
      onChange={onChange}
      required={required}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
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
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
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

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{value || '-'}</p>
    </div>
  );
}

function TeacherChip({ teacher }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066CC]/10 text-xs font-bold text-[#0066CC]">
        {teacher.first_name?.[0]}{teacher.last_name?.[0]}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950 dark:text-white">{teacher.first_name} {teacher.last_name}</p>
        <p className="truncate text-xs text-slate-500">{teacher.specialty || 'Spécialité non définie'}</p>
      </div>
    </div>
  );
}

export default function Classes() {
  const { classes, loading, createClass, updateClass, deleteClass } = useClasses();
  const { teachers } = useTeachers();
  const { toast, ToastComponent } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: 'all',
    academic_year: 'all',
    teacher_id: 'all',
    capacity: 'all',
  });
  const [formData, setFormData] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, cls: null });

  const levelOptions = useMemo(() => {
    const values = new Set();
    for (const cls of classes) {
      const level = String(cls.level || '').trim();
      if (level) values.add(level);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [classes]);

  const academicYearOptions = useMemo(() => {
    const values = new Set();
    for (const cls of classes) {
      const year = String(cls.academic_year || '').trim();
      if (year) values.add(year);
    }
    return Array.from(values).sort((a, b) => b.localeCompare(a, 'fr'));
  }, [classes]);

  const stats = useMemo(() => {
    const total = classes.length;
    const students = classes.reduce((sum, cls) => sum + Number(cls.student_count || 0), 0);
    const capacity = classes.reduce((sum, cls) => sum + Number(cls.max_students || 0), 0);
    const full = classes.filter((cls) => Number(cls.student_count || 0) >= Number(cls.max_students || 0) && Number(cls.max_students || 0) > 0).length;
    const unassigned = classes.filter((cls) => !cls.teacher_id && !isCollegeLevel(cls.level)).length;
    const occupancyRate = capacity > 0 ? Math.round((students / capacity) * 100) : 0;

    return { total, students, capacity, full, unassigned, occupancyRate };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return classes.filter((cls) => {
      const searchable = [
        cls.name,
        cls.level,
        cls.academic_year,
        cls.teacher_name,
      ].filter(Boolean).join(' ').toLowerCase();
      const occupancy = Number(cls.max_students || 0) > 0
        ? (Number(cls.student_count || 0) / Number(cls.max_students || 0)) * 100
        : 0;

      const matchSearch = !q || searchable.includes(q);
      const matchLevel = filters.level === 'all' ? true : String(cls.level || '').trim() === String(filters.level || '').trim();
      const matchYear = filters.academic_year === 'all' ? true : String(cls.academic_year || '').trim() === String(filters.academic_year || '').trim();
      const matchTeacher = filters.teacher_id === 'all' ? true : String(cls.teacher_id || '') === String(filters.teacher_id);
      const matchCapacity = filters.capacity === 'all'
        || (filters.capacity === 'available' && occupancy < 100)
        || (filters.capacity === 'full' && occupancy >= 100)
        || (filters.capacity === 'almost' && occupancy >= 80 && occupancy < 100);

      return matchSearch && matchLevel && matchYear && matchTeacher && matchCapacity;
    });
  }, [classes, searchTerm, filters]);

  const activeFilterCount = [
    searchTerm.trim(),
    filters.level !== 'all',
    filters.academic_year !== 'all',
    filters.teacher_id !== 'all',
    filters.capacity !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ level: 'all', academic_year: 'all', teacher_id: 'all', capacity: 'all' });
  };

  const loadClassData = async (cls) => {
    try {
      return await classAPI.getById(cls.id);
    } catch (error) {
      console.error('Erreur chargement classe:', error);
      return null;
    }
  };

  const fillForm = (cls) => {
    setFormData({
      name: cls.name || '',
      level: cls.level || '',
      academic_year: cls.academic_year || '',
      max_students: cls.max_students || 30,
      teacher_id: cls.teacher_id || '',
      teacher_ids: (cls.teacher_ids || []).map((id) => Number(id)),
      tuition_fee: cls.tuition_fee || 0,
      uniform_fee: cls.uniform_fee || 0,
      uniform_class_fee: cls.uniform_class_fee ?? cls.uniform_fee ?? 0,
      uniform_sport_fee: cls.uniform_sport_fee || 0,
    });
  };

  const handleOpenDialog = async (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      const fullClass = await loadClassData(cls);
      fillForm(fullClass || cls);
    } else {
      setEditingClass(null);
      setFormData(emptyForm);
    }
    setIsDialogOpen(true);
  };

  const handleViewClass = async (cls) => {
    const fullClass = await loadClassData(cls);
    setViewingClass(fullClass || cls);
    setIsViewDialogOpen(true);
  };

  const handleTeacherToggle = (teacherId, checked) => {
    const id = Number(teacherId);
    setFormData((prev) => {
      const ids = [...prev.teacher_ids];
      if (checked && !ids.some((current) => Number(current) === id)) {
        ids.push(id);
      }
      if (!checked) {
        return { ...prev, teacher_ids: ids.filter((current) => Number(current) !== id) };
      }
      return { ...prev, teacher_ids: ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.level || !formData.academic_year) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    const payload = {
      ...formData,
      teacher_id: isCollegeLevel(formData.level) ? '' : formData.teacher_id,
      teacher_ids: isCollegeLevel(formData.level) ? formData.teacher_ids : [],
    };

    try {
      const result = editingClass
        ? await updateClass(editingClass.id, payload)
        : await createClass(payload);

      if (result.success) {
        toast.success(editingClass ? 'Classe modifiée' : 'Classe créée');
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || 'Erreur lors de l’enregistrement');
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleConfirmDelete = async () => {
    const cls = deleteDialog.cls;
    if (!cls) return;

    try {
      const result = await deleteClass(cls.id);
      if (result.success) {
        toast.success('Classe supprimée définitivement');
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
    setDeleteDialog({ open: false, cls: null });
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 pb-8 fade-in">
      {ToastComponent}

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold uppercase text-[#003399] dark:text-blue-200">
              <School className="h-3.5 w-3.5" />
              Organisation scolaire
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Gestion des classes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Suivez les niveaux, les capacités, les enseignants assignés et les frais par classe.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
            <Plus className="h-4 w-4" />
            Nouvelle classe
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={School} label="Classes" value={stats.total} helper={`${filteredClasses.length} affichées`} tone="blue" />
        <StatTile icon={Users} label="Élèves affectés" value={`${formatNumber(stats.students)}/${formatNumber(stats.capacity)}`} helper={`${stats.occupancyRate}% de remplissage`} tone="green" />
        <StatTile icon={ShieldCheck} label="Classes complètes" value={stats.full} helper="Capacité atteinte" tone="red" />
        <StatTile icon={UserCheck} label="Sans titulaire" value={stats.unassigned} helper="Primaire à assigner" tone="orange" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 xl:grid-cols-[1.35fr_0.9fr_0.9fr_1fr_0.9fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher classe, niveau, enseignant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10"
            />
          </div>

          <SelectField value={filters.level} onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value }))}>
            <option value="all">Tous les niveaux</option>
            {levelOptions.map((level) => <option key={level} value={level}>{level}</option>)}
          </SelectField>

          <SelectField value={filters.academic_year} onChange={(e) => setFilters((prev) => ({ ...prev, academic_year: e.target.value }))}>
            <option value="all">Toutes les années</option>
            {academicYearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
          </SelectField>

          <SelectField value={filters.teacher_id} onChange={(e) => setFilters((prev) => ({ ...prev, teacher_id: e.target.value }))}>
            <option value="all">Tous les titulaires</option>
            <option value="">Non assigné</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>{teacher.first_name} {teacher.last_name}</option>
            ))}
          </SelectField>

          <SelectField value={filters.capacity} onChange={(e) => setFilters((prev) => ({ ...prev, capacity: e.target.value }))}>
            <option value="all">Toutes capacités</option>
            <option value="available">Disponible</option>
            <option value="almost">Presque plein</option>
            <option value="full">Complet</option>
          </SelectField>

          <Button type="button" variant="outline" onClick={resetFilters} className="h-10 gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Filter className="h-4 w-4" />
          <span>{activeFilterCount > 0 ? `${activeFilterCount} filtre(s) actif(s)` : 'Aucun filtre actif'}</span>
          <span className="hidden sm:inline">•</span>
          <span>{filteredClasses.length} résultat(s)</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredClasses.length > 0 ? filteredClasses.map((cls) => {
          const studentCount = Number(cls.student_count || 0);
          const maxStudents = Number(cls.max_students || 0);
          const occupancy = maxStudents > 0 ? Math.min(Math.round((studentCount / maxStudents) * 100), 100) : 0;
          const full = maxStudents > 0 && studentCount >= maxStudents;
          const almostFull = occupancy >= 80 && !full;

          return (
            <Card key={cls.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0066CC]/10 text-[#0066CC]">
                        <School className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-950 dark:text-white">{cls.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            <GraduationCap className="h-3 w-3" />
                            {cls.level}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            <Calendar className="h-3 w-3" />
                            {cls.academic_year}
                          </span>
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${full ? 'bg-[#CC0033]/10 text-[#CC0033]' : almostFull ? 'bg-[#FF6600]/10 text-[#FF3300]' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                            {full ? 'Complet' : almostFull ? 'Presque plein' : 'Disponible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewClass(cls)} title="Voir la fiche">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(cls)} title="Modifier">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, cls })} title="Supprimer définitivement">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">Occupation</span>
                      <span className="font-semibold text-slate-950 dark:text-white">{studentCount}/{maxStudents} élèves</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-2 rounded-full ${full ? 'bg-[#CC0033]' : almostFull ? 'bg-[#FF6600]' : 'bg-[#0066CC]'}`} style={{ width: `${occupancy}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <UserCheck className="h-4 w-4 text-[#0066CC]" />
                      <span className="truncate">{cls.teacher_name || (isCollegeLevel(cls.level) ? 'Intervenants' : 'Non assigné')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CircleDollarSign className="h-4 w-4 text-[#0066CC]" />
                      <span className="truncate">{formatCurrency(cls.tuition_fee)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Shirt className="h-4 w-4 text-[#0066CC]" />
                      <span className="truncate">{formatCurrency((Number(cls.uniform_class_fee ?? cls.uniform_fee ?? 0) + Number(cls.uniform_sport_fee || 0)))}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="xl:col-span-2 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
            <Search className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-950 dark:text-white">Aucune classe trouvée</p>
            <p className="mt-1 text-sm text-slate-500">Modifiez les filtres ou ajoutez une nouvelle classe.</p>
          </div>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(920px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Modifier la classe' : 'Nouvelle classe'}</DialogTitle>
              <DialogDescription>
                Configurez le niveau, l’année scolaire, les frais et les enseignants assignés.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-5 lg:grid-cols-[220px_1fr]">
              <aside className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-[#0066CC]/10 text-[#0066CC]">
                  <School className="h-14 w-14" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Dossier classe</p>
                <p className="mt-1 text-xs text-slate-500">
                  Une classe regroupe les élèves, les frais attendus et les enseignants responsables.
                </p>
              </aside>

              <div className="space-y-6">
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#0066CC]" />
                    <h3 className="font-semibold text-slate-950 dark:text-white">Informations générales</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom de la classe *</label>
                      <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: 6ème A" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Niveau *</label>
                      <SelectField
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value, teacher_id: isCollegeLevel(e.target.value) ? '' : formData.teacher_id })}
                        required
                      >
                        <option value="">Sélectionner</option>
                        {LEVEL_OPTIONS.map((level) => <option key={level} value={level}>{level}</option>)}
                      </SelectField>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Année scolaire *</label>
                      <Input value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} placeholder="Ex: 2025-2026" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Capacité maximale</label>
                      <Input type="number" min="1" value={formData.max_students} onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value, 10) || 1 })} />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#FF6600]" />
                    <h3 className="font-semibold text-slate-950 dark:text-white">Frais scolaires</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frais de scolarité (FCFA)</label>
                      <Input type="number" step="0.01" min="0" value={formData.tuition_fee} onChange={(e) => setFormData({ ...formData, tuition_fee: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tenue de classe (FCFA)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.uniform_class_fee}
                        onChange={(e) => setFormData({ ...formData, uniform_class_fee: e.target.value, uniform_fee: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Tenue sportive (FCFA)</label>
                      <Input type="number" step="0.01" min="0" value={formData.uniform_sport_fee} onChange={(e) => setFormData({ ...formData, uniform_sport_fee: e.target.value })} />
                    </div>
                  </div>
                </section>

                {!isCollegeLevel(formData.level) && (
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-[#0066CC]" />
                      <h3 className="font-semibold text-slate-950 dark:text-white">Professeur principal</h3>
                    </div>
                    <SelectField value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}>
                      <option value="">Non assigné</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}{teacher.specialty ? ` - ${teacher.specialty}` : ''}
                        </option>
                      ))}
                    </SelectField>
                  </section>
                )}

                {isCollegeLevel(formData.level) && (
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#0066CC]" />
                        <h3 className="font-semibold text-slate-950 dark:text-white">Professeurs intervenants</h3>
                      </div>
                      <span className="rounded-md bg-[#0066CC]/10 px-2.5 py-1 text-xs font-semibold text-[#0066CC]">
                        {formData.teacher_ids.length} sélectionné(s)
                      </span>
                    </div>
                    <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-800 md:grid-cols-2">
                      {teachers.map((teacher) => {
                        const isSelected = formData.teacher_ids.some((id) => Number(id) === Number(teacher.id));
                        return (
                          <label key={teacher.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition ${isSelected ? 'border-[#0066CC] bg-[#0066CC]/5' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleTeacherToggle(teacher.id, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{teacher.first_name} {teacher.last_name}</span>
                              <span className="block truncate text-xs text-slate-500">{teacher.specialty || 'Spécialité non définie'}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#005bb8]">
                {editingClass ? 'Enregistrer' : 'Créer la classe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(820px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche classe</DialogTitle>
            <DialogDescription>Informations détaillées de la classe sélectionnée.</DialogDescription>
          </DialogHeader>

          {viewingClass && (
            <div className="space-y-5 py-2">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#0066CC]/10 text-[#0066CC]">
                    <School className="h-10 w-10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-bold text-slate-950 dark:text-white">{viewingClass.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">{viewingClass.level}</span>
                      <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">{viewingClass.academic_year}</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setIsViewDialogOpen(false);
                    handleOpenDialog(viewingClass);
                  }} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-950 dark:text-white">Capacité et frais</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem icon={Users} label="Élèves" value={`${formatNumber(viewingClass.student_count)}/${formatNumber(viewingClass.max_students)}`} />
                  <InfoItem icon={Calendar} label="Année scolaire" value={viewingClass.academic_year} />
                  <InfoItem icon={CircleDollarSign} label="Scolarité" value={formatCurrency(viewingClass.tuition_fee)} />
                  <InfoItem icon={Shirt} label="Tenue de classe" value={formatCurrency(viewingClass.uniform_class_fee ?? viewingClass.uniform_fee)} />
                  <InfoItem icon={Shirt} label="Tenue sportive" value={formatCurrency(viewingClass.uniform_sport_fee)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-950 dark:text-white">Encadrement</h3>
                {!isCollegeLevel(viewingClass.level) && (
                  <InfoItem icon={UserCheck} label="Professeur principal" value={viewingClass.teacher_name || 'Non assigné'} />
                )}

                {viewingClass.teachers && viewingClass.teachers.length > 0 ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {viewingClass.teachers.map((teacher) => (
                      <TeacherChip key={teacher.id} teacher={teacher} />
                    ))}
                  </div>
                ) : isCollegeLevel(viewingClass.level) ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-800">
                    Aucun professeur intervenant assigné.
                  </div>
                ) : null}
              </section>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmHardDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, cls: open ? deleteDialog.cls : null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteDialog.cls ? deleteDialog.cls.name : ''}
        warnings={[
          'Tous les élèves de la classe',
          'Paiements des élèves',
          'Notes et bulletins',
          'Tuteurs des élèves si non partagés',
          'Données de la classe',
        ]}
      />
    </div>
  );
}
