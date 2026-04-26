import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, Plus } from 'lucide-react';

const MONTHS = [
  { key: 10, label: 'Octobre' },
  { key: 11, label: 'Novembre' },
  { key: 12, label: 'Décembre' },
  { key: 1, label: 'Janvier' },
  { key: 2, label: 'Février' },
  { key: 3, label: 'Mars' },
  { key: 4, label: 'Avril' },
  { key: 5, label: 'Mai' },
  { key: 6, label: 'Juin' },
];

export default function MonthlyTrackingDialog({ 
  open, 
  onOpenChange, 
  student, 
  balance, 
  classes,
  onAddPayment 
}) {
  if (!student || !balance) return null;

  const studentClass = classes.find(c => c.id === student.class_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Suivi Mensuel - Scolarité
          </DialogTitle>
          <DialogDescription>
            {student.first_name} {student.last_name} - {studentClass?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Frais annuels</div>
                <div className="text-2xl font-bold">{balance.tuitionFee.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">FCFA</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Mensualité</div>
                <div className="text-2xl font-bold text-blue-600">{balance.monthlyFee.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">FCFA/mois</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total payé</div>
                <div className="text-2xl font-bold text-green-600">{balance.totalPaid.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">FCFA</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Reste</div>
                <div className="text-2xl font-bold text-red-600">{balance.remaining.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">FCFA</div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des 10 mois */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Paiements par mois</h3>
            <div className="grid grid-cols-2 gap-3">
              {MONTHS.map((month) => {
                const monthData = balance.monthlyPayments[month.key];
                if (!monthData) return null;

                const statusColors = {
                  paid: 'border-green-500 bg-green-50 dark:bg-green-900/20',
                  partial: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
                  unpaid: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                };

                const statusIcons = {
                  paid: <CheckCircle className="h-5 w-5 text-green-600" />,
                  partial: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
                  unpaid: <XCircle className="h-5 w-5 text-red-600" />,
                };

                const statusLabels = {
                  paid: 'Payé',
                  partial: 'Partiel',
                  unpaid: 'Non payé',
                };

                return (
                  <div
                    key={month.key}
                    className={`border-2 rounded-lg p-4 ${statusColors[monthData.status]}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{month.label}</h4>
                      {statusIcons[monthData.status]}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Attendu:</span>
                        <span className="font-medium">{monthData.expected.toFixed(2)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payé:</span>
                        <span className="font-medium text-green-600">{monthData.paid.toFixed(2)} FCFA</span>
                      </div>
                      {monthData.paid > 0 && monthData.paid < monthData.expected && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reste:</span>
                          <span className="font-medium text-red-600">
                            {(monthData.expected - monthData.paid).toFixed(2)} FCFA
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              monthData.status === 'paid' ? 'bg-green-500' :
                              monthData.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, (monthData.paid / monthData.expected) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-center mt-1 text-muted-foreground">
                          {statusLabels[monthData.status]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistiques */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Statistiques</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Mois payés</div>
                <div className="text-2xl font-bold text-green-600">
                  {Object.values(balance.monthlyPayments).filter(m => m.status === 'paid').length}/10
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Mois partiels</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(balance.monthlyPayments).filter(m => m.status === 'partial').length}/10
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Mois non payés</div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(balance.monthlyPayments).filter(m => m.status === 'unpaid').length}/10
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button onClick={() => {
            onOpenChange(false);
            if (onAddPayment) {
              onAddPayment(student);
            }
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
