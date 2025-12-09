import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { QuickStats } from '@/components/timer/QuickStats';
import { ManualEntryDialog } from '@/components/timer/ManualEntryDialog';
import { RecentEntries } from '@/components/timer/RecentEntries';
import { DayTimeline } from './DayTimeline';
import { Category, Subcategory, TimeEntry, TimerState } from '@/types/timetracker';
import { LayoutDashboard } from 'lucide-react';

interface DashboardProps {
  categories: Category[];
  subcategories: Subcategory[];
  timeEntries: TimeEntry[];
  timerState: TimerState | null;
  onStartTimer: (categoryId: string, subcategoryId: string) => void;
  onStopTimer: () => void;
  onUpdateTimerStartTime: (newStartTime: Date) => void;
  onAddManualEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

export function Dashboard({
  categories,
  subcategories,
  timeEntries,
  timerState,
  onStartTimer,
  onStopTimer,
  onUpdateTimerStartTime,
  onAddManualEntry,
  onDeleteEntry,
  onUpdateEntry,
  getSubcategoriesForCategory,
  getCategoryById,
  getSubcategoryById,
}: DashboardProps) {
  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* Left: Day Timeline */}
      <div className="w-80 flex-shrink-0">
        <DayTimeline
          timeEntries={timeEntries}
          timerState={timerState}
          getCategoryById={getCategoryById}
          getSubcategoryById={getSubcategoryById}
        />
      </div>

      {/* Right: Main Content */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer */}
          <TimerDisplay
            categories={categories}
            subcategories={subcategories}
            timerState={timerState}
            onStart={onStartTimer}
            onStop={onStopTimer}
            onUpdateStartTime={onUpdateTimerStartTime}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
          />

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
    </div>
  );
}
