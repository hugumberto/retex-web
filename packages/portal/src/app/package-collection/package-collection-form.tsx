'use client';

import {
  CollectionStatus,
  PackageCollectionDTO,
  PackageCollectionFormData,
  Shift,
} from '@/app/types/package-collection';
import Title from '@/components/custom/title';
import { CheckboxForm } from '@/components/form/checkbox-form';
import { DatePickerForm } from '@/components/form/date-picker-form';
import { DialogForm } from '@/components/form/dialog-form';
import { SelectFieldOption, SelectForm } from '@/components/form/select-form';
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
import { format } from 'date-fns';
import { PencilIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PaginatedResult } from '../types/helper';
import { PackageDTO } from '../types/package';
import { Role, UserDTO, UserStatus } from '../types/user';

interface PackageCollectionFormProps {
  packageCollectionId?: string;
  onSave: () => void;
}

export default function PackageCollectionForm({
  packageCollectionId,
  onSave,
}: PackageCollectionFormProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PackageCollectionFormData>({
    defaultValues: {
      driverId: '',
      startDate: undefined,
      shift: '' as Shift,
      packageIds: [],
      status: CollectionStatus.DRAFTING,
    },
  });

  const [driverOptions, setDriverOptions] = useState<SelectFieldOption[]>([]);
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing] = useState(!!packageCollectionId);
  const shiftOptions = [Shift.MORNING, Shift.AFTERNOON, Shift.NIGHT];
  const statusOptions = [
    CollectionStatus.DRAFTING,
    CollectionStatus.CREATED,
    CollectionStatus.IN_TRANSIT,
    CollectionStatus.FINISHED,
  ];

  const packageIds = watch('packageIds');
  const startDate: Date = watch('startDate');
  const shift = watch('shift');

  const dayOfWeek = useMemo(
    () => [
      'Domingo',
      'Segunda-Feira',
      'Terça-Feira',
      'Quarta-Feira',
      'Quinta-Feira',
      'Sexta-Feira',
      'Sábado',
    ],
    []
  );

  const fetchPackageCollectionItems = useCallback(async () => {
    if (!startDate || !shift) return;
    const res = await fetchWithAuth(
      `/package/created?collectDay=${
        dayOfWeek[startDate.getDay()]
      }&collectTime=${shift}&page=1&limit=10`,
      {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!res.ok) {
      console.error('Failed to fetch users');
      return;
    }
    const data: PaginatedResult<PackageDTO> = await res.json();
    setPackages(data.data);
  }, [startDate, shift, dayOfWeek]);

  useEffect(() => {
    fetchData();
    if (isEditing) fetchPackageCollectionItems();
  }, [fetchPackageCollectionItems, isEditing]);

  useEffect(() => {
    console.log('[xxx] ~ PackageCollectionForm ~ startDate:', startDate);
    if (startDate && shift) fetchPackageCollectionItems();
  }, [startDate, shift, fetchPackageCollectionItems]);

  const fetchData = async () => {
    const res = await fetchWithAuth(`/user`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Failed to fetch users');
      return;
    }
    const data: UserDTO[] = await res.json();
    setDriverOptions(
      data
        .filter(
          (user) =>
            user.roles.some((role) => role.role === Role.DRIVER) &&
            user.status === UserStatus.ACTIVE
        )
        .map((user) => ({
          label: `${user.firstName} ${user.lastName}`,
          value: user.id,
        }))
    );
  };
  const fetchCollectionDataById = async (
    id: string
  ): Promise<PackageCollectionDTO | undefined> => {
    const res = await fetchWithAuth(`/route/${id}`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Failed to fetch storage units');
      return;
    }
    return await res.json();
  };
  const getEditingItem = async (): Promise<
    PackageCollectionFormData | undefined
  > => {
    if (packageCollectionId) {
      const data = await fetchCollectionDataById(packageCollectionId);
      if (data) {
        return {
          id: data.id,
          driverId: data.driver.id,
          startDate: new Date(data.startDate),
          shift: Shift.NIGHT, // read from response,
          packageIds: data.packages.map((pkg) => pkg.id),
          status: data.status,
        };
      } else {
        return undefined;
      }
    }
    return undefined;
  };
  const handleOpenChange = (open: boolean) => {
    if (open && isEditing && packageCollectionId) {
      getEditingItem().then((data) => {
        reset(data);
      });
    }
  };

  const submit = async (data: PackageCollectionFormData) => {
    setIsSubmitting(true);
    toast.promise(
      async () => {
        const formattedDate = data.startDate
          ? format(data.startDate, "yyyy-MM-dd HH:mm:ss'.000000+00'")
          : undefined;

        const res = await fetchWithAuth(
          `/route${
            isEditing && packageCollectionId ? `/${packageCollectionId}` : ''
          }`,
          {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              startDate: formattedDate,
            }),
          }
        );
        if (!res.ok) throw new Error('Erro na requisição');
        reset();
      },
      {
        loading: 'Loading...',
        success: () => {
          onSave?.();
          return `Recolha de Encomendas ${
            isEditing ? 'atualizada' : 'criada'
          } com sucesso`;
        },
        error: () => {
          return `Erro ao ${
            isEditing ? 'atualizar' : 'criar'
          } a recolha de encomendas`;
        },
      }
    );
    setIsSubmitting(false);
  };

  return (
    <DialogForm
      triggerText="Criar"
      title="Recolha de Encomendas"
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
          <Button variant="secondary" className="w-full">
            Criar
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Driver Dropdown */}
        <div>
          <SelectForm
            label="Motorista"
            name="driverId"
            control={control}
            rules={{ required: 'O motorista é obrigatório' }}
            options={driverOptions}
            errors={errors}
          />
        </div>

        {/* Collection Date Input */}
        <div>
          <DatePickerForm
            label="Data da Recolha"
            name="startDate"
            control={control}
            rules={{ required: 'A data é obrigatória' }}
            errors={errors}
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
            errors={errors}
          />
        </div>
        {isEditing && (
          <div className="col-span-1 md:col-span-2">
            <SelectForm
              label="Status"
              name="status"
              control={control}
              options={statusOptions}
            />
          </div>
        )}
      </div>

      {/* Collection Selection Table */}
      <div className="pt-6">
        <Title as="h3">Seleção de Recolhas</Title>
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
              {packages && packages.length > 0 ? (
                packages.map((item) => (
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
                    <TableCell>{`${item.address.street} ${item.address.number}`}</TableCell>
                    <TableCell>{item.collectDay}</TableCell>
                    <TableCell>{item.collectTime}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhum registro encontrado!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DialogForm>
  );
}
