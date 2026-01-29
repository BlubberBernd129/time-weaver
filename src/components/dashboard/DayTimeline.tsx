import { useState, useEffect, useRef, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Trash2, GripVertical } from 'lucide-react';
import { Category, Subcategory, TimeEntry, TimerState, PausePeriod } from '@/types/timetracker';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DayTimelineProps {
  timeEntries: TimeEntry[];
  timerState: TimerState | null;
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  onUpdateTimerPauses?: (pausePeriods: PausePeriod[]) => void;
}

const HOUR_HEIGHT = 80; // pixels per hour
const START_HOUR = 6; // Start at 6:00
const END_HOUR = 23; // End at 23:00
const TOTAL_HOURS = END_HOUR - START_HOUR;
const TOP_PADDING = HOUR_HEIGHT / 4;

export function DayTimeline({
  timeEntries,
  timerState,
  getCategoryById,
  getSubcategoryById,
  onUpdateTimerPauses,
}: DayTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPause, setSelectedPause] = useState<{ index: number; pause: PausePeriod } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const today = new Date();
  const lastTimeRef = useRef<string>('');

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = format(now, 'HH:mm:ss');
      if (timeStr !== lastTimeRef.current) {
        lastTimeRef.current = timeStr;
        setCurrentTime(now);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter entries for today - exclude running entries
  const todayEntries = timeEntries.filter(entry =>
    isSameDay(new Date(entry.startTime), today) && !entry.isRunning
  );

  // Calculate position and height for an entry
  const getEntryStyle = (startTime: Date, endTime: Date | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    const topOffset = Math.max(0, startMinutes - START_HOUR * 60);
    const duration = Math.max(5, endMinutes - startMinutes);

    const top = (topOffset / 60) * HOUR_HEIGHT + TOP_PADDING;
    const height = (duration / 60) * HOUR_HEIGHT;

    return { top, height: Math.max(height, 20) };
  };

  // Get pause segment position within a running timer block
  const getPauseStyle = (pause: PausePeriod, timerStartTime: Date) => {
    const pauseStart = new Date(pause.startTime);
    const pauseEnd = pause.endTime ? new Date(pause.endTime) : currentTime;
    
    const timerStart = new Date(timerStartTime);
    
    // Calculate relative positions within the timer block
    const timerStartMinutes = timerStart.getHours() * 60 + timerStart.getMinutes();
    const pauseStartMinutes = pauseStart.getHours() * 60 + pauseStart.getMinutes();
    const pauseEndMinutes = pauseEnd.getHours() * 60 + pauseEnd.getMinutes();
    
    // Get total timer duration and pause offsets
    const timerTopOffset = Math.max(0, timerStartMinutes - START_HOUR * 60);
    const pauseTopOffset = Math.max(0, pauseStartMinutes - START_HOUR * 60);
    const pauseDuration = Math.max(2, pauseEndMinutes - pauseStartMinutes);
    
    const top = (pauseTopOffset / 60) * HOUR_HEIGHT + TOP_PADDING;
    const height = (pauseDuration / 60) * HOUR_HEIGHT;
    
    return { top, height: Math.max(height, 10) };
  };

  // Current time indicator position
  const currentTimePosition = () => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const offset = minutes - START_HOUR * 60;
    return (offset / 60) * HOUR_HEIGHT + TOP_PADDING;
  };

  // Generate hour labels
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  const formattedDate = format(today, 'EEEE, dd. MMMM', { locale: de });

  // Handle pause click for editing
  const handlePauseClick = (index: number, pause: PausePeriod) => {
    setSelectedPause({ index, pause });
    setEditDialogOpen(true);
  };

  // Handle pause delete
  const handleDeletePause = () => {
    if (selectedPause && timerState?.pausePeriods && onUpdateTimerPauses) {
      const newPauses = timerState.pausePeriods.filter((_, i) => i !== selectedPause.index);
      onUpdateTimerPauses(newPauses);
      setEditDialogOpen(false);
      setSelectedPause(null);
    }
  };

  // Handle pause time update
  const handleUpdatePause = (startTime: string, endTime: string) => {
    if (selectedPause && timerState?.pausePeriods && onUpdateTimerPauses && timerState.startTime) {
      const baseDate = new Date(timerState.startTime);
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const newStart = new Date(baseDate);
      newStart.setHours(startH, startM, 0, 0);
      
      const newEnd = new Date(baseDate);
      newEnd.setHours(endH, endM, 0, 0);
      
      const newPauses = [...timerState.pausePeriods];
      newPauses[selectedPause.index] = {
        startTime: newStart,
        endTime: newEnd,
      };
      
      onUpdateTimerPauses(newPauses);
      setEditDialogOpen(false);
      setSelectedPause(null);
    }
  };

  // Check if timer is running today
  const isTimerRunningToday = timerState?.isRunning && timerState.startTime && 
    isSameDay(new Date(timerState.startTime), today);

  return (
    <div className="glass-card p-4 h-full flex flex-col backdrop-blur-xl">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Heute</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {formattedDate}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto relative pr-1 scrollbar-thin">
        <div
          className="relative"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT + TOP_PADDING * 2}px` }}
        >
          {/* Hour lines and labels */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start"
              style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT + TOP_PADDING}px` }}
            >
              <span className="text-xs text-muted-foreground w-12 flex-shrink-0 -mt-2">
                {hour.toString().padStart(2, '0')}:00
              </span>
              <div className="flex-1 border-t border-border/30" />
            </div>
          ))}

          {/* Current time indicator */}
          {currentTime.getHours() >= START_HOUR && currentTime.getHours() <= END_HOUR && (
            <div
              className="absolute left-12 right-0 flex items-center z-20 pointer-events-none"
              style={{ top: `${currentTimePosition()}px` }}
            >
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="flex-1 h-0.5 bg-primary/70" />
              <span className="text-xs font-mono text-primary ml-2">
                {lastTimeRef.current || format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
          )}

          {/* Completed time entries */}
          {todayEntries.map((entry) => {
            const category = getCategoryById(entry.categoryId);
            const subcategory = getSubcategoryById(entry.subcategoryId);
            const { top, height } = getEntryStyle(new Date(entry.startTime), entry.endTime ? new Date(entry.endTime) : null);

            return (
              <div
                key={entry.id}
                className="absolute left-14 right-2 rounded-md px-2 py-1 overflow-hidden transition-colors duration-300"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: category?.color || 'hsl(var(--muted))',
                }}
              >
                <div className="text-xs font-medium text-white truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  {subcategory?.name}
                </div>
                {height > 30 && (
                  <div className="text-[10px] text-white/80" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
                    {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : 'läuft'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Active timer block with pause segments */}
          {isTimerRunningToday && timerState.startTime && (
            <>
              {/* Main timer block */}
              <div
                className="absolute left-14 right-2 rounded-md px-2 py-1 overflow-hidden border-2 border-dashed transition-all"
                style={{
                  top: `${getEntryStyle(new Date(timerState.startTime), null).top}px`,
                  height: `${getEntryStyle(new Date(timerState.startTime), null).height}px`,
                  backgroundColor: `${getCategoryById(timerState.categoryId!)?.color}40`,
                  borderColor: getCategoryById(timerState.categoryId!)?.color,
                }}
              >
                <div className="text-xs font-medium truncate">
                  {getSubcategoryById(timerState.subcategoryId!)?.name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {format(new Date(timerState.startTime), 'HH:mm')} - jetzt
                </div>
              </div>

              {/* Pause segments overlay - clickable for editing */}
              {timerState.pausePeriods?.map((pause, index) => {
                const pauseStyle = getPauseStyle(pause, timerState.startTime!);
                const isCurrentPause = timerState.isPaused && index === timerState.pausePeriods.length - 1;
                
                return (
                  <div
                    key={index}
                    className={cn(
                      "absolute left-14 right-2 rounded-md cursor-pointer transition-all hover:brightness-110",
                      "flex items-center justify-center",
                      isCurrentPause && "animate-pulse"
                    )}
                    style={{
                      top: `${pauseStyle.top}px`,
                      height: `${pauseStyle.height}px`,
                      backgroundColor: 'hsl(var(--warning) / 0.6)',
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 8px)',
                    }}
                    onClick={() => handlePauseClick(index, pause)}
                    title="Klicken zum Bearbeiten"
                  >
                    {pauseStyle.height > 20 && (
                      <span className="text-[10px] font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                        Pause {formatDuration(
                          Math.floor(((pause.endTime ? new Date(pause.endTime) : currentTime).getTime() - new Date(pause.startTime).getTime()) / 1000)
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Pause Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Pause bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedPause && (
            <PauseEditForm
              pause={selectedPause.pause}
              onSave={handleUpdatePause}
              onDelete={handleDeletePause}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PauseEditFormProps {
  pause: PausePeriod;
  onSave: (startTime: string, endTime: string) => void;
  onDelete: () => void;
  onCancel: () => void;
}

function PauseEditForm({ pause, onSave, onDelete, onCancel }: PauseEditFormProps) {
  const [startTime, setStartTime] = useState(format(new Date(pause.startTime), 'HH:mm'));
  const [endTime, setEndTime] = useState(pause.endTime ? format(new Date(pause.endTime), 'HH:mm') : format(new Date(), 'HH:mm'));

  const duration = useMemo(() => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return durationMinutes > 0 ? durationMinutes : 0;
  }, [startTime, endTime]);

  return (
    <div className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pause-start">Start</Label>
          <Input
            id="pause-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="font-mono"
          />
        </div>
        <div>
          <Label htmlFor="pause-end">Ende</Label>
          <Input
            id="pause-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        Dauer: <span className="font-mono font-medium">{duration} Minuten</span>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button 
          variant="destructive" 
          size="icon"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button className="flex-1" onClick={() => onSave(startTime, endTime)}>
          Speichern
        </Button>
      </div>
    </div>
  );
}
