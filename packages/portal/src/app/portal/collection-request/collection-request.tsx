'use client';

import { useTranslations } from 'next-intl';
import RequesterTypeBadge from '@/components/custom/requester-type-badge';
import { CollectionRequestDTO, CollectionRequestStatus } from '@/app/types/collection-request';
import { CompanyAddressDTO, CompanyPermission } from '@/app/types/company';
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
import { firstAddressPart } from '@/utils/address';
import RequestDetailsDialog from './request-details-dialog';
import { useAppStore } from '@/store';
import { MapPinOff } from 'lucide-react';
import Link from 'next/link';
import { FocusEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactPhone: string;
  estimatedBags: string;
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
  estimatedBags: string;
}

/** Uma solicitação pode assentar numa morada pessoal ou num local de recolha da empresa. */
type RequestAddress = AddressDTO | CompanyAddressDTO;

export default function CollectionRequest() {
  const t = useTranslations('collectionRequest');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const { setPageTitle, setBreadcrumbs, user, companyContext, companyContextLoaded } =
    useAppStore();
  const [requests, setRequests] = useState<CollectionRequestDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Um membro de empresa recolhe nos locais da empresa, não em moradas
  // pessoais — que não tem. A API já aceita ambos em POST /collection-request
  // (ver `companyOwnsAddress` no use case); só faltava ir buscar à fonte certa.
  const [addresses, setAddresses] = useState<RequestAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const isCompanyMember = !!companyContext;
  const isUserRole = user?.roles?.some((r) => r.role === Role.USER) ?? false;
  const isAdmin = user?.roles?.some((r) => r.role === Role.ADMIN) ?? false;
  const [statusFilter, setStatusFilter] = useState<'ALL' | CollectionRequestStatus>(
    'ALL'
  );

  // Admin: filtra por estado e ordena (CRIADO primeiro; depois mais antigo
  // primeiro por data de criação). Restantes utilizadores veem a lista natural.
  const displayedRequests = useMemo(() => {
    if (!isAdmin) return requests;
    const list =
      statusFilter === 'ALL'
        ? requests
        : requests.filter((r) => r.status === statusFilter);
    return [...list].sort((a, b) => {
      const aCreated = a.status === CollectionRequestStatus.CREATED ? 0 : 1;
      const bCreated = b.status === CollectionRequestStatus.CREATED ? 0 : 1;
      if (aCreated !== bCreated) return aCreated - bCreated;
      return (
        new Date(a.createdAt ?? 0).getTime() -
        new Date(b.createdAt ?? 0).getTime()
      );
    });
  }, [requests, isAdmin, statusFilter]);

  const inZoneAddresses = addresses.filter((a) => a.isInServiceZone);
  const canRequest = inZoneAddresses.length > 0;
  // Um gestor com REQUEST_VIEW_ALL recebe em /me/collection-requests as
  // solicitações de TODA a empresa. A regra de "uma de cada vez" é por pessoa,
  // pelo que sem este filtro um colega com uma recolha a decorrer bloqueava-o.
  const seesAllCompanyRequests =
    companyContext?.permissions.includes(CompanyPermission.REQUEST_VIEW_ALL) ??
    false;
  const ownRequests = seesAllCompanyRequests
    ? requests.filter((r) => r.user?.id === user?.id)
    : requests;
  const hasActiveRequest =
    isUserRole &&
    ownRequests.some(
      (r) =>
        r.status !== CollectionRequestStatus.CANCELLED &&
        r.status !== CollectionRequestStatus.STOCKED
    );

  const [userFormOpen, setUserFormOpen] = useState(false);
  const userForm = useForm<UserFormData>({
    defaultValues: { addressId: '', estimatedBags: '' },
  });
  const adminForm = useForm<AdminFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      contactPhone: '',
      estimatedBags: '',
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

  const fetchRequests = useCallback(async () => {
    try {
      const endpoint = isUserRole ? '/me/collection-requests' : '/collection-request';
      // `/me/collection-requests` devolve um array; `/collection-request` é
      // paginado e devolve `{ data, meta }`.
      const { data, status } = await api.get<
        CollectionRequestDTO[] | { data: CollectionRequestDTO[] }
      >(endpoint);
      if (!isSuccessStatus(status)) throw new Error();
      const list = Array.isArray(data) ? data : data?.data;
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [isUserRole]);

  const cancelRequest = useCallback(
    async (id: string) => {
      await toast.promise(
        async () => {
          const res = await api.patch(`/collection-request/${id}`, {
            status: CollectionRequestStatus.CANCELLED,
          });
          if (!isSuccessStatus(res.status)) throw new Error();
          await fetchRequests();
        },
        {
          loading: t('cancelling'),
          success: t('cancelSuccess'),
          error: t('cancelError'),
        }
      );
    },
    [fetchRequests]
  );

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([
      { label: t('pageTitle'), href: '/portal/collection-request' },
    ]);
    fetchRequests();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRequests, setBreadcrumbs, setPageTitle]);

  // A fonte das moradas depende de o utilizador ser de empresa, por isso este
  // efeito espera pelo contexto: decidir antes de ele chegar mandaria um membro
  // de empresa buscar /me/address, que para ele devolve sempre vazio, e o ecrã
  // dir-lhe-ia que não pode solicitar.
  useEffect(() => {
    if (!isUserRole || !companyContextLoaded) return;

    setIsLoadingAddresses(true);
    api
      .get<RequestAddress[]>(
        isCompanyMember ? '/company/me/addresses' : '/me/address'
      )
      .then(({ data }) => setAddresses(data ?? []))
      .catch(() => toast.error(t('addressesLoadError')))
      .finally(() => setIsLoadingAddresses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserRole, isCompanyMember, companyContextLoaded]);

  const submitUser = userForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/collection-request', {
        userId: user!.id,
        addressId: data.addressId,
        estimatedBags: Number(data.estimatedBags),
      });
      if (!isSuccessStatus(response.status) && response.status !== 409)
        throw new Error();
      userForm.reset();
      await fetchRequests();
      setUserFormOpen(false);
      toast.success(t('createSuccess'));
    } catch {
      toast.error(t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  });

  const submitAdmin = adminForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    await toast.promise(
      async () => {
        const response = await api.post('/collection-request', {
          ...data,
          estimatedBags: Number(data.estimatedBags),
          address: {
            street: data.address.street,
            city: data.address.city,
            cityDivision: data.address.cityDivision,
            country: data.address.country,
            countryDivision: data.address.countryDivision,
            zipCode: data.address.zipCode,
            lat: data.address.lat || '0',
            long: data.address.long || '0',
            number: data.address.number,
            complement: data.address.complement,
          },
        });
        if (!isSuccessStatus(response.status) && response.status !== 409)
          throw new Error();
        adminForm.reset();
        await fetchRequests();
      },
      {
        loading: t('creating'),
        success: t('createSuccess'),
        error: t('createError'),
      }
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
      if (!Array.isArray(results) || results.length === 0) {
        toast.error(t('zipNotFound'));
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
      const { setValue, resetField } = adminForm;
      setValue('address.street', streetName ?? '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue(
        'address.cityDivision',
        firstAddressPart(municipalitySubdivision),
        { shouldDirty: true, shouldTouch: true, shouldValidate: true }
      );
      setValue('address.city', firstAddressPart(municipality), {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue(
        'address.countryDivision',
        firstAddressPart(countrySecondarySubdivision ?? countrySubdivision),
        { shouldDirty: true, shouldTouch: true, shouldValidate: true }
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
      resetField('address.number', { defaultValue: '' });
    } catch {
      toast.error(t('zipLookupError'));
    }
  };

  const adminErrors = adminForm.formState.errors;
  const adminRegister = adminForm.register;
  const zipCodeField = adminRegister('address.zipCode', {
    required: tCommon('requiredField'),
  });

  return (
    <section id="collection-request-page" className="space-y-6">
      <div className="flex justify-end">
        {isUserRole ? (
          isLoadingAddresses || !companyContextLoaded ? (
            <Button variant="secondary" disabled>
              {tCommon('loading')}
            </Button>
          ) : hasActiveRequest ? (
            <Alert className="max-w-md ml-auto">
              <AlertTitle>{t('activeRequest')}</AlertTitle>
              <AlertDescription>
                {t('activeRequestWarning')}
              </AlertDescription>
            </Alert>
          ) : canRequest ? (
            <DialogForm<UserFormData>
              title={t('formTitle')}
              confirmText={t('createConfirm')}
              loading={isSubmitting}
              errors={userForm.formState.errors}
              onConfirm={submitUser}
              open={userFormOpen}
              onOpenChange={(open) => {
                setUserFormOpen(open);
                if (!open) userForm.reset();
              }}
              trigger={
                <Button variant="secondary" disabled={isSubmitting}>
                  {t('createConfirm')}
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
                  <p className="font-medium text-foreground">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-muted-foreground">{user?.contactPhone}</p>
                </div>
                <Controller
                  name="addressId"
                  control={userForm.control}
                  rules={{ required: t('selectAddress') }}
                  render={({ field }) => (
                    <div className="flex flex-col gap-2">
                      {userForm.formState.errors.addressId && (
                        <p className="text-xs text-destructive">
                          {t('selectAddress')}
                        </p>
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
                            <p className="text-muted-foreground">
                              {addr.zipCode} — {addr.city}
                            </p>
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
                    placeholder={t('bagCountPlaceholder')}
                    className={
                      userForm.formState.errors.estimatedBags
                        ? 'border-red-500'
                        : ''
                    }
                    {...userForm.register('estimatedBags', {
                      required: tCommon('requiredField'),
                      min: { value: 1, message: t('minOneBag') },
                    })}
                  />
                  {userForm.formState.errors.estimatedBags && (
                    <p className="text-xs text-destructive mt-1">
                      {userForm.formState.errors.estimatedBags.message}
                    </p>
                  )}
                </div>
              </div>
            </DialogForm>
          ) : (
            <Alert variant="destructive" className="max-w-md ml-auto">
              <MapPinOff className="size-4" />
              <AlertTitle>{t('outOfServiceZone')}</AlertTitle>
              <AlertDescription>
                {isCompanyMember
                  ? t('noCompanyAddressInZone')
                  : t('noAddressInZone')}{' '}
                <Link
                  href={
                    isCompanyMember
                      ? '/portal/my-company/addresses'
                      : '/portal/perfil'
                  }
                  className="underline font-medium"
                >
                  {isCompanyMember ? t('addCollectionSite') : t('addAddress')}
                </Link>
              </AlertDescription>
            </Alert>
          )
        ) : (
          <DialogForm<AdminFormData>
            title={t('formTitle')}
            confirmText={t('createConfirm')}
            loading={isSubmitting}
            errors={adminErrors}
            onConfirm={submitAdmin}
            trigger={
              <Button variant="secondary" disabled={isSubmitting}>
                {t('createConfirm')}
              </Button>
            }
          >
            <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
              <Input
                tabIndex={1}
                placeholder={t('firstNamePlaceholder')}
                className={adminErrors.firstName ? 'border-red-500' : ''}
                {...adminRegister('firstName', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={2}
                placeholder={t('lastNamePlaceholder')}
                className={adminErrors.lastName ? 'border-red-500' : ''}
                {...adminRegister('lastName', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={3}
                placeholder={t('emailPlaceholder')}
                type="email"
                className={adminErrors.email ? 'border-red-500' : ''}
                {...adminRegister('email', { required: tCommon('requiredField') })}
              />
              <Input
                tabIndex={4}
                placeholder={t('phonePlaceholder')}
                className={adminErrors.contactPhone ? 'border-red-500' : ''}
                {...adminRegister('contactPhone', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={5}
                placeholder={t('zipPlaceholder')}
                className={adminErrors.address?.zipCode ? 'border-red-500' : ''}
                {...zipCodeField}
                onBlur={(event) => {
                  zipCodeField.onBlur(event);
                  void handleBlurPostalCode(event);
                }}
              />
              <Input
                tabIndex={6}
                placeholder={t('streetPlaceholder')}
                className={adminErrors.address?.street ? 'border-red-500' : ''}
                {...adminRegister('address.street', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={7}
                placeholder={t('cityDivisionPlaceholder')}
                className={
                  adminErrors.address?.cityDivision ? 'border-red-500' : ''
                }
                {...adminRegister('address.cityDivision', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={8}
                placeholder={t('cityPlaceholder')}
                className={adminErrors.address?.city ? 'border-red-500' : ''}
                {...adminRegister('address.city', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={9}
                placeholder={t('countryDivisionPlaceholder')}
                className={
                  adminErrors.address?.countryDivision ? 'border-red-500' : ''
                }
                {...adminRegister('address.countryDivision', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={10}
                placeholder={t('countryPlaceholder')}
                className={adminErrors.address?.country ? 'border-red-500' : ''}
                {...adminRegister('address.country', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={11}
                placeholder={t('numberPlaceholder')}
                className={adminErrors.address?.number ? 'border-red-500' : ''}
                {...adminRegister('address.number', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={12}
                placeholder={t('complementPlaceholder')}
                {...adminRegister('address.complement')}
              />
              <Input
                tabIndex={13}
                placeholder={t('latPlaceholder')}
                className={adminErrors.address?.lat ? 'border-red-500' : ''}
                {...adminRegister('address.lat', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={14}
                placeholder={t('longPlaceholder')}
                className={adminErrors.address?.long ? 'border-red-500' : ''}
                {...adminRegister('address.long', {
                  required: tCommon('requiredField'),
                })}
              />
              <Input
                tabIndex={15}
                type="number"
                min={1}
                placeholder={t('estimatedBagsPlaceholder')}
                className={adminErrors.estimatedBags ? 'border-red-500' : ''}
                {...adminRegister('estimatedBags', {
                  required: tCommon('requiredField'),
                  min: { value: 1, message: t('minOneBag') },
                })}
              />
            </div>
          </DialogForm>
        )}
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-secondary">
            {t('listTitle')}
          </h2>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-secondary">
                Estado:
              </label>
              <select
                className="h-9 rounded-md border border-secondary/40 px-2 text-sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | CollectionRequestStatus)
                }
              >
                <option value="ALL">{tCommon('all')}</option>
                {Object.values(CollectionRequestStatus).map((s) => (
                  <option key={s} value={s}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-4 w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('code')}</TableHead>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{tCommon('email')}</TableHead>
                <TableHead className="whitespace-normal">{tCommon('address')}</TableHead>
                <TableHead>{t('estimatedBagsColumn')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tCommon('createdAt')}</TableHead>
                <TableHead>{tCommon('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRequests.length > 0 ? (
                displayedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.friendlyCode ?? '-'}
                    </TableCell>
                    <TableCell>
                      {`${request.user?.firstName ?? '-'} ${
                        request.user?.lastName ?? ''
                      }`.trim()}
                      <RequesterTypeBadge
                        companyId={request.companyId}
                        company={request.company}
                      />
                    </TableCell>
                    <TableCell>{request.user?.email ?? '-'}</TableCell>
                    <TableCell className="whitespace-normal break-words max-w-[220px] min-w-[160px]">
                      {`${request.address?.street ?? '-'} ${
                        request.address?.number ?? ''
                      }`.trim()}
                    </TableCell>
                    <TableCell>{request.estimatedBags ?? '-'}</TableCell>
                    <TableCell>
                      {tStatus(request.status)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString('pt-PT')
                        : '—'}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <RequestDetailsDialog request={request} />
                      {(request.status === CollectionRequestStatus.CREATED ||
                        request.status === CollectionRequestStatus.OUT_OF_ZONE) && (
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                            >
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
                  <TableCell
                    colSpan={8}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {tCommon('noRecords')}
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
