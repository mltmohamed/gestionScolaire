import React from 'react';
import { Bell, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Section gauche - Titre de la page */}
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Section droite - Actions */}
      <div className="flex items-center gap-4">
        {/* Barre de recherche */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-64 pl-10"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Profil utilisateur */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
            A
          </div>
          <div className="hidden text-sm md:block">
            <p className="font-medium">Admin</p>
            <p className="text-xs text-muted-foreground">Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
}
