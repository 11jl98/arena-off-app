import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import {
  User,
  Mail,
  LogOut,
  Save,
  Loader2,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { AuthService } from '@/services/auth';
import { useUserStore } from '@/store';
import { useNotify } from '@/hooks/useNotify';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(60),
});
type FormValues = z.infer<typeof schema>;

const THEMES = [
  { value: 'light' as const, icon: Sun, label: 'Claro' },
  { value: 'dark' as const, icon: Moon, label: 'Escuro' },
  { value: 'system' as const, icon: Monitor, label: 'Sistema' },
];

export const PerfilView: React.FC = () => {
  const { user, logout } = useAuth();
  const { setUser } = useUserStore();
  const { theme, setTheme } = useTheme();
  const { success: showSuccess, error: showError } = useNotify();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '' },
  });

  useEffect(() => {
    if (user?.name) reset({ name: user.name });
  }, [user?.name, reset]);

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: (values: FormValues) =>
      AuthService.updateProfile({ name: values.name }),
    onSuccess: (res) => {
      setUser({ ...res.user, photoURL: res.user.avatarUrl });
      reset({ name: res.user.name });
      showSuccess('Perfil atualizado com sucesso!');
    },
    onError: (err: Error) => {
      showError(err.message || 'Erro ao atualizar perfil.');
    },
  });

  const avatarSrc = user?.avatarUrl || user?.photoURL;

  return (
    <div className="flex flex-col min-h-full">
      <div className="bg-gradient-to-r from-primary to-orange-600 px-4 pt-12 pb-16">
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-white/80 text-sm mt-0.5">Suas informações pessoais</p>
      </div>

      <div className="flex justify-center -mt-12 mb-4">
        <div className="relative">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.name}
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-muted border-4 border-background shadow-lg flex items-center justify-center">
              <User size={36} className="text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 flex flex-col gap-5 pb-6">
        <form
          onSubmit={handleSubmit((v) => saveProfile(v))}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3"
        >
          <h2 className="font-semibold text-foreground text-sm">Informações pessoais</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Nome</label>
            <input
              {...register('name')}
              type="text"
              className={cn(
                'w-full px-3.5 py-2.5 bg-muted rounded-xl text-sm border border-transparent focus:outline-none focus:border-primary transition-colors',
                errors.name && 'border-destructive focus:border-destructive'
              )}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Mail size={12} />
              E-mail
            </label>
            <input
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="w-full px-3.5 py-2.5 bg-muted/50 rounded-xl text-sm text-muted-foreground border border-transparent cursor-not-allowed"
            />
          </div>

          {isDirty && (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              Salvar alterações
            </button>
          )}
        </form>

        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-semibold text-foreground text-sm mb-3">Aparência</h2>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all duration-150',
                  theme === value
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted/50 border-transparent text-muted-foreground'
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Arena Off Beach</p>
          <p className="text-xs">Reserve quadras · Ganhe cashback · Aproveite</p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          <LogOut size={18} />
          Sair da conta
        </button>
      </div>
    </div>
  );
};
