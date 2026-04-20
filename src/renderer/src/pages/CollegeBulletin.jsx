import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { useBulletin } from '@/hooks/useBulletin';
import { LayoutGrid, PenLine, Printer, Search, FileText, ChevronRight, Users, GraduationCap, Eye, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const MONTHS = [
  { key: 'oct', label: 'OCT.' },
  { key: 'nov', label: 'NOV.' },
  { key: 'dec', label: 'DEC.' },
  { key: 'jan', label: 'JANV.' },
  { key: 'feb', label: 'FEV.' },
  { key: 'mar', label: 'MAR.' },
  { key: 'apr', label: 'AVR.' },
  { key: 'may', label: 'MAI.' },
  { key: 'jun', label: 'JUIN' },
];

const COLLEGE_SUBJECTS = [
  'Rédaction',
  'Dictée et questions',
  'Mathématiques',
  'Physique-Chimie',
  'Anglais',
  'Bio',
  'Hist-Géo',
  'ECM',
  'EPS',
  'Musique',
  'EF',
  'Dessin',
  'Lecture',
  'Récitation',
  'Conduite',
];

function clampNote(value) {
  if (value === '' || value === null || value === undefined) return '';
  const n = Number(String(value).replace(',', '.'));
  if (Number.isNaN(n)) return '';
  return Math.min(10, Math.max(0, n));
}

function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return Number(n).toFixed(2);
}

export default function CollegeBulletin() {
  const { students } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();
  const { loading: bulletinLoading, getBulletin, saveBulletin } = useBulletin();

  const defaultAcademicYear = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }, []);

  const [viewMode, setViewMode] = useState('welcome'); // 'welcome', 'entry', 'generate'
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentFilters, setStudentFilters] = useState({
    class_id: 'all',
    academic_year: 'all',
  });

  const [bulletinData, setBulletinData] = useState({
    student_id: '',
    academic_year: '',
    period: '',
    sequence: '',
    appreciation: '',
    subjects: {},
  });

  const [editingCell, setEditingCell] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const collegeClasses = useMemo(() => {
    return classes.filter(cls => {
      const level = String(cls.level || '').trim().toLowerCase();
      return ['7ème année', '8ème année', '9ème année'].includes(level);
    });
  }, [classes]);

  const collegeStudents = useMemo(() => {
    return students.filter(student => {
      const studentClass = collegeClasses.find(cls => cls.id === student.class_id);
      return studentClass !== undefined;
    });
  }, [students, collegeClasses]);

  const filteredStudents = useMemo(() => {
    return collegeStudents.filter(student => {
      const q = (studentSearchTerm || '').trim().toLowerCase();
      const matchSearch = !q || 
        (student.first_name || '').toLowerCase().includes(q) || 
        (student.last_name || '').toLowerCase().includes(q) ||
        (student.matricule || '').toLowerCase().includes(q);

      const matchClass = studentFilters.class_id === 'all' || String(student.class_id || '') === String(studentFilters.class_id);
      const studentClass = collegeClasses.find(cls => cls.id === student.class_id);
      const matchYear = studentFilters.academic_year === 'all' || (studentClass?.academic_year || '') === studentFilters.academic_year;

      return matchSearch && matchClass && matchYear;
    });
  }, [collegeStudents, studentSearchTerm, studentFilters, collegeClasses]);

  useEffect(() => {
    if (selectedStudentId && academicYear) {
      loadBulletinData();
    }
  }, [selectedStudentId, academicYear]);

  const loadBulletinData = useCallback(async () => {
    try {
      const result = await getBulletin(selectedStudentId, academicYear);
      if (result.success && result.data) {
        setBulletinData(result.data);
      } else {
        // Initialize empty bulletin data
        setBulletinData({
          student_id: selectedStudentId,
          academic_year: academicYear,
          period: '',
          sequence: '',
          appreciation: '',
          subjects: {},
        });
      }
    } catch (error) {
      console.error('Erreur chargement bulletin:', error);
      toast.error('Erreur lors du chargement du bulletin');
    }
  }, [selectedStudentId, academicYear, getBulletin, toast]);

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
    setViewMode('entry');
  };

  const handleCellEdit = (subject, field, value) => {
    setBulletinData(prev => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [subject]: {
          ...prev.subjects[subject],
          [field]: value,
        },
      },
    }));
  };

  const handleSaveBulletin = async () => {
    try {
      const result = await saveBulletin(bulletinData);
      if (result.success) {
        toast.success('Bulletin enregistré avec succès !');
      } else {
        toast.error(result.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur sauvegarde bulletin:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleGenerateBulletin = async () => {
    setIsGenerating(true);
    try {
      // Logic to generate bulletin PDF
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate generation
      toast.success('Bulletin généré avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la génération du bulletin');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedStudent = collegeStudents.find(s => s.id === selectedStudentId);
  const selectedClass = collegeClasses.find(c => c.id === selectedStudent?.class_id);

  if (viewMode === 'welcome') {
    return (
      <div className="space-y-6 fade-in">
        {ToastComponent}
        
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Bulletins du Collège</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gérez les bulletins des élèves du collège (7e à 9e année)
          </p>
          
          <div className="bg-muted/50 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="font-semibold mb-4">Rechercher un élève</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher par nom, prénom ou matricule..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  value={studentFilters.class_id}
                  onChange={(e) => setStudentFilters(prev => ({ ...prev, class_id: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Toutes les classes</option>
                  {collegeClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.level}
                    </option>
                  ))}
                </select>

                <select
                  value={studentFilters.academic_year}
                  onChange={(e) => setStudentFilters(prev => ({ ...prev, academic_year: e.target.value }))}
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
                    setStudentSearchTerm('');
                    setStudentFilters({ class_id: 'all', academic_year: 'all' });
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold mb-4">Élèves trouvés ({filteredStudents.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {filteredStudents.map((student) => {
                const studentClass = collegeClasses.find(cls => cls.id === student.class_id);
                return (
                  <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleStudentSelect(student.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          <p className="text-sm text-muted-foreground">{student.matricule}</p>
                          <p className="text-sm text-muted-foreground">{studentClass?.name}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'entry') {
    return (
      <div className="space-y-6 fade-in">
        {ToastComponent}
        
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setViewMode('welcome')} className="mb-2">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold">
              Bulletin - {selectedStudent?.first_name} {selectedStudent?.last_name}
            </h1>
            <p className="text-muted-foreground">
              {selectedClass?.name} - {selectedClass?.level} - {academicYear}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveBulletin}>
              <PenLine className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
            <Button onClick={handleGenerateBulletin} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              Générer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Notes par matière</CardTitle>
                <CardDescription>
                  Saisissez les notes pour chaque période
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Matière</th>
                        {MONTHS.map((month) => (
                          <th key={month.key} className="text-center p-2 min-w-[80px]">
                            {month.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COLLEGE_SUBJECTS.map((subject) => (
                        <tr key={subject} className="border-b">
                          <td className="p-2 font-medium">{subject}</td>
                          {MONTHS.map((month) => (
                            <td key={`${subject}-${month.key}`} className="p-2">
                              <Input
                                type="text"
                                value={bulletinData.subjects[subject]?.[month.key] || ''}
                                onChange={(e) => handleCellEdit(subject, month.key, clampNote(e.target.value))}
                                className="w-full text-center"
                                placeholder="/10"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Période</label>
                  <Input
                    type="text"
                    value={bulletinData.period || ''}
                    onChange={(e) => setBulletinData(prev => ({ ...prev, period: e.target.value }))}
                    placeholder="Ex: 1er trimestre"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Séquence</label>
                  <Input
                    type="text"
                    value={bulletinData.sequence || ''}
                    onChange={(e) => setBulletinData(prev => ({ ...prev, sequence: e.target.value }))}
                    placeholder="Ex: Séquence 1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appréciation générale</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={bulletinData.appreciation || ''}
                  onChange={(e) => setBulletinData(prev => ({ ...prev, appreciation: e.target.value }))}
                  className="w-full min-h-[150px] p-3 border rounded-md resize-none"
                  placeholder="Appréciation générale de l'élève..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
