import { useState, useEffect } from 'react';
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

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes like weekly goals

export function QuickStats({ 
  timeEntries, 
  categories, 
  subcategories, 
  timerState,
  onTodayClick,
  onWeekClick,
}: QuickStatsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Calculate running timer duration
  const getRunningTimerDuration = (): number => {
    if (!timerState?.isRunning || !timerState.startTime) return 0;
    
    // Calculate total paused time
    let pausedTime = 0;
    if (timerState.pausePeriods) {
      timerState.pausePeriods.forEach(pause => {
        if (pause.startTime && pause.endTime) {
          pausedTime += (new Date(pause.endTime).getTime() - new Date(pause.startTime).getTime()) / 1000;
        }
      });
    }
    
    // If currently paused, add time since pause started
    if (timerState.isPaused && timerState.pauseStartTime) {
      pausedTime += (Date.now() - new Date(timerState.pauseStartTime).getTime()) / 1000;
    }
    
    const elapsed = (Date.now() - new Date(timerState.startTime).getTime()) / 1000;
    return Math.max(0, elapsed - pausedTime);
  };

  // Filter active entries (no pauses)
  const activeEntries = timeEntries.filter(e => !e.isPause);
  const today = new Date();
  
  // Today stats with running timer
  const todayEntries = getEntriesForDay(activeEntries, today);
  const todayCompletedTime = todayEntries.reduce((acc, e) => acc + e.duration, 0);
  const runningDuration = getRunningTimerDuration();
  const todayTotalTime = todayCompletedTime + runningDuration;
  
  // Get top category for today
  const categoryTimes = new Map<string, number>();
  todayEntries.forEach(entry => {
    const current = categoryTimes.get(entry.categoryId) || 0;
    categoryTimes.set(entry.categoryId, current + entry.duration);
  });
  // Add running timer category
  if (timerState?.isRunning && timerState.categoryId) {
    const current = categoryTimes.get(timerState.categoryId) || 0;
    categoryTimes.set(timerState.categoryId, current + runningDuration);
  }
  let topCategory: string | null = null;
  let maxTime = 0;
  categoryTimes.forEach((time, catId) => {
    if (time > maxTime) {
      maxTime = time;
      topCategory = categories.find(c => c.id === catId)?.name || null;
    }
  });

  // Week stats with running timer
  const weekEntries = getEntriesForWeek(activeEntries, today);
  const weekCompletedTime = weekEntries.reduce((acc, e) => acc + e.duration, 0);
  const weekTotalTime = weekCompletedTime + runningDuration;
  
  // Count unique categories this week
  const weekCategoryIds = new Set(weekEntries.map(e => e.categoryId));
  if (timerState?.isRunning && timerState.categoryId) {
    weekCategoryIds.add(timerState.categoryId);
  }

  const stats = [
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
      sublabel: `${weekCategoryIds.size} Kategorien`,
      icon: Calendar,
      color: 'text-accent',
      onClick: onWeekClick,
      clickable: true,
    },
    {
      label: 'Einträge heute',
      value: (todayEntries.length + (timerState?.isRunning ? 1 : 0)).toString(),
      sublabel: 'Zeitblöcke',
      icon: TrendingUp,
      color: 'text-success',
      clickable: false,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 lg:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={`${index}-${refreshKey}`}
            className={`stat-card animate-fade-in p-3 lg:p-4 ${
              stat.clickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all' : ''
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
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
