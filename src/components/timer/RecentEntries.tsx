import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatDuration, formatTime, formatDate } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

interface RecentEntriesProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  onDelete: (id: string) => void;
}

export function RecentEntries({
  timeEntries,
  categories,
  subcategories,
  getCategoryById,
  getSubcategoryById,
  onDelete,
}: RecentEntriesProps) {
  // Get last 5 entries, sorted by start time
  const recentEntries = [...timeEntries]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  if (recentEntries.length === 0) {
    return (
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Letzte Einträge</h2>
        <p className="text-muted-foreground text-sm text-center py-8">
          Noch keine Zeiteinträge vorhanden.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold mb-4">Letzte Einträge</h2>
      <div className="space-y-3">
        {recentEntries.map((entry, index) => {
          const category = getCategoryById(entry.categoryId);
          const subcategory = getSubcategoryById(entry.subcategoryId);

          return (
            <div
              key={entry.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg bg-secondary/50 animate-fade-in",
                "hover:bg-secondary transition-colors"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-10 rounded-full"
                  style={{ backgroundColor: category?.color || '#666' }}
                />
                <div>
                  <div className="font-medium text-sm">
                    {category?.name} → {subcategory?.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(new Date(entry.startTime))} • {formatTime(new Date(entry.startTime))} - {entry.endTime ? formatTime(new Date(entry.endTime)) : 'läuft'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium">
                  {formatDuration(entry.duration)}
                </span>
                <Button
                  variant="ghost"
                  size="iconSm"
                  onClick={() => onDelete(entry.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
