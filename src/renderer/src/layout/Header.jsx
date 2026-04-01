import React from 'react';
import { Search, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/context/ProfileContext';

export default function Header() {
  const { profile, initials } = useProfile();
  return (
    <header className="relative flex h-20 items-center justify-between border-b border-black/10 bg-gradient-to-r from-white via-white to-white dark:from-black dark:via-black dark:to-black px-6 backdrop-blur-sm">
      {/* Section gauche - Titre avec style moderne */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0066CC] to-[#003399] rounded-lg blur opacity-20"></div>
          <div className="relative p-2 bg-gradient-to-br from-[#0066CC] to-[#003399] rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#0066CC] via-[#003399] to-[#0066CC] bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Section droite - Actions avec design amélioré */}
      <div className="flex items-center gap-3">
        {/* Barre de recherche stylisée */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0066CC] transition-colors" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-72 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-[#0066CC] focus:ring-2 focus:ring-[#0066CC]/20 transition-all shadow-sm hover:shadow-md"
          />
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profil utilisateur avec avatar dégradé */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC] to-[#003399] rounded-xl blur opacity-30"></div>
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Avatar"
                className="relative h-10 w-10 rounded-xl object-cover border border-white/20 shadow-lg"
              />
            ) : (
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-[#0066CC] to-[#003399] flex items-center justify-center text-white font-semibold shadow-lg">
                {initials}
              </div>
            )}
          </div>
          <div className="hidden lg:block">
            <p className="font-semibold text-gray-900 dark:text-white">{profile.name || 'Admin'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
}
