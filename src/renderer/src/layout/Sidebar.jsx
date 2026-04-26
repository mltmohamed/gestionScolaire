import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  School,
  Settings as SettingsIcon,
  Shirt,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { APP_LOGO_PNG } from '@/config/appLogo';

const MAIN_NAV = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard, end: true },
  { name: 'Eleves', href: '/students', icon: GraduationCap },
  { name: 'Professeurs', href: '/teachers', icon: Users },
  { name: 'Classes', href: '/classes', icon: School },
  { name: 'Cartes scolaires', href: '/student-card', icon: CreditCard },
];

const PAYMENT_NAV = [
  { name: 'Scolarite', href: '/payments/tuition', icon: DollarSign },
  { name: 'Tenues', href: '/payments/uniform', icon: Shirt },
  { name: 'Enseignants', href: '/payments/teachers', icon: Users },
];

const BULLETIN_NAV = [
  { name: 'Primaire 3e-6e', href: '/bulletin/primary', icon: GraduationCap },
  { name: 'Second cycle 7e-9e', href: '/bulletin/college', icon: Users },
];

function NavItem({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
          isActive
            ? 'bg-[#0066CC] text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-md transition', isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 group-hover:text-[#0066CC] dark:bg-slate-900 dark:text-slate-400')}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ title, icon: Icon, items, defaultOpen = false, active }) {
  const [open, setOpen] = useState(defaultOpen || active);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
          active
            ? 'bg-slate-100 text-slate-950 dark:bg-slate-900 dark:text-white'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
        )}
      >
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', active ? 'bg-[#0066CC]/10 text-[#0066CC]' : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400')}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="mt-1 space-y-1 border-l border-slate-200 pl-4 dark:border-slate-800">
          {items.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { profile, initials } = useProfile();
  const location = useLocation();

  const paymentsActive = location.pathname.startsWith('/payments');
  const bulletinActive = location.pathname.startsWith('/bulletin');

  const displayName = useMemo(() => profile.name || user?.username || 'Admin', [profile.name, user?.username]);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-5 dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-800">
          <img src={APP_LOGO_PNG} alt="LA SAGESSE" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-black uppercase tracking-normal text-slate-950 dark:text-white">La Sagesse</p>
          <p className="text-xs font-medium text-slate-500">Gestion scolaire</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Principal</p>
          <div className="space-y-1">
            {MAIN_NAV.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Gestion</p>
          <NavGroup title="Paiements" icon={Wallet} items={PAYMENT_NAV} active={paymentsActive} defaultOpen={paymentsActive} />
          <NavGroup title="Bulletins" icon={FileText} items={BULLETIN_NAV} active={bulletinActive} defaultOpen={bulletinActive} />
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          {profile.photo ? (
            <img src={profile.photo} alt="Avatar" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0066CC] text-sm font-bold text-white">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500">Administrateur</p>
          </div>
        </div>

        <div className="space-y-1">
          <NavItem item={{ name: 'Parametres', href: '/settings', icon: SettingsIcon }} />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <LogOut className="h-4 w-4" />
            </span>
            Deconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
