import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { Users, GraduationCap, School, Wallet, TrendingUp, Activity, User, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { stats, loading } = useDashboard();
  const navigate = useNavigate();

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Élèves Inscrits',
      value: stats.totalStudents,
      icon: GraduationCap,
      description: `${stats.activeStudents} actifs`,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/25',
    },
    {
      title: 'Enseignants',
      value: stats.totalTeachers,
      icon: Users,
      description: 'Équipe pédagogique',
      gradient: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/25',
    },
    {
      title: 'Classes Ouvertes',
      value: stats.totalClasses,
      icon: School,
      description: 'Niveaux disponibles',
      gradient: 'from-orange-500 to-amber-500',
      shadow: 'shadow-orange-500/25',
    },
    {
      title: 'Matières Enseignées',
      value: stats.totalSubjects,
      icon: Wallet, // Remplacé BookOpen par Wallet
      description: 'Programmes scolaires',
      gradient: 'from-emerald-500 to-green-500',
      shadow: 'shadow-emerald-500/25',
    },
  ];

  const getAvatar = (student) => {
    if (student.photo) {
      return <img src={student.photo} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-white/20 shadow-sm" />;
    }
    const color = student.gender === 'F' ? 'text-pink-400 bg-pink-400/10' : 'text-blue-400 bg-blue-400/10';
    return (
      <div className={`h-10 w-10 rounded-full flex items-center justify-center border border-white/10 ${color}`}>
        <User className="h-6 w-6" />
      </div>
    );
  };

  return (
    <div className="space-y-8 fade-in pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                Tableau de bord
              </h1>
              <p className="text-violet-100 text-lg max-w-xl">
                Suivez les performances et l'activité de votre établissement en temps réel.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/20">
              <Activity className="w-6 h-6 text-white" />
              <div>
                <p className="text-violet-100 text-sm">Élèves Actifs</p>
                <p className="text-white font-semibold">{stats.activeStudents} sur {stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className={`group relative overflow-hidden border-0 bg-white dark:bg-gray-900 ${stat.shadow} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}></div>
            
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {stat.title}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section combinée : Inscriptions et Paiements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dernières inscriptions */}
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-violet-100 dark:border-violet-900/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dernières inscriptions</h2>
                <p className="text-sm text-gray-500 mt-1">Les nouveaux élèves de l'établissement.</p>
              </div>
              <Button onClick={() => navigate('/students')} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25">
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {stats.recentStudents?.length > 0 ? (
                  stats.recentStudents.map((student) => (
                    <TableRow key={student.id} className="group hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-transparent dark:hover:from-violet-900/10">
                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          {getAvatar(student)}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{student.first_name} {student.last_name}</p>
                            <p className="text-xs text-gray-500">{student.class_name || 'Non assigné'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-600 dark:text-gray-400 p-4">
                        {new Date(student.enrollment_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-center py-12 text-gray-500">Aucune inscription récente.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Derniers paiements */}
        <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 p-6 border-b border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Paiements Récents</h2>
                <p className="text-sm text-gray-500 mt-1">Derniers frais de scolarité reçus.</p>
              </div>
              <Button onClick={() => navigate('/payments')} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25">
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {stats.recentTuition?.length > 0 ? (
                  stats.recentTuition.map((payment) => (
                    <TableRow key={payment.id} className="group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent dark:hover:from-emerald-900/10">
                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50">
                            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{payment.first_name} {payment.last_name}</p>
                            <p className="text-xs text-gray-500">{payment.description || 'Scolarité'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 p-4">
                        +{payment.amount.toLocaleString()} FCFA
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={2} className="text-center py-12 text-gray-500">Aucun paiement récent.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
