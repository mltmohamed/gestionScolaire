import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Database, 
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Mail,
  Smartphone,
  Lock,
  Camera,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast.jsx';

export default function Settings() {
  const { toast, ToastComponent } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  
  // États pour les différents paramètres
  const [profile, setProfile] = useState({
    name: 'Admin',
    email: 'admin@schoolmanage.com',
    phone: '+33 6 12 34 56 78',
    role: 'Administrateur'
  });

  const [preferences, setPreferences] = useState({
    theme: 'dark',
    language: 'fr',
    notifications: true,
    emails: true,
    sound: true
  });

  const handleSave = () => {
    toast.success('Paramètres enregistrés avec succès !');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'appearance', label: 'Apparence', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'data', label: 'Données', icon: Database },
  ];

  return (
    <div className="space-y-8 fade-in pb-8">
      {ToastComponent}

      {/* En-tête */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 md:p-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Paramètres
          </h1>
          <p className="text-violet-100 text-lg max-w-xl">
            Personnalisez votre expérience et gérez vos préférences
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Sidebar des onglets */}
        <div className="lg:col-span-3">
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden sticky top-6">
            <CardContent className="p-4 space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 dark:hover:text-violet-400'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-violet-500'
                  }`} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute right-3 w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Contenu des onglets */}
        <div className="lg:col-span-9 space-y-6">
          {/* Profil */}
          {activeTab === 'profile' && (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-violet-100 dark:border-violet-900/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Informations personnelles</h2>
                <p className="text-sm text-gray-500 mt-1">Gérez vos informations de profil</p>
              </div>
              <CardContent className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl cursor-pointer group-hover:scale-105 transition-transform">
                      A
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-violet-200 dark:border-violet-800 hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4 text-violet-600" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Photo de profil</h3>
                    <p className="text-sm text-gray-500 mt-1">Cliquez pour changer votre photo</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400">
                        <Upload className="w-4 h-4 mr-2" />
                        Importer
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Champs du formulaire */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nom complet</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rôle</Label>
                    <Input
                      value={profile.role}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Téléphone</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 rounded-xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer les modifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apparence */}
          {activeTab === 'appearance' && (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-violet-100 dark:border-violet-900/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Apparence</h2>
                <p className="text-sm text-gray-500 mt-1">Personnalisez l'apparence de l'application</p>
              </div>
              <CardContent className="p-6 space-y-8">
                {/* Thème */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Thème de l'application</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', icon: Sun, label: 'Clair' },
                      { value: 'dark', icon: Moon, label: 'Sombre' },
                      { value: 'system', icon: Monitor, label: 'Système' }
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => setPreferences({ ...preferences, theme: theme.value })}
                        className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                          preferences.theme === theme.value
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'
                        }`}
                      >
                        <theme.icon className={`w-8 h-8 mx-auto mb-3 transition-transform group-hover:scale-110 ${
                          preferences.theme === theme.value ? 'text-violet-600' : 'text-gray-400'
                        }`} />
                        <p className={`text-sm font-medium text-center ${
                          preferences.theme === theme.value ? 'text-violet-600' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {theme.label}
                        </p>
                        {preferences.theme === theme.value && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-5 h-5 text-violet-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Langue */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700 dark:text-gray-300">Langue</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: 'fr', icon: Globe, label: 'Français' },
                      { value: 'en', icon: Globe, label: 'English' }
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => setPreferences({ ...preferences, language: lang.value })}
                        className={`group flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${
                          preferences.language === lang.value
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                        }`}
                      >
                        <lang.icon className={`w-5 h-5 ${
                          preferences.language === lang.value ? 'text-violet-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          preferences.language === lang.value ? 'text-violet-600' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {lang.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 rounded-xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Appliquer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-violet-100 dark:border-violet-900/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
                <p className="text-sm text-gray-500 mt-1">Gérez vos préférences de notification</p>
              </div>
              <CardContent className="p-6 space-y-6">
                {[
                  { id: 'notifications', icon: Bell, label: 'Notifications push', desc: 'Recevoir des notifications sur le bureau' },
                  { id: 'emails', icon: Mail, label: 'Notifications par email', desc: 'Recevoir des résumés par email' },
                  { id: 'sound', icon: AlertCircle, label: 'Sons', desc: 'Activer les sons des notifications' }
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                        <item.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[item.id]}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, [item.id]: checked })}
                      className="data-[state=checked]:bg-violet-600"
                    />
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSave}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 rounded-xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sécurité */}
          {activeTab === 'security' && (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-violet-100 dark:border-violet-900/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sécurité</h2>
                <p className="text-sm text-gray-500 mt-1">Gérez votre mot de passe et la sécurité de votre compte</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Mot de passe actuel
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nouveau mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirmer le mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le compte
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 rounded-xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Données */}
          {activeTab === 'data' && (
            <Card className="border-0 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 p-6 border-b border-violet-100 dark:border-violet-900/30">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Données</h2>
                <p className="text-sm text-gray-500 mt-1">Exportez ou importez vos données</p>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                    <Download className="w-10 h-10 text-violet-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Exporter les données</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Téléchargez toutes vos données dans un fichier JSON
                    </p>
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25 rounded-xl">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  </div>

                  <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                    <Upload className="w-10 h-10 text-purple-600 mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Importer les données</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Restaurez vos données depuis un fichier JSON
                    </p>
                    <Button variant="outline" className="w-full border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 rounded-xl">
                      <Upload className="w-4 h-4 mr-2" />
                      Importer
                    </Button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-start gap-4">
                    <Database className="w-6 h-6 text-violet-600 mt-1" />
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2">Base de données locale</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Vos données sont stockées localement dans un fichier SQLite. Aucune donnée n'est envoyée vers des serveurs externes.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>100% local et sécurisé</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
