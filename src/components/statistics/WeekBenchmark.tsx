import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForWeek } from '@/lib/timeUtils';
import { startOfWeek, subWeeks, getDay, isBefore, eachDayOfInterval, startOfDay, isSameDay } from 'date-fns';

interface WeekBenchmarkProps {
  currentWeekTime: number;
  timeEntries: TimeEntry[];
  currentDate: Date;
  isCurrentWeek: boolean;
  currentDayOfWeek: number; // 1-7 (Mo-So)
}

export function WeekBenchmark({
  currentWeekTime,
  timeEntries,
  currentDate,
  isCurrentWeek,
  currentDayOfWeek,
}: WeekBenchmarkProps) {
  // Calculate historical average up to same weekday
  const calculateHistoricalAverage = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weeksToAnalyze = 8;
    let totalTime = 0;
    let weekCount = 0;

    for (let i = 1; i <= weeksToAnalyze; i++) {
      const pastWeekStart = subWeeks(weekStart, i);
      const pastWeekEntries = getEntriesForWeek(timeEntries, pastWeekStart);
      
      if (isCurrentWeek) {
        // For current week comparison: only count time up to same weekday
        const daysToInclude = currentDayOfWeek;
        const relevantEntries = pastWeekEntries.filter(entry => {
          const entryDay = getDay(new Date(entry.startTime));
          const adjustedDay = entryDay === 0 ? 7 : entryDay;
          return adjustedDay <= daysToInclude;
        });
        totalTime += relevantEntries.reduce((acc, e) => acc + e.duration, 0);
      } else {
        // For past weeks: count full week
        totalTime += pastWeekEntries.reduce((acc, e) => acc + e.duration, 0);
      }
      
      if (pastWeekEntries.length > 0) {
        weekCount++;
      }
    }

    return weekCount > 0 ? totalTime / weekCount : 0;
  };

  const historicalAverage = calculateHistoricalAverage();
  const difference = currentWeekTime - historicalAverage;
  const percentageChange = historicalAverage > 0 
    ? Math.round((difference / historicalAverage) * 100) 
    : currentWeekTime > 0 ? 100 : 0;

  const getTrendIcon = () => {
    if (difference > 0) return <TrendingUp className="w-5 h-5 text-success" />;
    if (difference < 0) return <TrendingDown className="w-5 h-5 text-amber-500" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (difference > 0) return 'text-success';
    if (difference < 0) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="glass-card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {isCurrentWeek ? 'Laufende Woche (bis heute)' : 'Wochenzeit'}
          </span>
        </div>
        {getTrendIcon()}
      </div>

      <div className="text-center space-y-2">
        <div className="text-3xl lg:text-4xl font-bold gradient-text">
          {formatHoursMinutes(currentWeekTime)}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Benchmark:</span>
          <span className="font-mono">{formatHoursMinutes(historicalAverage)}</span>
        </div>

        <div className={`flex items-center justify-center gap-2 ${getTrendColor()}`}>
          <span className="font-medium">
            {difference > 0 ? '+' : ''}{formatHoursMinutes(Math.abs(difference))}
          </span>
          <span className="text-sm">
            ({percentageChange > 0 ? '+' : ''}{percentageChange}%)
          </span>
        </div>

        {isCurrentWeek && historicalAverage > 0 && (
          <p className="text-xs text-muted-foreground pt-2">
            Vergleich mit Durchschnitt der letzten 8 Wochen (gleicher Wochentag)
          </p>
        )}
      </div>
    </div>
  );
}
