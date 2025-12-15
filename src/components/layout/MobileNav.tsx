import { Clock, LayoutDashboard, FolderTree, Calendar, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/types/timetracker';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useState } from 'react';

interface MobileNavProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const navItems: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'categories', label: 'Kategorien', icon: FolderTree },
  { id: 'calendar', label: 'Kalender', icon: Calendar },
  { id: 'statistics', label: 'Statistik', icon: BarChart3 },
];

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    setOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-50 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground text-sm">TimeTracker</h1>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 bg-sidebar border-sidebar-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span>Navigation</span>
            </SheetTitle>
          </SheetHeader>
          <nav className="flex-1 pt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'navActive' : 'nav'}
                  size="default"
                  className="w-full"
                  onClick={() => handleViewChange(item.id)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

// Bottom navigation for mobile
export function MobileBottomNav({ currentView, onViewChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-sidebar border-t border-sidebar-border flex items-center justify-around z-50 lg:hidden safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors flex-1",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
