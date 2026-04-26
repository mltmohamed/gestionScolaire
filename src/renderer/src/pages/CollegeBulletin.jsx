import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { useBulletin } from '@/hooks/useBulletin';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Printer,
  Save,
  School,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const TERMS = [
  { key: 't1', label: 'Composition du 1er trimestre', short: '1er trim.' },
  { key: 't2', label: 'Composition du 2e trimestre', short: '2e trim.' },
  { key: 't3', label: 'Composition du 3e trimestre', short: '3e trim.' },
];

const SUBJECTS = [
  { name: 'Redaction', coeff: 2 },
  { name: 'Dictee et questions', coeff: 2 },
  { name: 'Mathematiques', coeff: 3 },
  { name: 'Physique-Chimie', coeff: 2 },
  { name: 'Anglais', coeff: 2 },
  { name: 'Bio', coeff: 2 },
  { name: 'Hist-Geo', coeff: 2 },
  { name: 'ECM', coeff: 1 },
  { name: 'EPS', coeff: 1 },
  { name: 'Musique', coeff: 1 },
  { name: 'EF', coeff: 1 },
  { name: 'Dessin', coeff: 1 },
  { name: 'Lecture', coeff: 1 },
  { name: 'Recitation', coeff: 1 },
  { name: 'Conduite', coeff: 1 },
];

function makeDefaultAcademicYear() {
  const month = new Date().getMonth();
  const year = new Date().getFullYear();
  const start = month >= 7 ? year : year - 1;
  return `${start}-${start + 1}`;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractLevel(cls) {
  const raw = normalizeText(`${cls?.level || ''} ${cls?.name || ''}`);
  const match = raw.match(/\b([7-9])\s*(e|eme|annee)?\b/);
  return match ? Number(match[1]) : null;
}

function isCollegeClass(cls) {
  const level = extractLevel(cls);
  return level >= 7 && level <= 9;
}

function sortStudents(a, b) {
  const last = String(a.last_name || '').localeCompare(String(b.last_name || ''), 'fr', { sensitivity: 'base' });
  if (last !== 0) return last;
  return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fr', { sensitivity: 'base' });
}

function getStudentName(student) {
  return `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Eleve';
}

function emptyRows() {
  return SUBJECTS.reduce((acc, subject) => {
    acc[subject.name] = {
      note_classe: '',
      note_compo: '',
      coeff: String(subject.coeff),
      appreciation: '',
    };
    return acc;
  }, {});
}

function sanitizeNote(value, max = 20) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]/g, '');
  if (cleaned === '') return '';
  const parts = cleaned.split('.');
  const numeric = Number(parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned);
  if (!Number.isFinite(numeric)) return '';
  return String(Math.min(max, Math.max(0, numeric)));
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

function formatScore(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '';
  return Number(value).toFixed(digits);
}

function getAppreciation(avg) {
  if (avg === null) return '';
  if (avg >= 16) return 'Excellent';
  if (avg >= 14) return 'Tres bien';
  if (avg >= 12) return 'Bien';
  if (avg >= 10) return 'Assez bien';
  if (avg >= 8) return 'Passable';
  return 'Insuffisant';
}

function computeSubject(row) {
  const noteClasse = toNumber(row?.note_classe);
  const noteCompo = toNumber(row?.note_compo);
  const coeff = toNumber(row?.coeff) || 1;
  const compX2 = noteCompo === null ? null : noteCompo * 2;
  const moyenne = noteClasse === null || compX2 === null ? null : (noteClasse + compX2) / 3;
  const notesCoeff = moyenne === null ? null : moyenne * coeff;
  return {
    noteClasse,
    noteCompo,
    compX2,
    moyenne,
    coeff,
    notesCoeff,
    appreciation: row?.appreciation || getAppreciation(moyenne),
  };
}

function computeStudent(data) {
  const rows = SUBJECTS.map((subject) => ({
    subject: subject.name,
    ...computeSubject(data?.notes?.[subject.name] || {}),
  }));
  const totalCoeff = rows.reduce((sum, row) => sum + row.coeff, 0);
  const totalNotesCoeff = rows.reduce((sum, row) => sum + (row.notesCoeff || 0), 0);
  const moyenne = totalCoeff > 0 ? totalNotesCoeff / totalCoeff : null;
  const filled = rows.filter((row) => row.noteClasse !== null && row.noteCompo !== null).length;
  return {
    rows,
    filled,
    total: SUBJECTS.length,
    percent: Math.round((filled / SUBJECTS.length) * 100),
    complete: filled === SUBJECTS.length,
    totalCoeff,
    totalNotesCoeff,
    moyenne,
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function CollegeBulletin() {
  const { students, loading: studentsLoading } = useStudents();
  const { classes, loading: classesLoading } = useClasses();
  const { toast, ToastComponent } = useToast();
  const { success: showSuccess, error: showError } = toast;
  const { loading: bulletinLoading, getBulletin, saveBulletin } = useBulletin();

  const [academicYear, setAcademicYear] = useState(makeDefaultAcademicYear);
  const [step, setStep] = useState('class');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTermKey, setSelectedTermKey] = useState('');
  const [query, setQuery] = useState('');
  const [bulletins, setBulletins] = useState({});
  const [loadingClassData, setLoadingClassData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState('');

  const collegeClasses = useMemo(() => {
    return classes.filter(isCollegeClass).sort((a, b) => {
      const levelDelta = (extractLevel(a) || 0) - (extractLevel(b) || 0);
      if (levelDelta !== 0) return levelDelta;
      return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
    });
  }, [classes]);

  const selectedClass = useMemo(
    () => collegeClasses.find((cls) => String(cls.id) === String(selectedClassId)),
    [collegeClasses, selectedClassId]
  );

  const selectedTerm = useMemo(
    () => TERMS.find((term) => term.key === selectedTermKey),
    [selectedTermKey]
  );

  const classStudents = useMemo(() => {
    return students
      .filter((student) => String(student.class_id || '') === String(selectedClassId || ''))
      .sort(sortStudents);
  }, [students, selectedClassId]);

  const visibleStudents = useMemo(() => {
    const needle = normalizeText(query);
    if (!needle) return classStudents;
    return classStudents.filter((student) => normalizeText(`${student.first_name} ${student.last_name} ${student.matricule}`).includes(needle));
  }, [classStudents, query]);

  const classStatsById = useMemo(() => {
    return collegeClasses.reduce((acc, cls) => {
      acc[cls.id] = students.filter((student) => String(student.class_id || '') === String(cls.id)).length;
      return acc;
    }, {});
  }, [collegeClasses, students]);

  const computedByStudent = useMemo(() => {
    return Object.fromEntries(classStudents.map((student) => [student.id, computeStudent(bulletins[student.id])]));
  }, [bulletins, classStudents]);

  const rankedStudents = useMemo(() => {
    const rows = classStudents.map((student) => ({
      student,
      moyenne: computedByStudent[student.id]?.moyenne,
    }));
    const ranked = rows
      .filter((row) => row.moyenne !== null && row.moyenne !== undefined)
      .sort((a, b) => b.moyenne - a.moyenne);
    const rankById = {};
    ranked.forEach((row, index) => {
      rankById[row.student.id] = index + 1;
    });
    return rows.map((row) => ({ ...row, rank: rankById[row.student.id] || '' }));
  }, [classStudents, computedByStudent]);

  const classExtremes = useMemo(() => {
    const averages = classStudents
      .map((student) => computedByStudent[student.id]?.moyenne)
      .filter((value) => value !== null && value !== undefined && Number.isFinite(value));
    if (!averages.length) return { best: null, last: null };
    return {
      best: Math.max(...averages),
      last: Math.min(...averages),
    };
  }, [classStudents, computedByStudent]);

  const globalStats = useMemo(() => {
    const completed = classStudents.filter((student) => computedByStudent[student.id]?.complete).length;
    const filled = classStudents.reduce((sum, student) => sum + (computedByStudent[student.id]?.filled || 0), 0);
    const total = classStudents.length * SUBJECTS.length;
    const averages = classStudents
      .map((student) => computedByStudent[student.id]?.moyenne)
      .filter((value) => value !== null && value !== undefined);
    const classAverage = averages.length ? averages.reduce((sum, value) => sum + value, 0) / averages.length : null;
    return {
      completed,
      filled,
      total,
      percent: total ? Math.round((filled / total) * 100) : 0,
      classAverage,
    };
  }, [classStudents, computedByStudent]);

  const loadClassBulletins = useCallback(async () => {
    if (!selectedClassId || !academicYear) return;
    setLoadingClassData(true);
    try {
      const entries = await Promise.all(
        classStudents.map(async (student) => {
          const data = await getBulletin(student.id, academicYear);
          let payload = {};
          try {
            payload = data?.meta?.data_json ? JSON.parse(data.meta.data_json) : {};
          } catch {
            payload = {};
          }
          const termData = payload?.terms?.[selectedTermKey] || {};
          return [
            student.id,
            {
              notes: { ...emptyRows(), ...(termData.notes || {}) },
              decision: termData.decision || payload.decision || data?.meta?.decision || '',
              observation: termData.observation || data?.meta?.observations_generales || '',
              moyenne1: termData.moyenne1 || '',
              moyenneDernier: termData.moyenneDernier || '',
            },
          ];
        })
      );
      setBulletins(Object.fromEntries(entries));
      setActiveStudentId(classStudents[0]?.id || '');
    } catch (error) {
      console.error('Erreur chargement bulletins second cycle:', error);
      showError('Impossible de charger les bulletins de cette classe');
    } finally {
      setLoadingClassData(false);
    }
  }, [academicYear, classStudents, getBulletin, selectedClassId, selectedTermKey, showError]);

  useEffect(() => {
    if (step === 'entry') {
      loadClassBulletins();
    }
  }, [loadClassBulletins, step]);

  const updateRow = (studentId, subject, field, value) => {
    setBulletins((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: {
          ...(prev[studentId]?.notes || emptyRows()),
          [subject]: {
            ...((prev[studentId]?.notes || emptyRows())[subject] || {}),
            [field]: field === 'appreciation' ? value : sanitizeNote(value, field === 'coeff' ? 20 : 20),
          },
        },
      },
    }));
  };

  const updateMeta = (studentId, field, value) => {
    setBulletins((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const saveOneStudent = async (student) => {
    const current = bulletins[student.id] || { notes: emptyRows() };
    const rank = rankedStudents.find((row) => row.student.id === student.id)?.rank || '';
    const previous = await getBulletin(student.id, academicYear);
    let previousPayload = {};
    try {
      previousPayload = previous?.meta?.data_json ? JSON.parse(previous.meta.data_json) : {};
    } catch {
      previousPayload = {};
    }
    const nextPayload = {
      ...previousPayload,
      terms: {
        ...(previousPayload.terms || {}),
        [selectedTermKey]: {
          label: selectedTerm?.label || '',
          notes: current.notes || emptyRows(),
          decision: current.decision || '',
          observation: current.observation || '',
          moyenne1: current.moyenne1 || '',
          moyenneDernier: current.moyenneDernier || '',
        },
      },
    };
    const result = await saveBulletin(student.id, academicYear, {
      notes: [],
      meta: {
        bulletin_type: 'college',
        rang: rank ? `${rank}/${classStudents.length}` : '',
        decision: current.decision || '',
        observations_generales: current.observation || '',
        data_json: JSON.stringify(nextPayload),
      },
    });
    if (!result?.success) throw new Error(result?.error || 'Erreur sauvegarde bulletin');
  };

  const handleSaveAll = async () => {
    if (!classStudents.length) return false;
    setSaving(true);
    try {
      for (const student of classStudents) {
        await saveOneStudent(student);
      }
      showSuccess('Bulletins du second cycle enregistres');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde bulletins second cycle:', error);
      showError(error?.message || 'Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const makePrintHtml = () => {
    const className = selectedClass?.name || '';
    const rankById = Object.fromEntries(rankedStudents.map((row) => [row.student.id, row.rank]));
    const termLabel = selectedTerm?.label || 'Composition';

    const printStudents = [...classStudents].sort((a, b) => {
      const rankA = rankById[a.id] || Number.MAX_SAFE_INTEGER;
      const rankB = rankById[b.id] || Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return sortStudents(a, b);
    });

    const pages = printStudents.map((student) => {
      const current = bulletins[student.id] || { notes: emptyRows() };
      const computed = computeStudent(current);
      const rank = rankById[student.id] ? `${rankById[student.id]}/${classStudents.length}` : '';

      return `
        <section class="page">
          <header class="header">
            <div>Academie de Kalaban coro</div>
            <div>CAP DE KALABANCORO</div>
            <div>Ecole privee LA SAGESSE</div>
          </header>
          <h1>${escapeHtml(termLabel.toUpperCase())}</h1>
          <div class="meta">
            <span>Bulletin de l'eleve: <b>${escapeHtml(getStudentName(student))}</b></span>
            <span>Annee scolaire: <b>${escapeHtml(academicYear)}</b></span>
            <span>Classe: <b>${escapeHtml(className)}</b></span>
          </div>
          <table>
            <thead>
              <tr>
                <th class="subject">Matieres</th>
                <th>Notes classe</th>
                <th>Note compo</th>
                <th>Comp x 2</th>
                <th>Moy. gene</th>
                <th>Coeff</th>
                <th>Notes coeff</th>
                <th class="app">Appreciations</th>
              </tr>
            </thead>
            <tbody>
              ${computed.rows.map((row) => `
                <tr>
                  <td class="subject">${escapeHtml(row.subject)}</td>
                  <td>${formatScore(row.noteClasse, 1)}</td>
                  <td>${formatScore(row.noteCompo, 1)}</td>
                  <td>${formatScore(row.compX2, 1)}</td>
                  <td>${formatScore(row.moyenne, 2)}</td>
                  <td>${formatScore(row.coeff, 0)}</td>
                  <td>${formatScore(row.notesCoeff, 2)}</td>
                  <td class="app">${escapeHtml(row.appreciation)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="5">Total coeff</td>
                <td>${formatScore(computed.totalCoeff, 0)}</td>
                <td>${formatScore(computed.totalNotesCoeff, 2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div class="bottom">
            <div class="decision">
              <b>Decision / Observations</b>
              <p>${escapeHtml(current.decision || current.observation || '')}</p>
            </div>
            <div class="summary">
              <div><span>Total:</span><b>${formatScore(computed.totalNotesCoeff, 2)}</b></div>
              <div><span>Moyenne:</span><b>${formatScore(computed.moyenne, 2)}</b></div>
              <div><span>Rang:</span><b>${escapeHtml(rank)}</b></div>
              <div><span>Moyenne du 1er:</span><b>${formatScore(classExtremes.best) || ''}</b></div>
              <div><span>Moyenne du dernier:</span><b>${formatScore(classExtremes.last) || ''}</b></div>
            </div>
          </div>
          <footer>
            <strong>Le directeur</strong>
            <strong>Les parents</strong>
            <span>Kourale le ${new Date().toLocaleDateString('fr-FR')}</span>
          </footer>
        </section>
      `;
    }).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bulletins ${escapeHtml(className)} - ${escapeHtml(termLabel)}</title>
          <style>
            @page { size: A4 portrait; margin: 9mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111827; font-family: Arial, sans-serif; background: white; }
            .page { min-height: 277mm; page-break-after: always; padding: 6mm; border: 1.5px solid #111827; display: flex; flex-direction: column; }
            .page:last-child { page-break-after: auto; }
            .header { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center; font-size: 12px; font-weight: 800; border-bottom: 2px solid #111827; padding-bottom: 8px; }
            h1 { margin: 10px 0; text-align: center; font-size: 18px; letter-spacing: 0; }
            .meta { display: grid; grid-template-columns: 1.4fr 1fr 0.8fr; gap: 8px; margin-bottom: 8px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #111827; padding: 5px 4px; font-size: 11px; height: 28px; text-align: center; }
            th { background: #eef2f7; font-weight: 800; }
            .subject { width: 24%; text-align: left; font-weight: 700; }
            .app { width: 20%; text-align: left; }
            .total td { background: #f8fafc; font-weight: 800; }
            .bottom { display: grid; grid-template-columns: 1fr 230px; gap: 12px; margin-top: 16px; }
            .decision, .summary { border: 1px solid #111827; min-height: 118px; padding: 10px; }
            .decision p { min-height: 78px; margin: 8px 0 0; font-size: 12px; line-height: 1.5; }
            .summary div { display: flex; justify-content: space-between; border-bottom: 1px solid #d1d5db; padding: 6px 0; font-size: 12px; }
            .summary div:last-child { border-bottom: 0; }
            footer { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: start; gap: 12px; margin-top: 24px; padding-top: 18px; padding-bottom: 18mm; font-size: 12px; text-transform: uppercase; }
            footer span { text-align: right; text-transform: none; }
          </style>
        </head>
        <body>${pages}</body>
      </html>
    `;
  };

  const handlePrint = async () => {
    const saved = await handleSaveAll();
    if (!saved) return;

    const previousFrame = document.getElementById('college-bulletin-print-frame');
    if (previousFrame) previousFrame.remove();

    const printFrame = document.createElement('iframe');
    printFrame.id = 'college-bulletin-print-frame';
    printFrame.title = 'Impression des bulletins second cycle';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;
    const frameDocument = frameWindow?.document;
    if (!frameWindow || !frameDocument) {
      printFrame.remove();
      showError('Impossible de preparer l impression');
      return;
    }

    frameDocument.open();
    frameDocument.write(makePrintHtml());
    frameDocument.close();
    setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
      setTimeout(() => printFrame.remove(), 1000);
    }, 350);
  };

  const loading = studentsLoading || classesLoading;

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#0066CC]" />
        <span className="text-sm text-slate-600">Chargement des donnees...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in">
      {ToastComponent}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Second cycle - 7e a 9e
              </div>
              <h1 className="text-2xl font-bold tracking-normal">Bulletins trimestriels</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Choisissez une classe, une composition, renseignez les notes de classe et de composition, puis imprimez toute la classe par ordre alphabetique.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/10 p-2 text-center">
              <MetricMini label="Classes" value={collegeClasses.length} />
              <MetricMini label="Eleves" value={students.filter((student) => collegeClasses.some((cls) => String(cls.id) === String(student.class_id))).length} />
              <MetricMini label="Matieres" value={SUBJECTS.length} />
            </div>
          </div>
        </div>

        <div className="grid border-b border-slate-200 bg-slate-50 md:grid-cols-3">
          {[
            { id: 'class', label: 'Classe', icon: School, done: Boolean(selectedClassId) },
            { id: 'term', label: 'Composition', icon: CalendarDays, done: Boolean(selectedTermKey) },
            { id: 'entry', label: 'Saisie et impression', icon: FileText, done: globalStats.percent === 100 && classStudents.length > 0 },
          ].map((item, index) => {
            const Icon = item.icon;
            const active = step === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'class') setStep('class');
                  if (item.id === 'term' && selectedClassId) setStep('term');
                  if (item.id === 'entry' && selectedClassId && selectedTermKey) setStep('entry');
                }}
                className={cn(
                  'flex items-center justify-between border-b border-slate-200 px-5 py-4 text-left transition-colors md:border-b-0 md:border-r',
                  active ? 'bg-white' : 'hover:bg-white/80',
                  index === 2 && 'md:border-r-0'
                )}
              >
                <span className="flex items-center gap-3">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-md', active ? 'bg-[#0066CC] text-white' : item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600')}>
                    {item.done && !active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">{item.label}</span>
                    <span className="text-xs text-slate-500">Etape {index + 1}</span>
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {step === 'class' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Choisir la classe</h2>
                  <p className="text-sm text-slate-500">Classes de 7e, 8e et 9e annee.</p>
                </div>
                <div className="w-full md:w-56">
                  <label className="text-xs font-medium text-slate-600">Annee scolaire</label>
                  <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="mt-1 h-10" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {collegeClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedTermKey('');
                      setBulletins({});
                      setStep('term');
                    }}
                    className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0066CC] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase text-[#0066CC]">Niveau {extractLevel(cls) || '-'}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950">{cls.name}</h3>
                        <p className="text-sm text-slate-500">{cls.level || 'Second cycle'} - {cls.academic_year || academicYear}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-600 group-hover:bg-[#0066CC] group-hover:text-white">
                        <Users className="h-5 w-5" />
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-sm text-slate-500">Effectif</span>
                      <strong className="text-slate-950">{classStatsById[cls.id] || 0} eleve(s)</strong>
                    </div>
                  </button>
                ))}
              </div>

              {collegeClasses.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Aucune classe de second cycle n'a ete trouvee.
                </div>
              )}
            </div>
          )}

          {step === 'term' && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setStep('class')} className="px-0 text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux classes
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{selectedClass?.name}</h2>
                <p className="text-sm text-slate-500">Choisissez la composition a saisir.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {TERMS.map((term) => (
                  <button
                    key={term.key}
                    type="button"
                    onClick={() => {
                      setSelectedTermKey(term.key);
                      setStep('entry');
                    }}
                    className={cn(
                      'rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                      selectedTermKey === term.key ? 'border-[#0066CC] bg-blue-50' : 'border-slate-200 bg-white hover:border-[#0066CC]'
                    )}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-bold text-slate-950">{term.label}</h3>
                    <p className="text-sm text-slate-500">{term.short}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'entry' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <Button variant="ghost" onClick={() => setStep('term')} className="mb-2 px-0 text-slate-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux compositions
                  </Button>
                  <h2 className="text-xl font-bold text-slate-950">{selectedClass?.name} - {selectedTerm?.label}</h2>
                  <p className="text-sm text-slate-500">{classStudents.length} eleve(s), impression par ordre alphabetique.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={loadClassBulletins} disabled={loadingClassData || bulletinLoading}>
                    {loadingClassData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Recharger
                  </Button>
                  <Button variant="outline" onClick={handleSaveAll} disabled={saving || loadingClassData}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer tout
                  </Button>
                  <Button onClick={handlePrint} disabled={saving || loadingClassData || classStudents.length === 0} className="bg-[#0066CC] hover:bg-[#005bb8]">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer la classe
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <Metric icon={Users} label="Eleves" value={classStudents.length} />
                <Metric icon={CheckCircle2} label="Bulletins complets" value={`${globalStats.completed}/${classStudents.length}`} tone="emerald" />
                <Metric icon={BarChart3} label="Progression" value={`${globalStats.percent}%`} tone="blue" />
                <Metric icon={AlertCircle} label="Moyenne classe" value={formatScore(globalStats.classAverage) || '-'} tone="amber" />
              </div>

              <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
                <aside className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un eleve..." className="pl-9" />
                  </div>
                  <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
                    {visibleStudents.map((student) => {
                      const computed = computedByStudent[student.id] || computeStudent();
                      const active = String(activeStudentId) === String(student.id);
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setActiveStudentId(student.id)}
                          className={cn('w-full rounded-md border p-3 text-left transition', active ? 'border-[#0066CC] bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{getStudentName(student)}</p>
                              <p className="text-xs text-slate-500">{student.matricule || 'Sans matricule'}</p>
                            </div>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', computed.complete ? 'bg-emerald-100 text-emerald-700' : computed.filled ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                              {computed.filled}/{computed.total}
                            </span>
                          </div>
                          <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-[#0066CC]" style={{ width: `${computed.percent}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <main className="rounded-lg border border-slate-200 bg-white">
                  {loadingClassData ? (
                    <div className="flex min-h-[420px] items-center justify-center">
                      <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#0066CC]" />
                      <span className="text-sm text-slate-600">Chargement des notes...</span>
                    </div>
                  ) : activeStudentId ? (
                    <StudentEntry
                      student={classStudents.find((student) => String(student.id) === String(activeStudentId))}
                      bulletin={bulletins[activeStudentId]}
                      selectedTerm={selectedTerm}
                      computed={computedByStudent[activeStudentId] || computeStudent()}
                      rank={rankedStudents.find((row) => String(row.student.id) === String(activeStudentId))?.rank}
                      classSize={classStudents.length}
                      classAverage={globalStats.classAverage}
                      bestAverage={classExtremes.best}
                      lastAverage={classExtremes.last}
                      onChangeRow={(subject, field, value) => updateRow(activeStudentId, subject, field, value)}
                      onChangeMeta={(field, value) => updateMeta(activeStudentId, field, value)}
                    />
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-500">Selectionnez un eleve pour commencer.</div>
                  )}
                </main>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricMini({ label, value }) {
  return (
    <div className="rounded-md bg-white px-4 py-3 text-slate-950">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-md', tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function StudentEntry({ student, bulletin, selectedTerm, computed, rank, classSize, classAverage, bestAverage, lastAverage, onChangeRow, onChangeMeta }) {
  const notes = bulletin?.notes || emptyRows();

  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-[#0066CC]">{selectedTerm?.short}</p>
            <h3 className="text-xl font-bold text-slate-950">{getStudentName(student)}</h3>
            <p className="text-sm text-slate-500">{student?.matricule || 'Sans matricule'}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Saisies" value={`${computed.filled}/${SUBJECTS.length}`} />
            <MiniStat label="Moyenne" value={formatScore(computed.moyenne) || '-'} />
            <MiniStat label="Rang" value={rank ? `${rank}/${classSize}` : '-'} />
          </div>
        </div>
      </div>

      <div className="grid gap-0 xl:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="w-[22%] px-3 py-3 text-left text-xs font-bold uppercase text-slate-500">Matiere</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">Classe</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">Compo</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">x2</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">Moy.</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">Coeff</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase text-slate-500">N. coeff</th>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase text-slate-500">Appreciation</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((subject, index) => {
                const row = notes[subject.name] || {};
                const computedRow = computeSubject(row);
                return (
                  <tr key={subject.name} className={cn('border-b border-slate-100', index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}>
                    <td className="px-3 py-2.5 text-sm font-medium text-slate-900">{subject.name}</td>
                    <td className="px-3 py-2.5">
                      <Input value={row.note_classe || ''} onChange={(event) => onChangeRow(subject.name, 'note_classe', event.target.value)} inputMode="decimal" className="mx-auto h-9 w-20 text-center font-semibold" placeholder="/20" />
                    </td>
                    <td className="px-3 py-2.5">
                      <Input value={row.note_compo || ''} onChange={(event) => onChangeRow(subject.name, 'note_compo', event.target.value)} inputMode="decimal" className="mx-auto h-9 w-20 text-center font-semibold" placeholder="/20" />
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">{formatScore(computedRow.compX2, 1) || '-'}</td>
                    <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-950">{formatScore(computedRow.moyenne) || '-'}</td>
                    <td className="px-3 py-2.5">
                      <Input value={row.coeff || subject.coeff} onChange={(event) => onChangeRow(subject.name, 'coeff', event.target.value)} inputMode="decimal" className="mx-auto h-9 w-16 text-center font-semibold" />
                    </td>
                    <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-950">{formatScore(computedRow.notesCoeff) || '-'}</td>
                    <td className="px-3 py-2.5">
                      <Input value={row.appreciation || computedRow.appreciation || ''} onChange={(event) => onChangeRow(subject.name, 'appreciation', event.target.value)} className="h-9 min-w-[160px]" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="border-t border-slate-200 p-4 xl:border-l xl:border-t-0">
          <div className="rounded-lg bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-300">Resultat composition</p>
            <p className="mt-1 text-3xl font-bold">{formatScore(computed.moyenne) || '-'}</p>
            <p className="text-sm text-slate-300">Moyenne generale /20</p>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-amber-300" style={{ width: `${computed.percent}%` }} />
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <InfoRow label="Total coeff" value={formatScore(computed.totalCoeff, 0)} />
            <InfoRow label="Total notes coeff" value={formatScore(computed.totalNotesCoeff)} />
            <InfoRow label="Moyenne classe" value={formatScore(classAverage) || '-'} />
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-900">Decision / observation</label>
          <textarea
            value={bulletin?.decision || ''}
            onChange={(event) => onChangeMeta('decision', event.target.value)}
            className="mt-2 min-h-[96px] w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-[#0066CC]"
            placeholder="Decision ou observation..."
          />

          <div className="mt-4 grid gap-3">
            <InfoRow label="Moyenne du 1er" value={formatScore(bestAverage) || '-'} />
            <InfoRow label="Moyenne du dernier" value={formatScore(lastAverage) || '-'} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
