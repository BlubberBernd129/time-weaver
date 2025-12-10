import { TrendingUp, TrendingDown } from 'lucide-react';
import { Category, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes } from '@/lib/timeUtils';
import { format, startOfWeek, endOfWeek, subWeeks, eachWeekOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface TrendAnalysisProps {
  timeEntries: TimeEntry[];
  categories: Category[];
}

export function TrendAnalysis({ timeEntries, categories }: TrendAnalysisProps) {
  // Get last 8 weeks of data
  const today = new Date();
  const eightWeeksAgo = subWeeks(today, 7);

  const weeks = eachWeekOfInterval(
    { start: eightWeeksAgo, end: today },
    { weekStartsOn: 1 }
  );

  // Filter out pause entries
  const activeEntries = timeEntries.filter(e => !e.isPause);

  const weeklyData = weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const weekEntries = activeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const totalHours = weekEntries.reduce((acc, e) => acc + e.duration, 0) / 3600;

    const byCategory: Record<string, number> = {};
    categories.forEach(cat => {
      byCategory[cat.id] = weekEntries
        .filter(e => e.categoryId === cat.id)
        .reduce((acc, e) => acc + e.duration, 0) / 3600;
    });

    return {
      week: format(weekStart, 'dd.MM', { locale: de }),
      weekFull: `${format(weekStart, 'dd.MM', { locale: de })} - ${format(weekEnd, 'dd.MM', { locale: de })}`,
      total: Math.round(totalHours * 10) / 10,
      ...byCategory,
    };
  });

  // Calculate trend
  const recentWeeks = weeklyData.slice(-4);
  const olderWeeks = weeklyData.slice(0, 4);
  
  const recentAvg = recentWeeks.reduce((acc, w) => acc + w.total, 0) / recentWeeks.length;
  const olderAvg = olderWeeks.reduce((acc, w) => acc + w.total, 0) / olderWeeks.length;
  
  const trendDirection = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable';
  const trendPercentage = olderAvg > 0 
    ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
    : 0;

  // Get active categories (those with any time in the period)
  const activeCategories = categories.filter(cat => 
    weeklyData.some(week => (week[cat.id] as number) > 0)
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium mb-2">{payload[0]?.payload?.weekFull}</p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono">{entry.value.toFixed(1)}h</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Trend (8 Wochen)</h3>
        <div className={`flex items-center gap-1 text-sm ${
          trendDirection === 'up' ? 'text-success' : 
          trendDirection === 'down' ? 'text-amber-500' : 
          'text-muted-foreground'
        }`}>
          {trendDirection === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : trendDirection === 'down' ? (
            <TrendingDown className="w-4 h-4" />
          ) : null}
          <span>
            {trendPercentage > 0 ? '+' : ''}{trendPercentage}% vs. Vorperiode
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <div className="text-sm text-muted-foreground">Durchschnitt</div>
          <div className="text-xl font-bold">
            {formatHoursMinutes(Math.round(recentAvg * 3600))}
          </div>
          <div className="text-xs text-muted-foreground">pro Woche</div>
        </div>
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <div className="text-sm text-muted-foreground">Maximum</div>
          <div className="text-xl font-bold">
            {formatHoursMinutes(Math.max(...weeklyData.map(w => w.total)) * 3600)}
          </div>
        </div>
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <div className="text-sm text-muted-foreground">Minimum</div>
          <div className="text-xl font-bold">
            {formatHoursMinutes(Math.min(...weeklyData.map(w => w.total)) * 3600)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="week" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `${value}h`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              name="Gesamt"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            {activeCategories.slice(0, 4).map(cat => (
              <Line
                key={cat.id}
                type="monotone"
                dataKey={cat.id}
                name={cat.name}
                stroke={cat.color}
                strokeWidth={1.5}
                dot={{ fill: cat.color, r: 3 }}
                strokeDasharray="5 5"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
