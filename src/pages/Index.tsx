import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav, MobileBottomNav } from '@/components/layout/MobileNav';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { AllEntriesView } from '@/components/entries/AllEntriesView';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { CalendarView } from '@/components/calendar/CalendarView';
import { StatisticsView } from '@/components/statistics/StatisticsView';
import { CollectionTab } from '@/components/gamification/CollectionTab';
import { WeeklyRecap } from '@/components/gamification/WeeklyRecap';
import { WeeklyBattlePass } from '@/components/gamification/WeeklyBattlePass';
import { PasswordGate } from '@/components/auth/PasswordGate';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { useMidnightCheck } from '@/hooks/useMidnightCheck';
import { useGamification, TOTAL_MILESTONES } from '@/hooks/useGamification';
import { ViewMode } from '@/types/timetracker';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [battlePassOpen, setBattlePassOpen] = useState(false);
  
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
    updateTimerPauses,
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

  const {
    collectedItems,
    collectItem,
  } = useGamification();

  // Midnight check and 12-hour auto-stop
  useMidnightCheck({
    timerState,
    timeEntries,
    onStopTimer: stopTimer,
    onAddManualEntry: addManualEntry,
    onUpdateEntry: updateTimeEntry,
  });

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
            onUpdateTimerPauses={updateTimerPauses}
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
            onOpenBattlePass={() => setBattlePassOpen(true)}
            onNavigateToStatistics={() => setCurrentView('statistics')}
          />
        );
      case 'entries':
        return (
          <AllEntriesView
            timeEntries={timeEntries}
            categories={categories}
            subcategories={subcategories}
            onDelete={deleteTimeEntry}
            onUpdate={updateTimeEntry}
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
      case 'collection':
        return (
          <CollectionTab
            collectedItems={collectedItems}
            totalPossibleItems={TOTAL_MILESTONES}
          />
        );
      case 'recap':
        return (
          <WeeklyRecap
            timeEntries={timeEntries}
            categories={categories}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PasswordGate>
      <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        
        {/* Mobile Navigation */}
        <MobileNav currentView={currentView} onViewChange={setCurrentView} />
        <MobileBottomNav currentView={currentView} onViewChange={setCurrentView} />
        
        {/* Main Content */}
        <main className="lg:ml-64 pt-16 pb-20 lg:pt-0 lg:pb-0 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {renderView()}
          </div>
        </main>

        {/* Battle Pass Dialog */}
        <WeeklyBattlePass
          open={battlePassOpen}
          onOpenChange={setBattlePassOpen}
          timeEntries={timeEntries}
          categories={categories}
          collectedItems={collectedItems}
          onCollectItem={collectItem}
        />
      </div>
    </PasswordGate>
  );
};

export default Index;
