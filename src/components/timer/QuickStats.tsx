import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { Category, Subcategory, TimeEntry, TimerState } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForDay, getEntriesForWeek } from '@/lib/timeUtils';

interface QuickStatsProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  timerState: TimerState | null;
  onTodayClick?: () => void;
  onWeekClick?: () => void;
}

const REFRESH_INTERVAL = 60 * 1000; // 1 minute for live timer updates

export function QuickStats({ 
  timeEntries, 
  categories, 
  subcategories, 
  timerState,
  onTodayClick,
  onWeekClick,
}: QuickStatsProps) {
  const [now, setNow] = useState(() => Date.now());

  // Update every minute for running timer display
  useEffect(() => {
    if (!timerState?.isRunning) return;
    
    const interval = setInterval(() => {
      setNow(Date.now());
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [timerState?.isRunning]);

  // Calculate running timer duration - memoized
  const runningDuration = useMemo(() => {
    if (!timerState?.isRunning || !timerState.startTime) return 0;
    
    let pausedTime = 0;
    if (timerState.pausePeriods) {
      timerState.pausePeriods.forEach(pause => {
        if (pause.startTime && pause.endTime) {
          pausedTime += (new Date(pause.endTime).getTime() - new Date(pause.startTime).getTime()) / 1000;
        }
      });
    }
    
    if (timerState.isPaused && timerState.pauseStartTime) {
      pausedTime += (now - new Date(timerState.pauseStartTime).getTime()) / 1000;
    }
    
    const elapsed = (now - new Date(timerState.startTime).getTime()) / 1000;
    return Math.max(0, elapsed - pausedTime);
  }, [timerState, now]);

  // Filter active entries (no pauses) - memoized
  const activeEntries = useMemo(() => 
    timeEntries.filter(e => !e.isPause), 
    [timeEntries]
  );

  const today = useMemo(() => new Date(), []);
  
  // Today stats - memoized
  const { todayTotalTime, topCategory, todayCount } = useMemo(() => {
    const todayEntries = getEntriesForDay(activeEntries, today);
    const completedTime = todayEntries.reduce((acc, e) => acc + e.duration, 0);
    const totalTime = completedTime + runningDuration;
    
    const categoryTimes = new Map<string, number>();
    todayEntries.forEach(entry => {
      const current = categoryTimes.get(entry.categoryId) || 0;
      categoryTimes.set(entry.categoryId, current + entry.duration);
    });
    if (timerState?.isRunning && timerState.categoryId) {
      const current = categoryTimes.get(timerState.categoryId) || 0;
      categoryTimes.set(timerState.categoryId, current + runningDuration);
    }
    
    let topCat: string | null = null;
    let maxTime = 0;
    categoryTimes.forEach((time, catId) => {
      if (time > maxTime) {
        maxTime = time;
        topCat = categories.find(c => c.id === catId)?.name || null;
      }
    });

    return { 
      todayTotalTime: totalTime, 
      topCategory: topCat,
      todayCount: todayEntries.length + (timerState?.isRunning ? 1 : 0)
    };
  }, [activeEntries, today, runningDuration, timerState, categories]);

  // Week stats - memoized
  const { weekTotalTime, weekCategoryCount } = useMemo(() => {
    const weekEntries = getEntriesForWeek(activeEntries, today);
    const completedTime = weekEntries.reduce((acc, e) => acc + e.duration, 0);
    const totalTime = completedTime + runningDuration;
    
    const categoryIds = new Set(weekEntries.map(e => e.categoryId));
    if (timerState?.isRunning && timerState.categoryId) {
      categoryIds.add(timerState.categoryId);
    }

    return { weekTotalTime: totalTime, weekCategoryCount: categoryIds.size };
  }, [activeEntries, today, runningDuration, timerState]);

  const stats = useMemo(() => [
    {
      label: 'Heute',
      value: formatHoursMinutes(todayTotalTime),
      sublabel: topCategory ? `Top: ${topCategory}` : 'Keine Einträge',
      icon: Clock,
      color: 'text-primary',
      onClick: onTodayClick,
      clickable: true,
    },
    {
      label: 'Diese Woche',
      value: formatHoursMinutes(weekTotalTime),
      sublabel: `${weekCategoryCount} Kategorien`,
      icon: Calendar,
      color: 'text-accent',
      onClick: onWeekClick,
      clickable: true,
    },
    {
      label: 'Einträge heute',
      value: todayCount.toString(),
      sublabel: 'Zeitblöcke',
      icon: TrendingUp,
      color: 'text-success',
      clickable: false,
    },
  ], [todayTotalTime, topCategory, weekTotalTime, weekCategoryCount, todayCount, onTodayClick, onWeekClick]);

  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`stat-card p-3 lg:p-4 ${
              stat.clickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all' : ''
            }`}
            onClick={stat.onClick}
          >
            <div className="flex items-start justify-between mb-2 lg:mb-3">
              <span className="text-[10px] lg:text-sm text-muted-foreground">{stat.label}</span>
              <Icon className={`w-4 lg:w-5 h-4 lg:h-5 ${stat.color}`} />
            </div>
            <div className="text-lg lg:text-2xl font-bold mb-0.5 lg:mb-1">{stat.value}</div>
            <div className="text-[10px] lg:text-xs text-muted-foreground truncate">{stat.sublabel}</div>
          </div>
        );
      })}
    </div>
  );
}