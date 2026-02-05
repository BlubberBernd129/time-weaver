import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, formatTime, getEntriesForDay } from '@/lib/timeUtils';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TodayOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

export function TodayOverviewDialog({
  open,
  onOpenChange,
  timeEntries,
  categories,
  subcategories,
  getCategoryById,
  getSubcategoryById,
}: TodayOverviewDialogProps) {
  const today = new Date();
  const todayEntries = getEntriesForDay(timeEntries, today)
    .filter(e => !e.isPause)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const totalTime = todayEntries.reduce((acc, e) => acc + e.duration, 0);

  // Group by category
  const categoryStats = categories.map(cat => {
    const catEntries = todayEntries.filter(e => e.categoryId === cat.id);
    const catTime = catEntries.reduce((acc, e) => acc + e.duration, 0);
    return {
      category: cat,
      totalTime: catTime,
      entries: catEntries,
    };
  }).filter(c => c.totalTime > 0).sort((a, b) => b.totalTime - a.totalTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Heute – {format(today, 'EEEE, dd. MMMM yyyy', { locale: de })}
          </DialogTitle>
        </DialogHeader>

        {/* Total Time Header */}
        <div className="glass-card p-4 text-center">
          <div className="text-sm text-muted-foreground mb-1">Gesamtzeit heute</div>
          <div className="text-3xl font-bold gradient-text">
            {formatHoursMinutes(totalTime)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {todayEntries.length} Einträge
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] pr-2">
          {todayEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Einträge für heute vorhanden.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Category Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Nach Kategorie</h4>
                {categoryStats.map(({ category, totalTime }) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className="font-mono text-sm">
                      {formatHoursMinutes(totalTime)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Zeitverlauf</h4>
                <div className="space-y-2">
                  {todayEntries.map((entry) => {
                    const category = getCategoryById(entry.categoryId);
                    const subcategory = getSubcategoryById(entry.subcategoryId);
                    const startTime = new Date(entry.startTime);
                    const endTime = entry.endTime ? new Date(entry.endTime) : null;

                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                      >
                        <div
                          className="w-1 h-10 rounded-full"
                          style={{ backgroundColor: category?.color || '#666' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {category?.name || 'Unbekannt'}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {subcategory?.name || 'Unbekannt'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm">
                            {formatTime(startTime)} - {endTime ? formatTime(endTime) : 'läuft'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatHoursMinutes(entry.duration)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
