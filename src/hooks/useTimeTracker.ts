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

  // Load data on mount and when auth changes
  useEffect(() => {
    const loadFromPocketBase = async () => {
      if (!isAuthenticated()) {
        console.log('Not authenticated, skipping PocketBase load');
        return false;
      }

      try {
        console.log('Loading data from PocketBase...');
        
        const pbCategories = await pb.collection('categories').getFullList();
        const mappedCategories: Category[] = pbCategories.map((c: any) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          createdAt: new Date(c.created),
        }));
        setCategories(mappedCategories);

        const pbSubcategories = await pb.collection('subcategories').getFullList();
        const mappedSubcategories: Subcategory[] = pbSubcategories.map((s: any) => ({
          id: s.id,
          categoryId: s.category_id,
          name: s.name,
          createdAt: new Date(s.created),
        }));
        setSubcategories(mappedSubcategories);

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

        return true;
      } catch (error) {
        console.error('Error loading from PocketBase:', error);
        return false;
      }
    };

    const loadData = async () => {
      setTimerState(getTimerState());

      if (isAuthenticated()) {
        const success = await loadFromPocketBase();
        if (!success) {
          setCategories(getCategories());
          setSubcategories(getSubcategories());
          setTimeEntries(getTimeEntries());
          setGoals(getGoals());
        }
      } else {
        setCategories(getCategories());
        setSubcategories(getSubcategories());
        setTimeEntries(getTimeEntries());
        setGoals(getGoals());
      }
      setIsLoaded(true);
    };

    loadData();

    const unsubscribe = pb.authStore.onChange(async (token) => {
      if (token) {
        console.log('Auth changed, reloading data...');
        await loadFromPocketBase();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Category operations with PocketBase sync
  const addCategory = useCallback(async (name: string, color: string) => {
    if (isAuthenticated()) {
      try {
        const record = await pb.collection('categories').create({
          name,
          color,
        });
        const newCategory: Category = {
          id: record.id,
          name: record.name,
          color: record.color,
          createdAt: new Date(record.created),
        };
        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      } catch (error) {
        console.error('Error creating category in PocketBase:', error);
      }
    }
    
    // Fallback to local
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

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    if (isAuthenticated()) {
      try {
        await pb.collection('categories').update(id, {
          name: updates.name,
          color: updates.color,
          icon: updates.icon,
        });
      } catch (error) {
        console.error('Error updating category in PocketBase:', error);
      }
    }
    
    const updated = categories.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    setCategories(updated);
    saveCategories(updated);
  }, [categories]);

  const deleteCategory = useCallback(async (id: string) => {
    if (isAuthenticated()) {
      try {
        // Delete related subcategories, entries, goals first
        const relatedSubs = subcategories.filter(s => s.categoryId === id);
        const relatedEntries = timeEntries.filter(e => e.categoryId === id);
        const relatedGoals = goals.filter(g => g.categoryId === id);
        
        await Promise.all([
          ...relatedSubs.map(s => pb.collection('subcategories').delete(s.id).catch(() => {})),
          ...relatedEntries.map(e => pb.collection('time_entries').delete(e.id).catch(() => {})),
          ...relatedGoals.map(g => pb.collection('goals').delete(g.id).catch(() => {})),
          pb.collection('categories').delete(id),
        ]);
      } catch (error) {
        console.error('Error deleting category in PocketBase:', error);
      }
    }

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

  // Subcategory operations with PocketBase sync
  const addSubcategory = useCallback(async (categoryId: string, name: string) => {
    if (isAuthenticated()) {
      try {
        const record = await pb.collection('subcategories').create({
          category_id: categoryId,
          name,
        });
        const newSubcategory: Subcategory = {
          id: record.id,
          categoryId: record.category_id,
          name: record.name,
          createdAt: new Date(record.created),
        };
        setSubcategories(prev => [...prev, newSubcategory]);
        return newSubcategory;
      } catch (error) {
        console.error('Error creating subcategory in PocketBase:', error);
      }
    }

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

  const updateSubcategory = useCallback(async (id: string, updates: Partial<Subcategory>) => {
    if (isAuthenticated()) {
      try {
        await pb.collection('subcategories').update(id, {
          name: updates.name,
          category_id: updates.categoryId,
        });
      } catch (error) {
        console.error('Error updating subcategory in PocketBase:', error);
      }
    }

    const updated = subcategories.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    setSubcategories(updated);
    saveSubcategories(updated);
  }, [subcategories]);

  const deleteSubcategory = useCallback(async (id: string) => {
    if (isAuthenticated()) {
      try {
        const relatedEntries = timeEntries.filter(e => e.subcategoryId === id);
        const relatedGoals = goals.filter(g => g.subcategoryId === id);
        
        await Promise.all([
          ...relatedEntries.map(e => pb.collection('time_entries').delete(e.id).catch(() => {})),
          ...relatedGoals.map(g => pb.collection('goals').delete(g.id).catch(() => {})),
          pb.collection('subcategories').delete(id),
        ]);
      } catch (error) {
        console.error('Error deleting subcategory in PocketBase:', error);
      }
    }

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

  // Timer operations (local only - ephemeral)
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
      pomodoroWorkDuration: 1500,
      pomodoroBreakDuration: 300,
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

  const stopTimer = useCallback(async () => {
    if (!timerState || !timerState.isRunning || !timerState.startTime) return null;

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

    let newEntry: TimeEntry;

    if (isAuthenticated()) {
      try {
        const record = await pb.collection('time_entries').create({
          category_id: timerState.categoryId,
          subcategory_id: timerState.subcategoryId,
          start_time: timerState.startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration: activeDuration,
          is_running: false,
          is_pause: false,
          pause_periods: finalPausePeriods,
        });
        
        newEntry = {
          id: record.id,
          categoryId: timerState.categoryId!,
          subcategoryId: timerState.subcategoryId!,
          startTime: timerState.startTime,
          endTime,
          duration: activeDuration,
          isRunning: false,
          pausePeriods: finalPausePeriods,
        };
      } catch (error) {
        console.error('Error creating time entry in PocketBase:', error);
        newEntry = {
          id: generateId('entry'),
          categoryId: timerState.categoryId!,
          subcategoryId: timerState.subcategoryId!,
          startTime: timerState.startTime,
          endTime,
          duration: activeDuration,
          isRunning: false,
          pausePeriods: finalPausePeriods,
        };
      }
    } else {
      newEntry = {
        id: generateId('entry'),
        categoryId: timerState.categoryId!,
        subcategoryId: timerState.subcategoryId!,
        startTime: timerState.startTime,
        endTime,
        duration: activeDuration,
        isRunning: false,
        pausePeriods: finalPausePeriods,
      };
    }

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    saveTimeEntries(updatedEntries);

    setTimerState(null);
    saveTimerState(null);

    return newEntry;
  }, [timerState, timeEntries]);

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

  // Manual time entry with PocketBase sync
  const addManualEntry = useCallback(async (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    isPause?: boolean
  ) => {
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    let newEntry: TimeEntry;

    if (isAuthenticated()) {
      try {
        const record = await pb.collection('time_entries').create({
          category_id: categoryId,
          subcategory_id: subcategoryId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration,
          description,
          is_running: false,
          is_pause: isPause || false,
        });
        
        newEntry = {
          id: record.id,
          categoryId,
          subcategoryId,
          startTime,
          endTime,
          duration,
          description,
          isRunning: false,
          isPause: isPause || false,
        };
      } catch (error) {
        console.error('Error creating manual entry in PocketBase:', error);
        newEntry = {
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
      }
    } else {
      newEntry = {
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
    }

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    saveTimeEntries(updatedEntries);

    return newEntry;
  }, [timeEntries]);

  const deleteTimeEntry = useCallback(async (id: string) => {
    if (isAuthenticated()) {
      try {
        await pb.collection('time_entries').delete(id);
      } catch (error) {
        console.error('Error deleting time entry in PocketBase:', error);
      }
    }

    const updated = timeEntries.filter(e => e.id !== id);
    setTimeEntries(updated);
    saveTimeEntries(updated);
  }, [timeEntries]);

  const updateTimeEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    if (isAuthenticated()) {
      try {
        await pb.collection('time_entries').update(id, {
          category_id: updates.categoryId,
          subcategory_id: updates.subcategoryId,
          start_time: updates.startTime?.toISOString(),
          end_time: updates.endTime?.toISOString(),
          duration: updates.duration,
          description: updates.description,
          is_pause: updates.isPause,
        });
      } catch (error) {
        console.error('Error updating time entry in PocketBase:', error);
      }
    }

    const updated = timeEntries.map(e => 
      e.id === id ? { ...e, ...updates } : e
    );
    setTimeEntries(updated);
    saveTimeEntries(updated);
  }, [timeEntries]);

  // Goals operations with PocketBase sync
  const addGoal = useCallback(async (categoryId: string, type: 'daily' | 'weekly', targetMinutes: number, subcategoryId?: string) => {
    // Remove existing goal for same category, subcategory and type
    const existingGoal = goals.find(g => 
      g.categoryId === categoryId && 
      g.type === type && 
      g.subcategoryId === subcategoryId
    );

    if (existingGoal && isAuthenticated()) {
      try {
        await pb.collection('goals').delete(existingGoal.id);
      } catch (error) {
        console.error('Error deleting existing goal in PocketBase:', error);
      }
    }

    const filteredGoals = goals.filter(g => !(
      g.categoryId === categoryId && 
      g.type === type && 
      g.subcategoryId === subcategoryId
    ));

    let newGoal: Goal;

    if (isAuthenticated()) {
      try {
        const record = await pb.collection('goals').create({
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          type,
          target_minutes: targetMinutes,
        });
        
        newGoal = {
          id: record.id,
          categoryId,
          subcategoryId,
          type,
          targetMinutes,
          createdAt: new Date(record.created),
        };
      } catch (error) {
        console.error('Error creating goal in PocketBase:', error);
        newGoal = {
          id: generateId('goal'),
          categoryId,
          subcategoryId,
          type,
          targetMinutes,
          createdAt: new Date(),
        };
      }
    } else {
      newGoal = {
        id: generateId('goal'),
        categoryId,
        subcategoryId,
        type,
        targetMinutes,
        createdAt: new Date(),
      };
    }
    
    const updated = [...filteredGoals, newGoal];
    setGoals(updated);
    saveGoals(updated);
    return newGoal;
  }, [goals]);

  const deleteGoal = useCallback(async (id: string) => {
    if (isAuthenticated()) {
      try {
        await pb.collection('goals').delete(id);
      } catch (error) {
        console.error('Error deleting goal in PocketBase:', error);
      }
    }

    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    saveGoals(updated);
  }, [goals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    if (isAuthenticated()) {
      try {
        await pb.collection('goals').update(id, {
          category_id: updates.categoryId,
          subcategory_id: updates.subcategoryId,
          type: updates.type,
          target_minutes: updates.targetMinutes,
        });
      } catch (error) {
        console.error('Error updating goal in PocketBase:', error);
      }
    }

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

  const getEntriesForStats = useCallback(() => {
    return timeEntries.filter(e => !e.isPause);
  }, [timeEntries]);

  return {
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
    updateGoal,
    getGoalsForCategory,

    getSubcategoriesForCategory,
    getCategoryById,
    getSubcategoryById,
    getEntriesForStats,
  };
}
