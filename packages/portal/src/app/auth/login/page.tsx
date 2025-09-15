'use client';

import { login } from '@/service/auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { InputForm } from '@/components/form/input-form';
import Title from '@/components/custom/title';
import Image from 'next/image';

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
    defaultValues: {
      email: 'admin@retex.pt',
      password: '123456',
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password);
      router.push('/portal');
    } catch (err: unknown) {
      // Optionally handle error (e.g., show toast)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
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
