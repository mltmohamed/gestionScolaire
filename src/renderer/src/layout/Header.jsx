import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, CreditCard, GraduationCap, Receipt, UserPlus } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/context/ProfileContext';

const PAGE_META = [
  { match: (path) => path === '/', title: 'Tableau de bord', subtitle: 'Vue generale de votre etablissement' },
  { match: (path) => path.startsWith('/students'), title: 'Eleves', subtitle: 'Inscriptions, profils et suivi administratif' },
  { match: (path) => path.startsWith('/teachers'), title: 'Professeurs', subtitle: 'Equipe pedagogique et affectations' },
  { match: (path) => path.startsWith('/classes'), title: 'Classes', subtitle: 'Niveaux, effectifs et frais scolaires' },
  { match: (path) => path.startsWith('/student-card'), title: 'Cartes scolaires', subtitle: 'Impression individuelle ou par classe' },
  { match: (path) => path.startsWith('/payments/tuition'), title: 'Paiements scolarite', subtitle: 'Encaissements, restes et recus' },
  { match: (path) => path.startsWith('/payments/uniform'), title: 'Paiements tenues', subtitle: 'Tenues de classe et sportives' },
  { match: (path) => path.startsWith('/payments/teachers'), title: 'Paiements enseignants', subtitle: 'Salaires et recus mensuels' },
  { match: (path) => path.startsWith('/bulletin/primary'), title: 'Bulletins primaire', subtitle: 'Compositions mensuelles 3e a 6e' },
  { match: (path) => path.startsWith('/bulletin/college'), title: 'Bulletins second cycle', subtitle: 'Compositions trimestrielles 7e a 9e' },
  { match: (path) => path.startsWith('/settings'), title: 'Parametres', subtitle: 'Profil, apparence, securite et donnees' },
];

function getPageMeta(pathname) {
  return PAGE_META.find((item) => item.match(pathname)) || { title: 'La Sagesse', subtitle: 'Gestion scolaire' };
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, initials } = useProfile();

  const page = useMemo(() => getPageMeta(location.pathname), [location.pathname]);
  const today = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-[#0066CC]" />
          <span className="capitalize">{today}</span>
        </div>
        <h1 className="mt-1 truncate text-2xl font-black tracking-normal text-slate-950 dark:text-white">{page.title}</h1>
        <p className="truncate text-sm text-slate-500">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 xl:flex">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/students')} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Eleve
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/payments/tuition')} className="gap-2">
            <Receipt className="h-4 w-4" />
            Paiement
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/bulletin/primary')} className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Bulletin
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate('/student-card')} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Carte
          </Button>
        </div>

        <ThemeToggle />

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-800">
          {profile.photo ? (
            <img src={profile.photo} alt="Avatar" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066CC] text-sm font-bold text-white">{initials}</div>
          )}
          <div className="hidden lg:block">
            <p className="max-w-[150px] truncate text-sm font-semibold text-slate-950 dark:text-white">{profile.name || 'Admin'}</p>
            <p className="text-xs text-slate-500">Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
}
