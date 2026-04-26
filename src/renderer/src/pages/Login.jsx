import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, User, WifiOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_LOGO_PNG } from '@/config/appLogo';

const inputClassName = 'h-11 bg-white text-slate-950 placeholder:text-slate-400 caret-[#0066CC] border-slate-300 focus-visible:ring-[#0066CC]';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast, ToastComponent } = useToast();

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      toast.error('Renseignez l identifiant et le mot de passe');
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanUsername, password);
      if (result.success) {
        toast.success('Connexion reussie');
        navigate('/');
      } else {
        toast.error(result.error || 'Identifiants incorrects');
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {ToastComponent}

      <main className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#0066CC]" />
          <div className="absolute bottom-[-160px] left-[-120px] h-96 w-96 rounded-full bg-[#FF6600]/80" />
          <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-xl">
                <img src={APP_LOGO_PNG} alt="LA SAGESSE" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-200">Ecole privee</p>
                <h1 className="text-3xl font-black uppercase tracking-normal">La Sagesse</h1>
              </div>
            </div>

            <div className="mt-20 max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                Espace administration
              </p>
              <h2 className="mt-5 text-5xl font-black leading-tight tracking-normal">
                Une gestion scolaire plus claire, plus rapide.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                Connectez-vous pour gerer les eleves, les classes, les paiements, les bulletins et les cartes scolaires depuis un environnement local securise.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            <InfoTile label="Donnees" value="Locales" />
            <InfoTile label="Acces" value="Securise" />
            <InfoTile label="Annee" value={`${currentYear}`} />
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-sm">
                <img src={APP_LOGO_PNG} alt="LA SAGESSE" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0066CC]">Ecole privee</p>
                <h1 className="text-2xl font-black uppercase">La Sagesse</h1>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#0066CC]/10 px-3 py-1 text-xs font-semibold text-[#0066CC]">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Connexion
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-normal">Bienvenue</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Entrez vos identifiants administrateur pour continuer.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-semibold text-slate-700">Identifiant</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="admin"
                      autoComplete="username"
                      className={`${inputClassName} pl-10`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">Mot de passe</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Votre mot de passe"
                      autoComplete="current-password"
                      className={`${inputClassName} pl-10 pr-10`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="h-11 w-full bg-[#0066CC] font-semibold hover:bg-[#005bb8]">
                  <LogIn className="mr-2 h-4 w-4" />
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>

              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <div className="flex gap-3">
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Premiere installation : identifiant <strong>admin</strong>, mot de passe <strong>admin</strong>. Pensez a le modifier dans les parametres.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-slate-500">
              © {currentYear} La Sagesse. Application de gestion scolaire locale.
            </p>
          </div>
        </section>
      </main>
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          caret-color: #0066CC !important;
        }
      `}</style>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  );
}
