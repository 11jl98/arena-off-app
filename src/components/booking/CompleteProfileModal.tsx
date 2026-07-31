import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Phone, CreditCard } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { AuthService } from '@/services/auth';
import { useUserStore } from '@/store/userStore';
import { useNotify } from '@/hooks/useNotify';
import { cn } from '@/lib/utils';


const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const PHONE_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/;

const schema = z.object({
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .regex(CPF_REGEX, 'CPF inválido. Use o formato 000.000.000-00'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(PHONE_REGEX, 'Telefone inválido. Use o formato (00) 00000-0000'),
});

type FormValues = z.infer<typeof schema>;


function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

interface CompleteProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { user, updateUser } = useUserStore();
  const { success: showSuccess, error: showError } = useNotify();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { cpf: '', phone: '' },
  });

  // Pre-populate if user already has partial data
  useEffect(() => {
    if (open) {
      reset({
        cpf: user?.cpf ?? '',
        phone: user?.phone ?? '',
      });
    }
  }, [open, user?.cpf, user?.phone, reset]);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      AuthService.updateProfile({ cpf: values.cpf, phone: values.phone }),
    onSuccess: (_res, variables) => {
      updateUser({
        cpf: variables.cpf,
        phone: variables.phone,
      });
      showSuccess('Dados salvos com sucesso!');
      onSuccess();
    },
    onError: (err: Error) => {
      showError(err.message || 'Erro ao salvar dados. Tente novamente.');
    },
  });

  const cpfValue = watch('cpf');
  const phoneValue = watch('phone');

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue('cpf', maskCPF(e.target.value), { shouldValidate: true });
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue('phone', maskPhone(e.target.value), { shouldValidate: true });
  }

  return (
    <ResponsiveModal open={open} onClose={onClose} title="Completar perfil">
      <div className="px-4 pb-6 flex flex-col gap-4">
          {/* Info banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              Para pagar <span className="font-semibold">presencialmente</span>, precisamos do
              seu <span className="font-semibold">CPF</span> e{' '}
              <span className="font-semibold">telefone de contato</span> para confirmar sua reserva.
            </p>
          </div>

          <form
            onSubmit={handleSubmit((v) => saveProfile(v))}
            className="flex flex-col gap-3"
          >
            {/* CPF field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <CreditCard size={12} />
                CPF
              </label>
              <input
                {...register('cpf')}
                value={cpfValue}
                onChange={handleCpfChange}
                inputMode="numeric"
                placeholder="000.000.000-00"
                className={cn(
                  'w-full px-3.5 py-2.5 bg-muted rounded-xl text-sm border border-transparent focus:outline-none focus:border-primary transition-colors',
                  errors.cpf && 'border-destructive focus:border-destructive'
                )}
              />
              {errors.cpf && (
                <p className="text-xs text-destructive">{errors.cpf.message}</p>
              )}
            </div>

            {/* Phone field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Phone size={12} />
                Telefone
              </label>
              <input
                {...register('phone')}
                value={phoneValue}
                onChange={handlePhoneChange}
                inputMode="tel"
                placeholder="(00) 00000-0000"
                className={cn(
                  'w-full px-3.5 py-2.5 bg-muted rounded-xl text-sm border border-transparent focus:outline-none focus:border-primary transition-colors',
                  errors.phone && 'border-destructive focus:border-destructive'
                )}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="mt-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e continuar'
              )}
            </button>
          </form>
        </div>
    </ResponsiveModal>
  );
};
