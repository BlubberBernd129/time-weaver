import { useState, useEffect, useCallback } from 'react';
import { Category, Subcategory, TimeEntry, TimerState, Goal, PausePeriod } from '@/types/timetracker';
import {
  getCategories,
  saveCategories,
  getSubcategories,
  saveSubcategories,
  getTimeEntries,
  saveTimeEntries,
  getTimerState,
  saveTimerState,
  getGoals,
  saveGoals,
  generateId,
} from '@/lib/storage';
import { pb, isAuthenticated } from '@/lib/pocketbase';

export function useTimeTracker() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from PocketBase or localStorage
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated()) {
        try {
          // Load categories from PocketBase
          const pbCategories = await pb.collection('categories').getFullList();
          const mappedCategories: Category[] = pbCategories.map((c: any) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            icon: c.icon,
            createdAt: new Date(c.created),
          }));
          setCategories(mappedCategories);

          // Load subcategories from PocketBase
          const pbSubcategories = await pb.collection('subcategories').getFullList();
          const mappedSubcategories: Subcategory[] = pbSubcategories.map((s: any) => ({
            id: s.id,
            categoryId: s.category_id,
            name: s.name,
            createdAt: new Date(s.created),
          }));
          setSubcategories(mappedSubcategories);

          // Load time entries from PocketBase
          const pbEntries = await pb.collection('time_entries').getFullList();
          const mappedEntries: TimeEntry[] = pbEntries.map((e: any) => ({
            id: e.id,
            categoryId: e.category_id,
            subcategoryId: e.subcategory_id,
            startTime: new Date(e.start_time),
            endTime: e.end_time ? new Date(e.end_time) : undefined,
            duration: e.duration,
            description: e.description,
            isRunning: e.is_running,
            isPause: e.is_pause,
            pausePeriods: e.pause_periods || [],
          }));
          setTimeEntries(mappedEntries);

          // Load goals from PocketBase
          const pbGoals = await pb.collection('goals').getFullList();
          const mappedGoals: Goal[] = pbGoals.map((g: any) => ({
            id: g.id,
            categoryId: g.category_id,
            subcategoryId: g.subcategory_id,
            type: g.type,
            targetMinutes: g.target_minutes,
            createdAt: new Date(g.created),
          }));
          setGoals(mappedGoals);

          // Timer state stays local (ephemeral)
          setTimerState(getTimerState());
        } catch (error) {
          console.error('Error loading from PocketBase:', error);
          // Fallback to localStorage
          setCategories(getCategories());
          setSubcategories(getSubcategories());
          setTimeEntries(getTimeEntries());
          setTimerState(getTimerState());
          setGoals(getGoals());
        }
      } else {
        // Not authenticated, use localStorage
        setCategories(getCategories());
        setSubcategories(getSubcategories());
        setTimeEntries(getTimeEntries());
        setTimerState(getTimerState());
        setGoals(getGoals());
      }
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // Category operations
  const addCategory = useCallback((name: string, color: string) => {
    const newCategory: Category = {
      id: generateId('cat'),
      name,
      color,
      createdAt: new Date(),
    };
    const updated = [...categories, newCategory];
    setCategories(updated);
    saveCategories(updated);
    return newCategory;
  }, [categories]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const updated = categories.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    setCategories(updated);
    saveCategories(updated);
  }, [categories]);

  const deleteCategory = useCallback((id: string) => {
    const updatedCategories = categories.filter(c => c.id !== id);
    const updatedSubcategories = subcategories.filter(s => s.categoryId !== id);
    const updatedEntries = timeEntries.filter(e => e.categoryId !== id);
    const updatedGoals = goals.filter(g => g.categoryId !== id);
    
    setCategories(updatedCategories);
    setSubcategories(updatedSubcategories);
    setTimeEntries(updatedEntries);
    setGoals(updatedGoals);
    
    saveCategories(updatedCategories);
    saveSubcategories(updatedSubcategories);
    saveTimeEntries(updatedEntries);
    saveGoals(updatedGoals);
  }, [categories, subcategories, timeEntries, goals]);

  // Subcategory operations
  const addSubcategory = useCallback((categoryId: string, name: string) => {
    const newSubcategory: Subcategory = {
      id: generateId('sub'),
      categoryId,
      name,
      createdAt: new Date(),
    };
    const updated = [...subcategories, newSubcategory];
    setSubcategories(updated);
    saveSubcategories(updated);
    return newSubcategory;
  }, [subcategories]);

  const updateSubcategory = useCallback((id: string, updates: Partial<Subcategory>) => {
    const updated = subcategories.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    setSubcategories(updated);
    saveSubcategories(updated);
  }, [subcategories]);

  const deleteSubcategory = useCallback((id: string) => {
    const updatedSubcategories = subcategories.filter(s => s.id !== id);
    const updatedEntries = timeEntries.filter(e => e.subcategoryId !== id);
    const updatedGoals = goals.filter(g => g.subcategoryId !== id);
    
    setSubcategories(updatedSubcategories);
    setTimeEntries(updatedEntries);
    setGoals(updatedGoals);
    
    saveSubcategories(updatedSubcategories);
    saveTimeEntries(updatedEntries);
    saveGoals(updatedGoals);
  }, [subcategories, timeEntries, goals]);

  // Timer operations
  const startTimer = useCallback((categoryId: string, subcategoryId: string, pomodoroMode: boolean = false) => {
    const newState: TimerState = {
      isRunning: true,
      isPaused: false,
      startTime: new Date(),
      categoryId,
      subcategoryId,
      elapsed: 0,
      pauseStartTime: null,
      totalPausedTime: 0,
      pausePeriods: [],
      pomodoroMode,
      pomodoroPhase: 'work',
      pomodoroWorkDuration: 1500, // 25 min
      pomodoroBreakDuration: 300, // 5 min
      pomodoroElapsed: 0,
    };
    setTimerState(newState);
    saveTimerState(newState);
  }, []);

  const updateTimerStartTime = useCallback((newStartTime: Date) => {
    if (!timerState || !timerState.isRunning) return;

    const updatedState: TimerState = {
      ...timerState,
      startTime: newStartTime,
    };
    setTimerState(updatedState);
    saveTimerState(updatedState);
  }, [timerState]);

  const pauseTimer = useCallback(() => {
    if (!timerState || !timerState.isRunning || timerState.isPaused) return;

    const updatedState: TimerState = {
      ...timerState,
      isPaused: true,
      pauseStartTime: new Date(),
    };
    setTimerState(updatedState);
    saveTimerState(updatedState);
  }, [timerState]);

  const resumeTimer = useCallback(() => {
    if (!timerState || !timerState.isPaused || !timerState.pauseStartTime) return;

    const pauseEnd = new Date();
    const pauseDuration = Math.floor((pauseEnd.getTime() - timerState.pauseStartTime.getTime()) / 1000);
    
    const newPausePeriod: PausePeriod = {
      startTime: timerState.pauseStartTime,
      endTime: pauseEnd,
    };

    const updatedState: TimerState = {
      ...timerState,
      isPaused: false,
      pauseStartTime: null,
      totalPausedTime: timerState.totalPausedTime + pauseDuration,
      pausePeriods: [...timerState.pausePeriods, newPausePeriod],
    };
    setTimerState(updatedState);
    saveTimerState(updatedState);
  }, [timerState]);

  const stopTimer = useCallback(() => {
    if (!timerState || !timerState.isRunning || !timerState.startTime) return null;

    // If paused, end the pause first
    let finalPausePeriods = [...timerState.pausePeriods];
    let finalPausedTime = timerState.totalPausedTime;
    
    if (timerState.isPaused && timerState.pauseStartTime) {
      const pauseEnd = new Date();
      const pauseDuration = Math.floor((pauseEnd.getTime() - timerState.pauseStartTime.getTime()) / 1000);
      finalPausePeriods.push({
        startTime: timerState.pauseStartTime,
        endTime: pauseEnd,
      });
      finalPausedTime += pauseDuration;
    }

    const endTime = new Date();
    const totalDuration = Math.floor((endTime.getTime() - timerState.startTime.getTime()) / 1000);
    const activeDuration = totalDuration - finalPausedTime;

    const newEntry: TimeEntry = {
      id: generateId('entry'),
      categoryId: timerState.categoryId!,
      subcategoryId: timerState.subcategoryId!,
      startTime: timerState.startTime,
      endTime,
      duration: activeDuration, // Only active time counts
      isRunning: false,
      pausePeriods: finalPausePeriods,
    };

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    saveTimeEntries(updatedEntries);

    setTimerState(null);
    saveTimerState(null);

    return newEntry;
  }, [timerState, timeEntries]);

  // Pomodoro phase switch
  const switchPomodoroPhase = useCallback(() => {
    if (!timerState || !timerState.pomodoroMode) return;

    const newPhase = timerState.pomodoroPhase === 'work' ? 'break' : 'work';
    
    const updatedState: TimerState = {
      ...timerState,
      pomodoroPhase: newPhase,
      pomodoroElapsed: 0,
    };
    setTimerState(updatedState);
    saveTimerState(updatedState);
  }, [timerState]);

  const updatePomodoroElapsed = useCallback((elapsed: number) => {
    if (!timerState) return;
    
    const updatedState: TimerState = {
      ...timerState,
      pomodoroElapsed: elapsed,
    };
    setTimerState(updatedState);
    saveTimerState(updatedState);
  }, [timerState]);

  // Manual time entry
  const addManualEntry = useCallback((
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    isPause?: boolean
  ) => {
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const newEntry: TimeEntry = {
      id: generateId('entry'),
      categoryId,
      subcategoryId,
      startTime,
      endTime,
      duration,
      description,
      isRunning: false,
      isPause: isPause || false,
    };

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    saveTimeEntries(updatedEntries);

    return newEntry;
  }, [timeEntries]);

  const deleteTimeEntry = useCallback((id: string) => {
    const updated = timeEntries.filter(e => e.id !== id);
    setTimeEntries(updated);
    saveTimeEntries(updated);
  }, [timeEntries]);

  const updateTimeEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    const updated = timeEntries.map(e => 
      e.id === id ? { ...e, ...updates } : e
    );
    setTimeEntries(updated);
    saveTimeEntries(updated);
  }, [timeEntries]);

  // Goals operations
  const addGoal = useCallback((categoryId: string, type: 'daily' | 'weekly', targetMinutes: number, subcategoryId?: string) => {
    // Remove existing goal for same category, subcategory and type
    const filteredGoals = goals.filter(g => !(
      g.categoryId === categoryId && 
      g.type === type && 
      g.subcategoryId === subcategoryId
    ));
    
    const newGoal: Goal = {
      id: generateId('goal'),
      categoryId,
      subcategoryId,
      type,
      targetMinutes,
      createdAt: new Date(),
    };
    
    const updated = [...filteredGoals, newGoal];
    setGoals(updated);
    saveGoals(updated);
    return newGoal;
  }, [goals]);

  const deleteGoal = useCallback((id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  }, [goals]);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    const updated = goals.map(g => 
      g.id === id ? { ...g, ...updates } : g
    );
    setGoals(updated);
    saveGoals(updated);
  }, [goals]);

  // Helper functions
  const getSubcategoriesForCategory = useCallback((categoryId: string) => {
    return subcategories.filter(s => s.categoryId === categoryId);
  }, [subcategories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getSubcategoryById = useCallback((id: string) => {
    return subcategories.find(s => s.id === id);
  }, [subcategories]);

  const getGoalsForCategory = useCallback((categoryId: string) => {
    return goals.filter(g => g.categoryId === categoryId);
  }, [goals]);

  // Get entries excluding pause entries for statistics
  const getEntriesForStats = useCallback(() => {
    return timeEntries.filter(e => !e.isPause);
  }, [timeEntries]);

  return {
    // Data
    categories,
    subcategories,
    timeEntries,
    timerState,
    goals,
    isLoaded,

    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,

    // Subcategory operations
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,

    // Timer operations
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    updateTimerStartTime,
    switchPomodoroPhase,
    updatePomodoroElapsed,

    // Time entry operations
    addManualEntry,
    deleteTimeEntry,
    updateTimeEntry,

    // Goals operations
    addGoal,
    deleteGoal,
    updateGoal,
    getGoalsForCategory,

    // Helpers
    getSubcategoriesForCategory,
    getCategoryById,
    getSubcategoryById,
    getEntriesForStats,
  };
}
