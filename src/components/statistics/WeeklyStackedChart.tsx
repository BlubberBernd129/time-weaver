import { formatHoursMinutes } from '@/lib/timeUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

interface CategoryStat {
  categoryId: string;
  categoryName: string;
  color: string;
  totalTime: number;
  percentage: number;
}

interface WeeklyStackedChartProps {
  categoryStats: CategoryStat[];
  totalTime: number;
}

export function WeeklyStackedChart({ categoryStats, totalTime }: WeeklyStackedChartProps) {
  if (categoryStats.length === 0) {
    return null;
  }

  // Create stacked data
  const stackedData = [{
    name: 'Woche',
    ...categoryStats.reduce((acc, cat) => ({
      ...acc,
      [cat.categoryId]: cat.totalTime / 3600, // Convert to hours
    }), {}),
  }];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-sm">
          {payload.map((entry: any) => {
            const cat = categoryStats.find(c => c.categoryId === entry.dataKey);
            if (!cat) return null;
            return (
              <div key={entry.dataKey} className="flex items-center gap-2 py-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.categoryName}:</span>
                <span className="font-mono font-medium">{formatHoursMinutes(cat.totalTime)}</span>
                <span className="text-muted-foreground">({cat.percentage}%)</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-4 lg:p-6">
      <h3 className="font-semibold text-lg mb-4">Verteilung nach Kategorien</h3>
      
      {/* Horizontal Stacked Bar */}
      <div className="h-16 rounded-xl overflow-hidden flex">
        {categoryStats.map((cat, index) => (
          <div
            key={cat.categoryId}
            className="h-full flex items-center justify-center text-xs font-medium transition-all duration-500"
            style={{
              width: `${cat.percentage}%`,
              backgroundColor: cat.color,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
            title={`${cat.categoryName}: ${formatHoursMinutes(cat.totalTime)} (${cat.percentage}%)`}
          >
            {cat.percentage >= 10 && (
              <span className="truncate px-2">
                {cat.percentage}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {categoryStats.map(cat => (
          <div key={cat.categoryId} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-muted-foreground">{cat.categoryName}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
