import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Database,
  Download,
  HardDrive,
  KeyRound,
  Lock,
  Mail,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast.jsx';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import { cn } from '@/utils/cn';

const NAV_ITEMS = [
  { id: 'profile', label: 'Profil', hint: 'Identite et contact', icon: User },
  { id: 'appearance', label: 'Apparence', hint: 'Theme et langue', icon: Palette },
  { id: 'security', label: 'Securite', hint: 'Mot de passe', icon: ShieldCheck },
  { id: 'data', label: 'Donnees', hint: 'Sauvegarde locale', icon: Database },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Systeme', icon: Monitor },
];

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Francais', detail: 'Interface en francais' },
  { value: 'en', label: 'English', detail: 'Interface anglaise' },
];

export default function Settings() {
  const { toast, ToastComponent } = useToast();
  const { theme, setTheme } = useTheme();
  const { profile, setProfile, initials } = useProfile();
  const photoInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('profile');
  const [preferences, setPreferences] = useState({ theme: 'system', language: 'fr' });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState({ export: false, import: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('settings.preferences');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setPreferences((prev) => ({ ...prev, ...parsed, theme: parsed.theme || theme }));
          return;
        }
      }
    } catch {
      // Ignore invalid local preferences.
    }
    setPreferences((prev) => ({ ...prev, theme }));
  }, [theme]);

  const completion = useMemo(() => {
    const fields = [profile.name, profile.email, profile.phone, profile.photo];
    const filled = fields.filter((value) => Boolean(String(value || '').trim())).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const persistPreferences = (nextPreferences = preferences) => {
    try {
      localStorage.setItem('settings.preferences', JSON.stringify(nextPreferences));
    } catch {
      // Ignore localStorage failures.
    }
  };

  const handleSave = () => {
    persistPreferences(preferences);
    setTheme(preferences.theme);
    toast.success('Parametres enregistres');
  };

  const updateTheme = (value) => {
    const next = { ...preferences, theme: value };
    setPreferences(next);
    persistPreferences(next);
    setTheme(value);
  };

  const updateLanguage = (value) => {
    const next = { ...preferences, language: value };
    setPreferences(next);
    persistPreferences(next);
    toast.success('Preference de langue enregistree');
  };

  const handleExportData = async () => {
    if (dataLoading.export) return;
    if (!window.electronAPI || !window.electronAPI.exportData) {
      toast.error('API non disponible');
      return;
    }

    setDataLoading((prev) => ({ ...prev, export: true }));
    try {
      const result = await window.electronAPI.exportData();
      if (result?.success) {
        toast.success('Export termine');
      } else if (result?.error !== 'Cancelled') {
        toast.error(result?.error || 'Erreur export');
      }
    } catch (error) {
      toast.error(error?.message || 'Erreur export');
    } finally {
      setDataLoading((prev) => ({ ...prev, export: false }));
    }
  };

  const handleImportData = async () => {
    if (dataLoading.import) return;
    if (!window.electronAPI || !window.electronAPI.importData) {
      toast.error('API non disponible');
      return;
    }

    if (!window.confirm('Importer remplacera les donnees actuelles. Continuer ?')) {
      return;
    }

    setDataLoading((prev) => ({ ...prev, import: true }));
    try {
      const result = await window.electronAPI.importData();
      if (result?.success) {
        toast.success('Import termine');
      } else if (result?.error !== 'Cancelled') {
        toast.error(result?.error || 'Erreur import');
      }
    } catch (error) {
      toast.error(error?.message || 'Erreur import');
    } finally {
      setDataLoading((prev) => ({ ...prev, import: false }));
    }
  };

  const handleSelectPhoto = () => {
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
      photoInputRef.current.click();
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      toast.error('Veuillez selectionner une image');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile({ ...profile, photo: reader.result });
      toast.success('Photo de profil mise a jour');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfile({ ...profile, photo: null });
    toast.success('Photo supprimee');
  };

  const handleChangePassword = async () => {
    if (securityLoading) return;

    const current = String(securityForm.currentPassword || '');
    const next = String(securityForm.newPassword || '');
    const confirm = String(securityForm.confirmPassword || '');

    if (!current || !next || !confirm) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    if (next.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caracteres');
      return;
    }
    if (next !== confirm) {
      toast.error('La confirmation ne correspond pas');
      return;
    }
    if (!window.electronAPI || !window.electronAPI.changePassword) {
      toast.error('API non disponible');
      return;
    }

    setSecurityLoading(true);
    try {
      const result = await window.electronAPI.changePassword(current, next);
      if (result?.success) {
        toast.success('Mot de passe modifie');
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(result?.error || 'Erreur lors de la modification');
      }
    } catch (error) {
      toast.error(error?.message || 'Erreur lors de la modification');
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-5 fade-in pb-8">
      {ToastComponent}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white dark:border-slate-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                <SettingsIcon className="h-3.5 w-3.5 text-amber-300" />
                Centre de configuration
              </div>
              <h1 className="text-2xl font-bold tracking-normal">Parametres</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Ajustez le profil, l'apparence, la securite et les sauvegardes depuis un seul espace.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/10 p-2 text-center">
              <HeroMetric label="Profil" value={`${completion}%`} />
              <HeroMetric label="Theme" value={themeLabel(preferences.theme)} />
              <HeroMetric label="Stockage" value="Local" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50 lg:border-b-0 lg:border-r">
            <div className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition',
                      active
                        ? 'border-[#0066CC] bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white'
                        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white dark:text-slate-300 dark:hover:border-slate-800 dark:hover:bg-slate-950'
                    )}
                  >
                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-md', active ? 'bg-[#0066CC] text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-xs text-slate-500">{item.hint}</span>
                    </span>
                    {active && <Check className="h-4 w-4 text-[#0066CC]" />}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="p-5">
            {activeSection === 'profile' && (
              <SectionPanel title="Profil administrateur" description="Informations visibles dans l'en-tete et la barre laterale.">
                <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/50">
                    <button
                      type="button"
                      onClick={handleSelectPhoto}
                      className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg bg-[#0066CC] text-3xl font-bold text-white shadow-sm"
                    >
                      {profile.photo ? <img src={profile.photo} alt="Avatar" className="h-full w-full object-cover" /> : initials}
                    </button>
                    <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <p className="mt-4 text-sm font-semibold text-slate-950 dark:text-white">Photo de profil</p>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG ou JPEG.</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleSelectPhoto}>
                        <Camera className="mr-2 h-4 w-4" />
                        Choisir
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleRemovePhoto} disabled={!profile.photo} className="text-red-600 hover:text-red-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Retirer
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nom complet">
                      <Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Nom de l'administrateur" />
                    </Field>
                    <Field label="Role">
                      <Input value={profile.role} disabled />
                    </Field>
                    <Field label="Email">
                      <IconInput icon={Mail} type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="admin@ecole.com" />
                    </Field>
                    <Field label="Telephone">
                      <IconInput icon={Smartphone} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="+223 ..." />
                    </Field>
                  </div>
                </div>

                <ActionBar>
                  <Button onClick={handleSave} className="bg-[#0066CC] hover:bg-[#005bb8]">
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </Button>
                </ActionBar>
              </SectionPanel>
            )}

            {activeSection === 'appearance' && (
              <SectionPanel title="Apparence" description="Choisissez un affichage confortable pour votre usage quotidien.">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Theme</Label>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const active = preferences.theme === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateTheme(option.value)}
                            className={cn(
                              'rounded-lg border p-4 text-left transition hover:border-[#0066CC]',
                              active ? 'border-[#0066CC] bg-blue-50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className={cn('flex h-10 w-10 items-center justify-center rounded-md', active ? 'bg-[#0066CC] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
                                <Icon className="h-5 w-5" />
                              </span>
                              {active && <CheckCircle2 className="h-5 w-5 text-[#0066CC]" />}
                            </div>
                            <p className="mt-4 font-semibold text-slate-950 dark:text-white">{option.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Langue</Label>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {LANGUAGE_OPTIONS.map((option) => {
                        const active = preferences.language === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => updateLanguage(option.value)}
                            className={cn(
                              'flex items-center justify-between rounded-lg border p-4 text-left transition hover:border-[#0066CC]',
                              active ? 'border-[#0066CC] bg-blue-50 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-800'
                            )}
                          >
                            <span>
                              <span className="block font-semibold text-slate-950 dark:text-white">{option.label}</span>
                              <span className="text-sm text-slate-500">{option.detail}</span>
                            </span>
                            {active && <CheckCircle2 className="h-5 w-5 text-[#0066CC]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SectionPanel>
            )}

            {activeSection === 'security' && (
              <SectionPanel title="Securite" description="Mettez a jour le mot de passe de connexion.">
                <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
                  <div className="grid gap-4">
                    <Field label="Mot de passe actuel">
                      <IconInput icon={Lock} type="password" value={securityForm.currentPassword} onChange={(event) => setSecurityForm((prev) => ({ ...prev, currentPassword: event.target.value }))} placeholder="Mot de passe actuel" />
                    </Field>
                    <Field label="Nouveau mot de passe">
                      <IconInput icon={KeyRound} type="password" value={securityForm.newPassword} onChange={(event) => setSecurityForm((prev) => ({ ...prev, newPassword: event.target.value }))} placeholder="Au moins 6 caracteres" />
                    </Field>
                    <Field label="Confirmation">
                      <IconInput icon={KeyRound} type="password" value={securityForm.confirmPassword} onChange={(event) => setSecurityForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} placeholder="Repeter le nouveau mot de passe" />
                    </Field>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
                    <ShieldCheck className="mb-3 h-6 w-6" />
                    <p className="font-semibold">Conseil securite</p>
                    <p className="mt-2 leading-6">Utilisez un mot de passe unique, garde par l'administration et renouvele en cas de changement de responsable.</p>
                  </div>
                </div>

                <ActionBar>
                  <Button onClick={handleChangePassword} disabled={securityLoading} className="bg-[#0066CC] hover:bg-[#005bb8]">
                    <Save className="mr-2 h-4 w-4" />
                    {securityLoading ? 'Modification...' : 'Changer le mot de passe'}
                  </Button>
                </ActionBar>
              </SectionPanel>
            )}

            {activeSection === 'data' && (
              <SectionPanel title="Donnees" description="Sauvegardez ou restaurez les donnees de l'application.">
                <div className="grid gap-4 md:grid-cols-2">
                  <DataAction
                    icon={Download}
                    title="Exporter"
                    description="Creez une sauvegarde JSON complete de l'ecole."
                    buttonLabel={dataLoading.export ? 'Export...' : 'Exporter les donnees'}
                    onClick={handleExportData}
                    disabled={dataLoading.export}
                  />
                  <DataAction
                    icon={Upload}
                    title="Importer"
                    description="Restaurez une sauvegarde. Les donnees actuelles seront remplacees."
                    buttonLabel={dataLoading.import ? 'Import...' : 'Importer une sauvegarde'}
                    onClick={handleImportData}
                    disabled={dataLoading.import}
                    variant="outline"
                  />
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <HardDrive className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">Stockage local</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Les donnees restent sur cet ordinateur. Exportez regulierement une sauvegarde et conservez-la sur un support externe.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionPanel>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-md bg-white px-4 py-3 text-slate-950">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function SectionPanel({ title, description, children }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</Label>
      {children}
    </div>
  );
}

function IconInput({ icon: Icon, className, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input className={cn('pl-10', className)} {...props} />
    </div>
  );
}

function ActionBar({ children }) {
  return <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">{children}</div>;
}

function DataAction({ icon: Icon, title, description, buttonLabel, onClick, disabled, variant = 'default' }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <span className="flex h-11 w-11 items-center justify-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-bold text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-1 min-h-[44px] text-sm leading-6 text-slate-500">{description}</p>
      <Button onClick={onClick} disabled={disabled} variant={variant} className={cn('mt-4 w-full', variant === 'default' && 'bg-[#0066CC] hover:bg-[#005bb8]')}>
        <Icon className="mr-2 h-4 w-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}

function themeLabel(value) {
  if (value === 'light') return 'Clair';
  if (value === 'dark') return 'Sombre';
  return 'Auto';
}
