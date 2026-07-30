'use client';

import { forgotPassword, login } from '@/service/auth';
import { DialogForm } from '@/components/form/dialog-form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { InputForm } from '@/components/form/input-form';
import Title from '@/components/custom/title';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

type LoginFormData = {
  email: string;
  password: string;
};

type ResetPasswordFormData = {
  email: string;
};

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: isDev ? process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? '' : '',
      password: isDev ? process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD ?? '' : '',
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
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password);
      router.push('/portal');
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      toast.error(
        status === 401 ? t('invalidCredentials') : t('genericError')
      );
    }
  }

  async function onResetPasswordSubmit(data: ResetPasswordFormData) {
    try {
      const { outOfZone } = await forgotPassword(data.email);
      reset();
      setIsResetModalOpen(false);
      if (outOfZone) {
        toast.info(t('outOfZone'), { duration: 8000 });
      } else {
        toast.success(t('resetSent'));
      }
    } catch {
      // Anti-enumeração: não revelamos falhas (ex.: email inexistente).
      reset();
      setIsResetModalOpen(false);
      toast.success(t('resetSent'));
    }
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
          <Title>{t('title')}</Title>

          <InputForm
            name="email"
            control={control}
            label={t('email')}
            type="email"
            placeholder={t('email')}
            rules={{ required: tValidation('emailRequired') }}
            errors={errors}
          />

          <InputForm
            name="password"
            control={control}
            label={t('password')}
            type="password"
            placeholder={t('password')}
            rules={{ required: tValidation('passwordRequired') }}
            errors={errors}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => setIsResetModalOpen(true)}
            >
              {t('forgotPassword')}
            </Button>
          </div>

          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </div>

      <DialogForm<ResetPasswordFormData>
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title={t('resetTitle')}
        description={t('resetDescription')}
        confirmText={t('resetConfirm')}
        loading={isResetSubmitting}
        errors={resetErrors}
        onConfirm={handleResetSubmit(onResetPasswordSubmit)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary">
              {t('email')}
            </label>
            <Input
              type="email"
              placeholder={t('emailPlaceholder')}
              className={`mt-1 ${resetErrors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                required: tValidation('emailRequired'),
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: tValidation('emailInvalid'),
                },
              })}
            />
            {resetErrors.email?.message && (
              <p className="mt-1 text-xs text-red-500">
                {resetErrors.email.message}
              </p>
            )}
          </div>
        </div>
      </DialogForm>
    </div>
  );
}
