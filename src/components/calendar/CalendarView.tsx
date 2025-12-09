import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category, Subcategory, TimeEntry, CalendarView as CalendarViewType } from '@/types/timetracker';
import { formatTime, formatDuration, formatMonthYear, getWeekDays, formatWeekdayShort } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

export function CalendarView({
  timeEntries,
  categories,
  subcategories,
  getCategoryById,
  getSubcategoryById,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewType>('week');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handlePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const filteredEntries = filterCategory === 'all'
    ? timeEntries
    : timeEntries.filter(e => e.categoryId === filterCategory);

  const getEntriesForDay = (date: Date) => {
    return filteredEntries.filter(entry => 
      isSameDay(new Date(entry.startTime), date)
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const weekDays = getWeekDays(currentDate);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Kalender</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] bg-secondary border-border">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as CalendarViewType)}>
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
          {viewMode === 'week' 
            ? `${format(weekDays[0], 'dd.MM.')} - ${format(weekDays[6], 'dd.MM.yyyy', { locale: de })}`
            : formatMonthYear(currentDate)
          }
        </h2>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'week' ? (
        <WeekView 
          days={weekDays}
          getEntriesForDay={getEntriesForDay}
          getCategoryById={getCategoryById}
          getSubcategoryById={getSubcategoryById}
        />
      ) : (
        <MonthView
          days={calendarDays}
          currentMonth={currentDate}
          getEntriesForDay={getEntriesForDay}
          getCategoryById={getCategoryById}
        />
      )}
    </div>
  );
}

interface WeekViewProps {
  days: Date[];
  getEntriesForDay: (date: Date) => TimeEntry[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

function WeekView({ days, getEntriesForDay, getCategoryById, getSubcategoryById }: WeekViewProps) {
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-3">
      {days.map((day) => {
        const entries = getEntriesForDay(day);
        const isToday = isSameDay(day, today);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "glass-card p-3 min-h-[300px] flex flex-col",
              isToday && "ring-2 ring-primary"
            )}
          >
            <div className="text-center mb-3 pb-2 border-b border-border">
              <div className="text-xs text-muted-foreground uppercase">
                {formatWeekdayShort(day)}
              </div>
              <div className={cn(
                "text-lg font-semibold",
                isToday && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Keine Einträge
                </p>
              ) : (
                entries.map((entry) => {
                  const category = getCategoryById(entry.categoryId);
                  const subcategory = getSubcategoryById(entry.subcategoryId);

                  return (
                    <div
                      key={entry.id}
                      className="time-block p-2 text-xs"
                      style={{ 
                        backgroundColor: `${category?.color}15`,
                        borderLeftColor: category?.color,
                        borderLeftWidth: '3px',
                      }}
                    >
                      <div className="font-medium truncate">{subcategory?.name}</div>
                      <div className="text-muted-foreground">
                        {formatTime(new Date(entry.startTime))} - {entry.endTime && formatTime(new Date(entry.endTime))}
                      </div>
                      <div className="font-mono mt-1">
                        {formatDuration(entry.duration)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MonthViewProps {
  days: Date[];
  currentMonth: Date;
  getEntriesForDay: (date: Date) => TimeEntry[];
  getCategoryById: (id: string) => Category | undefined;
}

function MonthView({ days, currentMonth, getEntriesForDay, getCategoryById }: MonthViewProps) {
  const today = new Date();
  const weekDayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDayNames.map((name) => (
          <div key={name} className="text-center text-xs text-muted-foreground font-medium py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const entries = getEntriesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const totalDuration = entries.reduce((acc, e) => acc + e.duration, 0);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-2 rounded-lg border border-border/50 transition-colors",
                !isCurrentMonth && "opacity-40",
                isToday && "ring-2 ring-primary",
                "hover:bg-secondary/30"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-2",
                isToday && "text-primary"
              )}>
                {format(day, 'd')}
              </div>

              {entries.length > 0 && (
                <div className="space-y-1">
                  {entries.slice(0, 3).map((entry) => {
                    const category = getCategoryById(entry.categoryId);
                    return (
                      <div
                        key={entry.id}
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: category?.color }}
                      />
                    );
                  })}
                  {entries.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{entries.length - 3} mehr
                    </div>
                  )}
                  {totalDuration > 0 && (
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">
                      {formatDuration(totalDuration)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
