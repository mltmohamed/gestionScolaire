import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, School, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const result = await window.electronAPI.getDashboardStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Élèves',
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      description: `${stats?.activeStudents || 0} actifs`,
    },
    {
      title: 'Professeurs',
      value: stats?.totalTeachers || 0,
      icon: Users,
      description: 'Enseignants',
    },
    {
      title: 'Classes',
      value: stats?.totalClasses || 0,
      icon: School,
      description: `${stats?.totalSubjects || 0} matières`,
    },
    {
      title: 'Taux de réussite',
      value: '95%',
      icon: BookOpen,
      description: 'Moyenne générale',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de votre établissement
          </p>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Élèves récents */}
      <Card>
        <CardHeader>
          <CardTitle>Élèves récemment inscrits</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats?.recentStudents?.length > 0 ? (
                stats.recentStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.first_name} {student.last_name}
                    </TableCell>
                    <TableCell>{student.class_name || 'Non assigné'}</TableCell>
                    <TableCell>
                      {new Date(student.enrollment_date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        ● Actif
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucun élève trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
