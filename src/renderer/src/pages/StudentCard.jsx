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

function PrintableStudentCard({ student, className, academicYear }) {
  const genderLabel = student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Féminin' : 'N/A';

  return (
    <div
      id="student-card"
      className={`mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-xl ${className || ''}`}
      style={{ width: '600px', height: '380px' }}
    >
      <div className="flex h-full">
        <aside className="flex w-[76px] flex-col items-center justify-between bg-[#003399] px-3 py-5 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white p-1.5">
            <img src={APP_LOGO_PNG} alt="LA SAGESSE" className="h-full w-full object-contain" />
          </div>
          <div className="text-[11px] font-bold uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            LA SAGESSE
          </div>
          <div className="h-12 w-1 rounded-full bg-white/35" />
        </aside>

        <section className="flex w-[180px] flex-col items-center justify-center border-r border-slate-200 bg-slate-50 px-5">
          {student.photo ? (
            <img src={student.photo} alt="" className="h-32 w-32 rounded-xl border-4 border-white object-cover shadow-md" />
          ) : (
            <div className={`flex h-32 w-32 items-center justify-center rounded-xl border-4 border-white shadow-md ${student.gender === 'F' ? 'bg-[#CC0033]/10 text-[#CC0033]' : 'bg-[#0066CC]/10 text-[#0066CC]'}`}>
              <User className="h-16 w-16" />
            </div>
          )}
          <p className="mt-4 text-[10px] font-semibold uppercase text-slate-500">Matricule</p>
          <p className="text-lg font-bold text-[#0066CC]">{student.matricule || 'N/A'}</p>
        </section>

        <section className="flex flex-1 flex-col justify-between p-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Carte d'élève</p>
                <h2 className="mt-1 text-2xl font-bold leading-tight text-slate-950">{getFullName(student) || 'Élève'}</h2>
              </div>
              <div className="rounded-lg bg-[#0066CC]/10 px-3 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase text-[#0066CC]">Année</p>
                <p className="text-sm font-bold text-[#003399]">{academicYear}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Classe</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <School className="h-4 w-4 text-[#0066CC]" />
                  {student.class_name || 'Non assigné'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Naissance</p>
                <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Calendar className="h-4 w-4 text-[#0066CC]" />
                  {formatDate(student.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Genre</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{genderLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Contact tuteur</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{student.guardian_phone || student.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle className="h-4 w-4 text-[#0066CC]" />
              Carte scolaire officielle
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase text-slate-400">Établissement</p>
              <p className="text-xs font-bold text-[#003399]">LA SAGESSE</p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

export default function StudentCard() {
  const { students, loading } = useStudents();
  const { classes } = useClasses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
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

  const academicYear = (() => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  })();

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
    window.print();
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
            <h1 className="mt-4 text-3xl font-bold text-slate-950 dark:text-white">Cartes étudiant</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Sélectionnez un élève, vérifiez les informations clés et imprimez une carte propre au format paysage.
            </p>
          </div>
          <Button onClick={handlePrint} disabled={!selectedStudent} className="h-11 gap-2 bg-[#0066CC] hover:bg-[#005bb8]">
            <Printer className="h-4 w-4" />
            Imprimer la carte
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile icon={Users} label="Élèves" value={stats.total} helper={`${filteredStudents.length} affichés`} tone="blue" />
        <StatTile icon={ShieldCheck} label="Actifs" value={stats.active} helper="Disponibles par défaut" tone="green" />
        <StatTile icon={User} label="Avec photo" value={stats.withPhoto} helper="Cartes plus complètes" tone="orange" />
        <StatTile icon={GraduationCap} label="Affectés" value={stats.withClass} helper="Avec classe définie" tone="blue" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
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
                <option value="">Non assigné</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name} - {cls.level}</option>
                ))}
              </SelectField>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <SelectField value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                </SelectField>
                <Button type="button" variant="outline" size="icon" onClick={resetFilters} title="Réinitialiser">
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
                Aucun élève trouvé.
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
                        <span className="truncate">{student.class_name || 'Non assigné'}</span>
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
                        <p className="text-sm text-slate-500">{selectedStudent.class_name || 'Non assigné'} · {selectedStudent.matricule || 'Sans matricule'}</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoLine icon={Hash} label="Matricule" value={selectedStudent.matricule} />
                    <InfoLine icon={School} label="Classe" value={selectedStudent.class_name || 'Non assigné'} />
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
                Format recommandé : 86 mm x 54 mm. L’impression masque automatiquement l’interface et centre la carte.
              </p>
            </>
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-center dark:border-slate-800 dark:bg-slate-950">
              <CreditCard className="h-14 w-14 text-slate-300" />
              <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Sélectionnez un élève</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                L’aperçu de la carte et les informations de vérification apparaîtront ici.
              </p>
            </div>
          )}
        </main>
      </section>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }

          body * {
            visibility: hidden;
          }

          #student-card,
          #student-card * {
            visibility: visible;
          }

          #student-card {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            border: 1px solid #e2e8f0;
            width: 600px !important;
            height: 380px !important;
          }
        }
      `}</style>
    </div>
  );
}
