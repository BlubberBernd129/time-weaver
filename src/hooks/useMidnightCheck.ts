import { useEffect, useCallback, useRef } from 'react';
import { TimeEntry, TimerState } from '@/types/timetracker';
import { pb, isAuthenticated } from '@/lib/pocketbase';
import { toast } from 'sonner';

const MAX_DURATION_SECONDS = 12 * 60 * 60; // 12 hours
const MIDNIGHT_STOP_BUFFER_SECONDS = 15; // Stop 15 seconds before midnight (23:59:45)

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

// Flash browser tab/title when timer is auto-stopped
function flashBrowserTab(message: string) {
  const originalTitle = document.title;
  let isFlashing = true;
  let flashCount = 0;
  const maxFlashes = 10;

  const flash = () => {
    if (!isFlashing || flashCount >= maxFlashes) {
      document.title = originalTitle;
      return;
    }
    document.title = flashCount % 2 === 0 ? `⚠️ ${message}` : originalTitle;
    flashCount++;
    setTimeout(flash, 500);
  };

  flash();

  // Also try to use Notification API if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('TimeTracker', { body: message });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Stop flashing after 5 seconds
  setTimeout(() => {
    isFlashing = false;
    document.title = originalTitle;
  }, 5000);
}

export function useMidnightCheck({
  timerState,
  timeEntries,
  onStopTimer,
  onAddManualEntry,
  onUpdateEntry,
}: UseMidnightCheckProps) {
  const midnightStopScheduledRef = useRef(false);
  
  // Check for entries that exceed 12 hours and auto-stop
  const checkAndStopLongRunningTimer = useCallback(async () => {
    if (!timerState?.isRunning || !timerState.startTime) return;

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - timerState.startTime.getTime()) / 1000);
    const activeTime = elapsed - timerState.totalPausedTime;

    if (activeTime > MAX_DURATION_SECONDS) {
      console.log('Timer exceeded 12 hours, auto-stopping...');
      flashBrowserTab('Timer gestoppt (12h Limit)');
      toast.error('Timer automatisch gestoppt: Maximale Dauer von 12 Stunden überschritten');
      await onStopTimer();
    }
  }, [timerState, onStopTimer]);

  // Check for approaching midnight and stop timer at 23:59:45
  const checkMidnightApproaching = useCallback(async () => {
    if (!timerState?.isRunning || !timerState.startTime) return;
    if (midnightStopScheduledRef.current) return;

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 60 - MIDNIGHT_STOP_BUFFER_SECONDS, 0); // 23:59:45
    
    const timeUntilStop = midnight.getTime() - now.getTime();
    
    // If we're past 23:59:45 or within 30 seconds of it, stop now
    if (timeUntilStop <= 0 && now.getHours() === 23 && now.getMinutes() === 59) {
      console.log('Midnight approaching, stopping timer at 23:59:45...');
      midnightStopScheduledRef.current = true;
      flashBrowserTab('Timer gestoppt (Mitternacht)');
      toast.info('Timer automatisch um 23:59:45 gestoppt');
      await onStopTimer();
      
      // Reset flag after midnight
      setTimeout(() => {
        midnightStopScheduledRef.current = false;
      }, 60000); // Reset after 1 minute
    }
  }, [timerState, onStopTimer]);

  // Run checks periodically
  useEffect(() => {
    if (!timerState?.isRunning) {
      midnightStopScheduledRef.current = false;
      return;
    }

    // Check immediately
    checkAndStopLongRunningTimer();
    checkMidnightApproaching();
    
    // Check every 10 seconds for more precise midnight detection
    const interval = setInterval(() => {
      checkAndStopLongRunningTimer();
      checkMidnightApproaching();
    }, 10 * 1000);

    return () => clearInterval(interval);
  }, [timerState?.isRunning, checkAndStopLongRunningTimer, checkMidnightApproaching]);

  // Check on initial load for any entries that might have crossed midnight while app was closed
  useEffect(() => {
    const checkExistingRunningEntry = async () => {
      if (!timerState?.isRunning || !timerState.startTime) return;

      const now = new Date();
      const startDay = timerState.startTime.toDateString();
      const currentDay = now.toDateString();

      // If running entry is from a previous day, stop it immediately
      if (startDay !== currentDay) {
        console.log('Timer from previous day detected, stopping...');
        flashBrowserTab('Timer gestoppt (neuer Tag)');
        toast.warning('Timer vom Vortag automatisch gestoppt');
        await onStopTimer();
        return;
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
