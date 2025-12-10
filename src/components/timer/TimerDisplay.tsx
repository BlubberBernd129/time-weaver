import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Clock, Pause, RotateCcw, Coffee, Zap } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

interface TimerDisplayProps {
  categories: Category[];
  subcategories: Subcategory[];
  timerState: TimerState | null;
  onStart: (categoryId: string, subcategoryId: string, pomodoroMode?: boolean) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onUpdateStartTime: (newStartTime: Date) => void;
  onSwitchPomodoroPhase: () => void;
  onUpdatePomodoroElapsed: (elapsed: number) => void;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
}

export function TimerDisplay({
  categories,
  subcategories,
  timerState,
  onStart,
  onStop,
  onPause,
  onResume,
  onUpdateStartTime,
  onSwitchPomodoroPhase,
  onUpdatePomodoroElapsed,
  getSubcategoriesForCategory,
}: TimerDisplayProps) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const [pomodoroElapsed, setPomodoroElapsed] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (timerState?.isRunning && timerState.startTime && !timerState.isPaused) {
      const interval = setInterval(() => {
        const now = new Date();
        const totalTime = Math.floor((now.getTime() - timerState.startTime!.getTime()) / 1000);
        const activeTime = totalTime - timerState.totalPausedTime;
        setElapsed(activeTime);

        // Pomodoro tracking
        if (timerState.pomodoroMode) {
          const newPomodoroElapsed = timerState.pomodoroElapsed + 1;
          setPomodoroElapsed(newPomodoroElapsed);
          
          const phaseDuration = timerState.pomodoroPhase === 'work' 
            ? timerState.pomodoroWorkDuration 
            : timerState.pomodoroBreakDuration;
          
          if (newPomodoroElapsed >= phaseDuration) {
            // Play sound or notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(timerState.pomodoroPhase === 'work' ? 'Pause machen!' : 'Weiter arbeiten!');
            }
            onSwitchPomodoroPhase();
            setPomodoroElapsed(0);
          } else {
            onUpdatePomodoroElapsed(newPomodoroElapsed);
          }
        }
      }, 1000);

      // Initial calculation
      const now = new Date();
      const totalTime = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
      const activeTime = totalTime - timerState.totalPausedTime;
      setElapsed(activeTime);
      setPomodoroElapsed(timerState.pomodoroElapsed || 0);

      return () => clearInterval(interval);
    } else if (timerState?.isPaused) {
      // Keep elapsed time frozen during pause
      const now = new Date();
      const totalTime = Math.floor((now.getTime() - timerState.startTime!.getTime()) / 1000);
      const pauseTime = timerState.pauseStartTime 
        ? Math.floor((now.getTime() - timerState.pauseStartTime.getTime()) / 1000)
        : 0;
      const activeTime = totalTime - timerState.totalPausedTime - pauseTime;
      setElapsed(activeTime);
    } else {
      setElapsed(0);
      setPomodoroElapsed(0);
    }
  }, [timerState, onSwitchPomodoroPhase, onUpdatePomodoroElapsed]);

  const availableSubcategories = selectedCategory 
    ? getSubcategoriesForCategory(selectedCategory)
    : [];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory('');
  };

  const handleStart = () => {
    if (selectedCategory && selectedSubcategory) {
      onStart(selectedCategory, selectedSubcategory, pomodoroEnabled);
    }
  };

  const handleStop = () => {
    onStop();
    setSelectedCategory('');
    setSelectedSubcategory('');
  };

  const isRunning = timerState?.isRunning;
  const isPaused = timerState?.isPaused;
  const currentCategory = isRunning 
    ? categories.find(c => c.id === timerState?.categoryId)
    : null;
  const currentSubcategory = isRunning
    ? subcategories.find(s => s.id === timerState?.subcategoryId)
    : null;

  // Pomodoro progress
  const pomodoroProgress = timerState?.pomodoroMode 
    ? (pomodoroElapsed / (timerState.pomodoroPhase === 'work' ? timerState.pomodoroWorkDuration : timerState.pomodoroBreakDuration)) * 100
    : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Timer</h2>
        </div>
        {!isRunning && (
          <div className="flex items-center gap-2">
            <Switch 
              id="pomodoro" 
              checked={pomodoroEnabled}
              onCheckedChange={setPomodoroEnabled}
            />
            <Label htmlFor="pomodoro" className="text-sm flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Pomodoro
            </Label>
          </div>
        )}
      </div>

      {/* Pomodoro Phase Indicator */}
      {isRunning && timerState?.pomodoroMode && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {timerState.pomodoroPhase === 'work' ? (
                <Zap className="w-4 h-4 text-primary" />
              ) : (
                <Coffee className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-sm font-medium">
                {timerState.pomodoroPhase === 'work' ? 'Arbeitszeit' : 'Pause'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDuration(
                (timerState.pomodoroPhase === 'work' ? timerState.pomodoroWorkDuration : timerState.pomodoroBreakDuration) - pomodoroElapsed
              )}
            </span>
          </div>
          <Progress 
            value={pomodoroProgress} 
            className="h-2"
            style={{
              '--progress-background': timerState.pomodoroPhase === 'work' ? 'hsl(var(--primary))' : 'hsl(45, 93%, 47%)',
            } as React.CSSProperties}
          />
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div 
          className={cn(
            "timer-display text-5xl font-bold mb-2 transition-colors duration-300",
            isRunning && !isPaused ? "text-success" : isPaused ? "text-amber-500" : "text-muted-foreground"
          )}
        >
          {formatDuration(elapsed)}
        </div>
        {isPaused && (
          <div className="text-amber-500 text-sm font-medium animate-pulse mb-2">
            ⏸ PAUSIERT
          </div>
        )}
        {isRunning && currentCategory && currentSubcategory && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-3 h-3 rounded-full",
                  !isPaused && "animate-pulse"
                )}
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
            {timerState?.totalPausedTime > 0 && (
              <div className="text-xs text-amber-500/80">
                Pausiert: {formatDuration(timerState.totalPausedTime + (isPaused && timerState.pauseStartTime ? Math.floor((Date.now() - timerState.pauseStartTime.getTime()) / 1000) : 0))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {!isRunning ? (
        <div className="space-y-4">
          {pomodoroEnabled && (
            <div className="text-center text-sm text-muted-foreground p-3 bg-secondary/30 rounded-lg">
              <Zap className="w-4 h-4 inline mr-1" />
              Pomodoro: 25 Min Arbeit → 5 Min Pause
            </div>
          )}
          
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {!isPaused ? (
              <Button
                variant="outline"
                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                size="lg"
                onClick={onPause}
              >
                <Pause className="w-5 h-5" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-success/50 text-success hover:bg-success/10"
                size="lg"
                onClick={onResume}
              >
                <RotateCcw className="w-5 h-5" />
                Fortsetzen
              </Button>
            )}
            <Button
              variant="destructive"
              className="w-full"
              size="lg"
              onClick={handleStop}
            >
              <Square className="w-5 h-5" />
              Stoppen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
