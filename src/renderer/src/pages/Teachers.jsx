import React, { useMemo, useState } from 'react';
import { useTeachers } from '@/hooks/useTeachers';
import { useToast } from '@/hooks/useToast.jsx';
import { teacherAPI } from '@/services/api';
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
  Briefcase,
  Calendar,
  Eye,
  Filter,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
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
  email: '',
  phone: '',
  address: '',
  specialty: '',
  gender: '',
  photo: null,
  salary: 0,
  status: 'active',
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getTeacherName = (teacher) => `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
        <RotateCcw className="h-5 w-5 animate-spin text-[#0066CC]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des professeurs</span>
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

function TeacherAvatar({ teacher, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-20 w-20 rounded-xl' : 'h-11 w-11 rounded-lg';
  const iconClass = size === 'lg' ? 'h-10 w-10' : 'h-5 w-5';

  if (teacher.photo) {
    return <img src={teacher.photo} alt="" className={`${sizeClass} object-cover shadow-sm`} />;
  }

  const color = teacher.gender === 'F'
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

export default function Teachers() {
  const {
    teachers,
    loading,
    createTeacher,
    updateTeacher,
    deactivateTeacher,
    activateTeacher,
    hardDeleteTeacher,
  } = useTeachers();
  const { toast, ToastComponent } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [deactivateDialog, setDeactivateDialog] = useState({ open: false, teacher: null });
  const [activateDialog, setActivateDialog] = useState({ open: false, teacher: null });
  const [hardDeleteDialog, setHardDeleteDialog] = useState({ open: false, teacher: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    specialty: 'all',
    status: 'all',
    gender: 'all',
  });
  const [formData, setFormData] = useState(emptyForm);

  const specialtyOptions = useMemo(() => {
    const values = new Set();
    for (const teacher of teachers) {
      const specialty = String(teacher.specialty || '').trim();
      if (specialty) values.add(specialty);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [teachers]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter((teacher) => teacher.status === 'active').length;
    const inactive = teachers.filter((teacher) => teacher.status !== 'active').length;
    const payroll = teachers
      .filter((teacher) => teacher.status === 'active')
      .reduce((sum, teacher) => sum + Number(teacher.salary || 0), 0);

    return { total, active, inactive, payroll };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return teachers.filter((teacher) => {
      const searchable = [
        teacher.first_name,
        teacher.last_name,
        teacher.email,
        teacher.phone,
        teacher.specialty,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchSearch = !q || searchable.includes(q);
      const matchSpecialty = filters.specialty === 'all'
        ? true
        : String(teacher.specialty || '').trim() === String(filters.specialty || '').trim();
      const matchStatus = filters.status === 'all' ? true : String(teacher.status || '') === String(filters.status);
      const matchGender = filters.gender === 'all' ? true : String(teacher.gender || '') === String(filters.gender);

      return matchSearch && matchSpecialty && matchStatus && matchGender;
    });
  }, [teachers, searchTerm, filters]);

  const activeFilterCount = [
    searchTerm.trim(),
    filters.specialty !== 'all',
    filters.status !== 'all',
    filters.gender !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ specialty: 'all', status: 'all', gender: 'all' });
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

  const handleOpenDialog = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        first_name: teacher.first_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        address: teacher.address || '',
        specialty: teacher.specialty || '',
        gender: teacher.gender || '',
        photo: teacher.photo || null,
        salary: teacher.salary || 0,
        status: teacher.status || 'active',
      });
    } else {
      setEditingTeacher(null);
      setFormData(emptyForm);
    }
    setIsDialogOpen(true);
  };

  const handleViewTeacher = async (teacher) => {
    try {
      const fetched = await teacherAPI.getById(teacher.id);
      setViewingTeacher(fetched || teacher);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Erreur chargement professeur:', error);
      toast.error(error.message || 'Erreur lors du chargement');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        const result = await updateTeacher(editingTeacher.id, formData);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la modification');
          return;
        }
        toast.success('Professeur modifié avec succès');
      } else {
        const result = await createTeacher(formData);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la création');
          return;
        }
        toast.success('Professeur ajouté avec succès');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleConfirmActivate = async () => {
    const teacher = activateDialog.teacher;
    if (!teacher) return;

    try {
      const result = await activateTeacher(teacher.id);
      if (result.success) {
        toast.success('Professeur réactivé avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la réactivation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la réactivation');
    }
    setActivateDialog({ open: false, teacher: null });
  };

  const handleConfirmDeactivate = async () => {
    const teacher = deactivateDialog.teacher;
    if (!teacher) return;

    try {
      const result = await deactivateTeacher(teacher.id);
      if (result.success) {
        toast.success('Professeur désactivé avec succès');
      } else {
        toast.error(result.error || 'Erreur lors de la désactivation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la désactivation');
    }
    setDeactivateDialog({ open: false, teacher: null });
  };

  const handleConfirmHardDelete = async () => {
    const teacher = hardDeleteDialog.teacher;
    if (!teacher) return;

    try {
      const result = await hardDeleteTeacher(teacher.id);
      if (result.success) {
        toast.success('Professeur et données associées supprimés définitivement');
      } else {
        toast.error(result.error || 'Erreur lors de la suppression définitive');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression définitive');
    }
    setHardDeleteDialog({ open: false, teacher: null });
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
              <ShieldCheck className="h-3.5 w-3.5" />
              Équipe pédagogique
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Gestion des professeurs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Suivez les enseignants, leurs spécialités, leurs contacts et la masse salariale active.
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
            <UserPlus className="h-4 w-4" />
            Nouveau professeur
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Total professeurs" value={stats.total} helper={`${filteredTeachers.length} affichés`} tone="blue" />
        <StatTile icon={UserCheck} label="Actifs" value={stats.active} helper="En service" tone="green" />
        <StatTile icon={Power} label="Inactifs" value={stats.inactive} helper="Dossiers conservés" tone="red" />
        <StatTile icon={Banknote} label="Masse salariale" value={formatCurrency(stats.payroll)} helper="Professeurs actifs" tone="orange" />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Rechercher nom, email, téléphone, spécialité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10"
            />
          </div>

          <SelectField value={filters.specialty} onChange={(e) => setFilters((prev) => ({ ...prev, specialty: e.target.value }))}>
            <option value="all">Toutes les spécialités</option>
            {specialtyOptions.map((specialty) => (
              <option key={specialty} value={specialty}>{specialty}</option>
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
          <span>{filteredTeachers.length} résultat(s)</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => {
          const isActive = teacher.status === 'active';

          return (
            <Card key={teacher.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <TeacherAvatar teacher={teacher} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold text-slate-950 dark:text-white">{getTeacherName(teacher)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            <Briefcase className="h-3 w-3" />
                            {teacher.specialty || 'Spécialité non définie'}
                          </span>
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-[#CC0033]/10 text-[#CC0033]'}`}>
                            {isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewTeacher(teacher)} title="Voir la fiche">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(teacher)} title="Modifier">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => isActive ? setDeactivateDialog({ open: true, teacher }) : setActivateDialog({ open: true, teacher })}
                          title={isActive ? 'Désactiver' : 'Réactiver'}
                        >
                          <Power className={`h-4 w-4 ${isActive ? 'text-[#FF6600]' : 'text-emerald-600'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setHardDeleteDialog({ open: true, teacher })} title="Supprimer définitivement">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Phone className="h-4 w-4 text-[#0066CC]" />
                        <span className="truncate">{teacher.phone || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Mail className="h-4 w-4 text-[#0066CC]" />
                        <span className="truncate">{teacher.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Banknote className="h-4 w-4 text-[#0066CC]" />
                        <span className="truncate">{formatCurrency(teacher.salary)}</span>
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
            <p className="mt-3 font-semibold text-slate-950 dark:text-white">Aucun professeur trouvé</p>
            <p className="mt-1 text-sm text-slate-500">Modifiez les filtres ou ajoutez un nouveau dossier professeur.</p>
          </div>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(920px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingTeacher ? 'Modifier le professeur' : 'Nouveau professeur'}</DialogTitle>
              <DialogDescription>
                Ajoutez les coordonnées, la spécialité et les informations salariales de l’enseignant.
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
                  <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Photo du professeur</p>
                  <p className="mt-1 text-xs text-slate-500">Utilisée dans les listes et fiches.</p>
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
                      <label className="text-sm font-medium">Genre</label>
                      <SelectField value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="">Sélectionner</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </SelectField>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Statut</label>
                      <SelectField value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                      </SelectField>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[#FF6600]" />
                    <h3 className="font-semibold text-slate-950 dark:text-white">Coordonnées et poste</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Téléphone</label>
                      <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Spécialité</label>
                      <Input value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} placeholder="Ex: Mathématiques, Physique" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Salaire mensuel (FCFA)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium">Adresse</label>
                      <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" className="bg-[#0066CC] hover:bg-[#005bb8]">
                {editingTeacher ? 'Enregistrer' : 'Créer le dossier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(820px,calc(100vw-2rem))] max-w-none overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche professeur</DialogTitle>
            <DialogDescription>Informations détaillées du dossier sélectionné.</DialogDescription>
          </DialogHeader>

          {viewingTeacher && (
            <div className="space-y-5 py-2">
              <section className="rounded-lg border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <TeacherAvatar teacher={viewingTeacher} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-bold text-slate-950 dark:text-white">{getTeacherName(viewingTeacher)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-950 dark:text-slate-200">
                        <Briefcase className="h-3 w-3" />
                        {viewingTeacher.specialty || 'Spécialité non définie'}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${viewingTeacher.status === 'active' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-[#CC0033]/10 text-[#CC0033]'}`}>
                        {viewingTeacher.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => {
                    setIsViewDialogOpen(false);
                    handleOpenDialog(viewingTeacher);
                  }} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-950 dark:text-white">Informations professionnelles</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem icon={Briefcase} label="Spécialité" value={viewingTeacher.specialty} />
                  <InfoItem icon={Banknote} label="Salaire mensuel" value={formatCurrency(viewingTeacher.salary)} />
                  <InfoItem icon={Calendar} label="Date d'embauche" value={formatDate(viewingTeacher.hire_date)} />
                  <InfoItem icon={ShieldCheck} label="Statut" value={viewingTeacher.status === 'active' ? 'Actif' : 'Inactif'} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-950 dark:text-white">Contact</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem icon={Mail} label="Email" value={viewingTeacher.email} />
                  <InfoItem icon={Phone} label="Téléphone" value={viewingTeacher.phone} />
                  <div className="sm:col-span-2">
                    <InfoItem icon={MapPin} label="Adresse" value={viewingTeacher.address} />
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
        onOpenChange={(open) => setDeactivateDialog({ open, teacher: open ? deactivateDialog.teacher : null })}
        onConfirm={handleConfirmDeactivate}
        itemName={deactivateDialog.teacher ? getTeacherName(deactivateDialog.teacher) : ''}
      />

      <ConfirmActivateDialog
        open={activateDialog.open}
        onOpenChange={(open) => setActivateDialog({ open, teacher: open ? activateDialog.teacher : null })}
        onConfirm={handleConfirmActivate}
        itemName={activateDialog.teacher ? getTeacherName(activateDialog.teacher) : ''}
      />

      <ConfirmHardDeleteDialog
        open={hardDeleteDialog.open}
        onOpenChange={(open) => setHardDeleteDialog({ open, teacher: open ? hardDeleteDialog.teacher : null })}
        onConfirm={handleConfirmHardDelete}
        itemName={hardDeleteDialog.teacher ? getTeacherName(hardDeleteDialog.teacher) : ''}
        warnings={[
          'Paiements de salaire',
          'Assignations aux classes',
          'Historique complet',
          'Toutes les données associées',
        ]}
      />
    </div>
  );
}
