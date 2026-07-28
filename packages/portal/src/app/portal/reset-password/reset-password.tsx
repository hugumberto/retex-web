'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    setPageTitle('Repor Senha');
    setBreadcrumbs([{ label: 'Repor Senha', href: '/portal/reset-password' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs]);

  const onSubmit = async (data: FormData) => {
    try {
      const { status } = await api.put('/user/reset-password', {
        email: data.email.trim(),
        password: data.password,
      });
      if (!isSuccessStatus(status)) throw new Error();
      toast.success('Senha reposta com sucesso');
      reset({ email: '', password: '', confirmPassword: '' });
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        toast.error('Nenhum utilizador encontrado com esse email');
      } else {
        toast.error('Não foi possível repor a senha');
      }
    }
  };

  return (
    <section className="max-w-xl">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary">
          Repor senha de um utilizador
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Indique o email do utilizador e a nova senha. A alteração é imediata.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary">
              Email do utilizador
            </label>
            <Input
              type="email"
              placeholder="utilizador@exemplo.pt"
              className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                required: 'O email é obrigatório',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Email inválido',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">
              Nova senha
            </label>
            <Input
              type="password"
              placeholder="Nova senha"
              className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
              {...register('password', {
                required: 'A nova senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'A senha deve ter pelo menos 6 caracteres',
                },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">
              Confirmar nova senha
            </label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              {...register('confirmPassword', {
                required: 'Confirme a nova senha',
                validate: (value) =>
                  value === watch('password') || 'As senhas não coincidem',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" disabled={isSubmitting}>
              {isSubmitting ? 'A repor...' : 'Repor senha'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
