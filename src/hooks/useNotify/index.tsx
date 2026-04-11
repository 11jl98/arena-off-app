import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const useNotify = () => {
  const notify = (message: string, type: 'success' | 'error' | 'warning' = 'success', description?: string) => {
    toast[type](message, { description });
  };

  const success = (message: string, description?: string) => {
    toast.success(message, { description });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, { description });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, { description });
  };

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      toast(message, {
        description: (
          <div className="flex gap-3 mt-3">
            <Button
              onClick={() => resolve(true)}
              className="px-3 py-1 bg-red-600 text-white rounded-md"
            >
              Sim
            </Button>
            <Button onClick={() => resolve(false)} className="px-3 py-1 bg-gray-300 rounded-md">
              Não
            </Button>
          </div>
        ),
        duration: Infinity,
      });
    });
  };

  return { notify, success, error, warning, confirm };
};
