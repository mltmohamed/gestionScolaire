import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const printRef = useRef(null);
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

  const [observationsGenerales, setObservationsGenerales] = useState('');
  const [decision, setDecision] = useState('');
  const [rang, setRang] = useState('');

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

    setObservationsGenerales('');
    setDecision('');
    setRang('');
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

      setRang(meta && meta.rang ? String(meta.rang) : '');
      setDecision(meta && meta.decision ? String(meta.decision) : '');
      setObservationsGenerales(meta && meta.observations_generales ? String(meta.observations_generales) : '');
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

  const moyenneAnnuelle = moyenneGenerale;

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
        rang,
        decision,
        observations_generales: observationsGenerales,
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
          <Button variant="outline" onClick={handleExportPdf}>
            Exporter PDF
          </Button>
          <Button onClick={handleSave} disabled={bulletinLoading}>
            Enregistrer
          </Button>
        </div>
      </div>

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
          <div ref={printRef} className="overflow-x-auto">
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
                  <td className="border border-border px-3 py-2" colSpan={MONTHS.length}>
                    <Input value={rang} onChange={(e) => setRang(e.target.value)} className="h-9" placeholder="Ex: 3/25" />
                  </td>
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
              <div className="text-2xl font-bold">{rang || '-'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Moyenne du 1er Semestre (/10)</div>
              <div className="text-2xl font-bold">{formatNumber(moyenneSemestre1)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Observations Générales</div>
            <textarea
              value={observationsGenerales}
              onChange={(e) => setObservationsGenerales(e.target.value)}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
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

      <style>{`@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  nav, aside, button { display: none !important; }
  .space-y-6 > * { break-inside: avoid; }
}`}</style>
    </div>
  );
}
