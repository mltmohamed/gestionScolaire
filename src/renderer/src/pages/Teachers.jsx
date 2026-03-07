import React, { useState } from 'react';
import { useTeachers } from '@/hooks/useTeachers';
import { useToast } from '@/hooks/useToast.jsx';
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
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';

export default function Teachers() {
  const { teachers, loading, createTeacher, updateTeacher, deleteTeacher } = useTeachers();
  const { toast, ToastComponent } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    specialty: '',
  });

  const filteredTeachers = teachers.filter(teacher =>
    teacher.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      });
    }
    setIsDialogOpen(true);
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
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {teacher.status === 'active' ? '● Actif' : '● Inactif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
        <DialogContent className="max-w-2xl">
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
    </div>
  );
}
