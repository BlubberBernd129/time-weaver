export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  createdAt: Date;
}

export interface TimeEntry {
  id: string;
  categoryId: string;
  subcategoryId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in seconds
  description?: string;
  isRunning: boolean;
}

export interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  categoryId: string | null;
  subcategoryId: string | null;
  elapsed: number; // in seconds
}

export interface WeeklyStats {
  weekStart: Date;
  weekEnd: Date;
  totalTime: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    color: string;
    totalTime: number;
    subcategories: {
      subcategoryId: string;
      subcategoryName: string;
      totalTime: number;
    }[];
  }[];
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalTime: number;
  byCategory: {
    categoryId: string;
    categoryName: string;
    color: string;
    totalTime: number;
  }[];
  weeklyBreakdown: WeeklyStats[];
}

export type ViewMode = 'dashboard' | 'categories' | 'calendar' | 'statistics';
export type CalendarView = 'week' | 'month';
