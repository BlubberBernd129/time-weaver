import { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';
import { formatHoursMinutes, formatDuration } from '@/lib/timeUtils';

interface ExportDialogProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
}

type ExportPeriod = 'week' | 'month' | 'lastWeek' | 'lastMonth' | 'all';
type ExportFormat = 'csv' | 'pdf';

export function ExportDialog({
  timeEntries,
  categories,
  subcategories,
}: ExportDialogProps) {
  const [period, setPeriod] = useState<ExportPeriod>('week');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dialogOpen, setDialogOpen] = useState(false);

  const getFilteredEntries = (): TimeEntry[] => {
    const now = new Date();
    let start: Date;
    let end: Date;

    // Filter out pause entries
    const activeEntries = timeEntries.filter(e => !e.isPause);

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
      case 'all':
        return activeEntries;
    }

    return activeEntries.filter(e => {
      const entryDate = new Date(e.startTime);
      return entryDate >= start && entryDate <= end;
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unbekannt';
  };

  const getSubcategoryName = (subcategoryId: string) => {
    return subcategories.find(s => s.id === subcategoryId)?.name || 'Unbekannt';
  };

  const exportCSV = () => {
    const entries = getFilteredEntries();
    
    const headers = ['Datum', 'Start', 'Ende', 'Dauer', 'Kategorie', 'Unterkategorie', 'Beschreibung'];
    const rows = entries.map(entry => [
      format(new Date(entry.startTime), 'dd.MM.yyyy', { locale: de }),
      format(new Date(entry.startTime), 'HH:mm'),
      entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '-',
      formatDuration(entry.duration),
      getCategoryName(entry.categoryId),
      getSubcategoryName(entry.subcategoryId),
      entry.description || '',
    ]);

    // Calculate totals by category
    const categoryTotals = new Map<string, number>();
    entries.forEach(entry => {
      const current = categoryTotals.get(entry.categoryId) || 0;
      categoryTotals.set(entry.categoryId, current + entry.duration);
    });

    const totalTime = entries.reduce((acc, e) => acc + e.duration, 0);

    // Add summary
    rows.push([]);
    rows.push(['=== ZUSAMMENFASSUNG ===']);
    rows.push(['Gesamtzeit:', formatHoursMinutes(totalTime)]);
    rows.push([]);
    rows.push(['Kategorie', 'Zeit']);
    
    categoryTotals.forEach((time, categoryId) => {
      rows.push([getCategoryName(categoryId), formatHoursMinutes(time)]);
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zeiterfassung_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setDialogOpen(false);
  };

  const exportPDF = () => {
    const entries = getFilteredEntries();
    
    // Calculate totals
    const categoryTotals = new Map<string, number>();
    entries.forEach(entry => {
      const current = categoryTotals.get(entry.categoryId) || 0;
      categoryTotals.set(entry.categoryId, current + entry.duration);
    });

    const totalTime = entries.reduce((acc, e) => acc + e.duration, 0);

    // Create HTML content for print
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Zeiterfassung Bericht</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 20px; color: #333; }
          h1 { color: #14b8a6; border-bottom: 2px solid #14b8a6; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: 600; }
          .summary { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .summary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1fae5; }
          .summary-total { font-weight: bold; font-size: 1.2em; color: #14b8a6; }
          .category-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        </style>
      </head>
      <body>
        <h1>Zeiterfassung Bericht</h1>
        <p>Erstellt am: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
        
        <div class="summary">
          <h2 style="margin-top: 0;">Zusammenfassung</h2>
          <div class="summary-item summary-total">
            <span>Gesamtzeit:</span>
            <span>${formatHoursMinutes(totalTime)}</span>
          </div>
          ${Array.from(categoryTotals.entries()).map(([categoryId, time]) => {
            const cat = categories.find(c => c.id === categoryId);
            return `
              <div class="summary-item">
                <span>
                  <span class="category-dot" style="background: ${cat?.color || '#888'}"></span>
                  ${getCategoryName(categoryId)}
                </span>
                <span>${formatHoursMinutes(time)}</span>
              </div>
            `;
          }).join('')}
        </div>
        
        <h2>Detaillierte Einträge (${entries.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Zeit</th>
              <th>Dauer</th>
              <th>Kategorie</th>
              <th>Unterkategorie</th>
            </tr>
          </thead>
          <tbody>
            ${entries.map(entry => `
              <tr>
                <td>${format(new Date(entry.startTime), 'dd.MM.yyyy', { locale: de })}</td>
                <td>${format(new Date(entry.startTime), 'HH:mm')} - ${entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '-'}</td>
                <td>${formatDuration(entry.duration)}</td>
                <td>${getCategoryName(entry.categoryId)}</td>
                <td>${getSubcategoryName(entry.subcategoryId)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
    setDialogOpen(false);
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportCSV();
    } else {
      exportPDF();
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daten exportieren</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Zeitraum</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as ExportPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Diese Woche</SelectItem>
                <SelectItem value="lastWeek">Letzte Woche</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="lastMonth">Letzter Monat</SelectItem>
                <SelectItem value="all">Alle Daten</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Format</label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (Drucken)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportieren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
