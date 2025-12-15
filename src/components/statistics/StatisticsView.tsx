import { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { addWeeks, subWeeks, addMonths, subMonths, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { calculateWeeklyStats, calculateMonthlyStats, formatHoursMinutes, formatMonthYear, getWeekDays } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';
import { CategoryPieChart } from './CategoryPieChart';
import { ExportDialog } from './ExportDialog';
import { WeekComparison } from './WeekComparison';
import { TrendAnalysis } from './TrendAnalysis';

interface StatisticsViewProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
}

type StatsPeriod = 'week' | 'month';

export function StatisticsView({
  timeEntries,
  categories,
  subcategories,
}: StatisticsViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filter out pause entries for statistics
  const activeEntries = timeEntries.filter(e => !e.isPause);

  const handlePrevious = () => {
    if (period === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (period === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const weeklyStats = calculateWeeklyStats(activeEntries, categories, subcategories, currentDate);
  const monthlyStats = calculateMonthlyStats(activeEntries, categories, subcategories, currentDate);

  const stats = period === 'week' ? weeklyStats : monthlyStats;
  const weekDays = getWeekDays(currentDate);

  const maxTime = Math.max(...stats.byCategory.map(c => c.totalTime), 1);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">Statistik</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <ExportDialog
            timeEntries={activeEntries}
            categories={categories}
            subcategories={subcategories}
          />
          <Tabs value={period} onValueChange={(v) => setPeriod(v as StatsPeriod)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="week">Woche</TabsTrigger>
              <TabsTrigger value="month">Monat</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {period === 'week'
            ? `${format(weekDays[0], 'dd.MM.')} - ${format(weekDays[6], 'dd.MM.yyyy', { locale: de })}`
            : formatMonthYear(currentDate)
          }
        </h2>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Total Time Card */}
      <div className="glass-card p-4 lg:p-6 text-center">
        <div className="text-xs lg:text-sm text-muted-foreground mb-2">
          Gesamtzeit {period === 'week' ? 'diese Woche' : 'diesen Monat'}
        </div>
        <div className="text-2xl lg:text-4xl font-bold gradient-text">
          {formatHoursMinutes(stats.totalTime)}
        </div>
        <div className="text-xs lg:text-sm text-muted-foreground mt-2">
          {stats.byCategory.length} Kategorien aktiv
        </div>
      </div>

      {/* Week Comparison */}
      <WeekComparison timeEntries={activeEntries} categories={categories} />

      {/* Trend Analysis */}
      <TrendAnalysis timeEntries={activeEntries} categories={categories} />

      {/* Pie Chart */}
      <CategoryPieChart stats={stats} />

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Nach Kategorien</h3>

        {stats.byCategory.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">
              Keine Zeiteinträge für diesen Zeitraum vorhanden.
            </p>
          </div>
        ) : (
          stats.byCategory.map((catStats, index) => {
            const isExpanded = expandedCategories.has(catStats.categoryId);
            const percentage = Math.round((catStats.totalTime / stats.totalTime) * 100);

            return (
              <div
                key={catStats.categoryId}
                className="glass-card overflow-hidden animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => toggleExpanded(catStats.categoryId)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-md"
                        style={{ backgroundColor: catStats.color }}
                      />
                      <span className="font-medium">{catStats.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">
                        {formatHoursMinutes(catStats.totalTime)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({percentage}%)
                      </span>
                      {period === 'week' && 'subcategories' in catStats && catStats.subcategories.length > 0 && (
                        isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>

                  <Progress
                    value={(catStats.totalTime / maxTime) * 100}
                    className="h-2"
                    style={{
                      // @ts-ignore - CSS variable
                      '--progress-background': catStats.color,
                    } as React.CSSProperties}
                  />
                </div>

                {/* Subcategories */}
                {isExpanded && period === 'week' && 'subcategories' in catStats && catStats.subcategories.length > 0 && (
                  <div className="border-t border-border px-4 py-3 bg-secondary/20 space-y-2">
                    {catStats.subcategories.map((subStats) => {
                      const subPercentage = Math.round((subStats.totalTime / catStats.totalTime) * 100);
                      
                      return (
                        <div
                          key={subStats.subcategoryId}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-sm text-muted-foreground">
                            {subStats.subcategoryName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {formatHoursMinutes(subStats.totalTime)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({subPercentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Weekly Breakdown for Month View */}
      {period === 'month' && monthlyStats.weeklyBreakdown.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-base lg:text-lg">Wochenübersicht</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {monthlyStats.weeklyBreakdown.map((week, index) => (
              <div
                key={index}
                className="glass-card p-3 lg:p-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-xs lg:text-sm text-muted-foreground mb-2">
                  {format(week.weekStart, 'dd.MM.')} - {format(week.weekEnd, 'dd.MM.')}
                </div>
                <div className="text-lg lg:text-xl font-bold">
                  {formatHoursMinutes(week.totalTime)}
                </div>
                <div className="flex gap-1 mt-2">
                  {week.byCategory.slice(0, 4).map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="h-2 rounded-full flex-1"
                      style={{ 
                        backgroundColor: cat.color,
                        opacity: 0.8,
                      }}
                      title={`${cat.categoryName}: ${formatHoursMinutes(cat.totalTime)}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
