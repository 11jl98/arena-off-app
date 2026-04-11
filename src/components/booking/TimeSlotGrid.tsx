import { cn } from '@/lib/utils';
import type { AvailableSlot } from '@/types/booking';

interface TimeSlotGridProps {
  slots: AvailableSlot[];
  selectedStartTime: string | null;
  onSelect: (slot: AvailableSlot) => void;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  slots,
  selectedStartTime,
  onSelect,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const isSelected = slot.startTime === selectedStartTime;
        return (
          <button
            key={slot.startTime}
            disabled={!slot.available}
            onClick={() => onSelect(slot)}
            className={cn(
              'flex flex-col items-center justify-center py-2.5 rounded-xl border text-sm font-medium transition-all duration-150',
              slot.available
                ? isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                  : 'bg-card border-border text-foreground active:scale-95'
                : 'bg-muted border-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            <span>{slot.startTime}</span>
            <span className="text-[10px] opacity-70">
              {slot.available ? 'Livre' : 'Ocupado'}
            </span>
          </button>
        );
      })}
    </div>
  );
};
