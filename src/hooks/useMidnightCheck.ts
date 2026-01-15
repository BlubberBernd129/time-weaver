import { useEffect, useCallback } from 'react';
import { TimeEntry, TimerState } from '@/types/timetracker';
import { pb, isAuthenticated } from '@/lib/pocketbase';
import { toast } from 'sonner';

const MAX_DURATION_SECONDS = 12 * 60 * 60; // 12 hours

interface UseMidnightCheckProps {
  timerState: TimerState | null;
  timeEntries: TimeEntry[];
  onStopTimer: () => Promise<TimeEntry | null>;
  onAddManualEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    isPause?: boolean
  ) => Promise<TimeEntry>;
  onUpdateEntry: (id: string, updates: Partial<TimeEntry>) => void;
}

export function useMidnightCheck({
  timerState,
  timeEntries,
  onStopTimer,
  onAddManualEntry,
  onUpdateEntry,
}: UseMidnightCheckProps) {
  
  // Check for entries that exceed 12 hours and auto-stop
  const checkAndStopLongRunningTimer = useCallback(async () => {
    if (!timerState?.isRunning || !timerState.startTime) return;

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
    const activeTime = elapsed - timerState.totalPausedTime;

    if (activeTime > MAX_DURATION_SECONDS) {
      console.log('Timer exceeded 12 hours, auto-stopping...');
      toast.error('Timer automatisch gestoppt: Maximale Dauer von 12 Stunden überschritten');
      await onStopTimer();
    }
  }, [timerState, onStopTimer]);

  // Check for midnight crossing and split entry
  const checkMidnightCrossing = useCallback(async () => {
    if (!timerState?.isRunning || !timerState.startTime) return;

    const now = new Date();
    const startDate = timerState.startTime;
    
    // Check if we crossed midnight (start date is different from current date)
    const startDay = startDate.toDateString();
    const currentDay = now.toDateString();
    
    if (startDay !== currentDay) {
      console.log('Midnight crossing detected, splitting entry...');
      
      // Calculate midnight of the current day
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      
      // Stop the current timer (this will create an entry ending now)
      const stoppedEntry = await onStopTimer();
      
      if (stoppedEntry && timerState.categoryId && timerState.subcategoryId) {
        // Update the stopped entry to end at midnight instead
        const endAtMidnight = new Date(midnight.getTime() - 1); // 23:59:59.999 of previous day
        const durationUntilMidnight = Math.floor((endAtMidnight.getTime() - startDate.getTime()) / 1000);
        const calculatedDuration = Math.max(0, durationUntilMidnight - timerState.totalPausedTime);
        
        // Update entry to end at midnight (this will also update PocketBase)
        onUpdateEntry(stoppedEntry.id, {
          endTime: endAtMidnight,
          duration: calculatedDuration,
        });
        
        // Create a new entry starting at midnight
        await onAddManualEntry(
          timerState.categoryId,
          timerState.subcategoryId,
          midnight,
          now,
          stoppedEntry.description
        );
        
        toast.info('Eintrag wurde bei Mitternacht geteilt');
      }
    }
  }, [timerState, onStopTimer, onAddManualEntry, onUpdateEntry]);

  // Run checks periodically
  useEffect(() => {
    if (!timerState?.isRunning) return;

    // Check immediately
    checkAndStopLongRunningTimer();
    
    // Check every minute
    const interval = setInterval(() => {
      checkAndStopLongRunningTimer();
      checkMidnightCrossing();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [timerState?.isRunning, checkAndStopLongRunningTimer, checkMidnightCrossing]);

  // Check on initial load for any entries that might have crossed midnight while app was closed
  useEffect(() => {
    const checkExistingRunningEntry = async () => {
      if (!timerState?.isRunning || !timerState.startTime) return;

      const now = new Date();
      const startDay = timerState.startTime.toDateString();
      const currentDay = now.toDateString();

      // If running entry is from a previous day, handle it
      if (startDay !== currentDay) {
        await checkMidnightCrossing();
      }

      // If running entry is too old, stop it
      const elapsed = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
      if (elapsed > MAX_DURATION_SECONDS) {
        await checkAndStopLongRunningTimer();
      }
    };

    // Delay check to ensure data is loaded
    const timeout = setTimeout(checkExistingRunningEntry, 2000);
    return () => clearTimeout(timeout);
  }, []); // Only run once on mount
}
