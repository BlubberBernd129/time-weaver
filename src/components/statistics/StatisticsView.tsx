import { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3, Calendar } from 'lucide-react';
import { addWeeks, subWeeks, format, startOfWeek, endOfWeek, getWeek, getDay, eachWeekOfInterval, subWeeks as subWeeksDate, isSameWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, getEntriesForWeek } from '@/lib/timeUtils';
import { ExportDialog } from './ExportDialog';
import { WeekBenchmark } from './WeekBenchmark';
import { WeeklyStackedChart } from './WeeklyStackedChart';
import { WeeklyAreaChart } from './WeeklyAreaChart';
import { ManualWeekComparison } from './ManualWeekComparison';

interface StatisticsViewProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
}

export function StatisticsView({
  timeEntries,
  categories,
  subcategories,
}: StatisticsViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter out pause entries for statistics
  const activeEntries = timeEntries.filter(e => !e.isPause);

  const handlePrevious = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
  
  // Check if current week is ongoing (today is within this week)
  const today = new Date();
  const isCurrentWeek = isSameWeek(currentDate, today, { weekStartsOn: 1 });
  const currentDayOfWeek = getDay(today) === 0 ? 7 : getDay(today); // 1-7 (Mo-So)
  
  // Get weekday name for "Stand Dienstag" display
  const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const currentWeekdayName = weekdayNames[today.getDay()];

  // Get entries for selected week
  const weekEntries = getEntriesForWeek(activeEntries, currentDate);
  const totalTime = weekEntries.reduce((acc, e) => acc + e.duration, 0);

  // Calculate by main category only
  const categoryStats = categories.map(cat => {
    const catEntries = weekEntries.filter(e => e.categoryId === cat.id);
    const catTime = catEntries.reduce((acc, e) => acc + e.duration, 0);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      totalTime: catTime,
      percentage: totalTime > 0 ? Math.round((catTime / totalTime) * 100) : 0
    };
  }).filter(c => c.totalTime > 0).sort((a, b) => b.totalTime - a.totalTime);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">Statistik</h1>
        </div>

        <ExportDialog
          timeEntries={activeEntries}
          categories={categories}
          subcategories={subcategories}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            KW {weekNumber} • {format(weekStart, 'dd.MM.')} - {format(weekEnd, 'dd.MM.yyyy', { locale: de })}
          </h2>
          {isCurrentWeek && (
            <p className="text-sm text-muted-foreground">
              Stand {currentWeekdayName}
            </p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Total Time Card with Benchmark */}
      <WeekBenchmark
        currentWeekTime={totalTime}
        timeEntries={activeEntries}
        currentDate={currentDate}
        isCurrentWeek={isCurrentWeek}
        currentDayOfWeek={currentDayOfWeek}
      />

      {/* Stacked Bar Chart - Categories */}
      <WeeklyStackedChart
        categoryStats={categoryStats}
        totalTime={totalTime}
      />

      {/* Area Chart - Weekly Trend */}
      <WeeklyAreaChart
        timeEntries={activeEntries}
        categories={categories}
        currentDate={currentDate}
      />

      {/* Manual KW Comparison */}
      <ManualWeekComparison
        timeEntries={activeEntries}
        categories={categories}
      />

      {/* Category Breakdown - Only Main Categories */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Hauptkategorien</h3>

        {categoryStats.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground">
              Keine Zeiteinträge für diese Woche vorhanden.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {categoryStats.map((catStats, index) => (
              <div
                key={catStats.categoryId}
                className="glass-card p-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
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
                      ({catStats.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Full-color bar */}
                <div className="h-3 rounded-full overflow-hidden bg-secondary/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${catStats.percentage}%`,
                      backgroundColor: catStats.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
