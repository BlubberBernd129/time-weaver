import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Category, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForWeek } from '@/lib/timeUtils';
import { subWeeks } from 'date-fns';

interface WeekComparisonProps {
  timeEntries: TimeEntry[];
  categories: Category[];
}

export function WeekComparison({ timeEntries, categories }: WeekComparisonProps) {
  const today = new Date();
  const lastWeek = subWeeks(today, 1);

  // Filter out pause entries
  const activeEntries = timeEntries.filter(e => !e.isPause);

  const thisWeekEntries = getEntriesForWeek(activeEntries, today);
  const lastWeekEntries = getEntriesForWeek(activeEntries, lastWeek);

  const thisWeekTotal = thisWeekEntries.reduce((acc, e) => acc + e.duration, 0);
  const lastWeekTotal = lastWeekEntries.reduce((acc, e) => acc + e.duration, 0);

  const difference = thisWeekTotal - lastWeekTotal;
  const percentageChange = lastWeekTotal > 0 
    ? Math.round((difference / lastWeekTotal) * 100) 
    : thisWeekTotal > 0 ? 100 : 0;

  // Category comparison
  const categoryComparison = categories.map(cat => {
    const thisWeek = thisWeekEntries
      .filter(e => e.categoryId === cat.id)
      .reduce((acc, e) => acc + e.duration, 0);
    const lastWeekCat = lastWeekEntries
      .filter(e => e.categoryId === cat.id)
      .reduce((acc, e) => acc + e.duration, 0);
    
    const diff = thisWeek - lastWeekCat;
    const pctChange = lastWeekCat > 0 
      ? Math.round((diff / lastWeekCat) * 100) 
      : thisWeek > 0 ? 100 : 0;

    return {
      category: cat,
      thisWeek,
      lastWeek: lastWeekCat,
      difference: diff,
      percentageChange: pctChange,
    };
  }).filter(c => c.thisWeek > 0 || c.lastWeek > 0);

  const ChangeIndicator = ({ value, percentage }: { value: number; percentage: number }) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-success">
          <ArrowUp className="w-4 h-4" />
          <span>+{percentage}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <ArrowDown className="w-4 h-4" />
          <span>{percentage}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" />
        <span>0%</span>
      </div>
    );
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="font-semibold text-lg">Diese Woche vs. Letzte Woche</h3>

      {/* Total Comparison */}
      <div className="bg-secondary/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Gesamtzeit diese Woche</div>
            <div className="text-2xl font-bold">{formatHoursMinutes(thisWeekTotal)}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Letzte Woche</div>
            <div className="text-lg text-muted-foreground">{formatHoursMinutes(lastWeekTotal)}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Veränderung</span>
          <ChangeIndicator value={difference} percentage={percentageChange} />
        </div>
      </div>

      {/* Category Comparison */}
      {categoryComparison.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Nach Kategorien</h4>
          {categoryComparison.map(item => (
            <div 
              key={item.category.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.category.color }}
                />
                <span className="text-sm">{item.category.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono">
                  {formatHoursMinutes(item.thisWeek)}
                </span>
                <ChangeIndicator value={item.difference} percentage={item.percentageChange} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
