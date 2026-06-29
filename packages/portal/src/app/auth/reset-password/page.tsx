'use client';

import Title from '@/components/custom/title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordWithToken } from '@/service/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ResetFormData = {
  password: string;
  confirmPassword: string;
};

function errorMessageForStatus(status?: number): string {
  switch (status) {
    case 400:
      return 'O link de reposição é inválido ou expirou. Peça um novo.';
    default:
      return 'Não foi possível repor a palavra-passe. Tente novamente.';
  }
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetFormData>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(data: ResetFormData) {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await resetPasswordWithToken(token, data.password);
      toast.success('Palavra-passe alterada com sucesso! Já pode entrar.');
      router.push('/auth/login');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(errorMessageForStatus(status));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-md text-center">
        <Title>Link inválido</Title>
        <p className="text-sm text-muted-foreground">
          O link de reposição não é válido. Verifique o email que recebeu ou peça um novo.
        </p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/auth/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-md"
    >
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
      <Title>Repor palavra-passe</Title>
      <p className="text-sm text-muted-foreground">
        Defina a sua nova palavra-passe para aceder ao portal.
      </p>

      <div>
        <label className="block text-sm font-medium text-secondary">
          Nova senha
        </label>
        <Input
          type="password"
          placeholder="Nova senha"
          className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
          {...register('password', {
            required: 'A senha é obrigatória',
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
        {errors.password?.message && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary">
          Confirmar senha
        </label>
        <Input
          type="password"
          placeholder="Repita a senha"
          className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
          {...register('confirmPassword', {
            required: 'Confirme a senha',
            validate: (value) =>
              value === watch('password') || 'As senhas não coincidem',
          })}
        />
        {errors.confirmPassword?.message && (
          <p className="mt-1 text-xs text-red-500">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'A guardar...' : 'Repor palavra-passe'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
