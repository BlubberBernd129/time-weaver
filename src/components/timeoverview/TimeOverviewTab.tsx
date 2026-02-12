import { useMemo, useState } from 'react';
import { Timer, ChevronDown, ChevronRight } from 'lucide-react';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes } from '@/lib/timeUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimeOverviewTabProps {
  timeEntries: TimeEntry[];
  categories: Category[];
  subcategories: Subcategory[];
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
}

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

  const categoryTimes = useMemo(() => {
    const activeEntries = timeEntries.filter(e => !e.isPause && e.duration > 0);
    const totalAll = activeEntries.reduce((sum, e) => sum + e.duration, 0);

    const catMap = new Map<string, { total: number; subs: Map<string, number> }>();

    activeEntries.forEach(entry => {
      if (!catMap.has(entry.categoryId)) {
        catMap.set(entry.categoryId, { total: 0, subs: new Map() });
      }
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
          return {
            subcategory,
            totalSeconds: seconds,
            percentage: data.total > 0 ? (seconds / data.total) * 100 : 0,
          };
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
  }, [timeEntries, getCategoryById, getSubcategoryById]);

  const totalTime = useMemo(
    () => categoryTimes.reduce((sum, c) => sum + c.totalSeconds, 0),
    [categoryTimes]
  );

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Timer className="w-6 h-6 text-primary" />
        <h1 className="text-xl lg:text-2xl font-bold">Zeitübersicht</h1>
        <span className="text-muted-foreground text-sm ml-auto font-mono">
          Gesamt: {formatHoursMinutes(totalTime)}
        </span>
      </div>

      {/* Category Cards */}
      <div className="space-y-3">
        {categoryTimes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Noch keine Zeiteinträge vorhanden.
            </CardContent>
          </Card>
        )}

        {categoryTimes.map(({ category, totalSeconds, percentage, subcategories: subs }) => {
          const isExpanded = expandedCategories.has(category.id);

          return (
            <Card key={category.id} className="overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full text-left"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                      <span className="font-mono font-semibold text-sm">
                        {formatHoursMinutes(totalSeconds)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pl-7">
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={{ '--progress-background': category.color } as React.CSSProperties}
                    />
                  </div>
                </CardHeader>
              </button>

              {isExpanded && subs.length > 0 && (
                <CardContent className="pt-0 pb-4">
                  <div className="pl-7 space-y-2">
                    {subs.map(({ subcategory, totalSeconds: subSeconds, percentage: subPct }) => (
                      <div key={subcategory.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 opacity-70"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{subcategory.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {subPct.toFixed(1)}%
                          </span>
                          <span className="font-mono text-sm">
                            {formatHoursMinutes(subSeconds)}
                          </span>
                        </div>
                      </div>
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
