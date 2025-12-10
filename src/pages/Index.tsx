import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { CalendarView } from '@/components/calendar/CalendarView';
import { StatisticsView } from '@/components/statistics/StatisticsView';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { ViewMode } from '@/types/timetracker';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const {
    categories,
    subcategories,
    timeEntries,
    timerState,
    goals,
    isLoaded,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateTimerStartTime,
    switchPomodoroPhase,
    updatePomodoroElapsed,
    addManualEntry,
    deleteTimeEntry,
    updateTimeEntry,
    addGoal,
    deleteGoal,
    getSubcategoriesForCategory,
    getCategoryById,
    getSubcategoryById,
  } = useTimeTracker();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Lade TimeTracker...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            categories={categories}
            subcategories={subcategories}
            timeEntries={timeEntries}
            timerState={timerState}
            goals={goals}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            onPauseTimer={pauseTimer}
            onResumeTimer={resumeTimer}
            onUpdateTimerStartTime={updateTimerStartTime}
            onSwitchPomodoroPhase={switchPomodoroPhase}
            onUpdatePomodoroElapsed={updatePomodoroElapsed}
            onAddManualEntry={addManualEntry}
            onDeleteEntry={deleteTimeEntry}
            onUpdateEntry={updateTimeEntry}
            onAddGoal={addGoal}
            onDeleteGoal={deleteGoal}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            getCategoryById={getCategoryById}
            getSubcategoryById={getSubcategoryById}
          />
        );
      case 'categories':
        return (
          <CategoryManager
            categories={categories}
            subcategories={subcategories}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            onAddSubcategory={addSubcategory}
            onUpdateSubcategory={updateSubcategory}
            onDeleteSubcategory={deleteSubcategory}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            timeEntries={timeEntries}
            categories={categories}
            subcategories={subcategories}
            getCategoryById={getCategoryById}
            getSubcategoryById={getSubcategoryById}
            getSubcategoriesForCategory={getSubcategoriesForCategory}
            onAddEntry={addManualEntry}
            onUpdateEntry={updateTimeEntry}
            onDeleteEntry={deleteTimeEntry}
          />
        );
      case 'statistics':
        return (
          <StatisticsView
            timeEntries={timeEntries}
            categories={categories}
            subcategories={subcategories}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default Index;
