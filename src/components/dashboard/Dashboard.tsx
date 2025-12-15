import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { QuickStats } from '@/components/timer/QuickStats';
import { ManualEntryDialog } from '@/components/timer/ManualEntryDialog';
import { RecentEntries } from '@/components/timer/RecentEntries';
import { DayTimeline } from './DayTimeline';
import { GoalsManager } from '@/components/goals/GoalsManager';
import { Category, Subcategory, TimeEntry, TimerState, Goal } from '@/types/timetracker';
import { LayoutDashboard } from 'lucide-react';

interface DashboardProps {
  categories: Category[];
  subcategories: Subcategory[];
  timeEntries: TimeEntry[];
  timerState: TimerState | null;
  goals: Goal[];
  onStartTimer: (categoryId: string, subcategoryId: string, pomodoroMode?: boolean) => void;
  onStopTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onUpdateTimerStartTime: (newStartTime: Date) => void;
  onSwitchPomodoroPhase: () => void;
  onUpdatePomodoroElapsed: (elapsed: number) => void;
  onAddManualEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    isPause?: boolean
  ) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  onAddGoal: (categoryId: string, type: 'daily' | 'weekly', targetMinutes: number) => void;
  onDeleteGoal: (id: string) => void;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

export function Dashboard({
  categories,
  subcategories,
  timeEntries,
  timerState,
  goals,
  onStartTimer,
  onStopTimer,
  onPauseTimer,
  onResumeTimer,
  onUpdateTimerStartTime,
  onSwitchPomodoroPhase,
  onUpdatePomodoroElapsed,
  onAddManualEntry,
  onDeleteEntry,
  onUpdateEntry,
  onAddGoal,
  onDeleteGoal,
  getSubcategoriesForCategory,
  getCategoryById,
  getSubcategoryById,
}: DashboardProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-4rem)]">
      {/* Left: Day Timeline - Hidden on mobile */}
      <div className="hidden xl:block w-80 flex-shrink-0">
        <DayTimeline
          timeEntries={timeEntries}
          timerState={timerState}
          getCategoryById={getCategoryById}
          getSubcategoryById={getSubcategoryById}
        />
      </div>

      {/* Right: Main Content */}
      <div className="flex-1 space-y-4 lg:space-y-6 lg:overflow-y-auto lg:pr-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
          </div>
          <ManualEntryDialog
            categories={categories}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            onAddEntry={onAddManualEntry}
          />
        </div>

        {/* Quick Stats */}
        <QuickStats
          timeEntries={timeEntries}
          categories={categories}
          subcategories={subcategories}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Timer */}
          <TimerDisplay
            categories={categories}
            subcategories={subcategories}
            timerState={timerState}
            onStart={onStartTimer}
            onStop={onStopTimer}
            onPause={onPauseTimer}
            onResume={onResumeTimer}
            onUpdateStartTime={onUpdateTimerStartTime}
            onSwitchPomodoroPhase={onSwitchPomodoroPhase}
            onUpdatePomodoroElapsed={onUpdatePomodoroElapsed}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
          />

          {/* Goals */}
          <GoalsManager
            categories={categories}
            subcategories={subcategories}
            goals={goals}
            timeEntries={timeEntries}
            onAddGoal={onAddGoal}
            onDeleteGoal={onDeleteGoal}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
          />
        </div>

        {/* Recent Entries */}
        <RecentEntries
          timeEntries={timeEntries}
          categories={categories}
          subcategories={subcategories}
          getCategoryById={getCategoryById}
          getSubcategoryById={getSubcategoryById}
          onDelete={onDeleteEntry}
          onUpdate={onUpdateEntry}
        />
      </div>
    </div>
  );
}
