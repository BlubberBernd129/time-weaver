import { TimeEntry, Category, Subcategory, WeeklyStats, MonthlyStats } from '@/types/timetracker';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addDays, getWeek } from 'date-fns';
import { de } from 'date-fns/locale';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatHoursMinutes(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: de });
}

export function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: de });
}

export function formatDateShort(date: Date): string {
  return format(date, 'dd.MM.', { locale: de });
}

export function formatWeekday(date: Date): string {
  return format(date, 'EEEE', { locale: de });
}

export function formatWeekdayShort(date: Date): string {
  return format(date, 'EEE', { locale: de });
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: de });
}

export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getEntriesForDay(entries: TimeEntry[], date: Date): TimeEntry[] {
  return entries.filter(entry => 
    isSameDay(new Date(entry.startTime), date)
  );
}

export function getEntriesForWeek(entries: TimeEntry[], date: Date): TimeEntry[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= start && entryDate <= end;
  });
}

export function getEntriesForMonth(entries: TimeEntry[], date: Date): TimeEntry[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return entries.filter(entry => {
    const entryDate = new Date(entry.startTime);
    return entryDate >= start && entryDate <= end;
  });
}

export function calculateWeeklyStats(
  entries: TimeEntry[],
  categories: Category[],
  subcategories: Subcategory[],
  date: Date
): WeeklyStats {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  const weekEntries = getEntriesForWeek(entries, date);
  
  const totalTime = weekEntries.reduce((acc, entry) => acc + entry.duration, 0);
  
  const categoryMap = new Map<string, {
    totalTime: number;
    subcategories: Map<string, number>;
  }>();
  
  weekEntries.forEach(entry => {
    if (!categoryMap.has(entry.categoryId)) {
      categoryMap.set(entry.categoryId, {
        totalTime: 0,
        subcategories: new Map(),
      });
    }
    
    const catStats = categoryMap.get(entry.categoryId)!;
    catStats.totalTime += entry.duration;
    
    const subTime = catStats.subcategories.get(entry.subcategoryId) || 0;
    catStats.subcategories.set(entry.subcategoryId, subTime + entry.duration);
  });
  
  const byCategory = Array.from(categoryMap.entries()).map(([categoryId, stats]) => {
    const category = categories.find(c => c.id === categoryId);
    return {
      categoryId,
      categoryName: category?.name || 'Unbekannt',
      color: category?.color || '#666',
      totalTime: stats.totalTime,
      subcategories: Array.from(stats.subcategories.entries()).map(([subcategoryId, time]) => {
        const subcategory = subcategories.find(s => s.id === subcategoryId);
        return {
          subcategoryId,
          subcategoryName: subcategory?.name || 'Unbekannt',
          totalTime: time,
        };
      }).sort((a, b) => b.totalTime - a.totalTime),
    };
  }).sort((a, b) => b.totalTime - a.totalTime);
  
  return {
    weekStart,
    weekEnd,
    totalTime,
    byCategory,
  };
}

export function calculateMonthlyStats(
  entries: TimeEntry[],
  categories: Category[],
  subcategories: Subcategory[],
  date: Date
): MonthlyStats {
  const monthEntries = getEntriesForMonth(entries, date);
  const totalTime = monthEntries.reduce((acc, entry) => acc + entry.duration, 0);
  
  const categoryMap = new Map<string, number>();
  
  monthEntries.forEach(entry => {
    const current = categoryMap.get(entry.categoryId) || 0;
    categoryMap.set(entry.categoryId, current + entry.duration);
  });
  
  const byCategory = Array.from(categoryMap.entries()).map(([categoryId, time]) => {
    const category = categories.find(c => c.id === categoryId);
    return {
      categoryId,
      categoryName: category?.name || 'Unbekannt',
      color: category?.color || '#666',
      totalTime: time,
    };
  }).sort((a, b) => b.totalTime - a.totalTime);
  
  // Weekly breakdown
  const weeks: WeeklyStats[] = [];
  let currentDate = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  
  while (currentDate <= monthEnd) {
    weeks.push(calculateWeeklyStats(entries, categories, subcategories, currentDate));
    currentDate = addDays(endOfWeek(currentDate, { weekStartsOn: 1 }), 1);
  }
  
  return {
    month: date.getMonth(),
    year: date.getFullYear(),
    totalTime,
    byCategory,
    weeklyBreakdown: weeks,
  };
}

export function getTodayStats(
  entries: TimeEntry[],
  categories: Category[],
  subcategories: Subcategory[]
): { totalTime: number; entriesCount: number; topCategory: string | null } {
  const today = new Date();
  const todayEntries = getEntriesForDay(entries, today);
  const totalTime = todayEntries.reduce((acc, entry) => acc + entry.duration, 0);
  
  if (todayEntries.length === 0) {
    return { totalTime: 0, entriesCount: 0, topCategory: null };
  }
  
  const categoryTimes = new Map<string, number>();
  todayEntries.forEach(entry => {
    const current = categoryTimes.get(entry.categoryId) || 0;
    categoryTimes.set(entry.categoryId, current + entry.duration);
  });
  
  let maxTime = 0;
  let topCategoryId: string | null = null;
  categoryTimes.forEach((time, catId) => {
    if (time > maxTime) {
      maxTime = time;
      topCategoryId = catId;
    }
  });
  
  const topCategory = topCategoryId ? categories.find(c => c.id === topCategoryId)?.name || null : null;
  
  return { totalTime, entriesCount: todayEntries.length, topCategory };
}
