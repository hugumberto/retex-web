'use client';

import { login } from '@/service/auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { InputForm } from '@/components/form/input-form';
import Title from '@/components/custom/title';

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      console.log(
        '[xxx] ~ onSubmit ~  process.env.NEXT_PUBLIC_API_URL;:',
        process.env.NEXT_PUBLIC_API_URL
      );
      await login(data.email, data.password);
      router.push('/portal');
    } catch {}
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-md"
      >
        <div className="flex justify-center mb-2">
          <span className="text-2xl font-bold text-primary">retex ai</span>
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
  );
}
