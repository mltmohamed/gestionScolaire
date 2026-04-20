import React, { useState, useMemo } from 'react';
import { usePayments } from '@/hooks/usePayments';
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
import { Search, GraduationCap, DollarSign, Plus, Eye, CheckCircle, XCircle, AlertTriangle, Calendar, Users } from 'lucide-react';

export default function TuitionPayments() {
  const { studentPayments, loading, createStudentPayment, updateStudentPayment, deleteStudentPayment } = usePayments();
  const { students } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class_id: 'all',
    status: 'all',
    academic_year: 'all',
  });

  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_method: '',
    description: '',
    academic_year: '2025-2026',
    payment_date: new Date().toISOString().split('T')[0],
  });

  // Filtrer les paiements de scolarité uniquement
  const tuitionPayments = useMemo(() => {
    return studentPayments.filter(payment => payment.type === 'tuition');
  }, [studentPayments]);

  // Calculer les soldes pour chaque élève
  const studentBalances = useMemo(() => {
    const balances = {};
    
    students.forEach(student => {
      const studentClass = classes.find(cls => cls.id === student.class_id);
      const tuitionFee = studentClass?.tuition_fee || 0;
      
      const payments = tuitionPayments.filter(p => p.student_id === student.id);
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      balances[student.id] = {
        tuitionFee,
        totalPaid,
        remaining: tuitionFee - totalPaid,
        status: tuitionFee > 0 ? (totalPaid >= tuitionFee ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid') : 'no_fee',
        paymentCount: payments.length,
      };
    });
    
    return balances;
  }, [students, classes, tuitionPayments]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const balance = studentBalances[student.id];
      if (!balance) return false;

      const q = (searchTerm || '').trim().toLowerCase();
      const matchSearch = !q || 
        (student.first_name || '').toLowerCase().includes(q) || 
        (student.last_name || '').toLowerCase().includes(q) ||
        (student.matricule || '').toLowerCase().includes(q);

      const matchClass = filters.class_id === 'all' || String(student.class_id || '') === String(filters.class_id);
      const matchStatus = filters.status === 'all' || balance.status === filters.status;
      const studentClass = classes.find(cls => cls.id === student.class_id);
      const matchYear = filters.academic_year === 'all' || (studentClass?.academic_year || '') === filters.academic_year;

      return matchSearch && matchClass && matchStatus && matchYear;
    });
  }, [students, studentBalances, searchTerm, filters, classes]);

  const handleOpenDialog = (student = null) => {
    if (student) {
      const balance = studentBalances[student.id];
      setEditingPayment(student);
      setFormData({
        student_id: student.id,
        amount: balance.remaining > 0 ? balance.remaining.toString() : '',
        payment_method: '',
        description: `Paiement scolarité - ${student.first_name} ${student.last_name}`,
        academic_year: '2025-2026',
        payment_date: new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingPayment(null);
      setFormData({
        student_id: '',
        amount: '',
        payment_method: '',
        description: '',
        academic_year: '2025-2026',
        payment_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        ...formData,
        type: 'tuition',
        amount: parseFloat(formData.amount),
      };

      const result = await createStudentPayment(paymentData);
      if (result.success) {
        toast.success('Paiement enregistré avec succès !');
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      unpaid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      no_fee: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    const labels = {
      paid: 'Payé',
      partial: 'Partiel',
      unpaid: 'Non payé',
      no_fee: 'Aucun frais',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getProgressBar = (paid, total) => {
    if (total <= 0) return null;
    const percentage = Math.min((paid / total) * 100, 100);
    const color = percentage >= 100 ? 'bg-green-500' : percentage > 0 ? 'bg-yellow-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            Paiements de Scolarité
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les paiements de frais de scolarité des élèves
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Enregistrer un paiement
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total élèves</p>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredStudents.filter(s => studentBalances[s.id]?.status === 'paid').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Partiels</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredStudents.filter(s => studentBalances[s.id]?.status === 'partial').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Non payés</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredStudents.filter(s => studentBalances[s.id]?.status === 'unpaid').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
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
                <option value="paid">Payé</option>
                <option value="partial">Partiel</option>
                <option value="unpaid">Non payé</option>
                <option value="no_fee">Aucun frais</option>
              </select>

              <select
                value={filters.academic_year}
                onChange={(e) => setFilters((prev) => ({ ...prev, academic_year: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les années</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({ class_id: 'all', status: 'all', academic_year: 'all' });
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
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Frais de scolarité</TableHead>
                <TableHead>Montant payé</TableHead>
                <TableHead>Reste à payer</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const balance = studentBalances[student.id];
                  const studentClass = classes.find(cls => cls.id === student.class_id);
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                        <div className="text-sm text-muted-foreground">{student.matricule}</div>
                      </TableCell>
                      <TableCell>{studentClass?.name || 'Non assigné'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {balance.tuitionFee.toFixed(2)} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {balance.totalPaid.toFixed(2)} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${balance.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <DollarSign className="h-4 w-4" />
                          {balance.remaining.toFixed(2)} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        {getProgressBar(balance.totalPaid, balance.tuitionFee)}
                      </TableCell>
                      <TableCell>{getStatusBadge(balance.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(student)}
                            title="Enregistrer un paiement"
                            disabled={balance.status === 'paid' || balance.tuitionFee <= 0}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewingPayment({
                                student,
                                balance,
                                payments: tuitionPayments.filter(p => p.student_id === student.id)
                              });
                              setIsViewDialogOpen(true);
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Aucun élève trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog d'ajout de paiement */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? 'Enregistrer un paiement' : 'Nouveau paiement de scolarité'}
              </DialogTitle>
              <DialogDescription>
                Enregistrez un paiement de frais de scolarité pour l'élève.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Élève *</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!!editingPayment}
                >
                  <option value="">Sélectionner un élève</option>
                  {students.map((student) => {
                    const balance = studentBalances[student.id];
                    const studentClass = classes.find(cls => cls.id === student.class_id);
                    return (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} - {studentClass?.name || 'Non assigné'} 
                        {balance.remaining > 0 ? ` (Reste: ${balance.remaining.toFixed(2)} FCFA)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Montant *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Méthode de paiement</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner</option>
                  <option value="espèces">Espèces</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="banque">Virement bancaire</option>
                  <option value="chèque">Chèque</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date de paiement</label>
                <Input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Description optionnelle"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer le paiement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation des détails */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails des paiements</DialogTitle>
          </DialogHeader>

          {viewingPayment && (
            <div className="py-2 space-y-6">
              <div className="grid gap-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Informations de l'élève</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Nom:</span> {viewingPayment.student.first_name} {viewingPayment.student.last_name}</div>
                    <div><span className="font-medium">Matricule:</span> {viewingPayment.student.matricule}</div>
                    <div><span className="font-medium">Classe:</span> {classes.find(c => c.id === viewingPayment.student.class_id)?.name}</div>
                    <div><span className="font-medium">Statut:</span> {getStatusBadge(viewingPayment.balance.status)}</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Résumé des paiements</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Frais totaux</p>
                      <p className="text-lg font-bold">{viewingPayment.balance.tuitionFee.toFixed(2)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Montant payé</p>
                      <p className="text-lg font-bold text-green-600">{viewingPayment.balance.totalPaid.toFixed(2)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reste à payer</p>
                      <p className={`text-lg font-bold ${viewingPayment.balance.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {viewingPayment.balance.remaining.toFixed(2)} FCFA
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {getProgressBar(viewingPayment.balance.totalPaid, viewingPayment.balance.tuitionFee)}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Historique des paiements</h3>
                  {viewingPayment.payments.length > 0 ? (
                    <div className="space-y-2">
                      {viewingPayment.payments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{payment.amount.toFixed(2)} FCFA</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleDateString('fr-FR')} - {payment.payment_method || 'Non spécifié'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">{payment.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Aucun paiement enregistré</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
