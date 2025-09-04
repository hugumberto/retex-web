'use client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Brand } from '../types/brand';
import { Quality, StorageUnitData } from '../types/storage-unit';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';

interface StorageUnitFormProps {
  onFormClose: () => void;
  initialData?: StorageUnitData;
  onSave?: () => void;
}
const qualityOptions = [
  { id: Quality.GOOD, name: 'Boa' },
  { id: Quality.MEDIUM, name: 'Regular' },
  { id: Quality.BAD, name: 'Ruim' },
];
export default function StorageUnitForm({
  onFormClose,
  initialData,
  onSave,
}: StorageUnitFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StorageUnitData>();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brandOptions, setBrandOptions] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, status } = await api.get<Brand[]>(`/brand`);
        if (!isSuccessStatus(status)) throw new Error('Erro ao buscar marcas');
        setBrandOptions(data);
      } catch (error) {
        console.error('Erro ao buscar marcas:', error);
      }
    };
    fetchBrands();
    return;
  }, []);

  useEffect(() => {
    if (brandOptions.length > 0 && initialData) {
      setValue('brandId', initialData.brandId);
      setValue('quality', initialData.quality);
    }
  }, [initialData, brandOptions, setValue]);

  const onSubmit = async (data: StorageUnitData) => {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        const { status } = await api.post(`/storage-unit${initialData?.id}`, {
          ...data,
        });
        if (!isSuccessStatus(status)) throw new Error('Erro na requisição');
      } else {
        const { status } = await api.post(`/storage-unit`, {
          ...data,
        });
        if (!isSuccessStatus(status)) throw new Error('Erro na requisição');
      }
      setMessage('Formulário enviado com sucesso!');
      reset();
    } catch (e) {
      setMessage('Erro ao enviar o formulário.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
      onSave?.();
    }
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData
          ? 'Editar Unidade de Armazenamento'
          : 'Criar Nova Unidade de Armazenamento'}
      </h2>
      {message && (
        <p className="text-center text-sm text-gray-700">{message}</p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="marca"
            className="block text-sm font-medium text-gray-700"
          >
            Marca
          </label>
          <Controller
            name="brandId"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  {...register('brandId', { required: 'Campo obrigatório' })}
                >
                  <SelectTrigger
                    className={errors.brandId ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Marca*" />
                  </SelectTrigger>
                  <SelectContent>
                    {brandOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          />
        </div>
        <div>
          <label
            htmlFor="qualidade"
            className="block text-sm font-medium text-gray-700"
          >
            Qualidade
          </label>
          <Controller
            name="quality"
            control={control}
            render={({ field }) => (
              <>
                <Select
                  onValueChange={field.onChange}
                  value={field.value?.toString()}
                  {...register('quality', { required: 'Campo obrigatório' })}
                >
                  <SelectTrigger
                    className={errors.quality ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Qualidade*" />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-red-500 text-sm mt-1">
                  {errors.quality?.message}
                </p>
              </>
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
            {initialData ? 'Guardar Alterações' : 'Criar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
