import React, { useState, useMemo } from 'react';
import { usePayments } from '@/hooks/usePayments';
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
import { Search, Users, DollarSign, Plus, Eye, Calendar, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TeacherPayments() {
  const { teacherPayments, loading, createTeacherPayment, updateTeacherPayment, deleteTeacherPayment } = usePayments();
  const { teachers } = useTeachers();
  const { toast, ToastComponent } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    teacher_id: 'all',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    status: 'all',
  });

  const [formData, setFormData] = useState({
    teacher_id: '',
    amount: '',
    payment_method: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    description: '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ];

  // Calculer les statistiques par enseignant et par période
  const teacherStats = useMemo(() => {
    const stats = {};
    
    teachers.forEach(teacher => {
      const payments = teacherPayments.filter(p => 
        p.teacher_id === teacher.id && 
        p.period_month === filters.period_month && 
        p.period_year === filters.period_year
      );
      
      const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const expectedSalary = 150000; // Salaire de base - à rendre configurable
      
      stats[teacher.id] = {
        totalPaid,
        expectedSalary,
        remaining: expectedSalary - totalPaid,
        status: totalPaid >= expectedSalary ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
        paymentCount: payments.length,
        payments,
      };
    });
    
    return stats;
  }, [teachers, teacherPayments, filters.period_month, filters.period_year]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      const stats = teacherStats[teacher.id];
      if (!stats) return false;

      const q = (searchTerm || '').trim().toLowerCase();
      const matchSearch = !q || 
        (teacher.first_name || '').toLowerCase().includes(q) || 
        (teacher.last_name || '').toLowerCase().includes(q) ||
        (teacher.specialty || '').toLowerCase().includes(q);

      const matchTeacher = filters.teacher_id === 'all' || String(teacher.id) === String(filters.teacher_id);
      const matchStatus = filters.status === 'all' || stats.status === filters.status;

      return matchSearch && matchTeacher && matchStatus;
    });
  }, [teachers, teacherStats, searchTerm, filters]);

  const handleOpenDialog = (teacher = null) => {
    if (teacher) {
      const stats = teacherStats[teacher.id];
      setEditingPayment(teacher);
      setFormData({
        teacher_id: teacher.id,
        amount: stats.remaining > 0 ? stats.remaining.toString() : '',
        payment_method: '',
        period_month: filters.period_month,
        period_year: filters.period_year,
        description: `Salaire ${months.find(m => m.value === filters.period_month)?.label} ${filters.period_year} - ${teacher.first_name} ${teacher.last_name}`,
        payment_date: new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingPayment(null);
      setFormData({
        teacher_id: '',
        amount: '',
        payment_method: '',
        period_month: filters.period_month,
        period_year: filters.period_year,
        description: '',
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
        amount: parseFloat(formData.amount),
        period_month: parseInt(formData.period_month),
        period_year: parseInt(formData.period_year),
      };

      const result = await createTeacherPayment(paymentData);
      if (result.success) {
        toast.success('Paiement enseignant enregistré avec succès !');
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
    };

    const labels = {
      paid: 'Payé',
      partial: 'Partiel',
      unpaid: 'Non payé',
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
            <Users className="h-8 w-8 text-green-600" />
            Paiements des Enseignants
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les salaires et paiements des enseignants
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
                <p className="text-sm text-muted-foreground">Total enseignants</p>
                <p className="text-2xl font-bold">{filteredTeachers.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payés</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredTeachers.filter(t => teacherStats[t.id]?.status === 'paid').length}
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
                  {filteredTeachers.filter(t => teacherStats[t.id]?.status === 'partial').length}
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
                  {filteredTeachers.filter(t => teacherStats[t.id]?.status === 'unpaid').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
                placeholder="Rechercher un enseignant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={filters.teacher_id}
                onChange={(e) => setFilters((prev) => ({ ...prev, teacher_id: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Tous les enseignants</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </option>
                ))}
              </select>

              <select
                value={filters.period_month}
                onChange={(e) => setFilters((prev) => ({ ...prev, period_month: parseInt(e.target.value) }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.period_year}
                onChange={(e) => setFilters((prev) => ({ ...prev, period_year: parseInt(e.target.value) }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
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
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des enseignants */}
      <Card>
        <CardHeader>
          <CardTitle>
            Liste des enseignants ({filteredTeachers.length}) - 
            {months.find(m => m.value === filters.period_month)?.label} {filters.period_year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enseignant</TableHead>
                <TableHead>Spécialité</TableHead>
                <TableHead>Salaire attendu</TableHead>
                <TableHead>Montant payé</TableHead>
                <TableHead>Reste à payer</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => {
                  const stats = teacherStats[teacher.id];
                  
                  return (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.first_name} {teacher.last_name}
                        <div className="text-sm text-muted-foreground">{teacher.phone}</div>
                      </TableCell>
                      <TableCell>{teacher.specialty || 'Non spécifiée'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {stats.expectedSalary.toFixed(2)} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {stats.totalPaid.toFixed(2)} FCFA
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${stats.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <DollarSign className="h-4 w-4" />
                          {stats.remaining.toFixed(2)} FCFA
                        </div>
                      </TableCell>
                      <TableCell className="w-32">
                        {getProgressBar(stats.totalPaid, stats.expectedSalary)}
                      </TableCell>
                      <TableCell>{getStatusBadge(stats.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(teacher)}
                            title="Enregistrer un paiement"
                            disabled={stats.status === 'paid'}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewingPayment({
                                teacher,
                                stats,
                                payments: stats.payments
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
                    Aucun enseignant trouvé
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
                {editingPayment ? 'Enregistrer un paiement' : 'Nouveau paiement enseignant'}
              </DialogTitle>
              <DialogDescription>
                Enregistrez un paiement de salaire pour l'enseignant.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enseignant *</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!!editingPayment}
                >
                  <option value="">Sélectionner un enseignant</option>
                  {teachers.map((teacher) => {
                    const stats = teacherStats[teacher.id];
                    return (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} - {teacher.specialty || 'Non spécifiée'}
                        {stats.remaining > 0 ? ` (Reste: ${stats.remaining.toFixed(2)} FCFA)` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mois *</label>
                  <select
                    value={formData.period_month}
                    onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Année *</label>
                  <select
                    value={formData.period_year}
                    onChange={(e) => setFormData({ ...formData, period_year: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
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
                  <h3 className="font-medium mb-2">Informations de l'enseignant</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Nom:</span> {viewingPayment.teacher.first_name} {viewingPayment.teacher.last_name}</div>
                    <div><span className="font-medium">Spécialité:</span> {viewingPayment.teacher.specialty || 'Non spécifiée'}</div>
                    <div><span className="font-medium">Téléphone:</span> {viewingPayment.teacher.phone}</div>
                    <div><span className="font-medium">Statut:</span> {getStatusBadge(viewingPayment.stats.status)}</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Résumé des paiements</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Salaire attendu</p>
                      <p className="text-lg font-bold">{viewingPayment.stats.expectedSalary.toFixed(2)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Montant payé</p>
                      <p className="text-lg font-bold text-green-600">{viewingPayment.stats.totalPaid.toFixed(2)} FCFA</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reste à payer</p>
                      <p className={`text-lg font-bold ${viewingPayment.stats.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {viewingPayment.stats.remaining.toFixed(2)} FCFA
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {getProgressBar(viewingPayment.stats.totalPaid, viewingPayment.stats.expectedSalary)}
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
