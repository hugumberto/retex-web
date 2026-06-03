'use client';

import { login, resetUserPassword } from '@/service/auth';
import { DialogForm } from '@/components/form/dialog-form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { InputForm } from '@/components/form/input-form';
import Title from '@/components/custom/title';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';

type LoginFormData = {
  email: string;
  password: string;
};

type ResetPasswordFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: 'admin@retex.pt',
      password: '123456',
    },
  });
  const {
    register,
    handleSubmit: handleResetSubmit,
    reset,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password);
      router.push('/portal');
    } catch {
      // Optionally handle error (e.g., show toast)
    }
  }

  async function onResetPasswordSubmit(data: ResetPasswordFormData) {
    await toast.promise(
      async () => {
        await resetUserPassword(data.email, data.password);
        reset();
        setIsResetModalOpen(false);
      },
      {
        loading: 'Resetando senha...',
        success: 'Senha resetada com sucesso',
        error: 'Não foi possível resetar a senha',
      }
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/assets/logo.png"
              alt="retex"
              height={28}
              width={207}
              className="h-12 opacity-90"
              style={{ width: 'auto' }}
              priority
            />
          </div>
          <Title>Login</Title>

          <InputForm
            name="email"
            control={control}
            label="Email"
            type="email"
            placeholder="Email"
            rules={{ required: 'Email é obrigatório' }}
            errors={errors}
          />

          <InputForm
            name="password"
            control={control}
            label="Password"
            type="password"
            placeholder="Password"
            rules={{ required: 'Senha é obrigatória' }}
            errors={errors}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => setIsResetModalOpen(true)}
            >
              Esqueci a senha
            </Button>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>

      <DialogForm<ResetPasswordFormData>
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title="Resetar senha"
        description="Informe seu email e defina uma nova senha para acessar o portal."
        confirmText="Resetar"
        loading={isResetSubmitting}
        errors={resetErrors}
        onConfirm={handleResetSubmit(onResetPasswordSubmit)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary">
              Email
            </label>
            <Input
              type="email"
              placeholder="Informe seu email"
              className={`mt-1 ${resetErrors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: 'Formato de email inválido',
                },
              })}
            />
            {resetErrors.email?.message && (
              <p className="mt-1 text-xs text-red-500">
                {resetErrors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">
              Nova senha
            </label>
            <Input
              type="password"
              placeholder="Informe a nova senha"
              className={`mt-1 ${resetErrors.password ? 'border-red-500' : ''}`}
              {...register('password', {
                required: 'A nova senha é obrigatória',
                minLength: {
                  value: 8,
                  message: 'A senha deve ter pelo menos 8 caracteres',
                },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
                  message:
                    'A senha deve conter ao menos 1 letra maiúscula, 1 número e 1 caractere especial',
                },
              })}
            />
            {resetErrors.password?.message && (
              <p className="mt-1 text-xs text-red-500">
                {resetErrors.password.message}
              </p>
            )}
          </div>
        </div>
      </DialogForm>
    </div>
  );
}
