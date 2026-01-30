import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Minus, ArrowLeftRight } from 'lucide-react';
import { Category, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForWeek } from '@/lib/timeUtils';
import { startOfWeek, subWeeks, getWeek, format, eachWeekOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface ManualWeekComparisonProps {
  timeEntries: TimeEntry[];
  categories: Category[];
}

export function ManualWeekComparison({ timeEntries, categories }: ManualWeekComparisonProps) {
  const today = new Date();
  
  // Generate list of available weeks (last 12 weeks)
  const availableWeeks = useMemo(() => {
    const weeks: { value: string; label: string; weekStart: Date }[] = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 1 });
      const weekNum = getWeek(weekStart, { weekStartsOn: 1 });
      weeks.push({
        value: weekStart.toISOString(),
        label: `KW ${weekNum} (${format(weekStart, 'dd.MM.', { locale: de })})`,
        weekStart,
      });
    }
    return weeks;
  }, []);

  const [week1, setWeek1] = useState(availableWeeks[0]?.value || '');
  const [week2, setWeek2] = useState(availableWeeks[1]?.value || '');

  // Calculate stats for each week
  const getWeekStats = (weekStart: Date) => {
    const entries = getEntriesForWeek(timeEntries, weekStart);
    const total = entries.reduce((acc, e) => acc + e.duration, 0);
    
    const byCategory = categories.map(cat => {
      const catTime = entries
        .filter(e => e.categoryId === cat.id)
        .reduce((acc, e) => acc + e.duration, 0);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        color: cat.color,
        time: catTime,
      };
    }).filter(c => c.time > 0);

    return { total, byCategory };
  };

  // Calculate overall average (all weeks)
  const overallAverage = useMemo(() => {
    let totalTime = 0;
    let weekCount = 0;
    
    availableWeeks.forEach(week => {
      const entries = getEntriesForWeek(timeEntries, week.weekStart);
      const weekTotal = entries.reduce((acc, e) => acc + e.duration, 0);
      if (weekTotal > 0) {
        totalTime += weekTotal;
        weekCount++;
      }
    });
    
    return weekCount > 0 ? totalTime / weekCount : 0;
  }, [timeEntries, availableWeeks]);

  const week1Stats = week1 ? getWeekStats(new Date(week1)) : null;
  const week2Stats = week2 ? getWeekStats(new Date(week2)) : null;

  const week1Label = availableWeeks.find(w => w.value === week1)?.label || '';
  const week2Label = availableWeeks.find(w => w.value === week2)?.label || '';

  // Create comparison chart data
  const chartData = useMemo(() => {
    if (!week1Stats || !week2Stats) return [];

    const allCategories = new Set([
      ...week1Stats.byCategory.map(c => c.categoryId),
      ...week2Stats.byCategory.map(c => c.categoryId),
    ]);

    return Array.from(allCategories).map(catId => {
      const cat = categories.find(c => c.id === catId);
      const w1 = week1Stats.byCategory.find(c => c.categoryId === catId)?.time || 0;
      const w2 = week2Stats.byCategory.find(c => c.categoryId === catId)?.time || 0;
      
      return {
        name: cat?.name || 'Unbekannt',
        color: cat?.color || '#666',
        [week1Label]: w1 / 3600,
        [week2Label]: w2 / 3600,
      };
    }).sort((a, b) => (b[week1Label] as number) - (a[week1Label] as number));
  }, [week1Stats, week2Stats, week1Label, week2Label, categories]);

  const ChangeIndicator = ({ value, baseline }: { value: number; baseline: number }) => {
    const diff = value - baseline;
    const pct = baseline > 0 ? Math.round((diff / baseline) * 100) : value > 0 ? 100 : 0;
    
    if (diff > 0) {
      return (
        <div className="flex items-center gap-1 text-success text-sm">
          <ArrowUp className="w-3 h-3" />
          <span>+{pct}%</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center gap-1 text-amber-500 text-sm">
          <ArrowDown className="w-3 h-3" />
          <span>{pct}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-muted-foreground text-sm">
        <Minus className="w-3 h-3" />
        <span>0%</span>
      </div>
    );
  };

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
              <span className="text-muted-foreground">{entry.dataKey}:</span>
              <span className="font-mono">{entry.value.toFixed(1)}h</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">KW-Vergleich</h3>
      </div>

      {/* Week Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Woche 1</label>
          <Select value={week1} onValueChange={setWeek1}>
            <SelectTrigger className="bg-secondary">
              <SelectValue placeholder="Woche wählen" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map(week => (
                <SelectItem key={week.value} value={week.value}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Woche 2</label>
          <Select value={week2} onValueChange={setWeek2}>
            <SelectTrigger className="bg-secondary">
              <SelectValue placeholder="Woche wählen" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map(week => (
                <SelectItem key={week.value} value={week.value}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Comparison Cards */}
      {week1Stats && week2Stats && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">{week1Label}</div>
              <div className="text-xl font-bold">{formatHoursMinutes(week1Stats.total)}</div>
              <ChangeIndicator value={week1Stats.total} baseline={overallAverage} />
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">{week2Label}</div>
              <div className="text-xl font-bold">{formatHoursMinutes(week2Stats.total)}</div>
              <ChangeIndicator value={week2Stats.total} baseline={overallAverage} />
            </div>
            <div className="bg-primary/10 rounded-lg p-4 text-center border border-primary/30">
              <div className="text-xs text-muted-foreground mb-1">Ø Durchschnitt</div>
              <div className="text-xl font-bold text-primary">{formatHoursMinutes(overallAverage)}</div>
              <div className="text-xs text-muted-foreground">12 Wochen</div>
            </div>
          </div>

          {/* Grouped Bar Chart */}
          {chartData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey={week1Label} 
                    fill="hsl(217, 91%, 60%)"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar 
                    dataKey={week2Label} 
                    fill="hsl(142, 71%, 45%)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
