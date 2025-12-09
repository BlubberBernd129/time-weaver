import { useState, useEffect, useCallback } from 'react';
import { Category, Subcategory, TimeEntry, TimerState } from '@/types/timetracker';
import {
  getCategories,
  saveCategories,
  getSubcategories,
  saveSubcategories,
  getTimeEntries,
  saveTimeEntries,
  getTimerState,
  saveTimerState,
  generateId,
} from '@/lib/storage';

export function useTimeTracker() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    setCategories(getCategories());
    setSubcategories(getSubcategories());
    setTimeEntries(getTimeEntries());
    setTimerState(getTimerState());
    setIsLoaded(true);
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
    
    setCategories(updatedCategories);
    setSubcategories(updatedSubcategories);
    setTimeEntries(updatedEntries);
    
    saveCategories(updatedCategories);
    saveSubcategories(updatedSubcategories);
    saveTimeEntries(updatedEntries);
  }, [categories, subcategories, timeEntries]);

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
    
    setSubcategories(updatedSubcategories);
    setTimeEntries(updatedEntries);
    
    saveSubcategories(updatedSubcategories);
    saveTimeEntries(updatedEntries);
  }, [subcategories, timeEntries]);

  // Timer operations
  const startTimer = useCallback((categoryId: string, subcategoryId: string) => {
    const newState: TimerState = {
      isRunning: true,
      startTime: new Date(),
      categoryId,
      subcategoryId,
      elapsed: 0,
    };
    setTimerState(newState);
    saveTimerState(newState);
  }, []);

  const stopTimer = useCallback(() => {
    if (!timerState || !timerState.isRunning || !timerState.startTime) return null;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timerState.startTime.getTime()) / 1000);

    const newEntry: TimeEntry = {
      id: generateId('entry'),
      categoryId: timerState.categoryId!,
      subcategoryId: timerState.subcategoryId!,
      startTime: timerState.startTime,
      endTime,
      duration,
      isRunning: false,
    };

    const updatedEntries = [...timeEntries, newEntry];
    setTimeEntries(updatedEntries);
    saveTimeEntries(updatedEntries);

    setTimerState(null);
    saveTimerState(null);

    return newEntry;
  }, [timerState, timeEntries]);

  // Manual time entry
  const addManualEntry = useCallback((
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string
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

  return {
    // Data
    categories,
    subcategories,
    timeEntries,
    timerState,
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

    // Time entry operations
    addManualEntry,
    deleteTimeEntry,
    updateTimeEntry,

    // Helpers
    getSubcategoriesForCategory,
    getCategoryById,
    getSubcategoryById,
  };
}
