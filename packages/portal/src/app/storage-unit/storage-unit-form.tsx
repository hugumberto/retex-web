'use client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Quality, StorageUnitData } from '../types/storage-unit';

interface StorageUnitFormProps {
  onFormClose: () => void;
  initialData?: StorageUnitData;
  onSave?: (data: StorageUnitData) => void;
}

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
  const [formData, setFormData] = useState<StorageUnitData>();
  const [mensagem, setMensagem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // TODO: Replace with actual API call to fetch brands
  const brandOptions = [
    { id: '0228c478-4073-4b6b-a9a2-58e158ea40d0', name: 'The Kooples' },
    { id: '03658f63-5a37-4db4-ab24-37345f335fb6', name: 'Weekday' },
    { id: '08420ce3-7edc-407d-ae9c-49c161714324', name: 'Decenio' },
    { id: '0e4bf3c9-2027-4c5b-a4a9-62d8ec11e485', name: 'Stradivarius' },
    { id: '13190a59-b71c-4d65-a505-db39c7d53dfa', name: 'Tiger of Sweden' },
  ];
  const qualityOptions = [
    { id: Quality.GOOD, name: 'Boa' },
    { id: Quality.MEDIUM, name: 'Regular' },
    { id: Quality.BAD, name: 'Ruim' },
  ];

  const onSubmit = async (data: StorageUnitData) => {
    console.log('[xxx] ~ onSubmit ~ data:', data);
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}storage-unit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
          }),
        }
      );
      if (!res.ok) throw new Error('Erro na requisição');
      setMensagem('Formulário enviado com sucesso!');
      reset();
    } catch (e) {
      setMensagem('Erro ao enviar o formulário.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData
          ? 'Editar Unidade de Armazenamento'
          : 'Criar Nova Unidade de Armazenamento'}
      </h2>
      {mensagem && (
        <p className="text-center text-sm text-gray-700">{mensagem}</p>
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
            onClick={onFormClose} // Calls the parent-provided handler to close the form
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {initialData ? 'Guardar Alterações' : 'Criar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
