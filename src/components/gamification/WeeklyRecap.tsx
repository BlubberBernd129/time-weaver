import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, getWeek, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Clock, Trophy, TrendingUp, TrendingDown, Minus, BarChart3, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category, TimeEntry } from '@/types/timetracker';
import { getEntriesForWeek, formatHoursMinutes, formatWeekdayShort } from '@/lib/timeUtils';

interface WeeklyRecapProps {
  timeEntries: TimeEntry[];
  categories: Category[];
}

export function WeeklyRecap({ timeEntries, categories }: WeeklyRecapProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
  const year = currentDate.getFullYear();
  
  // Filter out pauses
  const activeEntries = useMemo(() => timeEntries.filter(e => !e.isPause), [timeEntries]);
  
  // Get entries for current and previous week
  const currentWeekEntries = useMemo(() => getEntriesForWeek(activeEntries, currentDate), [activeEntries, currentDate]);
  const previousWeekEntries = useMemo(() => getEntriesForWeek(activeEntries, subWeeks(currentDate, 1)), [activeEntries, currentDate]);
  
  // Calculate totals
  const currentTotal = currentWeekEntries.reduce((acc, e) => acc + e.duration, 0);
  const previousTotal = previousWeekEntries.reduce((acc, e) => acc + e.duration, 0);
  const diffSeconds = currentTotal - previousTotal;
  const diffPercent = previousTotal > 0 ? Math.round((diffSeconds / previousTotal) * 100) : 0;
  
  // Category breakdown for current week
  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catEntries = currentWeekEntries.filter(e => e.categoryId === cat.id);
      const catTime = catEntries.reduce((acc, e) => acc + e.duration, 0);
      const prevCatEntries = previousWeekEntries.filter(e => e.categoryId === cat.id);
      const prevCatTime = prevCatEntries.reduce((acc, e) => acc + e.duration, 0);
      const diff = catTime - prevCatTime;
      
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        color: cat.color,
        totalTime: catTime,
        previousTime: prevCatTime,
        diff,
        percentage: currentTotal > 0 ? Math.round((catTime / currentTotal) * 100) : 0
      };
    }).filter(c => c.totalTime > 0 || c.previousTime > 0).sort((a, b) => b.totalTime - a.totalTime);
  }, [currentWeekEntries, previousWeekEntries, categories, currentTotal]);
  
  // Daily breakdown
  const dailyStats = useMemo(() => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    return days.map(day => {
      const dayEntries = currentWeekEntries.filter(e => isSameDay(new Date(e.startTime), day));
      const total = dayEntries.reduce((acc, e) => acc + e.duration, 0);
      return {
        date: day,
        total,
        entriesCount: dayEntries.length
      };
    });
  }, [currentWeekEntries, weekStart, weekEnd]);
  
  // Find best/worst day
  const maxDay = dailyStats.reduce((max, day) => day.total > max.total ? day : max, dailyStats[0]);
  const minDay = dailyStats.filter(d => d.total > 0).reduce((min, day) => day.total < min.total ? day : min, dailyStats[0]);
  
  // Streak (consecutive days with entries)
  const streak = useMemo(() => {
    let count = 0;
    for (let i = dailyStats.length - 1; i >= 0; i--) {
      if (dailyStats[i].total > 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [dailyStats]);

  const handlePrevious = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNext = () => setCurrentDate(date => {
    const next = new Date(date);
    next.setDate(next.getDate() + 7);
    return next;
  });

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">Wochenrückblick</h1>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            KW {weekNumber} • {year}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, 'dd.MM.')} - {format(weekEnd, 'dd.MM.yyyy', { locale: de })}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Time */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Gesamtzeit</p>
                <p className="text-4xl font-bold text-primary">{formatHoursMinutes(currentTotal)}</p>
              </div>
              <Clock className="w-8 h-8 text-primary/50" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              {diffSeconds > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : diffSeconds < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={diffSeconds > 0 ? 'text-green-500' : diffSeconds < 0 ? 'text-red-500' : 'text-muted-foreground'}>
                {diffSeconds > 0 ? '+' : ''}{formatHoursMinutes(Math.abs(diffSeconds))} vs. Vorwoche
                {diffPercent !== 0 && ` (${diffPercent > 0 ? '+' : ''}${diffPercent}%)`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Entries Count */}
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Einträge</p>
                <p className="text-4xl font-bold text-secondary">{currentWeekEntries.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-secondary/50" />
            </div>
            <div className="mt-4">
              <span className="text-muted-foreground">
                Ø {dailyStats.filter(d => d.entriesCount > 0).length > 0 
                  ? Math.round(currentWeekEntries.length / dailyStats.filter(d => d.entriesCount > 0).length) 
                  : 0} pro Tag
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Streak</p>
                <p className="text-4xl font-bold text-orange-500">{streak} Tage</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500/50" />
            </div>
            <div className="mt-4">
              <span className="text-muted-foreground">
                In Folge gearbeitet
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Tagesübersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-40">
            {dailyStats.map((day, idx) => {
              const maxTotal = Math.max(...dailyStats.map(d => d.total), 1);
              const heightPercent = (day.total / maxTotal) * 100;
              const isMax = day === maxDay && day.total > 0;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full flex items-end justify-center h-28">
                    <div
                      className={`w-full max-w-12 rounded-t-lg transition-all duration-500 ${
                        isMax ? 'bg-gradient-to-t from-primary to-primary/60' : 'bg-secondary/50'
                      }`}
                      style={{ height: `${Math.max(heightPercent, day.total > 0 ? 10 : 0)}%` }}
                    >
                      {isMax && (
                        <Star className="w-4 h-4 text-primary-foreground absolute -top-5 left-1/2 -translate-x-1/2" />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatWeekdayShort(day.date)}
                  </span>
                  <span className="text-xs font-medium">
                    {day.total > 0 ? formatHoursMinutes(day.total) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-secondary" />
            Kategorien
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Keine Einträge für diese Woche
            </p>
          ) : (
            <div className="space-y-4">
              {categoryStats.map((cat, idx) => (
                <div key={cat.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-md"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium">{cat.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{formatHoursMinutes(cat.totalTime)}</span>
                      <span className="text-sm text-muted-foreground">({cat.percentage}%)</span>
                      {cat.diff !== 0 && (
                        <span className={`text-xs flex items-center gap-1 ${cat.diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {cat.diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {cat.diff > 0 ? '+' : ''}{formatHoursMinutes(Math.abs(cat.diff))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bester Tag</p>
                <p className="font-semibold">
                  {maxDay && maxDay.total > 0 
                    ? `${format(maxDay.date, 'EEEE', { locale: de })} - ${formatHoursMinutes(maxDay.total)}`
                    : 'Keine Daten'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Durchschnitt pro Tag</p>
                <p className="font-semibold">
                  {dailyStats.filter(d => d.total > 0).length > 0
                    ? formatHoursMinutes(Math.round(currentTotal / dailyStats.filter(d => d.total > 0).length))
                    : '0m'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
