import { Trophy, Star, Gem, Crown, Zap, Target, Award, Medal, Flame, Rocket, Gift, Heart, Shield, Sparkles, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CollectionTabProps {
  collectedItems: number[];
  totalPossibleItems: number;
}

// Same reward items as in WeeklyBattlePass
const REWARD_ITEMS = [
  { icon: Star, color: '#FFD700', name: 'Stern', description: 'Erreicht nach 5 Stunden Arbeit' },
  { icon: Gem, color: '#9B59B6', name: 'Edelstein', description: 'Erreicht nach 10 Stunden Arbeit' },
  { icon: Crown, color: '#F39C12', name: 'Krone', description: 'Erreicht nach 15 Stunden Arbeit' },
  { icon: Zap, color: '#3498DB', name: 'Blitz', description: 'Erreicht nach 20 Stunden Arbeit' },
  { icon: Target, color: '#E74C3C', name: 'Ziel', description: 'Erreicht nach 25 Stunden Arbeit' },
  { icon: Award, color: '#1ABC9C', name: 'Auszeichnung', description: 'Erreicht nach 30 Stunden Arbeit' },
  { icon: Medal, color: '#E67E22', name: 'Medaille', description: 'Erreicht nach 35 Stunden Arbeit' },
  { icon: Flame, color: '#FF6B6B', name: 'Flamme', description: 'Erreicht nach 40 Stunden Arbeit' },
  { icon: Rocket, color: '#5DADE2', name: 'Rakete', description: 'Bonus-Item' },
  { icon: Gift, color: '#FF69B4', name: 'Geschenk', description: 'Bonus-Item' },
  { icon: Heart, color: '#E91E63', name: 'Herz', description: 'Bonus-Item' },
  { icon: Shield, color: '#607D8B', name: 'Schild', description: 'Bonus-Item' },
  { icon: Sparkles, color: '#00BCD4', name: 'Funken', description: 'Bonus-Item' },
  { icon: Trophy, color: '#FFD700', name: 'Pokal', description: 'Ultimate Belohnung' },
];

// Count how many of each item type collected
function countItems(collectedItems: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  
  collectedItems.forEach(idx => {
    const itemType = idx % REWARD_ITEMS.length;
    counts.set(itemType, (counts.get(itemType) || 0) + 1);
  });
  
  return counts;
}

export function CollectionTab({ collectedItems, totalPossibleItems }: CollectionTabProps) {
  const itemCounts = countItems(collectedItems);
  const uniqueItems = new Set(collectedItems.map(idx => idx % REWARD_ITEMS.length)).size;
  
  // Calculate rarity (how many times each type can appear in full track)
  const totalMilestones = totalPossibleItems;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">Sammlung</h1>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{collectedItems.length}</p>
            <p className="text-sm text-muted-foreground">Gesammelt</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">{uniqueItems}</p>
            <p className="text-sm text-muted-foreground">Verschiedene</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{REWARD_ITEMS.length}</p>
            <p className="text-sm text-muted-foreground">Item-Typen</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-primary/5 border-secondary/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {collectedItems.length > 0 ? Math.round((collectedItems.length / totalMilestones) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Fortschritt</p>
          </CardContent>
        </Card>
      </div>

      {/* Collection Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Deine Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {REWARD_ITEMS.map((item, itemType) => {
              const count = itemCounts.get(itemType) || 0;
              const isCollected = count > 0;
              const ItemIcon = item.icon;
              
              return (
                <div
                  key={itemType}
                  className={cn(
                    "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-300",
                    isCollected
                      ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 shadow-lg"
                      : "bg-secondary/5 border-secondary/20 opacity-40"
                  )}
                >
                  {/* Count badge */}
                  {count > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                      {count}
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-2 transition-all",
                      isCollected
                        ? "bg-gradient-to-br from-primary/20 to-secondary/20"
                        : "bg-secondary/10"
                    )}
                  >
                    <ItemIcon
                      className="w-8 h-8"
                      style={{ color: isCollected ? item.color : 'currentColor' }}
                    />
                  </div>
                  
                  <span className={cn(
                    "font-medium text-sm text-center",
                    !isCollected && "text-muted-foreground"
                  )}>
                    {item.name}
                  </span>
                  
                  {isCollected && (
                    <span className="text-xs text-muted-foreground mt-1">
                      {count}x gesammelt
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Collections */}
      {collectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Letzte Sammlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {collectedItems.slice(-20).reverse().map((idx, i) => {
                const item = REWARD_ITEMS[idx % REWARD_ITEMS.length];
                const ItemIcon = item.icon;
                
                return (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <ItemIcon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {collectedItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Items gesammelt</h3>
            <p className="text-muted-foreground">
              Starte den Timer und sammle Zeit um deine ersten Belohnungen freizuschalten!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
