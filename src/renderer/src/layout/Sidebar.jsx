import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  School,
  Settings
} from 'lucide-react';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Élèves', href: '/students', icon: GraduationCap },
  { name: 'Professeurs', href: '/teachers', icon: Users },
  { name: 'Classes', href: '/classes', icon: School },
];

export default function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <School className="h-8 w-8 text-primary" />
        <span className="ml-3 text-lg font-bold">SchoolManage</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <button
          className="flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="mr-3 h-5 w-5" />
          Paramètres
        </button>
      </div>
    </div>
  );
}
