import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { useBulletin } from '@/hooks/useBulletin';
import { LayoutGrid, PenLine, Printer, Search, FileText, ChevronRight, Users, GraduationCap, Eye, X, Loader2, Calendar, CheckCircle, AlertCircle, TrendingUp, Save, Keyboard } from 'lucide-react';
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

const SUBJECTS = [
  'Lecture',
  'Écriture',
  'Vocabulaire',
  'Dessin',
  'Chant',
  'Récitation',
  'Grammaire',
  'Conjugaison',
  'Mathématiques',
  'Exp. É./Réc.',
  'Dictée',
  'Quest. Dictée',
  'Quest. de Cours',
  'Économie Familiale',
  'Morale',
  'Anglais',
  'Informatique',
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

export default function PrimaryBulletin() {
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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBulletin, setViewingBulletin] = useState(null);
  const [noteInputMode, setNoteInputMode] = useState('table'); // 'table' ou 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].key);
  
  // États pour la navigation par classe
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [navigationStep, setNavigationStep] = useState('class'); // 'class', 'students', 'bulletin'

  const primaryClasses = useMemo(() => {
    return classes.filter(cls => {
      const level = String(cls.level || '').trim().toLowerCase();
      // Supporter plusieurs formats pour les niveaux du primaire
      return ['3e année', '4e année', '5e année', '6e année', '3ème année', '4ème année', '5ème année', '6ème année'].includes(level);
    });
  }, [classes]);

  const primaryStudents = useMemo(() => {
    return students.filter(student => {
      const studentClass = primaryClasses.find(cls => cls.id === student.class_id);
      return studentClass !== undefined;
    });
  }, [students, primaryClasses]);

  const filteredStudents = useMemo(() => {
    return primaryStudents.filter(student => {
      const q = (studentSearchTerm || '').trim().toLowerCase();
      const matchSearch = !q || 
        (student.first_name || '').toLowerCase().includes(q) || 
        (student.last_name || '').toLowerCase().includes(q) ||
        (student.matricule || '').toLowerCase().includes(q);

      const matchClass = studentFilters.class_id === 'all' || String(student.class_id || '') === String(studentFilters.class_id);
      const studentClass = primaryClasses.find(cls => cls.id === student.class_id);
      const matchYear = studentFilters.academic_year === 'all' || (studentClass?.academic_year || '') === studentFilters.academic_year;

      return matchSearch && matchClass && matchYear;
    });
  }, [primaryStudents, studentSearchTerm, studentFilters, primaryClasses]);

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

  const handleViewBulletin = () => {
    console.log('handleViewBulletin appelé');
    console.log('selectedStudent:', selectedStudent);
    console.log('selectedClass:', selectedClass);
    console.log('bulletinData:', bulletinData);
    
    if (!selectedStudent || !selectedClass) {
      console.log('Élève ou classe non sélectionné, retour');
      return;
    }
    
    // Calculer les moyennes et statistiques
    const subjectsData = SUBJECTS.map(subject => {
      const notes = MONTHS.map(month => bulletinData.subjects[subject]?.[month.key] || '').filter(note => note !== '');
      const average = notes.length > 0 ? (notes.reduce((sum, note) => sum + parseFloat(note), 0) / notes.length).toFixed(2) : '';
      const maxNote = notes.length > 0 ? Math.max(...notes.map(note => parseFloat(note))) : '';
      const minNote = notes.length > 0 ? Math.min(...notes.map(note => parseFloat(note))) : '';
      
      return {
        name: subject,
        notes: MONTHS.map(month => bulletinData.subjects[subject]?.[month.key] || ''),
        average,
        maxNote,
        minNote,
        appreciation: average ? getSubjectAppreciation(parseFloat(average)) : ''
      };
    });

    const subjectsWithAverage = subjectsData.filter(s => s.average !== '');
    const generalAverage = subjectsWithAverage.length > 0 
      ? subjectsWithAverage.reduce((sum, s) => sum + parseFloat(s.average), 0) / subjectsWithAverage.length 
      : 0;

    const rank = calculateRank(generalAverage);
    const classAverage = calculateClassAverage();

    setViewingBulletin({
      student: selectedStudent,
      class: selectedClass,
      academicYear,
      period: bulletinData.period || '1er trimestre',
      sequence: bulletinData.sequence || 'Séquence 1',
      subjects: subjectsData,
      generalAverage: generalAverage ? generalAverage.toFixed(2) : '',
      rank,
      classAverage,
      appreciation: bulletinData.appreciation || '',
      generalAppreciation: getGeneralAppreciation(generalAverage)
    });
    
    console.log('Données du bulletin préparées:', viewingBulletin);
    setViewingBulletin({
      student: selectedStudent,
      class: selectedClass,
      academicYear,
      period: bulletinData.period || '1er trimestre',
      sequence: bulletinData.sequence || 'Séquence 1',
      subjects: subjectsData,
      generalAverage: generalAverage ? generalAverage.toFixed(2) : '',
      rank,
      classAverage,
      appreciation: bulletinData.appreciation || '',
      generalAppreciation: getGeneralAppreciation(generalAverage)
    });
    
    console.log('Ouverture de la dialog de visualisation');
    setIsViewDialogOpen(true);
  };

  const getSubjectAppreciation = (average) => {
    if (average >= 9) return 'Excellent';
    if (average >= 8) return 'Très bien';
    if (average >= 7) return 'Bien';
    if (average >= 6) return 'Assez bien';
    if (average >= 5) return 'Passable';
    return 'Insuffisant';
  };

  const getGeneralAppreciation = (average) => {
    if (average >= 9) return 'Excellent travail, continuez ainsi!';
    if (average >= 8) return 'Très bon travail, félicitations!';
    if (average >= 7) return 'Bon travail, continuez vos efforts!';
    if (average >= 6) return 'Assez bon travail, room for improvement!';
    if (average >= 5) return 'Travail acceptable, plus d\'efforts nécessaires';
    return 'Travail insuffisant, beaucoup d\'efforts requis';
  };

  const calculateRank = (average) => {
    // Simuler le calcul de rang (à remplacer avec la vraie logique)
    return `${Math.floor(Math.random() * 20) + 1}/${Math.floor(Math.random() * 10) + 20}`;
  };

  const calculateClassAverage = () => {
    // Simuler la moyenne de classe (à remplacer avec la vraie logique)
    return (Math.random() * 2 + 7).toFixed(2);
  };

  const selectedStudent = primaryStudents.find(s => s.id === selectedStudentId);
  const selectedClass = primaryClasses.find(c => c.id === selectedStudent?.class_id);

  if (viewMode === 'welcome') {
    return (
      <div className="space-y-6 fade-in">
        {ToastComponent}
        
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Bulletins du Primaire</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Gérez les bulletins des élèves du primaire (3e à 6e année)
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
                  {primaryClasses.map((cls) => (
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
                const studentClass = primaryClasses.find(cls => cls.id === student.class_id);
                return (
                  <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleStudentSelect(student.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
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
            <Button variant="outline" onClick={handleViewBulletin}>
              <Eye className="mr-2 h-4 w-4" />
              Visualiser
            </Button>
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
                      {SUBJECTS.map((subject) => (
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

  return (
    <>
      {/* Dialog de visualisation du bulletin */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualisation du Bulletin</DialogTitle>
          </DialogHeader>

          {viewingBulletin && (
            <div className="py-2 space-y-6">
              {/* En-tête du bulletin */}
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold">BULLETIN SCOLAIRE</h1>
                <p className="text-lg font-semibold">Établissement LA SAGESSE</p>
                <p className="text-sm text-muted-foreground">Année scolaire {viewingBulletin.academicYear}</p>
                <p className="text-sm text-muted-foreground">{viewingBulletin.period} - {viewingBulletin.sequence}</p>
              </div>

              {/* Informations de l'élève */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <h3 className="font-semibold mb-2">Informations de l'élève</h3>
                  <p><strong>Nom:</strong> {viewingBulletin.student.first_name} {viewingBulletin.student.last_name}</p>
                  <p><strong>Matricule:</strong> {viewingBulletin.student.matricule}</p>
                  <p><strong>Classe:</strong> {viewingBulletin.class.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Résultats</h3>
                  <p><strong>Moyenne générale:</strong> <span className="text-lg font-bold text-blue-600">{viewingBulletin.generalAverage}/20</span></p>
                  <p><strong>Rang:</strong> {viewingBulletin.rank}</p>
                  <p><strong>Moyenne classe:</strong> {viewingBulletin.classAverage}/20</p>
                </div>
              </div>

              {/* Tableau des notes */}
              <div>
                <h3 className="font-semibold mb-4">Notes par matière</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Matière</th>
                        {MONTHS.map(month => (
                          <th key={month.key} className="border border-gray-300 px-2 py-2 text-center text-sm">{month.label}</th>
                        ))}
                        <th className="border border-gray-300 px-2 py-2 text-center">Moyenne</th>
                        <th className="border border-gray-300 px-2 py-2 text-center">Max</th>
                        <th className="border border-gray-300 px-2 py-2 text-center">Min</th>
                        <th className="border border-gray-300 px-2 py-2 text-center">Appréciation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingBulletin.subjects.map((subject, index) => (
                        <tr key={subject.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{subject.name}</td>
                          {subject.notes.map((note, noteIndex) => (
                            <td key={noteIndex} className="border border-gray-300 px-2 py-2 text-center">
                              {note || '-'}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-2 py-2 text-center font-semibold">
                            {subject.average || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {subject.maxNote || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            {subject.minNote || '-'}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              subject.appreciation === 'Excellent' ? 'bg-green-100 text-green-800' :
                              subject.appreciation === 'Très bien' ? 'bg-blue-100 text-blue-800' :
                              subject.appreciation === 'Bien' ? 'bg-cyan-100 text-cyan-800' :
                              subject.appreciation === 'Assez bien' ? 'bg-yellow-100 text-yellow-800' :
                              subject.appreciation === 'Passable' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {subject.appreciation || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Appréciations */}
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Appréciation générale du professeur</h3>
                  <p className="text-sm italic">{viewingBulletin.appreciation || 'Aucune appréciation renseignée'}</p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Appréciation générale</h3>
                  <p className="text-sm font-medium text-blue-600">{viewingBulletin.generalAppreciation}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={() => {
              // Logique d'impression du bulletin
              window.print();
            }}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
