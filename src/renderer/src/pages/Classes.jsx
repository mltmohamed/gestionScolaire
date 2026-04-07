import React, { useState } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { useTeachers } from '@/hooks/useTeachers';
import { useToast } from '@/hooks/useToast.jsx';
import { classAPI } from '@/services/api';
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
import { Plus, Search, Pencil, Trash2, Users, Eye, School, AlertTriangle } from 'lucide-react';
import { ConfirmHardDeleteDialog } from '@/components/ui/alert-dialog';

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
  });
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    academic_year: '2025-2026',
    max_students: 30,
    teacher_id: '',
    teacher_ids: [],
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, cls: null });

  const levelOptions = React.useMemo(() => {
    const values = new Set();
    for (const c of classes) {
      const v = String(c.level || '').trim();
      if (v) values.add(v);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [classes]);

  const academicYearOptions = React.useMemo(() => {
    const values = new Set();
    for (const c of classes) {
      const v = String(c.academic_year || '').trim();
      if (v) values.add(v);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [classes]);

  const filteredClasses = classes.filter((cls) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchSearch = !q
      ? true
      : (cls.name || '').toLowerCase().includes(q) || (cls.level || '').toLowerCase().includes(q);

    const matchLevel = filters.level === 'all' ? true : String(cls.level || '').trim() === String(filters.level || '').trim();
    const matchYear =
      filters.academic_year === 'all'
        ? true
        : String(cls.academic_year || '').trim() === String(filters.academic_year || '').trim();
    const matchTeacher =
      filters.teacher_id === 'all'
        ? true
        : String(cls.teacher_id || '') === String(filters.teacher_id);

    return matchSearch && matchLevel && matchYear && matchTeacher;
  });

  const handleOpenDialog = async (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      try {
        const result = await classAPI.getById(cls.id);
        if (result && result.success) {
          const d = result.data;
          setFormData({
            name: d.name || '',
            level: d.level || '',
            academic_year: d.academic_year || '',
            max_students: d.max_students || 30,
            teacher_id: d.teacher_id || '',
            teacher_ids: d.teacher_ids || [],
          });
        } else {
          const d = result || cls;
          setFormData({
            name: d.name || '',
            level: d.level || '',
            academic_year: d.academic_year || '',
            max_students: d.max_students || 30,
            teacher_id: d.teacher_id || '',
            teacher_ids: d.teacher_ids || [],
          });
        }
      } catch (error) {
        console.error('Erreur chargement classe:', error);
        setFormData({
          name: cls.name || '',
          level: cls.level || '',
          academic_year: cls.academic_year || '',
          max_students: cls.max_students || 30,
          teacher_id: cls.teacher_id || '',
          teacher_ids: [],
        });
      }
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        level: '',
        academic_year: '2025-2026',
        max_students: 30,
        teacher_id: '',
        teacher_ids: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleViewClass = async (cls) => {
    try {
      const result = await classAPI.getById(cls.id);
      if (result.success) {
        setViewingClass(result.data);
      } else {
        setViewingClass(cls);
      }
      setIsViewDialogOpen(true);
    } catch (error) {
      setViewingClass(cls);
      setIsViewDialogOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.level || !formData.academic_year) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      const result = editingClass
        ? await updateClass(editingClass.id, formData)
        : await createClass(formData);

      if (result.success) {
        toast.success(editingClass ? 'Classe modifiée' : 'Classe créée');
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      toast.error(error.message || 'Une erreur est survenue');
    }
  };

  const handleDeleteClick = (cls) => {
    setDeleteDialog({ open: true, cls });
  };

  const handleConfirmDelete = async () => {
    const cls = deleteDialog.cls;
    if (!cls) return;

    try {
      const result = await deleteClass(cls.id);
      if (result.success) {
        toast.success('Classe et toutes les données associées supprimées définitivement');
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
          <h1 className="text-3xl font-bold">Gestion des Classes</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les classes et assignez les professeurs principaux
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter une classe
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
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={filters.level}
                onChange={(e) => setFilters((prev) => ({ ...prev, level: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tous les niveaux</option>
                {levelOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
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

              <select
                value={filters.teacher_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, teacher_id: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tous les professeurs</option>
                <option value="">Non assigné</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ level: 'all', academic_year: 'all', teacher_id: 'all' });
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des classes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des classes ({filteredClasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Année scolaire</TableHead>
                <TableHead>Professeur principal</TableHead>
                <TableHead>Nombre d'élèves</TableHead>
                <TableHead>Capacité max</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.level}</TableCell>
                    <TableCell>{cls.academic_year}</TableCell>
                    <TableCell>{cls.teacher_name || 'Non assigné'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {cls.student_count || 0}/{cls.max_students}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cls.student_count >= cls.max_students
                          ? 'bg-[#CC0033]/10 text-[#CC0033] dark:bg-[#CC0033]/20 dark:text-white'
                          : 'bg-[#0066CC]/10 text-[#003399] dark:bg-[#0066CC]/20 dark:text-white'
                      }`}>
                        {cls.student_count >= cls.max_students ? 'Complet' : 'Disponible'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewClass(cls)}
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(cls)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(cls)}
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
                    Aucune classe trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'ajout/modification */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? 'Modifier la classe' : 'Ajouter une classe'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations de la classe ci-dessous.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom de la classe *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: 6ème A"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Niveau *</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="Jardin d'enfant">Jardin d'enfant</option>
                    <option value="1ère année">1ère année</option>
                    <option value="2ème année">2ème année</option>
                    <option value="3ème année">3ème année</option>
                    <option value="4ème année">4ème année</option>
                    <option value="5ème année">5ème année</option>
                    <option value="6ème année">6ème année</option>
                    <option value="7ème année">7ème année</option>
                    <option value="8ème année">8ème année</option>
                    <option value="9ème année">9ème année</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Année scolaire *</label>
                <Input
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  placeholder="Ex: 2024-2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Capacité maximale</label>
                <Input
                  type="number"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) })}
                />
              </div>

              {!['7ème année', '8ème année', '9ème année'].includes(formData.level) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Professeur principal</label>
                  <select
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Non assigné</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                        {teacher.specialty ? ` - ${teacher.specialty}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {['7ème année', '8ème année', '9ème année'].includes(formData.level) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Professeurs intervenants (Collège)</label>
                  <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-muted/20">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`teacher-${teacher.id}`}
                          checked={formData.teacher_ids.includes(teacher.id)}
                          onChange={(e) => {
                            const ids = [...formData.teacher_ids];
                            if (e.target.checked) {
                              ids.push(teacher.id);
                            } else {
                              const index = ids.indexOf(teacher.id);
                              if (index > -1) ids.splice(index, 1);
                            }
                            setFormData({ ...formData, teacher_ids: ids });
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`teacher-${teacher.id}`} className="text-xs truncate">
                          {teacher.first_name} {teacher.last_name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Sélectionnez les professeurs qui interviennent dans cette classe.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                {editingClass ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fiche classe</DialogTitle>
            <DialogDescription>
              Informations détaillées de la classe.
            </DialogDescription>
          </DialogHeader>

          {viewingClass && (
            <div className="py-2 space-y-6">
              <div className="relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-br from-[#0066CC]/10 via-white to-[#FF6600]/10 dark:from-[#0066CC]/20 dark:via-black dark:to-[#FF6600]/20 p-5">
                <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#0066CC]/10 flex items-center justify-center border border-white/20 text-[#0066CC]">
                    <School className="h-8 w-8" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold tracking-tight text-black dark:text-white truncate">
                      {viewingClass.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{viewingClass.level} • {viewingClass.academic_year}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/10 px-3 py-1 text-xs font-semibold text-black dark:text-white border border-black/10 dark:border-white/10">
                        Capacité: {(viewingClass.student_count || 0)}/{viewingClass.max_students}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                        (viewingClass.student_count || 0) >= viewingClass.max_students
                          ? 'bg-[#CC0033]/10 text-[#CC0033] border-[#CC0033]/20 dark:text-white'
                          : 'bg-[#0066CC]/10 text-[#003399] border-[#0066CC]/20 dark:text-white'
                      }`}>
                        {(viewingClass.student_count || 0) >= viewingClass.max_students ? 'Complet' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-black dark:text-white">Professeurs</p>
                  <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-[#FF6600] to-[#FF3300]" />
                </div>
                <div className="space-y-3">
                  {!['7ème année', '8ème année', '9ème année'].includes(viewingClass.level) && (
                    <div className="rounded-xl border border-[#0066CC]/20 bg-[#0066CC]/5 p-3">
                      <p className="text-[11px] text-[#0066CC] font-bold uppercase tracking-wider">Professeur principal</p>
                      <p className="text-sm font-semibold">{viewingClass.teacher_name || 'Non assigné'}</p>
                    </div>
                  )}
                  
                  {viewingClass.teachers && viewingClass.teachers.length > 0 && (
                    <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-2">
                      <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Intervenants ({viewingClass.teachers.length})</p>
                      <div className="grid grid-cols-1 gap-2">
                        {viewingClass.teachers.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 text-sm">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                              {t.first_name?.[0]}{t.last_name?.[0]}
                            </div>
                            <span>{t.first_name} {t.last_name} {t.specialty ? `(${t.specialty})` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
      {/* Dialog de confirmation de suppression définitive */}
      <ConfirmHardDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, cls: open ? deleteDialog.cls : null })}
        onConfirm={handleConfirmDelete}
        itemName={deleteDialog.cls ? deleteDialog.cls.name : ''}
        warnings={[
          'Tous les élèves de la classe',
          'Paiements des élèves',
          'Notes et bulletins',
          'Tuteurs des élèves (si non partagés)',
          'Données de la classe'
        ]}
      />
    </div>
  );
}
