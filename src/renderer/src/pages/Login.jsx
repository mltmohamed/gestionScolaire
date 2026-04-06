import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { APP_LOGO_PNG } from '@/config/appLogo';

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
    <div className="min-h-screen w-full bg-[#f3f3f3] relative overflow-hidden">
      <div className="absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_1px_1px,#bfbfbf_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative z-10 min-h-screen flex flex-col items-center">
        <div className="pt-20" />

        <img src={APP_LOGO_PNG} alt="Logo" className="h-44 w-44 object-contain drop-shadow-md" />

        <div className="mt-10 relative">
          <Card className="relative z-10 w-[520px] bg-[#e9e9e9] border border-black/20 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm text-black/50">Nom d'utilisateur</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    className="h-12 rounded-full bg-white shadow-inner border border-black/10 px-5 text-black caret-black placeholder:text-black/30"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-black/50">Mot de passe</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    autoComplete="current-password"
                    className="h-12 rounded-full bg-white shadow-inner border border-black/10 px-5 text-black caret-black placeholder:text-black/30"
                    required
                  />
                </div>

                <div className="flex items-center justify-center pt-2">
                  <Button
                    type="submit"
                    className="h-10 px-10 rounded-full bg-[#0b78a6] hover:bg-[#0a6b95] text-white font-semibold shadow-[0_6px_12px_rgba(0,0,0,0.2)]"
                    disabled={loading}
                  >
                    {loading ? '...' : 'Se connecter'}
                  </Button>
                </div>
                <p className="pt-4 text-center text-xs text-black/45">
                  Première installation : identifiant <span className="font-semibold">admin</span>, mot de passe{' '}
                  <span className="font-semibold">admin</span> (à modifier dans les paramètres).
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {ToastComponent}
    </div>
  );
}
