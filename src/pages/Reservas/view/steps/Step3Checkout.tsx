import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2,
  CreditCard,
  Banknote,
  ChevronLeft,
  Tag,
  Wallet,
  CalendarDays,
  Clock,
  MapPin,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { CashbackService } from '@/services/cashback';
import { PromotionsService } from '@/services/promotions';
import { BookingsService } from '@/services/bookings';
import { CourtsService } from '@/services/courts';
import { PaymentsService } from '@/services/payments';
import { useUserStore } from '@/store/userStore';
import { useNotify } from '@/hooks/useNotify';
import { cn } from '@/lib/utils';
import type { AppliedPromotion } from '@/types/promotion';
import type { PaymentMethod } from '@/types/booking';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PROMOTION_TYPE_LABELS: Record<string, string> = {
  SPECIAL_HOURS: 'Horário especial',
  HOURS_COMBO: 'Combo de horas',
  FIRST_BOOKING: 'Primeira reserva',
  BIRTHDAY: 'Aniversário',
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDaysOfWeek(days?: number[]): string {
  if (!days || days.length === 0) return '';
  if (days.length === 7) return 'Todos os dias';
  const sorted = [...days].sort((a, b) => a - b);
  const isConsecutive = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  if (isConsecutive && sorted.length >= 3) {
    return `${DAY_NAMES[sorted[0]]} a ${DAY_NAMES[sorted[sorted.length - 1]]}`;
  }
  return sorted.map((d) => DAY_NAMES[d]).join(', ');
}

function formatSpecialHoursDetail(promo: { startTime?: string; endTime?: string; daysOfWeek?: number[] }): string {
  const parts: string[] = [];
  if (promo.startTime && promo.endTime) {
    parts.push(`${promo.startTime} – ${promo.endTime}`);
  }
  const days = formatDaysOfWeek(promo.daysOfWeek);
  if (days) parts.push(days);
  return parts.join(' · ');
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export const Step3Checkout: React.FC = () => {
  const {
    selectedCourt,
    selectedDate,
    selectedSlots,
    selectedSport,
    setSport,
    cashbackAmount,
    setCashbackAmount,
    paymentMethod,
    setPaymentMethod,
    setCreatedBooking,
    goBack,
  } = useBookingFlow();

  const currentUser = useUserStore((s) => s.user);
  const { error: showError } = useNotify();
  const queryClient = useQueryClient();
  const [redirecting, setRedirecting] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [showPromoList, setShowPromoList] = useState(false);

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const startTime = selectedSlots[0]?.startTime ?? '';
  const endTime = selectedSlots[selectedSlots.length - 1]?.endTime ?? '';
  const hours = selectedSlots.length || 1;

  const basePriceReais = (selectedCourt?.pricePerHour ?? 0) * hours;

  const { data: sports = [] } = useQuery({
    queryKey: ['sports'],
    queryFn: CourtsService.listSports,
    staleTime: 5 * 60 * 1000,
  });

  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'EMPLOYEE';

  const { data: wallet } = useQuery({
    queryKey: ['cashback-wallet', isStaff ? currentUser?.id : undefined],
    queryFn: () => CashbackService.getWallet(isStaff ? currentUser?.id : undefined),
    enabled: !!currentUser,
    staleTime: 30 * 1000,
  });

  const { data: availablePromos = [], isLoading: loadingPromos } = useQuery({
    queryKey: ['promos-available', dateStr, startTime, endTime, basePriceReais],
    queryFn: () =>
      PromotionsService.checkAll({
        date: dateStr,
        startTime,
        endTime,
        basePrice: basePriceReais,
        hours,
        clientId: currentUser!.id,
      }),
    enabled: !!dateStr && !!startTime && !!currentUser && basePriceReais > 0,
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => BookingsService.listMyBookings({ pageSize: 50 }),
    enabled: !!currentUser,
    staleTime: 60 * 1000,
  });

  const hasExistingBookings = myBookings.some(
    (b) => b.clientId === currentUser?.id && b.status !== 'CANCELLED'
  );

  const filteredPromos = availablePromos.filter((p) => {
    if (p.promotion.type === 'FIRST_BOOKING' && hasExistingBookings) return false;

    // SPECIAL_HOURS: booking must cover the full promotional window.
    // e.g. promo 17:00–20:00 = 3h window → booking of only 2h must NOT get this promo.
    if (
      p.promotion.type === 'SPECIAL_HOURS' &&
      p.promotion.startTime &&
      p.promotion.endTime
    ) {
      const promoWindowHours =
        (timeToMinutes(p.promotion.endTime) - timeToMinutes(p.promotion.startTime)) / 60;
      if (hours < promoWindowHours) return false;
    }

    return true;
  });

  const activePromo: AppliedPromotion | null =
    selectedPromoId === ''
      ? null
      : selectedPromoId
        ? (filteredPromos.find((p) => p.promotion.id === selectedPromoId) ?? filteredPromos[0] ?? null)
        : filteredPromos[0] ?? null;

  const discountAmount = activePromo?.discountAmount ?? 0;
  const priceAfterPromo = activePromo?.finalPrice ?? basePriceReais;
  const walletBalance = wallet?.balance ?? 0;
  const maxCashback = Math.max(0, Math.min(walletBalance, priceAfterPromo - 0.01));
  const safeCashback = Math.min(cashbackAmount, maxCashback);
  const finalPrice = priceAfterPromo - safeCashback;

  const { mutate: confirmBooking, isPending } = useMutation({
    mutationFn: async () => {
      const booking = await BookingsService.createBooking({
        courtId: selectedCourt!.id,
        clientId: currentUser!.id,
        sportId: selectedSport!.id,
        date: dateStr,
        startTime,
        endTime,
        promotionId: activePromo?.promotion.id,
        cashbackUsed: safeCashback,
        paymentMethod,
      });

      if (paymentMethod === 'MERCADO_PAGO') {
        setRedirecting(true);
        const pref = await PaymentsService.createMercadoPagoPreference(booking.id);
        window.location.href = pref.checkoutUrl;
        return booking;
      }

      return booking;
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
      if (paymentMethod !== 'MERCADO_PAGO') {
        setCreatedBooking(booking);
      }
    },
    onError: (err: Error) => {
      setRedirecting(false);
      showError(err.message || 'Erro ao criar reserva. Tente novamente.');
    },
  });

  const isLoading = isPending || redirecting;

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-3">
        <h3 className="font-semibold text-foreground text-sm mb-1">Resumo da reserva</h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={14} className="text-primary shrink-0" />
          <span className="font-medium text-foreground">{selectedCourt?.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays size={14} className="text-primary shrink-0" />
          <span>{selectedDate && format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={14} className="text-primary shrink-0" />
          <span>
            {startTime} – {endTime} ({hours}h)
          </span>
        </div>
        {selectedSport && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Dumbbell size={14} className="text-primary shrink-0" />
            <span>{selectedSport.icon && <span className="mr-1">{selectedSport.icon}</span>}{selectedSport.name}</span>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-3">
        <h3 className="font-semibold text-sm text-foreground">Qual esporte você vai jogar?</h3>
        <div className="flex flex-wrap gap-2">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSport(sport)}
              className={cn(
                'px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-95',
                selectedSport?.id === sport.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-muted border-transparent text-foreground'
              )}
            >
              {sport.icon && <span className="mr-1.5">{sport.icon}</span>}
              {sport.name}
            </button>
          ))}
        </div>
        {!selectedSport && (
          <p className="text-xs text-muted-foreground">Selecione um esporte para continuar</p>
        )}
      </div>

      {loadingPromos && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <Loader2 size={12} className="animate-spin" />
          Verificando promoções disponíveis...
        </div>
      )}

      {!loadingPromos && filteredPromos.length === 0 && !!startTime && (
        <div className="bg-muted/50 border border-border rounded-2xl p-3.5 flex items-center gap-3">
          <Tag size={15} className="text-muted-foreground shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Nenhuma promoção disponível</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Este horário não está coberto por nenhuma promoção ativa.
            </p>
          </div>
        </div>
      )}

      {!loadingPromos && filteredPromos.length === 1 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-start gap-3">
          <Gift size={16} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              {filteredPromos[0].promotion.name}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {PROMOTION_TYPE_LABELS[filteredPromos[0].promotion.type] ?? filteredPromos[0].promotion.type}
              {filteredPromos[0].promotion.discountPercent
                ? ` · ${filteredPromos[0].promotion.discountPercent}% de desconto`
                : ''}
              {filteredPromos[0].extraHours
                ? ` · +${filteredPromos[0].extraHours}h extra`
                : ''}
            </p>
            {filteredPromos[0].promotion.type === 'SPECIAL_HOURS' && (
              <p className="text-xs text-green-500 dark:text-green-500 mt-0.5">
                {formatSpecialHoursDetail(filteredPromos[0].promotion)}
              </p>
            )}
          </div>
          <span className="text-xs font-bold text-green-600 dark:text-green-400 shrink-0">
            -{fmt(filteredPromos[0].discountAmount)}
          </span>
        </div>
      )}

      {!loadingPromos && filteredPromos.length > 1 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowPromoList((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground active:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-primary" />
              {activePromo
                ? <span>Promoção: <span className="text-primary">{activePromo.promotion.name}</span></span>
                : <span className="text-muted-foreground">Sem promoção</span>
              }
            </div>
            {showPromoList ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showPromoList && (
            <div className="border-t border-border flex flex-col divide-y divide-border">
              {filteredPromos.map((p) => {
                const isActive = activePromo?.promotion.id === p.promotion.id;
                return (
                  <button
                    key={p.promotion.id}
                    onClick={() => {
                      setSelectedPromoId(p.promotion.id);
                      setShowPromoList(false);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                      isActive ? 'bg-primary/5' : 'hover:bg-muted/50'
                    )}
                  >
                    <CheckCircle2
                      size={16}
                      className={cn(
                        'mt-0.5 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground/30'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold', isActive ? 'text-primary' : 'text-foreground')}>
                        {p.promotion.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {PROMOTION_TYPE_LABELS[p.promotion.type] ?? p.promotion.type}
                        {p.promotion.discountPercent ? ` · ${p.promotion.discountPercent}%` : ''}
                        {p.extraHours ? ` · +${p.extraHours}h extra` : ''}
                      </p>
                      {p.promotion.type === 'SPECIAL_HOURS' && (
                        <p className="text-xs text-muted-foreground/70">
                          {formatSpecialHoursDetail(p.promotion)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 shrink-0 mt-0.5">
                      -{fmt(p.discountAmount)}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  setSelectedPromoId('');
                  setShowPromoList(false);
                }}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                  selectedPromoId === '' ? 'bg-primary/5' : 'hover:bg-muted/50'
                )}
              >
                <CheckCircle2
                  size={16}
                  className={cn(
                    'mt-0.5 shrink-0',
                    selectedPromoId === '' ? 'text-primary' : 'text-muted-foreground/30'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', selectedPromoId === '' ? 'text-primary' : 'text-foreground')}>
                    Sem promoção
                  </p>
                  <p className="text-xs text-muted-foreground">Pagar preço cheio</p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2.5">
        <h3 className="font-semibold text-foreground text-sm mb-1">Detalhamento do valor</h3>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Valor base ({hours}h × {fmt(selectedCourt?.pricePerHour ?? 0)})
          </span>
          <span>{fmt(basePriceReais)}</span>
        </div>

        {discountAmount > 0 && activePromo && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Tag size={12} />
              {activePromo.promotion.name}
              {activePromo.promotion.discountPercent
                ? ` (${activePromo.promotion.discountPercent}%)`
                : ''}
            </span>
            <span className="text-green-600 dark:text-green-400">- {fmt(discountAmount)}</span>
          </div>
        )}

        {safeCashback > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-secondary-foreground">
              <Wallet size={12} />
              Cashback utilizado
            </span>
            <span className="text-orange-500">- {fmt(safeCashback)}</span>
          </div>
        )}

        <div className="border-t border-border pt-2 flex justify-between font-bold">
          <span className="text-foreground">Total</span>
          <span className="text-primary text-lg">{fmt(finalPrice)}</span>
        </div>
      </div>

      {walletBalance > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Usar cashback</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Disponível: {fmt(walletBalance)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxCashback}
            step={0.01}
            value={safeCashback}
            onChange={(e) => setCashbackAmount(Number(e.target.value))}
            className="w-full accent-primary mb-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>R$ 0,00</span>
            <span className="font-medium text-foreground">{fmt(safeCashback)}</span>
            <span>{fmt(maxCashback)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Forma de pagamento</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: 'MERCADO_PAGO', icon: CreditCard, label: 'Mercado Pago' },
              { value: 'PRESENCIAL', icon: Banknote, label: 'Presencial' },
            ] as { value: PaymentMethod; icon: React.FC<{ size?: number }>; label: string }[]
          ).map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setPaymentMethod(value)}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl border text-sm font-medium transition-all duration-150',
                paymentMethod === value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border text-muted-foreground'
              )}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={goBack}
          disabled={isLoading}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground disabled:opacity-50"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        <button
          onClick={() => confirmBooking()}
          disabled={isLoading || !selectedSport}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {redirecting ? 'Redirecionando...' : 'Processando...'}
            </>
          ) : (
            'Confirmar reserva'
          )}
        </button>
      </div>
    </div>
  );
};
