import React, { useMemo, useState } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useClasses } from '@/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle,
  CreditCard,
  Filter,
  GraduationCap,
  Hash,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  School,
  Search,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { APP_LOGO_PNG } from '@/config/appLogo';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getFullName = (student) => `${student.first_name || ''} ${student.last_name || ''}`.trim();

function getAcademicYear() {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
}

function sortStudents(a, b) {
  const last = String(a.last_name || '').localeCompare(String(b.last_name || ''), 'fr', { sensitivity: 'base' });
  if (last !== 0) return last;
  return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'fr', { sensitivity: 'base' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function SelectField({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </select>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border bg-white px-5 py-4 shadow-sm dark:bg-slate-950">
        <RotateCcw className="h-5 w-5 animate-spin text-[#0066CC]" />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Chargement des cartes</span>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, helper, tone }) {
  const tones = {
    blue: 'bg-[#0066CC]/10 text-[#0066CC] border-[#0066CC]/20',
    green: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300',
    orange: 'bg-[#FF6600]/10 text-[#FF3300] border-[#FF6600]/20',
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentAvatar({ student, className = 'h-11 w-11 rounded-lg' }) {
  if (student.photo) {
    return <img src={student.photo} alt="" className={`${className} object-cover shadow-sm`} />;
  }

  const color = student.gender === 'F'
    ? 'bg-[#CC0033]/10 text-[#CC0033]'
    : 'bg-[#0066CC]/10 text-[#0066CC]';

  return (
    <div className={`${className} flex items-center justify-center ${color}`}>
      <User className="h-5 w-5" />
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066CC]" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-950 dark:text-white">{value || '-'}</p>
      </div>
    </div>
  );
}

function CardChip({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-slate-500">
        <Icon className="h-3 w-3 text-[#0066CC]" />
        {label}
      </div>
      <p className="mt-1 truncate text-[12px] font-bold text-slate-900">{value || '-'}</p>
    </div>
  );
}

function SchoolCardMarkup({ student, academicYear }) {
  const genderLabel = student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Feminin' : 'N/A';

  return (
    <div className="mx-auto overflow-hidden rounded-[18px] bg-white text-slate-950 shadow-2xl" style={{ width: '540px', height: '340px' }}>
      <div className="relative h-full overflow-hidden border border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-[106px] bg-slate-950" />
        <div className="absolute right-[-52px] top-[-78px] h-44 w-44 rounded-full bg-[#0066CC]" />
        <div className="absolute right-[42px] top-[22px] h-24 w-24 rounded-full bg-[#FF6600]/90" />
        <div className="absolute bottom-0 left-0 h-2 w-full bg-[#0066CC]" />

        <div className="relative flex h-full flex-col p-5">
          <header className="flex items-start justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
                <img src={APP_LOGO_PNG} alt="LA SAGESSE" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100">Carte scolaire</p>
                <h2 className="mt-0.5 text-lg font-black uppercase tracking-normal">La Sagesse</h2>
              </div>
            </div>
            <div className="rounded-lg bg-white/10 px-3 py-2 text-right backdrop-blur">
              <p className="text-[9px] font-semibold uppercase text-slate-200">Annee</p>
              <p className="text-sm font-black">{academicYear}</p>
            </div>
          </header>

          <main className="mt-5 grid flex-1 grid-cols-[132px_1fr] gap-4">
            <section className="flex flex-col items-center">
              <div className="rounded-[18px] bg-white p-2 shadow-xl">
                {student.photo ? (
                  <img src={student.photo} alt="" className="h-[116px] w-[104px] rounded-xl object-cover" />
                ) : (
                  <div className={`flex h-[116px] w-[104px] items-center justify-center rounded-xl ${student.gender === 'F' ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-[#0066CC]/10 text-[#0066CC]'}`}>
                    <User className="h-14 w-14" />
                  </div>
                )}
              </div>
              <div className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-center">
                <p className="text-[9px] font-bold uppercase text-slate-500">Matricule</p>
                <p className="truncate text-sm font-black text-[#0066CC]">{student.matricule || 'N/A'}</p>
              </div>
            </section>

            <section className="flex flex-col justify-end pb-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0066CC]">Eleve</p>
              <h3 className="mt-1 text-2xl font-black leading-[1.05] text-slate-950">{getFullName(student) || 'Eleve'}</h3>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <CardChip label="Classe" value={student.class_name || 'Non assigne'} icon={School} />
                <CardChip label="Naissance" value={formatDate(student.date_of_birth)} icon={Calendar} />
                <CardChip label="Genre" value={genderLabel} icon={User} />
                <CardChip label="Contact" value={student.guardian_phone || student.phone || 'N/A'} icon={Phone} />
              </div>
            </section>
          </main>

          <footer className="relative mt-3 flex items-end justify-between border-t border-slate-200 pt-3">
            <div>
              <p className="text-[9px] font-bold uppercase text-slate-400">Etablissement</p>
              <p className="text-xs font-black uppercase text-slate-950">Ecole privee La Sagesse</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase text-slate-400">Signature</p>
              <div className="mt-3 h-px w-28 bg-slate-400" />
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function PrintableStudentCard({ student, academicYear }) {
  return (
    <div id="student-card">
      <SchoolCardMarkup student={student} academicYear={academicYear} />
    </div>
  );
}

function cardHtml(student, academicYear) {
  const genderLabel = student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Feminin' : 'N/A';
  const firstLetter = (getFullName(student)[0] || 'E').toUpperCase();
  const photoHtml = student.photo
    ? `<img src="${student.photo}" alt="" class="photo" />`
    : `<div class="photo-placeholder"><span>${escapeHtml(firstLetter)}</span></div>`;

  return `
    <article class="school-card">
      <div class="top-bg"></div>
      <div class="circle-one"></div>
      <div class="circle-two"></div>
      <div class="blue-line"></div>
      <div class="inner">
        <header>
          <div class="brand">
            <div class="logo"><img src="${APP_LOGO_PNG}" alt="LA SAGESSE" /></div>
            <div><p>Carte scolaire</p><h2>La Sagesse</h2></div>
          </div>
          <div class="year"><span>Annee</span><b>${escapeHtml(academicYear)}</b></div>
        </header>
        <main>
          <section class="photo-block">
            <div class="photo-wrap">${photoHtml}</div>
            <div class="matricule"><span>Matricule</span><b>${escapeHtml(student.matricule || 'N/A')}</b></div>
          </section>
          <section class="info">
            <p class="eyebrow">Eleve</p>
            <h1>${escapeHtml(getFullName(student) || 'Eleve')}</h1>
            <div class="chips">
              <div><span>Classe</span><b>${escapeHtml(student.class_name || 'Non assigne')}</b></div>
              <div><span>Naissance</span><b>${escapeHtml(formatDate(student.date_of_birth))}</b></div>
              <div><span>Genre</span><b>${escapeHtml(genderLabel)}</b></div>
              <div><span>Contact</span><b>${escapeHtml(student.guardian_phone || student.phone || 'N/A')}</b></div>
            </div>
          </section>
        </main>
        <footer><div><span>Etablissement</span><b>Ecole privee La Sagesse</b></div><div><span>Signature</span><i></i></div></footer>
      </div>
    </article>
  `;
}

function makeCardsPrintHtml(students, academicYear, title) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; background: #fff; color: #0f172a; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sheet { display: grid; grid-template-columns: 1fr; gap: 7mm; }
          .school-card { position: relative; width: 180mm; height: 113mm; margin: 0 auto; overflow: hidden; border: 1px solid #cbd5e1; border-radius: 5mm; background: #fff; page-break-inside: avoid; }
          .top-bg { position: absolute; inset: 0 0 auto 0; height: 35mm; background: #020617; }
          .circle-one { position: absolute; right: -18mm; top: -26mm; width: 56mm; height: 56mm; border-radius: 999px; background: #0066CC; }
          .circle-two { position: absolute; right: 12mm; top: 8mm; width: 30mm; height: 30mm; border-radius: 999px; background: #FF6600; opacity: .9; }
          .blue-line { position: absolute; left: 0; right: 0; bottom: 0; height: 2.5mm; background: #0066CC; }
          .inner { position: relative; height: 100%; padding: 6mm; display: flex; flex-direction: column; }
          header { display: flex; justify-content: space-between; align-items: flex-start; color: #fff; }
          .brand { display: flex; gap: 3mm; align-items: center; }
          .logo { width: 15mm; height: 15mm; background: #fff; border-radius: 3mm; padding: 1.5mm; }
          .logo img { width: 100%; height: 100%; object-fit: contain; }
          .brand p, .year span, footer span, .eyebrow, .matricule span, .chips span { margin: 0; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .16em; color: #bfdbfe; }
          .brand h2 { margin: 1mm 0 0; font-size: 18px; line-height: 1; text-transform: uppercase; }
          .year { text-align: right; background: rgba(255,255,255,.1); border-radius: 3mm; padding: 2mm 3mm; }
          .year b { display: block; margin-top: 1mm; font-size: 13px; }
          main { display: grid; grid-template-columns: 40mm 1fr; gap: 5mm; flex: 1; margin-top: 5mm; }
          .photo-block { text-align: center; }
          .photo-wrap { display: inline-block; background: #fff; padding: 2mm; border-radius: 5mm; box-shadow: 0 8px 22px rgba(15,23,42,.18); }
          .photo { display: block; width: 32mm; height: 36mm; object-fit: cover; border-radius: 3.5mm; }
          .photo-placeholder { width: 32mm; height: 36mm; border-radius: 3.5mm; background: #dbeafe; display: grid; place-items: center; color: #0066CC; font-size: 28px; font-weight: 900; }
          .matricule { margin-top: 3mm; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 3mm; padding: 2mm; }
          .matricule span, .chips span, footer span, .eyebrow { color: #64748b; letter-spacing: .12em; }
          .matricule b { display: block; margin-top: 1mm; color: #0066CC; font-size: 14px; }
          .info { display: flex; flex-direction: column; justify-content: end; padding-bottom: 3mm; }
          .info h1 { margin: 1mm 0 4mm; font-size: 27px; line-height: 1.05; }
          .chips { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
          .chips div { background: #f8fafc; border-radius: 3mm; padding: 2.2mm; min-width: 0; }
          .chips b { display: block; margin-top: 1mm; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          footer { display: flex; justify-content: space-between; align-items: end; border-top: 1px solid #e2e8f0; padding-top: 3mm; }
          footer b { display: block; margin-top: 1mm; font-size: 11px; text-transform: uppercase; }
          footer i { display: block; width: 36mm; height: 1px; background: #94a3b8; margin-top: 6mm; }
        </style>
      </head>
      <body><main class="sheet">${students.map((student) => cardHtml(student, academicYear)).join('')}</main></body>
    </html>
  `;
}

function printHtml(html) {
  const previousFrame = document.getElementById('student-card-print-frame');
  if (previousFrame) previousFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'student-card-print-frame';
  iframe.title = 'Impression cartes scolaires';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => iframe.remove(), 1000);
  }, 350);
}

function ClassPrintPanel({ classes, selectedClassId, onChangeClass, onPrint, count }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0066CC]/10 text-[#0066CC]">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-950 dark:text-white">Impression par classe</p>
          <p className="mt-1 text-sm text-slate-500">Imprimez toutes les cartes d'une classe en une seule fois.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <SelectField value={selectedClassId} onChange={(event) => onChangeClass(event.target.value)}>
          <option value="">Choisir une classe</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </SelectField>
        <Button onClick={onPrint} disabled={!selectedClassId || count === 0} className="gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
          <Printer className="h-4 w-4" />
          Imprimer la classe
        </Button>
      </div>
      {selectedClassId && <p className="mt-3 text-sm text-slate-500">{count} carte(s) prete(s) pour cette classe.</p>}
    </div>
  );
}

export default function StudentCard() {
  const { students, loading } = useStudents();
  const { classes } = useClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPrintClassId, setSelectedPrintClassId] = useState('');
  const [filters, setFilters] = useState({
    class_id: 'all',
    status: 'active',
  });

  const classById = useMemo(() => {
    const map = new Map();
    for (const cls of classes) map.set(Number(cls.id), cls);
    return map;
  }, [classes]);

  const enrichedStudents = useMemo(() => students.map((student) => ({
    ...student,
    class_name: student.class_name || classById.get(Number(student.class_id))?.name || '',
  })), [students, classById]);

  const stats = useMemo(() => {
    const active = enrichedStudents.filter((student) => student.status === 'active').length;
    const withPhoto = enrichedStudents.filter((student) => Boolean(student.photo)).length;
    const withClass = enrichedStudents.filter((student) => Boolean(student.class_id)).length;
    return { total: enrichedStudents.length, active, withPhoto, withClass };
  }, [enrichedStudents]);

  const filteredStudents = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return enrichedStudents.filter((student) => {
      const searchable = [
        student.first_name,
        student.last_name,
        student.matricule,
        student.class_name,
        student.guardian_phone,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchSearch = !q || searchable.includes(q);
      const matchClass = filters.class_id === 'all' ? true : String(student.class_id || '') === String(filters.class_id);
      const matchStatus = filters.status === 'all' ? true : String(student.status || '') === String(filters.status);
      return matchSearch && matchClass && matchStatus;
    });
  }, [enrichedStudents, searchTerm, filters]);

  const academicYear = getAcademicYear();

  const selectedClassStudents = useMemo(() => {
    if (!selectedPrintClassId) return [];
    return enrichedStudents
      .filter((student) => String(student.class_id || '') === String(selectedPrintClassId) && String(student.status || '') === 'active')
      .sort(sortStudents);
  }, [enrichedStudents, selectedPrintClassId]);

  const activeFilterCount = [
    searchTerm.trim(),
    filters.class_id !== 'all',
    filters.status !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ class_id: 'all', status: 'active' });
  };

  const handlePrint = () => {
    if (!selectedStudent) return;
    printHtml(makeCardsPrintHtml([selectedStudent], academicYear, `Carte ${getFullName(selectedStudent)}`));
  };

  const handlePrintClass = () => {
    if (!selectedPrintClassId || selectedClassStudents.length === 0) return;
    const cls = classById.get(Number(selectedPrintClassId));
    printHtml(makeCardsPrintHtml(selectedClassStudents, academicYear, `Cartes ${cls?.name || ''}`));
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6 pb-8 fade-in">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold uppercase text-[#003399] dark:text-blue-200">
              <CreditCard className="h-3.5 w-3.5" />
              Atelier cartes
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Cartes scolaires</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Selectionnez un eleve ou imprimez directement toute une classe avec une carte moderne et lisible.
            </p>
          </div>
          <Button onClick={handlePrint} disabled={!selectedStudent} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
            <Printer className="h-4 w-4" />
            Imprimer la carte
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Eleves" value={stats.total} helper={`${filteredStudents.length} affiches`} tone="blue" />
        <StatTile icon={ShieldCheck} label="Actifs" value={stats.active} helper="Disponibles par defaut" tone="green" />
        <StatTile icon={User} label="Avec photo" value={stats.withPhoto} helper="Cartes plus completes" tone="orange" />
        <StatTile icon={GraduationCap} label="Affectes" value={stats.withClass} helper="Avec classe definie" tone="blue" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <ClassPrintPanel
            classes={classes}
            selectedClassId={selectedPrintClassId}
            onChangeClass={setSelectedPrintClassId}
            onPrint={handlePrintClass}
            count={selectedClassStudents.length}
          />

          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardContent className="space-y-3 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Nom, matricule, classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
              <SelectField value={filters.class_id} onChange={(e) => setFilters((prev) => ({ ...prev, class_id: e.target.value }))}>
                <option value="all">Toutes les classes</option>
                <option value="">Non assigne</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </SelectField>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <SelectField value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </SelectField>
                <Button type="button" variant="outline" size="icon" onClick={resetFilters} title="Reinitialiser">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Filter className="h-4 w-4" />
                <span>{activeFilterCount > 0 ? `${activeFilterCount} filtre(s) actif(s)` : 'Aucun filtre actif'}</span>
              </div>
            </CardContent>
          </Card>

          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                Aucun eleve trouve.
              </div>
            ) : filteredStudents.map((student) => {
              const selected = selectedStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => setSelectedStudent(student)}
                  className={`w-full rounded-lg border p-3 text-left transition ${selected ? 'border-[#0066CC] bg-[#0066CC]/5 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <StudentAvatar student={student} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-950 dark:text-white">{getFullName(student)}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                        <span>{student.matricule || 'Sans matricule'}</span>
                        <span>•</span>
                        <span className="truncate">{student.class_name || 'Non assigne'}</span>
                      </div>
                    </div>
                    {selected && <CheckCircle className="h-5 w-5 text-[#0066CC]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="space-y-4">
          {selectedStudent ? (
            <>
              <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                      <StudentAvatar student={selectedStudent} className="h-14 w-14 rounded-lg" />
                      <div>
                        <p className="text-lg font-bold text-slate-950 dark:text-white">{getFullName(selectedStudent)}</p>
                        <p className="text-sm text-slate-500">{selectedStudent.class_name || 'Non assigne'} • {selectedStudent.matricule || 'Sans matricule'}</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoLine icon={Hash} label="Matricule" value={selectedStudent.matricule} />
                    <InfoLine icon={School} label="Classe" value={selectedStudent.class_name || 'Non assigne'} />
                    <InfoLine icon={Calendar} label="Naissance" value={formatDate(selectedStudent.date_of_birth)} />
                    <InfoLine icon={Phone} label="Contact" value={selectedStudent.guardian_phone || selectedStudent.phone} />
                    <div className="sm:col-span-2 xl:col-span-4">
                      <InfoLine icon={MapPin} label="Adresse" value={selectedStudent.address} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900">
                <PrintableStudentCard student={selectedStudent} academicYear={academicYear} />
              </div>

              <p className="text-center text-sm text-slate-500">
                Format moderne paysage, pret pour impression individuelle ou par classe.
              </p>
            </>
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center dark:border-slate-800 dark:bg-slate-950">
              <CreditCard className="h-14 w-14 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Selectionnez un eleve</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                L'apercu de la carte et les informations de verification apparaitront ici.
              </p>
            </div>
          )}
        </main>
      </section>
    </div>
  );
}
