import { useState, useEffect } from 'react';
import { format, isSameDay, startOfDay, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { Category, Subcategory, TimeEntry, TimerState } from '@/types/timetracker';
import { cn } from '@/lib/utils';

interface DayTimelineProps {
  timeEntries: TimeEntry[];
  timerState: TimerState | null;
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

const HOUR_HEIGHT = 80; // pixels per hour
const START_HOUR = 6; // Start at 6:00
const END_HOUR = 23; // End at 23:00
const TOTAL_HOURS = END_HOUR - START_HOUR;

export function DayTimeline({
  timeEntries,
  timerState,
  getCategoryById,
  getSubcategoryById,
}: DayTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const today = new Date();

  // Update current time every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter entries for today
  const todayEntries = timeEntries.filter(entry =>
    isSameDay(new Date(entry.startTime), today)
  );

  // Calculate position and height for an entry
  const getEntryStyle = (startTime: Date, endTime: Date | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : currentTime;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();

    const topOffset = Math.max(0, startMinutes - START_HOUR * 60);
    const duration = Math.max(5, endMinutes - startMinutes); // Minimum 5 minutes height

    const top = (topOffset / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT;

    return { top, height: Math.max(height, 20) }; // Minimum 20px height
  };

  // Current time indicator position
  const currentTimePosition = () => {
    const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const offset = minutes - START_HOUR * 60;
    return (offset / 60) * HOUR_HEIGHT;
  };

  // Generate hour labels
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Heute</h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {format(today, 'EEEE, dd. MMMM', { locale: de })}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto relative pr-1 scrollbar-thin scrollbar-track-secondary scrollbar-thumb-primary/50 hover:scrollbar-thumb-primary">
        <div
          className="relative"
          style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
        >
          {/* Hour lines and labels */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full flex items-start"
              style={{ top: `${(hour - START_HOUR) * HOUR_HEIGHT}px` }}
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
                {format(currentTime, 'HH:mm:ss')}
              </span>
            </div>
          )}

          {/* Time entries */}
          {todayEntries.map((entry) => {
            const category = getCategoryById(entry.categoryId);
            const subcategory = getSubcategoryById(entry.subcategoryId);
            const { top, height } = getEntryStyle(new Date(entry.startTime), entry.endTime ? new Date(entry.endTime) : null);

            return (
              <div
                key={entry.id}
                className={cn(
                  "absolute left-14 right-2 rounded-md px-2 py-1 overflow-hidden transition-all duration-300",
                  entry.isRunning && "animate-pulse"
                )}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: `${category?.color}30`,
                  borderLeft: `3px solid ${category?.color}`,
                }}
              >
                <div className="text-xs font-medium truncate">{subcategory?.name}</div>
                {height > 30 && (
                  <div className="text-[10px] text-muted-foreground">
                    {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : 'läuft'}
                  </div>
                )}
              </div>
            );
          })}

          {/* Active timer block */}
          {timerState?.isRunning && timerState.startTime && isSameDay(new Date(timerState.startTime), today) && (
            <div
              className="absolute left-14 right-2 rounded-md px-2 py-1 overflow-hidden border-2 border-dashed animate-pulse"
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
          )}
        </div>
      </div>
    </div>
  );
}
