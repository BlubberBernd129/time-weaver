import { useMemo, useState } from 'react';
import { Timer, ChevronDown, ChevronRight, ArrowLeft, Download, FileText, Table, Calendar } from 'lucide-react';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes, formatDuration } from '@/lib/timeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimeOverviewTabProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

type TimePeriod = 'week' | 'lastWeek' | 'month' | 'lastMonth' | 'all';

interface CategoryTime {
  category: Category;
  totalSeconds: number;
  percentage: number;
  subcategories: { subcategory: Subcategory; totalSeconds: number; percentage: number }[];
}

export function TimeOverviewTab({
  timeEntries,
  categories,
  subcategories,
  getCategoryById,
  getSubcategoryById,
}: TimeOverviewTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('all');

  const filteredEntries = useMemo(() => {
    const active = timeEntries.filter(e => !e.isPause && e.duration > 0);
    if (period === 'all') return active;

    const now = new Date();
    let start: Date, end: Date;
    switch (period) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'lastWeek':
        start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
    }
    return active.filter(e => {
      const d = new Date(e.startTime);
      return d >= start && d <= end;
    });
  }, [timeEntries, period]);

  const categoryTimes = useMemo(() => {
    const totalAll = filteredEntries.reduce((sum, e) => sum + e.duration, 0);
    const catMap = new Map<string, { total: number; subs: Map<string, number> }>();

    filteredEntries.forEach(entry => {
      if (!catMap.has(entry.categoryId)) catMap.set(entry.categoryId, { total: 0, subs: new Map() });
      const cat = catMap.get(entry.categoryId)!;
      cat.total += entry.duration;
      cat.subs.set(entry.subcategoryId, (cat.subs.get(entry.subcategoryId) || 0) + entry.duration);
    });

    const result: CategoryTime[] = [];
    catMap.forEach((data, catId) => {
      const category = getCategoryById(catId);
      if (!category) return;
      const subList = Array.from(data.subs.entries())
        .map(([subId, seconds]) => {
          const subcategory = getSubcategoryById(subId);
          if (!subcategory) return null;
          return { subcategory, totalSeconds: seconds, percentage: data.total > 0 ? (seconds / data.total) * 100 : 0 };
        })
        .filter(Boolean)
        .sort((a, b) => b!.totalSeconds - a!.totalSeconds) as CategoryTime['subcategories'];

      result.push({
        category,
        totalSeconds: data.total,
        percentage: totalAll > 0 ? (data.total / totalAll) * 100 : 0,
        subcategories: subList,
      });
    });
    return result.sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [filteredEntries, getCategoryById, getSubcategoryById]);

  const totalTime = useMemo(() => categoryTimes.reduce((sum, c) => sum + c.totalSeconds, 0), [categoryTimes]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Detail view entries
  const detailEntries = useMemo(() => {
    if (!selectedCategory) return [];
    let entries = filteredEntries.filter(e => e.categoryId === selectedCategory);
    if (selectedSubcategory) entries = entries.filter(e => e.subcategoryId === selectedSubcategory);
    return entries.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [filteredEntries, selectedCategory, selectedSubcategory]);

  const detailTotalTime = useMemo(() => detailEntries.reduce((sum, e) => sum + e.duration, 0), [detailEntries]);

  const periodLabel = (p: TimePeriod) => {
    switch (p) {
      case 'week': return 'Diese Woche';
      case 'lastWeek': return 'Letzte Woche';
      case 'month': return 'Dieser Monat';
      case 'lastMonth': return 'Letzter Monat';
      case 'all': return 'Gesamte Zeit';
    }
  };

  // Export functions
  const exportCSV = () => {
    const entries = selectedCategory ? detailEntries : filteredEntries;
    const headers = ['Datum', 'Start', 'Ende', 'Dauer', 'Kategorie', 'Unterkategorie', 'Beschreibung'];
    const rows = entries.map(entry => [
      format(new Date(entry.startTime), 'dd.MM.yyyy', { locale: de }),
      format(new Date(entry.startTime), 'HH:mm'),
      entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '-',
      formatDuration(entry.duration),
      getCategoryById(entry.categoryId)?.name || 'Unbekannt',
      getSubcategoryById(entry.subcategoryId)?.name || 'Unbekannt',
      entry.description || '',
    ]);

    const total = entries.reduce((acc, e) => acc + e.duration, 0);
    rows.push([]);
    rows.push(['=== ZUSAMMENFASSUNG ===']);
    rows.push(['Zeitraum:', periodLabel(period)]);
    rows.push(['Gesamtzeit:', formatHoursMinutes(total)]);
    rows.push(['Anzahl Einträge:', String(entries.length)]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeituebersicht_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const entries = selectedCategory ? detailEntries : filteredEntries;
    const total = entries.reduce((acc, e) => acc + e.duration, 0);

    // Group by category for summary
    const catTotals = new Map<string, number>();
    entries.forEach(e => catTotals.set(e.categoryId, (catTotals.get(e.categoryId) || 0) + e.duration));

    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Zeitübersicht</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 20px; color: #333; }
        h1 { color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; }
        h2 { color: #666; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
        th { background: #f5f5f5; font-weight: 600; }
        .summary { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #d1fae5; }
        .summary-total { font-weight: bold; font-size: 1.1em; color: #14b8a6; }
        .desc { color: #666; font-style: italic; max-width: 300px; }
      </style></head><body>
      <h1>Zeitübersicht – ${periodLabel(period)}</h1>
      <p>Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
      <div class="summary">
        <div class="summary-item summary-total"><span>Gesamtzeit:</span><span>${formatHoursMinutes(total)}</span></div>
        <div class="summary-item"><span>Einträge:</span><span>${entries.length}</span></div>
        ${Array.from(catTotals.entries()).map(([catId, time]) => {
          const cat = getCategoryById(catId);
          return `<div class="summary-item"><span>${cat?.name || 'Unbekannt'}</span><span>${formatHoursMinutes(time)}</span></div>`;
        }).join('')}
      </div>
      <h2>Einträge (${entries.length})</h2>
      <table><thead><tr><th>Datum</th><th>Start</th><th>Ende</th><th>Dauer</th><th>Kategorie</th><th>Unterkategorie</th><th>Beschreibung</th></tr></thead>
      <tbody>${entries.map(e => `<tr>
        <td>${format(new Date(e.startTime), 'dd.MM.yyyy', { locale: de })}</td>
        <td>${format(new Date(e.startTime), 'HH:mm')}</td>
        <td>${e.endTime ? format(new Date(e.endTime), 'HH:mm') : '-'}</td>
        <td>${formatDuration(e.duration)}</td>
        <td>${getCategoryById(e.categoryId)?.name || '-'}</td>
        <td>${getSubcategoryById(e.subcategoryId)?.name || '-'}</td>
        <td class="desc">${e.description || ''}</td>
      </tr>`).join('')}</tbody></table></body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(htmlContent); win.document.close(); win.print(); }
  };

  // DETAIL VIEW
  if (selectedCategory) {
    const cat = getCategoryById(selectedCategory);
    const sub = selectedSubcategory ? getSubcategoryById(selectedSubcategory) : null;

    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Zurück
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat?.color }} />
            <h1 className="text-xl lg:text-2xl font-bold">{cat?.name}{sub ? ` → ${sub.name}` : ''}</h1>
          </div>
          <span className="text-muted-foreground text-sm ml-auto font-mono">
            {formatHoursMinutes(detailTotalTime)} ({detailEntries.length} Einträge)
          </span>
        </div>

        {/* Period + Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Diese Woche</SelectItem>
              <SelectItem value="lastWeek">Letzte Woche</SelectItem>
              <SelectItem value="month">Dieser Monat</SelectItem>
              <SelectItem value="lastMonth">Letzter Monat</SelectItem>
              <SelectItem value="all">Gesamte Zeit</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Table className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Entry list */}
        <div className="space-y-2">
          {detailEntries.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Keine Einträge in diesem Zeitraum.</CardContent></Card>
          )}
          {detailEntries.map(entry => (
            <Card key={entry.id} className="overflow-hidden">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{format(new Date(entry.startTime), 'dd.MM.yyyy', { locale: de })}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(entry.startTime), 'HH:mm')} – {entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '...'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{getSubcategoryById(entry.subcategoryId)?.name}</span>
                      {entry.description && (
                        <span className="text-xs text-muted-foreground/70 truncate">– {entry.description}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold whitespace-nowrap">{formatDuration(entry.duration)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // OVERVIEW VIEW
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Timer className="w-6 h-6 text-primary" />
        <h1 className="text-xl lg:text-2xl font-bold">Zeitübersicht</h1>
        <span className="text-muted-foreground text-sm ml-auto font-mono">
          Gesamt: {formatHoursMinutes(totalTime)}
        </span>
      </div>

      {/* Period filter + Export */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Diese Woche</SelectItem>
            <SelectItem value="lastWeek">Letzte Woche</SelectItem>
            <SelectItem value="month">Dieser Monat</SelectItem>
            <SelectItem value="lastMonth">Letzter Monat</SelectItem>
            <SelectItem value="all">Gesamte Zeit</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Table className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-3">
        {categoryTimes.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Noch keine Zeiteinträge vorhanden.</CardContent></Card>
        )}

        {categoryTimes.map(({ category, totalSeconds, percentage, subcategories: subs }) => {
          const isExpanded = expandedCategories.has(category.id);
          return (
            <Card key={category.id} className="overflow-hidden">
              <div className="flex items-center">
                <button onClick={() => toggleCategory(category.id)} className="flex-1 text-left">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                        <CardTitle className="text-base">{category.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                        <span className="font-mono font-semibold text-sm">{formatHoursMinutes(totalSeconds)}</span>
                      </div>
                    </div>
                    <div className="mt-2 pl-7">
                      <Progress value={percentage} className="h-2" style={{ '--progress-background': category.color } as React.CSSProperties} />
                    </div>
                  </CardHeader>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-3 text-xs"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  Einträge →
                </Button>
              </div>

              {isExpanded && subs.length > 0 && (
                <CardContent className="pt-0 pb-4">
                  <div className="pl-7 space-y-2">
                    {subs.map(({ subcategory, totalSeconds: subSeconds, percentage: subPct }) => (
                      <button
                        key={subcategory.id}
                        onClick={() => { setSelectedCategory(category.id); setSelectedSubcategory(subcategory.id); }}
                        className="w-full flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 opacity-70" style={{ backgroundColor: category.color }} />
                          <span className="text-sm">{subcategory.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{subPct.toFixed(1)}%</span>
                          <span className="font-mono text-sm">{formatHoursMinutes(subSeconds)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
