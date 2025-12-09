import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getTodayStats, calculateWeeklyStats } from '@/lib/timeUtils';

interface QuickStatsProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
}

export function QuickStats({ timeEntries, categories, subcategories }: QuickStatsProps) {
  const todayStats = getTodayStats(timeEntries, categories, subcategories);
  const weeklyStats = calculateWeeklyStats(timeEntries, categories, subcategories, new Date());

  const stats = [
    {
      label: 'Heute',
      value: formatHoursMinutes(todayStats.totalTime),
      sublabel: todayStats.topCategory ? `Top: ${todayStats.topCategory}` : 'Keine Einträge',
      icon: Clock,
      color: 'text-primary',
    },
    {
      label: 'Diese Woche',
      value: formatHoursMinutes(weeklyStats.totalTime),
      sublabel: `${weeklyStats.byCategory.length} Kategorien`,
      icon: Calendar,
      color: 'text-accent',
    },
    {
      label: 'Einträge heute',
      value: todayStats.entriesCount.toString(),
      sublabel: 'Zeitblöcke',
      icon: TrendingUp,
      color: 'text-success',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="stat-card animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
          </div>
        );
      })}
    </div>
  );
}
