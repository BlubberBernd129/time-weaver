import { useState, useMemo } from 'react';
import { TimeEntry, Category, Subcategory } from '@/types/timetracker';
import { formatDate, formatTime, formatDuration } from '@/lib/timeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { EditEntryDialog } from '@/components/timer/EditEntryDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AllEntriesViewProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TimeEntry>) => void;
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

const MAX_DURATION_SECONDS = 12 * 60 * 60; // 12 hours

export function AllEntriesView({
  timeEntries,
  categories,
  subcategories,
  onDelete,
  onUpdate,
  getCategoryById,
  getSubcategoryById,
}: AllEntriesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  // Check if an entry is an error (exceeded 12 hours)
  const isErrorEntry = (entry: TimeEntry): boolean => {
    if (entry.isRunning) return false;
    return entry.duration > MAX_DURATION_SECONDS;
  };

  // Check if entry spans midnight
  const spansMidnight = (entry: TimeEntry): boolean => {
    if (!entry.endTime) return false;
    const startDay = new Date(entry.startTime).toDateString();
    const endDay = new Date(entry.endTime).toDateString();
    return startDay !== endDay;
  };

  // Filtered and sorted entries
  const filteredEntries = useMemo(() => {
    let entries = [...timeEntries]
      .filter(e => !e.isRunning) // Only show completed entries
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(entry => {
        const category = getCategoryById(entry.categoryId);
        const subcategory = getSubcategoryById(entry.subcategoryId);
        return (
          category?.name.toLowerCase().includes(term) ||
          subcategory?.name.toLowerCase().includes(term) ||
          entry.description?.toLowerCase().includes(term)
        );
      });
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      entries = entries.filter(entry => entry.categoryId === categoryFilter);
    }

    // Filter errors only
    if (showErrorsOnly) {
      entries = entries.filter(isErrorEntry);
    }

    return entries;
  }, [timeEntries, searchTerm, categoryFilter, showErrorsOnly, getCategoryById, getSubcategoryById]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const groups: Record<string, TimeEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const dateKey = formatDate(new Date(entry.startTime));
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  const errorCount = useMemo(() => 
    timeEntries.filter(e => !e.isRunning && isErrorEntry(e)).length
  , [timeEntries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Alle Einträge</h2>
          <p className="text-muted-foreground">
            {filteredEntries.length} Einträge
            {errorCount > 0 && (
              <span className="text-destructive ml-2">
                ({errorCount} mit Fehler)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showErrorsOnly ? "destructive" : "outline"}
              onClick={() => setShowErrorsOnly(!showErrorsOnly)}
              className="gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Fehler ({errorCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entry List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Zeiteinträge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-380px)]">
            {Object.keys(entriesByDate).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Keine Einträge gefunden</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(entriesByDate).map(([date, entries]) => (
                  <div key={date} className="space-y-2">
                    <div className="sticky top-0 bg-background/95 backdrop-blur py-2 border-b border-border">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {date}
                        <Badge variant="secondary" className="ml-2">
                          {entries.length} Einträge
                        </Badge>
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {entries.map(entry => {
                        const category = getCategoryById(entry.categoryId);
                        const subcategory = getSubcategoryById(entry.subcategoryId);
                        const hasError = isErrorEntry(entry);
                        const crossesMidnight = spansMidnight(entry);

                        return (
                          <div
                            key={entry.id}
                            className={`
                              flex items-center justify-between p-3 rounded-lg border transition-colors
                              ${hasError 
                                ? 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20' 
                                : 'bg-muted/30 hover:bg-muted/50 border-border'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: category?.color || '#888' }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground">
                                    {category?.name || 'Unbekannt'}
                                  </span>
                                  {subcategory && (
                                    <span className="text-muted-foreground">
                                      / {subcategory.name}
                                    </span>
                                  )}
                                  {hasError && (
                                    <Badge variant="destructive" className="gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Fehler: &gt;12h
                                    </Badge>
                                  )}
                                  {crossesMidnight && !hasError && (
                                    <Badge variant="outline" className="text-xs">
                                      Über Mitternacht
                                    </Badge>
                                  )}
                                  {entry.isPause && (
                                    <Badge variant="secondary">Pause</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatTime(new Date(entry.startTime))}
                                  {entry.endTime && (
                                    <>
                                      {' - '}
                                      {crossesMidnight && (
                                        <span className="text-xs">
                                          ({formatDate(new Date(entry.endTime))})
                                        </span>
                                      )}{' '}
                                      {formatTime(new Date(entry.endTime))}
                                    </>
                                  )}
                                  {entry.description && (
                                    <span className="ml-2 italic">"{entry.description}"</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-mono text-sm ${hasError ? 'text-destructive font-bold' : 'text-foreground'}`}>
                                {formatDuration(entry.duration)}
                              </span>
                              <EditEntryDialog
                                entry={entry}
                                onUpdate={onUpdate}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
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
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
