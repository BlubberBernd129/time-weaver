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

export interface PausePeriod {
  startTime: Date;
  endTime: Date | null;
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
  isPause?: boolean; // true if this is a pause entry (excluded from statistics)
  pausePeriods?: PausePeriod[]; // pause periods within this entry
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: Date | null;
  categoryId: string | null;
  subcategoryId: string | null;
  elapsed: number; // in seconds
  pauseStartTime: Date | null; // when pause started
  totalPausedTime: number; // total paused time in seconds
  pausePeriods: PausePeriod[];
  /** The PocketBase record id of the currently running `time_entries` record (when available). */
  runningEntryId?: string | null;
  // Pomodoro
  pomodoroMode: boolean;
  pomodoroPhase: 'work' | 'break';
  pomodoroWorkDuration: number; // in seconds (default 25min = 1500)
  pomodoroBreakDuration: number; // in seconds (default 5min = 300)
  pomodoroElapsed: number; // elapsed time in current phase
}

export interface Goal {
  id: string;
  categoryId: string;
  subcategoryId?: string; // Optional - if set, goal is for specific subcategory
  type: 'daily' | 'weekly';
  targetMinutes: number;
  createdAt: Date;
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

export type ViewMode = 'dashboard' | 'entries' | 'categories' | 'calendar' | 'statistics';
export type CalendarView = 'week' | 'month';
