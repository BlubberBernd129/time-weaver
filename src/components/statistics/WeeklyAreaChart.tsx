import { Category, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes } from '@/lib/timeUtils';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface WeeklyAreaChartProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  currentDate: Date;
}

export function WeeklyAreaChart({ timeEntries, categories, currentDate }: WeeklyAreaChartProps) {
  // Get last 8 weeks of data
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const weekDate = subWeeks(currentDate, 7 - i);
    return startOfWeek(weekDate, { weekStartsOn: 1 });
  });

  // Build data for area chart
  const chartData = weeks.map(weekStart => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const weekEntries = timeEntries.filter(entry => {
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
      week: `KW ${format(weekStart, 'w')}`,
      weekLabel: format(weekStart, 'dd.MM', { locale: de }),
      total: Math.round(totalHours * 10) / 10,
      ...byCategory,
    };
  });

  // Get active categories (those with any time in the period)
  const activeCategories = categories.filter(cat => 
    chartData.some(week => (week[cat.id] as number) > 0)
  ).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          <p className="font-medium mb-2">{label}</p>
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

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-4 lg:p-6 space-y-4">
      <h3 className="font-semibold text-lg">Wochenverlauf (8 Wochen)</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {activeCategories.map((cat, index) => (
                <linearGradient key={cat.id} id={`gradient-${cat.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cat.color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={cat.color} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
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
            {activeCategories.map((cat, index) => (
              <Area
                key={cat.id}
                type="monotone"
                dataKey={cat.id}
                name={cat.name}
                stroke={cat.color}
                fill={`url(#gradient-${cat.id})`}
                strokeWidth={2}
                stackId="1"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
