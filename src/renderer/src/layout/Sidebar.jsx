import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  School,
  Wallet,
  Settings as SettingsIcon,
  Sparkles,
  LogOut
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Élèves', href: '/students', icon: GraduationCap },
  { name: 'Professeurs', href: '/teachers', icon: Users },
  { name: 'Classes', href: '/classes', icon: School },
  { name: 'Paiements', href: '/payments', icon: Wallet },
];

export default function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <div className="relative flex h-full w-72 flex-col">
      {/* Arrière-plan glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-950 via-purple-950 to-indigo-950"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAyIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>
      
      {/* Effets de lumière */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500/50 via-purple-500/50 to-indigo-500/50"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-indigo-500/30"></div>
      
      {/* Contenu */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Logo avec effet glow */}
        <div className="group relative flex h-20 items-center border-b border-white/10 px-6 transition-all duration-300 hover:bg-white/5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <span className="block text-lg font-bold bg-gradient-to-r from-white via-violet-100 to-white bg-clip-text text-transparent">
              SchoolManage
            </span>
            <span className="block text-xs text-violet-300 font-medium">
              Éducation Platform
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
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                    : 'text-violet-200 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {/* Effet de bordure animée */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
              {/* Indicateur latéral */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full bg-gradient-to-b from-violet-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              
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
        </nav>

        {/* Footer avec séparation élégante */}
        <div className="border-t border-white/10 p-4 space-y-2">
          <div className="flex items-center px-4 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
              <span className="text-xs font-bold text-violet-200">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-[10px] text-violet-400 uppercase tracking-wider font-bold">Administrator</p>
            </div>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "group relative flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25"
                  : "text-violet-200 hover:bg-white/10 hover:text-white"
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
