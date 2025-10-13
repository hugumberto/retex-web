'use client';
import { PencilIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { SelectForm } from '@/components/form/select-form';
import { Button } from '@/components/ui/button';

import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { UserFormData, UserDTO, UserStatus } from '../../types/user';

// Constants
const STATUS_OPTIONS = [
  { value: UserStatus.ATIVO, label: 'Ativo' }, 
  { value: UserStatus.INATIVO, label: 'Inativo' },
];

interface UserFormProps {
  userId?: string;
  initialData?: UserDTO;
  onSave: () => void;
}

export default function UserForm({
  userId,
  initialData,
  onSave,
}: UserFormProps) {
  const isEditing = useMemo(() => !!userId, [userId]);
  const [, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormData>({
    defaultValues: initialData
      ? {
          firstName: initialData.firstName ?? '',
          lastName: initialData.lastName ?? '',
          email: initialData.email ?? '',
          contactPhone: initialData.contactPhone ?? '',
          documentNumber: initialData.documentNumber ?? '',
          role: initialData.roles.map((r) => r.role) ?? [],
          status: initialData.status ?? UserStatus.ATIVO,
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          contactPhone: '',
          documentNumber: '',
          role: [],
          status: UserStatus.ATIVO,
        },
  });

  const {
    control,
    formState: { errors },
  } = form;


  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        form.reset();
      }
    },
    [form]
  );


  const handleSubmit = useCallback(
    async (data: UserFormData) => {
      setIsSubmitting(true);
      toast.promise(
        async () => {
          if (isEditing) {
            const res = await api.put(`/user/${userId}`, {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              contactPhone: data.contactPhone,
              documentNumber: data.documentNumber,
              status: data.status,
            });
            if (!isSuccessStatus(res.status))
              throw new Error('Erro na requisição');
          } else {
            const res = await api.post('/user', {
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              contactPhone: data.contactPhone,
              documentNumber: data.documentNumber,
              password: data.documentNumber,
              status: data.status,
            });
            if (!isSuccessStatus(res.status))
              throw new Error('Erro na requisição');
          }
          form.reset();
        },
        {
          loading: 'Carregando...',
          success: () => {
            onSave();
            setIsOpen(false);
            return `Utilizador ${
              isEditing ? 'atualizado' : 'criado'
            } com sucesso!`;
          },
          error: () => {
            return `Erro ao ${
              isEditing ? 'atualizar' : 'criar'
            } o Utilizador.`;
          },
        }
      );
      setIsSubmitting(false);
    },
    [isEditing, userId, form, onSave]
  );
  

  return (
    <DialogForm
      triggerText={isEditing ? 'Editar' : 'Criar'}
      title={
        isEditing
          ? 'Atualizar Utilizador'
          : 'Cadastro de Utilizador'
      }
      onConfirm={form.handleSubmit(handleSubmit)}
      onOpenChange={handleOpenChange}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputForm 
            label="Nome" 
            name="firstName" 
            control={control} 
            rules={{ required: 'Nome é obrigatório' }} 
            errors={errors} 
          />
        </div>
        <div>
          <InputForm 
            label="Último Nome" 
            name="lastName" 
            control={control} 
            rules={{ required: 'Último Nome é obrigatório' }} 
            errors={errors} 
          />
        </div>
        <div>
          <InputForm 
            label="Email" 
            name="email" 
            control={control} 
            rules={{ 
              required: 'Email é obrigatório',
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: 'Formato de email inválido',
              }
            }} 
            errors={errors} 
          />
        </div>
        <div>
          <InputForm 
            label="Telefone" 
            name="contactPhone" 
            control={control} 
            rules={{ required: 'Telefone é obrigatório' }} 
            errors={errors} 
          />
        </div>
        <div>
          <InputForm 
            label="NIF" 
            name="documentNumber" 
            control={control} 
            rules={{ required: 'NIF é obrigatório' }} 
            errors={errors} 
          />
        </div>
        {isEditing && (
          <div>
            <SelectForm
              label="Estado"
              name="status"
              control={control}
              options={STATUS_OPTIONS}
              errors={errors}
            />
          </div>
        )}
      </div>
    </DialogForm>
  );
}
