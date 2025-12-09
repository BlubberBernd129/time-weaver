import { useState } from 'react';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimerState } from '@/types/timetracker';

interface EditTimerStartDialogProps {
  timerState: TimerState;
  onUpdateStartTime: (newStartTime: Date) => void;
}

export function EditTimerStartDialog({ timerState, onUpdateStartTime }: EditTimerStartDialogProps) {
  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState(
    timerState.startTime ? format(timerState.startTime, 'HH:mm') : ''
  );

  const handleSubmit = () => {
    if (!timerState.startTime) return;

    const [hours, minutes] = startTime.split(':').map(Number);
    const newStartTime = new Date(timerState.startTime);
    newStartTime.setHours(hours, minutes, 0, 0);

    // Ensure start time is not in the future
    if (newStartTime > new Date()) {
      return;
    }

    onUpdateStartTime(newStartTime);
    setOpen(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && timerState.startTime) {
      setStartTime(format(timerState.startTime, 'HH:mm'));
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          <Clock className="w-3 h-3 mr-1" />
          Startzeit ändern
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[300px]">
        <DialogHeader>
          <DialogTitle>Timer-Startzeit ändern</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="timerStartTime">Neue Startzeit</Label>
            <Input
              id="timerStartTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-secondary"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Die Startzeit wird auf heute gesetzt. Du kannst nur Zeiten vor jetzt wählen.
          </p>
          <Button onClick={handleSubmit} className="w-full">
            Übernehmen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
