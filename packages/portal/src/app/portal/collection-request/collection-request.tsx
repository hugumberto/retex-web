'use client';

import { PackageDTO } from '@/app/types/package';
import { DialogForm } from '@/components/form/dialog-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { FocusEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface CollectionRequestFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  dayOfWeek: string;
  timeOfDay: string;
  address: {
    street: string;
    number: string;
    complement: string;
    city: string;
    cityDivision: string;
    country: string;
    countryDivision: string;
    zipCode: string;
    lat: string;
    long: string;
  };
}

const weekDays = [
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
  'Domingo',
];

const shifts = ['Manhã', 'Tarde', 'Noite'];

const getSafePackages = (payload: unknown): PackageDTO[] => {
  if (Array.isArray(payload)) {
    return payload as PackageDTO[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: PackageDTO[] }).data;
  }

  return [];
};

export default function CollectionRequest() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [requests, setRequests] = useState<PackageDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    resetField,
    formState: { errors },
  } = useForm<CollectionRequestFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactPhone: '',
      dayOfWeek: '',
      timeOfDay: '',
      address: {
        street: '',
        number: '',
        complement: '',
        city: '',
        cityDivision: '',
        country: '',
        countryDivision: '',
        zipCode: '',
        lat: '',
        long: '',
      },
    },
  });
  const zipCodeField = register('address.zipCode', {
    required: 'Campo obrigatório',
  });

  const fetchRequests = useCallback(async () => {
    try {
      const { data, status } = await api.get<unknown>('/package');
      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao buscar solicitações de coleta');
      }

      setRequests(getSafePackages(data));
    } catch (error) {
      console.error('Erro ao buscar solicitações de coleta:', error);
      toast.error('Não foi possível carregar as solicitações de coleta');
    }
  }, []);

  useEffect(() => {
    setPageTitle('Solicitação de Coleta');
    setBreadcrumbs([
      {
        label: 'Solicitação de Coleta',
        href: '/portal/collection-request',
      },
    ]);

    fetchRequests();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchRequests, setBreadcrumbs, setPageTitle]);

  const onSubmit: SubmitHandler<CollectionRequestFormData> = async (data) => {
    setIsSubmitting(true);

    await toast.promise(
      async () => {
        const response = await api.post('/package', {
          ...data,
          address: {
            street: data.address.street,
            city: data.address.city,
            cityDivision: data.address.cityDivision,
            country: data.address.country,
            countryDivision: data.address.countryDivision,
            zipCode: data.address.zipCode,
            lat: data.address.lat ? data.address.lat.toString() : '0',
            long: data.address.long ? data.address.long.toString() : '0',
            number: data.address.number,
            complement: data.address.complement,
          },
        });

        if (!isSuccessStatus(response.status) && response.status !== 409) {
          throw new Error('Erro na criação da solicitação de coleta');
        }

        reset();
        await fetchRequests();
      },
      {
        loading: 'A criar solicitação...',
        success: 'Solicitação de coleta criada com sucesso',
        error: 'Não foi possível criar a solicitação de coleta',
      }
    );

    setIsSubmitting(false);
  };

  const handleBlurPostalCode = async (e: FocusEvent<HTMLInputElement>) => {
    const postalCode = e.target.value.trim();

    if (!postalCode) {
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TOMTOM_API_URL}${postalCode}.json?typeahead=false&limit=1&countrySet=pt&extendedPostalCodesFor=addr&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}`
      );

      if (!res.ok) {
        throw new Error('Erro ao buscar endereço');
      }

      const { results } = await res.json();

      if (!Array.isArray(results) || results.length === 0) {
        toast.error('Código postal não encontrado');
        return;
      }

      const { address, position } = results[0];
      const {
        streetName,
        municipality,
        countrySubdivision,
        countrySecondarySubdivision,
        municipalitySubdivision,
        country,
      } = address;

      setValue('address.street', streetName ?? '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('address.cityDivision', municipalitySubdivision ?? '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('address.city', municipality ?? '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue(
        'address.countryDivision',
        countrySecondarySubdivision ?? countrySubdivision ?? '',
        {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        }
      );
      setValue('address.zipCode', postalCode, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue('address.country', country ?? '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      const { lat, lon } = position ?? {};

      setValue('address.lat', lat ? lat.toString() : '');
      setValue('address.long', lon ? lon.toString() : '');
      resetField('address.number', {
        defaultValue: '',
      });
    } catch (error) {
      console.error('Erro ao buscar endereço', error);
      toast.error('Não foi possível buscar o endereço pelo código postal');
    }
  };

  return (
    <section id="collection-request-page" className="space-y-6">
      <div className="flex justify-end">
        <DialogForm<CollectionRequestFormData>
          title="Nova Solicitação de Coleta"
          confirmText="Criar Solicitação"
          loading={isSubmitting}
          errors={errors}
          onConfirm={handleSubmit(onSubmit)}
          trigger={
            <Button variant="secondary" disabled={isSubmitting}>
              Criar Solicitação
            </Button>
          }
        >
          <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div>
              <Input
                tabIndex={1}
                placeholder="Nome*"
                className={errors.firstName ? 'border-red-500' : ''}
                {...register('firstName', { required: 'Campo obrigatório' })}
              />
            </div>
            <div>
              <Input
                tabIndex={2}
                placeholder="Apelido*"
                className={errors.lastName ? 'border-red-500' : ''}
                {...register('lastName', { required: 'Campo obrigatório' })}
              />
            </div>

            <div>
              <Input
                tabIndex={3}
                placeholder="Email*"
                type="email"
                className={errors.email ? 'border-red-500' : ''}
                {...register('email', { required: 'Campo obrigatório' })}
              />
            </div>
            <div>
              <Input
                tabIndex={4}
                placeholder="Contacto*"
                className={errors.contactPhone ? 'border-red-500' : ''}
                {...register('contactPhone', { required: 'Campo obrigatório' })}
              />
            </div>

            <div>
              <Controller
                name="dayOfWeek"
                control={control}
                rules={{ required: 'Campo obrigatório' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      tabIndex={6}
                      className={errors.dayOfWeek ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Dia da Semana*" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Controller
                name="timeOfDay"
                control={control}
                rules={{ required: 'Campo obrigatório' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      tabIndex={7}
                      className={errors.timeOfDay ? 'border-red-500' : ''}
                    >
                      <SelectValue placeholder="Turno*" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((shift) => (
                        <SelectItem key={shift} value={shift}>
                          {shift}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Input
                tabIndex={8}
                placeholder="Código Postal*"
                className={errors.address?.zipCode ? 'border-red-500' : ''}
                {...zipCodeField}
                onBlur={(event) => {
                  zipCodeField.onBlur(event);
                  void handleBlurPostalCode(event);
                }}
              />
            </div>
            <div>
              <Input
                tabIndex={9}
                placeholder="Morada*"
                className={errors.address?.street ? 'border-red-500' : ''}
                {...register('address.street', {
                  required: 'Campo obrigatório',
                })}
              />
            </div>

            <div>
              <Input
                tabIndex={10}
                placeholder="Freguesia*"
                className={errors.address?.cityDivision ? 'border-red-500' : ''}
                {...register('address.cityDivision', {
                  required: 'Campo obrigatório',
                })}
              />
            </div>
            <div>
              <Input
                tabIndex={11}
                placeholder="Concelho*"
                className={errors.address?.city ? 'border-red-500' : ''}
                {...register('address.city', { required: 'Campo obrigatório' })}
              />
            </div>

            <div>
              <Input
                tabIndex={12}
                placeholder="Distrito*"
                className={
                  errors.address?.countryDivision ? 'border-red-500' : ''
                }
                {...register('address.countryDivision', {
                  required: 'Campo obrigatório',
                })}
              />
            </div>
            <div>
              <Input
                tabIndex={13}
                placeholder="País*"
                className={errors.address?.country ? 'border-red-500' : ''}
                {...register('address.country', {
                  required: 'Campo obrigatório',
                })}
              />
            </div>

            <div>
              <Input
                tabIndex={14}
                placeholder="Nº edifício/porta*"
                className={errors.address?.number ? 'border-red-500' : ''}
                {...register('address.number', {
                  required: 'Campo obrigatório',
                })}
              />
            </div>
            <div>
              <Input
                tabIndex={15}
                placeholder="Complemento Morada"
                {...register('address.complement')}
              />
            </div>

            <div>
              <Input
                tabIndex={16}
                placeholder="Latitude*"
                className={errors.address?.lat ? 'border-red-500' : ''}
                {...register('address.lat', { required: 'Campo obrigatório' })}
              />
            </div>
            <div>
              <Input
                tabIndex={17}
                placeholder="Longitude*"
                className={errors.address?.long ? 'border-red-500' : ''}
                {...register('address.long', { required: 'Campo obrigatório' })}
              />
            </div>
          </div>
        </DialogForm>
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary">
          Solicitações de Coleta
        </h2>

        <div className="mt-4 w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.id}</TableCell>
                    <TableCell>
                      {`${request.user?.firstName ?? '-'} ${
                        request.user?.lastName ?? ''
                      }`.trim()}
                    </TableCell>
                    <TableCell>{request.user?.email ?? '-'}</TableCell>
                    <TableCell>{request.user?.contactPhone ?? '-'}</TableCell>
                    <TableCell>{request.collectDay ?? '-'}</TableCell>
                    <TableCell>{request.collectTime ?? '-'}</TableCell>
                    <TableCell>
                      {`${request.address?.street ?? '-'} ${
                        request.address?.number ?? ''
                      }`.trim()}
                    </TableCell>
                    <TableCell>{request.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
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
    </section>
  );
}
