'use client';

import {
  CollectionItemResponse,
  PackageCollectionFormData,
  Shift,
} from '@/app/types/package-collection';
import { CheckboxForm } from '@/components/form/checkbox-form';
import { DatePickerForm } from '@/components/form/date-picker-form';
import { SelectForm } from '@/components/form/select-form';
import { InputForm } from '@/components/form/input-form';
import Title from '@/components/title';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchWithAuth } from '@/lib/fetcher';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Role, UserResponse, UserStatus } from '../types/user';

interface PackageCollectionFormProps {
  onFormClose: () => void;
  initialData?: PackageCollectionFormData;
  onSave: () => void;
}

export default function PackageCollectionForm({
  onFormClose,
  initialData,
  onSave,
}: PackageCollectionFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PackageCollectionFormData>({
    defaultValues: initialData || {
      driver: '',
      collectionDate: new Date(),
      shift: Shift.MORNING,
      packageIds: [],
    },
  });

  const [, setDriverOptions] = useState<UserResponse[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shiftOptions = [Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT];
  const [collectionItems, setCollectionItems] = useState<
    CollectionItemResponse[]
  >([
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

  const packageIds = watch('packageIds');
  const collectionDate = watch('collectionDate');
  const dayOfWeek = [
    'Domingo',
    'Segunda-Feira',
    'Terça-Feira',
    'Quarta-Feira',
    'Quinta-Feira',
    'Sexta-Feira',
    'Sábado',
  ];

  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    fetchPackageCollectionItems();
  }, [collectionDate]);

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

  const fetchPackageCollectionItems = async () => {
    const res = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}package/created?collectDay=${
        dayOfWeek[collectionDate.getDay()]
      }&collectTime=${watch('shift')}&page=1&limit=10`,
      {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!res.ok) {
      console.error('Failed to fetch users');
      return;
    }
    const data: any[] = await res.json();
    console.log('[xxx] ~ fetchPackageCollectionItems ~ data:', data);
    setCollectionItems(data);
  };

  const onSubmit = async (data: PackageCollectionFormData) => {
    console.log('[xxx] ~ onSubmit ~ data:', data);
    // setIsSubmitting(true);
    // try {
    //   const res = await fetch(
    //     `${process.env.NEXT_PUBLIC_API_URL}route${
    //       initialData?.id ? `/${initialData.id}` : ''
    //     }`,
    //     {
    //       method: initialData?.id ? 'PUT' : 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({
    //         ...data,
    //       }),
    //     }
    //   );
    //   if (!res.ok) throw new Error('Erro na requisição');
    //   setMessage('Formulário enviado com sucesso!');
    //   reset();
    // } catch (e) {
    //   setMessage('Erro ao enviar o formulário.');
    //   console.error(e);
    // } finally {
    //   setIsSubmitting(false);
    //   onSave?.();
    // }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto my-8">
      <Title as="h2">Registo de Recolha de Encomendas</Title>

      {message && <p className="text-center text-sm ">{message}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Driver Dropdown */}
          <div>
            <InputForm
              name="driver"
              control={control}
              label="Motorista"
              rules={{ required: 'O motorista é obrigatório' }}
              errors={errors}
            />
          </div>

          {/* Collection Date Input */}
          <div>
            <DatePickerForm
              label="Data da Recolha"
              name="collectionDate"
              control={control}
              rules={{ required: 'A data é obrigatória' }}
            />
          </div>

          {/* Shift Dropdown */}
          <div className="col-span-1 md:col-span-2">
            <SelectForm
              label="Turno"
              name="shift"
              control={control}
              rules={{ required: 'O turno é obrigatório' }}
              options={shiftOptions}
            />
          </div>
        </div>

        {/* Collection Selection Table */}
        <div className="pt-6">
          <Title as="h3">Seleção de Encomendas</Title>
          <div className="mt-4 w-full ">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Morada</TableHead>
                  <TableHead>Dia da semana</TableHead>
                  <TableHead>Turno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <CheckboxForm
                        control={control}
                        name="packageIds"
                        checked={packageIds?.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setValue('packageIds', [
                              ...(packageIds || []),
                              item.id,
                            ]);
                          } else {
                            setValue(
                              'packageIds',
                              (packageIds || []).filter(
                                (id: string) => id !== item.id
                              )
                            );
                          }
                        }}
                        label=""
                        id={item.id}
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
          <Button type="button" onClick={onFormClose} variant={'outline'}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} variant={'secondary'}>
            {isSubmitting ? 'A Submeter...' : 'Submeter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
