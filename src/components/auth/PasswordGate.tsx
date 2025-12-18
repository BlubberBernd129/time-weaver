import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { pb, login, isAuthenticated, logout } from '@/lib/pocketbase';

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuth, setIsAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if already authenticated via PocketBase
    if (isAuthenticated()) {
      setIsAuth(true);
    }
    setIsLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange(() => {
      setIsAuth(pb.authStore.isValid);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await login(email, password);
      toast.success('Erfolgreich angemeldet');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error?.message || 'Anmeldung fehlgeschlagen');
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async () => {
    setIsSubmitting(true);
    try {
      await login('nickbisch129@gmail.com', 'se0912ce');
      toast.success('Schnell-Login erfolgreich');
    } catch (error: any) {
      console.error('Quick login error:', error);
      toast.error(error?.message || 'Schnell-Login fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Abgemeldet');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">TimeTracker</h1>
            <p className="text-muted-foreground">
              Bitte melde dich an, um fortzufahren
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail eingeben..."
                className="bg-secondary border-border"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                className="pr-10 bg-secondary border-border"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </form>

          <div className="w-full border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleQuickLogin}
              disabled={isSubmitting}
            >
              <Zap className="w-4 h-4 mr-2" />
              Schnell-Login (Dev)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export logout for use in other components
export { logout };
