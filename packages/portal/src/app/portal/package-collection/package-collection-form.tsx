'use client';

import {
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
import { PackageDTO } from '../../types/package';
import { Role, UserDTO, UserStatus } from '../../types/user';
import { hasValidCoords, minDistanceKm, readCoords } from './utils';

const CollectionMap = dynamic(() => import('./components/collection-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-lg border border-secondary/25 text-muted-foreground">
      A carregar mapa...
    </div>
  ),
});

// Solicitações a até este raio (km) de um ponto selecionado são sugeridas.
const NEARBY_THRESHOLD_KM = 2;
const MAX_SUGGESTIONS = 10;

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
      packageIds: [],
      status: CollectionStatus.DRAFTING,
    },
  });

  const [driverOptions, setDriverOptions] = useState<SelectFieldOption[]>([]);
  const [packages, setPackages] = useState<PackageDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing] = useState(!!packageCollectionId);
  const [routeGeoJson, setRouteGeoJson] = useState<FeatureCollection | null>(null);
  const [optimizedOrderIds, setOptimizedOrderIds] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const statusOptions = [
    CollectionStatus.DRAFTING,
    CollectionStatus.CREATED,
    CollectionStatus.IN_TRANSIT,
    CollectionStatus.FINISHED,
  ];

  const packageIds = watch('packageIds');

  const packagesById = useMemo(() => {
    const map = new Map<string, PackageDTO>();
    packages.forEach((pkg) => map.set(pkg.id, pkg));
    return map;
  }, [packages]);

  const eligibleWithCoords = useMemo(
    () => packages.filter(hasValidCoords),
    [packages]
  );
  const eligibleWithoutCoords = useMemo(
    () => packages.filter((pkg) => !hasValidCoords(pkg)),
    [packages]
  );

  const selectedWithCoords = useMemo(
    () =>
      eligibleWithCoords.filter((pkg) => packageIds?.includes(pkg.id)),
    [eligibleWithCoords, packageIds]
  );

  // Sugestões: elegíveis não-selecionadas dentro do raio dos pontos escolhidos.
  const suggestedIds = useMemo(() => {
    if (!selectedWithCoords.length) return [];
    const selectedCoords = selectedWithCoords.map(readCoords);
    const selectedSet = new Set(packageIds ?? []);
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
  }, [eligibleWithCoords, selectedWithCoords, packageIds]);

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
  const fetchEligiblePackages = useCallback(async () => {
    const { data } = await api.get<PaginatedResult<PackageDTO>>(
      `/package/created`
    );
    setPackages(data.data);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchDrivers();
    fetchEligiblePackages();
  }, [isOpen, fetchDrivers, fetchEligiblePackages]);

  const invalidateRoute = useCallback(() => {
    setRouteGeoJson(null);
    setOptimizedOrderIds([]);
  }, []);

  const togglePackage = useCallback(
    (id: string) => {
      const current = packageIds ?? [];
      const next = current.includes(id)
        ? current.filter((packageId) => packageId !== id)
        : [...current, id];
      setValue('packageIds', next);
      invalidateRoute();
    },
    [packageIds, setValue, invalidateRoute]
  );

  const optimizeRoute = useCallback(async () => {
    if (selectedWithCoords.length < 2) {
      toast.error('Selecione ao menos 2 solicitações com localização');
      return;
    }

    setIsOptimizing(true);
    try {
      const locations = selectedWithCoords.map((pkg) => {
        const { lat, long } = readCoords(pkg);
        return [long, lat] as [number, number];
      });

      const response = await ttServices.services.calculateRoute({
        key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY as string,
        locations,
        // Otimiza a ordem dos pontos intermédios (mantém origem/destino).
        computeBestOrder: selectedWithCoords.length >= 3,
        traffic: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const geojson = (response as { toGeoJson: () => FeatureCollection }).toGeoJson();
      setRouteGeoJson(geojson);

      // Reordena a lista conforme a melhor ordem, quando disponível.
      const optimized = (response as {
        optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
      }).optimizedWaypoints;

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

      toast.success('Rota otimizada calculada');
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      toast.error('Não foi possível calcular a rota otimizada');
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedWithCoords]);

  const fetchCollectionDataById = async (
    id: string
  ): Promise<PackageCollectionDTO | undefined> => {
    const { data, status } = await api.get<PackageCollectionDTO>(
      `/route/${id}`
    );
    if (!isSuccessStatus(status)) {
      console.error('Failed to fetch route');
      return;
    }
    return data;
  };

  const getEditingItem = async (): Promise<
    PackageCollectionFormData | undefined
  > => {
    if (!packageCollectionId) return undefined;
    const data = await fetchCollectionDataById(packageCollectionId);
    if (!data) return undefined;
    return {
      id: data.id,
      driverId: data.driver.id,
      startDate: new Date(data.startDate),
      packageIds: data.packages.map((pkg) => pkg.id),
      status: data.status,
    };
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      invalidateRoute();
      return;
    }
    if (isEditing && packageCollectionId) {
      getEditingItem().then((data) => {
        if (data) reset(data);
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
        const payload = {
          driverId: data.driverId,
          startDate: formattedDate,
          packageIds: data.packageIds,
          status: data.status,
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

  const addressLabel = (pkg: PackageDTO) =>
    `${pkg.address.street} ${pkg.address.number}`.trim() || '-';

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
          <Button variant="secondary" className="ml-auto block">
            Criar
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

        <div>
          <DatePickerForm
            label="Data da Recolha"
            name="startDate"
            control={control}
            rules={{ required: 'A data é obrigatória' }}
            errors={errors}
          />
        </div>

        {isEditing && (
          <div className="md:col-span-2">
            <SelectForm
              label="Status"
              name="status"
              control={control}
              options={statusOptions}
            />
          </div>
        )}
      </div>

      {/* Mapa das solicitações elegíveis */}
      <div className="pt-6">
        <div className="mb-3 flex items-center justify-between">
          <Title as="h3">Mapa das solicitações</Title>
          <Button
            type="button"
            variant="secondary"
            onClick={optimizeRoute}
            disabled={isOptimizing || selectedWithCoords.length < 2}
          >
            {isOptimizing ? 'A otimizar...' : 'Otimizar rota'}
          </Button>
        </div>
        <CollectionMap
          packages={eligibleWithCoords}
          selectedIds={packageIds ?? []}
          suggestedIds={suggestedIds}
          routeGeoJson={routeGeoJson}
          onToggle={togglePackage}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Azul: selecionadas · Laranja: sugeridas (≤ {NEARBY_THRESHOLD_KM} km) ·
          Cinza: elegíveis. Clique num marcador para selecionar.
        </p>
      </div>

      {/* Ordem sugerida da rota */}
      {optimizedOrderIds.length > 0 && (
        <div className="pt-6">
          <Title as="h3">Ordem sugerida da rota</Title>
          <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm">
            {optimizedOrderIds.map((id) => {
              const pkg = packagesById.get(id);
              return <li key={id}>{pkg ? addressLabel(pkg) : id}</li>;
            })}
          </ol>
        </div>
      )}

      {/* Sugeridas perto da rota */}
      {suggestedIds.length > 0 && (
        <div className="pt-6">
          <Title as="h3">Sugeridas perto da rota</Title>
          <div className="mt-4 w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Morada</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestedIds.map((id) => {
                  const pkg = packagesById.get(id);
                  if (!pkg) return null;
                  return (
                    <TableRow key={id}>
                      <TableCell>{addressLabel(pkg)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => togglePackage(id)}
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

      {/* Seleção de solicitações elegíveis */}
      <div className="pt-6">
        <Title as="h3">Seleção de Recolhas</Title>
        <div className="mt-4 w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Morada</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Dia da semana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length > 0 ? (
                packages.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <CheckboxForm
                        control={control}
                        name="packageIds"
                        checked={packageIds?.includes(item.id)}
                        onCheckedChange={() => togglePackage(item.id)}
                        label=""
                        id={item.id}
                      />
                    </TableCell>
                    <TableCell>{addressLabel(item)}</TableCell>
                    <TableCell>{item.address.city}</TableCell>
                    <TableCell>{item.collectDay}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Nenhuma solicitação elegível!
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
          <Title as="h3">Sem localização</Title>
          <p className="mt-1 text-xs text-muted-foreground">
            Sem coordenadas válidas — não aparecem no mapa, mas podem ser
            selecionadas.
          </p>
          <div className="mt-3 w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Morada</TableHead>
                  <TableHead>Cidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleWithoutCoords.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <CheckboxForm
                        control={control}
                        name="packageIds"
                        checked={packageIds?.includes(item.id)}
                        onCheckedChange={() => togglePackage(item.id)}
                        label=""
                        id={`no-coords-${item.id}`}
                      />
                    </TableCell>
                    <TableCell>{addressLabel(item)}</TableCell>
                    <TableCell>{item.address.city}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </DialogForm>
  );
}
