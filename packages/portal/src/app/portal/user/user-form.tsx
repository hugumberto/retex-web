'use client';

import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { Role, UserFormData } from '../../types/user';

interface UserFormProps {
  onFormClose: () => void;
  initialData?: UserFormData;
  onSave?: () => void;
}

export default function UserForm({
  onFormClose,
  initialData,
  onSave,
}: UserFormProps) {
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<UserFormData>();

  const [message, setMessage] = useState<string | null>(null);

  const roleOptions = [
    { id: Role.ADMIN, label: 'Admin' },
    { id: Role.OPS, label: 'Operação' },
    { id: Role.DRIVER, label: 'Motorista' },
  ];

  useEffect(() => {
    if (initialData) {
      setValue('firstName', initialData.firstName);
      setValue('lastName', initialData.lastName);
      setValue('email', initialData.email);
      setValue('contactPhone', initialData.contactPhone);
      setValue('documentNumber', initialData.documentNumber);
      setValue('role', initialData.role || []);
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const onSubmit: SubmitHandler<UserFormData> = async (formData) => {
    let userId = '';
    try {
      // Primeiro, cria o usuário
      if (initialData?.id) {
        const { data, status } = await api.put(`/user${initialData?.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactPhone: formData.contactPhone,
          documentNumber: formData.documentNumber,
          password: formData.documentNumber, // senha fixa conforme solicitado
        });

        if (!isSuccessStatus(status)) throw new Error('Erro ao criar usuário');
        userId = data.id;
      } else {
        const { status } = await api.post(`/user`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactPhone: formData.contactPhone,
          documentNumber: formData.documentNumber,
          password: formData.documentNumber, // senha fixa conforme solicitado
        });
        if (!isSuccessStatus(status)) throw new Error('Erro ao criar usuário');
        userId = initialData?.id ?? '';
      }

      // Depois, atribui as roles selecionadas
      if (Array.isArray(formData.role) && formData.role.length > 0) {
        await api.post(`/user/${userId}/roles`, { roles: formData.role });
      }

      setMessage('Usuário salvo com sucesso!');
      onSave?.();
      reset();
    } catch (e) {
      setMessage('Erro ao salvar o usuário.');
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData ? 'Editar Usuário' : 'Cadastro de Usuário'}
      </h2>

      {message && (
        <p className="text-center text-sm text-gray-700">{message}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
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
            className="block text-sm font-medium text-gray-700"
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
            className="block text-sm font-medium text-gray-700"
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
            className="block text-sm font-medium text-gray-700"
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
            htmlFor="documentNumber"
            className="block text-sm font-medium text-gray-700"
          >
            NIF
          </label>
          <div className="w-full">
            <Input
              placeholder="NIF*"
              className={errors.documentNumber ? 'border-red-500' : ''}
              {...register('documentNumber', { required: 'Campo obrigatório' })}
            />
            {errors.documentNumber && (
              <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="profile"
            className="block text-sm font-medium text-gray-700"
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

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            onClick={onFormClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {isSubmitting
              ? 'Salvando...'
              : initialData
              ? 'Guardar Alterações'
              : 'Criar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
