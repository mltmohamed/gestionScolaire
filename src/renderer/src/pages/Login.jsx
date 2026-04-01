import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Lock, User, LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast, ToastComponent } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        toast.success('Connexion réussie !');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#003399] via-black to-black relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0066CC]/25 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#003399]/25 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <Card className="w-full max-w-md relative z-10 bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#0066CC] to-[#003399] rounded-2xl flex items-center justify-center shadow-lg shadow-black/30">
            <img src="/assets/images/logo.png" alt="LA SAGESSE" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-white to-white bg-clip-text text-transparent">
              LA SAGESSE
            </CardTitle>
            <CardDescription className="text-white/70 mt-2">
              Connectez-vous pour accéder à votre établissement
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Nom d'utilisateur</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 group-focus-within:text-white transition-colors" />
                  <Input
                    type="text"
                    placeholder="Ex: admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 ml-1">Mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 group-focus-within:text-white transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-[#0066CC] focus:border-[#0066CC]"
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-[#0066CC] to-[#003399] hover:from-[#005bb8] hover:to-[#002b80] text-white font-bold py-6 rounded-xl shadow-lg shadow-black/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Se connecter
                  <LogIn className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            
            <p className="text-center text-xs text-violet-300/40">
              © 2026 LA SAGESSE
            </p>
          </form>
        </CardContent>
      </Card>
      {ToastComponent}
    </div>
  );
}
