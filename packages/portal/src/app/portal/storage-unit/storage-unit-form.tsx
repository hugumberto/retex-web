'use client';
import { DialogForm } from '@/components/form/dialog-form';
import { SelectForm } from '@/components/form/select-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Brand } from '../../types/brand';
import { Quality, StorageUnitFormData } from '../../types/storage-unit';

interface StorageUnitFormProps {
  storageUnitId?: string;
  onSave: () => void;
}

const qualityOptions = [
  { value: Quality.GOOD, label: 'Bom' },
  { value: Quality.MEDIUM, label: 'Regular' },
  { value: Quality.BAD, label: 'Ruim' },
];

export default function StorageUnitForm({
  storageUnitId,
  onSave,
}: StorageUnitFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StorageUnitFormData>();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandOptions, setBrandOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const isEditing = useMemo(() => !!storageUnitId, [storageUnitId]);

  const fetchBrands = useCallback(async () => {
    try {
      const { data, status } = await api.get<Brand[]>('/brand');
      if (!isSuccessStatus(status)) throw new Error('Erro ao buscar marcas');
      setBrandOptions(
        data.map((brand) => ({ value: brand.id, label: brand.name }))
      );
    } catch (error) {
      console.error('Erro ao buscar marcas:', error);
    }
  }, []);

  const fetchStorageUnitData = useCallback(async () => {
    if (!storageUnitId) return;
    try {
      const { data, status } = await api.get<StorageUnitFormData>(
        `/storage-unit/${storageUnitId}`
      );
      if (!isSuccessStatus(status)) throw new Error('Erro ao buscar unidade');
      reset(data);
    } catch (error) {
      console.error('Erro ao buscar unidade de armazenamento:', error);
    }
  }, [storageUnitId, reset]);

  useEffect(() => {
    fetchBrands();
    if (isEditing && isOpen) {
      fetchStorageUnitData();
    }
  }, [fetchBrands, fetchStorageUnitData, isEditing, isOpen]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
    } else if (isEditing) {
      fetchStorageUnitData();
    }
  };

  const submit = async (data: StorageUnitFormData) => {
    setIsSubmitting(true);
    toast.promise(
      async () => {
        if (isEditing) {
          const res = await api.put(`/storage-unit/${storageUnitId}`, {
            brandId: data.brandId,
            quality: data.quality,
            state: data.state,
            weight: data.weight,
          });
          if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
        } else {
          const res = await api.post('/storage-unit', {
            brandId: data.brandId,
            quality: data.quality,
            state: data.state,
            weight: data.weight,
          });
          if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
        }
        reset();
      },
      {
        loading: 'Carregando...',
        success: () => {
          onSave();
          setIsOpen(false);
          return `Unidade de Armazenamento ${isEditing ? 'atualizada' : 'criada'} com sucesso!`;
        },
        error: () => {
          return `Erro ao ${isEditing ? 'atualizar' : 'criar'} a Unidade de Armazenamento.`;
        },
      }
    );
    setIsSubmitting(false);
  };

  return (
    <DialogForm
      triggerText={isEditing ? 'Editar' : 'Criar'}
      title={isEditing ? 'Atualizar Unidade de Armazenamento' : 'Cadastro de Unidade de Armazenamento'}
      onConfirm={handleSubmit(submit)}
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
          <SelectForm
            label="Marca"
            name="brandId"
            control={control}
            rules={{ required: 'A marca é obrigatória' }}
            options={brandOptions}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Qualidade"
            name="quality"
            control={control}
            rules={{ required: 'A qualidade é obrigatória' }}
            options={qualityOptions}
            errors={errors}
          />
        </div>
        {isEditing && (
          <>
            <div>
              <SelectForm
                label="Estado"
                name="state"
                control={control}
                rules={{ required: 'O estado é obrigatório' }}
                options={[{ value: 'ATIVO', label: 'ATIVO' }, { value: 'INATIVO', label: 'INATIVO' }]}
                errors={errors}
              />
            </div>
            <div>
              <SelectForm
                label="Peso"
                name="weight"
                control={control}
                rules={{ required: 'O peso é obrigatório' }}
                options={[{ value: 'LEVE', label: 'LEVE' }, { value: 'MEDIO', label: 'MÉDIO' }, { value: 'PESADO', label: 'PESADO' }]}
                errors={errors}
              />
            </div>
          </>
        )}
      </div>
    </DialogForm>
  );
}
