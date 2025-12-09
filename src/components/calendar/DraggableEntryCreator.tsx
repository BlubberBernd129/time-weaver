import { useState } from 'react';
import { format, setHours, setMinutes } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Category, Subcategory } from '@/types/timetracker';
import { cn } from '@/lib/utils';

interface DraggableEntryCreatorProps {
  date: Date;
  categories: Category[];
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  onAddEntry: (
    categoryId: string,
    subcategoryId: string,
    startTime: Date,
    endTime: Date,
    description?: string
  ) => void;
  children: React.ReactNode;
}

export function DraggableEntryCreator({
  date,
  categories,
  getSubcategoriesForCategory,
  onAddEntry,
  children,
}: DraggableEntryCreatorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');

  const availableSubcategories = selectedCategory
    ? getSubcategoriesForCategory(selectedCategory)
    : [];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedSubcategory('');
  };

  const handleSubmit = () => {
    if (!selectedCategory || !selectedSubcategory) return;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let start = setMinutes(setHours(new Date(date), startH), startM);
    start.setSeconds(0, 0);
    
    let end = setMinutes(setHours(new Date(date), endH), endM);
    end.setSeconds(0, 0);

    // Handle overnight entries
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    onAddEntry(
      selectedCategory,
      selectedSubcategory,
      start,
      end,
      description || undefined
    );

    // Reset form
    setSelectedCategory('');
    setSelectedSubcategory('');
    setStartTime('09:00');
    setEndTime('10:00');
    setDescription('');
    setOpen(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary');
    setOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-primary');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-primary');
  };

  return (
    <>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="h-full w-full transition-all"
      >
        {children}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Eintrag für {format(date, 'dd.MM.yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <Label>Unterkategorie</Label>
              <Select
                value={selectedSubcategory}
                onValueChange={setSelectedSubcategory}
                disabled={!selectedCategory}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Unterkategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dropStartTime">Startzeit</Label>
                <Input
                  id="dropStartTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-secondary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dropEndTime">Endzeit</Label>
                <Input
                  id="dropEndTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-secondary"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="dropDescription">Beschreibung (optional)</Label>
              <Input
                id="dropDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Was hast du gemacht?"
                className="bg-secondary"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={!selectedCategory || !selectedSubcategory}
            >
              <Plus className="w-4 h-4 mr-2" />
              Eintrag erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Draggable trigger element for the sidebar
export function DragHandle() {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', 'new-entry');
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className={cn(
        "flex items-center gap-2 p-3 rounded-lg cursor-grab active:cursor-grabbing",
        "bg-primary/10 border-2 border-dashed border-primary/30 hover:border-primary/50",
        "transition-all hover:bg-primary/20"
      )}
    >
      <Plus className="w-5 h-5 text-primary" />
      <span className="text-sm font-medium text-primary">
        Ziehe mich in den Kalender
      </span>
    </div>
  );
}
