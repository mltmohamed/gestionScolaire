import React, { useState } from 'react';
import { useTeachers } from '@/hooks/useTeachers';
import { useToast } from '@/hooks/useToast.jsx';
import { teacherAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, User, UserCircle, Eye } from 'lucide-react';

export default function Teachers() {
  const { teachers, loading, createTeacher, updateTeacher, deleteTeacher } = useTeachers();
  const { toast, ToastComponent } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    specialty: 'all',
    status: 'all',
    gender: 'all',
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    specialty: '',
    gender: '',
    photo: null,
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const getAvatar = (teacher) => {
    if (teacher.photo) {
      return <img src={teacher.photo} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-sm" />;
    }
    
    // Avatar par défaut selon le sexe
    const color = teacher.gender === 'F' ? 'text-[#CC0033] bg-[#CC0033]/10' : 'text-[#0066CC] bg-[#0066CC]/10';
    return (
      <div className={`h-10 w-10 rounded-full flex items-center justify-center border border-white/10 ${color}`}>
        <User className="h-6 w-6" />
      </div>
    );
  };

  const specialtyOptions = React.useMemo(() => {
    const values = new Set();
    for (const t of teachers) {
      const s = String(t.specialty || '').trim();
      if (s) values.add(s);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [teachers]);

  const filteredTeachers = teachers.filter((teacher) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch = !q
      ? true
      : (teacher.first_name || '').toLowerCase().includes(q) || (teacher.last_name || '').toLowerCase().includes(q);

    const matchSpecialty =
      filters.specialty === 'all'
        ? true
        : String(teacher.specialty || '').trim() === String(filters.specialty || '').trim();
    const matchStatus = filters.status === 'all' ? true : String(teacher.status || '') === String(filters.status);
    const matchGender = filters.gender === 'all' ? true : String(teacher.gender || '') === String(filters.gender);

    return matchSearch && matchSpecialty && matchStatus && matchGender;
  });

  const handleOpenDialog = (teacher = null) => {
    console.log('Ouverture dialog professeur:', teacher ? 'Modification' : 'Ajout');
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
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        specialty: '',
        gender: '',
        photo: null,
      });
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
    console.log('Soumission formulaire professeur:', formData);
    try {
      if (editingTeacher) {
        const result = await updateTeacher(editingTeacher.id, formData);
        console.log('Résultat modification:', result);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la modification');
          return;
        }
        toast.success('Professeur modifié avec succès !');
      } else {
        const result = await createTeacher(formData);
        console.log('Résultat création:', result);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la création');
          return;
        }
        toast.success('Professeur ajouté avec succès !');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce professeur ?')) {
      try {
        await deleteTeacher(id);
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Chargement...</p>
    </div>;
  }

  return (
    <div className="space-y-6 fade-in">
      {ToastComponent}
      
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Professeurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les enseignants et leurs spécialités
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un professeur
        </Button>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher un professeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={filters.specialty}
                onChange={(e) => setFilters((prev) => ({ ...prev, specialty: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les spécialités</option>
                {specialtyOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>

              <select
                value={filters.gender}
                onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tous les sexes</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ specialty: 'all', status: 'all', gender: 'all' });
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des professeurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des professeurs ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Date d'embauche</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{getAvatar(teacher)}</TableCell>
                    <TableCell className="font-medium">
                      {teacher.first_name} {teacher.last_name}
                    </TableCell>
                    <TableCell>{teacher.email || '-'}</TableCell>
                    <TableCell>{teacher.phone || '-'}</TableCell>
                    <TableCell>{teacher.specialty || '-'}</TableCell>
                    <TableCell>
                      {teacher.hire_date 
                        ? new Date(teacher.hire_date).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        teacher.status === 'active'
                          ? 'bg-[#0066CC]/10 text-[#003399] dark:bg-[#0066CC]/20 dark:text-white'
                          : 'bg-[#CC0033]/10 text-[#CC0033] dark:bg-[#CC0033]/20 dark:text-white'
                      }`}>
                        {teacher.status === 'active' ? '● Actif' : '● Inactif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTeacher(teacher)}
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(teacher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun professeur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? 'Modifier le professeur' : 'Ajouter un professeur'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du professeur ci-dessous.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative group">
                  {formData.photo ? (
                    <img 
                      src={formData.photo} 
                      alt="Aperçu" 
                      className="h-24 w-24 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center border-2 border-dashed border-primary/20 ${formData.gender === 'F' ? 'bg-[#CC0033]/10' : 'bg-[#0066CC]/10'}`}>
                      <UserCircle className={`h-12 w-12 ${formData.gender === 'F' ? 'text-[#CC0033]' : 'text-[#0066CC]'}`} />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Plus className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Cliquez sur le bouton + pour ajouter une photo</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Prénom *</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Spécialité</label>
                <Input
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Ex: Mathématiques, Physique, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Genre</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingTeacher ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche professeur</DialogTitle>
            <DialogDescription>
              Informations détaillées du professeur.
            </DialogDescription>
          </DialogHeader>

          {viewingTeacher && (
            <div className="py-2 space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-[#0066CC]/10 via-white to-[#FF6600]/10 dark:from-[#0066CC]/20 dark:via-black dark:to-[#FF6600]/20 p-5">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-16 w-16">
                    {viewingTeacher.photo ? (
                      <img src={viewingTeacher.photo} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover border border-white/30 shadow-sm" />
                    ) : (
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border border-white/20 ${viewingTeacher.gender === 'F' ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-[#0066CC]/10 text-[#0066CC]'}`}>
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xl font-extrabold tracking-tight text-black dark:text-white truncate">
                      {viewingTeacher.first_name} {viewingTeacher.last_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                        viewingTeacher.status === 'active'
                          ? 'bg-[#0066CC]/10 text-[#003399] border-[#0066CC]/20 dark:text-white'
                          : 'bg-[#CC0033]/10 text-[#CC0033] border-[#CC0033]/20 dark:text-white'
                      }`}>
                        {viewingTeacher.status === 'active' ? '● Actif' : '● Inactif'}
                      </span>
                      {viewingTeacher.specialty && (
                        <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-black dark:text-white border border-black/10 dark:border-white/10">
                          {viewingTeacher.specialty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-black dark:text-white">Informations</p>
                  <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#0066CC] to-[#003399]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                    <p className="text-[11px] text-muted-foreground">Email</p>
                    <p className="text-sm font-semibold">{viewingTeacher.email || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                    <p className="text-[11px] text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-semibold">{viewingTeacher.phone || '-'}</p>
                  </div>
                  <div className="sm:col-span-2 rounded-xl border border-black/10 dark:border-white/10 p-3">
                    <p className="text-[11px] text-muted-foreground">Adresse</p>
                    <p className="text-sm font-semibold">{viewingTeacher.address || '-'}</p>
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
    </div>
  );
}
