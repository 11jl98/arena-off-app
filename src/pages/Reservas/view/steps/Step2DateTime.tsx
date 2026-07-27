import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, ChevronRight, Sunrise, Sun, Moon, Clock, Info } from 'lucide-react';
import { BookingsService } from '@/services/bookings';
import { ArenaService } from '@/services/arena';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { cn } from '@/lib/utils';
import { getDurationInHours, formatDuration } from '@/utils/helpers/time.helper';
import type { AvailableSlot } from '@/types/booking';

const DAY_ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const PERIODS = [
  { label: 'Manhã', Icon: Sunrise, from: 6, to: 12 },
  { label: 'Tarde', Icon: Sun, from: 12, to: 18 },
  { label: 'Noite', Icon: Moon, from: 18, to: 24 },
] as const;

function isSlotInPast(slot: AvailableSlot, selectedDate: Date | null): boolean {
  if (!selectedDate || !isToday(selectedDate)) return false;
  const now = new Date();
  const [h, m] = slot.startTime.split(':').map(Number);
  const slotStart = new Date(selectedDate);
  slotStart.setHours(h, m, 0, 0);
  return now >= slotStart;
}

function handleSlotClick(
  slot: AvailableSlot,
  allSlots: AvailableSlot[],
  selectedSlots: AvailableSlot[],
  setSelectedSlots: (slots: AvailableSlot[]) => void,
  selectedDate: Date | null,
) {
  if (!slot.available) return;
  if (isSlotInPast(slot, selectedDate)) return;

  if (selectedSlots.length === 0) {
    setSelectedSlots([slot]);
    return;
  }

  const startIdx = allSlots.findIndex((s) => s.startTime === selectedSlots[0].startTime);
  const clickedIdx = allSlots.findIndex((s) => s.startTime === slot.startTime);

  if (clickedIdx === startIdx) {
    setSelectedSlots([slot]);
    return;
  }

  if (clickedIdx < startIdx) {
    setSelectedSlots([slot]);
    return;
  }

  const range = allSlots.slice(startIdx, clickedIdx + 1);
  const allAvailable = range.every((s) => s.available);
  setSelectedSlots(allAvailable ? range : [slot]);
}

export const Step2DateTime: React.FC = () => {
  const { selectedCourt, selectedDate, selectedSlots, setSelectedSlots, setSlotDuration, selectDate, goNext } =
    useBookingFlow();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));
  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const { data: settings } = useQuery({
    queryKey: ['arena-settings'],
    queryFn: () => ArenaService.getSettings(),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const slotDuration = settings?.slotDurationMinutes ?? 60;

  useEffect(() => {
    if (slotDuration) {
      setSlotDuration(slotDuration);
    }
  }, [slotDuration, setSlotDuration]);

  useEffect(() => {
    if (selectedSlots.some((s) => isSlotInPast(s, selectedDate))) {
      setSelectedSlots([]);
    }
  }, [selectedDate, selectedSlots, setSelectedSlots]);

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', selectedCourt?.id, dateStr],
    queryFn: () =>
      BookingsService.getAvailableSlots({
        courtId: selectedCourt!.id,
        date: dateStr!,
      }),
    enabled: !!selectedCourt && !!dateStr,
    staleTime: 0,
    refetchInterval: 30_000,
  });

  const allSlots = slots as AvailableSlot[];

  const hasPastSlots = useMemo(
    () => allSlots.some((s) => s.available && isSlotInPast(s, selectedDate)),
    [allSlots, selectedDate],
  );

  const canProceed = !!selectedDate && selectedSlots.length > 0;

  const lastSlot = selectedSlots[selectedSlots.length - 1];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">Escolha a data</p>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2">
          {days.map((day) => {
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            const isTodayDay = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => selectDate(day)}
                className={cn(
                  'shrink-0 flex flex-col items-center justify-center w-12 py-2 rounded-xl border transition-all duration-150 active:scale-95',
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground shadow-md'
                    : 'bg-card border-border text-foreground'
                )}
              >
                <span
                  className={cn(
                    'text-[10px] font-medium uppercase tracking-wide leading-none mb-1',
                    isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {DAY_ABBRS[day.getDay()]}
                </span>
                <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                <span
                  className={cn(
                    'text-[10px] mt-1 leading-none capitalize',
                    isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {format(day, 'MMM', { locale: ptBR })}
                </span>
                {isTodayDay && (
                  <div
                    className={cn(
                      'w-1 h-1 rounded-full mt-1.5',
                      isSelected ? 'bg-primary-foreground' : 'bg-primary'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSlots.length > 0 && lastSlot && (
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3.5 py-2.5">
          <Clock size={14} className="text-primary shrink-0" />
          <span className="text-sm font-semibold text-primary">
            {selectedSlots[0].startTime} → {lastSlot.endTime} · {formatDuration(getDurationInHours(selectedSlots))}
          </span>
          <span className="ml-auto text-xs text-primary/60">
            {selectedSlots.length === 1 ? 'Selecione mais para estender' : ''}
          </span>
          <button
            onClick={() => setSelectedSlots([])}
            className="text-xs text-primary/70 font-medium hover:text-primary transition-colors"
          >
            Limpar
          </button>
        </div>
      )}

      {selectedDate && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-1.5">
            <p className="text-sm font-semibold text-foreground">Horários</p>
            <span className="text-sm text-primary font-medium">
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>

          {hasPastSlots && (
            <div className="flex items-start gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
              <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Horários anteriores ao horário atual não estão disponíveis para reserva.
              </p>
            </div>
          )}

          {selectedSlots.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Toque no primeiro horário e depois no último para selecionar um intervalo.
            </p>
          )}

          {loadingSlots ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : allSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Nenhum horário disponível nesta data.
            </p>
          ) : (
            PERIODS.map(({ label, Icon, from, to }) => {
              const periodSlots = allSlots.filter((s) => {
                const h = parseInt(s.startTime.split(':')[0], 10);
                return h >= from && h < to;
              });
              if (periodSlots.length === 0) return null;
              return (
                <div key={label}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Icon size={13} className="text-muted-foreground" strokeWidth={2} />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {periodSlots.map((slot) => {
                      const isSelected = selectedSlots.some((s) => s.startTime === slot.startTime);
                      const isFirst =
                        selectedSlots.length > 0 &&
                        slot.startTime === selectedSlots[0].startTime;
                      const isLast = lastSlot && slot.startTime === lastSlot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          disabled={!slot.available || isSlotInPast(slot, selectedDate)}
                          onClick={() =>
                            handleSlotClick(slot, allSlots, selectedSlots, setSelectedSlots, selectedDate)
                          }
                          className={cn(
                            'flex flex-col items-center justify-center py-3 px-2 rounded-xl border font-semibold transition-all duration-150',
                            isSlotInPast(slot, selectedDate)
                              ? 'bg-muted/30 border-transparent text-muted-foreground/30 cursor-not-allowed'
                              : slot.available
                                ? isSelected
                                  ? isFirst || isLast
                                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                    : 'bg-primary/70 text-primary-foreground border-primary/50'
                                  : 'bg-card border-border text-foreground active:scale-95'
                                : 'bg-muted border-muted text-muted-foreground/40 cursor-not-allowed'
                          )}
                        >
                          <span className="text-sm tabular-nums">{slot.startTime}</span>
                          <span
                            className={cn(
                              'text-[10px] font-normal mt-0.5',
                              isSlotInPast(slot, selectedDate)
                                ? 'text-muted-foreground/30'
                                : isSelected
                                  ? 'text-primary-foreground/70'
                                  : slot.available
                                    ? 'text-muted-foreground'
                                    : 'text-muted-foreground/40'
                            )}
                          >
                            {isSlotInPast(slot, selectedDate)
                              ? 'Encerrado'
                              : slot.available
                                ? `até ${slot.endTime}`
                                : 'Ocupado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {canProceed && (
        <button
          onClick={goNext}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform shadow-md shadow-primary/20"
        >
          Continuar
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};

