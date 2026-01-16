import { useState } from 'react';
import { format } from 'date-fns';
import { Pencil, CalendarIcon } from 'lucide-react';
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
import { TimeEntry, PausePeriod } from '@/types/timetracker';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { PausePeriodsEditor } from './PausePeriodsEditor';
import { Separator } from '@/components/ui/separator';

interface EditEntryDialogProps {
  entry: TimeEntry;
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void;
}

export function EditEntryDialog({ entry, onUpdate }: EditEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date(entry.startTime));
  const [startTime, setStartTime] = useState(format(new Date(entry.startTime), 'HH:mm'));
  const [endTime, setEndTime] = useState(entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '');
  const [description, setDescription] = useState(entry.description || '');
  const [pausePeriods, setPausePeriods] = useState<PausePeriod[]>(entry.pausePeriods || []);

  const handleSubmit = () => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const newStartTime = new Date(date);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    const newEndTime = new Date(date);
    newEndTime.setHours(endHours, endMinutes, 0, 0);

    // Handle case where end time is past midnight
    if (newEndTime <= newStartTime) {
      newEndTime.setDate(newEndTime.getDate() + 1);
    }

    // Calculate total paused time
    const totalPausedSeconds = pausePeriods.reduce((acc, p) => {
      if (!p.endTime) return acc;
      return acc + Math.floor((new Date(p.endTime).getTime() - new Date(p.startTime).getTime()) / 1000);
    }, 0);

    const totalDuration = Math.floor((newEndTime.getTime() - newStartTime.getTime()) / 1000);
    const activeDuration = Math.max(0, totalDuration - totalPausedSeconds);

    onUpdate(entry.id, {
      startTime: newStartTime,
      endTime: newEndTime,
      duration: activeDuration,
      description: description || undefined,
      pausePeriods: pausePeriods,
    });

    setOpen(false);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDate(new Date(entry.startTime));
      setStartTime(format(new Date(entry.startTime), 'HH:mm'));
      setEndTime(entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '');
      setDescription(entry.description || '');
      setPausePeriods(entry.pausePeriods || []);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="iconSm"
          className="text-muted-foreground hover:text-primary"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eintrag bearbeiten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Datum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'dd.MM.yyyy') : 'Datum wählen'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Startzeit</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Endzeit</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-secondary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was hast du gemacht?"
              className="bg-secondary"
            />
          </div>

          <Separator className="my-4" />

          {/* Pause Periods Editor */}
          <PausePeriodsEditor
            pausePeriods={pausePeriods}
            entryDate={date}
            entryStartTime={startTime}
            entryEndTime={endTime}
            onChange={setPausePeriods}
          />

          <Button onClick={handleSubmit} className="w-full mt-4">
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
