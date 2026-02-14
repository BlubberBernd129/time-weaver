import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';

interface StopTimerDescriptionDialogProps {
  open: boolean;
  onConfirm: (description: string) => void;
  categoryName: string;
  subcategoryName: string;
}

export function StopTimerDescriptionDialog({
  open,
  onConfirm,
  categoryName,
  subcategoryName,
}: StopTimerDescriptionDialogProps) {
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    onConfirm(description.trim());
    setDescription('');
  };

  const handleSkip = () => {
    onConfirm('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Was hast du gemacht?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            {categoryName} → {subcategoryName}
          </p>
          <Textarea
            placeholder="Beschreibe kurz deine Tätigkeit..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleConfirm();
              }
            }}
            className="min-h-[80px]"
            autoFocus
          />
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Überspringen
          </Button>
          <Button onClick={handleConfirm}>
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
