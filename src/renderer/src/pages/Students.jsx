import React, { useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { studentAPI } from '@/services/api';
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
import { Plus, Search, Pencil, User, UserCircle, Eye, Power, AlertTriangle } from 'lucide-react';
import { ConfirmDeactivateDialog, ConfirmActivateDialog, ConfirmHardDeleteDialog } from '@/components/ui/alert-dialog';

export default function Students() {
  const { students, loading, createStudent, updateStudent, deleteStudent, deactivateStudent, activateStudent, hardDeleteStudent } = useStudents();
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
  const [formData, setFormData] = useState({
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

  const getAvatar = (student) => {
    if (student.photo) {
      return <img src={student.photo} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-sm" />;
    }
    
    // Avatar par défaut selon le sexe
    const color = student.gender === 'F' ? 'text-[#CC0033] bg-[#CC0033]/10' : 'text-[#0066CC] bg-[#0066CC]/10';
    return (
      <div className={`h-10 w-10 rounded-full flex items-center justify-center border border-white/10 ${color}`}>
        <User className="h-6 w-6" />
      </div>
    );
  };

  const filteredStudents = students.filter((student) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch = !q
      ? true
      : (student.first_name || '').toLowerCase().includes(q) || (student.last_name || '').toLowerCase().includes(q);

    const matchClass =
      filters.class_id === 'all' ? true : String(student.class_id || '') === String(filters.class_id);
    const matchStatus = filters.status === 'all' ? true : String(student.status || '') === String(filters.status);
    const matchGender = filters.gender === 'all' ? true : String(student.gender || '') === String(filters.gender);

    return matchSearch && matchClass && matchStatus && matchGender;
  });

  const handleOpenDialog = async (student = null) => {
    if (student) {
      let fullStudent = student;
      try {
        const fetched = await studentAPI.getById(student.id);
        if (fetched) {
          fullStudent = fetched;
        }
      } catch {
        // ignorer, fallback sur les données de la liste
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
      setFormData({
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
      });
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
        toast.success('Élève modifié avec succès !');
      } else {
        const result = await createStudent(formData);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la création');
          return;
        }
        toast.success('Élève ajouté avec succès !');
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ? Les données seront masquées mais conservées.')) {
      try {
        const result = await deleteStudent(id);
        if (result.success) {
          toast.success('Élève supprimé (données conservées)');
        } else {
          toast.error(result.error || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleDeactivateClick = (student) => {
    setDeactivateDialog({ open: true, student });
  };

  const handleActivateClick = (student) => {
    setActivateDialog({ open: true, student });
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

  const handleHardDeleteClick = (student) => {
    setHardDeleteDialog({ open: true, student });
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
          <h1 className="text-3xl font-bold">Gestion des Élèves</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les inscriptions et informations des élèves
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un élève
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
                placeholder="Rechercher un élève..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={filters.class_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, class_id: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les classes</option>
                <option value="">Non assigné</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.level}
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
                  setFilters({ class_id: 'all', status: 'all', gender: 'all' });
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des élèves */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des élèves ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Date de naissance</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{getAvatar(student)}</TableCell>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>
                      {student.date_of_birth 
                        ? new Date(student.date_of_birth).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell>{student.matricule || '-'}</TableCell>
                    <TableCell>{student.phone || '-'}</TableCell>
                    <TableCell>{student.class_name || 'Non assigné'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-[#0066CC]/10 text-[#003399] dark:bg-[#0066CC]/20 dark:text-white'
                          : 'bg-[#CC0033]/10 text-[#CC0033] dark:bg-[#CC0033]/20 dark:text-white'
                      }`}>
                        {student.status === 'active' ? '● Actif' : '● Inactif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewStudent(student)}
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(student)}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {student.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeactivateClick(student)}
                            title="Désactiver (conserver les données)"
                          >
                            <Power className="h-4 w-4 text-orange-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleActivateClick(student)}
                            title="Réactiver"
                          >
                            <Power className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleHardDeleteClick(student)}
                          title="⚠️ Supprimer définitivement (toutes les données)"
                        >
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun élève trouvé
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
                {editingStudent ? 'Modifier l\'élève' : 'Ajouter un élève'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations de l'élève ci-dessous.
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date de naissance *</label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    required
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Matricule *</label>
                <Input
                  value={formData.matricule}
                  onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                  required
                />
              </div>

              <div className="rounded-lg border border-input p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Informations du tuteur *</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prénom tuteur *</label>
                    <Input
                      value={formData.guardian.first_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, first_name: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nom tuteur *</label>
                    <Input
                      value={formData.guardian.last_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, last_name: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Téléphone tuteur *</label>
                    <Input
                      value={formData.guardian.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, phone: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lien</label>
                    <Input
                      value={formData.guardian.relationship}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardian: { ...formData.guardian, relationship: e.target.value },
                        })
                      }
                      placeholder="Ex: Père, Mère"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Adresse tuteur</label>
                  <Input
                    value={formData.guardian.address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, address: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Profession</label>
                  <Input
                    value={formData.guardian.job}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        guardian: { ...formData.guardian, job: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone de l'élève</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adresse de l'élève</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Classe</label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Non assigné</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingStudent ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche élève</DialogTitle>
            <DialogDescription>
              Informations détaillées de l'élève.
            </DialogDescription>
          </DialogHeader>

          {viewingStudent && (
            <div className="py-2 space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-[#0066CC]/10 via-white to-[#FF6600]/10 dark:from-[#0066CC]/20 dark:via-black dark:to-[#FF6600]/20 p-5">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-16 w-16">
                    {viewingStudent.photo ? (
                      <img src={viewingStudent.photo} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover border border-white/30 shadow-sm" />
                    ) : (
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border border-white/20 ${viewingStudent.gender === 'F' ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-[#0066CC]/10 text-[#0066CC]'}`}>
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xl font-extrabold tracking-tight text-black dark:text-white truncate">
                      {viewingStudent.first_name} {viewingStudent.last_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-black dark:text-white border border-black/10 dark:border-white/10">
                        Matricule: {viewingStudent.matricule || '-'}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                        viewingStudent.status === 'active'
                          ? 'bg-[#0066CC]/10 text-[#003399] border-[#0066CC]/20 dark:text-white'
                          : 'bg-[#CC0033]/10 text-[#CC0033] border-[#CC0033]/20 dark:text-white'
                      }`}>
                        {viewingStudent.status === 'active' ? '● Actif' : '● Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-black dark:text-white">Informations élève</p>
                    <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#0066CC] to-[#003399]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Date de naissance</p>
                      <p className="text-sm font-semibold">
                        {viewingStudent.date_of_birth ? new Date(viewingStudent.date_of_birth).toLocaleDateString('fr-FR') : '-'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Classe</p>
                      <p className="text-sm font-semibold">{viewingStudent.class_name || 'Non assigné'}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Téléphone</p>
                      <p className="text-sm font-semibold">{viewingStudent.phone || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Adresse</p>
                      <p className="text-sm font-semibold">{viewingStudent.address || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-black dark:text-white">Informations du tuteur</p>
                    <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#FF6600] to-[#FF3300]" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Nom complet</p>
                      <p className="text-sm font-semibold">{viewingStudent.guardian_first_name || '-'} {viewingStudent.guardian_last_name || ''}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Téléphone</p>
                      <p className="text-sm font-semibold">{viewingStudent.guardian_phone || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Lien</p>
                      <p className="text-sm font-semibold">{viewingStudent.guardian_relationship || '-'}</p>
                    </div>
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Profession</p>
                      <p className="text-sm font-semibold">{viewingStudent.guardian_job || '-'}</p>
                    </div>
                    <div className="sm:col-span-2 rounded-xl border border-black/10 dark:border-white/10 p-3">
                      <p className="text-[11px] text-muted-foreground">Adresse</p>
                      <p className="text-sm font-semibold">{viewingStudent.guardian_address || '-'}</p>
                    </div>
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

      {/* Dialog de confirmation de désactivation */}
      <ConfirmDeactivateDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => setDeactivateDialog({ open, student: open ? deactivateDialog.student : null })}
        onConfirm={handleConfirmDeactivate}
        itemName={deactivateDialog.student ? `${deactivateDialog.student.first_name} ${deactivateDialog.student.last_name}` : ''}
      />

      {/* Dialog de confirmation de réactivation */}
      <ConfirmActivateDialog
        open={activateDialog.open}
        onOpenChange={(open) => setActivateDialog({ open, student: open ? activateDialog.student : null })}
        onConfirm={handleConfirmActivate}
        itemName={activateDialog.student ? `${activateDialog.student.first_name} ${activateDialog.student.last_name}` : ''}
      />

      {/* Dialog de confirmation de suppression définitive */}
      <ConfirmHardDeleteDialog
        open={hardDeleteDialog.open}
        onOpenChange={(open) => setHardDeleteDialog({ open, student: open ? hardDeleteDialog.student : null })}
        onConfirm={handleConfirmHardDelete}
        itemName={hardDeleteDialog.student ? `${hardDeleteDialog.student.first_name} ${hardDeleteDialog.student.last_name}` : ''}
        warnings={[
          'Paiements de scolarité',
          'Notes et bulletins',
          'Historique complet',
          'Toutes les données associées'
        ]}
      />
    </div>
  );
}
