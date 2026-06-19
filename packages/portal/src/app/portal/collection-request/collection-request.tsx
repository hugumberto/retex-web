'use client';

import { PackageDTO } from '@/app/types/package';
import { AddressDTO, Role } from '@/app/types/user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { MapPinOff } from 'lucide-react';
import Link from 'next/link';
import { FocusEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
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

interface UserFormData {
  addressId: string;
}

const getSafePackages = (payload: unknown): PackageDTO[] => {
  if (Array.isArray(payload)) return payload as PackageDTO[];
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data: unknown }).data)) {
    return (payload as { data: PackageDTO[] }).data;
  }
  return [];
};

const formatAddress = (addr: AddressDTO) =>
  `${addr.street}, ${addr.number} — ${addr.city}`;

export default function CollectionRequest() {
  const { setPageTitle, setBreadcrumbs, user } = useAppStore();
  const [requests, setRequests] = useState<PackageDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const isUserRole = user?.roles?.some((r) => r.role === Role.USER) ?? false;
  const inZoneAddresses = addresses.filter((a) => a.isInServiceZone);
  const canRequest = inZoneAddresses.length > 0;

  const userForm = useForm<UserFormData>({ defaultValues: { addressId: '' } });
  const adminForm = useForm<AdminFormData>({
    defaultValues: {
      firstName: '', lastName: '', email: '', contactPhone: '',
      address: { street: '', number: '', complement: '', city: '', cityDivision: '', country: '', countryDivision: '', zipCode: '', lat: '', long: '' },
    },
  });

  const fetchRequests = useCallback(async () => {
    try {
      const { data, status } = await api.get<unknown>('/package');
      if (!isSuccessStatus(status)) throw new Error();
      setRequests(getSafePackages(data));
    } catch {
      toast.error('Não foi possível carregar as solicitações de coleta');
    }
  }, []);

  useEffect(() => {
    setPageTitle('Solicitação de Coleta');
    setBreadcrumbs([{ label: 'Solicitação de Coleta', href: '/portal/collection-request' }]);
    fetchRequests();

    if (isUserRole) {
      setIsLoadingAddresses(true);
      api.get<AddressDTO[]>('/me/address')
        .then(({ data }) => setAddresses(data ?? []))
        .catch(() => toast.error('Não foi possível carregar os endereços'))
        .finally(() => setIsLoadingAddresses(false));
    }

    return () => { setPageTitle(''); setBreadcrumbs([]); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRequests, setBreadcrumbs, setPageTitle]);

  const submitUser = userForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    await toast.promise(
      async () => {
        const response = await api.post('/package', { userId: user!.id, addressId: data.addressId });
        if (!isSuccessStatus(response.status) && response.status !== 409) throw new Error();
        userForm.reset();
        await fetchRequests();
      },
      { loading: 'A criar solicitação...', success: 'Solicitação de coleta criada com sucesso', error: 'Não foi possível criar a solicitação de coleta' }
    );
    setIsSubmitting(false);
  });

  const submitAdmin = adminForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    await toast.promise(
      async () => {
        const response = await api.post('/package', {
          ...data,
          address: {
            street: data.address.street, city: data.address.city, cityDivision: data.address.cityDivision,
            country: data.address.country, countryDivision: data.address.countryDivision,
            zipCode: data.address.zipCode,
            lat: data.address.lat || '0', long: data.address.long || '0',
            number: data.address.number, complement: data.address.complement,
          },
        });
        if (!isSuccessStatus(response.status) && response.status !== 409) throw new Error();
        adminForm.reset();
        await fetchRequests();
      },
      { loading: 'A criar solicitação...', success: 'Solicitação de coleta criada com sucesso', error: 'Não foi possível criar a solicitação de coleta' }
    );
    setIsSubmitting(false);
  });

  const handleBlurPostalCode = async (e: FocusEvent<HTMLInputElement>) => {
    const postalCode = e.target.value.trim();
    if (!postalCode) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TOMTOM_API_URL}${postalCode}.json?typeahead=false&limit=1&countrySet=pt&extendedPostalCodesFor=addr&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}`
      );
      if (!res.ok) throw new Error();
      const { results } = await res.json();
      if (!Array.isArray(results) || results.length === 0) { toast.error('Código postal não encontrado'); return; }
      const { address, position } = results[0];
      const { streetName, municipality, countrySubdivision, countrySecondarySubdivision, municipalitySubdivision, country } = address;
      const { setValue, resetField } = adminForm;
      setValue('address.street', streetName ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      setValue('address.cityDivision', municipalitySubdivision ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      setValue('address.city', municipality ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      setValue('address.countryDivision', countrySecondarySubdivision ?? countrySubdivision ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      setValue('address.zipCode', postalCode, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      setValue('address.country', country ?? '', { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      const { lat, lon } = position ?? {};
      setValue('address.lat', lat ? lat.toString() : '');
      setValue('address.long', lon ? lon.toString() : '');
      resetField('address.number', { defaultValue: '' });
    } catch {
      toast.error('Não foi possível buscar o endereço pelo código postal');
    }
  };

  const adminErrors = adminForm.formState.errors;
  const adminRegister = adminForm.register;
  const zipCodeField = adminRegister('address.zipCode', { required: 'Campo obrigatório' });

  return (
    <section id="collection-request-page" className="space-y-6">
      <div className="flex justify-end">
        {isUserRole ? (
          isLoadingAddresses ? (
            <Button variant="secondary" disabled>A carregar...</Button>
          ) : canRequest ? (
            <DialogForm<UserFormData>
              title="Nova Solicitação de Coleta"
              confirmText="Criar Solicitação"
              loading={isSubmitting}
              errors={userForm.formState.errors}
              onConfirm={submitUser}
              trigger={<Button variant="secondary" disabled={isSubmitting}>Criar Solicitação</Button>}
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-muted-foreground">{user?.contactPhone}</p>
                </div>
                <Controller
                  name="addressId"
                  control={userForm.control}
                  rules={{ required: 'Selecione um endereço' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={userForm.formState.errors.addressId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecionar endereço*" />
                      </SelectTrigger>
                      <SelectContent>
                        {inZoneAddresses.map((addr) => (
                          <SelectItem key={addr.id} value={addr.id}>
                            {formatAddress(addr)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </DialogForm>
          ) : (
            <Alert variant="destructive" className="max-w-md ml-auto">
              <MapPinOff className="size-4" />
              <AlertTitle>Fora da zona de actuação</AlertTitle>
              <AlertDescription>
                Não tem nenhum endereço dentro da zona de actuação.{' '}
                <Link href="/portal/perfil" className="underline font-medium">Adicione um endereço</Link>{' '}
                na zona de actuação antes de solicitar uma coleta.
              </AlertDescription>
            </Alert>
          )
        ) : (
          <DialogForm<AdminFormData>
            title="Nova Solicitação de Coleta"
            confirmText="Criar Solicitação"
            loading={isSubmitting}
            errors={adminErrors}
            onConfirm={submitAdmin}
            trigger={<Button variant="secondary" disabled={isSubmitting}>Criar Solicitação</Button>}
          >
            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
              <Input tabIndex={1} placeholder="Nome*" className={adminErrors.firstName ? 'border-red-500' : ''} {...adminRegister('firstName', { required: 'Campo obrigatório' })} />
              <Input tabIndex={2} placeholder="Apelido*" className={adminErrors.lastName ? 'border-red-500' : ''} {...adminRegister('lastName', { required: 'Campo obrigatório' })} />
              <Input tabIndex={3} placeholder="Email*" type="email" className={adminErrors.email ? 'border-red-500' : ''} {...adminRegister('email', { required: 'Campo obrigatório' })} />
              <Input tabIndex={4} placeholder="Contacto*" className={adminErrors.contactPhone ? 'border-red-500' : ''} {...adminRegister('contactPhone', { required: 'Campo obrigatório' })} />
              <Input
                tabIndex={5}
                placeholder="Código Postal*"
                className={adminErrors.address?.zipCode ? 'border-red-500' : ''}
                {...zipCodeField}
                onBlur={(event) => { zipCodeField.onBlur(event); void handleBlurPostalCode(event); }}
              />
              <Input tabIndex={6} placeholder="Morada*" className={adminErrors.address?.street ? 'border-red-500' : ''} {...adminRegister('address.street', { required: 'Campo obrigatório' })} />
              <Input tabIndex={7} placeholder="Freguesia*" className={adminErrors.address?.cityDivision ? 'border-red-500' : ''} {...adminRegister('address.cityDivision', { required: 'Campo obrigatório' })} />
              <Input tabIndex={8} placeholder="Concelho*" className={adminErrors.address?.city ? 'border-red-500' : ''} {...adminRegister('address.city', { required: 'Campo obrigatório' })} />
              <Input tabIndex={9} placeholder="Distrito*" className={adminErrors.address?.countryDivision ? 'border-red-500' : ''} {...adminRegister('address.countryDivision', { required: 'Campo obrigatório' })} />
              <Input tabIndex={10} placeholder="País*" className={adminErrors.address?.country ? 'border-red-500' : ''} {...adminRegister('address.country', { required: 'Campo obrigatório' })} />
              <Input tabIndex={11} placeholder="Nº edifício/porta*" className={adminErrors.address?.number ? 'border-red-500' : ''} {...adminRegister('address.number', { required: 'Campo obrigatório' })} />
              <Input tabIndex={12} placeholder="Complemento Morada" {...adminRegister('address.complement')} />
              <Input tabIndex={13} placeholder="Latitude*" className={adminErrors.address?.lat ? 'border-red-500' : ''} {...adminRegister('address.lat', { required: 'Campo obrigatório' })} />
              <Input tabIndex={14} placeholder="Longitude*" className={adminErrors.address?.long ? 'border-red-500' : ''} {...adminRegister('address.long', { required: 'Campo obrigatório' })} />
            </div>
          </DialogForm>
        )}
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary">Solicitações de Coleta</h2>
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
                    <TableCell>{`${request.user?.firstName ?? '-'} ${request.user?.lastName ?? ''}`.trim()}</TableCell>
                    <TableCell>{request.user?.email ?? '-'}</TableCell>
                    <TableCell>{request.user?.contactPhone ?? '-'}</TableCell>
                    <TableCell>{request.collectDay ?? '-'}</TableCell>
                    <TableCell>{request.collectTime ?? '-'}</TableCell>
                    <TableCell>{`${request.address?.street ?? '-'} ${request.address?.number ?? ''}`.trim()}</TableCell>
                    <TableCell>{request.status}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
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
