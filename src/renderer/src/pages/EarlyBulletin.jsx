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

const MONTHS = [
  { key: 'oct', label: 'Octobre', short: 'OCT.' },
  { key: 'nov', label: 'Novembre', short: 'NOV.' },
  { key: 'dec', label: 'Decembre', short: 'DEC.' },
  { key: 'jan', label: 'Janvier', short: 'JANV.' },
  { key: 'feb', label: 'Fevrier', short: 'FEV.' },
  { key: 'mar', label: 'Mars', short: 'MARS' },
  { key: 'apr', label: 'Avril', short: 'AVR.' },
  { key: 'may', label: 'Mai', short: 'MAI' },
  { key: 'jun', label: 'Juin', short: 'JUIN' },
];

const SUBJECTS = [
  'Dictee',
  'Mathematiques',
  'Lecture',
  'Copie / Ecriture',
  'Langage',
  'Chant',
  'Recitation',
  'Dessin',
  'Morale',
  'Conduite',
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

function extractEarlyLevel(cls) {
  const raw = normalizeText(`${cls?.level || ''} ${cls?.name || ''}`);
  if (/\b(jardin|maternelle|petite|moyenne|grande)\b/.test(raw)) return 0;
  const match = raw.match(/\b([1-2])\s*(e|ere|eme|annee)?\b/);
  return match ? Number(match[1]) : null;
}

function isEarlyClass(cls) {
  const level = extractEarlyLevel(cls);
  return level !== null && level >= 0 && level <= 2;
}

function sortStudents(a, b) {
  const last = String(a.last_name || '').localeCompare(String(b.last_name || ''), 'fr', { sensitivity: 'base' });
  if (last !== 0) return last;
  return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fr', { sensitivity: 'base' });
}

function getStudentName(student) {
  return `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Eleve';
}

function emptyNotes() {
  return SUBJECTS.reduce((acc, subject) => {
    acc[subject] = MONTHS.reduce((months, month) => {
      months[month.key] = '';
      return months;
    }, {});
    return acc;
  }, {});
}

function emptyAppreciations() {
  return SUBJECTS.reduce((acc, subject) => {
    acc[subject] = MONTHS.reduce((months, month) => {
      months[month.key] = '';
      return months;
    }, {});
    return acc;
  }, {});
}

function emptyMonthlyMeta() {
  return MONTHS.reduce((acc, month) => {
    acc[month.key] = { absences: '', retards: '' };
    return acc;
  }, {});
}

function notesArrayToGrid(notes = []) {
  const grid = emptyNotes();
  for (const row of Array.isArray(notes) ? notes : []) {
    const subject = SUBJECTS.find((s) => s === row.subject);
    const month = MONTHS.find((m) => m.key === row.month_key);
    if (!subject || !month) continue;
    grid[subject][month.key] = row.note === null || row.note === undefined ? '' : String(row.note);
  }
  return grid;
}

function gridToNotesArray(grid) {
  const notes = [];
  for (const subject of SUBJECTS) {
    for (const month of MONTHS) {
      const value = grid?.[subject]?.[month.key];
      if (value === '' || value === null || value === undefined) continue;
      const note = Number(String(value).replace(',', '.'));
      if (Number.isFinite(note) && note >= 0 && note <= 10) {
        notes.push({ subject, month_key: month.key, note });
      }
    }
  }
  return notes;
}

function sanitizeNote(value) {
  const cleaned = String(value || '').replace(',', '.').replace(/[^\d.]/g, '');
  if (cleaned === '') return '';
  const parts = cleaned.split('.');
  const numeric = Number(parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned);
  if (!Number.isFinite(numeric)) return '';
  return String(Math.min(10, Math.max(0, numeric)));
}

function getEarlyAppreciation(note) {
  if (note === '' || note === null || note === undefined) return '';
  const value = Number(String(note).replace(',', '.'));
  if (!Number.isFinite(value)) return '';
  if (value >= 9) return 'Excellent';
  if (value >= 8) return 'Tres bien';
  if (value >= 7) return 'Bien';
  if (value >= 6) return 'Assez bien';
  if (value >= 5) return 'Passable';
  if (value >= 4) return 'Insuffisant';
  if (value >= 3) return 'Faible';
  if (value >= 2) return 'Mauvais';
  if (value >= 1) return 'Mal';
  return 'Nul';
}

function sanitizeCount(value) {
  const cleaned = String(value || '').replace(/[^\d]/g, '');
  if (cleaned === '') return '';
  return String(Math.max(0, Number(cleaned)));
}

function average(values) {
  const numbers = values.map((v) => Number(String(v).replace(',', '.'))).filter((n) => Number.isFinite(n));
  return numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : null;
}

function sum(values) {
  return values.reduce((total, value) => {
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) ? total + number : total;
  }, 0);
}

function formatScore(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '';
  return Number(value).toFixed(digits);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function EarlyBulletin() {
  const { students, loading: studentsLoading } = useStudents();
  const { classes, loading: classesLoading } = useClasses();
  const { toast, ToastComponent } = useToast();
  const { success: showSuccess, error: showError } = toast;
  const { loading: bulletinLoading, getBulletin, saveBulletin } = useBulletin();

  const [academicYear, setAcademicYear] = useState(makeDefaultAcademicYear);
  const [step, setStep] = useState('class');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMonthKey, setSelectedMonthKey] = useState('');
  const [query, setQuery] = useState('');
  const [bulletins, setBulletins] = useState({});
  const [activeStudentId, setActiveStudentId] = useState('');
  const [loadingClassData, setLoadingClassData] = useState(false);
  const [saving, setSaving] = useState(false);

  const earlyClasses = useMemo(() => {
    return classes.filter(isEarlyClass).sort((a, b) => {
      const levelDelta = (extractEarlyLevel(a) || 0) - (extractEarlyLevel(b) || 0);
      if (levelDelta !== 0) return levelDelta;
      return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
    });
  }, [classes]);

  const selectedClass = useMemo(
    () => earlyClasses.find((cls) => String(cls.id) === String(selectedClassId)),
    [earlyClasses, selectedClassId]
  );

  const selectedMonth = useMemo(
    () => MONTHS.find((month) => month.key === selectedMonthKey),
    [selectedMonthKey]
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
    return earlyClasses.reduce((acc, cls) => {
      acc[cls.id] = students.filter((student) => String(student.class_id || '') === String(cls.id)).length;
      return acc;
    }, {});
  }, [earlyClasses, students]);

  const selectedMonthValues = useCallback(
    (studentId) => SUBJECTS.map((subject) => bulletins[studentId]?.notes?.[subject]?.[selectedMonthKey] || ''),
    [bulletins, selectedMonthKey]
  );

  const getCompletion = useCallback(
    (studentId) => {
      const filled = selectedMonthValues(studentId).filter((value) => value !== '').length;
      return {
        filled,
        total: SUBJECTS.length,
        percent: Math.round((filled / SUBJECTS.length) * 100),
        complete: filled === SUBJECTS.length,
      };
    },
    [selectedMonthValues]
  );

  const studentsWithStats = useMemo(() => {
    const rows = classStudents.map((student) => ({
      student,
      monthAverage: average(selectedMonthValues(student.id)),
    }));
    const ranked = rows
      .filter((row) => row.monthAverage !== null)
      .sort((a, b) => b.monthAverage - a.monthAverage);
    const rankById = {};
    ranked.forEach((row, index) => {
      rankById[row.student.id] = index + 1;
    });
    return rows.map((row) => ({ ...row, rank: rankById[row.student.id] || '' }));
  }, [classStudents, selectedMonthValues]);

  const globalStats = useMemo(() => {
    const completed = classStudents.filter((student) => getCompletion(student.id).complete).length;
    const filledCells = classStudents.reduce((total, student) => total + getCompletion(student.id).filled, 0);
    const totalCells = classStudents.length * SUBJECTS.length;
    const averages = studentsWithStats.map((row) => row.monthAverage).filter((value) => value !== null);
    return {
      completed,
      filledCells,
      totalCells,
      percent: totalCells ? Math.round((filledCells / totalCells) * 100) : 0,
      classAverage: average(averages),
      bestAverage: averages.length ? Math.max(...averages) : null,
      lowestAverage: averages.length ? Math.min(...averages) : null,
    };
  }, [classStudents, getCompletion, studentsWithStats]);

  const loadClassBulletins = useCallback(async () => {
    if (!selectedClassId || !academicYear || !selectedMonthKey) return;
    setLoadingClassData(true);
    try {
      const entries = await Promise.all(
        classStudents.map(async (student) => {
          const data = await getBulletin(student.id, academicYear);
          let metaData = {};
          try {
            metaData = data?.meta?.data_json ? JSON.parse(data.meta.data_json) : {};
          } catch {
            metaData = {};
          }
          const early = metaData?.early || {};
          return [
            student.id,
            {
              notes: notesArrayToGrid(data?.notes),
              appreciations: { ...emptyAppreciations(), ...(early.appreciations || {}) },
              monthly: { ...emptyMonthlyMeta(), ...(early.monthly || {}) },
            },
          ];
        })
      );
      setBulletins(Object.fromEntries(entries));
      setActiveStudentId(classStudents[0]?.id || '');
    } catch (error) {
      console.error('Erreur chargement bulletins jardin-2e:', error);
      showError('Impossible de charger les bulletins de cette classe');
    } finally {
      setLoadingClassData(false);
    }
  }, [academicYear, classStudents, getBulletin, selectedClassId, selectedMonthKey, showError]);

  useEffect(() => {
    if (step === 'entry') {
      loadClassBulletins();
    }
  }, [loadClassBulletins, step]);

  const updateNote = (studentId, subject, value) => {
    const note = sanitizeNote(value);
    setBulletins((prev) => {
      const current = prev[studentId] || {};
      const currentNotes = current.notes || emptyNotes();
      return {
        ...prev,
        [studentId]: {
          ...current,
          appreciations: current.appreciations || emptyAppreciations(),
          monthly: current.monthly || emptyMonthlyMeta(),
          notes: {
            ...currentNotes,
            [subject]: {
              ...(currentNotes[subject] || {}),
              [selectedMonthKey]: note,
            },
          },
        },
      };
    });
  };

  const updateMonthly = (studentId, field, value) => {
    setBulletins((prev) => {
      const current = prev[studentId] || {};
      const currentMonthly = current.monthly || emptyMonthlyMeta();
      return {
        ...prev,
        [studentId]: {
          ...current,
          notes: current.notes || emptyNotes(),
          appreciations: current.appreciations || emptyAppreciations(),
          monthly: {
            ...currentMonthly,
            [selectedMonthKey]: {
              ...(currentMonthly[selectedMonthKey] || {}),
              [field]: sanitizeCount(value),
            },
          },
        },
      };
    });
  };

  const saveOneStudent = async (student) => {
    const current = bulletins[student.id] || {
      notes: emptyNotes(),
      appreciations: emptyAppreciations(),
      monthly: emptyMonthlyMeta(),
    };
    const rank = studentsWithStats.find((row) => row.student.id === student.id)?.rank || '';
    const previous = await getBulletin(student.id, academicYear);
    let previousPayload = {};
    try {
      previousPayload = previous?.meta?.data_json ? JSON.parse(previous.meta.data_json) : {};
    } catch {
      previousPayload = {};
    }
    const nextPayload = {
      ...previousPayload,
      early: {
        ...(previousPayload.early || {}),
        selected_month: selectedMonthKey,
        appreciations: current.appreciations || emptyAppreciations(),
        monthly: current.monthly || emptyMonthlyMeta(),
      },
    };

    const result = await saveBulletin(student.id, academicYear, {
      notes: gridToNotesArray(current.notes),
      meta: {
        bulletin_type: 'early',
        rang: rank ? `${rank}/${classStudents.length}` : '',
        decision: '',
        observations_generales: '',
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
      showSuccess('Bulletins jardin a 2e enregistres');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde bulletins jardin-2e:', error);
      showError(error?.message || 'Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const makePrintHtml = () => {
    const monthLabel = selectedMonth?.label || '';
    const className = selectedClass?.name || '';
    const rankById = Object.fromEntries(studentsWithStats.map((row) => [row.student.id, row.rank]));

    const bulletinsHtml = classStudents
      .map((student) => {
        const row = bulletins[student.id] || {
          notes: emptyNotes(),
          appreciations: emptyAppreciations(),
          monthly: emptyMonthlyMeta(),
        };
        const values = selectedMonthValues(student.id);
        const total = sum(values);
        const studentAverage = average(values);
        const monthly = row.monthly?.[selectedMonthKey] || {};
        const rank = rankById[student.id] ? `${rankById[student.id]}/${classStudents.length}` : '';

        return `
          <section class="bulletin">
            <h1>${escapeHtml(monthLabel.toUpperCase())}</h1>
            <div class="attendance">
              <div><b>ASSIDUITE</b><span>Nombre d'absences : ${escapeHtml(monthly.absences || '........')}</span></div>
              <div><b>PONCTUALITE</b><span>Nombre de retards : ${escapeHtml(monthly.retards || '........')}</span></div>
            </div>
            <div class="identity">
              <span><b>Eleve:</b> ${escapeHtml(getStudentName(student))}</span>
              <span><b>Classe:</b> ${escapeHtml(className || '-')}</span>
              <span><b>Annee:</b> ${escapeHtml(academicYear)}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="subject">MATIERES</th>
                  <th class="note">NOTES</th>
                  <th>APPRECIATIONS DU MATIERE</th>
                </tr>
              </thead>
              <tbody>
                ${SUBJECTS.map((subject) => {
                  const note = row.notes?.[subject]?.[selectedMonthKey] || '';
                  const appreciation = getEarlyAppreciation(note);
                  return `
                    <tr>
                      <td class="subject">${escapeHtml(subject)}</td>
                      <td class="note">${escapeHtml(note)}</td>
                      <td class="app">${escapeHtml(appreciation)}</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total">
                  <td class="subject">TOTAL</td>
                  <td class="note">${formatScore(total, 1)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div class="summary">
              <div>
                <p>Moyenne de l'eleve : <b>${formatScore(studentAverage) || '..........'}</b></p>
                <p>Moyenne la plus elevee : <b>${formatScore(globalStats.bestAverage) || '..........'}</b></p>
                <p>Moyenne la plus faible : <b>${formatScore(globalStats.lowestAverage) || '..........'}</b></p>
              </div>
              <div>
                <p>Rang : <b>${escapeHtml(rank || '..........')}</b></p>
                <p>Nombre d'eleves : <b>${classStudents.length || '..........'}</b></p>
              </div>
            </div>
          </section>
        `;
      })
      .join('');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bulletins ${escapeHtml(className)} - ${escapeHtml(monthLabel)}</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111827; font-family: Arial, sans-serif; background: white; }
            .bulletin { width: 184mm; height: 138mm; margin: 0 auto 5mm; padding: 4mm; overflow: hidden; border: 1.4px solid #111827; border-radius: 7mm; page-break-after: auto; break-inside: avoid; page-break-inside: avoid; }
            .bulletin:nth-of-type(2n) { page-break-after: always; margin-bottom: 0; }
            .bulletin:last-child { page-break-after: auto; }
            h1 { margin: 0 0 2mm; text-align: center; font-size: 10px; letter-spacing: 0; }
            .attendance { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-bottom: 1mm; font-size: 7.5px; }
            .attendance b { display: block; font-size: 7.5px; text-decoration: underline; }
            .attendance span { display: block; margin-top: .5mm; }
            .identity { display: grid; grid-template-columns: 1.3fr 0.8fr 0.8fr; gap: 2mm; margin-bottom: 1.5mm; font-size: 7.5px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #111827; padding: .8mm 1.2mm; height: 7mm; font-size: 8px; vertical-align: middle; }
            th { height: 6mm; text-align: center; font-weight: 800; }
            .subject { width: 42%; text-align: left; }
            .note { width: 15%; text-align: center; }
            .app { text-align: left; }
            .total td { font-weight: 800; }
            .summary { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 10mm; margin-top: 4mm; font-size: 8.5px; }
            .summary p { margin: 0 0 2.2mm; }
          </style>
        </head>
        <body>${bulletinsHtml}</body>
      </html>
    `;
  };

  const handlePrint = async () => {
    const saved = await handleSaveAll();
    if (!saved) return;

    const previousFrame = document.getElementById('early-bulletin-print-frame');
    if (previousFrame) previousFrame.remove();

    const printFrame = document.createElement('iframe');
    printFrame.id = 'early-bulletin-print-frame';
    printFrame.title = 'Impression des bulletins jardin a 2e';
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
                Jardin a 2e annee
              </div>
              <h1 className="text-2xl font-bold tracking-normal">Bulletins mensuels</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Selectionnez une classe, choisissez le mois, renseignez les notes, les appreciations, les absences et les retards.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/10 p-2 text-center">
              <MetricMini label="Classes" value={earlyClasses.length} />
              <MetricMini label="Eleves" value={students.filter((student) => earlyClasses.some((cls) => String(cls.id) === String(student.class_id))).length} />
              <MetricMini label="Matieres" value={SUBJECTS.length} />
            </div>
          </div>
        </div>

        <div className="grid border-b border-slate-200 bg-slate-50 md:grid-cols-3">
          {[
            { id: 'class', label: 'Classe', icon: School, done: Boolean(selectedClassId) },
            { id: 'month', label: 'Mois', icon: CalendarDays, done: Boolean(selectedMonthKey) },
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
                  if (item.id === 'month' && selectedClassId) setStep('month');
                  if (item.id === 'entry' && selectedClassId && selectedMonthKey) setStep('entry');
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
                  <p className="text-sm text-slate-500">Les classes Jardin, 1ere annee et 2e annee sont affichees ici.</p>
                </div>
                <div className="w-full md:w-56">
                  <label className="text-xs font-medium text-slate-600">Annee scolaire</label>
                  <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="mt-1 h-10" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {earlyClasses.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setSelectedMonthKey('');
                      setBulletins({});
                      setStep('month');
                    }}
                    className="group rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0066CC] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase text-[#0066CC]">{extractEarlyLevel(cls) === 0 ? 'Jardin' : `Niveau ${extractEarlyLevel(cls) || '-'}`}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950">{cls.name}</h3>
                        <p className="text-sm text-slate-500">{cls.level || 'Jardin a 2e'} - {cls.academic_year || academicYear}</p>
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

              {earlyClasses.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Aucune classe Jardin, 1ere annee ou 2e annee n'a ete trouvee.
                </div>
              )}
            </div>
          )}

          {step === 'month' && (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setStep('class')} className="px-0 text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux classes
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{selectedClass?.name}</h2>
                <p className="text-sm text-slate-500">Choisissez le mois a renseigner pour toute la classe.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {MONTHS.map((month) => (
                  <button
                    key={month.key}
                    type="button"
                    onClick={() => {
                      setSelectedMonthKey(month.key);
                      setStep('entry');
                    }}
                    className={cn(
                      'rounded-lg border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                      selectedMonthKey === month.key ? 'border-[#0066CC] bg-blue-50' : 'border-slate-200 bg-white hover:border-[#0066CC]'
                    )}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 font-bold text-slate-950">{month.label}</h3>
                    <p className="text-sm text-slate-500">Bulletin mensuel</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'entry' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <Button variant="ghost" onClick={() => setStep('month')} className="mb-2 px-0 text-slate-600">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour aux mois
                  </Button>
                  <h2 className="text-xl font-bold text-slate-950">{selectedClass?.name} - {selectedMonth?.label}</h2>
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
                      const completion = getCompletion(student.id);
                      const active = String(activeStudentId) === String(student.id);
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setActiveStudentId(student.id)}
                          className={cn(
                            'w-full rounded-md border p-3 text-left transition',
                            active ? 'border-[#0066CC] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{getStudentName(student)}</p>
                              <p className="text-xs text-slate-500">{student.matricule || 'Sans matricule'}</p>
                            </div>
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', completion.complete ? 'bg-emerald-100 text-emerald-700' : completion.filled ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                              {completion.filled}/{completion.total}
                            </span>
                          </div>
                          <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-[#0066CC]" style={{ width: `${completion.percent}%` }} />
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
                      selectedMonthKey={selectedMonthKey}
                      selectedMonth={selectedMonth}
                      rank={studentsWithStats.find((row) => String(row.student.id) === String(activeStudentId))?.rank}
                      classSize={classStudents.length}
                      classAverage={globalStats.classAverage}
                      bestAverage={globalStats.bestAverage}
                      lowestAverage={globalStats.lowestAverage}
                      onChangeNote={(subject, value) => updateNote(activeStudentId, subject, value)}
                      onChangeMonthly={(field, value) => updateMonthly(activeStudentId, field, value)}
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

function StudentEntry({
  student,
  bulletin,
  selectedMonthKey,
  selectedMonth,
  rank,
  classSize,
  classAverage,
  bestAverage,
  lowestAverage,
  onChangeNote,
  onChangeMonthly,
}) {
  const notes = bulletin?.notes || emptyNotes();
  const monthly = bulletin?.monthly?.[selectedMonthKey] || {};
  const monthValues = SUBJECTS.map((subject) => notes?.[subject]?.[selectedMonthKey] || '');
  const total = sum(monthValues);
  const monthAverage = average(monthValues);
  const filled = monthValues.filter((value) => value !== '').length;

  return (
    <div>
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-[#0066CC]">{selectedMonth?.label}</p>
            <h3 className="text-xl font-bold text-slate-950">{getStudentName(student)}</h3>
            <p className="text-sm text-slate-500">{student?.matricule || 'Sans matricule'}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Total" value={formatScore(total, 1) || '-'} />
            <MiniStat label="Moyenne" value={formatScore(monthAverage) || '-'} />
            <MiniStat label="Rang" value={rank ? `${rank}/${classSize}` : '-'} />
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="w-[34%] px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Matiere</th>
                <th className="w-[120px] px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Note /10</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Appreciation du matiere</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((subject, index) => {
                const value = notes?.[subject]?.[selectedMonthKey] || '';
                const appreciation = getEarlyAppreciation(value);
                return (
                  <tr key={subject} className={cn('border-b border-slate-100', index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{subject}</td>
                    <td className="px-4 py-2.5">
                      <Input
                        value={value}
                        onChange={(event) => onChangeNote(subject, event.target.value)}
                        inputMode="decimal"
                        className="mx-auto h-9 w-20 text-center font-semibold"
                        placeholder="/10"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        value={appreciation}
                        readOnly
                        className="h-9 min-w-[220px] bg-slate-50 font-semibold text-slate-700"
                        placeholder="Automatique"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <aside className="border-t border-slate-200 p-4 lg:border-l lg:border-t-0">
          <div className="rounded-lg bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-300">Apercu du mois</p>
            <p className="mt-1 text-3xl font-bold">{formatScore(monthAverage) || '-'}</p>
            <p className="text-sm text-slate-300">Moyenne personnelle /10</p>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-amber-300" style={{ width: `${Math.round((filled / SUBJECTS.length) * 100)}%` }} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-slate-900">
              Absences
              <Input value={monthly.absences || ''} onChange={(event) => onChangeMonthly('absences', event.target.value)} inputMode="numeric" className="mt-2 h-10" />
            </label>
            <label className="block text-sm font-semibold text-slate-900">
              Retards
              <Input value={monthly.retards || ''} onChange={(event) => onChangeMonthly('retards', event.target.value)} inputMode="numeric" className="mt-2 h-10" />
            </label>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <InfoStat label="Moyenne classe" value={formatScore(classAverage) || '-'} />
            <InfoStat label="Moyenne la plus elevee" value={formatScore(bestAverage) || '-'} />
            <InfoStat label="Moyenne la plus faible" value={formatScore(lowestAverage) || '-'} />
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

function InfoStat({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
