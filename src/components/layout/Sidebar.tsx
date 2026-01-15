import { Clock, LayoutDashboard, List, FolderTree, Calendar, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/timetracker';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/pocketbase';
import { toast } from 'sonner';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const navItems: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'entries', label: 'Alle Einträge', icon: List },
  { id: 'categories', label: 'Kategorien', icon: FolderTree },
  { id: 'calendar', label: 'Kalender', icon: Calendar },
  { id: 'statistics', label: 'Statistik', icon: BarChart3 },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const handleLogout = () => {
    logout();
    toast.success('Abgemeldet');
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">TimeTracker</h1>
            <p className="text-xs text-muted-foreground">Zeit im Blick</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'navActive' : 'nav'}
              size="default"
              className="w-full"
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Abmelden
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          v1.0.0 • Self-Hosted
        </p>
      </div>
    </aside>
  );
}
