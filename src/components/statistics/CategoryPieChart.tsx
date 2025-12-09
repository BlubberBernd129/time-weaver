import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { Category, Subcategory, TimeEntry } from '@/types/timetracker';
import { formatHoursMinutes } from '@/lib/timeUtils';

interface CategoryPieChartProps {
  stats: {
    totalTime: number;
    byCategory: {
      categoryId: string;
      categoryName: string;
      color: string;
      totalTime: number;
      subcategories?: {
        subcategoryId: string;
        subcategoryName: string;
        totalTime: number;
      }[];
    }[];
  };
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  categoryId: string;
  isSubcategory?: boolean;
  parentColor?: string;
}

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
      />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="currentColor" className="text-sm font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="currentColor" className="text-xs opacity-70">
        {formatHoursMinutes(value)}
      </text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="currentColor" className="text-xs opacity-50">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export function CategoryPieChart({ stats }: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const mainData: PieDataItem[] = stats.byCategory.map(cat => ({
    name: cat.categoryName,
    value: cat.totalTime,
    color: cat.color,
    categoryId: cat.categoryId,
  }));

  const selectedCategoryData = selectedCategory
    ? stats.byCategory.find(c => c.categoryId === selectedCategory)
    : null;

  const subcategoryData: PieDataItem[] = selectedCategoryData?.subcategories?.map((sub, index) => {
    const baseColor = selectedCategoryData.color;
    const opacity = 1 - (index * 0.15);
    return {
      name: sub.subcategoryName,
      value: sub.totalTime,
      color: baseColor,
      categoryId: selectedCategoryData.categoryId,
      isSubcategory: true,
      parentColor: baseColor,
    };
  }) || [];

  const handlePieClick = (data: PieDataItem, index: number) => {
    if (selectedCategory === data.categoryId) {
      setSelectedCategory(null);
    } else if (!data.isSubcategory) {
      setSelectedCategory(data.categoryId);
      setActiveIndex(0);
    }
  };

  const currentData = selectedCategory && subcategoryData.length > 0 ? subcategoryData : mainData;

  if (stats.byCategory.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground">Keine Daten für das Tortendiagramm vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-lg mb-4">
        {selectedCategory 
          ? `${selectedCategoryData?.categoryName} - Unterkategorien`
          : 'Zeitverteilung nach Kategorien'
        }
      </h3>
      
      {selectedCategory && (
        <button
          onClick={() => setSelectedCategory(null)}
          className="text-sm text-primary hover:underline mb-4 flex items-center gap-1"
        >
          ← Zurück zur Übersicht
        </button>
      )}

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={currentData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onClick={(data, index) => handlePieClick(data, index)}
              style={{ cursor: 'pointer' }}
            >
              {currentData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  opacity={entry.isSubcategory ? 1 - (index * 0.12) : 1}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        {currentData.map((entry, index) => (
          <button
            key={index}
            onClick={() => !entry.isSubcategory && handlePieClick(entry, index)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors text-sm"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: entry.color,
                opacity: entry.isSubcategory ? 1 - (index * 0.12) : 1
              }}
            />
            <span>{entry.name}</span>
          </button>
        ))}
      </div>

      {!selectedCategory && stats.byCategory.some(c => c.subcategories && c.subcategories.length > 0) && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Klicke auf eine Kategorie um die Unterkategorien zu sehen
        </p>
      )}
    </div>
  );
}
