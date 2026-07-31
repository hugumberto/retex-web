'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tRole = useTranslations('enums.role');
  const isEditing = !!initialData?.id;
  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>();

  const roleOptions = [Role.ADMIN, Role.OPS, Role.DRIVER].map((id) => ({
    id,
    label: tRole(id),
  }));

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

        if (!isSuccessStatus(status)) throw new Error(t('createError'));
        userId = data.id;
      } else {
        // Senha temporária aleatória; o utilizador define a senha real pelo
        // email de ativação. Cumpre o mínimo de 8 caracteres exigido pela API.
        const tempPassword = `Aa1!${crypto.randomUUID().slice(0, 12)}`;
        const { data, status } = await api.post(`/user`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactPhone: formData.contactPhone,
          password: tempPassword,
          userType: 'PERSON',
        });
        if (!isSuccessStatus(status)) throw new Error(t('createError'));
        userId = data.id;
      }

      if (Array.isArray(formData.role) && formData.role.length > 0) {
        await api.post(`/user/${userId}/roles`, { roles: formData.role });
      }

      toast.success(t('saveSuccess'));
      setIsOpen(false);
      onSave?.();
      reset();
    } catch (e) {
      toast.error(t('saveError'));
      console.error(e);
    }
  };

  return (
    <DialogForm<UserFormData>
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={initialData ? t('formEditTitle') : t('formCreateTitle')}
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
            {tCommon('create')}
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
            {t('firstName')}
          </label>
          <div className="w-full">
            <Input
              placeholder={t('firstNamePlaceholder')}
              className={errors.firstName ? 'border-red-500' : ''}
              {...register('firstName', { required: tCommon('requiredField') })}
            />
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{tCommon('requiredField')}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-secondary"
          >
            {t('lastName')}
          </label>
          <div className="w-full">
            <Input
              placeholder={t('lastNamePlaceholder')}
              className={errors.lastName ? 'border-red-500' : ''}
              {...register('lastName', { required: tCommon('requiredField') })}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{tCommon('requiredField')}</p>
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
              placeholder={t('emailPlaceholder')}
              className={errors.email ? 'border-red-500' : ''}
              {...register('email', {
                required: tCommon('requiredField'),
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: tCommon('emailInvalid'),
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
              placeholder={t('phonePlaceholder')}
              className={errors.contactPhone ? 'border-red-500' : ''}
              {...register('contactPhone', { required: tCommon('requiredField') })}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-xs mt-1">{tCommon('requiredField')}</p>
            )}
          </div>
        </div>
        <div>
          <label
            htmlFor="profile"
            className="block text-sm font-medium text-secondary"
          >
            {tCommon('role')}
          </label>
          <Controller
            name="role"
            control={control}
            rules={{ required: t('roleRequired') }}
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
