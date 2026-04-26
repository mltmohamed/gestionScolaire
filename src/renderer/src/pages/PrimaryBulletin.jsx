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
  'Lecture',
  'Ecriture',
  'Vocabulaire',
  'Dessin',
  'Chant',
  'Recitation',
  'Grammaire',
  'Conjugaison',
  'Mathematiques',
  'Exp. E./Rec.',
  'Dictee',
  'Quest. Dictee',
  'Quest. de Cours',
  'Economie Familiale',
  'Morale',
  'Anglais',
  'Informatique',
  'Conduite',
];

const META_SUBJECTS = ['TOTAL', 'Moy. de Classe', 'Moy. de Compo', 'Moy. Generale', 'Classement'];

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
  const match = raw.match(/\b([3-6])\s*(e|eme|ere|annee)?\b/);
  return match ? Number(match[1]) : null;
}

function isPrimaryClass(cls) {
  const level = extractLevel(cls);
  return level >= 3 && level <= 6;
}

function sortStudents(a, b) {
  const last = String(a.last_name || '').localeCompare(String(b.last_name || ''), 'fr', { sensitivity: 'base' });
  if (last !== 0) return last;
  return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fr', { sensitivity: 'base' });
}

function emptyNoteGrid() {
  return SUBJECTS.reduce((acc, subject) => {
    acc[subject] = MONTHS.reduce((months, month) => {
      months[month.key] = '';
      return months;
    }, {});
    return acc;
  }, {});
}

function notesArrayToGrid(notes = []) {
  const grid = emptyNoteGrid();
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

function average(values) {
  const numbers = values.map((v) => Number(String(v).replace(',', '.'))).filter((n) => Number.isFinite(n));
  if (!numbers.length) return null;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function maxFinite(values) {
  const numbers = values.map((v) => Number(String(v).replace(',', '.'))).filter((n) => Number.isFinite(n));
  return numbers.length ? Math.max(...numbers) : null;
}

function isFilledNote(value) {
  return value !== '' && value !== null && value !== undefined && Number.isFinite(Number(String(value).replace(',', '.')));
}

function completeMonthAverage(grid, monthKey) {
  const values = SUBJECTS.map((subject) => grid?.[subject]?.[monthKey]);
  if (!values.every(isFilledNote)) return null;
  return average(values);
}

function completeAnnualAverage(grid) {
  const monthlyAverages = MONTHS.map((month) => completeMonthAverage(grid, month.key));
  if (!monthlyAverages.every((value) => value !== null)) return null;
  return average(monthlyAverages);
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

function getStudentName(student) {
  return `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Eleve';
}

export default function PrimaryBulletin() {
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
  const [loadingClassData, setLoadingClassData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeStudentId, setActiveStudentId] = useState('');

  const primaryClasses = useMemo(() => {
    return classes.filter(isPrimaryClass).sort((a, b) => {
      const levelDelta = (extractLevel(a) || 0) - (extractLevel(b) || 0);
      if (levelDelta !== 0) return levelDelta;
      return String(a.name || '').localeCompare(String(b.name || ''), 'fr', { sensitivity: 'base' });
    });
  }, [classes]);

  const selectedClass = useMemo(
    () => primaryClasses.find((cls) => String(cls.id) === String(selectedClassId)),
    [primaryClasses, selectedClassId]
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
    return classStudents.filter((student) => {
      return normalizeText(`${student.first_name} ${student.last_name} ${student.matricule}`).includes(needle);
    });
  }, [classStudents, query]);

  const classStatsById = useMemo(() => {
    return primaryClasses.reduce((acc, cls) => {
      acc[cls.id] = students.filter((student) => String(student.class_id || '') === String(cls.id)).length;
      return acc;
    }, {});
  }, [primaryClasses, students]);

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

  const globalStats = useMemo(() => {
    const completed = classStudents.filter((student) => getCompletion(student.id).complete).length;
    const filledCells = classStudents.reduce((sum, student) => sum + getCompletion(student.id).filled, 0);
    const totalCells = classStudents.length * SUBJECTS.length;
    const monthAverages = classStudents
      .map((student) => average(selectedMonthValues(student.id)))
      .filter((value) => value !== null);
    return {
      completed,
      filledCells,
      totalCells,
      percent: totalCells ? Math.round((filledCells / totalCells) * 100) : 0,
      classAverage: average(monthAverages),
    };
  }, [classStudents, getCompletion, selectedMonthValues]);

  const studentsWithRanks = useMemo(() => {
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

  const loadClassBulletins = useCallback(async () => {
    if (!selectedClassId || !academicYear) return;
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
          return [
            student.id,
            {
              notes: notesArrayToGrid(data?.notes),
              appreciation: metaData.appreciation || data?.meta?.observations_generales || '',
              decision: data?.meta?.decision || '',
              rang: data?.meta?.rang || '',
            },
          ];
        })
      );
      setBulletins(Object.fromEntries(entries));
      setActiveStudentId(classStudents[0]?.id || '');
    } catch (error) {
      console.error('Erreur chargement bulletins primaire:', error);
      showError('Impossible de charger les bulletins de cette classe');
    } finally {
      setLoadingClassData(false);
    }
  }, [academicYear, classStudents, getBulletin, selectedClassId, showError]);

  useEffect(() => {
    if (step === 'entry') {
      loadClassBulletins();
    }
  }, [loadClassBulletins, step]);

  const updateNote = (studentId, subject, value) => {
    const note = sanitizeNote(value);
    setBulletins((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes: {
          ...(prev[studentId]?.notes || emptyNoteGrid()),
          [subject]: {
            ...((prev[studentId]?.notes || emptyNoteGrid())[subject] || {}),
            [selectedMonthKey]: note,
          },
        },
      },
    }));
  };

  const updateAppreciation = (studentId, value) => {
    setBulletins((prev) => ({
      ...prev,
      [studentId]: {
        notes: emptyNoteGrid(),
        ...prev[studentId],
        appreciation: value,
      },
    }));
  };

  const saveOneStudent = async (student) => {
    const row = bulletins[student.id] || { notes: emptyNoteGrid() };
    const rank = studentsWithRanks.find((item) => item.student.id === student.id)?.rank || '';
    const result = await saveBulletin(student.id, academicYear, {
      notes: gridToNotesArray(row.notes),
      meta: {
        bulletin_type: 'primary',
        rang: rank ? `${rank}/${classStudents.length}` : row.rang || '',
        decision: row.decision || '',
        observations_generales: row.appreciation || '',
        data_json: JSON.stringify({
          appreciation: row.appreciation || '',
          selected_month: selectedMonthKey,
        }),
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
      showSuccess('Bulletins de la classe enregistres');
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde bulletins:', error);
      showError(error?.message || 'Erreur lors de la sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const makePrintHtml = () => {
    const monthLabel = selectedMonth?.label || '';
    const className = selectedClass?.name || '';
    const rankedRows = studentsWithRanks;
    const monthRankById = Object.fromEntries(rankedRows.map((row) => [row.student.id, row.rank]));
    const annualAverages = classStudents.map((student) => {
      const grid = bulletins[student.id]?.notes || emptyNoteGrid();
      return {
        id: student.id,
        avg: completeAnnualAverage(grid),
      };
    });
    const classYearComplete = classStudents.length > 0 && annualAverages.every((row) => row.avg !== null);
    const annualRankById = {};
    if (classYearComplete) {
      [...annualAverages]
        .sort((a, b) => b.avg - a.avg)
        .forEach((row, index) => {
          annualRankById[row.id] = index + 1;
        });
    }
    const firstAnnualAverage = classYearComplete ? maxFinite(annualAverages.map((row) => row.avg)) : null;

    const bulletinsHtml = classStudents
      .map((student) => {
        const row = bulletins[student.id] || { notes: emptyNoteGrid() };
        const monthAverage = average(selectedMonthValues(student.id));
        const annualAverage = annualAverages.find((item) => item.id === student.id)?.avg;
        const monthRank = monthRankById[student.id] ? `${monthRankById[student.id]}/${classStudents.length}` : '';
        const annualRank = annualRankById[student.id] ? `${annualRankById[student.id]}/${classStudents.length}` : '';

        return `
          <section class="bulletin">
            <div class="topline">
              <div>
                <p class="tiny">Annee scolaire</p>
                <strong>${escapeHtml(academicYear)}</strong>
              </div>
              <div class="title">
                <p class="tiny">Bulletin primaire 3e a 6e</p>
                <h1>Compositions mensuelles</h1>
              </div>
              <div>
                <p class="tiny">Classe</p>
                <strong>${escapeHtml(className)}</strong>
              </div>
            </div>
            <div class="identity">
              <span><b>Eleve:</b> ${escapeHtml(getStudentName(student))}</span>
              <span><b>Matricule:</b> ${escapeHtml(student.matricule || '-')}</span>
              <span><b>Mois saisi:</b> ${escapeHtml(monthLabel)}</span>
            </div>
            <table class="marks">
              <thead>
                <tr>
                  <th class="subject">Matieres / Mois</th>
                  ${MONTHS.map((month) => `<th>${escapeHtml(month.short)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${SUBJECTS.map((subject) => `
                  <tr>
                    <td class="subject">${escapeHtml(subject)}</td>
                    ${MONTHS.map((month) => {
                      const value = row.notes?.[subject]?.[month.key] || '';
                      const active = month.key === selectedMonthKey ? ' active' : '';
                      return `<td class="${active}">${escapeHtml(value)}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
                ${META_SUBJECTS.map((label) => {
                  const selectedValue =
                    label === 'TOTAL' ? formatScore(selectedMonthValues(student.id).reduce((sum, value) => sum + (Number(value) || 0), 0), 1) :
                    label === 'Moy. de Classe' ? formatScore(monthAverage) :
                    label === 'Moy. de Compo' ? formatScore(monthAverage) :
                    label === 'Moy. Generale' ? formatScore(monthAverage) :
                    monthRank;
                  return `
                    <tr class="meta-row">
                      <td class="subject">${escapeHtml(label)}</td>
                      ${MONTHS.map((month) => `<td class="${month.key === selectedMonthKey ? 'active' : ''}">${month.key === selectedMonthKey ? escapeHtml(selectedValue) : ''}</td>`).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <table class="visas">
              <thead>
                <tr><th>Mois</th><th>Maitre</th><th>Directeur</th><th>Les parents</th><th>Observations</th></tr>
              </thead>
              <tbody>
                ${MONTHS.map((month) => `
                  <tr>
                    <td>${escapeHtml(month.label.toUpperCase())}</td>
                    <td></td><td></td><td></td>
                    <td>${month.key === selectedMonthKey ? escapeHtml(row.appreciation || '') : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="summary">
              <span><b>Moyenne annuelle:</b> ${classYearComplete ? formatScore(annualAverage) : '____'} /10</span>
              <span><b>Rang annuel:</b> ${escapeHtml(classYearComplete ? annualRank : '____')}</span>
              <span><b>Moyenne du 1er:</b> ${classYearComplete ? formatScore(firstAnnualAverage) : '____'} /10</span>
            </div>
            <div class="decision">
              <b>Observations Generales</b>
              <p>${escapeHtml(row.appreciation || '')}</p>
              <div class="checks">
                <span>Passe en classe superieure <i></i></span>
                <span>Redouble <i></i></span>
                <span>Exclu(e) <i></i></span>
              </div>
            </div>
            <div class="signatures">
              <strong>Le maitre</strong>
              <strong>Le directeur</strong>
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
            @page { size: A4 portrait; margin: 9mm; }
            * { box-sizing: border-box; }
            body { margin: 0; color: #111827; font-family: Arial, sans-serif; background: white; }
            .bulletin { min-height: 277mm; page-break-after: always; padding: 6mm; border: 1.5px solid #111827; }
            .bulletin:last-child { page-break-after: auto; }
            .topline { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 12px; align-items: center; border-bottom: 2px solid #111827; padding-bottom: 8px; }
            .title { text-align: center; }
            h1 { margin: 2px 0 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0; }
            .tiny { margin: 0; font-size: 10px; text-transform: uppercase; color: #4b5563; }
            .identity { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px; margin: 8px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #111827; padding: 3px 4px; font-size: 10.5px; height: 20px; text-align: center; }
            th { background: #eef2f7; font-weight: 800; }
            .subject { width: 25%; text-align: left; font-weight: 700; }
            .marks td.active { background: #fef3c7; font-weight: 800; }
            .meta-row td { font-weight: 800; background: #f8fafc; }
            .visas { margin-top: 10px; }
            .visas th:first-child, .visas td:first-child { width: 21%; text-align: left; font-weight: 800; }
            .summary { display: grid; grid-template-columns: 1fr 0.7fr 1fr; gap: 8px; border: 1px solid #111827; margin-top: 12px; padding: 8px; font-size: 12px; }
            .decision { border: 1px solid #111827; margin-top: 12px; min-height: 58px; text-align: center; padding: 6px; }
            .decision p { min-height: 20px; margin: 5px 0; font-size: 11px; }
            .checks { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 8px; text-align: left; font-size: 11px; }
            .checks i { display: inline-block; width: 34px; height: 16px; border: 1px solid #111827; vertical-align: middle; margin-left: 6px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 22px; padding: 0 22px; text-transform: uppercase; font-size: 12px; }
          </style>
        </head>
        <body>${bulletinsHtml}</body>
      </html>
    `;
  };

  const handlePrint = async () => {
    const saved = await handleSaveAll();
    if (!saved) return;

    const previousFrame = document.getElementById('primary-bulletin-print-frame');
    if (previousFrame) previousFrame.remove();

    const printFrame = document.createElement('iframe');
    printFrame.id = 'primary-bulletin-print-frame';
    printFrame.title = 'Impression des bulletins';
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

  const canPrint = classStudents.length > 0 && globalStats.completed === classStudents.length;
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
                Premier cycle - 3e a 6e
              </div>
              <h1 className="text-2xl font-bold tracking-normal">Bulletins mensuels</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Selectionnez une classe, choisissez le mois, renseignez toute la classe sur une seule grille, puis imprimez les bulletins par ordre alphabetique.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/10 p-2 text-center">
              <div className="rounded-md bg-white px-4 py-3 text-slate-950">
                <p className="text-xs text-slate-500">Classes</p>
                <p className="text-xl font-bold">{primaryClasses.length}</p>
              </div>
              <div className="rounded-md bg-white px-4 py-3 text-slate-950">
                <p className="text-xs text-slate-500">Eleves</p>
                <p className="text-xl font-bold">{students.filter((student) => primaryClasses.some((cls) => String(cls.id) === String(student.class_id))).length}</p>
              </div>
              <div className="rounded-md bg-white px-4 py-3 text-slate-950">
                <p className="text-xs text-slate-500">Mois</p>
                <p className="text-xl font-bold">{MONTHS.length}</p>
              </div>
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
                  <p className="text-sm text-slate-500">Seules les classes de 3e, 4e, 5e et 6e sont affichees ici.</p>
                </div>
                <div className="w-full md:w-56">
                  <label className="text-xs font-medium text-slate-600">Annee scolaire</label>
                  <Input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} className="mt-1 h-10" />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {primaryClasses.map((cls) => (
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
                        <p className="text-xs font-medium uppercase text-[#0066CC]">Niveau {extractLevel(cls) || '-'}</p>
                        <h3 className="mt-1 text-lg font-bold text-slate-950">{cls.name}</h3>
                        <p className="text-sm text-slate-500">{cls.level || 'Premier cycle'} - {cls.academic_year || academicYear}</p>
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

              {primaryClasses.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Aucune classe de 3e a 6e n'a ete trouvee.
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
                    <p className="text-sm text-slate-500">Composition mensuelle</p>
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
                  <p className="text-sm text-slate-500">{classStudents.length} eleve(s), ordre alphabetique pour la saisie et l'impression.</p>
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

              {!canPrint && classStudents.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Suggestion appliquee : l'impression reste disponible, mais la progression vous montre exactement ce qui manque avant une impression finale propre.
                </div>
              )}

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
                      rank={studentsWithRanks.find((row) => String(row.student.id) === String(activeStudentId))?.rank}
                      classSize={classStudents.length}
                      classAverage={globalStats.classAverage}
                      onChangeNote={(subject, value) => updateNote(activeStudentId, subject, value)}
                      onChangeAppreciation={(value) => updateAppreciation(activeStudentId, value)}
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
  onChangeNote,
  onChangeAppreciation,
}) {
  const notes = bulletin?.notes || emptyNoteGrid();
  const monthValues = SUBJECTS.map((subject) => notes?.[subject]?.[selectedMonthKey] || '');
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
            <MiniStat label="Saisies" value={`${filled}/${SUBJECTS.length}`} />
            <MiniStat label="Moyenne" value={formatScore(monthAverage) || '-'} />
            <MiniStat label="Rang" value={rank ? `${rank}/${classSize}` : '-'} />
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="w-[44%] px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Matiere</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Note /10</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">Etat</th>
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((subject, index) => {
                const value = notes?.[subject]?.[selectedMonthKey] || '';
                return (
                  <tr key={subject} className={cn('border-b border-slate-100', index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{subject}</td>
                    <td className="px-4 py-2.5">
                      <Input
                        value={value}
                        onChange={(event) => onChangeNote(subject, event.target.value)}
                        inputMode="decimal"
                        className="mx-auto h-9 w-24 text-center font-semibold"
                        placeholder="/10"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold', value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {value ? 'Saisie' : 'Vide'}
                      </span>
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

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="text-slate-500">Moyenne classe</span>
              <strong>{formatScore(classAverage) || '-'}</strong>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="text-slate-500">Note la plus haute</span>
              <strong>{formatScore(maxFinite(monthValues)) || '-'}</strong>
            </div>
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-900">Observations</label>
          <textarea
            value={bulletin?.appreciation || ''}
            onChange={(event) => onChangeAppreciation(event.target.value)}
            className="mt-2 min-h-[130px] w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-[#0066CC]"
            placeholder="Observation generale pour le bulletin imprime..."
          />
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
