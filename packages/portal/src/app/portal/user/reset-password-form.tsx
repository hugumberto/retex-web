'use client';

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

const triggerButton = (
  <Button variant="ghost" size="icon" className="size-8" title="Repor senha">
    <KeyRound className="size-4" />
  </Button>
);

export default function ResetPasswordForm({ user }: ResetPasswordFormProps) {
  const { user: currentUser } = useAppStore();
  const isAdmin = getUserRoles(currentUser).includes(Role.ADMIN);

  // Admin: em vez de definir a senha manualmente, envia o email de ativação para
  // o utilizador (re)definir a própria senha pelo link.
  if (isAdmin) {
    const handleSend = async () => {
      try {
        toast.loading('A enviar email de ativação...', { id: 'send-activation' });
        await sendActivationEmail(user.email);
        toast.success('Email de ativação enviado', { id: 'send-activation' });
      } catch (error) {
        toast.error('Não foi possível enviar o email', { id: 'send-activation' });
        console.error('Erro ao enviar email de ativação:', error);
      }
    };

    return (
      <ConfirmDialog
        trigger={triggerButton}
        title="Enviar email de ativação"
        description={`Vai ser enviado um email para ${user.firstName} ${user.lastName} definir uma nova senha. A conta fica inativa até concluir a ativação.`}
        confirmText="Enviar"
        onConfirm={handleSend}
      />
    );
  }

  // Fallback (não-admin): reposição manual da senha.
  return <ManualResetForm user={user} />;
}

function ManualResetForm({ user }: ResetPasswordFormProps) {
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
      toast.loading('Resetando senha...', { id: 'reset-password' });

      const { status } = await api.put('/user/reset-password', {
        email: user.email,
        password: formData.password,
      });

      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao resetar senha do usuário');
      }

      toast.success('Senha resetada com sucesso', { id: 'reset-password' });
      reset({
        email: user.email,
        password: '',
      });
      setIsOpen(false);
    } catch (error) {
      toast.error('Não foi possível resetar a senha', { id: 'reset-password' });
      console.error('Erro ao resetar senha do usuário:', error);
    }
  };

  return (
    <DialogForm<ResetPasswordFormData>
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Resetar Senha"
      description={`Defina uma nova senha para ${user.firstName} ${user.lastName}.`}
      confirmText="Resetar"
      loading={isSubmitting}
      onConfirm={handleSubmit(onSubmit)}
      errors={errors}
      trigger={triggerButton}
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
            Nova senha
          </label>
          <Input
            type="password"
            placeholder="Informe a nova senha"
            className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
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
