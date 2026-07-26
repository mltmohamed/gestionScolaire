import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
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
import { useToast } from '@/hooks/useToast.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const formatNumber = (value) => Number(value || 0).toLocaleString('fr-FR', {
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => `${formatNumber(value)} FCFA`;

const formatDate = (date) => {
  if (!date) return 'Date non renseignée';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Date non renseignée';
  return parsedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const formatUpdatedTime = (date) => {
  if (!date) return 'Pas encore actualisé';
  return `Mis à jour à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
};

const pluralize = (count, singular, plural) => (
  `${formatNumber(count)} ${Number(count) > 1 ? plural : singular}`
);

const clampPercentage = (value) => Math.max(0, Math.min(100, Number(value) || 0));

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <RefreshCw aria-hidden="true" className="h-5 w-5 text-[#0066CC] motion-safe:animate-spin" />
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Chargement du tableau de bord</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Calcul des élèves, classes et paiements en cours…</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-[460px] items-center justify-center px-4">
      <section
        role="alert"
        aria-labelledby="dashboard-error-title"
        className="w-full max-w-xl rounded-xl border border-red-200 bg-white p-6 text-center shadow-lg dark:border-red-900/70 dark:bg-slate-950 sm:p-8"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#CC0033] dark:bg-red-950/50 dark:text-red-300">
          <AlertTriangle aria-hidden="true" className="h-7 w-7" />
        </div>
        <h2 id="dashboard-error-title" className="mt-5 text-xl font-bold text-slate-950 dark:text-white">
          Impossible d’afficher le tableau de bord
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Les indicateurs n’ont pas pu être récupérés. Aucune donnée n’a été modifiée.
        </p>
        <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-left dark:bg-red-950/30">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">Détail de l’erreur</p>
          <p className="mt-1 text-sm leading-6 text-red-800 dark:text-red-200">{message}</p>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Vérifiez que votre session est active, puis relancez le chargement.
        </p>
        <Button type="button" onClick={onRetry} className="mt-5 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Réessayer
        </Button>
      </section>
    </div>
  );
}

function ProgressBar({ value, label, tone = 'blue', valueText }) {
  const boundedValue = clampPercentage(value);
  const tones = {
    blue: 'bg-[#0066CC]',
    orange: 'bg-[#FF6600]',
    red: 'bg-[#CC0033]',
    emerald: 'bg-emerald-500',
  };

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(boundedValue)}
      aria-valuetext={valueText || `${Math.round(boundedValue)} %`}
      className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${tones[tone] || tones.blue}`}
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  accessibleValue,
  detail,
  icon: Icon,
  tone = 'blue',
  to,
  progress,
}) {
  const tones = {
    blue: 'border-[#0066CC]/20 bg-[#0066CC]/10 text-[#0066CC] dark:text-blue-300',
    orange: 'border-[#FF6600]/20 bg-[#FF6600]/10 text-[#FF3300] dark:text-orange-300',
    rose: 'border-[#CC0033]/20 bg-[#CC0033]/10 text-[#CC0033] dark:text-red-300',
    emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  };

  return (
    <Link
      to={to}
      aria-label={`${title} : ${accessibleValue || value}. ${detail}`}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
    >
      <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#0066CC]/30 group-hover:shadow-md group-focus-visible:border-[#0066CC]/40 motion-reduce:transform-none dark:border-slate-800 dark:bg-slate-950">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
              <Icon aria-hidden="true" className="h-5 w-5" />
            </div>
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-slate-400 transition group-hover:text-[#0066CC]" />
          </div>
          <div className="mt-5 flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 tabular-nums dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">{detail}</p>
          </div>
          {progress ? (
            <div className="mt-4">
              <ProgressBar {...progress} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

function SummaryLink({ to, icon: Icon, label, value, description, alert = false }) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-white/15 bg-white/10 p-4 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      aria-label={`${label} : ${value}. ${description}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-blue-100 transition group-hover:text-white" />
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-100">{label}</p>
      <p className="mt-1 text-2xl font-black text-white tabular-nums">{value}</p>
      <p className={`mt-1 text-xs leading-5 ${alert ? 'font-semibold text-amber-200' : 'text-blue-100'}`}>
        {description}
      </p>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, description, to }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-[#0066CC]/30 hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0066CC]/10 text-[#0066CC] dark:text-blue-300">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0066CC] motion-reduce:transform-none" />
    </Link>
  );
}

function EmptyState({ icon: Icon, title, description, actionLabel, to }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-5 py-7 text-center dark:border-slate-700">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <p className="mt-3 font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-5 text-slate-500 dark:text-slate-400">{description}</p>
      <Button asChild type="button" variant="outline" size="sm" className="mt-4 gap-2">
        <Link to={to}>
          {actionLabel}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const {
    stats,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  } = useDashboard();
  const { toast, ToastComponent } = useToast();

  const handleRefresh = async () => {
    if (refreshing) return;
    const result = await refresh();

    if (result.success) {
      toast.success({
        title: 'Tableau de bord actualisé',
        message: 'Les indicateurs affichent maintenant les données les plus récentes.',
        description: formatUpdatedTime(result.updatedAt),
        details: ['Effectifs et affectations recalculés.', 'Paiements et occupation des classes mis à jour.'],
      });
      return;
    }

    if (!result.ignored) {
      toast.error({
        title: 'Actualisation impossible',
        message: 'Les dernières données disponibles restent affichées.',
        description: result.error,
        details: ['Vérifiez votre session et la disponibilité de l’application.', 'Vous pouvez réessayer sans perdre les données déjà affichées.'],
      });
    }
  };

  if (loading && !stats) {
    return (
      <>
        {ToastComponent}
        <LoadingState />
      </>
    );
  }

  if (!stats) {
    return (
      <>
        {ToastComponent}
        <ErrorState message={error || 'Aucune donnée n’a été reçue.'} onRetry={refresh} />
      </>
    );
  }

  const finance = stats.finance || {};
  const classSummary = stats.classSummary || {};
  const activeRate = stats.totalStudents > 0
    ? clampPercentage(Math.round((Number(stats.activeStudents || 0) / Number(stats.totalStudents)) * 100))
    : 0;
  const collectionRate = finance.tuitionExpected > 0
    ? clampPercentage(Math.round((Number(finance.tuitionPaid || 0) / Number(finance.tuitionExpected)) * 100))
    : 0;
  const recentActivity = stats.recentActivity || [];
  const classOccupancy = stats.classOccupancy || [];
  const currentClassCount = Number(classSummary.totalClasses ?? stats.totalClasses ?? 0);
  const fullClasses = Number(classSummary.fullClasses || 0);
  const overCapacityClasses = Number(classSummary.overCapacityClasses || 0);
  const unassignedStudents = Number(stats.unassignedStudents || 0);
  const academicYear = stats.academicYear || 'année en cours';
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const priorityDetails = [];
  if (currentClassCount === 0) {
    priorityDetails.push(`Aucune classe n’est ouverte pour ${academicYear}.`);
  }
  if (unassignedStudents > 0) {
    priorityDetails.push(`${pluralize(unassignedStudents, 'élève actif attend', 'élèves actifs attendent')} une affectation.`);
  }
  if (fullClasses > 0) {
    priorityDetails.push(
      `${pluralize(fullClasses, 'classe a', 'classes ont')} atteint ou dépassé ${fullClasses > 1 ? 'leur' : 'sa'} capacité.`
    );
  }
  const priorityCount = priorityDetails.length;

  const metrics = [
    {
      title: 'Élèves actifs',
      value: formatNumber(stats.activeStudents),
      accessibleValue: pluralize(stats.activeStudents, 'élève actif', 'élèves actifs'),
      detail: `${formatNumber(stats.activeStudents)} sur ${formatNumber(stats.totalStudents)} dossiers`,
      icon: GraduationCap,
      tone: 'blue',
      to: '/students',
      progress: {
        value: activeRate,
        label: 'Part des élèves actifs',
        valueText: `${activeRate} % des dossiers élèves sont actifs`,
      },
    },
    {
      title: 'Scolarités ce mois',
      value: formatCurrency(finance.tuitionPaymentsThisMonth),
      accessibleValue: formatCurrency(finance.tuitionPaymentsThisMonth),
      detail: `${pluralize(finance.tuitionPaymentCountThisMonth, 'encaissement', 'encaissements')} en ${currentMonth}`,
      icon: CircleDollarSign,
      tone: 'emerald',
      to: '/payments/tuition',
    },
    {
      title: 'Reste à encaisser',
      value: formatCurrency(finance.tuitionRemaining),
      accessibleValue: formatCurrency(finance.tuitionRemaining),
      detail: `Scolarité ${academicYear} · ${collectionRate} % réglé`,
      icon: WalletCards,
      tone: 'orange',
      to: '/payments/tuition',
      progress: {
        value: collectionRate,
        label: `Scolarité encaissée pour l’année ${academicYear}`,
        tone: collectionRate >= 100 ? 'emerald' : 'orange',
        valueText: `${collectionRate} % de la scolarité attendue est encaissée`,
      },
    },
    {
      title: 'Classes en cours',
      value: formatNumber(currentClassCount),
      accessibleValue: pluralize(currentClassCount, 'classe en cours', 'classes en cours'),
      detail: `${pluralize(stats.activeTeachers, 'enseignant actif', 'enseignants actifs')} · ${academicYear}`,
      icon: School,
      tone: 'rose',
      to: '/classes',
    },
  ];

  return (
    <div className="space-y-6 pb-8 fade-in" aria-busy={refreshing}>
      {ToastComponent}

      <section
        aria-labelledby="dashboard-summary-title"
        className="overflow-hidden rounded-xl bg-gradient-to-br from-[#003399] via-[#0059b3] to-[#0066CC] text-white shadow-md"
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-50">
                {priorityCount === 0 ? (
                  <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 text-amber-200" />
                )}
                Année scolaire {academicYear}
              </div>
              <h2 id="dashboard-summary-title" className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
                {priorityCount === 0
                  ? 'Aucun point bloquant détecté'
                  : `${pluralize(priorityCount, 'point', 'points')} à vérifier`}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50">
                {priorityCount === 0
                  ? 'Les élèves actifs sont affectés et aucune classe n’a atteint sa capacité.'
                  : priorityDetails.join(' ')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Actualiser le tableau de bord"
                aria-busy={refreshing}
                className="gap-2 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? 'motion-safe:animate-spin' : ''}`} />
                {refreshing ? 'Actualisation…' : 'Actualiser'}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryLink
              to="/students"
              icon={UserPlus}
              label="Élèves à affecter"
              value={formatNumber(unassignedStudents)}
              description={unassignedStudents > 0 ? 'Ouvrir les dossiers concernés' : 'Tous les élèves actifs sont affectés'}
              alert={unassignedStudents > 0}
            />
            <SummaryLink
              to="/classes"
              icon={School}
              label="Classes à surveiller"
              value={formatNumber(fullClasses)}
              description={
                currentClassCount === 0
                  ? 'Aucune classe pour cette année'
                  : overCapacityClasses > 0
                    ? pluralize(overCapacityClasses, 'classe en dépassement', 'classes en dépassement')
                    : fullClasses > 0
                      ? 'Capacité atteinte'
                      : 'Capacités disponibles'
              }
              alert={currentClassCount === 0 || fullClasses > 0}
            />
            <SummaryLink
              to="/payments/tuition"
              icon={Banknote}
              label="Scolarité encaissée"
              value={finance.tuitionExpected > 0 ? `${collectionRate} %` : '—'}
              description={
                finance.tuitionExpected > 0
                  ? `${formatCurrency(finance.tuitionRemaining)} restent à encaisser`
                  : 'Aucun frais de scolarité attendu'
              }
            />
          </div>

          <p className="mt-4 text-xs text-blue-100" role="status" aria-live="polite">
            {refreshing ? 'Actualisation des indicateurs en cours…' : formatUpdatedTime(lastUpdated)}
          </p>
        </div>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div className="flex min-w-0 items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Les données affichées n’ont pas pu être actualisées.</p>
              <p className="mt-0.5 text-xs leading-5 opacity-80">{error}</p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="shrink-0 gap-2 border-amber-400 bg-white/60 dark:bg-transparent">
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? 'motion-safe:animate-spin' : ''}`} />
            Réessayer
          </Button>
        </div>
      ) : null}

      <section aria-labelledby="dashboard-metrics-title">
        <div className="mb-4">
          <h2 id="dashboard-metrics-title" className="text-lg font-bold text-slate-950 dark:text-white">Indicateurs clés</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les chiffres utiles pour piloter l’établissement en un coup d’œil.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="class-occupancy-title">
          <Card className="h-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-col items-start gap-3 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 id="class-occupancy-title" className="text-lg font-bold text-slate-950 dark:text-white">Occupation des classes</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les groupes les plus remplis pour {academicYear}.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full shrink-0 gap-2 sm:w-auto">
                <Link to="/classes">
                  Gérer les classes
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {classOccupancy.length > 0 ? (
                <ul className="space-y-3">
                  {classOccupancy.map((cls) => {
                    const studentCount = Number(cls.student_count || 0);
                    const maxStudents = Number(cls.max_students || 0);
                    const hasCapacity = maxStudents > 0;
                    const rawRate = hasCapacity ? Math.round((studentCount / maxStudents) * 100) : 0;
                    const overCapacityBy = hasCapacity ? Math.max(studentCount - maxStudents, 0) : 0;
                    const isFull = hasCapacity && studentCount >= maxStudents;
                    const nearlyFull = hasCapacity && rawRate >= 80;
                    const status = !hasCapacity
                      ? 'Capacité non définie'
                      : overCapacityBy > 0
                        ? `${pluralize(overCapacityBy, 'élève', 'élèves')} au-dessus de la capacité`
                        : isFull
                          ? 'Capacité atteinte'
                          : `${rawRate} % occupée`;
                    const progressTone = isFull ? 'red' : nearlyFull ? 'orange' : 'blue';

                    return (
                      <li key={cls.id}>
                        <Link
                          to="/classes"
                          aria-label={`${cls.name}, ${studentCount} élèves${hasCapacity ? ` sur ${maxStudents}` : ''}. ${status}`}
                          className="block rounded-lg border border-slate-200 p-4 transition hover:border-[#0066CC]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:border-slate-800 dark:hover:bg-slate-900/70"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950 dark:text-white">{cls.name}</p>
                              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{cls.level || 'Niveau non renseigné'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-950 tabular-nums dark:text-white">
                                {hasCapacity ? `${formatNumber(studentCount)}/${formatNumber(maxStudents)}` : formatNumber(studentCount)}
                              </p>
                              <p className={`text-xs font-medium ${
                                isFull
                                  ? 'text-[#CC0033] dark:text-red-300'
                                  : nearlyFull
                                    ? 'text-[#B54708] dark:text-orange-300'
                                    : 'text-slate-500 dark:text-slate-400'
                              }`}>
                                {status}
                              </p>
                            </div>
                          </div>
                          {hasCapacity ? (
                            <div className="mt-3">
                              <ProgressBar
                                value={rawRate}
                                label={`Occupation de la classe ${cls.name}`}
                                tone={progressTone}
                                valueText={`${studentCount} élèves pour une capacité de ${maxStudents}. ${status}`}
                              />
                            </div>
                          ) : (
                            <div className="mt-3 h-2 rounded-full border border-dashed border-slate-300 dark:border-slate-700" aria-hidden="true" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={School}
                  title="Aucune classe pour cette année"
                  description={`Ajoutez ou mettez à jour les classes de l’année scolaire ${academicYear}.`}
                  actionLabel="Gérer les classes"
                  to="/classes"
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="quick-actions-title">
          <Card className="h-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="pb-4">
              <h2 id="quick-actions-title" className="text-lg font-bold text-slate-950 dark:text-white">Accès rapides</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Rejoignez directement les espaces utilisés au quotidien.</p>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3">
                <li><QuickAction icon={UserPlus} label="Gérer les élèves" description="Inscriptions, dossiers et affectations" to="/students" /></li>
                <li><QuickAction icon={Users} label="Gérer les enseignants" description="Profils et équipe pédagogique" to="/teachers" /></li>
                <li><QuickAction icon={Banknote} label="Ouvrir les scolarités" description="Encaissements, restes et reçus" to="/payments/tuition" /></li>
                <li><QuickAction icon={Landmark} label="Gérer les salaires" description="Paiements mensuels des enseignants" to="/payments/teachers" /></li>
                <li><QuickAction icon={BookOpenCheck} label="Préparer les bulletins" description="Notes et résultats du primaire" to="/bulletin/primary" /></li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="recent-students-title">
          <Card className="h-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-col items-start gap-3 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 id="recent-students-title" className="text-lg font-bold text-slate-950 dark:text-white">Dossiers élèves récents</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les derniers dossiers ajoutés dans l’application.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full shrink-0 gap-2 sm:w-auto">
                <Link to="/students">
                  Voir tous les élèves
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {stats.recentStudents?.length > 0 ? (
                <ul className="space-y-3">
                  {stats.recentStudents.map((student) => {
                    const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Élève sans nom';
                    const studentDate = student.created_at || student.enrollment_date;
                    return (
                      <li key={student.id}>
                        <Link
                          to="/students"
                          aria-label={`Ouvrir les élèves. ${studentName}, ${student.class_name || 'sans classe'}`}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-[#0066CC]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:border-slate-800 dark:hover:bg-slate-900/70"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0066CC]/10 text-[#0066CC] dark:text-blue-300">
                              <User aria-hidden="true" className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950 dark:text-white">{studentName}</p>
                              <p className={`truncate text-sm ${student.class_name ? 'text-slate-500 dark:text-slate-400' : 'font-medium text-[#B54708] dark:text-orange-300'}`}>
                                {student.class_name || 'Sans classe'}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">
                            <CalendarDays aria-hidden="true" className="mb-1 ml-auto h-4 w-4" />
                            <time dateTime={studentDate || undefined}>{formatDate(studentDate)}</time>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={UserPlus}
                  title="Aucun dossier élève"
                  description="Les nouvelles inscriptions apparaîtront ici dès leur enregistrement."
                  actionLabel="Gérer les inscriptions"
                  to="/students"
                />
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="recent-finance-title">
          <Card className="h-full border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="flex flex-col items-start gap-3 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 id="recent-finance-title" className="text-lg font-bold text-slate-950 dark:text-white">Activité financière récente</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Les derniers encaissements et paiements enregistrés.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="w-full shrink-0 gap-2 sm:w-auto">
                <Link to="/payments/tuition">
                  Voir les scolarités
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <ul className="space-y-3">
                  {recentActivity.map((activity) => {
                    const isTeacherPayment = activity.activity_type === 'teacher_payment';
                    const isUniformPayment = activity.payment_type === 'uniform';
                    const activityPath = isTeacherPayment
                      ? '/payments/teachers'
                      : isUniformPayment
                        ? '/payments/uniform'
                        : '/payments/tuition';
                    const amountClass = isTeacherPayment
                      ? 'text-[#CC0033] dark:text-red-300'
                      : 'text-emerald-700 dark:text-emerald-300';

                    return (
                      <li key={`${activity.activity_type}-${activity.id}`}>
                        <Link
                          to={activityPath}
                          aria-label={`${activity.label}, ${activity.person_name}, ${isTeacherPayment ? 'sortie' : 'entrée'} de ${formatCurrency(activity.amount)}`}
                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-slate-200 p-3 transition hover:border-[#0066CC]/30 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] dark:border-slate-800 dark:hover:bg-slate-900/70"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              isTeacherPayment
                                ? 'bg-[#CC0033]/10 text-[#CC0033] dark:text-red-300'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {isTeacherPayment
                                ? <Landmark aria-hidden="true" className="h-5 w-5" />
                                : <Receipt aria-hidden="true" className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-950 dark:text-white">{activity.person_name}</p>
                              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{activity.label}</p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className={`font-bold tabular-nums ${amountClass}`}>
                              {isTeacherPayment ? '−' : '+'}{formatCurrency(activity.amount)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              <time dateTime={activity.activity_date || undefined}>{formatDate(activity.activity_date)}</time>
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="Aucune activité financière"
                  description="Les encaissements et paiements récents seront regroupés ici."
                  actionLabel="Ouvrir les paiements"
                  to="/payments/tuition"
                />
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
