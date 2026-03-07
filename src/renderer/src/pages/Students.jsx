import React, { useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
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

export default function Students() {
  const { students, loading, createStudent, updateStudent, deleteStudent } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    class_id: '',
  });

  const filteredStudents = students.filter(student =>
    student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (student = null) => {
    console.log('Ouverture dialog étudiant:', student ? 'Modification' : 'Ajout');
    if (student) {
      setEditingStudent(student);
      setFormData({
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        date_of_birth: student.date_of_birth?.split('T')[0] || '',
        gender: student.gender || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        class_id: student.class_id || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        class_id: '',
      });
    }
    setIsDialogOpen(true);
    console.log('État du dialog:', isDialogOpen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Soumission formulaire étudiant:', formData);
    try {
      if (editingStudent) {
        const result = await updateStudent(editingStudent.id, formData);
        console.log('Résultat modification:', result);
        if (!result.success) {
          toast.error(result.error || 'Erreur lors de la modification');
          return;
        }
        toast.success('Élève modifié avec succès !');
      } else {
        const result = await createStudent(formData);
        console.log('Résultat création:', result);
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
      try {
        await deleteStudent(id);
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
                <TableHead>Nom complet</TableHead>
                <TableHead>Date de naissance</TableHead>
                <TableHead>Email</TableHead>
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
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>
                      {student.date_of_birth 
                        ? new Date(student.date_of_birth).toLocaleDateString('fr-FR')
                        : '-'}
                    </TableCell>
                    <TableCell>{student.email || '-'}</TableCell>
                    <TableCell>{student.phone || '-'}</TableCell>
                    <TableCell>{student.class_name || 'Non assigné'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {student.status === 'active' ? '● Actif' : '● Inactif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(student)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(student.id)}
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
    </div>
  );
}
