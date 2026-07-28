import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface DualCashbackOnboardingProps {
  open: boolean;
  onClose: () => void;
}

const ONBOARDING_KEY = 'dual_cashback_onboarding_seen';

export function hasSeenDualCashbackOnboarding(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function markDualCashbackOnboardingSeen(): void {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

export const DualCashbackOnboarding: React.FC<DualCashbackOnboardingProps> = ({ open, onClose }) => {
  const handleClose = () => {
    markDualCashbackOnboardingSeen();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-6 gap-6">
        <DialogTitle className="text-center sr-only">Novidade! Cashback dual</DialogTitle>

        <div className="flex flex-col items-center gap-4 text-center">
          <h3 className="text-lg font-bold text-foreground">Novidade!</h3>
          <p className="text-sm text-muted-foreground">
            Agora você pode escolher onde usar seu cashback!
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Quadra</p>
              <p className="text-xs text-muted-foreground">
                Para pagar agendamentos de quadra
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Bar</p>
              <p className="text-xs text-muted-foreground">
                Para consumir no bar (com o atendente)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground text-center">
            Os saldos são separados e a escolha é definitiva.
          </p>
        </div>

        <button
          onClick={handleClose}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
        >
          Entendi!
        </button>
      </DialogContent>
    </Dialog>
  );
};
