import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, UserPlus, Sun, Moon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from "@/api";
import logo from '@/assets/logo.png';
import { useTheme } from '@/contexts/ThemeContext';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      switch (user.role) {
        case 'customer':
          navigate('/customer', { replace: true });
          break;
        case 'employee':
          navigate('/employee', { replace: true });
          break;
        case 'manager':
          navigate('/manager', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (isRegister && !name)) {
      toast({ title: 'Erro', description: 'Por favor preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    if (isRegister) {
      if (password !== confirmPassword) {
        toast({ title: 'Erro', description: 'As passwords não coincidem.', variant: 'destructive' });
        return;
      }
      if (password.length < 6) {
        toast({ title: 'Erro', description: 'A password deve ter pelo menos 6 caracteres.', variant: 'destructive' });
        return;
      }
      setIsSubmitting(true);
      try {
        await registerUser({ email, password, name });
        toast({ title: 'Conta criada!', description: 'A sua conta foi criada com sucesso. A iniciar sessão...' });
      } catch (err: any) {
        toast({ title: 'Erro ao criar conta', description: err.message || 'Algo deu errado', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
    } else {
      setIsSubmitting(true);
    }

    try {
      const success = await login(email, password);
      if (!success) {
        toast({ title: 'Erro de autenticação', description: 'Email ou password incorretos.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro de autenticação', description: 'Algo deu errado ao iniciar sessão.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setName('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Dark mode toggle - fixed top right */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur border border-border hover:bg-muted transition-colors shadow-sm"
        title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-amber-400" />
        ) : (
          <Moon className="h-5 w-5 text-slate-600" />
        )}
      </button>
      {/* Left Panel - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <img src={logo} alt="MarketFind Logo" className="w-16 h-16 object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">MarketFind</h1>
              <p className="text-white/70 text-lg">Navigator</p>
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4">
            Navegue pela loja de forma inteligente
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            Encontre produtos rapidamente, localize prateleiras e otimize a sua experiência de compra com o nosso sistema de navegação interativo.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { value: '30+', label: 'Produtos' },
              { value: '8', label: 'Secções' },
              { value: '6', label: 'Funcionários' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-white/70 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center overflow-hidden shadow-lg">
              <img src={logo} alt="MarketFind Logo" className="w-20 h-20 object-contain" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">MarketFind</h1>
              <p className="text-muted-foreground">Navigator</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {isRegister ? 'Criar Conta' : 'Iniciar Sessão'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isRegister
                ? 'Crie uma conta de cliente para começar a explorar'
                : 'Entre com o seu email e password'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="O seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>

            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Password <span className="text-destructive">*</span></Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12"
                  autoComplete="new-password"
                />
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold gap-2" disabled={isSubmitting}>
              {isRegister ? (
                <>Criar Conta <UserPlus className="w-5 h-5" /></>
              ) : (
                <>Entrar <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isRegister ? 'Já tem conta? Iniciar sessão' : 'Não tem conta? Criar conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
