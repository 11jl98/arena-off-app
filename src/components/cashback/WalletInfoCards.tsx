interface WalletInfoCardsProps {
  barEnabled: boolean;
}

export const WalletInfoCards: React.FC<WalletInfoCardsProps> = ({ barEnabled }) => {
  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Usar na quadra</p>
          <p className="text-xs text-muted-foreground">Selecione o valor ao agendar sua reserva</p>
        </div>
      </div>

      {barEnabled && (
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Usar no bar</p>
            <p className="text-xs text-muted-foreground">Solicite ao atendente na hora do consumo</p>
          </div>
        </div>
      )}
    </div>
  );
};
