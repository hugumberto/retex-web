'use client';

import { useTranslations } from 'next-intl';
import { Role, UserDTO } from '@/app/types/user';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { DialogForm } from '@/components/form/dialog-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { getUserRoles } from '@/lib/access-control';
import { isSuccessStatus } from '@/lib/utils';
import { sendActivationEmail } from '@/service/auth';
import { useAppStore } from '@/store';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type ResetPasswordFormData = {
  email: string;
  password: string;
};

type ResetPasswordFormProps = {
  user: UserDTO;
};

function TriggerButton() {
  const t = useTranslations('users');

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      title={t('resetPasswordTooltip')}
    >
      <KeyRound className="size-4" />
    </Button>
  );
}

export default function ResetPasswordForm({ user }: ResetPasswordFormProps) {
  const t = useTranslations('users');
  const { user: currentUser } = useAppStore();
  const isAdmin = getUserRoles(currentUser).includes(Role.ADMIN);

  // Admin: em vez de definir a senha manualmente, envia o email de ativação para
  // o utilizador (re)definir a própria senha pelo link.
  if (isAdmin) {
    const handleSend = async () => {
      try {
        toast.loading(t('sendingActivation'), { id: 'send-activation' });
        await sendActivationEmail(user.email);
        toast.success(t('sendActivationSuccess'), { id: 'send-activation' });
      } catch (error) {
        toast.error(t('sendActivationError'), { id: 'send-activation' });
        console.error('Erro ao enviar email de ativação:', error);
      }
    };

    return (
      <ConfirmDialog
        trigger={<TriggerButton />}
        title={t('sendActivationTitle')}
        description={`Vai ser enviado um email para ${user.firstName} ${user.lastName} definir uma nova senha. A conta fica inativa até concluir a ativação.`}
        confirmText={t('sendConfirm')}
        onConfirm={handleSend}
      />
    );
  }

  // Fallback (não-admin): reposição manual da senha.
  return <ManualResetForm user={user} />;
}

function ManualResetForm({ user }: ResetPasswordFormProps) {
  const t = useTranslations('users');
  const tValidation = useTranslations('validation');
  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      email: user.email,
      password: '',
    },
  });

  const onSubmit = async (formData: ResetPasswordFormData) => {
    try {
      toast.loading(t('resettingPassword'), { id: 'reset-password' });

      const { status } = await api.put('/user/reset-password', {
        email: user.email,
        password: formData.password,
      });

      if (!isSuccessStatus(status)) {
        throw new Error(t('resetPasswordError'));
      }

      toast.success(t('resetPasswordSuccess'), { id: 'reset-password' });
      reset({
        email: user.email,
        password: '',
      });
      setIsOpen(false);
    } catch (error) {
      toast.error(t('resetPasswordError'), { id: 'reset-password' });
      console.error('Erro ao resetar senha do usuário:', error);
    }
  };

  return (
    <DialogForm<ResetPasswordFormData>
      open={isOpen}
      onOpenChange={setIsOpen}
      title={t('resetPasswordTitle')}
      description={t('resetPasswordDescription', {
        name: `${user.firstName} ${user.lastName}`,
      })}
      confirmText={t('resetConfirm')}
      loading={isSubmitting}
      onConfirm={handleSubmit(onSubmit)}
      errors={errors}
      trigger={<TriggerButton />}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary">
            Email
          </label>
          <Input value={user.email} disabled className="mt-1" />
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary">
            {t('newPassword')}
          </label>
          <Input
            type="password"
            placeholder={t('newPasswordPlaceholder')}
            className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
            {...register('password', {
              required: tValidation('passwordRequired'),
              minLength: {
                value: 8,
                message: tValidation('passwordMinLength'),
              },
              pattern: {
                value: /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
                message:
                  tValidation('passwordPattern'),
              },
            })}
          />
          {errors.password?.message && (
            <p className="mt-1 text-xs text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>
    </DialogForm>
  );
}
