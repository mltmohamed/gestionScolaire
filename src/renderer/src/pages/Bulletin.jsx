import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { useToast } from '@/hooks/useToast.jsx';
import { useBulletin } from '@/hooks/useBulletin';

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

export default function Bulletin() {
  const { students } = useStudents();
  const { classes } = useClasses();
  const { toast, ToastComponent } = useToast();
  const { loading: bulletinLoading, getBulletin, saveBulletin } = useBulletin();

  const defaultAcademicYear = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }, []);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear);
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

  useEffect(() => {
    let el = document.getElementById('bulletin-print-portal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bulletin-print-portal';
      document.body.appendChild(el);
    }
    setPrintPortalEl(el);
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

      return matchSearch && matchClass && matchYear;
    });
  }, [students, studentSearchTerm, studentFilters, classById]);

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

  const totalsByMonth = useMemo(() => {
    const totals = {};
    for (const m of MONTHS) totals[m.key] = 0;

    for (const subject of SUBJECTS) {
      for (const m of MONTHS) {
        const v = notes?.[subject]?.[m.key];
        const n = v === '' ? null : Number(v);
        if (n !== null && !Number.isNaN(n)) {
          totals[m.key] += n;
        }
      }
    }

    return totals;
  }, [notes]);

  const averagesByMonth = useMemo(() => {
    const avgs = {};
    for (const m of MONTHS) {
      avgs[m.key] = totalsByMonth[m.key] / SUBJECTS.length;
    }
    return avgs;
  }, [totalsByMonth]);

  const moyenneGenerale = useMemo(() => {
    const vals = MONTHS.map((m) => averagesByMonth[m.key]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum / vals.length;
  }, [averagesByMonth]);

  const moyenneSemestre1 = useMemo(() => {
    const keys = ['oct', 'nov', 'dec', 'jan'];
    const vals = keys.map((k) => averagesByMonth[k]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (vals.length === 0) return 0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum / vals.length;
  }, [averagesByMonth]);

  const moyennePremierDisplay = useMemo(() => {
    if (moyennePremier !== '' && moyennePremier !== null && moyennePremier !== undefined) {
      return String(moyennePremier);
    }
    return formatNumber(moyenneSemestre1);
  }, [formatNumber, moyennePremier, moyenneSemestre1]);

  const moyenneAnnuelle = moyenneGenerale;

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

  const PrintView = useMemo(() => {
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
                <td key={m.key} className="bulletin-td bulletin-td--strong">{formatNumber(totalsByMonth[m.key])}</td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Moy. de Classe</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">{formatNumber(averagesByMonth[m.key])}</td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Moy. de Compo.</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">{formatNumber(averagesByMonth[m.key])}</td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Moy. Generale</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">{formatNumber(averagesByMonth[m.key])}</td>
              ))}
            </tr>
            <tr>
              <td className="bulletin-td bulletin-td--left">Classement</td>
              {MONTHS.map((m) => (
                <td key={m.key} className="bulletin-td">{rangByMonth?.[m.key] || ''}</td>
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

          <div className="bulletin-observers">
            <div className="bulletin-observers__title">Observateurs Générales</div>
          </div>

          <div className="bulletin-decisions2">
            <div className="bulletin-decisions2__title">Décisions</div>
            <div className="bulletin-decisions2__content">
              <div className="bulletin-decision2">
                <span className="bulletin-decision2__label">Passe en classe supérieure</span>
                <span className={`bulletin-decision2__check ${decision === 'pass' ? 'is-checked' : ''}`}>
                  {decision === 'pass' ? '✓' : ''}
                </span>
              </div>
              <div className="bulletin-decision2">
                <span className="bulletin-decision2__label">Redouble</span>
                <span className={`bulletin-decision2__check ${decision === 'repeat' ? 'is-checked' : ''}`}>
                  {decision === 'repeat' ? '✓' : ''}
                </span>
              </div>
              <div className="bulletin-decision2">
                <span className="bulletin-decision2__label">Exclu(e)</span>
                <span className={`bulletin-decision2__check ${decision === 'excluded' ? 'is-checked' : ''}`}>
                  {decision === 'excluded' ? '✗' : ''}
                </span>
              </div>
            </div>
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
  }, [academicYear, averagesByMonth, decision, decisionLabel, formatNumber, moyenneAnnuelle, moyenneSemestre1, noteDisplay, notes, rangByMonth, rangGlobal, selectedClass, selectedStudent, totalsByMonth, visas]);

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

    const res = await saveBulletin(selectedStudentId, academicYear, {
      notes: payloadNotes,
      meta: {
        rang: JSON.stringify({ general: rangGeneral || '', byMonth: rangByMonth || {} }),
        decision,
        moyenne_premier: moyennePremier,
        visas_json: JSON.stringify(visas || {}),
      },
    });

    if (res && res.success) {
      toast.success('Bulletin enregistré.');
    } else {
      toast.error(res?.error || 'Impossible d’enregistrer le bulletin.');
    }
  };

  return (
    <div className="space-y-6">
      {ToastComponent}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulletin</h1>
          <p className="text-muted-foreground">Saisie des notes, calculs automatiques, visas et décisions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            Aperçu
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            Exporter PDF
          </Button>
          <Button onClick={handleSave} disabled={bulletinLoading}>
            Enregistrer
          </Button>
        </div>
      </div>

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
                <Button onClick={handleExportPdf}>Exporter PDF</Button>
              </div>
            </div>
            <div className="bulletin-preview__content">
              <div className="bulletin-preview__page">{PrintView}</div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Élève & Année</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                placeholder="Rechercher un élève (nom, prénom, matricule)"
                className="h-10"
              />

              <select
                value={studentFilters.class_id}
                onChange={(e) => setStudentFilters((prev) => ({ ...prev, class_id: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les classes</option>
                <option value="">Non assigné</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={studentFilters.academic_year}
                onChange={(e) => setStudentFilters((prev) => ({ ...prev, academic_year: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Toutes les années</option>
                {classAcademicYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Sélectionner un élève</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.last_name} {s.first_name}
                    {s.matricule ? ` (${s.matricule})` : ''}
                  </option>
                ))}
              </select>

              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="h-10"
              />

              <Input
                value={selectedClass ? selectedClass.name : selectedStudent?.class_name || ''}
                placeholder="Classe"
                className="h-10"
                readOnly
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetBulletinState}
              disabled={bulletinLoading}
            >
              Nouveau bulletin
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStudentSearchTerm('');
                setStudentFilters({ class_id: 'all', academic_year: 'all' });
              }}
              disabled={bulletinLoading}
            >
              Réinitialiser filtres
            </Button>
            {bulletinLoading && <span className="text-sm text-muted-foreground">Chargement...</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="border border-border px-3 py-2 text-left">Matières/Mois</th>
                  {MONTHS.map((m) => (
                    <th key={m.key} className="border border-border px-3 py-2 text-center whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBJECTS.map((subject) => (
                  <tr key={subject}>
                    <td className="border border-border px-3 py-2 font-medium whitespace-nowrap">{subject}</td>
                    {MONTHS.map((m) => (
                      <td key={m.key} className="border border-border px-2 py-1">
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          step="0.25"
                          value={notes?.[subject]?.[m.key] ?? ''}
                          onChange={(e) => handleNoteChange(subject, m.key, e.target.value)}
                          className="h-9 text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr className="bg-muted/20 font-semibold">
                  <td className="border border-border px-3 py-2">TOTAL</td>
                  {MONTHS.map((m) => (
                    <td key={m.key} className="border border-border px-3 py-2 text-center">
                      {formatNumber(totalsByMonth[m.key])}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="border border-border px-3 py-2">Moyenne de Classe</td>
                  {MONTHS.map((m) => (
                    <td key={m.key} className="border border-border px-3 py-2 text-center">
                      {formatNumber(averagesByMonth[m.key])}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="border border-border px-3 py-2">Moyenne de Composition</td>
                  {MONTHS.map((m) => (
                    <td key={m.key} className="border border-border px-3 py-2 text-center">
                      {formatNumber(averagesByMonth[m.key])}
                    </td>
                  ))}
                </tr>

                <tr className="font-semibold">
                  <td className="border border-border px-3 py-2">Moyenne Générale</td>
                  {MONTHS.map((m) => (
                    <td key={m.key} className="border border-border px-3 py-2 text-center">
                      {formatNumber(averagesByMonth[m.key])}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="border border-border px-3 py-2">Classement (Rang)</td>
                  {MONTHS.map((m) => (
                    <td key={m.key} className="border border-border px-2 py-1">
                      <Input
                        value={rangByMonth?.[m.key] ?? ''}
                        onChange={(e) => setRangByMonth((prev) => ({ ...prev, [m.key]: e.target.value }))}
                        className="h-9 text-center"
                        placeholder="-"
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suivi et observations (Visas mensuels)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="border border-border px-3 py-2 text-left">MOIS</th>
                  <th className="border border-border px-3 py-2 text-left">MAITRE</th>
                  <th className="border border-border px-3 py-2 text-left">DIRECTEUR</th>
                  <th className="border border-border px-3 py-2 text-left">LES PARENTS</th>
                  <th className="border border-border px-3 py-2 text-left">OBSERVATIONS</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((m) => (
                  <tr key={m.key}>
                    <td className="border border-border px-3 py-2 font-medium">{m.label}</td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={visas[m.key].maitre}
                        onChange={(e) => setVisas((prev) => ({ ...prev, [m.key]: { ...prev[m.key], maitre: e.target.value } }))}
                        className="h-9"
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={visas[m.key].directeur}
                        onChange={(e) => setVisas((prev) => ({ ...prev, [m.key]: { ...prev[m.key], directeur: e.target.value } }))}
                        className="h-9"
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={visas[m.key].parents}
                        onChange={(e) => setVisas((prev) => ({ ...prev, [m.key]: { ...prev[m.key], parents: e.target.value } }))}
                        className="h-9"
                      />
                    </td>
                    <td className="border border-border px-3 py-2">
                      <Input
                        value={visas[m.key].observations}
                        onChange={(e) => setVisas((prev) => ({ ...prev, [m.key]: { ...prev[m.key], observations: e.target.value } }))}
                        className="h-9"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Synthèse et décisions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Moyenne Annuelle (/10)</div>
              <div className="text-2xl font-bold">{formatNumber(moyenneAnnuelle)}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Rang</div>
              <Input
                value={rangGeneral}
                onChange={(e) => setRangGeneral(e.target.value)}
                placeholder="Ex: 3/25"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Moyenne du premier (/10)</div>
              <Input
                value={moyennePremier}
                onChange={(e) => setMoyennePremier(e.target.value)}
                placeholder={formatNumber(moyenneSemestre1)}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Décisions</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={decision === 'pass'}
                  onChange={(e) => setDecision(e.target.checked ? 'pass' : '')}
                />
                Passe en classe supérieure
              </label>
              <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={decision === 'repeat'}
                  onChange={(e) => setDecision(e.target.checked ? 'repeat' : '')}
                />
                Redouble
              </label>
              <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={decision === 'excluded'}
                  onChange={(e) => setDecision(e.target.checked ? 'excluded' : '')}
                />
                Exclu(e)
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-md border border-input p-4">
              <div className="text-sm font-medium">LE MAITRE</div>
              <div className="mt-10 border-t border-border pt-2 text-xs text-muted-foreground">Signature</div>
            </div>
            <div className="rounded-md border border-input p-4">
              <div className="text-sm font-medium">LE DIRECTEUR</div>
              <div className="mt-10 border-t border-border pt-2 text-xs text-muted-foreground">Signature</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {printPortalEl
        ? createPortal(<div className="bulletin-print-only">{PrintView}</div>, printPortalEl)
        : null}

      <style>{`@page {
  size: A4;
  margin: 8mm;
}

@media print {
  html, body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* Ne rien imprimer sauf le bulletin */
  .bulletin-preview { display: none !important; }
  #root { display: none !important; }
  #bulletin-print-portal { display: block !important; }

  .bulletin-print-only {
    display: block !important;
    position: static !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    overflow: visible !important;
  }

  .bulletin-print {
    box-shadow: none !important;
    margin: 0 auto !important;
    min-height: auto !important;
  }
}

.bulletin-print-only { display: none; }

#bulletin-print-portal { display: none; }

.bulletin-preview {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.bulletin-preview__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}

.bulletin-preview__panel {
  position: relative;
  margin: 24px auto;
  width: min(1100px, calc(100vw - 32px));
  height: calc(100vh - 48px);
  background: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bulletin-preview__header {
  padding: 12px 16px;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bulletin-preview__title {
  font-weight: 700;
}

.bulletin-preview__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bulletin-preview__content {
  padding: 16px;
  overflow: auto;
  background: hsl(var(--muted));
  display: flex;
  justify-content: center;
}

.bulletin-preview__page {
  width: 794px; /* ~ A4 @96dpi */
  min-height: 1123px;
  margin: 0 auto;
  background: white;
  padding: 0;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.bulletin-print {
  width: 100%;
  min-height: 1123px;
  margin: 0 auto;
  padding: 18px;
  box-sizing: border-box;
  color: #111;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

.bulletin-print__title {
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  margin: 2px 0 10px;
  letter-spacing: 0.5px;
}

.bulletin-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 11px;
}

.bulletin-th,
.bulletin-td {
  border: 1px solid #222;
  padding: 3px 4px;
  text-align: center;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bulletin-th--left,
.bulletin-td--left {
  text-align: left;
  width: 170px;
  white-space: nowrap;
}

.bulletin-td--strong {
  font-weight: 700;
}

.bulletin-spacer {
  height: 12px;
}

.bulletin-bottom {
  border: 1px solid #222;
  padding: 0;
}

.bulletin-scores {
  display: grid;
  grid-template-columns: 1.3fr 0.8fr 1.1fr;
  border-bottom: 1px solid #222;
}

.bulletin-scores__cell {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  white-space: nowrap;
}

.bulletin-scores__cell + .bulletin-scores__cell {
  border-left: 1px solid #222;
}

.bulletin-scores__label {
  font-weight: 700;
}

.bulletin-scores__box {
  display: inline-block;
  min-width: 46px;
  padding: 2px 6px;
  border: 1px solid #222;
  text-align: center;
  font-weight: 700;
}

.bulletin-scores__box--small {
  min-width: 34px;
}

.bulletin-scores__unit {
  font-weight: 700;
}

.bulletin-observers {
  border-bottom: 1px solid #222;
}

.bulletin-observers__title {
  font-weight: 700;
  text-align: center;
  padding: 6px;
  font-size: 12px;
}

.bulletin-decisions2 {
  border-bottom: 1px solid #222;
}

.bulletin-decisions2__title {
  font-weight: 700;
  text-align: center;
  padding: 6px;
  border-bottom: 1px solid #222;
  font-size: 12px;
}

.bulletin-decisions2__content {
  display: grid;
  grid-template-columns: 1fr 0.7fr 0.7fr;
  gap: 10px;
  padding: 12px 10px;
  font-size: 11px;
}

.bulletin-decision2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.bulletin-decision2__check {
  width: 60px;
  height: 18px;
  border: 1px solid #222;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  line-height: 1;
}

.bulletin-decision2__check.is-checked {
  background: rgba(0, 0, 0, 0.12);
}

.bulletin-signatures2 {
  display: flex;
  justify-content: space-between;
  padding: 14px 10px 16px;
  font-weight: 700;
  font-size: 12px;
}

.bulletin-signature2 {
  width: 46%;
}

.bulletin-signature2__title {
  text-transform: uppercase;
}

.bulletin-signature2__line {
  margin-top: 18px;
  border-top: 1px solid #222;
  height: 0;
}

.bulletin-meta {
  margin-top: 10px;
  font-size: 10px;
  color: #333;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.bulletin-meta--top {
  margin: 0 0 10px;
}

.bulletin-meta__label {
  font-weight: 700;
}
`}</style>
    </div>
  );
}
