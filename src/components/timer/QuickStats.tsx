import { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getTodayStats, calculateWeeklyStats } from '@/lib/timeUtils';

interface QuickStatsProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  onTodayClick?: () => void;
}

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds for more responsive updates

export function QuickStats({ timeEntries, categories, subcategories, onTodayClick }: QuickStatsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const todayStats = getTodayStats(timeEntries, categories, subcategories);
  const weeklyStats = calculateWeeklyStats(timeEntries, categories, subcategories, new Date());

  const stats = [
    {
      label: 'Heute',
      value: formatHoursMinutes(todayStats.totalTime),
      sublabel: todayStats.topCategory ? `Top: ${todayStats.topCategory}` : 'Keine Einträge',
      icon: Clock,
      color: 'text-primary',
      onClick: onTodayClick,
      clickable: true,
    },
    {
      label: 'Diese Woche',
      value: formatHoursMinutes(weeklyStats.totalTime),
      sublabel: `${weeklyStats.byCategory.length} Kategorien`,
      icon: Calendar,
      color: 'text-accent',
      clickable: false,
    },
    {
      label: 'Einträge heute',
      value: todayStats.entriesCount.toString(),
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
