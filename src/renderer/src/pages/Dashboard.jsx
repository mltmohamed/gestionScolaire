import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Banknote,
  BookOpenCheck,
  CalendarDays,
  CircleDollarSign,
  GraduationCap,
  Landmark,
  Receipt,
  RefreshCw,
  School,
  User,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatNumber = (value) => Number(value || 0).toLocaleString('fr-FR');
const formatCurrency = (value) => `${formatNumber(value)} FCFA`;

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SM';
};

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
        <RefreshCw className="h-5 w-5 animate-spin text-[#0066CC]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement du tableau de bord</span>
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail, icon: Icon, tone = 'blue', action }) {
  const tones = {
    blue: 'bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20',
    orange: 'bg-[#FF6600]/10 text-[#FF3300] border-[#FF6600]/20',
    rose: 'bg-[#CC0033]/10 text-[#CC0033] border-[#CC0033]/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
  };

  return (
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          {action}
        </div>
        <div className="mt-5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-11 justify-start gap-3 border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
    >
      <Icon className="h-4 w-4 text-[#0066CC]" />
      {label}
    </Button>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      {label}
    </div>
  );
}

export default function Dashboard() {
  const { stats, loading, error, refresh } = useDashboard();
  const navigate = useNavigate();

  if (loading || !stats) {
    return <LoadingState />;
  }

  const finance = stats.finance || {};
  const activeRate = stats.totalStudents > 0 ? Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0;
  const collectionRate = finance.tuitionExpected > 0
    ? Math.min(Math.round((finance.tuitionPaid / finance.tuitionExpected) * 100), 100)
    : 0;
  const netThisMonth = Number(finance.studentPaymentsThisMonth || 0) - Number(finance.teacherPaymentsThisMonth || 0);
  const recentActivity = stats.recentActivity || [];
  const classOccupancy = stats.classOccupancy || [];

  const metrics = [
    {
      title: 'Élèves actifs',
      value: formatNumber(stats.activeStudents),
      detail: `${activeRate}% des élèves inscrits`,
      icon: GraduationCap,
      tone: 'blue',
    },
    {
      title: 'Encaissements du mois',
      value: formatCurrency(finance.studentPaymentsThisMonth),
      detail: `Solde net ${formatCurrency(netThisMonth)}`,
      icon: CircleDollarSign,
      tone: 'emerald',
    },
    {
      title: 'Reste scolarité',
      value: formatCurrency(finance.tuitionRemaining),
      detail: `${collectionRate}% déjà encaissé`,
      icon: WalletCards,
      tone: 'orange',
    },
    {
      title: 'Classes ouvertes',
      value: formatNumber(stats.totalClasses),
      detail: `${formatNumber(stats.totalTeachers)} enseignants`,
      icon: School,
      tone: 'rose',
    },
  ];

  return (
    <div className="space-y-6 pb-8 fade-in">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.9fr] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold uppercase text-[#003399] dark:text-blue-200">
              <Activity className="h-3.5 w-3.5" />
              Vue générale
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">
              Tableau de bord
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Les chiffres essentiels de l’établissement, les opérations récentes et les zones à surveiller.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => navigate('/students')} className="gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
                <UserPlus className="h-4 w-4" />
                Nouvel élève
              </Button>
              <Button onClick={() => navigate('/payments/tuition')} variant="outline" className="gap-2">
                <Receipt className="h-4 w-4" />
                Paiement
              </Button>
              <Button onClick={refresh} variant="ghost" size="icon" title="Actualiser">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-medium uppercase text-slate-500">État</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{activeRate}%</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-[#0066CC]" style={{ width: `${activeRate}%` }} />
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-medium uppercase text-slate-500">À affecter</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{formatNumber(stats.unassignedStudents)}</p>
              <p className="mt-1 text-xs text-slate-500">élèves sans classe</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-medium uppercase text-slate-500">Aujourd’hui</p>
              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>
              <p className="mt-1 text-xs text-slate-500">{formatNumber(stats.totalSubjects)} matières suivies</p>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg">Occupation des classes</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Capacité et remplissage des groupes les plus chargés.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/classes')} className="gap-2">
              Gérer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {classOccupancy.length > 0 ? classOccupancy.map((cls) => {
              const rate = Math.min(Number(cls.occupancy_rate || 0), 100);
              const isFull = Number(cls.student_count || 0) >= Number(cls.max_students || 0) && Number(cls.max_students || 0) > 0;
              return (
                <div key={cls.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">{cls.name}</p>
                      <p className="text-sm text-slate-500">{cls.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-950 dark:text-white">{formatNumber(cls.student_count)}/{formatNumber(cls.max_students)}</p>
                      <p className={`text-xs font-medium ${isFull ? 'text-[#CC0033]' : 'text-slate-500'}`}>
                        {isFull ? 'Capacité atteinte' : `${rate}% rempli`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${isFull ? 'bg-[#CC0033]' : 'bg-[#FF6600]'}`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            }) : (
              <EmptyState label="Aucune classe enregistrée." />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Actions rapides</CardTitle>
            <p className="text-sm text-slate-500">Les raccourcis les plus utiles au quotidien.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickAction icon={UserPlus} label="Inscrire un élève" onClick={() => navigate('/students')} />
            <QuickAction icon={Users} label="Ajouter un enseignant" onClick={() => navigate('/teachers')} />
            <QuickAction icon={Banknote} label="Saisir une scolarité" onClick={() => navigate('/payments/tuition')} />
            <QuickAction icon={Landmark} label="Payer un enseignant" onClick={() => navigate('/payments/teachers')} />
            <QuickAction icon={BookOpenCheck} label="Préparer les bulletins" onClick={() => navigate('/bulletin')} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg">Dernières inscriptions</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Les nouveaux dossiers ajoutés récemment.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/students')} className="gap-2">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentStudents?.length > 0 ? stats.recentStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex min-w-0 items-center gap-3">
                  {student.photo ? (
                    <img src={student.photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066CC]/10 text-[#0066CC]">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-950 dark:text-white">{student.first_name} {student.last_name}</p>
                    <p className="truncate text-sm text-slate-500">{student.class_name || 'Non assigné'}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right text-sm text-slate-500">
                  <CalendarDays className="mb-1 ml-auto h-4 w-4" />
                  {formatDate(student.enrollment_date)}
                </div>
              </div>
            )) : (
              <EmptyState label="Aucune inscription récente." />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="flex-row items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg">Activité financière</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Paiements élèves et enseignants les plus récents.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/payments')} className="gap-2">
              Ouvrir
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((activity) => {
              const isTeacherPayment = activity.activity_type === 'teacher_payment';
              const amountClass = isTeacherPayment ? 'text-[#CC0033]' : 'text-emerald-700 dark:text-emerald-300';
              return (
                <div key={`${activity.activity_type}-${activity.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isTeacherPayment ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
                      {isTeacherPayment ? <Landmark className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950 dark:text-white">{activity.person_name}</p>
                      <p className="truncate text-sm text-slate-500">{activity.label}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-bold ${amountClass}`}>
                      {isTeacherPayment ? '-' : '+'}{formatCurrency(activity.amount)}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(activity.activity_date)}</p>
                  </div>
                </div>
              );
            }) : (
              <EmptyState label="Aucune activité financière récente." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
