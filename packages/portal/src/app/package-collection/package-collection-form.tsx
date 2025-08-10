'use client';

import {
  CollectionItemResponse,
  PackageCollectionFormData,
  Shift,
} from '@/app/types/package-collection';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchWithAuth } from '@/lib/fetcher';
import { useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { Role, UserResponse, UserStatus } from '../types/user';

interface PackageCollectionFormProps {
  onFormClose: () => void;
  initialData?: PackageCollectionFormData;
  onSave: (data: PackageCollectionFormData) => void;
}

export default function PackageCollectionForm({
  onFormClose,
  initialData,
  onSave,
}: PackageCollectionFormProps) {
  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<PackageCollectionFormData>({
    defaultValues: initialData || {
      driver: '',
      collectionDate: '',
      shift: Shift.MORNING,
      selectedCollectionItems: [],
    },
  });

  const [message, setMessage] = useState<string | null>(null);
  const [driverOptions, setDriverOptions] = useState<UserResponse[]>([]);
  const shiftOptions = [Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT];
  const [collectionItems] = useState<CollectionItemResponse[]>([
    {
      id: 'addr1',
      address: 'Rua da boavista 123',
      dayOfWeek: 'Segunda-feira',
      shift: Shift.NIGHT,
    },
    {
      id: 'addr2',
      address: 'Rua da boavista 456',
      dayOfWeek: 'Segunda-feira',
      shift: Shift.NIGHT,
    },
    {
      id: 'addr3',
      address: 'Rua da boavista 789',
      dayOfWeek: 'Segunda-feira',
      shift: Shift.NIGHT,
    },
  ]);
  const fetchData = async () => {
    const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}user`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Failed to fetch users');
      return;
    }
    const data: UserResponse[] = await res.json();
    setDriverOptions(
      data.filter(
        (user) =>
          user.roles.some((role) => role.role === Role.DRIVER) &&
          user.status === UserStatus.ACTIVE
      )
    );
  };
  useEffect(() => {
    fetchData();
  }, []);
  const onSubmit: SubmitHandler<PackageCollectionFormData> = async (data) => {
    setMessage(null);
    try {
      await onSave(data);
      setMessage('Recolha de encomendas guardada com sucesso!');
    } catch (e) {
      setMessage('Erro ao guardar a recolha de encomendas.');
      console.error(e);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Registo de Recolha de Encomendas
      </h2>

      {message && (
        <p className="text-center text-sm text-gray-700">{message}</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver Dropdown */}
          <div>
            <label
              htmlFor="driver"
              className="block text-sm font-medium text-gray-700"
            >
              Motorista
            </label>
            <Controller
              name="driver"
              control={control}
              rules={{ required: 'O motorista é obrigatório' }}
              render={({ field }) => (
                <>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="driver"
                      className={`mt-1 block w-full px-3 py-2 border ${
                        errors.driver ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm`}
                    >
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {driverOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.firstName} {option.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.driver && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.driver.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

          {/* Collection Date Input */}
          <div>
            <label
              htmlFor="collectionDate"
              className="block text-sm font-medium text-gray-700"
            >
              Data da Recolha
            </label>
            <input
              type="date"
              id="collectionDate"
              {...register('collectionDate', {
                required: 'A data é obrigatória',
              })}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.collectionDate ? 'border-red-500' : 'border-gray-300'
              } rounded-md shadow-sm`}
            />
            {errors.collectionDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.collectionDate.message}
              </p>
            )}
          </div>

          {/* Shift Dropdown */}
          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="shift"
              className="block text-sm font-medium text-gray-700"
            >
              Turno
            </label>
            <Controller
              name="shift"
              control={control}
              rules={{ required: 'O turno é obrigatório' }}
              render={({ field }) => (
                <>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id="shift"
                      className={`mt-1 block w-full px-3 py-2 border ${
                        errors.shift ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm`}
                    >
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.shift && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.shift.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        </div>

        {/* Collection Selection Table */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Seleção de Encomendas
          </h3>
          <div className="mt-4 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Morada</TableHead>
                  <TableHead>Dia da semana</TableHead>
                  <TableHead>Turno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        value={item.id}
                        {...register('selectedCollectionItems')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </TableCell>
                    <TableCell>{item.address}</TableCell>
                    <TableCell>{item.dayOfWeek}</TableCell>
                    <TableCell>{item.shift}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            onClick={onFormClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? 'A Submeter...' : 'Submeter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
