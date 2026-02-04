import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, format, getHours, getMinutes } from 'date-fns';
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
import { Category, Subcategory, TimeEntry, CalendarView as CalendarViewType, PausePeriod } from '@/types/timetracker';
import { formatTime, formatDuration, formatMonthYear, getWeekDays, formatWeekdayShort } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';
import { DraggableEntryCreator, DragHandle } from './DraggableEntryCreator';
import { EntryDetailDialog } from './EntryDetailDialog';

// 24-hour grid constants (0:00 - 24:00)
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 24 hours
const DEFAULT_SCROLL_HOUR = 7; // Scroll to 7:00 by default

interface CalendarViewProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  onAddEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ) => void;
  onUpdateEntry?: (id: string, updates: Partial<TimeEntry>) => void;
  onDeleteEntry?: (id: string) => void;
}

export function CalendarView({
  timeEntries,
  categories,
  subcategories,
  getCategoryById,
  getSubcategoryById,
  getSubcategoriesForCategory,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewType>('week');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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
    <div className="space-y-4 lg:space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">Kalender</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px] sm:w-[180px] bg-secondary border-border">
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

      {/* Drag Handle */}
      <DragHandle />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-sm lg:text-lg font-semibold text-center">
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
      <div className="flex-1 min-h-0">
        {viewMode === 'week' ? (
          <TimeScaledWeekView 
            days={weekDays}
            getEntriesForDay={getEntriesForDay}
            getCategoryById={getCategoryById}
            getSubcategoryById={getSubcategoryById}
            categories={categories}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            onAddEntry={onAddEntry}
            onEntryClick={(entry) => {
              setSelectedEntry(entry);
              setDetailDialogOpen(true);
            }}
          />
        ) : (
          <MonthView
            days={calendarDays}
            currentMonth={currentDate}
            getEntriesForDay={getEntriesForDay}
            getCategoryById={getCategoryById}
            getSubcategoryById={getSubcategoryById}
            categories={categories}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            onAddEntry={onAddEntry}
            onEntryClick={(entry) => {
              setSelectedEntry(entry);
              setDetailDialogOpen(true);
            }}
          />
        )}
      </div>

      {/* Entry Detail Dialog */}
      <EntryDetailDialog
        entry={selectedEntry}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        category={selectedEntry ? getCategoryById(selectedEntry.categoryId) : undefined}
        subcategory={selectedEntry ? getSubcategoryById(selectedEntry.subcategoryId) : undefined}
        onUpdate={(id, updates) => {
          onUpdateEntry?.(id, updates);
          setDetailDialogOpen(false);
        }}
        onDelete={onDeleteEntry}
      />
    </div>
  );
}

interface TimeScaledWeekViewProps {
  days: Date[];
  getEntriesForDay: (date: Date) => TimeEntry[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  categories: Category[];
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  onAddEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ) => void;
  onEntryClick: (entry: TimeEntry) => void;
}

function TimeScaledWeekView({ 
  days, 
  getEntriesForDay, 
  getCategoryById, 
  getSubcategoryById,
  categories,
  getSubcategoriesForCategory,
  onAddEntry,
  onEntryClick,
}: TimeScaledWeekViewProps) {
  const today = new Date();

  // Calculate position and height for entry (percentage of 16-hour grid)
  const getEntryStyle = (entry: TimeEntry) => {
    const start = new Date(entry.startTime);
    const end = entry.endTime ? new Date(entry.endTime) : new Date();
    
    const startHour = getHours(start) + getMinutes(start) / 60;
    const endHour = getHours(end) + getMinutes(end) / 60;
    
    // Clamp to grid bounds
    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, startHour));
    const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, endHour));
    
    const topPercent = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100;
    const heightPercent = ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100;
    
    return {
      top: `${topPercent}%`,
      height: `${Math.max(heightPercent, 2)}%`, // Minimum 2% height for visibility
    };
  };

  // Generate hour markers
  const hourMarkers = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Scroll to 7am on mount
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = (DEFAULT_SCROLL_HOUR / TOTAL_HOURS) * scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Calculate pause positions within an entry
  const getPauseStyle = (pause: PausePeriod, entryStart: Date) => {
    const pauseStart = new Date(pause.startTime);
    const pauseEnd = pause.endTime ? new Date(pause.endTime) : new Date();
    
    const pauseStartHour = getHours(pauseStart) + getMinutes(pauseStart) / 60;
    const pauseEndHour = getHours(pauseEnd) + getMinutes(pauseEnd) / 60;
    
    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR, pauseStartHour));
    const clampedEnd = Math.max(START_HOUR, Math.min(END_HOUR, pauseEndHour));
    
    const topPercent = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100;
    const heightPercent = ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100;
    
    return {
      top: `${topPercent}%`,
      height: `${Math.max(heightPercent, 1)}%`,
    };
  };

  return (
    <div className="glass-card p-2 lg:p-4 h-full flex flex-col">
      {/* Day Headers */}
      <div className="grid grid-cols-8 gap-1 lg:gap-2 mb-2 flex-shrink-0">
        {/* Time column header */}
        <div className="text-center text-xs text-muted-foreground py-2">Zeit</div>
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                "text-center py-2 rounded-lg",
                isToday && "bg-primary/20"
              )}
            >
              <div className="text-[10px] lg:text-xs text-muted-foreground uppercase">
                {formatWeekdayShort(day)}
              </div>
              <div className={cn(
                "text-sm lg:text-lg font-semibold",
                isToday && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden relative" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="grid grid-cols-8 gap-1 lg:gap-2 min-h-[1200px] lg:min-h-[1600px]">
          {/* Time Column */}
          <div className="relative">
            {hourMarkers.map((hour, index) => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-[10px] lg:text-xs text-muted-foreground -translate-y-1/2"
                style={{ top: `${(index / TOTAL_HOURS) * 100}%` }}
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {days.map((day) => {
            const entries = getEntriesForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <DraggableEntryCreator
                key={day.toISOString()}
                date={day}
                categories={categories}
                getSubcategoriesForCategory={getSubcategoriesForCategory}
                onAddEntry={onAddEntry}
              >
                <div
                  className={cn(
                    "relative h-full border-l border-border/30",
                    isToday && "bg-primary/5"
                  )}
                >
                  {/* Hour grid lines */}
                  {hourMarkers.map((hour, index) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-border/20"
                      style={{ top: `${(index / TOTAL_HOURS) * 100}%` }}
                    />
                  ))}

                  {/* Time entries - full category color with pause segments */}
                  {entries.map((entry) => {
                    const category = getCategoryById(entry.categoryId);
                    const subcategory = getSubcategoryById(entry.subcategoryId);
                    const style = getEntryStyle(entry);

                    return (
                      <div key={entry.id}>
                        {/* Main entry block */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntryClick(entry);
                          }}
                          className="absolute left-1 right-1 rounded-md px-1 py-0.5 overflow-hidden cursor-pointer hover:brightness-110 transition-all shadow-sm"
                          style={{
                            top: style.top,
                            height: style.height,
                            backgroundColor: category?.color || 'hsl(var(--muted))',
                          }}
                        >
                          <div className="text-[10px] lg:text-xs font-medium text-white truncate" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                            {subcategory?.name}
                          </div>
                          <div className="text-[8px] lg:text-[10px] text-white/80 truncate" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
                            {formatDuration(entry.duration)}
                          </div>
                        </div>
                        
                        {/* Pause segments overlay */}
                        {entry.pausePeriods?.map((pause, pauseIndex) => {
                          const pauseStyle = getPauseStyle(pause, new Date(entry.startTime));
                          return (
                            <div
                              key={`${entry.id}-pause-${pauseIndex}`}
                              className="absolute left-1 right-1 rounded-sm pointer-events-none"
                              style={{
                                top: pauseStyle.top,
                                height: pauseStyle.height,
                                backgroundColor: 'hsl(var(--warning) / 0.7)',
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </DraggableEntryCreator>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MonthViewProps {
  days: Date[];
  currentMonth: Date;
  getEntriesForDay: (date: Date) => TimeEntry[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  categories: Category[];
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  onAddEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ) => void;
  onEntryClick: (entry: TimeEntry) => void;
}

function MonthView({ 
  days, 
  currentMonth, 
  getEntriesForDay, 
  getCategoryById,
  getSubcategoryById,
  categories,
  getSubcategoriesForCategory,
  onAddEntry,
  onEntryClick,
}: MonthViewProps) {
  const today = new Date();
  const weekDayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="glass-card p-2 lg:p-4 h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 lg:gap-2 mb-2">
        {weekDayNames.map((name) => (
          <div key={name} className="text-center text-[10px] lg:text-xs text-muted-foreground font-medium py-1 lg:py-2">
            {name}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 lg:gap-2 flex-1">
        {days.map((day) => {
          const entries = getEntriesForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, today);
          const totalDuration = entries.reduce((acc, e) => acc + e.duration, 0);

          return (
            <DraggableEntryCreator
              key={day.toISOString()}
              date={day}
              categories={categories}
              getSubcategoriesForCategory={getSubcategoriesForCategory}
              onAddEntry={onAddEntry}
            >
              <div
                className={cn(
                  "min-h-[60px] lg:min-h-[100px] p-1 lg:p-2 rounded-lg border border-border/50 transition-colors",
                  !isCurrentMonth && "opacity-40",
                  isToday && "ring-2 ring-primary",
                  "hover:bg-secondary/30"
                )}
              >
                <div className={cn(
                  "text-xs lg:text-sm font-medium mb-1 lg:mb-2",
                  isToday && "text-primary"
                )}>
                  {format(day, 'd')}
                </div>

                {entries.length > 0 && (
                  <div className="space-y-0.5 lg:space-y-1">
                    {entries.slice(0, 2).map((entry) => {
                      const category = getCategoryById(entry.categoryId);
                      const subcategory = getSubcategoryById(entry.subcategoryId);
                      return (
                        <div
                          key={entry.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEntryClick(entry);
                          }}
                          className="h-4 lg:h-5 rounded px-1 flex items-center gap-1 cursor-pointer hover:brightness-110 transition-all"
                          style={{ backgroundColor: category?.color }}
                          title={`${subcategory?.name} - ${formatDuration(entry.duration)}`}
                        >
                          <span className="text-[8px] lg:text-[9px] text-white truncate" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.3)' }}>
                            {subcategory?.name}
                          </span>
                        </div>
                      );
                    })}
                    {entries.length > 2 && (
                      <div className="text-[8px] lg:text-[10px] text-muted-foreground">
                        +{entries.length - 2} mehr
                      </div>
                    )}
                    {totalDuration > 0 && (
                      <div className="text-[8px] lg:text-[10px] font-mono text-muted-foreground mt-0.5 lg:mt-1 hidden sm:block">
                        {formatDuration(totalDuration)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DraggableEntryCreator>
          );
        })}
      </div>
    </div>
  );
}
