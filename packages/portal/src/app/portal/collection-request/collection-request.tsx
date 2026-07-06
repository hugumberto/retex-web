'use client';

import { PackageDTO, PackageStatus } from '@/app/types/package';
import { AddressDTO, Role } from '@/app/types/user';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { TrashIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DialogForm } from '@/components/form/dialog-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  estimatedVolumes: string;
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
  estimatedVolumes: string;
}



export default function CollectionRequest() {
  const { setPageTitle, setBreadcrumbs, user } = useAppStore();
  const [requests, setRequests] = useState<PackageDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const isUserRole = user?.roles?.some((r) => r.role === Role.USER) ?? false;
  const inZoneAddresses = addresses.filter((a) => a.isInServiceZone);
  const canRequest = inZoneAddresses.length > 0;
  const hasActiveRequest = isUserRole && requests.some(
    (r) => r.status !== PackageStatus.CANCELLED && r.status !== PackageStatus.STOCKED
  );

  const [userFormOpen, setUserFormOpen] = useState(false);
  const userForm = useForm<UserFormData>({ defaultValues: { addressId: '', estimatedVolumes: '' } });
  const adminForm = useForm<AdminFormData>({
    defaultValues: {
      firstName: '', lastName: '', email: '', contactPhone: '', estimatedVolumes: '',
      address: { street: '', number: '', complement: '', city: '', cityDivision: '', country: '', countryDivision: '', zipCode: '', lat: '', long: '' },
    },
  });

  const fetchRequests = useCallback(async () => {
    try {
      const endpoint = isUserRole ? '/me/packages' : '/package';
      const { data, status } = await api.get<PackageDTO[]>(endpoint);
      if (!isSuccessStatus(status)) throw new Error();
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Não foi possível carregar as solicitações de recolha');
    }
  }, [isUserRole]);

  const cancelRequest = useCallback(async (id: string) => {
    await toast.promise(
      async () => {
        const res = await api.patch(`/package/${id}`, { status: PackageStatus.CANCELLED });
        if (!isSuccessStatus(res.status)) throw new Error();
        await fetchRequests();
      },
      {
        loading: 'A cancelar...',
        success: 'Solicitação cancelada',
        error: 'Não foi possível cancelar a solicitação',
      }
    );
  }, [fetchRequests]);

  useEffect(() => {
    setPageTitle('Solicitação de Recolha');
    setBreadcrumbs([{ label: 'Solicitação de Recolha', href: '/portal/collection-request' }]);
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
    try {
      const response = await api.post('/package', {
        userId: user!.id,
        addressId: data.addressId,
        estimatedVolumes: Number(data.estimatedVolumes),
      });
      if (!isSuccessStatus(response.status) && response.status !== 409) throw new Error();
      userForm.reset();
      await fetchRequests();
      setUserFormOpen(false);
      toast.success('Solicitação de recolha criada com sucesso');
    } catch {
      toast.error('Não foi possível criar a solicitação de recolha');
    } finally {
      setIsSubmitting(false);
    }
  });

  const submitAdmin = adminForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    await toast.promise(
      async () => {
        const response = await api.post('/package', {
          ...data,
          estimatedVolumes: Number(data.estimatedVolumes),
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
      { loading: 'A criar solicitação...', success: 'Solicitação de recolha criada com sucesso', error: 'Não foi possível criar a solicitação de recolha' }
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
          ) : hasActiveRequest ? (
            <Alert className="max-w-md ml-auto">
              <AlertTitle>Solicitação em curso</AlertTitle>
              <AlertDescription>
                Já tem uma solicitação de recolha activa. Aguarde a conclusão ou cancelamento antes de criar uma nova.
              </AlertDescription>
            </Alert>
          ) : canRequest ? (
            <DialogForm<UserFormData>
              title="Nova Solicitação de Recolha"
              confirmText="Criar Solicitação"
              loading={isSubmitting}
              errors={userForm.formState.errors}
              onConfirm={submitUser}
              open={userFormOpen}
              onOpenChange={(open) => { setUserFormOpen(open); if (!open) userForm.reset(); }}
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
                    <div className="flex flex-col gap-2">
                      {userForm.formState.errors.addressId && (
                        <p className="text-xs text-destructive">Selecione um endereço</p>
                      )}
                      {inZoneAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                            field.value === addr.id
                              ? 'border-secondary bg-secondary/5'
                              : 'border-border hover:bg-muted/40'
                          }`}
                        >
                          <input
                            type="radio"
                            className="mt-0.5 accent-secondary"
                            value={addr.id}
                            checked={field.value === addr.id}
                            onChange={() => field.onChange(addr.id)}
                          />
                          <div className="text-sm">
                            <p className="font-medium text-foreground">
                              {addr.street}, {addr.number}
                              {addr.complement ? ` ${addr.complement}` : ''}
                            </p>
                            <p className="text-muted-foreground">{addr.zipCode} — {addr.city}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                />
                <div>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Estimativa de volumes*"
                    className={userForm.formState.errors.estimatedVolumes ? 'border-red-500' : ''}
                    {...userForm.register('estimatedVolumes', {
                      required: 'Campo obrigatório',
                      min: { value: 1, message: 'Mínimo 1 volume' },
                    })}
                  />
                  {userForm.formState.errors.estimatedVolumes && (
                    <p className="text-xs text-destructive mt-1">
                      {userForm.formState.errors.estimatedVolumes.message}
                    </p>
                  )}
                </div>
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
            title="Nova Solicitação de Recolha"
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
              <Input tabIndex={15} type="number" min={1} placeholder="Estimativa de volumes*" className={adminErrors.estimatedVolumes ? 'border-red-500' : ''} {...adminRegister('estimatedVolumes', { required: 'Campo obrigatório', min: { value: 1, message: 'Mínimo 1 volume' } })} />
            </div>
          </DialogForm>
        )}
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary">Solicitações de Recolha</h2>
        <div className="mt-4 w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>Volumes (est.)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{`${request.user?.firstName ?? '-'} ${request.user?.lastName ?? ''}`.trim()}</TableCell>
                    <TableCell>{request.user?.email ?? '-'}</TableCell>
                    <TableCell>{request.user?.contactPhone ?? '-'}</TableCell>
                    <TableCell>{`${request.address?.street ?? '-'} ${request.address?.number ?? ''}`.trim()}</TableCell>
                    <TableCell>{request.estimatedVolumes ?? '-'}</TableCell>
                    <TableCell>{request.status}</TableCell>
                    <TableCell>
                      {(request.status === PackageStatus.CREATED || request.status === PackageStatus.OUT_OF_ZONE) && (
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="size-8">
                              <TrashIcon />
                            </Button>
                          }
                          onConfirm={() => cancelRequest(request.id)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
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
