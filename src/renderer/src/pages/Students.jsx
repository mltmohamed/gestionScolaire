import React, { useMemo, useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { studentAPI } from '@/services/api';
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
  Briefcase,
  Calendar,
  Eye,
  Filter,
  Hash,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  RotateCcw,
  School,
  Search,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
} from 'lucide-react';
import { ConfirmDeactivateDialog, ConfirmActivateDialog, ConfirmHardDeleteDialog } from '@/components/ui/alert-dialog';

const emptyForm = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  matricule: '',
  phone: '',
  address: '',
  class_id: '',
  photo: null,
  guardian: {
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    job: '',
    relationship: '',
  },
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getAge = (date) => {
  if (!date) return null;
  const birth = new Date(date);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const getStudentName = (student) => `${student.first_name || ''} ${student.last_name || ''}`.trim();

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
        <RotateCcw className="h-5 w-5 animate-spin text-[#0066CC]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des élèves</span>
      </div>
    </div>
  );
}

function SelectField({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </select>
  );
}

function StudentAvatar({ student, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-20 w-20 rounded-xl' : 'h-11 w-11 rounded-lg';
  const iconClass = size === 'lg' ? 'h-10 w-10' : 'h-5 w-5';

  if (student.photo) {
    return <img src={student.photo} alt="" className={`${sizeClass} object-cover shadow-sm`} />;
  }

  const color = student.gender === 'F'
    ? 'bg-[#CC0033]/10 text-[#CC0033]'
    : 'bg-[#0066CC]/10 text-[#0066CC]';

  return (
    <div className={`${sizeClass} flex items-center justify-center ${color}`}>
      <User className={iconClass} />
    </div>
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

export default function Students() {
  const { students, loading, createStudent, updateStudent, deactivateStudent, activateStudent, hardDeleteStudent } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, student: null });
  const [activateDialog, setActivateDialog] = useState({ open: false, student: null });
  const [hardDeleteDialog, setHardDeleteDialog] = useState({ open: false, student: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class_id: 'all',
    status: 'all',
    gender: 'all',
  });
  const [formData, setFormData] = useState(emptyForm);

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((student) => student.status === 'active').length;
    const inactive = students.filter((student) => student.status !== 'active').length;
    const unassigned = students.filter((student) => !student.class_id).length;

    return { total, active, inactive, unassigned };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return students.filter((student) => {
      const searchable = [
        student.first_name,
        student.last_name,
        student.matricule,
        student.phone,
        student.guardian_phone,
        student.class_name,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchSearch = !q || searchable.includes(q);
      const matchClass = filters.class_id === 'all' ? true : String(student.class_id || '') === String(filters.class_id);
      const matchStatus = filters.status === 'all' ? true : String(student.status || '') === String(filters.status);
      const matchGender = filters.gender === 'all' ? true : String(student.gender || '') === String(filters.gender);

      return matchSearch && matchClass && matchStatus && matchGender;
    });
  }, [students, searchTerm, filters]);

  const activeFilterCount = [
    searchTerm.trim(),
    filters.class_id !== 'all',
    filters.status !== 'all',
    filters.gender !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ class_id: 'all', status: 'all', gender: 'all' });
  };

  const updateGuardian = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      guardian: { ...prev.guardian, [field]: value },
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleOpenDialog = async (student = null) => {
    if (student) {
      let fullStudent = student;
      try {
        const fetched = await studentAPI.getById(student.id);
        if (fetched) fullStudent = fetched;
      } catch {
        // Les données de la liste restent suffisantes pour ouvrir le formulaire.
      }

      setEditingStudent(student);
      setFormData({
        first_name: fullStudent.first_name || '',
        last_name: fullStudent.last_name || '',
        date_of_birth: fullStudent.date_of_birth?.split('T')[0] || '',
        gender: fullStudent.gender || '',
        matricule: fullStudent.matricule || '',
        phone: fullStudent.phone || '',
        address: fullStudent.address || '',
        class_id: fullStudent.class_id || '',
        photo: fullStudent.photo || null,
        guardian: {
          first_name: fullStudent.guardian_first_name || '',
          last_name: fullStudent.guardian_last_name || '',
          phone: fullStudent.guardian_phone || '',
          address: fullStudent.guardian_address || '',
          job: fullStudent.guardian_job || '',
          relationship: fullStudent.guardian_relationship || '',
        },
      });
    } else {
      setEditingStudent(null);
      setFormData(emptyForm);
    }

    setIsDialogOpen(true);
  };

  const handleViewStudent = async (student) => {
    try {
      const fetched = await studentAPI.getById(student.id);
      setViewingStudent(fetched || student);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Erreur chargement élève:', error);
      toast.error(error.message || 'Erreur lors du chargement');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        const result = await updateStudent(editingStudent.id, formData);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la modification');
          return;
        }
        toast.success('Élève modifié avec succès');
      } else {
        const result = await createStudent(formData);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la création');
          return;
        }
        toast.success('Élève ajouté avec succès');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleConfirmActivate = async () => {
    const student = activateDialog.student;
    if (!student) return;

    try {
      const result = await activateStudent(student.id);
      if (result.success) {
        toast.success('Élève réactivé avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la réactivation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la réactivation');
    }
    setActivateDialog({ open: false, student: null });
  };

  const handleConfirmDeactivate = async () => {
    const student = deactivateDialog.student;
    if (!student) return;

    try {
      const result = await deactivateStudent(student.id);
      if (result.success) {
        toast.success('Élève désactivé avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la désactivation');
    }
    setDeactivateDialog({ open: false, student: null });
  };

  const handleConfirmHardDelete = async () => {
    const student = hardDeleteDialog.student;
    if (!student) return;

    try {
      const result = await hardDeleteStudent(student.id);
      if (result.success) {
        toast.success('Élève et données associées supprimés définitivement');
      } else {
        toast.error(result.error || 'Erreur lors de la suppression définitive');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression définitive');
    }
    setHardDeleteDialog({ open: false, student: null });
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
              <Users className="h-3.5 w-3.5" />
              Registre élèves
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Gestion des élèves</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Retrouvez rapidement un dossier, contrôlez les affectations et gardez les informations du tuteur à portée de main.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
            <UserPlus className="h-4 w-4" />
            Nouvel élève
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Total élèves" value={stats.total} helper={`${filteredStudents.length} affichés`} tone="blue" />
        <StatTile icon={UserCheck} label="Actifs" value={stats.active} helper="Dossiers en cours" tone="green" />
        <StatTile icon={Power} label="Inactifs" value={stats.inactive} helper="Dossiers conservés" tone="red" />
        <StatTile icon={School} label="Sans classe" value={stats.unassigned} helper="À affecter rapidement" tone="orange" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher nom, matricule, téléphone, classe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10"
            />
          </div>

          <SelectField value={filters.class_id} onChange={(e) => setFilters((prev) => ({ ...prev, class_id: e.target.value }))}>
            <option value="all">Toutes les classes</option>
            <option value="">Non assigné</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.name} - {cls.level}</option>
            ))}
          </SelectField>

          <SelectField value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </SelectField>

          <SelectField value={filters.gender} onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}>
            <option value="all">Tous les genres</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
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
          <span>{filteredStudents.length} résultat(s)</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredStudents.length > 0 ? filteredStudents.map((student) => {
          const age = getAge(student.date_of_birth);
          const isActive = student.status === 'active';

          return (
            <Card key={student.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <StudentAvatar student={student} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-950 dark:text-white">{getStudentName(student)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            <Hash className="h-3 w-3" />
                            {student.matricule || 'Sans matricule'}
                          </span>
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-[#CC0033]/10 text-[#CC0033]'}`}>
                            {isActive ? 'Actif' : 'Inactif'}
                          </span>
                          {!student.class_id && (
                            <span className="inline-flex items-center rounded-md bg-[#FF6600]/10 px-2.5 py-1 text-xs font-semibold text-[#FF3300]">
                              Sans classe
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewStudent(student)} title="Voir la fiche">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(student)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => isActive ? setDeactivateDialog({ open: true, student }) : setActivateDialog({ open: true, student })}
                          title={isActive ? 'Désactiver' : 'Réactiver'}
                        >
                          <Power className={`h-4 w-4 ${isActive ? 'text-[#FF6600]' : 'text-emerald-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setHardDeleteDialog({ open: true, student })} title="Supprimer définitivement">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <School className="h-4 w-4 text-[#0066CC]" />
                        <span className="truncate">{student.class_name || 'Non assigné'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="h-4 w-4 text-[#0066CC]" />
                        <span>{age !== null ? `${age} ans` : 'Âge non défini'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Phone className="h-4 w-4 text-[#0066CC]" />
                        <span className="truncate">{student.guardian_phone || student.phone || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="xl:col-span-2 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
            <Search className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-950 dark:text-white">Aucun élève trouvé</p>
            <p className="mt-1 text-sm text-slate-500">Modifiez les filtres ou ajoutez un nouveau dossier élève.</p>
          </div>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(960px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Modifier l’élève' : 'Nouvel élève'}</DialogTitle>
              <DialogDescription>
                Les champs marqués d’un astérisque sont nécessaires pour créer un dossier complet.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-5 lg:grid-cols-[220px_1fr]">
              <aside className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    {formData.photo ? (
                      <img src={formData.photo} alt="" className="h-28 w-28 rounded-xl object-cover shadow-sm" />
                    ) : (
                      <div className={`flex h-28 w-28 items-center justify-center rounded-xl border border-dashed ${formData.gender === 'F' ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-[#0066CC]/10 text-[#0066CC]'}`}>
                        <UserCircle className="h-14 w-14" />
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-[#0066CC] text-white shadow-md transition hover:bg-[#005bb8]">
                      <Plus className="h-4 w-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Photo du dossier</p>
                  <p className="mt-1 text-xs text-slate-500">Format image, affichée dans les listes et fiches.</p>
                </div>
              </aside>

              <div className="space-y-6">
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0066CC]" />
                    <h3 className="font-semibold text-slate-950 dark:text-white">Identité</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prénom *</label>
                      <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom *</label>
                      <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date de naissance *</label>
                      <Input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Genre</label>
                      <SelectField value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </SelectField>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Matricule *</label>
                      <Input value={formData.matricule} onChange={(e) => setFormData({ ...formData, matricule: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Classe</label>
                      <SelectField value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}>
                        <option value="">Non assigné</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name} - {cls.level}</option>
                        ))}
                      </SelectField>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Téléphone élève</label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adresse élève</label>
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#FF6600]" />
                    <h3 className="font-semibold text-slate-950 dark:text-white">Tuteur obligatoire</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prénom tuteur *</label>
                      <Input value={formData.guardian.first_name} onChange={(e) => updateGuardian('first_name', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nom tuteur *</label>
                      <Input value={formData.guardian.last_name} onChange={(e) => updateGuardian('last_name', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Téléphone tuteur *</label>
                      <Input value={formData.guardian.phone} onChange={(e) => updateGuardian('phone', e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lien</label>
                      <Input value={formData.guardian.relationship} onChange={(e) => updateGuardian('relationship', e.target.value)} placeholder="Ex: Père, Mère" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Profession</label>
                      <Input value={formData.guardian.job} onChange={(e) => updateGuardian('job', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Adresse tuteur</label>
                      <Input value={formData.guardian.address} onChange={(e) => updateGuardian('address', e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#005bb8]">
                {editingStudent ? 'Enregistrer' : 'Créer le dossier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(820px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche élève</DialogTitle>
            <DialogDescription>Informations détaillées du dossier sélectionné.</DialogDescription>
          </DialogHeader>

          {viewingStudent && (
            <div className="space-y-5 py-2">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <StudentAvatar student={viewingStudent} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-bold text-slate-950 dark:text-white">{getStudentName(viewingStudent)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                        <Hash className="h-3 w-3" />
                        {viewingStudent.matricule || '-'}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${viewingStudent.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-[#CC0033]/10 text-[#CC0033]'}`}>
                        {viewingStudent.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setIsViewDialogOpen(false);
                    handleOpenDialog(viewingStudent);
                  }} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-950 dark:text-white">Informations élève</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem icon={Calendar} label="Naissance" value={`${formatDate(viewingStudent.date_of_birth)}${getAge(viewingStudent.date_of_birth) !== null ? ` · ${getAge(viewingStudent.date_of_birth)} ans` : ''}`} />
                  <InfoItem icon={School} label="Classe" value={viewingStudent.class_name || 'Non assigné'} />
                  <InfoItem icon={Phone} label="Téléphone" value={viewingStudent.phone} />
                  <InfoItem icon={MapPin} label="Adresse" value={viewingStudent.address} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-950 dark:text-white">Tuteur</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem icon={Shield} label="Nom complet" value={`${viewingStudent.guardian_first_name || '-'} ${viewingStudent.guardian_last_name || ''}`.trim()} />
                  <InfoItem icon={Phone} label="Téléphone" value={viewingStudent.guardian_phone} />
                  <InfoItem icon={Users} label="Lien" value={viewingStudent.guardian_relationship} />
                  <InfoItem icon={Briefcase} label="Profession" value={viewingStudent.guardian_job} />
                  <div className="sm:col-span-2">
                    <InfoItem icon={MapPin} label="Adresse" value={viewingStudent.guardian_address} />
                  </div>
                </div>
              </section>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeactivateDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => setDeactivateDialog({ open, student: open ? deactivateDialog.student : null })}
        onConfirm={handleConfirmDeactivate}
        itemName={deactivateDialog.student ? getStudentName(deactivateDialog.student) : ''}
      />

      <ConfirmActivateDialog
        open={activateDialog.open}
        onOpenChange={(open) => setActivateDialog({ open, student: open ? activateDialog.student : null })}
        onConfirm={handleConfirmActivate}
        itemName={activateDialog.student ? getStudentName(activateDialog.student) : ''}
      />

      <ConfirmHardDeleteDialog
        open={hardDeleteDialog.open}
        onOpenChange={(open) => setHardDeleteDialog({ open, student: open ? hardDeleteDialog.student : null })}
        onConfirm={handleConfirmHardDelete}
        itemName={hardDeleteDialog.student ? getStudentName(hardDeleteDialog.student) : ''}
        warnings={[
          'Paiements de scolarité',
          'Notes et bulletins',
          'Historique complet',
          'Toutes les données associées',
        ]}
      />
    </div>
  );
}
