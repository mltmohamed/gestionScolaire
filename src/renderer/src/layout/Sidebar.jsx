import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  School,
  FileText,
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  CreditCard,
  Shirt,
  DollarSign,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { APP_LOGO_PNG } from '@/config/appLogo';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Élèves', href: '/students', icon: GraduationCap },
  { name: 'Professeurs', href: '/teachers', icon: Users },
  { name: 'Classes', href: '/classes', icon: School },
  { name: 'Carte Étudiant', href: '/student-card', icon: CreditCard },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const { profile, initials } = useProfile();
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(false);

  return (
    <div className="relative flex h-full w-72 flex-col border-r border-black/10 dark:border-white/10">
      {/* Arrière-plan glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-white dark:from-[#003399] dark:via-black dark:to-black"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10 dark:opacity-50"></div>
      
      {/* Effets de lumière */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#0066CC]/30 via-black/10 to-[#003399]/30 dark:from-[#0066CC]/60 dark:via-white/10 dark:to-[#003399]/60"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#0066CC]/20 via-black/10 to-[#003399]/20 dark:from-[#0066CC]/40 dark:via-white/10 dark:to-[#003399]/40"></div>
      
      {/* Contenu */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Logo avec effet glow */}
        <div className="group relative flex h-20 items-center border-b border-black/10 dark:border-white/10 px-6 transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC] to-[#003399] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative p-2 bg-gradient-to-br from-[#0066CC] to-[#003399] rounded-xl">
              <div className="bg-white/95 rounded-lg p-1 shadow-sm ring-1 ring-black/10">
                <img src={APP_LOGO_PNG} alt="LA SAGESSE" className="h-9 w-9 object-contain" />
              </div>
            </div>
          </div>
          <div className="ml-4">
            <span className="block text-lg font-bold text-slate-900 dark:bg-gradient-to-r dark:from-white dark:via-white dark:to-white dark:bg-clip-text dark:text-transparent">
              LA SAGESSE
            </span>
            <span className="block text-xs text-slate-600 dark:text-white/70 font-medium">
              Établissement
            </span>
          </div>
        </div>

        {/* Navigation avec effets modernes */}
        <nav className="flex-1 space-y-1.5 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[#0066CC] to-[#003399] text-white shadow-lg shadow-black/25'
                    : 'text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white'
                )
              }
            >
              {/* Effet de bordure animée */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0066CC]/20 to-[#003399]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              {/* Indicateur latéral */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-[#0066CC] to-[#003399] opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              <item.icon className={cn(
                "relative mr-4 h-5 w-5 transition-transform duration-200",
                "group-hover:scale-110"
              )} />
              <span className="relative">{item.name}</span>
              
              {/* Point lumineux pour élément actif */}
              {(() => {
                const { isActive } = arguments[0];
                return isActive && (
                  <div className="absolute right-3 w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse"></div>
                );
              })(arguments[0])}
            </NavLink>
          ))}
          
          {/* Sous-menu Paiements */}
          <div className="space-y-1">
            <button
              onClick={() => setPaymentsOpen(!paymentsOpen)}
              className={cn(
                'group relative flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                paymentsOpen || window.location.pathname.startsWith('/payments')
                  ? 'bg-gradient-to-r from-[#0066CC] to-[#003399] text-white shadow-lg shadow-black/25'
                  : 'text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white'
              )}
            >
              {/* Effet de bordure animée */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0066CC]/20 to-[#003399]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              {/* Indicateur latéral */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-[#0066CC] to-[#003399] opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              <Wallet className={cn(
                "relative mr-4 h-5 w-5 transition-transform duration-200",
                "group-hover:scale-110"
              )} />
              <span className="relative flex-1 text-left">Paiements</span>
              
              {paymentsOpen ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              )}
              
              {/* Point lumineux pour élément actif */}
              {window.location.pathname.startsWith('/payments') && (
                <div className="absolute right-3 w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse"></div>
              )}
            </button>
            
            {paymentsOpen && (
              <div className="ml-4 space-y-1">
                <NavLink
                  to="/payments/tuition"
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                    )
                  }
                >
                  <DollarSign className="mr-3 h-4 w-4" />
                  <span>Scolarité</span>
                </NavLink>
                
                <NavLink
                  to="/payments/uniform"
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                    )
                  }
                >
                  <Shirt className="mr-3 h-4 w-4" />
                  <span>Tenues</span>
                </NavLink>
                
                <NavLink
                  to="/payments/teachers"
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                    )
                  }
                >
                  <Users className="mr-3 h-4 w-4" />
                  <span>Enseignants</span>
                </NavLink>
              </div>
            )}
          </div>
          
          {/* Sous-menu Bulletin */}
          <div className="space-y-1">
            <button
              onClick={() => setBulletinOpen(!bulletinOpen)}
              className={cn(
                'group relative flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                bulletinOpen || window.location.pathname.startsWith('/bulletin')
                  ? 'bg-gradient-to-r from-[#0066CC] to-[#003399] text-white shadow-lg shadow-black/25'
                  : 'text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white'
              )}
            >
              {/* Effet de bordure animée */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0066CC]/20 to-[#003399]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              {/* Indicateur latéral */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-[#0066CC] to-[#003399] opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              <FileText className={cn(
                "relative mr-4 h-5 w-5 transition-transform duration-200",
                "group-hover:scale-110"
              )} />
              <span className="relative flex-1 text-left">Bulletin</span>
              
              {bulletinOpen ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
              )}
              
              {/* Point lumineux pour élément actif */}
              {window.location.pathname.startsWith('/bulletin') && (
                <div className="absolute right-3 w-2 h-2 rounded-full bg-white shadow-lg shadow-white/50 animate-pulse"></div>
              )}
            </button>
            
            {bulletinOpen && (
              <div className="ml-4 space-y-1">
                <NavLink
                  to="/bulletin/primary"
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                    )
                  }
                >
                  <GraduationCap className="mr-3 h-4 w-4" />
                  <span>Primaire (3e-6e)</span>
                </NavLink>
                
                <NavLink
                  to="/bulletin/college"
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                    )
                  }
                >
                  <Users className="mr-3 h-4 w-4" />
                  <span>Second Cycle (7e-9e)</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Footer avec séparation élégante */}
        <div className="border-t border-black/10 dark:border-white/10 p-4 space-y-2">
          <div className="flex items-center px-4 py-2 mb-2">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#0066CC]/20 flex items-center justify-center border border-[#0066CC]/30">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {initials}
                </span>
              </div>
            )}
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{profile.name || user?.username}</p>
              <p className="text-[10px] text-slate-500 dark:text-white/60 uppercase tracking-wider font-bold">Administrator</p>
            </div>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "group relative flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-[#0066CC] to-[#003399] text-white shadow-lg shadow-black/25"
                  : "text-slate-700 hover:bg-black/5 hover:text-slate-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
              )
            }
          >
            <SettingsIcon className="mr-4 h-5 w-5" />
            <span>Paramètres</span>
          </NavLink>

          <button
            onClick={logout}
            className="group relative flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all duration-200"
          >
            <LogOut className="mr-4 h-5 w-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
