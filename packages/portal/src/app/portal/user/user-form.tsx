'use client';

import { DialogForm } from '@/components/form/dialog-form';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Role, UserFormData } from '../../types/user';

interface UserFormProps {
  initialData?: UserFormData;
  onSave?: () => void;
}

export default function UserForm({ initialData, onSave }: UserFormProps) {
  const isEditing = !!initialData?.id;
  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>();

  const roleOptions = [
    { id: Role.ADMIN, label: 'Admin' },
    { id: Role.OPS, label: 'Operação' },
    { id: Role.DRIVER, label: 'Motorista' },
  ];

  useEffect(() => {
    if (!isOpen) return;

    reset({
      id: initialData?.id,
      firstName: initialData?.firstName ?? '',
      lastName: initialData?.lastName ?? '',
      email: initialData?.email ?? '',
      contactPhone: initialData?.contactPhone ?? '',
      role: initialData?.role ?? [],
    });
  }, [initialData, isOpen, reset]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const onSubmit: SubmitHandler<UserFormData> = async (formData) => {
    let userId = '';
    try {
      if (initialData?.id) {
        const { data, status } = await api.put(`/user/${initialData?.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactPhone: formData.contactPhone,
          password: formData.contactPhone,
        });

        if (!isSuccessStatus(status)) throw new Error('Erro ao criar usuário');
        userId = data.id;
      } else {
        const { data, status } = await api.post(`/user`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactPhone: formData.contactPhone,
          password: formData.contactPhone,
        });
        if (!isSuccessStatus(status)) throw new Error('Erro ao criar usuário');
        userId = data.id;
      }

      if (Array.isArray(formData.role) && formData.role.length > 0) {
        await api.post(`/user/${userId}/roles`, { roles: formData.role });
      }

      toast.success('Usuário salvo com sucesso!');
      setIsOpen(false);
      onSave?.();
      reset();
    } catch (e) {
      toast.error('Erro ao salvar o usuário.');
      console.error(e);
    }
  };

  return (
    <DialogForm<UserFormData>
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={initialData ? 'Editar Usuário' : 'Cadastro de Usuário'}
      onConfirm={handleSubmit(onSubmit)}
      loading={isSubmitting}
      errors={errors}
      trigger={
        isEditing ? (
          <Button variant="ghost" size="icon" className="size-8">
            <PencilIcon className="size-4" />
          </Button>
        ) : (
          <Button variant="secondary" className="ml-auto block">
            Criar
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-secondary"
          >
            Primeiro Nome
          </label>
          <div className="w-full">
            <Input
              placeholder="Primeiro Nome*"
              className={errors.firstName ? 'border-red-500' : ''}
              {...register('firstName', { required: 'Campo obrigatório' })}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-secondary"
          >
            Último Nome
          </label>
          <div className="w-full">
            <Input
              placeholder="Último Nome*"
              className={errors.lastName ? 'border-red-500' : ''}
              {...register('lastName', { required: 'Campo obrigatório' })}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-secondary"
          >
            Email
          </label>
          <div className="w-full">
            <Input
              placeholder="Email*"
              className={errors.email ? 'border-red-500' : ''}
              {...register('email', {
                required: 'Campo obrigatório',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: 'Formato de email inválido',
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-secondary"
          >
            Telefone
          </label>
          <div className="w-full">
            <Input
              placeholder="Telefone*"
              className={errors.contactPhone ? 'border-red-500' : ''}
              {...register('contactPhone', { required: 'Campo obrigatório' })}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="profile"
            className="block text-sm font-medium text-secondary"
          >
            Perfil
          </label>
          <Controller
            name="role"
            control={control}
            rules={{ required: 'Perfil é obrigatório' }}
            defaultValue={[]}
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {roleOptions.map((option) => (
                  <label key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value?.includes(option.id) ?? false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value ?? []), option.id]);
                        } else {
                          field.onChange(
                            (field.value ?? []).filter((id) => id !== option.id)
                          );
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
                {errors.role && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      </div>
    </DialogForm>
  );
}
