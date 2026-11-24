'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPasswordWithToken } from '@/service/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ResetFormData = {
  password: string;
  confirmPassword: string;
};

function errorKeyForStatus(status?: number): string {
  return status === 400 ? 'errorInvalidLink' : 'errorGeneric';
}

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const tValidation = useTranslations('validation');
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
      toast.success(t('success'));
      router.push('/auth/login');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      toast.error(t(errorKeyForStatus(status)));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full max-w-[400px] space-y-5 rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(1,51,100,0.06)]">
        <h1 className="text-left text-[26px] font-bold leading-tight text-navy">{t('invalidLinkTitle')}</h1>
        <p className="text-sm text-ink">
          {t('invalidLinkDescription')}
        </p>
        <Button asChild className="h-11 w-full rounded-full bg-navy text-white hover:bg-navy/90">
          <Link href="/auth/login">{t('goToLogin')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-[400px] space-y-5 rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(1,51,100,0.06)]"
    >
      <h1 className="text-left text-[26px] font-bold leading-tight text-navy">{t('title')}</h1>
      <p className="text-sm text-ink">{t('description')}</p>

      <div>
        <label className="block text-sm font-medium text-secondary">
          {t('newPassword')}
        </label>
        <Input
          type="password"
          placeholder={t('newPassword')}
          className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
          {...register('password', {
            required: tValidation('passwordRequired'),
            minLength: {
              value: 8,
              message: tValidation('passwordMinLength'),
            },
            pattern: {
              value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
              message: tValidation('passwordPattern'),
            },
          })}
        />
        {errors.password?.message && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary">
          {t('confirmPassword')}
        </label>
        <Input
          type="password"
          placeholder={t('repeatPassword')}
          className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
          {...register('confirmPassword', {
            required: tValidation('confirmPasswordRequired'),
            validate: (value) =>
              value === watch('password') || tValidation('passwordsDoNotMatch'),
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
        className="h-11 w-full rounded-full bg-navy text-white hover:bg-navy/90"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex w-full flex-col items-center">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
