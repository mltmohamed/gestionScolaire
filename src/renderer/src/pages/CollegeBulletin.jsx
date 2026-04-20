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

  // État pour gérer les données de bulletin de chaque élève
  const [bulletinDataMap, setBulletinDataMap] = useState({});

  const [editingCell, setEditingCell] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBulletin, setViewingBulletin] = useState(null);
  const [noteInputMode, setNoteInputMode] = useState('table'); // 'table' ou 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].key);
  
  // États pour la navigation par classe
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedMonthForClass, setSelectedMonthForClass] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [navigationStep, setNavigationStep] = useState('class'); // 'class', 'month', 'students', 'bulletin'

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

  const handleGenerateClassBulletins = async () => {
    setIsGenerating(true);
    try {
      const selectedStudentsData = collegeStudents
        .filter(s => selectedStudentIds.includes(s.id))
        .sort((a, b) => a.last_name.localeCompare(b.last_name));

      // Générer le HTML pour tous les bulletins
      let allBulletinsHTML = `
        <html>
          <head>
            <title>Bulletins de ${selectedClassId ? collegeClasses.find(c => c.id === selectedClassId)?.name : 'Classe'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .bulletin { page-break-after: always; margin-bottom: 30px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .student-info { margin: 20px 0; }
              .grades-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .grades-table th, .grades-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              .grades-table th { background-color: #f2f2f2; }
              .footer { margin-top: 30px; text-align: center; }
            </style>
          </head>
          <body>
      `;

      for (const student of selectedStudentsData) {
        const studentBulletinData = await getBulletin(student.id, academicYear);
        const bulletinHTML = generateBulletinHTML(student, studentBulletinData.data);
        allBulletinsHTML += bulletinHTML;
      }

      allBulletinsHTML += `
          </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre avec tous les bulletins
      const printWindow = window.open('', '_blank');
      printWindow.document.write(allBulletinsHTML);
      printWindow.document.close();
      
      // Attendre un peu avant d'imprimer
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);

      toast.success(`${selectedStudentIds.length} bulletin(s) généré(s) avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la génération des bulletins:', error);
      toast.error('Erreur lors de la génération des bulletins');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBulletinHTML = (student, bulletinData) => {
    const selectedClass = collegeClasses.find(c => c.id === selectedClassId);
    
    return `
      <div class="bulletin">
        <div class="header">
          <h1>BULLETIN SCOLAIRE</h1>
          <h2>Établissement LA SAGESSE</h2>
          <p>Année scolaire ${academicYear}</p>
          <p>${bulletinData?.period || '1er trimestre'} - ${bulletinData?.sequence || 'Séquence 1'}</p>
        </div>
        
        <div class="student-info">
          <h3>Informations de l'élève</h3>
          <p><strong>Nom:</strong> ${student.first_name} ${student.last_name}</p>
          <p><strong>Matricule:</strong> ${student.matricule}</p>
          <p><strong>Classe:</strong> ${selectedClass?.name}</p>
        </div>
        
        <table class="grades-table">
          <thead>
            <tr>
              <th>Matière</th>
              ${MONTHS.map(month => `<th>${month.label}</th>`).join('')}
              <th>Moyenne</th>
            </tr>
          </thead>
          <tbody>
            ${COLLEGE_SUBJECTS.map(subject => {
              const notes = MONTHS.map(month => bulletinData?.subjects?.[subject]?.[month.key] || '-');
              const average = notes.filter(n => n !== '-' && n !== '').length > 0 
                ? (notes.filter(n => n !== '-' && n !== '').reduce((sum, n) => sum + parseFloat(n), 0) / notes.filter(n => n !== '-' && n !== '').length).toFixed(2)
                : '-';
              
              return `
                <tr>
                  <td style="text-align: left;">${subject}</td>
                  ${notes.map(note => `<td>${note}</td>`).join('')}
                  <td><strong>${average}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <h3>Appréciation générale</h3>
          <p>${bulletinData?.appreciation || 'Aucune appréciation renseignée'}</p>
          <p style="margin-top: 20px;">
            <em>Fait à ${new Date().toLocaleDateString()}, le ${new Date().toLocaleDateString()}</em>
          </p>
        </div>
      </div>
    `;
  };

  const handleViewBulletin = () => {
    console.log('handleViewBulletin appelé - CollegeBulletin');
    console.log('selectedStudent:', selectedStudent);
    console.log('selectedClass:', selectedClass);
    console.log('bulletinData:', bulletinData);
    
    if (!selectedStudent || !selectedClass) {
      console.log('Élève ou classe non sélectionné, retour - CollegeBulletin');
      return;
    }
    
    // Calculer les moyennes et statistiques
    console.log('Début du calcul des sujets');
    console.log('bulletinData.subjects:', bulletinData.subjects);
    console.log('COLLEGE_SUBJECTS:', COLLEGE_SUBJECTS);
    
    const subjectsData = COLLEGE_SUBJECTS.map(subject => {
      console.log('Traitement de la matière:', subject);
      console.log('Notes pour cette matière:', bulletinData.subjects[subject]);
      
      const notes = MONTHS.map(month => bulletinData.subjects[subject]?.[month.key] || '').filter(note => note !== '');
      console.log('Notes filtrées:', notes);
      
      const average = notes.length > 0 ? (notes.reduce((sum, note) => sum + parseFloat(note), 0) / notes.length).toFixed(2) : '';
      console.log('Moyenne calculée:', average);
      
      const maxNote = notes.length > 0 ? Math.max(...notes.map(note => parseFloat(note))) : '';
      const minNote = notes.length > 0 ? Math.min(...notes.map(note => parseFloat(note))) : '';
      
      const result = {
        name: subject,
        notes: MONTHS.map(month => bulletinData.subjects[subject]?.[month.key] || ''),
        average,
        maxNote,
        minNote,
        appreciation: average ? getSubjectAppreciation(parseFloat(average)) : ''
      };
      
      console.log('Résultat pour la matière:', result);
      return result;
    });
    
    console.log('subjectsData final:', subjectsData);

    console.log('Calcul de la moyenne générale');
    const subjectsWithAverage = subjectsData.filter(s => s.average !== '');
    console.log('Matières avec moyenne:', subjectsWithAverage.length);
    
    const generalAverage = subjectsWithAverage.length > 0 
      ? subjectsWithAverage.reduce((sum, s) => sum + parseFloat(s.average), 0) / subjectsWithAverage.length 
      : 0;
    
    console.log('Moyenne générale calculée:', generalAverage);

    const rank = calculateRank(generalAverage);
    const classAverage = calculateClassAverage();
    
    console.log('Préparation des données du bulletin');
    const bulletinDataForView = {
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
    };
    
    console.log('Données du bulletin préparées:', bulletinDataForView);
    setViewingBulletin(bulletinDataForView);
    
    console.log('Ouverture de la dialog de visualisation');
    setIsViewDialogOpen(true);
  };

  const getSubjectAppreciation = (average) => {
    if (average >= 16) return 'Excellent';
    if (average >= 14) return 'Très bien';
    if (average >= 12) return 'Bien';
    if (average >= 10) return 'Assez bien';
    if (average >= 8) return 'Passable';
    return 'Insuffisant';
  };

  const getGeneralAppreciation = (average) => {
    if (average >= 16) return 'Excellent travail, continuez ainsi!';
    if (average >= 14) return 'Très bon travail, félicitations!';
    if (average >= 12) return 'Bon travail, continuez vos efforts!';
    if (average >= 10) return 'Assez bon travail, room for improvement!';
    if (average >= 8) return 'Travail acceptable, plus d\'efforts nécessaires';
    return 'Travail insuffisant, beaucoup d\'efforts requis';
  };

  const calculateRank = (average) => {
    // Simuler le calcul de rang (à remplacer avec la vraie logique)
    return `${Math.floor(Math.random() * 20) + 1}/${Math.floor(Math.random() * 10) + 20}`;
  };

  const calculateClassAverage = () => {
    // Simuler la moyenne de classe (à remplacer avec la vraie logique)
    return (Math.random() * 2 + 12).toFixed(2);
  };

  // Fonctions pour le suivi de progression
  const getStudentCompletionStatus = (studentId) => {
    const studentBulletin = bulletinDataMap[studentId] || {};
    const notesCount = COLLEGE_SUBJECTS.filter(subject => 
      studentBulletin.subjects?.[subject]?.[selectedMonthForClass] && 
      studentBulletin.subjects[subject][selectedMonthForClass] !== ''
    ).length;
    
    let status = 'none';
    if (notesCount === COLLEGE_SUBJECTS.length) {
      status = 'complete';
    } else if (notesCount > 0) {
      status = 'partial';
    }
    
    return { status, notesCount };
  };

  const getCompletedStudentsCount = () => {
    const selectedClass = collegeClasses.find(cls => cls.id === selectedClassId);
    const classStudents = collegeStudents.filter(s => s.class_id === selectedClassId);
    
    return classStudents.filter(student => {
      const status = getStudentCompletionStatus(student.id);
      return status.status === 'complete';
    }).length;
  };

  const isAllStudentsCompleted = () => {
    const selectedClass = collegeClasses.find(cls => cls.id === selectedClassId);
    const classStudents = collegeStudents.filter(s => s.class_id === selectedClassId);
    
    return classStudents.every(student => {
      const status = getStudentCompletionStatus(student.id);
      return status.status === 'complete';
    });
  };

  const handlePrintClassBulletins = async () => {
    if (!isAllStudentsCompleted()) {
      toast.error('Tous les élèves doivent avoir leurs notes complètes avant d\'imprimer');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedClass = collegeClasses.find(cls => cls.id === selectedClassId);
      const classStudents = collegeStudents
        .filter(s => s.class_id === selectedClassId)
        .sort((a, b) => a.last_name.localeCompare(b.last_name));

      // Générer le HTML pour tous les bulletins du mois
      let allBulletinsHTML = `
        <html>
          <head>
            <title>Bulletins de ${selectedClass?.name} - ${MONTHS.find(m => m.key === selectedMonthForClass)?.label}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .bulletin { page-break-after: always; margin-bottom: 30px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .student-info { margin: 20px 0; }
              .grades-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .grades-table th, .grades-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              .grades-table th { background-color: #f2f2f2; }
              .footer { margin-top: 30px; text-align: center; }
            </style>
          </head>
          <body>
      `;

      for (const student of classStudents) {
        const studentBulletinData = await getBulletin(student.id, academicYear);
        const bulletinHTML = generateClassBulletinHTML(student, studentBulletinData.data);
        allBulletinsHTML += bulletinHTML;
      }

      allBulletinsHTML += `
          </body>
        </html>
      `;

      // Ouvrir une nouvelle fenêtre avec tous les bulletins
      const printWindow = window.open('', '_blank');
      printWindow.document.write(allBulletinsHTML);
      printWindow.document.close();
      
      // Attendre un peu avant d'imprimer
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);

      toast.success(`Bulletins de ${classStudents.length} élève(s) pour ${MONTHS.find(m => m.key === selectedMonthForClass)?.label} générés avec succès !`);
    } catch (error) {
      console.error('Erreur lors de la génération des bulletins:', error);
      toast.error('Erreur lors de la génération des bulletins');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateClassBulletinHTML = (student, bulletinData) => {
    const selectedClass = collegeClasses.find(c => c.id === selectedClassId);
    
    return `
      <div class="bulletin">
        <div class="header">
          <h1>BULLETIN SCOLAIRE</h1>
          <h2>Établissement LA SAGESSE</h2>
          <p>Année scolaire ${academicYear}</p>
          <p>${bulletinData?.period || '1er trimestre'} - ${MONTHS.find(m => m.key === selectedMonthForClass)?.label}</p>
        </div>
        
        <div class="student-info">
          <h3>Informations de l'élève</h3>
          <p><strong>Nom:</strong> ${student.first_name} ${student.last_name}</p>
          <p><strong>Matricule:</strong> ${student.matricule}</p>
          <p><strong>Classe:</strong> ${selectedClass?.name}</p>
        </div>
        
        <table class="grades-table">
          <thead>
            <tr>
              <th style="text-align: left;">Matière</th>
              <th>Note du ${MONTHS.find(m => m.key === selectedMonthForClass)?.label}</th>
            </tr>
          </thead>
          <tbody>
            ${COLLEGE_SUBJECTS.map(subject => {
              const note = bulletinData?.subjects?.[subject]?.[selectedMonthForClass] || '-';
              
              return `
                <tr>
                  <td style="text-align: left;">${subject}</td>
                  <td><strong>${note}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <h3>Appréciation générale</h3>
          <p>${bulletinData?.appreciation || 'Aucune appréciation renseignée'}</p>
          <p style="margin-top: 20px;">
            <em>Fait à ${new Date().toLocaleDateString()}, le ${new Date().toLocaleDateString()}</em>
          </p>
        </div>
      </div>
    `;
  };

  const selectedStudent = collegeStudents.find(s => s.id === selectedStudentId);
  const selectedClass = collegeClasses.find(c => c.id === selectedStudent?.class_id);

  // Support des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSaveBulletin();
            break;
          case 'v':
            e.preventDefault();
            handleViewBulletin();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveBulletin, handleViewBulletin]);

  if (viewMode === 'welcome') {
    if (navigationStep === 'class') {
      // Vue de sélection de classe
      return (
        <div className="space-y-6 fade-in">
          {ToastComponent}
          
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Bulletins du Second Cycle</h1>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sélectionnez une classe pour gérer les bulletins des élèves du second cycle (7e à 9e année)
            </p>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collegeClasses.map((cls) => (
                  <Card 
                    key={cls.id} 
                    className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 hover:border-purple-300"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setNavigationStep('month');
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{cls.name}</h3>
                      <p className="text-muted-foreground mb-2">{cls.level}</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Année: {cls.academic_year}</p>
                        <p>Capacité: {cls.max_students} élèves</p>
                        <p className="font-medium text-purple-600">
                          {collegeStudents.filter(s => s.class_id === cls.id).length} élèves inscrits
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {collegeClasses.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Aucune classe de second cycle trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } else if (navigationStep === 'month') {
      // Vue de sélection du mois pour la classe
      const selectedClass = collegeClasses.find(cls => cls.id === selectedClassId);
      
      return (
        <div className="space-y-6 fade-in">
          {ToastComponent}
          
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setNavigationStep('class')} className="mb-2">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Retour aux classes
            </Button>
            <h1 className="text-3xl font-bold">
              {selectedClass?.name} - {selectedClass?.level}
            </h1>
            <div></div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <div className="text-center mb-6">
              <h3 className="font-semibold text-lg mb-2">Sélectionnez le mois du bulletin</h3>
              <p className="text-muted-foreground">
                Choisissez le mois pour lequel vous souhaitez saisir les notes des bulletins
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {MONTHS.map((month) => (
                <Card 
                  key={month.key}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-105 ${
                    selectedMonthForClass === month.key 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'hover:border-purple-300'
                  }`}
                  onClick={() => {
                    setSelectedMonthForClass(month.key);
                    setNavigationStep('students');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      selectedMonthForClass === month.key 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold">{month.label}</h4>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (navigationStep === 'students') {
      // Vue de sélection des élèves dans la classe
      const selectedClass = collegeClasses.find(cls => cls.id === selectedClassId);
      const classStudents = collegeStudents
        .filter(s => s.class_id === selectedClassId)
        .sort((a, b) => a.last_name.localeCompare(b.last_name)); // Tri alphabétique
      
      return (
        <div className="space-y-6 fade-in">
          {ToastComponent}
          
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setNavigationStep('month')} className="mb-2">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Retour aux mois
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold">
                {selectedClass?.name} - {selectedClass?.level}
              </h1>
              <p className="text-muted-foreground">
                Bulletin du mois : {MONTHS.find(m => m.key === selectedMonthForClass)?.label}
              </p>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!isAllStudentsCompleted()}
              onClick={() => handlePrintClassBulletins()}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer la classe
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Élèves de la classe</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Notes complètes
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    Notes partielles
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Aucune note
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Progression globale</div>
                <div className="text-lg font-semibold">
                  {getCompletedStudentsCount()}/{classStudents.length} élèves
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classStudents.map((student) => {
                const completionStatus = getStudentCompletionStatus(student.id);
                
                return (
                  <Card 
                    key={student.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      completionStatus === 'complete' 
                        ? 'border-green-500 bg-green-50' 
                        : completionStatus === 'partial'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      setViewMode('entry');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            completionStatus === 'complete' 
                              ? 'bg-green-600 text-white' 
                              : completionStatus === 'partial'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-red-600 text-white'
                          }`}>
                            {completionStatus === 'complete' ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : completionStatus === 'partial' ? (
                              <AlertCircle className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{student.first_name} {student.last_name}</p>
                            <p className="text-sm text-muted-foreground">{student.matricule}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progression:</span>
                          <span className="font-medium">{completionStatus.notesCount}/{COLLEGE_SUBJECTS.length} notes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              completionStatus === 'complete' ? 'bg-green-500' : 
                              completionStatus === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(completionStatus.notesCount / COLLEGE_SUBJECTS.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          {completionStatus === 'complete' ? 'Complet' : 
                           completionStatus === 'partial' ? 'En cours' : 'Non commencé'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      );
    }
  }

  if (viewMode === 'entry') {
    const selectedClass = collegeClasses.find(cls => cls.id === selectedClassId);
    const currentStudent = collegeStudents.find(s => s.id === selectedStudentId);
    
    // Charger les données du bulletin de l'élève actuel
    useEffect(() => {
      if (selectedStudentId && selectedMonthForClass) {
        loadStudentBulletinData(selectedStudentId);
      }
    }, [selectedStudentId, selectedMonthForClass]);

    const loadStudentBulletinData = async (studentId) => {
      try {
        const result = await getBulletin(studentId, academicYear);
        if (result.success && result.data) {
          setBulletinDataMap(prev => ({
            ...prev,
            [studentId]: result.data
          }));
        } else {
          // Initialiser les données si elles n'existent pas
          setBulletinDataMap(prev => ({
            ...prev,
            [studentId]: {
              student_id: studentId,
              academic_year: academicYear,
              period: '',
              sequence: '',
              appreciation: '',
              subjects: {}
            }
          }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du bulletin:', error);
      }
    };

    const handleCellEdit = (subject, month, value) => {
      setBulletinDataMap(prev => ({
        ...prev,
        [selectedStudentId]: {
          ...prev[selectedStudentId],
          subjects: {
            ...prev[selectedStudentId]?.subjects,
            [subject]: {
              ...prev[selectedStudentId]?.subjects?.[subject],
              [month]: value
            }
          }
        }
      }));
    };

    const handleSaveStudentBulletin = async () => {
      try {
        const studentData = bulletinDataMap[selectedStudentId];
        if (studentData) {
          await saveBulletin(studentData);
          toast.success(`Bulletin de ${currentStudent?.first_name} ${currentStudent?.last_name} enregistré`);
        }
      } catch (error) {
        toast.error('Erreur lors de l\'enregistrement du bulletin');
      }
    };

    const clampNote = (value) => {
      const num = parseFloat(value);
      if (isNaN(num)) return '';
      return Math.min(Math.max(num, 0), 10).toString();
    };
    
    return (
      <div className="space-y-6 fade-in">
        {ToastComponent}
        
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setViewMode('welcome')} className="mb-2">
              <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
              Retour aux élèves
            </Button>
            <h1 className="text-3xl font-bold">
              Bulletin - {currentStudent?.first_name} {currentStudent?.last_name}
            </h1>
            <p className="text-muted-foreground">
              {selectedClass?.name} - {selectedClass?.level} - {academicYear}
            </p>
            <p className="text-sm text-purple-600 font-medium">
              Mois : {MONTHS.find(m => m.key === selectedMonthForClass)?.label}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              // Calculer et afficher le bulletin de l'élève
              const studentData = bulletinDataMap[selectedStudentId];
              if (studentData) {
                setBulletinData(studentData);
                handleViewBulletin();
              }
            }}>
              <Eye className="mr-2 h-4 w-4" />
              Visualiser
            </Button>
            <Button onClick={handleSaveStudentBulletin}>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                // Passer à l'élève suivant
                const classStudents = collegeStudents
                  .filter(s => s.class_id === selectedClassId)
                  .sort((a, b) => a.last_name.localeCompare(b.last_name));
                const currentIndex = classStudents.findIndex(s => s.id === selectedStudentId);
                if (currentIndex < classStudents.length - 1) {
                  setSelectedStudentId(classStudents[currentIndex + 1].id);
                } else {
                  // Retourner à la liste des élèves
                  setViewMode('welcome');
                }
              }}
            >
              Élève suivant
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Notes - {MONTHS.find(m => m.key === selectedMonthForClass)?.label}</CardTitle>
                <CardDescription>
                  Saisissez les notes pour le mois sélectionné
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {COLLEGE_SUBJECTS.map((subject) => (
                    <div key={subject} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <label className="font-medium text-sm">{subject}</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="text"
                            value={bulletinDataMap[selectedStudentId]?.subjects?.[subject]?.[selectedMonthForClass] || ''}
                            onChange={(e) => handleCellEdit(subject, selectedMonthForClass, clampNote(e.target.value))}
                            className="w-24 text-center"
                            placeholder="/10"
                            maxLength={4}
                          />
                          <span className="text-sm text-muted-foreground">/10</span>
                        </div>
                      </div>
                      
                      {/* Indicateur de statut */}
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                          {bulletinDataMap[selectedStudentId]?.subjects?.[subject]?.[selectedMonthForClass] ? 'Saisie' : 'En attente'}
                        </div>
                        {bulletinDataMap[selectedStudentId]?.subjects?.[subject]?.[selectedMonthForClass] && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Statistiques du mois pour cet élève */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Statistiques du mois</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Notes saisies:</span>
                      <span className="ml-2 font-medium">
                        {COLLEGE_SUBJECTS.filter(s => bulletinDataMap[selectedStudentId]?.subjects?.[s]?.[selectedMonthForClass]).length}/{COLLEGE_SUBJECTS.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Moyenne du mois:</span>
                      <span className="ml-2 font-medium">
                        {(() => {
                          const notes = COLLEGE_SUBJECTS
                            .map(s => bulletinDataMap[selectedStudentId]?.subjects?.[s]?.[selectedMonthForClass])
                            .filter(n => n !== '' && n !== undefined);
                          if (notes.length === 0) return '-';
                          const avg = notes.reduce((sum, n) => sum + parseFloat(n), 0) / notes.length;
                          return avg.toFixed(2);
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Meilleure note:</span>
                      <span className="ml-2 font-medium">
                        {(() => {
                          const notes = COLLEGE_SUBJECTS
                            .map(s => bulletinDataMap[selectedStudentId]?.subjects?.[s]?.[selectedMonthForClass])
                            .filter(n => n !== '' && n !== undefined)
                            .map(n => parseFloat(n));
                          if (notes.length === 0) return '-';
                          return Math.max(...notes).toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Informations de l'élève */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de l'élève</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom complet</label>
                  <p className="text-sm">{currentStudent?.first_name} {currentStudent?.last_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Matricule</label>
                  <p className="text-sm">{currentStudent?.matricule}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Classe</label>
                  <p className="text-sm">{selectedClass?.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Progression */}
            <Card>
              <CardHeader>
                <CardTitle>Progression du mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Notes saisies:</span>
                    <span className="font-medium">
                      {COLLEGE_SUBJECTS.filter(s => bulletinDataMap[selectedStudentId]?.subjects?.[s]?.[selectedMonthForClass]).length}/{COLLEGE_SUBJECTS.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(COLLEGE_SUBJECTS.filter(s => bulletinDataMap[selectedStudentId]?.subjects?.[s]?.[selectedMonthForClass]).length / COLLEGE_SUBJECTS.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informations du bulletin */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du bulletin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Période</label>
                  <Input
                    type="text"
                    value={bulletinDataMap[selectedStudentId]?.period || ''}
                    onChange={(e) => setBulletinDataMap(prev => ({
                      ...prev,
                      [selectedStudentId]: {
                        ...prev[selectedStudentId],
                        period: e.target.value
                      }
                    }))}
                    placeholder="Ex: 1er trimestre"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Séquence</label>
                  <Input
                    type="text"
                    value={bulletinDataMap[selectedStudentId]?.sequence || ''}
                    onChange={(e) => setBulletinDataMap(prev => ({
                      ...prev,
                      [selectedStudentId]: {
                        ...prev[selectedStudentId],
                        sequence: e.target.value
                      }
                    }))}
                    placeholder="Ex: Séquence 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Appréciation générale</label>
                  <textarea
                    value={bulletinDataMap[selectedStudentId]?.appreciation || ''}
                    onChange={(e) => setBulletinDataMap(prev => ({
                      ...prev,
                      [selectedStudentId]: {
                        ...prev[selectedStudentId],
                        appreciation: e.target.value
                      }
                    }))}
                    className="w-full min-h-[100px] p-3 border rounded-md resize-none text-sm"
                    placeholder="Appréciation générale de l'élève..."
                  />
                </div>
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
                  <p><strong>Moyenne générale:</strong> <span className="text-lg font-bold text-purple-600">{viewingBulletin.generalAverage}/20</span></p>
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
                  <p className="text-sm font-medium text-purple-600">{viewingBulletin.generalAppreciation}</p>
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
