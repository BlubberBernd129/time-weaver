import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, FolderTree, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Category, Subcategory } from '@/types/timetracker';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#14b8a6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444',
  '#3b82f6', '#ec4899', '#06b6d4', '#f97316', '#6366f1',
];

interface CategoryManagerProps {
  categories: Category[];
  subcategories: Subcategory[];
  getSubcategoriesForCategory: (categoryId: string) => Subcategory[];
  onAddCategory: (name: string, color: string) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubcategory: (categoryId: string, name: string) => void;
  onUpdateSubcategory: (id: string, updates: Partial<Subcategory>) => void;
  onDeleteSubcategory: (id: string) => void;
}

export function CategoryManager({
  categories,
  subcategories,
  getSubcategoriesForCategory,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
}: CategoryManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addSubcategoryOpen, setAddSubcategoryOpen] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  
  // Rename state
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('');

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'subcategory'; id: string; name: string } | null>(null);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setNewCategoryColor(PRESET_COLORS[0]);
      setAddCategoryOpen(false);
    }
  };

  const handleAddSubcategory = (categoryId: string) => {
    if (newSubcategoryName.trim()) {
      onAddSubcategory(categoryId, newSubcategoryName.trim());
      setNewSubcategoryName('');
      setAddSubcategoryOpen(null);
    }
  };

  const confirmDelete = (type: 'category' | 'subcategory', id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategory(cat.id);
    setEditingCategoryName(cat.name);
  };

  const saveEditCategory = (id: string) => {
    if (editingCategoryName.trim()) {
      onUpdateCategory(id, { name: editingCategoryName.trim() });
    }
    setEditingCategory(null);
  };

  const startEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory(sub.id);
    setEditingSubcategoryName(sub.name);
  };

  const saveEditSubcategory = (id: string) => {
    if (editingSubcategoryName.trim()) {
      onUpdateSubcategory(id, { name: editingSubcategoryName.trim() });
    }
    setEditingSubcategory(null);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'category') {
      onDeleteCategory(itemToDelete.id);
    } else {
      onDeleteSubcategory(itemToDelete.id);
    }
    
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {itemToDelete?.type === 'category' ? 'Kategorie' : 'Unterkategorie'} löschen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'category' ? (
                <>
                  Möchtest du die Kategorie <strong>"{itemToDelete?.name}"</strong> wirklich löschen?
                  <br /><br />
                  <span className="text-destructive">
                    Alle zugehörigen Unterkategorien, Zeiteinträge und Ziele werden ebenfalls gelöscht!
                  </span>
                </>
              ) : (
                <>
                  Möchtest du die Unterkategorie <strong>"{itemToDelete?.name}"</strong> wirklich löschen?
                  <br /><br />
                  <span className="text-destructive">
                    Alle zugehörigen Zeiteinträge werden ebenfalls gelöscht!
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FolderTree className="w-6 h-6 text-primary" />
          <h1 className="text-xl lg:text-2xl font-bold">Kategorien</h1>
        </div>
        <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Neue Kategorie
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Neue Kategorie erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="z.B. Arbeit"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Farbe</Label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-lg transition-all",
                        newCategoryColor === color && "ring-2 ring-primary ring-offset-2 ring-offset-card"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategoryColor(color)}
                    />
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleAddCategory}>
                Kategorie erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((category) => {
          const subs = getSubcategoriesForCategory(category.id);
          const isExpanded = expandedCategories.has(category.id);

          return (
            <Collapsible
              key={category.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(category.id)}
            >
              <div className="glass-card overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-md"
                        style={{ backgroundColor: category.color }}
                      />
                      {editingCategory === category.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="bg-secondary border-border text-sm h-8 w-40"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditCategory(category.id);
                              if (e.key === 'Escape') setEditingCategory(null);
                            }}
                          />
                          <Button variant="ghost" size="iconSm" onClick={() => saveEditCategory(category.id)} className="text-primary">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="iconSm" onClick={() => setEditingCategory(null)} className="text-muted-foreground">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({subs.length} Unterkategorien)
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingCategory !== category.id && (
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditCategory(category);
                          }}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete('category', category.id, category.name);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border px-4 py-3 space-y-2 bg-secondary/20">
                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        {editingSubcategory === sub.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingSubcategoryName}
                              onChange={(e) => setEditingSubcategoryName(e.target.value)}
                              className="bg-secondary border-border text-sm h-8 flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditSubcategory(sub.id);
                                if (e.key === 'Escape') setEditingSubcategory(null);
                              }}
                            />
                            <Button variant="ghost" size="iconSm" onClick={() => saveEditSubcategory(sub.id)} className="text-primary">
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="iconSm" onClick={() => setEditingSubcategory(null)} className="text-muted-foreground">
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm">{sub.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => startEditSubcategory(sub)}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={() => confirmDelete('subcategory', sub.id, sub.name)}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Add Subcategory */}
                    {addSubcategoryOpen === category.id ? (
                      <div className="flex gap-2 pt-2">
                        <Input
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          placeholder="Unterkategorie..."
                          className="bg-secondary border-border text-sm h-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSubcategory(category.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddSubcategory(category.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => setAddSubcategoryOpen(category.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Unterkategorie hinzufügen
                      </Button>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {categories.length === 0 && (
          <div className="glass-card p-12 text-center">
            <FolderTree className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Noch keine Kategorien vorhanden. Erstelle deine erste Kategorie!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
