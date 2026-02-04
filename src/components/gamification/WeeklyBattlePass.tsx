import { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { X, Trophy, Star, Gem, Crown, Zap, Target, Award, Medal, Flame, Rocket, Gift, Heart, Shield, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Category, TimeEntry } from '@/types/timetracker';
import { getEntriesForWeek, formatHoursMinutes } from '@/lib/timeUtils';
import { cn } from '@/lib/utils';

interface WeeklyBattlePassProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeEntries: TimeEntry[];
  categories: Category[];
  collectedItems: number[];
  onCollectItem: (itemIndex: number) => void;
}

// Reward items with icons and colors
const REWARD_ITEMS = [
  { icon: Star, color: '#FFD700', name: 'Stern' },
  { icon: Gem, color: '#9B59B6', name: 'Edelstein' },
  { icon: Crown, color: '#F39C12', name: 'Krone' },
  { icon: Zap, color: '#3498DB', name: 'Blitz' },
  { icon: Target, color: '#E74C3C', name: 'Ziel' },
  { icon: Award, color: '#1ABC9C', name: 'Auszeichnung' },
  { icon: Medal, color: '#E67E22', name: 'Medaille' },
  { icon: Flame, color: '#FF6B6B', name: 'Flamme' },
  { icon: Rocket, color: '#5DADE2', name: 'Rakete' },
  { icon: Gift, color: '#FF69B4', name: 'Geschenk' },
  { icon: Heart, color: '#E91E63', name: 'Herz' },
  { icon: Shield, color: '#607D8B', name: 'Schild' },
  { icon: Sparkles, color: '#00BCD4', name: 'Funken' },
  { icon: Trophy, color: '#FFD700', name: 'Pokal' },
];

// Generate reward milestones
// 0-40h: every 5h (0, 5, 10, 15, 20, 25, 30, 35, 40)
// 40h+: every 1h (41, 42, 43, ...)
function generateMilestones(): number[] {
  const milestones: number[] = [];
  
  // Every 5 hours up to 40
  for (let h = 5; h <= 40; h += 5) {
    milestones.push(h);
  }
  
  // Every 1 hour from 41 to 80
  for (let h = 41; h <= 80; h++) {
    milestones.push(h);
  }
  
  return milestones;
}

const MILESTONES = generateMilestones();

export function WeeklyBattlePass({
  open,
  onOpenChange,
  timeEntries,
  categories,
  collectedItems,
  onCollectItem,
}: WeeklyBattlePassProps) {
  const currentDate = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
  const rewardTrackRef = useRef<HTMLDivElement>(null);

  // Get this week's entries (excluding pauses)
  const weekEntries = getEntriesForWeek(timeEntries.filter(e => !e.isPause), currentDate);
  const totalSeconds = weekEntries.reduce((acc, e) => acc + e.duration, 0);
  const totalHours = totalSeconds / 3600;

  // Calculate category stats
  const categoryStats = categories.map(cat => {
    const catEntries = weekEntries.filter(e => e.categoryId === cat.id);
    const catTime = catEntries.reduce((acc, e) => acc + e.duration, 0);
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      color: cat.color,
      totalTime: catTime,
      percentage: totalSeconds > 0 ? (catTime / totalSeconds) * 100 : 0
    };
  }).filter(c => c.totalTime > 0).sort((a, b) => b.totalTime - a.totalTime);

  // Find which items can be collected (reached but not yet collected)
  const reachableMilestones = MILESTONES.filter(h => totalHours >= h);
  const collectableItems = reachableMilestones.map((_, idx) => idx).filter(idx => !collectedItems.includes(idx));

  // Auto-collect new items when dialog opens
  useEffect(() => {
    if (open && collectableItems.length > 0) {
      collectableItems.forEach(idx => onCollectItem(idx));
    }
  }, [open, totalHours]);

  // Scroll to current progress position (75% from left edge)
  useEffect(() => {
    if (open && rewardTrackRef.current && totalHours > 0) {
      const container = rewardTrackRef.current;
      const progressPercent = Math.min(totalHours / 80, 1);
      const scrollableWidth = container.scrollWidth - container.clientWidth;
      // Scroll so the progress point is at 75% from left edge
      const targetScroll = (progressPercent * container.scrollWidth) - (container.clientWidth * 0.75);
      container.scrollLeft = Math.max(0, Math.min(targetScroll, scrollableWidth));
    }
  }, [open, totalHours]);

  // Item dimensions - larger spacing for better alignment
  const ITEM_WIDTH = 56; // w-14 = 56px
  const SPACING_LARGE = 40; // gap for ≤40h milestones
  const SPACING_SMALL = 16; // gap for >40h milestones

  // Calculate exact position for progress indicator (aligned to center of items)
  const getProgressPosition = () => {
    let position = ITEM_WIDTH / 2; // Start at center of first item
    
    for (let i = 0; i < MILESTONES.length; i++) {
      const hours = MILESTONES[i];
      const prevHours = i > 0 ? MILESTONES[i - 1] : 0;
      const spacing = hours <= 40 ? SPACING_LARGE : SPACING_SMALL;
      const segmentWidth = ITEM_WIDTH + spacing;
      
      if (totalHours < hours) {
        // Calculate partial position within this segment
        const segmentProgress = (totalHours - prevHours) / (hours - prevHours);
        return position + segmentWidth * segmentProgress - ITEM_WIDTH / 2;
      }
      
      position += segmentWidth;
    }
    
    return position - ITEM_WIDTH / 2;
  };

  // Get spacing class for milestone
  const getSpacingClass = (hours: number) => {
    return hours <= 40 ? 'mr-10' : 'mr-4';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span>Wochen Battle Pass</span>
              <p className="text-sm font-normal text-muted-foreground">
                KW {weekNumber} • {format(weekStart, 'dd.MM.')} - {format(weekEnd, 'dd.MM.yyyy', { locale: de })}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-6">
          {/* Total Progress Header */}
          <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-secondary/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtzeit diese Woche</p>
                <p className="text-4xl font-bold text-primary">{formatHoursMinutes(totalSeconds)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Items gesammelt</p>
                <p className="text-4xl font-bold text-secondary">
                  {collectedItems.length} <span className="text-lg text-muted-foreground">/ {MILESTONES.length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Category Battle Pass Bars */}
          <div className="space-y-3 flex-shrink-0">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Kategorien Fortschritt
            </h3>
            
            {categoryStats.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">Starte deinen Timer um Fortschritt zu sehen!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {categoryStats.map((cat, index) => (
                  <div
                    key={cat.categoryId}
                    className="glass-card p-3 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium flex-shrink-0 w-32 truncate">{cat.categoryName}</span>
                      <div className="flex-1 relative h-6 bg-secondary/30 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                            minWidth: cat.percentage > 0 ? '40px' : '0',
                          }}
                        >
                          {cat.percentage >= 10 && (
                            <span className="text-xs font-bold text-white drop-shadow">
                              {Math.round(cat.percentage)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-sm w-16 text-right flex-shrink-0">
                        {formatHoursMinutes(cat.totalTime)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reward Track - Only this section scrolls horizontally */}
          <div className="space-y-3 flex-shrink-0">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-secondary" />
              Belohnungs-Schiene
            </h3>
            
            <div 
              ref={rewardTrackRef}
              className="glass-card p-4 overflow-x-auto scrollbar-thin"
            >
              <div className="relative min-w-max">
                {/* Progress line with dot endpoint */}
                <div className="absolute top-1/2 left-0 h-2 bg-secondary/30 rounded-full -translate-y-1/2" style={{ width: 'calc(100% - 24px)' }}>
                  {/* Progress fill with dot end */}
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary rounded-l-full transition-none relative"
                    style={{ 
                      width: `${getProgressPosition()}px`,
                      maxWidth: '100%',
                    }}
                  >
                    {/* Dot endpoint */}
                    <div 
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50 border-2 border-primary-foreground"
                    />
                  </div>
                </div>
                
                {/* Milestone items */}
                <div className="relative flex items-center py-8">
                  {MILESTONES.map((hours, idx) => {
                    const isReached = totalHours >= hours;
                    const isCollected = collectedItems.includes(idx);
                    const reward = REWARD_ITEMS[idx % REWARD_ITEMS.length];
                    const RewardIcon = reward.icon;
                    
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-col items-center group relative",
                          getSpacingClass(hours)
                        )}
                      >
                        <div
                          className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 border-2",
                            isCollected
                              ? "bg-gradient-to-br from-primary to-secondary border-primary/50 shadow-lg shadow-primary/30 scale-110"
                              : isReached
                                ? "bg-primary/20 border-primary/50 animate-pulse cursor-pointer hover:scale-110"
                                : "bg-secondary/20 border-secondary/30 opacity-50"
                          )}
                          onClick={() => {
                            if (isReached && !isCollected) {
                              onCollectItem(idx);
                            }
                          }}
                        >
                          <RewardIcon
                            className={cn(
                              "w-6 h-6 transition-colors",
                              isCollected ? "text-primary-foreground" : isReached ? "text-primary" : "text-muted-foreground"
                            )}
                            style={{ color: isCollected ? reward.color : undefined }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs mt-2 font-medium",
                          isReached ? "text-primary" : "text-muted-foreground"
                        )}>
                          {hours}h
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                            {reward.name}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{weekEntries.length}</p>
              <p className="text-xs text-muted-foreground">Einträge</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-secondary">{categoryStats.length}</p>
              <p className="text-xs text-muted-foreground">Kategorien</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-primary">{Math.round(totalHours * 10) / 10}h</p>
              <p className="text-xs text-muted-foreground">Stunden</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-secondary">
                {collectedItems.length > 0 ? Math.round((collectedItems.length / MILESTONES.length) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
