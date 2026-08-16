'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import RequesterTypeBadge from '@/components/custom/requester-type-badge';
import {
  CollectionInterval,
  CollectionStatus,
  PackageCollectionDTO,
  PackageCollectionFormData,
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
import ttServices from '@tomtom-international/web-sdk-services';
import type { FeatureCollection } from 'geojson';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { format } from 'date-fns';
import { PencilIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PaginatedResult } from '../../types/helper';
import { CollectionRequestDTO, CollectionRequestStatus } from '../../types/collection-request';
import { Role, UserDTO, UserStatus } from '../../types/user';
import { hasValidCoords, minDistanceKm, readCoords } from './utils';

// O placeholder do mapa é um componente próprio para poder usar o hook de
// traduções (o `loading` do dynamic corre fora do componente pai).
function MapLoading() {
  const t = useTranslations('packageCollection');

  return (
    <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-secondary/25 text-muted-foreground">
      {t('loadingMap')}
    </div>
  );
}

const CollectionMap = dynamic(() => import('./components/collection-map'), {
  ssr: false,
  loading: () => <MapLoading />,
});

// Solicitações a até este raio (km) de um ponto selecionado são sugeridas.
const NEARBY_THRESHOLD_KM = 2;
const MAX_SUGGESTIONS = 10;

// Une listas de solicitações removendo duplicados por id (preserva a ordem).
const mergeById = (...lists: CollectionRequestDTO[][]): CollectionRequestDTO[] => {
  const byId = new Map<string, CollectionRequestDTO>();
  for (const list of lists) {
    for (const pkg of list) {
      if (!byId.has(pkg.id)) byId.set(pkg.id, pkg);
    }
  }
  return Array.from(byId.values());
};

interface PackageCollectionFormProps {
  packageCollectionId?: string;
  onSave: () => void;
}

export default function PackageCollectionForm({
  packageCollectionId,
  onSave,
}: PackageCollectionFormProps) {
  const t = useTranslations('packageCollection');
  const tCommon = useTranslations('common');
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
      collectionRequestIds: [],
      status: CollectionStatus.DRAFTING,
      collectionInterval: undefined,
    },
  });

  const intervalOptions: SelectFieldOption[] = [
    { value: CollectionInterval.MORNING, label: CollectionInterval.MORNING },
    {
      value: CollectionInterval.AFTERNOON,
      label: CollectionInterval.AFTERNOON,
    },
    { value: CollectionInterval.EVENING, label: CollectionInterval.EVENING },
  ];

  const [driverOptions, setDriverOptions] = useState<SelectFieldOption[]>([]);
  // Elegíveis (CREATED sem rota) e as já atribuídas à rota (modo edição) são
  // mantidas separadas; a lista exibida é a união determinística das duas.
  const [eligibleCollectionRequests, setEligibleCollectionRequests] = useState<CollectionRequestDTO[]>([]);
  const [routeCollectionRequests, setRouteCollectionRequests] = useState<CollectionRequestDTO[]>([]);
  const [isEditing] = useState(!!packageCollectionId);
  const [loadedStatus, setLoadedStatus] = useState<CollectionStatus | null>(
    null
  );

  // Rota já confirmada (não-DRAFTING) trava a composição; só o estado avança.
  const isLocked =
    isEditing &&
    loadedStatus != null &&
    loadedStatus !== CollectionStatus.DRAFTING;

  // Lista exibida: em modo de visualização (rota travada) mostra apenas os
  // pacotes vinculados à rota; caso contrário, os da rota + os elegíveis
  // (CREATED, sem rota).
  const collectionRequests = useMemo(
    () =>
      isLocked
        ? routeCollectionRequests
        : mergeById(
            routeCollectionRequests,
            eligibleCollectionRequests.filter(
              (pkg) => pkg.status === CollectionRequestStatus.CREATED
            )
          ),
    [isLocked, routeCollectionRequests, eligibleCollectionRequests]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [routeGeoJson, setRouteGeoJson] = useState<FeatureCollection | null>(
    null
  );
  const [optimizedOrderIds, setOptimizedOrderIds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const collectionRequestIds = watch('collectionRequestIds');

  const collectionRequestsById = useMemo(() => {
    const map = new Map<string, CollectionRequestDTO>();
    collectionRequests.forEach((pkg) => map.set(pkg.id, pkg));
    return map;
  }, [collectionRequests]);

  const eligibleWithCoords = useMemo(
    () => collectionRequests.filter(hasValidCoords),
    [collectionRequests]
  );
  const eligibleWithoutCoords = useMemo(
    () => collectionRequests.filter((pkg) => !hasValidCoords(pkg)),
    [collectionRequests]
  );

  const selectedWithCoords = useMemo(
    () => eligibleWithCoords.filter((pkg) => collectionRequestIds?.includes(pkg.id)),
    [eligibleWithCoords, collectionRequestIds]
  );

  // Sugestões: elegíveis não-selecionadas dentro do raio dos pontos escolhidos.
  const suggestedIds = useMemo(() => {
    if (!selectedWithCoords.length) return [];
    const selectedCoords = selectedWithCoords.map(readCoords);
    const selectedSet = new Set(collectionRequestIds ?? []);
    return eligibleWithCoords
      .filter((pkg) => !selectedSet.has(pkg.id))
      .map((pkg) => ({
        id: pkg.id,
        distance: minDistanceKm(readCoords(pkg), selectedCoords),
      }))
      .filter((entry) => entry.distance <= NEARBY_THRESHOLD_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_SUGGESTIONS)
      .map((entry) => entry.id);
  }, [eligibleWithCoords, selectedWithCoords, collectionRequestIds]);

  const fetchDrivers = useCallback(async () => {
    const { data, status } = await api.get<UserDTO[]>(`/user`);
    if (!isSuccessStatus(status)) {
      console.error('Failed to fetch users');
      return;
    }
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
  }, []);

  // Lista todas as solicitações elegíveis (CREATED e sem rota), sem filtro de
  // dia/turno.
  const fetchEligibleCollectionRequests = useCallback(async () => {
    const { data } = await api.get<PaginatedResult<CollectionRequestDTO>>(
      `/collection-request/created`
    );
    setEligibleCollectionRequests(data.data);
  }, []);

  // Carrega os dados da rota em edição (motorista, data, solicitações já
  // atribuídas). Executado no effect de abertura para garantir que os campos
  // já estão montados quando o reset acontece.
  const loadEditingData = useCallback(async () => {
    if (!packageCollectionId) return;
    const { data, status } = await api.get<PackageCollectionDTO>(
      `/route/${packageCollectionId}`
    );
    if (!isSuccessStatus(status) || !data) {
      console.error('Failed to fetch route');
      return;
    }
    reset({
      id: data.id,
      driverId: data.driver?.id ?? '',
      startDate: new Date(data.startDate),
      collectionRequestIds: (data.collectionRequests ?? []).map((pkg) => pkg.id),
      status: data.status,
      collectionInterval: data.collectionInterval,
    });
    setLoadedStatus(data.status);
    // As solicitações da rota não vêm em /collection-request/created (têm route_id).
    setRouteCollectionRequests(data.collectionRequests ?? []);
  }, [packageCollectionId, reset]);

  useEffect(() => {
    if (!isOpen) return;
    fetchDrivers();
    fetchEligibleCollectionRequests();
    if (isEditing && packageCollectionId) {
      loadEditingData();
    }
  }, [
    isOpen,
    isEditing,
    packageCollectionId,
    fetchDrivers,
    fetchEligibleCollectionRequests,
    loadEditingData,
  ]);

  const invalidateRoute = useCallback(() => {
    setRouteGeoJson(null);
    setOptimizedOrderIds([]);
  }, []);

  const toggleCollectionRequest = useCallback(
    (id: string) => {
      const current = collectionRequestIds ?? [];
      const next = current.includes(id)
        ? current.filter((collectionRequestId) => collectionRequestId !== id)
        : [...current, id];
      setValue('collectionRequestIds', next);
      invalidateRoute();
    },
    [collectionRequestIds, setValue, invalidateRoute]
  );

  const optimizeRoute = useCallback(async () => {
    if (selectedWithCoords.length < 2) {
      toast.error(t('optimizeMinimum'));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY;
    if (!apiKey) {
      toast.error(t('mapUnavailable'));
      return;
    }

    setIsOptimizing(true);
    try {
      const locations = selectedWithCoords.map((pkg) => {
        const { lat, long } = readCoords(pkg);
        return [long, lat] as [number, number];
      });

      const response = await ttServices.services.calculateRoute({
        key: apiKey,
        locations,
        // Otimiza a ordem dos pontos intermédios (mantém origem/destino).
        computeBestOrder: selectedWithCoords.length >= 3,
        traffic: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const geojson = (
        response as { toGeoJson: () => FeatureCollection }
      ).toGeoJson();
      setRouteGeoJson(geojson);

      // Reordena a lista conforme a melhor ordem, quando disponível.
      const optimized = (
        response as {
          optimizedWaypoints?: {
            providedIndex: number;
            optimizedIndex: number;
          }[];
        }
      ).optimizedWaypoints;

      if (optimized?.length) {
        const middle = [...optimized]
          .sort((a, b) => a.optimizedIndex - b.optimizedIndex)
          .map((wp) => selectedWithCoords[wp.providedIndex]?.id)
          .filter(Boolean) as string[];
        const first = selectedWithCoords[0]?.id;
        const last = selectedWithCoords[selectedWithCoords.length - 1]?.id;
        setOptimizedOrderIds(
          [first, ...middle, last].filter(Boolean) as string[]
        );
      } else {
        setOptimizedOrderIds(selectedWithCoords.map((pkg) => pkg.id));
      }

      toast.success(t('optimizeSuccess'));
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      toast.error(t('optimizeError'));
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedWithCoords]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      invalidateRoute();
    }
  };

  const submit = async (data: PackageCollectionFormData) => {
    setIsSubmitting(true);
    toast.promise(
      async () => {
        const formattedDate = data.startDate
          ? format(data.startDate, "yyyy-MM-dd HH:mm:ss'.000000+00'")
          : undefined;
        // Rota travada: só o estado avança (a composição fica congelada).
        const payload = isLocked
          ? { status: data.status }
          : {
              driverId: data.driverId,
              startDate: formattedDate,
              collectionRequestIds: data.collectionRequestIds,
              status: data.status,
              collectionInterval: data.collectionInterval,
            };
        if (isEditing) {
          const res = await api.put(`/route/${packageCollectionId}`, payload);
          if (!isSuccessStatus(res.status))
            throw new Error('Erro na requisição');
          reset();
          return;
        }
        const res = await api.post(`/route`, payload);
        if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
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

  const addressLabel = (pkg: CollectionRequestDTO) =>
    `${pkg.address?.street ?? ''} ${pkg.address?.number ?? ''}`.trim() || '-';

  // Funil único das três tabelas (seleção, sugestões e sem-coordenadas): quem
  // pediu, mais o crachá quando é de empresa.
  const requesterLabel = (pkg: CollectionRequestDTO): ReactNode => (
    <>
      {`${pkg.user?.firstName ?? ''} ${pkg.user?.lastName ?? ''}`.trim() || '-'}
      <RequesterTypeBadge companyId={pkg.companyId} company={pkg.company} />
    </>
  );

  return (
    <DialogForm
      triggerText={tCommon('create')}
      title={t('formTitle')}
      onConfirm={handleSubmit(submit)}
      onOpenChange={handleOpenChange}
      loading={isSubmitting}
      errors={errors}
      contentClassName="w-[95vw] sm:max-w-[92rem] max-h-[90vh] overflow-y-auto"
      trigger={
        isEditing ? (
          <Button variant="ghost" size="icon" className="size-8">
            <PencilIcon className="size-4" />
          </Button>
        ) : (
          <Button variant="secondary" className="ml-auto block">
            {tCommon('create')}
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <SelectForm
            label={t('driver')}
            name="driverId"
            control={control}
            rules={{ required: t('driverRequired') }}
            options={driverOptions}
            errors={errors}
            disabled={isLocked}
          />
        </div>

        <div>
          <DatePickerForm
            label={t('pickupDate')}
            name="startDate"
            control={control}
            rules={{ required: t('dateRequired') }}
            errors={errors}
            disabled={isLocked}
          />
        </div>

        <div>
          <SelectForm
            label={t('pickupInterval')}
            name="collectionInterval"
            control={control}
            rules={{ required: t('intervalRequired') }}
            options={intervalOptions}
            errors={errors}
            disabled={isLocked}
          />
        </div>

        {isLocked && (
          <div className="md:col-span-4">
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {t('lockedRouteWarning')}
            </p>
          </div>
        )}
      </div>

      {/* Mapa e listas lado a lado no desktop; empilhados no mobile. */}
      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        {/* Coluna do mapa */}
        <div className="min-w-0">
          {/* Mapa das solicitações elegíveis */}
          <div className="pt-6">
            <div className="mb-3 flex items-center justify-between">
              <Title as="h3">{t('requestsMap')}</Title>
              <Button
                type="button"
                variant="secondary"
                onClick={optimizeRoute}
                disabled={
                  isOptimizing || selectedWithCoords.length < 2 || isLocked
                }
              >
                {isOptimizing ? t('optimizing') : t('optimizeRoute')}
              </Button>
            </div>
            <CollectionMap
              collectionRequests={eligibleWithCoords}
              selectedIds={collectionRequestIds ?? []}
              suggestedIds={suggestedIds}
              routeGeoJson={routeGeoJson}
              onToggle={isLocked ? () => undefined : toggleCollectionRequest}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Azul: selecionadas · Laranja: sugeridas (≤ {NEARBY_THRESHOLD_KM}{' '}
              km) · Cinza: elegíveis. Clique num marcador para selecionar.
            </p>
          </div>

          {/* Ordem sugerida da rota */}
          {optimizedOrderIds.length > 0 && (
            <div className="pt-6">
              <Title as="h3">{t('suggestedOrder')}</Title>
              <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm">
                {optimizedOrderIds.map((id) => {
                  const pkg = collectionRequestsById.get(id);
                  return <li key={id}>{pkg ? addressLabel(pkg) : id}</li>;
                })}
              </ol>
            </div>
          )}

          {/* Sugeridas perto da rota (abaixo do mapa) */}
          {suggestedIds.length > 0 && (
            <div className="pt-6">
              <Title as="h3">{t('suggestedNearRoute')}</Title>
              <div className="mt-4 w-full">
                <Table containerClassName="max-h-[18vh]">
                  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                    <TableRow>
                      <TableHead className="whitespace-normal">{t('requester')}</TableHead>
                      <TableHead>{tCommon('bags')}</TableHead>
                      <TableHead>{tCommon('action')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestedIds.map((id) => {
                      const pkg = collectionRequestsById.get(id);
                      if (!pkg) return null;
                      return (
                        <TableRow key={id}>
                          <TableCell className="whitespace-normal break-words align-top max-w-[280px]">
                            {requesterLabel(pkg)}
                            <br />
                            {addressLabel(pkg)}
                          </TableCell>
                          <TableCell>{pkg.estimatedBags ?? '-'}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => toggleCollectionRequest(id)}
                              disabled={isLocked}
                            >
                              Adicionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* fim da coluna do mapa */}
        </div>

        {/* Coluna das listas */}
        <div className="min-w-0">
          {/* Seleção de solicitações elegíveis */}
          <div className="pt-6">
            <Title as="h3">{t('requestSelection')}</Title>
            <div className="mt-4 w-full">
              <Table containerClassName="max-h-[50vh]">
                <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="whitespace-normal">{t('requester')}</TableHead>
                    <TableHead>{tCommon('city')}</TableHead>
                    <TableHead>{tCommon('bags')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionRequests.length > 0 ? (
                    collectionRequests.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="align-top">
                          <CheckboxForm
                            control={control}
                            name="collectionRequestIds"
                            checked={collectionRequestIds?.includes(item.id)}
                            onCheckedChange={() => toggleCollectionRequest(item.id)}
                            label=""
                            id={item.id}
                            disabled={isLocked}
                          />
                        </TableCell>
                        <TableCell className="whitespace-normal break-words align-top max-w-[280px]">
                          {requesterLabel(item)}
                          <br />
                          {addressLabel(item)}
                        </TableCell>
                        <TableCell className="whitespace-normal break-words align-top">{item.address?.city ?? '-'}</TableCell>
                        <TableCell>{item.estimatedBags ?? '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        {t('noEligibleRequests')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Solicitações sem localização (não aparecem no mapa) */}
          {eligibleWithoutCoords.length > 0 && (
            <div className="pt-6">
              <Title as="h3">{t('noLocation')}</Title>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('noValidCoordinates')}
              </p>
              <div className="mt-3 w-full">
                <Table containerClassName="max-h-[32vh]">
                  <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>{t('requester')}</TableHead>
                      <TableHead>{tCommon('address')}</TableHead>
                      <TableHead>{tCommon('city')}</TableHead>
                      <TableHead>{tCommon('bags')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleWithoutCoords.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <CheckboxForm
                            control={control}
                            name="collectionRequestIds"
                            checked={collectionRequestIds?.includes(item.id)}
                            onCheckedChange={() => toggleCollectionRequest(item.id)}
                            label=""
                            id={`no-coords-${item.id}`}
                            disabled={isLocked}
                          />
                        </TableCell>
                        <TableCell>{requesterLabel(item)}</TableCell>
                        <TableCell>{addressLabel(item)}</TableCell>
                        <TableCell>{item.address?.city ?? '-'}</TableCell>
                        <TableCell>{item.estimatedBags ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* fim da coluna das listas */}
        </div>
      </div>
    </DialogForm>
  );
}
