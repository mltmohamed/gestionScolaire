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

export default function Bulletin() {
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
  const [bulletinType, setBulletinType] = useState('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentFilters, setStudentFilters] = useState({
    class_id: 'all',
    academic_year: 'all',
  });

  const [notes, setNotes] = useState(() => {
    const base = {};
    for (const subject of SUBJECTS) {
      base[subject] = {};
      for (const m of MONTHS) {
        base[subject][m.key] = '';
      }
    }
    return base;
  });

  const [visas, setVisas] = useState(() => {
    const base = {};
    for (const m of MONTHS) {
      base[m.key] = {
        maitre: '',
        directeur: '',
        parents: '',
        observations: '',
      };
    }
    return base;
  });

  const [decision, setDecision] = useState('');
  const [rangByMonth, setRangByMonth] = useState(() => {
    const base = {};
    for (const m of MONTHS) base[m.key] = '';
    return base;
  });
  const [rangGeneral, setRangGeneral] = useState('');
  const [moyennePremier, setMoyennePremier] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printPortalEl, setPrintPortalEl] = useState(null);
  const [bulkPortalEl, setBulkPortalEl] = useState(null);

  const [bulkExporting, setBulkExporting] = useState(false);
  const [bulkData, setBulkData] = useState([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [collegeTrimestreLabel, setCollegeTrimestreLabel] = useState('COMPOSITION DU 2e TRIMESTRE');
  const [collegeNotes, setCollegeNotes] = useState(() => {
    const base = {};
    for (const s of COLLEGE_SUBJECTS) {
      base[s] = {
        note_classe: '',
        note_compo: '', // Saisi par l'utilisateur
        comp_x2: '',    // Calculé ou saisi
        moyenne: '',    // Calculé : (classe + compo*2)/3
        coeff: '1',
        appreciation: '',
      };
    }
    return base;
  });

  const [primarySummary, setPrimarySummary] = useState(() => {
    const base = {};
    for (const m of MONTHS) {
      base[m.key] = {
        total: '',
        moy_classe: '',
        moy_compo: '',
        moy_generale: '',
        classement: '',
      };
    }
    return base;
  });
  const [collegeDecision, setCollegeDecision] = useState('');
  const [collegeRang, setCollegeRang] = useState('');
  const [collegeEffectif, setCollegeEffectif] = useState('');
  const [collegeMoyenne1, setCollegeMoyenne1] = useState('');
  const [collegeMoyenneDernier, setCollegeMoyenneDernier] = useState('');

  useEffect(() => {
    let el = document.getElementById('bulletin-print-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bulletin-print-portal';
      document.body.appendChild(el);
    }
    setPrintPortalEl(el);

    let bel = document.getElementById('bulletin-bulk-portal');
    if (!bel) {
      bel = document.createElement('div');
      bel.id = 'bulletin-bulk-portal';
      document.body.appendChild(bel);
    }
    setBulkPortalEl(bel);
  }, []);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return students.find((s) => String(s.id) === String(selectedStudentId)) || null;
  }, [students, selectedStudentId]);

  const classById = useMemo(() => {
    const map = new Map();
    for (const c of classes) {
      if (c && c.id != null) map.set(String(c.id), c);
    }
    return map;
  }, [classes]);

  const classAcademicYearOptions = useMemo(() => {
    const values = new Set();
    for (const c of classes) {
      const y = String(c.academic_year || '').trim();
      if (y) values.add(y);
    }
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [classes]);

  const classMatchesBulletinType = useCallback(
    (cls) => {
      if (!cls) return true;
      const levelStr = String(cls.level || '').trim();
      if (!levelStr) return true;

      // Extraire le chiffre (ex: "7ème année" -> 7)
      const match = levelStr.match(/(\d+)/);
      const level = match ? Number(match[1]) : null;

      if (!level) return true;

      if (bulletinType === 'college') return level >= 7 && level <= 9;
      if (bulletinType === 'primary') return level >= 3 && level <= 6;
      if (bulletinType === 'all') return level >= 3 && level <= 9;
      return true;
    },
    [bulletinType]
  );

  const filteredStudents = useMemo(() => {
    const q = String(studentSearchTerm || '').trim().toLowerCase();
    return students.filter((s) => {
      const first = String(s.first_name || '').toLowerCase();
      const last = String(s.last_name || '').toLowerCase();
      const mat = String(s.matricule || '').toLowerCase();

      const matchSearch = !q
        ? true
        : first.includes(q) || last.includes(q) || mat.includes(q) || `${last} ${first}`.includes(q);

      const matchClass =
        studentFilters.class_id === 'all'
          ? true
          : String(s.class_id || '') === String(studentFilters.class_id);

      const cls = s.class_id != null ? classById.get(String(s.class_id)) : null;
      const matchYear =
        studentFilters.academic_year === 'all'
          ? true
          : String(cls?.academic_year || '').trim() === String(studentFilters.academic_year || '').trim();

      const matchBulletinType = classMatchesBulletinType(cls);

      return matchSearch && matchClass && matchYear && matchBulletinType;
    });
  }, [students, studentSearchTerm, studentFilters, classById, classMatchesBulletinType]);

  useEffect(() => {
    if (selectedStudentId && students.length > 0) {
      const s = students.find((st) => String(st.id) === String(selectedStudentId));
      if (s && s.class_id) {
        const cls = classById.get(String(s.class_id));
        if (cls && cls.level) {
          const levelStr = String(cls.level).trim();
          const match = levelStr.match(/(\d+)/);
          const levelNum = match ? Number(match[1]) : null;
          
          if (levelNum) {
            if (levelNum >= 7 && levelNum <= 9) {
              setBulletinType('college');
            } else if (levelNum >= 3 && levelNum <= 6) {
              setBulletinType('primary');
            }
          }
        }
      }
    }
  }, [selectedStudentId, students, classById]);

  const selectedClass = useMemo(() => {
    if (!selectedStudent || !selectedStudent.class_id) return null;
    return classes.find((c) => String(c.id) === String(selectedStudent.class_id)) || null;
  }, [classes, selectedStudent]);

  const resetBulletinState = useCallback(() => {
    const baseNotes = {};
    for (const subject of SUBJECTS) {
      baseNotes[subject] = {};
      for (const m of MONTHS) {
        baseNotes[subject][m.key] = '';
      }
    }
    setNotes(baseNotes);

    const baseVisas = {};
    for (const m of MONTHS) {
      baseVisas[m.key] = {
        maitre: '',
        directeur: '',
        parents: '',
        observations: '',
      };
    }
    setVisas(baseVisas);

    setDecision('');
    const baseRang = {};
    for (const m of MONTHS) baseRang[m.key] = '';
    setRangByMonth(baseRang);
    setRangGeneral('');
    setMoyennePremier('');

    const baseCollege = {};
    for (const s of COLLEGE_SUBJECTS) {
      baseCollege[s] = {
        note_classe: '',
        note_compo: '',
        comp_x2: '',
        moyenne: '',
        coeff: '1',
        appreciation: '',
      };
    }
    setCollegeNotes(baseCollege);
    const baseSummary = {};
    for (const m of MONTHS) {
      baseSummary[m.key] = {
        total: '',
        moy_classe: '',
        moy_compo: '',
        moy_generale: '',
        classement: '',
      };
    }
    setPrimarySummary(baseSummary);
    setCollegeDecision('');
    setCollegeRang('');
    setCollegeEffectif('');
    setCollegeMoyenne1('');
    setCollegeMoyenneDernier('');
    setCollegeTrimestreLabel('COMPOSITION DU 2e TRIMESTRE');
  }, []);

  const loadBulletin = useCallback(async () => {
    if (!selectedStudentId || !academicYear) {
      resetBulletinState();
      return;
    }

    const data = await getBulletin(selectedStudentId, academicYear);
    if (!data) {
      resetBulletinState();
      return;
    }

    const baseNotes = {};
    for (const subject of SUBJECTS) {
      baseNotes[subject] = {};
      for (const m of MONTHS) {
        baseNotes[subject][m.key] = '';
      }
    }

    for (const row of Array.isArray(data.notes) ? data.notes : []) {
      const subject = String(row.subject || '').trim();
      const monthKey = String(row.month_key || '').trim();
      if (!subject || !monthKey) continue;
      if (!baseNotes[subject] || baseNotes[subject][monthKey] === undefined) continue;
      const v = row.note;
      const n = v === '' || v === null || v === undefined ? '' : clampNote(v);
      baseNotes[subject][monthKey] = n === '' ? '' : String(n);
    }
    setNotes(baseNotes);

    let loadedVisas = null;
    const meta = data.meta || null;
    if (meta && meta.bulletin_type) {
      const t = String(meta.bulletin_type || '').trim();
      if (t === 'college' || t === 'primary') {
        setBulletinType(t);
      }
    }

    if (meta && meta.data_json) {
      try {
        const payload = JSON.parse(String(meta.data_json));
        if (payload && typeof payload === 'object') {
          if (payload.trimestre_label) setCollegeTrimestreLabel(String(payload.trimestre_label));
          if (payload.notes && typeof payload.notes === 'object') {
            const next = {};
            for (const s of COLLEGE_SUBJECTS) {
              const row = payload.notes[s] || {};
              next[s] = {
                note_classe: row.note_classe ?? '',
                note_compo: row.note_compo ?? '',
                comp_x2: row.comp_x2 ?? '',
                moyenne: row.moyenne ?? '',
                coeff: row.coeff ?? '1',
                appreciation: row.appreciation ?? '',
              };
            }
            setCollegeNotes(next);
          }
          if (payload.decision != null) setCollegeDecision(String(payload.decision));
          if (payload.rang != null) setCollegeRang(String(payload.rang));
          if (payload.effectif != null) setCollegeEffectif(String(payload.effectif));
          if (payload.moyenne1 != null) setCollegeMoyenne1(String(payload.moyenne1));
          if (payload.moyenneDernier != null) setCollegeMoyenneDernier(String(payload.moyenneDernier));
        }
      } catch {
        // ignorer
      }
    }
    if (meta && meta.visas_json) {
      try {
        loadedVisas = JSON.parse(meta.visas_json);
      } catch {
        loadedVisas = null;
      }
    }
    if (loadedVisas && typeof loadedVisas === 'object') {
      const nextVisas = {};
      for (const m of MONTHS) {
        const row = loadedVisas[m.key] || {};
        nextVisas[m.key] = {
          maitre: row.maitre || '',
          directeur: row.directeur || '',
          parents: row.parents || '',
          observations: row.observations || '',
        };
      }
      setVisas(nextVisas);
    } else {
      const baseVisas = {};
      for (const m of MONTHS) {
        baseVisas[m.key] = {
          maitre: '',
          directeur: '',
          parents: '',
          observations: '',
        };
      }
      setVisas(baseVisas);
    }

    setDecision(meta && meta.decision ? String(meta.decision) : '');

    const baseRang = {};
    for (const m of MONTHS) baseRang[m.key] = '';
    let loadedGeneral = '';
    if (meta && meta.rang) {
      const raw = String(meta.rang);
      const trimmed = raw.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') {
            // Nouveau format: { general: string, byMonth: {oct:..., ...} }
            if (parsed.byMonth && typeof parsed.byMonth === 'object') {
              for (const m of MONTHS) {
                baseRang[m.key] = parsed.byMonth[m.key] ? String(parsed.byMonth[m.key]) : '';
              }
              loadedGeneral = parsed.general ? String(parsed.general) : '';
              
              if (parsed.primarySummary) {
                setPrimarySummary(parsed.primarySummary);
              } else {
                const baseSummary = {};
                for (const m of MONTHS) {
                  baseSummary[m.key] = {
                    total: '',
                    moy_classe: '',
                    moy_compo: '',
                    moy_generale: '',
                    classement: '',
                  };
                }
                setPrimarySummary(baseSummary);
              }
            } else {
              // Ancien format JSON: {oct:..., nov:...}
              for (const m of MONTHS) {
                baseRang[m.key] = parsed[m.key] ? String(parsed[m.key]) : '';
              }
            }
          }
        } catch {
          // ignorer
        }
      } else {
        for (const m of MONTHS) baseRang[m.key] = raw;
      }
    }
    setRangByMonth(baseRang);
    setRangGeneral(loadedGeneral);

    setMoyennePremier(meta && meta.moyenne_premier ? String(meta.moyenne_premier) : '');
  }, [academicYear, getBulletin, resetBulletinState, selectedStudentId]);

  useEffect(() => {
    loadBulletin();
  }, [loadBulletin]);

  const collegeComputed = useMemo(() => {
    const rows = COLLEGE_SUBJECTS.map((subject) => {
      const r = collegeNotes?.[subject] || {};
      const noteClasse = r.note_classe === '' ? null : Number(String(r.note_classe).replace(',', '.'));
      const compX2 = r.comp_x2 === '' ? null : Number(String(r.comp_x2).replace(',', '.'));
      const moyenne = r.moyenne === '' ? null : Number(String(r.moyenne).replace(',', '.'));
      const coeff = r.coeff === '' ? 1 : Number(String(r.coeff).replace(',', '.'));
      const safeCoeff = Number.isFinite(coeff) && coeff > 0 ? coeff : 1;
      const notesCoeff = Number.isFinite(moyenne) ? moyenne * safeCoeff : null;
      return {
        subject,
        noteClasse,
        compX2,
        moyenne,
        coeff: safeCoeff,
        notesCoeff,
        appreciation: String(r.appreciation || ''),
      };
    });

    const totalCoeff = rows.reduce((sum, r) => sum + (Number.isFinite(r.coeff) ? r.coeff : 0), 0);
    const totalNotesCoeff = rows.reduce((sum, r) => sum + (Number.isFinite(r.notesCoeff) ? r.notesCoeff : 0), 0);
    const moyenneGenerale = totalCoeff > 0 ? totalNotesCoeff / totalCoeff : 0;
    return {
      rows,
      totalCoeff,
      totalNotesCoeff,
      moyenneGenerale,
    };
  }, [collegeNotes]);

  const totalsByMonth = useMemo(() => {
    const totals = {};
    for (const m of MONTHS) {
      // Vérifier si toutes les matières ont une note pour ce mois
      let complete = true;
      let monthTotal = 0;
      for (const subject of SUBJECTS) {
        const v = notes?.[subject]?.[m.key];
        if (v === '' || v === null || v === undefined) {
          complete = false;
          break;
        }
        const n = Number(v);
        if (Number.isNaN(n)) {
          complete = false;
          break;
        }
        monthTotal += n;
      }
      totals[m.key] = complete ? monthTotal : null;
    }
    return totals;
  }, [notes]);

  const averagesByMonth = useMemo(() => {
    const avgs = {};
    for (const m of MONTHS) {
      const total = totalsByMonth[m.key];
      avgs[m.key] = total !== null ? total / SUBJECTS.length : null;
    }
    return avgs;
  }, [totalsByMonth]);

  const moyenneGenerale = useMemo(() => {
    // Vérifier si tous les mois sont complets
    const allMonthsComplete = MONTHS.every(m => totalsByMonth[m.key] !== null);
    if (!allMonthsComplete) return null;

    const vals = MONTHS.map((m) => averagesByMonth[m.key]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum / vals.length;
  }, [averagesByMonth, totalsByMonth]);

  const moyenneSemestre1 = useMemo(() => {
    const keys = ['oct', 'nov', 'dec', 'jan'];
    // Vérifier si les mois du semestre 1 sont complets
    const s1Complete = keys.every(k => totalsByMonth[k] !== null);
    if (!s1Complete) return null;

    const vals = keys.map((k) => averagesByMonth[k]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum / vals.length;
  }, [averagesByMonth, totalsByMonth]);

  const moyennePremierDisplay = useMemo(() => {
    if (moyennePremier !== '' && moyennePremier !== null && moyennePremier !== undefined) {
      return String(moyennePremier);
    }
    return formatNumber(moyenneSemestre1);
  }, [formatNumber, moyennePremier, moyenneSemestre1]);

  const moyenneAnnuelle = moyenneGenerale;

  // Calcul automatique du résumé primaire pour chaque mois
  useEffect(() => {
    if (bulletinType === 'primary') {
      setPrimarySummary(prev => {
        const next = { ...prev };
        let changed = false;
        for (const m of MONTHS) {
          const monthTotal = totalsByMonth[m.key] || 0;
          const monthAvg = averagesByMonth[m.key] || 0;
          
          const newTotal = formatNumber(monthTotal);
          const newAvg = formatNumber(monthAvg);

          if (next[m.key]?.total !== newTotal || next[m.key]?.moy_classe !== newAvg) {
            next[m.key] = {
              ...next[m.key],
              total: newTotal,
              moy_classe: newAvg,
              moy_compo: newAvg,
              moy_generale: newAvg,
            };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [totalsByMonth, averagesByMonth, bulletinType, formatNumber]);

  const rangGlobal = rangGeneral;

  const handleNoteChange = (subject, monthKey, raw) => {
    const next = clampNote(raw);
    setNotes((prev) => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [monthKey]: next === '' ? '' : String(next),
      },
    }));
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleBulkExport = async (classId) => {
    if (classId === 'all') return;
    setIsBulkLoading(true);
    try {
      // 1. Récupérer tous les élèves de la classe
      const classStudents = students.filter(s => String(s.class_id) === String(classId));
      
      // 2. Charger les données de bulletin pour chaque élève
      const bulletinsWithData = await Promise.all(classStudents.map(async (student) => {
        const data = await getBulletin(student.id, academicYear);
        if (!data) return null;

        // Calculer les moyennes pour le tri
        let moyenneTri = 0;
        const meta = data.meta || {};
        const bType = meta.bulletin_type || (student.level >= 7 ? 'college' : 'primary');

        if (bType === 'college' && meta.data_json) {
          try {
            const payload = JSON.parse(meta.data_json);
            const notesObj = payload.notes || {};
            let totalCoeff = 0;
            let totalNotesCoeff = 0;
            for (const s of COLLEGE_SUBJECTS) {
              const r = notesObj[s] || {};
              const coeff = r.coeff === '' ? 1 : Number(String(r.coeff).replace(',', '.'));
              const moyValue = r.moyenne === '' ? 0 : Number(String(r.moyenne).replace(',', '.'));
              totalCoeff += coeff;
              totalNotesCoeff += (moyValue * coeff);
            }
            moyenneTri = totalCoeff > 0 ? totalNotesCoeff / totalCoeff : 0;
          } catch (e) { moyenneTri = 0; }
        } else {
          // Primaire - utiliser la moyenne annuelle calculée
          let sumAvgs = 0;
          let countMonths = 0;
          const notesData = data.notes || [];
          for (const m of MONTHS) {
            let monthTotal = 0;
            let complete = true;
            for (const subject of SUBJECTS) {
              const noteRow = notesData.find(n => n.subject === subject && n.month_key === m.key);
              if (!noteRow || noteRow.note === null || noteRow.note === '') {
                complete = false;
                break;
              }
              monthTotal += Number(noteRow.note);
            }
            if (complete) {
              sumAvgs += (monthTotal / SUBJECTS.length);
              countMonths++;
            }
          }
          moyenneTri = countMonths > 0 ? sumAvgs / countMonths : 0;
        }

        return {
          student,
          data,
          moyenneTri,
          bulletinType: bType
        };
      }));

      // Filtrer les nulls et trier du premier au dernier
      const sortedBulletins = bulletinsWithData
        .filter(b => b !== null)
        .sort((a, b) => b.moyenneTri - a.moyenneTri);

      if (sortedBulletins.length === 0) {
        toast.error("Aucun bulletin trouvé pour cette classe.");
        return;
      }

      setBulkData(sortedBulletins);
      setBulkExporting(true);
      
      // Laisser le temps au DOM de se mettre à jour avant d'imprimer
      setTimeout(() => {
        window.print();
        setBulkExporting(false);
      }, 500);

    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la préparation de l'exportation.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Composant pour le rendu d'un bulletin unique dans l'export groupé
  const SingleBulletinPrintView = ({ bulletin }) => {
    const { student, data, bulletinType: bType } = bulletin;
    const cls = classes.find(c => String(c.id) === String(student.class_id));
    const studentName = `${student.last_name || ''} ${student.first_name || ''}`.trim();
    const className = cls ? cls.name : (student.class_name || '');

    if (bType === 'college') {
      let collegePayload = {};
      try { collegePayload = JSON.parse(data.meta?.data_json || '{}'); } catch(e) {}
      
      const cNotes = collegePayload.notes || {};
      const rows = COLLEGE_SUBJECTS.map(subject => {
        const r = cNotes[subject] || {};
        const coeff = r.coeff === '' ? 1 : Number(String(r.coeff).replace(',', '.'));
        const moy = r.moyenne === '' ? 0 : Number(String(r.moyenne).replace(',', '.'));
        return { subject, ...r, coeff, notesCoeff: moy * coeff };
      });
      const totalCoeff = rows.reduce((s, r) => s + r.coeff, 0);
      const totalNotes = rows.reduce((s, r) => s + (r.notesCoeff || 0), 0);
      const moyGen = totalCoeff > 0 ? totalNotes / totalCoeff : 0;

      return (
        <div className="bulletin2-print" style={{ pageBreakAfter: 'always' }}>
          <div className="bulletin2-header">
            <div>Academie de Kalaban coro</div>
            <div>CAP DE KALABANCORO</div>
            <div>Ecole privée LA SAGESSE</div>
          </div>
          <div className="bulletin2-title">{collegePayload.trimestre_label || 'COMPOSITION'}</div>
          <div className="bulletin2-meta">
            <div>Bulletin de l'élève: <strong>{studentName}</strong></div>
            <div>Année scolaire <strong>{academicYear}</strong></div>
            <div>CLASSE: <strong>{className}</strong></div>
          </div>
          <table className="bulletin2-table">
            <thead>
              <tr>
                <th className="bulletin2-th bulletin2-th--subject">Matieres</th>
                <th className="bulletin2-th">notes classe</th>
                <th className="bulletin2-th">Note compo</th>
                <th className="bulletin2-th">Comp x 2</th>
                <th className="bulletin2-th">Moy. gené</th>
                <th className="bulletin2-th">coeff</th>
                <th className="bulletin2-th">Notes coeff</th>
                <th className="bulletin2-th bulletin2-th--app">Appreciations</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.subject}>
                  <td className="bulletin2-td bulletin2-td--subject">{r.subject}</td>
                  <td className="bulletin2-td">{r.note_classe}</td>
                  <td className="bulletin2-td">{r.note_compo}</td>
                  <td className="bulletin2-td">{r.comp_x2}</td>
                  <td className="bulletin2-td">{r.moyenne}</td>
                  <td className="bulletin2-td">{r.coeff}</td>
                  <td className="bulletin2-td">{formatNumber(r.notesCoeff)}</td>
                  <td className="bulletin2-td bulletin2-td--app">{r.appreciation}</td>
                </tr>
              ))}
              <tr>
                <td className="bulletin2-td bulletin2-td--subject" colSpan={5}><strong>Total coeff</strong></td>
                <td className="bulletin2-td"><strong>{totalCoeff}</strong></td>
                <td className="bulletin2-td" colSpan={2}></td>
              </tr>
            </tbody>
          </table>
          <div className="bulletin2-bottom">
            <div className="bulletin2-decision">{collegePayload.decision || ''}</div>
            <div className="bulletin2-summary">
              <div className="bulletin2-summary__row"><span>Total:</span> <strong>{formatNumber(totalNotes)}</strong></div>
              <div className="bulletin2-summary__row"><span>Moyenne:</span> <strong>{formatNumber(moyGen)}</strong></div>
              <div className="bulletin2-summary__row"><span>Rang:</span> <strong>{collegePayload.rang || ''}/{collegePayload.effectif || ''}</strong></div>
            </div>
          </div>
          <div className="bulletin2-sign"><div>Le directeur</div><div>Les parents</div></div>
        </div>
      );
    } else {
      // Primaire
      const meta = data.meta || {};
      let pSummary = {};
      try { 
        const rangData = JSON.parse(meta.rang || '{}');
        pSummary = rangData.primarySummary || {};
      } catch(e) {}

      const getNote = (s, mk) => {
        const row = data.notes?.find(n => n.subject === s && n.month_key === mk);
        return row ? row.note : '';
      };

      // Calcul moyenne annuelle pour l'affichage
      let sumAvgs = 0;
      let countMonths = 0;
      MONTHS.forEach(m => {
        if (pSummary[m.key]?.moy_generale) {
          sumAvgs += Number(pSummary[m.key].moy_generale);
          countMonths++;
        }
      });
      const moyAnnuelle = countMonths > 0 ? sumAvgs / countMonths : 0;

      return (
        <div className="bulletin-print" style={{ pageBreakAfter: 'always' }}>
          <div className="bulletin-print__title">COMPOSITIONS MENSUELLES</div>
          <div className="bulletin-meta bulletin-meta--top">
            <div className="bulletin-meta__line"><span className="bulletin-meta__label">Élève:</span> {studentName}</div>
            <div className="bulletin-meta__line"><span className="bulletin-meta__label">Classe:</span> {className}</div>
            <div className="bulletin-meta__line"><span className="bulletin-meta__label">Année:</span> {academicYear}</div>
          </div>
          <table className="bulletin-table">
            <thead>
              <tr>
                <th className="bulletin-th bulletin-th--left">Matieres/Mois</th>
                {MONTHS.map(m => <th key={m.key} className="bulletin-th">{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map(subject => (
                <tr key={subject}>
                  <td className="bulletin-td bulletin-td--left">{subject}</td>
                  {MONTHS.map(m => <td key={m.key} className="bulletin-td">{getNote(subject, m.key)}</td>)}
                </tr>
              ))}
              <tr>
                <td className="bulletin-td bulletin-td--left bulletin-td--strong">TOTAL</td>
                {MONTHS.map(m => <td key={m.key} className="bulletin-td bulletin-td--strong">{pSummary[m.key]?.total || ''}</td>)}
              </tr>
              <tr>
                <td className="bulletin-td bulletin-td--left">Moy. Generale</td>
                {MONTHS.map(m => <td key={m.key} className="bulletin-td">{pSummary[m.key]?.moy_generale || ''}</td>)}
              </tr>
              <tr>
                <td className="bulletin-td bulletin-td--left">Classement</td>
                {MONTHS.map(m => <td key={m.key} className="bulletin-td">{pSummary[m.key]?.classement || ''}</td>)}
              </tr>
            </tbody>
          </table>
          <div className="bulletin-bottom">
            <div className="bulletin-scores">
              <div className="bulletin-scores__cell">
                <span className="bulletin-scores__label">MOYENNE ANNUELLE :</span>
                <span className="bulletin-scores__box">{formatNumber(moyAnnuelle)}</span>
                <span className="bulletin-scores__unit">/10</span>
              </div>
            </div>

            <div className="bulletin-footer-table-container">
              <table className="bulletin-footer-table">
                <thead>
                  <tr>
                    <th className="bulletin-footer-td label-td" style={{ textAlign: 'center' }}>DÉCISIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bulletin-footer-td check-td">
                      <div className="check-item-row">
                        <div className="check-item">
                          <div className={`check-box ${meta.decision === 'pass' ? 'checked' : ''}`}>{meta.decision === 'pass' ? '✓' : ''}</div>
                          <span>Passe en classe supérieure</span>
                        </div>
                        <div className="check-item">
                          <div className={`check-box ${meta.decision === 'repeat' ? 'checked' : ''}`}>{meta.decision === 'repeat' ? '✓' : ''}</div>
                          <span>Redouble</span>
                        </div>
                        <div className="check-item">
                          <div className={`check-box ${meta.decision === 'excluded' ? 'checked' : ''}`}>{meta.decision === 'excluded' ? '✗' : ''}</div>
                          <span>Exclu(e)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bulletin-signatures2">
              <div className="bulletin-signature2"><div className="bulletin-signature2__title">LE MAITRE</div><div className="bulletin-signature2__line" /></div>
              <div className="bulletin-signature2"><div className="bulletin-signature2__title">LE DIRECTEUR</div><div className="bulletin-signature2__line" /></div>
            </div>
          </div>
        </div>
      );
    }
  };

  const noteDisplay = useCallback(
    (subject, monthKey) => {
      const v = notes?.[subject]?.[monthKey];
      if (v === '' || v === null || v === undefined) return '';
      const n = Number(v);
      if (Number.isNaN(n)) return '';
      return String(n);
    },
    [notes]
  );

  const decisionLabel = useMemo(() => {
    if (decision === 'pass') return 'Passe en classe supérieure';
    if (decision === 'repeat') return 'Redouble';
    if (decision === 'excluded') return 'Exclu(e)';
    return '';
  }, [decision]);

  const PrintViewPrimary = useMemo(() => {
    const studentName = selectedStudent ? `${selectedStudent.last_name || ''} ${selectedStudent.first_name || ''}`.trim() : '';
    const className = selectedClass ? selectedClass.name : selectedStudent?.class_name || '';

    return (
      <div className="bulletin-print">
        <div className="bulletin-print__title">COMPOSITIONS MENSUELLES</div>

        <div className="bulletin-meta bulletin-meta--top">
          <div className="bulletin-meta__line"><span className="bulletin-meta__label">Élève:</span> {studentName}</div>
          <div className="bulletin-meta__line"><span className="bulletin-meta__label">Classe:</span> {className}</div>
          <div className="bulletin-meta__line"><span className="bulletin-meta__label">Année:</span> {academicYear || ''}</div>
        </div>

        <table className="bulletin-table">
          <thead>
            <tr>
              <th className="bulletin-th bulletin-th--left">Matieres/Mois</th>
              {MONTHS.map((m) => (
                <th key={m.key} className="bulletin-th">{m.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((subject) => (
              <tr key={subject}>
                <td className="bulletin-td bulletin-td--left">{subject}</td>
                {MONTHS.map((m) => (
                  <td key={m.key} className="bulletin-td">{noteDisplay(subject, m.key)}</td>
                ))}
              </tr>
            ))}

            <tr>
              <td className="bulletin-td bulletin-td--left bulletin-td--strong">TOTAL</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td bulletin-td--strong">
                  {primarySummary[m.key]?.total || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Moy. de Classe</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">
                  {primarySummary[m.key]?.moy_classe || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Moy. de Compo.</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">
                  {primarySummary[m.key]?.moy_compo || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Moy. Generale</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">
                  {primarySummary[m.key]?.moy_generale || ''}
                </td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Classement</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">
                  {primarySummary[m.key]?.classement || ''}
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className="bulletin-spacer" />

        <table className="bulletin-table">
          <thead>
            <tr>
              <th className="bulletin-th bulletin-th--left">MOIS</th>
              <th className="bulletin-th">MAITRE</th>
              <th className="bulletin-th">DIRECTEUR</th>
              <th className="bulletin-th">LES PARENTS</th>
              <th className="bulletin-th bulletin-th--left">OBSERVATIONS</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((m) => (
              <tr key={m.key}>
                <td className="bulletin-td bulletin-td--left">{m.label}</td>
                <td className="bulletin-td">{visas?.[m.key]?.maitre || ''}</td>
                <td className="bulletin-td">{visas?.[m.key]?.directeur || ''}</td>
                <td className="bulletin-td">{visas?.[m.key]?.parents || ''}</td>
                <td className="bulletin-td bulletin-td--left">{visas?.[m.key]?.observations || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="bulletin-spacer" />

        <div className="bulletin-bottom">
          <div className="bulletin-scores">
            <div className="bulletin-scores__cell">
              <span className="bulletin-scores__label">MOYENNE ANNUELLE :</span>
              <span className="bulletin-scores__box">{formatNumber(moyenneAnnuelle)}</span>
              <span className="bulletin-scores__unit">/10</span>
            </div>
            <div className="bulletin-scores__cell">
              <span className="bulletin-scores__label">RANG :</span>
              <span className="bulletin-scores__box bulletin-scores__box--small">{rangGlobal || ''}</span>
            </div>
            <div className="bulletin-scores__cell">
              <span className="bulletin-scores__label">MOYENNE du 1er</span>
              <span className="bulletin-scores__box">{moyennePremierDisplay}</span>
              <span className="bulletin-scores__unit">/10</span>
            </div>
          </div>

          <div className="bulletin-footer-table-container">
            <table className="bulletin-footer-table">
              <thead>
                <tr>
                  <th className="bulletin-footer-td label-td" style={{ textAlign: 'center' }}>DÉCISIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bulletin-footer-td check-td">
                    <div className="check-item-row">
                      <div className="check-item">
                        <div className={`check-box ${decision === 'pass' ? 'checked' : ''}`}>{decision === 'pass' ? '✓' : ''}</div>
                        <span>Passe en classe supérieure</span>
                      </div>
                      <div className="check-item">
                        <div className={`check-box ${decision === 'repeat' ? 'checked' : ''}`}>{decision === 'repeat' ? '✓' : ''}</div>
                        <span>Redouble</span>
                      </div>
                      <div className="check-item">
                        <div className={`check-box ${decision === 'excluded' ? 'checked' : ''}`}>{decision === 'excluded' ? '✗' : ''}</div>
                        <span>Exclu(e)</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bulletin-signatures2">
            <div className="bulletin-signature2">
              <div className="bulletin-signature2__title">LE MAITRE</div>
              <div className="bulletin-signature2__line" />
            </div>
            <div className="bulletin-signature2">
              <div className="bulletin-signature2__title">LE DIRECTEUR</div>
              <div className="bulletin-signature2__line" />
            </div>
          </div>
        </div>
      </div>
    );
  }, [academicYear, averagesByMonth, decision, decisionLabel, formatNumber, moyenneAnnuelle, moyenneSemestre1, noteDisplay, notes, primarySummary, rangByMonth, rangGlobal, selectedClass, selectedStudent, totalsByMonth, visas]);

  const PrintViewCollege = useMemo(() => {
    const studentName = selectedStudent ? `${selectedStudent.first_name || ''} ${selectedStudent.last_name || ''}`.trim() : '';
    const className = selectedClass ? selectedClass.name : selectedStudent?.class_name || '';
    const totalNotes = collegeComputed.totalNotesCoeff;
    const moy = collegeComputed.moyenneGenerale;
    const rang = String(collegeRang || '').trim();
    const eff = String(collegeEffectif || '').trim();
    const rangDisplay = rang && eff ? `${rang}e/${eff}` : (rang || '');

    return (
      <div className="bulletin2-print">
        <div className="bulletin2-header">
          <div>Academie de Kalaban coro</div>
          <div>CAP DE KALABANCORO</div>
          <div>Ecole privée LA SAGESSE</div>
        </div>

        <div className="bulletin2-title">{collegeTrimestreLabel || 'COMPOSITION DU 2e TRIMESTRE'}</div>

        <div className="bulletin2-meta">
          <div>Bulletin de l'élève: <strong>{studentName}</strong></div>
          <div>Année scolaire <strong>{academicYear || ''}</strong></div>
          <div>CLASSE: <strong>{className}</strong></div>
        </div>

        <table className="bulletin2-table">
          <thead>
            <tr>
              <th className="bulletin2-th bulletin2-th--subject">Matieres</th>
              <th className="bulletin2-th">notes classe</th>
              <th className="bulletin2-th">Note compo</th>
              <th className="bulletin2-th">Comp x 2</th>
              <th className="bulletin2-th">Moy. gené</th>
              <th className="bulletin2-th">coeff</th>
              <th className="bulletin2-th">Notes coeff</th>
              <th className="bulletin2-th bulletin2-th--app">Appreciations</th>
            </tr>
          </thead>
          <tbody>
            {collegeComputed.rows.map((r) => (
              <tr key={r.subject}>
                <td className="bulletin2-td bulletin2-td--subject">{r.subject}</td>
                <td className="bulletin2-td">{r.noteClasse ?? ''}</td>
                <td className="bulletin2-td">{collegeNotes[r.subject]?.note_compo ?? ''}</td>
                <td className="bulletin2-td">{r.compX2 ?? ''}</td>
                <td className="bulletin2-td">{r.moyenne ?? ''}</td>
                <td className="bulletin2-td">{r.coeff ?? ''}</td>
                <td className="bulletin2-td">{r.notesCoeff != null ? formatNumber(r.notesCoeff) : ''}</td>
                <td className="bulletin2-td bulletin2-td--app">{r.appreciation}</td>
              </tr>
            ))}
            <tr>
              <td className="bulletin2-td bulletin2-td--subject" colSpan={5}><strong>Total coeff</strong></td>
              <td className="bulletin2-td"><strong>{collegeComputed.totalCoeff}</strong></td>
              <td className="bulletin2-td" colSpan={2}></td>
            </tr>
          </tbody>
        </table>

        <div className="bulletin2-bottom">
          <div className="bulletin2-decision">{collegeDecision || ''}</div>
          <div className="bulletin2-summary">
            <div className="bulletin2-summary__row"><span>Total:</span> <strong>{formatNumber(totalNotes)}</strong></div>
            <div className="bulletin2-summary__row"><span>Moyenne:</span> <strong>{formatNumber(moy)}</strong></div>
            <div className="bulletin2-summary__row"><span>Rang:</span> <strong>{rangDisplay}</strong></div>
            <div className="bulletin2-summary__row"><span>Moyenne du 1er:</span> <strong>{collegeMoyenne1 || ''}</strong></div>
            <div className="bulletin2-summary__row"><span>Moyenne du dernier:</span> <strong>{collegeMoyenneDernier || ''}</strong></div>
          </div>
        </div>

        <div className="bulletin2-sign">
          <div>Le directeur</div>
          <div>Les parents</div>
        </div>

        <div className="bulletin2-date-container">
          <div className="bulletin2-date">Kouralé le {new Date().toLocaleDateString('fr-FR')}</div>
        </div>
      </div>
    );
  }, [academicYear, collegeComputed, collegeDecision, collegeEffectif, collegeMoyenne1, collegeMoyenneDernier, collegeRang, collegeTrimestreLabel, formatNumber, selectedClass, selectedStudent]);

  const PrintView = bulletinType === 'college' ? PrintViewCollege : PrintViewPrimary;

  const handleSave = async () => {
    if (!selectedStudentId) {
      toast.error('Sélectionne un élève avant d’enregistrer.');
      return;
    }
    if (!academicYear) {
      toast.error('Renseigne une année scolaire.');
      return;
    }

    const payloadNotes = [];
    for (const subject of SUBJECTS) {
      for (const m of MONTHS) {
        const raw = notes?.[subject]?.[m.key];
        if (raw === '' || raw === null || raw === undefined) continue;
        const n = Number(raw);
        if (Number.isNaN(n)) continue;
        if (n < 0 || n > 10) continue;
        payloadNotes.push({ subject, month_key: m.key, note: n });
      }
    }

    const metaPayload = {
      bulletin_type: bulletinType,
      decision,
      rang: JSON.stringify({ general: rangGeneral || '', byMonth: rangByMonth || {}, primarySummary }),
      visas_json: JSON.stringify(visas || {}),
      moyenne_premier: moyennePremier || '',
    };

    let payload = {
      notes: payloadNotes,
      meta: metaPayload,
    };

    if (bulletinType === 'college') {
      const collegePayload = {
        trimestre_label: collegeTrimestreLabel,
        notes: collegeNotes,
        decision: collegeDecision,
        rang: collegeRang,
        effectif: collegeEffectif,
        moyenne1: collegeMoyenne1,
        moyenneDernier: collegeMoyenneDernier,
      };
      payload = {
        notes: [],
        meta: {
          bulletin_type: 'college',
          data_json: JSON.stringify(collegePayload),
        },
      };
    }

    const res = await saveBulletin(selectedStudentId, academicYear, payload);
    if (res && res.success) {
      toast.success('Bulletin enregistré.');
    } else {
      toast.error(res?.error || 'Impossible d’enregistrer le bulletin.');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {ToastComponent}
      
      {/* Barre de navigation interne */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gestion des Bulletins</h1>
            <p className="text-xs text-muted-foreground">Saisie des notes et génération des documents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setViewMode('entry')}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === 'entry' 
                ? "bg-white dark:bg-gray-800 text-violet-600 shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <PenLine className="h-4 w-4" />
            Renseigner les notes
          </button>
          <button
            onClick={() => setViewMode('generate')}
            className={cn(
              "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === 'generate' 
                ? "bg-white dark:bg-gray-800 text-violet-600 shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Printer className="h-4 w-4" />
            Générer
          </button>
        </div>
      </div>

      {viewMode === 'welcome' && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full"></div>
            <LayoutGrid className="h-24 w-24 text-violet-200 relative z-10" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-bold">Bienvenue dans l'espace Bulletins</h2>
            <p className="text-muted-foreground">
              Choisissez une action dans la barre de navigation ci-dessus pour commencer à travailler sur les notes des élèves.
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setViewMode('entry')} className="bg-violet-600 hover:bg-violet-700">
              Commencer la saisie
            </Button>
            <Button variant="outline" onClick={() => setViewMode('generate')}>
              Consulter les bulletins
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'entry' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-500" />
                Sélection de l'élève
              </CardTitle>
              <CardDescription>Recherchez un élève pour renseigner ses notes pour l'année {academicYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    placeholder="Nom, prénom ou matricule..."
                    className="pl-9 h-11 rounded-xl"
                  />
                </div>
                <div className="md:col-span-3">
                  <select
                    value={studentFilters.class_id}
                    onChange={(e) => setStudentFilters((prev) => ({ ...prev, class_id: e.target.value }))}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="all">Toutes les classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="">-- Choisir l'élève dans la liste --</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name} {s.first_name} {s.matricule ? `(${s.matricule})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedStudent && (
                <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{selectedStudent.last_name} {selectedStudent.first_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Classe: {selectedClass?.name || 'N/A'} | Type: {bulletinType === 'primary' ? '3e à 6e (Primaire)' : '7e à 9e (Collège)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} disabled={bulletinLoading} className="bg-violet-600">
                      Enregistrer les notes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedStudentId ? (
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Saisie des notes - {bulletinType === 'primary' ? 'Primaire' : 'Collège'}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Année Scolaire:</span>
                    <Input 
                      value={academicYear} 
                      onChange={(e) => setAcademicYear(e.target.value)} 
                      className="h-8 w-28 text-center font-bold"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {bulletinType === 'college' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Libellé du trimestre</label>
                        <Input value={collegeTrimestreLabel} onChange={(e) => setCollegeTrimestreLabel(e.target.value)} placeholder="Ex: COMPOSITION DU 2e TRIMESTRE" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Décision du conseil</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={collegeDecision}
                          onChange={(e) => setCollegeDecision(e.target.value)}
                        >
                          <option value="">-</option>
                          <option value="Passable">Passable</option>
                          <option value="Assez bien">Assez bien</option>
                          <option value="Bien">Bien</option>
                          <option value="Très bien">Très bien</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Insuffisant">Insuffisant</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Rang & Effectif</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Rang" value={collegeRang} onChange={(e) => setCollegeRang(e.target.value)} />
                          <Input placeholder="Effectif" value={collegeEffectif} onChange={(e) => setCollegeEffectif(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Moyenne du 1er</label>
                        <Input value={collegeMoyenne1} onChange={(e) => setCollegeMoyenne1(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Moyenne du dernier</label>
                        <Input value={collegeMoyenneDernier} onChange={(e) => setCollegeMoyenneDernier(e.target.value)} />
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                      <table className="min-w-[1100px] w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3 text-left w-[220px]">Matières</th>
                            <th className="p-3 text-center">Notes classe</th>
                            <th className="p-3 text-center">Note compo</th>
                            <th className="p-3 text-center bg-violet-500/5">Comp x 2</th>
                            <th className="p-3 text-center bg-violet-500/5">Moy. gené</th>
                            <th className="p-3 text-center">Coeff</th>
                            <th className="p-3 text-center">Notes coeff</th>
                            <th className="p-3 text-left w-[260px]">Appréciations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {COLLEGE_SUBJECTS.map((subject) => {
                            const r = collegeNotes?.[subject] || {};
                            const coeff = r.coeff === '' ? 1 : Number(String(r.coeff).replace(',', '.'));
                            const safeCoeff = Number.isFinite(coeff) && coeff > 0 ? coeff : 1;
                            
                            const nClasse = r.note_classe === '' ? 0 : Number(String(r.note_classe).replace(',', '.'));
                            const nCompo = r.note_compo === '' ? 0 : Number(String(r.note_compo).replace(',', '.'));
                            const compX2 = nCompo * 2;
                            const moyAuto = (nClasse + compX2) / 3;
                            
                            const displayMoy = r.moyenne !== '' ? r.moyenne : formatNumber(moyAuto);
                            const displayCompX2 = r.comp_x2 !== '' ? r.comp_x2 : formatNumber(compX2);
                            
                            const moyValue = Number(String(displayMoy).replace(',', '.'));
                            const notesCoeff = Number.isFinite(moyValue) ? moyValue * safeCoeff : null;

                            return (
                              <tr key={subject} className="border-t hover:bg-muted/20 transition-colors">
                                <td className="p-3 font-bold">{subject}</td>
                                <td className="p-2 text-center">
                                  <Input
                                    value={r.note_classe}
                                    onChange={(e) => setCollegeNotes((prev) => ({ ...prev, [subject]: { ...prev[subject], note_classe: e.target.value } }))}
                                    className="h-9 text-center rounded-lg"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <Input
                                    value={r.note_compo}
                                    onChange={(e) => setCollegeNotes((prev) => ({ ...prev, [subject]: { ...prev[subject], note_compo: e.target.value } }))}
                                    className="h-9 text-center rounded-lg"
                                    placeholder="Note"
                                  />
                                </td>
                                <td className="p-2 text-center bg-violet-500/5">
                                  <Input
                                    value={r.comp_x2 || displayCompX2}
                                    readOnly
                                    className="h-9 text-center bg-transparent border-none font-medium text-violet-600"
                                  />
                                </td>
                                <td className="p-2 text-center bg-violet-500/5">
                                  <Input
                                    value={r.moyenne || displayMoy}
                                    readOnly
                                    className="h-9 text-center bg-transparent border-none font-bold text-violet-700"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <Input
                                    value={r.coeff}
                                    onChange={(e) => setCollegeNotes((prev) => ({ ...prev, [subject]: { ...prev[subject], coeff: e.target.value } }))}
                                    className="h-9 text-center rounded-lg"
                                  />
                                </td>
                                <td className="p-3 text-center font-bold text-primary">{notesCoeff != null ? formatNumber(notesCoeff) : ''}</td>
                                <td className="p-2">
                                  <Input
                                    value={r.appreciation}
                                    onChange={(e) => setCollegeNotes((prev) => ({ ...prev, [subject]: { ...prev[subject], appreciation: e.target.value } }))}
                                    className="h-9 rounded-lg"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="px-4 py-3 text-left font-bold border-b">Matières / Mois</th>
                            {MONTHS.map((m) => (
                              <th key={m.key} className="px-3 py-3 text-center font-bold border-b border-l bg-muted/30">
                                {m.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {SUBJECTS.map((subject) => (
                            <tr key={subject} className="border-b hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-2 font-bold whitespace-nowrap">{subject}</td>
                              {MONTHS.map((m) => (
                                <td key={m.key} className="p-1 border-l">
                                  <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    step="0.25"
                                    value={notes?.[subject]?.[m.key] ?? ''}
                                    onChange={(e) => handleNoteChange(subject, m.key, e.target.value)}
                                    className="h-9 text-center border-none focus:ring-0 bg-transparent"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                          
                          <tr className="bg-violet-500/5 font-bold">
                            <td className="px-4 py-3 border-t-2 border-violet-500/20">TOTAL</td>
                            {MONTHS.map((m) => (
                              <td key={m.key} className="p-1 text-center border-l border-t-2 border-violet-500/20 text-violet-700">
                                {primarySummary[m.key]?.total || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-violet-500/5">
                            <td className="px-4 py-3">Moy. de Classe</td>
                            {MONTHS.map((m) => (
                              <td key={m.key} className="p-1 text-center border-l text-violet-600">
                                {primarySummary[m.key]?.moy_classe || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-violet-500/5">
                            <td className="px-4 py-3">Moy. de Compo</td>
                            {MONTHS.map((m) => (
                              <td key={m.key} className="p-1 text-center border-l text-violet-600">
                                {primarySummary[m.key]?.moy_compo || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-violet-500/5">
                            <td className="px-4 py-3">Moy. Générale</td>
                            {MONTHS.map((m) => (
                              <td key={m.key} className="p-1 text-center border-l text-violet-700 font-bold">
                                {primarySummary[m.key]?.moy_generale || '-'}
                              </td>
                            ))}
                          </tr>
                          <tr className="bg-amber-500/5">
                            <td className="px-4 py-3 text-amber-700 font-bold border-t-2 border-amber-500/20">CLASSEMENT</td>
                            {MONTHS.map((m) => (
                              <td key={m.key} className="p-1 border-l border-t-2 border-amber-500/20">
                                <Input
                                  value={primarySummary[m.key]?.classement || ''}
                                  onChange={(e) => setPrimarySummary(prev => ({
                                    ...prev,
                                    [m.key]: { ...prev[m.key], classement: e.target.value }
                                  }))}
                                  className="h-9 text-center font-bold border-none bg-transparent text-amber-700 focus:ring-0"
                                  placeholder="Rang"
                                />
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Visas, Moyenne Annuelle, etc. */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border shadow-sm">
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">Visas & Observations</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-muted sticky top-0">
                                <tr>
                                  <th className="p-2 text-left">Mois</th>
                                  <th className="p-2 text-left">Maitre</th>
                                  <th className="p-2 text-left">Obs.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {MONTHS.map((m) => (
                                  <tr key={m.key} className="border-t">
                                    <td className="p-2 font-bold">{m.label}</td>
                                    <td className="p-1">
                                      <Input 
                                        value={visas[m.key].maitre} 
                                        onChange={(e) => setVisas(prev => ({...prev, [m.key]: {...prev[m.key], maitre: e.target.value}}))}
                                        className="h-7 text-[10px]"
                                      />
                                    </td>
                                    <td className="p-1">
                                      <Input 
                                        value={visas[m.key].observations} 
                                        onChange={(e) => setVisas(prev => ({...prev, [m.key]: {...prev[m.key], observations: e.target.value}}))}
                                        className="h-7 text-[10px]"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="space-y-4">
                        <Card className="border shadow-sm bg-violet-500/5">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm">Synthèse Annuelle</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Moyenne Annuelle:</span>
                              <span className="text-xl font-bold text-violet-700">{formatNumber(moyenneAnnuelle) || 'N/A'} / 10</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Rang Final</label>
                                <Input value={rangGeneral} onChange={(e) => setRangGeneral(e.target.value)} placeholder="Ex: 3/25" className="h-9" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Moyenne du 1er</label>
                                <Input value={moyennePremier} onChange={(e) => setMoyennePremier(e.target.value)} placeholder="10.00" className="h-9" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold">Décision finale</label>
                              <div className="grid grid-cols-3 gap-2">
                                {['pass', 'repeat', 'excluded'].map((d) => (
                                  <button
                                    key={d}
                                    onClick={() => setDecision(decision === d ? '' : d)}
                                    className={cn(
                                      "px-2 py-2 text-[10px] font-bold rounded-lg border transition-all",
                                      decision === d 
                                        ? "bg-violet-600 border-violet-600 text-white" 
                                        : "bg-white border-input hover:border-violet-300"
                                    )}
                                  >
                                    {d === 'pass' ? 'PASSE' : d === 'repeat' ? 'REDOUBLE' : 'EXCLU'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/20">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground font-medium">Sélectionnez un élève pour commencer la saisie</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'generate' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-violet-500" />
                Génération & Exportation
              </CardTitle>
              <CardDescription>Visualisez les bulletins individuels ou exportez toute une classe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filtrer par classe</label>
                  <select
                    value={studentFilters.class_id}
                    onChange={(e) => setStudentFilters((prev) => ({ ...prev, class_id: e.target.value }))}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="all">Toutes les classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sélectionner l'élève</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="">Individuel...</option>
                    {filteredStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.last_name} {s.first_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <Button 
                    variant="outline" 
                    className="h-11 flex-1 rounded-xl"
                    disabled={!selectedStudentId}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Visualiser
                  </Button>
                  <Button 
                    className="h-11 flex-1 rounded-xl bg-violet-600 hover:bg-violet-700"
                    disabled={studentFilters.class_id === 'all' || isBulkLoading}
                    onClick={() => handleBulkExport(studentFilters.class_id)}
                  >
                    {isBulkLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4 mr-2" />
                    )}
                    Tout exporter
                  </Button>
                </div>
              </div>

              {selectedStudentId && (
                <div className="p-6 border-2 border-violet-500/10 rounded-3xl bg-violet-500/5 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <GraduationCap className="h-8 w-8 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedStudent.last_name} {selectedStudent.first_name}</h3>
                      <p className="text-sm text-muted-foreground">Année scolaire: {academicYear}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="p-3 bg-white rounded-xl border border-black/5 shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Moy. Annuelle</p>
                      <p className="text-lg font-bold text-violet-600">{formatNumber(moyenneAnnuelle) || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-black/5 shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Rang</p>
                      <p className="text-lg font-bold text-amber-600">{rangGlobal || '-'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-black/5 shadow-sm">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Décision</p>
                      <p className="text-lg font-bold uppercase">{decision || '-'}</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <Button onClick={handleExportPdf} className="w-full h-full rounded-xl bg-violet-600">
                        Exporter PDF
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rendu des bulletins pour l'export groupé via Portal */}
      {bulkExporting && bulkPortalEl
        ? createPortal(
            <div className="bulletin-bulk-print-container">
              {bulkData.map((bulletin, idx) => (
                <SingleBulletinPrintView key={bulletin.student.id} bulletin={bulletin} />
              ))}
            </div>,
            bulkPortalEl
          )
        : null}

      {previewOpen && (
        <div className="bulletin-preview" role="dialog" aria-modal="true">
          <div className="bulletin-preview__backdrop" onClick={() => setPreviewOpen(false)} />
          <div className="bulletin-preview__panel">
            <div className="bulletin-preview__header">
              <div className="bulletin-preview__title">Aperçu avant export</div>
              <div className="bulletin-preview__actions">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Fermer
                </Button>
                <Button onClick={handleExportPdf} className="bg-violet-600">Exporter PDF</Button>
              </div>
            </div>
            <div className="bulletin-preview__content">
              <div className="bulletin-preview__page">{PrintView}</div>
            </div>
          </div>
        </div>
      )}

      {printPortalEl
        ? createPortal(<div className="bulletin-print-only">{PrintView}</div>, printPortalEl)
        : null}

      <style>{`
        @page {
          size: A4;
          margin: 10mm;
        }
        @media print {
           body {
             background: white !important;
           }
           /* Masquer l'application React entière pendant l'impression */
           #root {
             display: none !important;
           }
           /* Afficher uniquement les portails de bulletin */
           #bulletin-print-portal, #bulletin-bulk-portal {
             display: block !important;
             position: static !important;
             width: 100% !important;
             height: auto !important;
             overflow: visible !important;
           }
           .no-print {
             display: none !important;
           }
         }
         #bulletin-print-portal, #bulletin-bulk-portal {
           display: none;
         }
         @media print {
           #bulletin-print-portal:not(:empty), #bulletin-bulk-portal:not(:empty) {
             display: block !important;
           }
         }
         .bulletin-print, .bulletin2-print {
           font-family: 'Times New Roman', serif;
           color: black;
           background: white;
           padding: 5px;
           max-width: 800px;
           margin: 0 auto;
           position: relative;
           max-height: 290mm;
           overflow: hidden;
         }
         .bulletin-bulk-print-container .bulletin-print,
         .bulletin-bulk-print-container .bulletin2-print {
           page-break-after: always;
           max-height: none;
           overflow: visible;
         }
         .bulletin-footer-table-container {
           margin-top: 10px;
         }
         .bulletin-footer-table {
           width: 100%;
           border-collapse: collapse;
         }
         .bulletin-footer-td {
           border: 1px solid black;
           padding: 4px;
           vertical-align: top;
           font-size: 10px;
         }
         .bulletin-footer-td.label-td {
           font-weight: bold;
           background: #f9f9f9;
           text-align: center;
         }
         .bulletin-footer-td.check-td {
           width: 100%;
         }
         .check-item-row {
           display: flex;
           justify-content: space-around;
           align-items: center;
           width: 100%;
           padding: 2px 0;
         }
         .check-item {
           display: flex;
           align-items: center;
           gap: 8px;
         }
         .check-box {
           width: 14px;
           height: 14px;
           border: 1px solid black;
           display: flex;
           align-items: center;
           justify-content: center;
           font-weight: bold;
           font-size: 10px;
         }
         .check-box.checked {
           background: #eee;
         }
        .bulletin-print__title, .bulletin2-title {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 8px;
        }
        .bulletin-meta, .bulletin2-meta {
          margin-bottom: 8px;
          line-height: 1.1;
          font-size: 11px;
        }
        .bulletin-meta__label {
          font-weight: bold;
          margin-right: 5px;
        }
        .bulletin-table, .bulletin2-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        .bulletin-th, .bulletin-td, .bulletin2-th, .bulletin2-td {
          border: 1px solid black;
          padding: 2px;
          text-align: center;
          font-size: 10px;
        }
        .bulletin-th--left, .bulletin-td--left, .bulletin2-th--subject, .bulletin2-td--subject {
          text-align: left;
        }
        .bulletin-td--strong {
          font-weight: bold;
        }
        .bulletin-spacer {
          height: 8px;
        }
        .bulletin-scores {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }
        .bulletin-scores__cell {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
        }
        .bulletin-scores__box {
          border: 1.2px solid black;
          padding: 2px 6px;
          font-weight: bold;
          min-width: 30px;
          text-align: center;
        }
        .bulletin-signatures2, .bulletin2-sign {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
        .bulletin-signature2 {
          width: 160px;
          text-align: center;
          font-size: 10px;
        }
        .bulletin-signature2__line {
          border-bottom: 1px solid black;
          margin-top: 25px;
        }
        .bulletin2-header {
          text-align: center;
          margin-bottom: 8px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
        }
        .bulletin2-summary {
          margin-top: 8px;
          border: 1px solid black;
          padding: 6px;
          width: fit-content;
          margin-left: auto;
          font-size: 10px;
        }
        .bulletin2-summary__row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 2px;
        }
        .bulletin2-date-container {
          margin-top: 30px;
          text-align: right;
        }
        .bulletin2-date {
          display: inline-block;
          font-style: italic;
          font-size: 10px;
          border-top: 1px solid transparent;
        }
        .bulletin-preview {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .bulletin-preview__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
        }
        .bulletin-preview__panel {
          position: relative;
          background: white;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        .bulletin-preview__header {
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bulletin-preview__title {
          font-weight: bold;
          font-size: 18px;
        }
        .bulletin-preview__content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
        }
        .bulletin-preview__page {
          background: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
