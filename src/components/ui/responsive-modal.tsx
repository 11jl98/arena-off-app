import * as React from 'react';
import { X } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  contentClassName?: string;
  dialogClassName?: string;
  children: React.ReactNode;
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  open,
  onClose,
  title,
  contentClassName,
  dialogClassName,
  children,
}) => {
  const { isDesktop } = useDeviceDetection();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent
          className={cn(
            'p-0 gap-0 max-w-lg max-h-[90dvh] overflow-hidden flex flex-col',
            dialogClassName
          )}
        >
          {title && (
            <DialogHeader className="px-4 py-4 pr-12 border-b border-border shrink-0">
              <DialogTitle className="text-base">{title}</DialogTitle>
            </DialogHeader>
          )}
          <div className={cn('overflow-y-auto flex-1', contentClassName)}>
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[90dvh]">
        {title && (
          <DrawerHeader className="flex items-center justify-between pr-4 shrink-0">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
            <DrawerClose asChild>
              <button
                aria-label="Fechar"
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </DrawerClose>
          </DrawerHeader>
        )}
        <div className={cn('overflow-y-auto flex-1', contentClassName)}>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
