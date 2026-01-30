import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Tag, Pencil, Trash2, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TimeEntry, Category, Subcategory, PausePeriod } from '@/types/timetracker';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/timeUtils';
import { PausePeriodsEditor } from '@/components/timer/PausePeriodsEditor';

interface EntryDetailDialogProps {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  subcategory?: Subcategory;
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void;
  onDelete?: (id: string) => void;
}

export function EntryDetailDialog({
  entry,
  open,
  onOpenChange,
  category,
  subcategory,
  onUpdate,
  onDelete,
}: EntryDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [date, setDate] = useState<Date>(entry ? new Date(entry.startTime) : new Date());
  const [startTime, setStartTime] = useState(entry ? format(new Date(entry.startTime), 'HH:mm') : '');
  const [endTime, setEndTime] = useState(entry?.endTime ? format(new Date(entry.endTime), 'HH:mm') : '');
  const [description, setDescription] = useState(entry?.description || '');
  const [pausePeriods, setPausePeriods] = useState<PausePeriod[]>(entry?.pausePeriods || []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && entry) {
      setDate(new Date(entry.startTime));
      setStartTime(format(new Date(entry.startTime), 'HH:mm'));
      setEndTime(entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '');
      setDescription(entry.description || '');
      setPausePeriods(entry.pausePeriods || []);
      setIsEditing(false);
    }
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    if (!entry) return;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const newStartTime = new Date(date);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    const newEndTime = new Date(date);
    newEndTime.setHours(endHours, endMinutes, 0, 0);

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

    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!entry || !onDelete) return;
    onDelete(entry.id);
    onOpenChange(false);
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category?.color }}
            />
            {isEditing ? 'Eintrag bearbeiten' : 'Eintrag Details'}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
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

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Abbrechen
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Speichern
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Category & Subcategory */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{category?.name}</div>
                <div className="text-sm text-muted-foreground">{subcategory?.name}</div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{format(new Date(entry.startTime), 'dd.MM.yyyy')}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime && format(new Date(entry.endTime), 'HH:mm')}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium font-mono">{formatDuration(entry.duration)}</div>
                <div className="text-sm text-muted-foreground">
                  Dauer {entry.pausePeriods && entry.pausePeriods.length > 0 && `(${entry.pausePeriods.length} Pause${entry.pausePeriods.length > 1 ? 'n' : ''})`}
                </div>
              </div>
            </div>

            {/* Pause periods display */}
            {entry.pausePeriods && entry.pausePeriods.length > 0 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <Pause className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium">Pausen</span>
                </div>
                <div className="space-y-1">
                  {entry.pausePeriods.map((pause, index) => {
                    const pauseStart = new Date(pause.startTime);
                    const pauseEnd = pause.endTime ? new Date(pause.endTime) : null;
                    const pauseDuration = pauseEnd 
                      ? Math.floor((pauseEnd.getTime() - pauseStart.getTime()) / 1000)
                      : 0;
                    return (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {format(pauseStart, 'HH:mm')} - {pauseEnd ? format(pauseEnd, 'HH:mm') : 'läuft'}
                        </span>
                        <span className="font-mono">{formatDuration(pauseDuration)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            {entry.description && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="text-sm text-muted-foreground mb-1">Beschreibung</div>
                <div className="font-medium">{entry.description}</div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                <Pencil className="w-4 h-4 mr-2" />
                Bearbeiten
              </Button>
              {onDelete && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
