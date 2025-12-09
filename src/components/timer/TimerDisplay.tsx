import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, Subcategory, TimerState } from '@/types/timetracker';
import { formatDuration, formatTime } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditTimerStartDialog } from './EditTimerStartDialog';

interface TimerDisplayProps {
  categories: Category[];
  subcategories: Subcategory[];
  timerState: TimerState | null;
  onStart: (categoryId: string, subcategoryId: string) => void;
  onStop: () => void;
  onUpdateStartTime: (newStartTime: Date) => void;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
}

export function TimerDisplay({
  categories,
  subcategories,
  timerState,
  onStart,
  onStop,
  onUpdateStartTime,
  getSubcategoriesForCategory,
}: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // Calculate elapsed time
  useEffect(() => {
    if (timerState?.isRunning && timerState.startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - timerState.startTime!.getTime()) / 1000);
        setElapsed(diff);
      }, 1000);

      // Initial calculation
      const now = new Date();
      const diff = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
      setElapsed(diff);

      return () => clearInterval(interval);
    } else {
      setElapsed(0);
    }
  }, [timerState]);

  const availableSubcategories = selectedCategory 
    ? getSubcategoriesForCategory(selectedCategory)
    : [];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory('');
  };

  const handleStart = () => {
    if (selectedCategory && selectedSubcategory) {
      onStart(selectedCategory, selectedSubcategory);
    }
  };

  const handleStop = () => {
    onStop();
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  const isRunning = timerState?.isRunning;
  const currentCategory = isRunning 
    ? categories.find(c => c.id === timerState?.categoryId)
    : null;
  const currentSubcategory = isRunning
    ? subcategories.find(s => s.id === timerState?.subcategoryId)
    : null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Timer</h2>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div 
          className={cn(
            "timer-display text-5xl font-bold mb-2 transition-colors duration-300",
            isRunning ? "text-success" : "text-muted-foreground"
          )}
        >
          {formatDuration(elapsed)}
        </div>
        {isRunning && currentCategory && currentSubcategory && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: currentCategory.color }}
              />
              <span className="text-sm text-muted-foreground">
                {currentCategory.name} → {currentSubcategory.name}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Gestartet: {timerState?.startTime && formatTime(timerState.startTime)}</span>
              <EditTimerStartDialog timerState={timerState!} onUpdateStartTime={onUpdateStartTime} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {!isRunning ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Kategorie" />
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

            <Select 
              value={selectedSubcategory} 
              onValueChange={setSelectedSubcategory}
              disabled={!selectedCategory}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Unterkategorie" />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!selectedCategory || !selectedSubcategory}
            onClick={handleStart}
          >
            <Play className="w-5 h-5" />
            Timer starten
          </Button>
        </div>
      ) : (
        <Button
          variant="destructive"
          className="w-full"
          size="lg"
          onClick={handleStop}
        >
          <Square className="w-5 h-5" />
          Timer stoppen
        </Button>
      )}
    </div>
  );
}
