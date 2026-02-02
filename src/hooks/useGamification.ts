import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'timetracker_gamification';

interface GamificationState {
  collectedItems: number[];
  weeklyCollections: Record<string, number[]>; // week key -> items collected that week
}

function getWeekKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    collectedItems: [],
    weeklyCollections: {},
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load gamification state:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save gamification state:', e);
    }
  }, [state]);

  const collectItem = useCallback((itemIndex: number) => {
    setState(prev => {
      if (prev.collectedItems.includes(itemIndex)) {
        return prev; // Already collected
      }
      
      const weekKey = getWeekKey();
      const weeklyItems = prev.weeklyCollections[weekKey] || [];
      
      return {
        collectedItems: [...prev.collectedItems, itemIndex],
        weeklyCollections: {
          ...prev.weeklyCollections,
          [weekKey]: [...weeklyItems, itemIndex],
        },
      };
    });
  }, []);

  const getTotalCollected = useCallback(() => {
    return state.collectedItems.length;
  }, [state.collectedItems]);

  const getWeeklyCollected = useCallback((weekKey?: string) => {
    const key = weekKey || getWeekKey();
    return state.weeklyCollections[key]?.length || 0;
  }, [state.weeklyCollections]);

  const resetWeek = useCallback(() => {
    // This would be called at the start of a new week to reset progress
    // Items stay collected forever, but the weekly track resets
    const weekKey = getWeekKey();
    setState(prev => ({
      ...prev,
      weeklyCollections: {
        ...prev.weeklyCollections,
        [weekKey]: [],
      },
    }));
  }, []);

  return {
    collectedItems: state.collectedItems,
    weeklyCollections: state.weeklyCollections,
    collectItem,
    getTotalCollected,
    getWeeklyCollected,
    resetWeek,
    currentWeekKey: getWeekKey(),
  };
}

// Total possible milestones (from WeeklyBattlePass)
export const TOTAL_MILESTONES = 48; // 8 (5h intervals) + 40 (1h intervals from 41-80)
