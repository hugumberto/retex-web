'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the shape of the form data that react-hook-form will manage
interface UserFormData {
  id?: string; 
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile: string; 
}

interface UserFormProps {
  onFormClose: () => void;
  initialData?: UserFormData;
  onSave: (data: UserFormData) => void;
}

export default function UserForm({ onFormClose, initialData, onSave }: UserFormProps) {
  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<UserFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      profile: '',
    },
  });

  
  const [mensagem, setMensagem] = useState<string | null>(null);
  const profileOptions = ['Operacao', 'Admin', 'Motorista'];

  useEffect(() => {
    if (initialData) {
      setValue('firstName', initialData.firstName);
      setValue('lastName', initialData.lastName);
      setValue('email', initialData.email);
      setValue('phone', initialData.phone || ''); 
      setValue('profile', initialData.profile || '');
    } else {
      reset();
    }
  }, [initialData, setValue, reset]);

  const onSubmit: SubmitHandler<UserFormData> = async (data) => {
    setMensagem(null);
    try {
      await onSave(data); // Call the parent's onSave handler
      setMensagem('Usuário salvo com sucesso!');
    } catch (e) {
      setMensagem('Erro ao salvar o usuário.');
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData ? 'Editar Usuário' : 'Cadastro de Usuário'}
      </h2>

      {/* Display messages */}
      {mensagem && (
        <p className="text-center text-sm text-gray-700">{mensagem}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* First Name Input */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Primeiro Nome</label>
          <input
            type="text"
            id="firstName"
            // Register the input with react-hook-form, including validation rules
            {...register('firstName', { required: 'Primeiro Nome é obrigatório' })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900`}
          />
          {/* Display validation error message */}
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name Input */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Ultimo Nome</label>
          <input
            type="text"
            id="lastName"
            {...register('lastName', { required: 'Ultimo Nome é obrigatório' })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            {...register('email', {
              required: 'Email é obrigatório',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: 'Formato de email inválido'
              }
            })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Input */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            type="text"
            id="phone"
            {...register('phone')} 
            className={`mt-1 block w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900`}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Profile Dropdown */}
        <div>
          <label htmlFor="profile" className="block text-sm font-medium text-gray-700">Perfil</label>
          <Controller
            name="profile"
            control={control}
            rules={{ required: 'Perfil é obrigatório' }} 
            render={({ field }) => (
              <>
                <Select
                  onValueChange={field.onChange} // react-hook-form's onChange handler
                  value={field.value} // react-hook-form's value
                >
                  <SelectTrigger
                    id="profile" 
                    className={`mt-1 block w-full px-3 py-2 border ${errors.profile ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900`}
                  >
                    <SelectValue placeholder="Selecione um perfil*" />
                  </SelectTrigger>
                  <SelectContent>
                    {profileOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.profile && (
                  <p className="text-red-500 text-sm mt-1">{errors.profile.message}</p>
                )}
              </>
            )}
          />
        </div>

        {/* Action Buttons */}
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
            {isSubmitting ? 'Salvando...' : (initialData ? 'Guardar Alterações' : 'Criar')}
          </Button>
        </div>
      </form>
    </div>
  );
}
