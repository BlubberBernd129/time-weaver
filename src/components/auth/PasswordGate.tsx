import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PasswordGateProps {
  children: React.ReactNode;
}

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || '';
const AUTH_KEY = 'timetracker_authenticated';

export function PasswordGate({ children }: PasswordGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If no password is set, allow access
    if (!APP_PASSWORD) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // Check if already authenticated in this session
    const authenticated = sessionStorage.getItem(AUTH_KEY);
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === APP_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      toast.success('Erfolgreich angemeldet');
    } else {
      toast.error('Falsches Passwort');
      setPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
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
              Bitte gib das Passwort ein, um fortzufahren
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                className="pr-10 bg-secondary border-border"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <Button type="submit" className="w-full">
              Anmelden
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
