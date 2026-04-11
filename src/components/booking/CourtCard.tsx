import { Shield, Zap, Users, ChevronRight } from 'lucide-react';
import type { Court } from '@/types/court';
import { cn } from '@/lib/utils';

interface CourtCardProps {
  court: Court;
  onSelect: (court: Court) => void;
  className?: string;
}

export const CourtCard: React.FC<CourtCardProps> = ({ court, onSelect, className }) => {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl overflow-hidden shadow-sm',
        className
      )}
    >
      {/* Header accent */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-base leading-tight truncate">
            {court.name}
          </h3>
          {court.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {court.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground leading-none mb-0.5">por hora</p>
          <p className="text-xl font-bold text-primary">
            {court.pricePerHour.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          {court.covered && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 rounded-full px-2.5 py-0.5">
              <Shield size={11} />
              Coberta
            </span>
          )}
          {court.lighting && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 rounded-full px-2.5 py-0.5">
              <Zap size={11} />
              Iluminada
            </span>
          )}
          {court.maxCapacity > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
              <Users size={11} />
              {court.maxCapacity} jogadores
            </span>
          )}
        </div>

        <button
          onClick={() => onSelect(court)}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-transform"
        >
          Selecionar quadra
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

