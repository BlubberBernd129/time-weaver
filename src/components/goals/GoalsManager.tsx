import { useState } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Category, Goal, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForDay, getEntriesForWeek } from '@/lib/timeUtils';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface GoalsManagerProps {
  categories: Category[];
  goals: Goal[];
  timeEntries: TimeEntry[];
  onAddGoal: (categoryId: string, type: 'daily' | 'weekly', targetMinutes: number) => void;
  onDeleteGoal: (id: string) => void;
}

export function GoalsManager({
  categories,
  goals,
  timeEntries,
  onAddGoal,
  onDeleteGoal,
}: GoalsManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [goalType, setGoalType] = useState<'daily' | 'weekly'>('daily');
  const [targetHours, setTargetHours] = useState('');

  const today = new Date();

  // Filter out pause entries
  const activeEntries = timeEntries.filter(e => !e.isPause);

  const handleAddGoal = () => {
    if (!selectedCategory || !targetHours) return;
    
    const minutes = parseFloat(targetHours) * 60;
    onAddGoal(selectedCategory, goalType, minutes);
    
    setDialogOpen(false);
    setSelectedCategory('');
    setTargetHours('');
  };

  const calculateProgress = (goal: Goal): { current: number; percentage: number } => {
    const entries = goal.type === 'daily'
      ? getEntriesForDay(activeEntries, today)
      : getEntriesForWeek(activeEntries, today);
    
    const categoryEntries = entries.filter(e => e.categoryId === goal.categoryId);
    const totalSeconds = categoryEntries.reduce((acc, e) => acc + e.duration, 0);
    const currentMinutes = totalSeconds / 60;
    const percentage = Math.min((currentMinutes / goal.targetMinutes) * 100, 100);
    
    return { current: totalSeconds, percentage };
  };

  const dailyGoals = goals.filter(g => g.type === 'daily');
  const weeklyGoals = goals.filter(g => g.type === 'weekly');

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const category = categories.find(c => c.id === goal.categoryId);
    if (!category) return null;

    const { current, percentage } = calculateProgress(goal);
    const targetSeconds = goal.targetMinutes * 60;

    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="font-medium">{category.name}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDeleteGoal(goal.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatHoursMinutes(current)} / {formatHoursMinutes(targetSeconds)}
            </span>
            <span className={percentage >= 100 ? 'text-success font-medium' : 'text-muted-foreground'}>
              {Math.round(percentage)}%
            </span>
          </div>
          <Progress 
            value={percentage} 
            className="h-2"
            style={{
              '--progress-background': percentage >= 100 ? 'hsl(var(--success))' : category.color,
            } as React.CSSProperties}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Ziele</h2>
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
              <DialogTitle>Neues Ziel erstellen</DialogTitle>
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
                <label className="text-sm font-medium mb-2 block">Zeitraum</label>
                <Select value={goalType} onValueChange={(v) => setGoalType(v as 'daily' | 'weekly')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ziel (Stunden)</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={targetHours}
                  onChange={(e) => setTargetHours(e.target.value)}
                  placeholder="z.B. 2"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleAddGoal}
                disabled={!selectedCategory || !targetHours}
              >
                Ziel erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="daily">Täglich</TabsTrigger>
          <TabsTrigger value="weekly">Wöchentlich</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-3">
          {dailyGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine täglichen Ziele definiert
            </p>
          ) : (
            dailyGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-3">
          {weeklyGoals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine wöchentlichen Ziele definiert
            </p>
          ) : (
            weeklyGoals.map(goal => <GoalCard key={goal.id} goal={goal} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
