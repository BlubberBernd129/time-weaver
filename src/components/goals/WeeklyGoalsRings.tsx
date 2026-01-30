import { useState, useEffect } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, Subcategory, Goal, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForWeek } from '@/lib/timeUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface WeeklyGoalsRingsProps {
  categories: Category[];
  subcategories: Subcategory[];
  goals: Goal[];
  timeEntries: TimeEntry[];
  onAddGoal: (categoryId: string, type: 'daily' | 'weekly', targetMinutes: number, subcategoryId?: string) => void;
  onDeleteGoal: (id: string) => void;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
}

export function WeeklyGoalsRings({
  categories,
  subcategories,
  goals,
  timeEntries,
  onAddGoal,
  onDeleteGoal,
  getSubcategoriesForCategory,
}: WeeklyGoalsRingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [targetHours, setTargetHours] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const activeEntries = timeEntries.filter(e => !e.isPause);

  const handleAddGoal = () => {
    if (!selectedCategory || !targetHours) return;
    
    const minutes = parseFloat(targetHours) * 60;
    onAddGoal(selectedCategory, 'weekly', minutes);
    
    setDialogOpen(false);
    setSelectedCategory('');
    setTargetHours('');
  };

  const calculateProgress = (goal: Goal): { current: number; percentage: number } => {
    const entries = getEntriesForWeek(activeEntries, today);
    
    const filteredEntries = entries.filter(e => e.categoryId === goal.categoryId);
    
    const now = new Date();
    const totalSeconds = filteredEntries.reduce((acc, e) => {
      if (e.isRunning && e.startTime) {
        const elapsed = Math.floor((now.getTime() - new Date(e.startTime).getTime()) / 1000);
        return acc + Math.max(elapsed, 0);
      }
      return acc + e.duration;
    }, 0);
    
    const currentMinutes = totalSeconds / 60;
    const percentage = Math.min((currentMinutes / goal.targetMinutes) * 100, 100);
    
    return { current: totalSeconds, percentage };
  };

  // Only show weekly goals
  const weeklyGoals = goals.filter(g => g.type === 'weekly');

  return (
    <div className="glass-card p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Wochenziele</h2>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" />
              Ziel hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Wochenziel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Kategorie</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ziel (Stunden pro Woche)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  placeholder="z.B. 10"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleAddGoal}
                disabled={!selectedCategory || !targetHours}
              >
                Wochenziel erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {weeklyGoals.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Keine Wochenziele definiert
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Füge ein Ziel hinzu, um deinen Fortschritt zu verfolgen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {weeklyGoals.map(goal => {
            const category = categories.find(c => c.id === goal.categoryId);
            if (!category) return null;

            const { current, percentage } = calculateProgress(goal);
            const targetSeconds = goal.targetMinutes * 60;
            const isComplete = percentage >= 100;
            
            // SVG circle parameters
            const size = 100;
            const strokeWidth = 8;
            const radius = (size - strokeWidth) / 2;
            const circumference = radius * 2 * Math.PI;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
              <div 
                key={goal.id}
                className="flex flex-col items-center p-4 bg-secondary/30 rounded-xl"
              >
                {/* Progress Ring */}
                <div className="relative mb-3">
                  <svg width={size} height={size} className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="hsl(var(--secondary))"
                      strokeWidth={strokeWidth}
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke={isComplete ? 'hsl(var(--success))' : category.color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  
                  {/* Percentage in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xl font-bold ${isComplete ? 'text-success' : ''}`}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>

                {/* Category info */}
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-sm truncate max-w-[100px]">
                    {category.name}
                  </span>
                </div>

                {/* Time info */}
                <div className="text-xs text-muted-foreground text-center">
                  {formatHoursMinutes(current)} / {formatHoursMinutes(targetSeconds)}
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mt-2 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteGoal(goal.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
