'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const t = useTranslations('adminResetPassword');
  const tValidation = useTranslations('validation');
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
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/reset-password' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, t]);

  const onSubmit = async (data: FormData) => {
    try {
      const { status } = await api.put('/user/reset-password', {
        email: data.email.trim(),
        password: data.password,
      });
      if (!isSuccessStatus(status)) throw new Error();
      toast.success(t('success'));
      reset({ email: '', password: '', confirmPassword: '' });
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) {
        toast.error(t('userNotFound'));
      } else {
        toast.error(t('error'));
      }
    }
  };

  return (
    <section className="max-w-xl">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary">
          {t('cardTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('cardDescription')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary">
              {t('emailLabel')}
            </label>
            <Input
              type="email"
              placeholder={t('emailPlaceholder')}
              className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
              {...register('email', {
                required: tValidation('emailRequired'),
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: tValidation('emailInvalid'),
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary">
              {t('newPasswordLabel')}
            </label>
            <Input
              type="password"
              placeholder={t('newPasswordLabel')}
              className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
              {...register('password', {
                required: tValidation('passwordRequired'),
                minLength: {
                  value: 6,
                  message: t('passwordMinLength'),
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
              {t('confirmPasswordLabel')}
            </label>
            <Input
              type="password"
              placeholder={t('repeatPasswordPlaceholder')}
              className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              {...register('confirmPassword', {
                required: tValidation('confirmPasswordRequired'),
                validate: (value) =>
                  value === watch('password') ||
                  tValidation('passwordsDoNotMatch'),
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
              {isSubmitting ? t('submitting') : t('submit')}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
