import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PausePeriod } from '@/types/timetracker';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/timeUtils';

interface PausePeriodsEditorProps {
  pausePeriods: PausePeriod[];
  entryDate: Date;
  entryStartTime: string;
  entryEndTime: string;
  onChange: (periods: PausePeriod[]) => void;
}

export function PausePeriodsEditor({
  pausePeriods,
  entryDate,
  entryStartTime,
  entryEndTime,
  onChange,
}: PausePeriodsEditorProps) {
  const [newPauseStart, setNewPauseStart] = useState('');
  const [newPauseEnd, setNewPauseEnd] = useState('');

  const addPause = () => {
    if (!newPauseStart || !newPauseEnd) return;

    const [startHours, startMinutes] = newPauseStart.split(':').map(Number);
    const [endHours, endMinutes] = newPauseEnd.split(':').map(Number);

    const pauseStartDate = new Date(entryDate);
    pauseStartDate.setHours(startHours, startMinutes, 0, 0);

    const pauseEndDate = new Date(entryDate);
    pauseEndDate.setHours(endHours, endMinutes, 0, 0);

    // Handle pause crossing midnight
    if (pauseEndDate <= pauseStartDate) {
      pauseEndDate.setDate(pauseEndDate.getDate() + 1);
    }

    const newPeriod: PausePeriod = {
      startTime: pauseStartDate,
      endTime: pauseEndDate,
    };

    // Sort periods by start time
    const updatedPeriods = [...pausePeriods, newPeriod].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    onChange(updatedPeriods);
    setNewPauseStart('');
    setNewPauseEnd('');
  };

  const removePause = (index: number) => {
    const updated = pausePeriods.filter((_, i) => i !== index);
    onChange(updated);
  };

  const totalPausedSeconds = pausePeriods.reduce((acc, p) => {
    if (!p.endTime) return acc;
    return acc + Math.floor((p.endTime.getTime() - p.startTime.getTime()) / 1000);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Pause className="w-4 h-4" />
          Pausen
        </Label>
        {totalPausedSeconds > 0 && (
          <Badge variant="secondary">
            Gesamt: {formatDuration(totalPausedSeconds)}
          </Badge>
        )}
      </div>

      {/* Existing pauses */}
      {pausePeriods.length > 0 && (
        <div className="space-y-2">
          {pausePeriods.map((period, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-2 text-sm">
                <Pause className="w-3 h-3 text-muted-foreground" />
                <span>
                  {format(new Date(period.startTime), 'HH:mm')} - {period.endTime ? format(new Date(period.endTime), 'HH:mm') : '...'}
                </span>
                {period.endTime && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(
                      Math.floor((new Date(period.endTime).getTime() - new Date(period.startTime).getTime()) / 1000)
                    )}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => removePause(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new pause */}
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Start</Label>
          <Input
            type="time"
            value={newPauseStart}
            onChange={(e) => setNewPauseStart(e.target.value)}
            className="bg-secondary h-8 text-sm"
            min={entryStartTime}
            max={entryEndTime}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Ende</Label>
          <Input
            type="time"
            value={newPauseEnd}
            onChange={(e) => setNewPauseEnd(e.target.value)}
            className="bg-secondary h-8 text-sm"
            min={newPauseStart || entryStartTime}
            max={entryEndTime}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addPause}
          disabled={!newPauseStart || !newPauseEnd}
          className="h-8"
        >
          <Plus className="w-3 h-3 mr-1" />
          Hinzufügen
        </Button>
      </div>

      {pausePeriods.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Keine Pausen eingetragen. Füge Pausen hinzu, um sie von der Arbeitszeit abzuziehen.
        </p>
      )}
    </div>
  );
}
