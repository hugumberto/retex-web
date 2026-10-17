'use client';

import { useTranslations } from 'next-intl';
import {
  CollectionRequestDTO,
  CollectionRequestStatus,
} from '@/app/types/collection-request';
import {
  CollectionRequestBagDTO,
  CollectionResponse,
} from '@/app/types/collection-request-bag';
import { PaginatedResult } from '@/app/types/helper';
import { PackageCollectionTableDTO } from '@/app/types/package-collection';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import ScanInput from '@/components/custom/scan-input';
import TablePagination from '@/components/custom/table-pagination';
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
import { usePagination } from '@/hooks/use-pagination';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Link2Off, PlusIcon, TrashIcon } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Mesmo limite da listagem de rotas: chega para o histórico recente sem
// carregar a tabela inteira.
const ROUTES_PAGE_LIMIT = 100;
const ROUTES_MAX_PAGES = 5;

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
};

const formatDate = (value?: Date | string) =>
  value ? new Date(value).toLocaleDateString('pt-PT') : '-';

/**
 * Gestão de uma recolha pelo MASTER: corrige à mão o que o fluxo normal não
 * deixa — vincular/retirar a solicitação de uma rota, adicionar e remover
 * sacos e pôr a solicitação em qualquer estado. A API aplica as mesmas
 * restrições de perfil; o ecrã só junta as ferramentas num sítio.
 */
export default function GestaoRecolha() {
  const t = useTranslations('collectionManagement');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const tRouteStatus = useTranslations('enums.collectionStatus');
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [code, setCode] = useState('');
  const [request, setRequest] = useState<CollectionRequestDTO | null>(null);
  const [bags, setBags] = useState<CollectionRequestBagDTO[]>([]);
  const pagination = usePagination(bags);
  const [routes, setRoutes] = useState<PackageCollectionTableDTO[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    CollectionRequestStatus | ''
  >('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Uma ação de cada vez: evita dois pedidos concorrentes sobre a mesma
  // solicitação (ex.: mudar o estado enquanto se troca de rota).
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/gestao-recolha' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, t]);

  useEffect(() => {
    const fetchRoutes = async () => {
      const collected: PackageCollectionTableDTO[] = [];
      let page = 1;
      let totalPages = 1;
      try {
        do {
          const { data } = await api.get<
            PaginatedResult<PackageCollectionTableDTO>
          >(`/route?page=${page}&limit=${ROUTES_PAGE_LIMIT}`);
          collected.push(...data.data);
          totalPages = data.meta?.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages && page <= ROUTES_MAX_PAGES);
        setRoutes(collected);
      } catch {
        toast.error(t('routesLoadError'));
      }
    };
    fetchRoutes();
  }, [t]);

  // Rotas para onde a solicitação pode ir: todas menos a atual, mais recentes
  // primeiro.
  const availableRoutes = useMemo(
    () =>
      routes
        .filter((route) => route.id !== request?.route?.id)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        ),
    [routes, request?.route?.id]
  );

  const load = async (value: string) => {
    const target = value.trim();
    if (!target) return;
    setIsLoading(true);
    try {
      const { data, status } = await api.get<CollectionResponse>(
        `/collection-request-bag/collection-request/${encodeURIComponent(target)}`
      );
      if (!isSuccessStatus(status)) throw new Error();
      setRequest(data.collectionRequest);
      setBags(data.bags ?? []);
      setSelectedStatus(data.collectionRequest.status);
      setSelectedRouteId('');
    } catch (error) {
      const httpStatus = (error as { response?: { status?: number } })
        ?.response?.status;
      setRequest(null);
      setBags([]);
      toast.error(httpStatus === 404 ? t('requestNotFound') : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const reload = () => (request ? load(request.id) : Promise.resolve());

  // Envolve cada ação: trava o ecrã, mostra o resultado e recarrega a
  // solicitação, que é a fonte de verdade (a API pode ter mexido noutros
  // campos, como o nº de sacos).
  const run = async (
    action: () => Promise<{ status: number }>,
    success: string,
    failure: string
  ) => {
    setBusy(true);
    try {
      const res = await action();
      if (!isSuccessStatus(res.status)) throw new Error();
      toast.success(success);
      await reload();
    } catch (error) {
      toast.error(errorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const handleChangeStatus = () =>
    run(
      () =>
        api.patch(`/collection-request/${request?.id}`, {
          status: selectedStatus,
        }),
      t('statusSuccess'),
      t('statusError')
    );

  const handleLinkRoute = () =>
    run(
      () =>
        api.put(`/collection-request/${request?.id}/route`, {
          routeId: selectedRouteId,
        }),
      t('linkRouteSuccess'),
      t('linkRouteError')
    );

  const handleUnlinkRoute = () =>
    run(
      () =>
        api.put(`/collection-request/${request?.id}/route`, { routeId: null }),
      t('unlinkRouteSuccess'),
      t('unlinkRouteError')
    );

  const handleAddBag = () =>
    run(
      () => api.post(`/collection/${request?.id}/bag`),
      t('addBagSuccess'),
      t('addBagError')
    );

  const handleUnassignBag = (bag: CollectionRequestBagDTO) =>
    run(
      () => api.patch(`/collection-request-bag/${bag.id}/unassign`),
      t('unassignBagSuccess'),
      t('unassignBagError')
    );

  const handleDeleteBag = (bag: CollectionRequestBagDTO) =>
    run(
      () => api.delete(`/collection-request-bag/${bag.id}`),
      t('deleteBagSuccess'),
      t('deleteBagError')
    );

  const routeLabel = (route: {
    friendlyCode?: string;
    id: string;
    startDate: Date;
    status: PackageCollectionTableDTO['status'];
  }) =>
    `${route.friendlyCode ?? route.id.slice(0, 8)} · ${formatDate(
      route.startDate
    )} · ${tRouteStatus(route.status)}`;

  const currentRoute = request?.route;
  const address = request?.address;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t('codeLabel')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <ScanInput
            value={code}
            onChange={setCode}
            onScan={load}
            placeholder={t('codePlaceholder')}
            className="max-w-xs"
          />
          <Button
            variant="secondary"
            onClick={() => load(code)}
            disabled={isLoading}
          >
            {tCommon('search')}
          </Button>
        </div>
      </div>

      {request && (
        <>
          <Card title={request.friendlyCode ?? request.id}>
            <dl className="grid gap-x-6 gap-y-2 text-sm text-secondary sm:grid-cols-2">
              <Info label={t('client')}>
                {request.company?.name ??
                  [request.user?.firstName, request.user?.lastName]
                    .filter(Boolean)
                    .join(' ')}
              </Info>
              <Info label={t('email')}>{request.user?.email ?? '-'}</Info>
              <Info label={t('address')}>
                {address
                  ? `${address.street} ${address.number}, ${address.zipCode} ${address.city}`
                  : '-'}
              </Info>
              <Info label={t('createdAt')}>{formatDate(request.createdAt)}</Info>
              <Info label={t('estimatedBags')}>
                {request.estimatedBags ?? '-'}
              </Info>
              <Info label={t('currentStatus')}>{tStatus(request.status)}</Info>
            </dl>
          </Card>

          <Card title={t('statusSection')}>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  setSelectedStatus(value as CollectionRequestStatus)
                }
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t('statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CollectionRequestStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {tStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ConfirmDialog
                title={t('statusConfirmTitle')}
                description={t('statusConfirmDescription', {
                  from: tStatus(request.status),
                  to: selectedStatus ? tStatus(selectedStatus) : '',
                })}
                confirmText={t('statusConfirm')}
                disabled={
                  busy || !selectedStatus || selectedStatus === request.status
                }
                trigger={
                  <Button
                    disabled={
                      busy ||
                      !selectedStatus ||
                      selectedStatus === request.status
                    }
                  >
                    {t('statusApply')}
                  </Button>
                }
                onConfirm={handleChangeStatus}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('statusHint')}
            </p>
          </Card>

          <Card title={t('routeSection')}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-secondary">
              <span>
                {t('currentRoute')}{' '}
                <strong>
                  {currentRoute ? routeLabel(currentRoute) : t('noRoute')}
                </strong>
              </span>
              {currentRoute && (
                <ConfirmDialog
                  title={t('unlinkRouteTitle')}
                  description={t('unlinkRouteDescription')}
                  confirmText={t('unlinkRouteConfirm')}
                  disabled={busy}
                  trigger={
                    <Button variant="outline" disabled={busy}>
                      <Link2Off className="size-4" />
                      {t('unlinkRouteConfirm')}
                    </Button>
                  }
                  onConfirm={handleUnlinkRoute}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                <SelectTrigger className="w-full sm:w-96">
                  <SelectValue placeholder={t('routePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoutes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {routeLabel(route)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ConfirmDialog
                title={t('linkRouteTitle')}
                description={
                  currentRoute
                    ? t('moveRouteDescription')
                    : t('linkRouteDescription')
                }
                confirmText={t('linkRouteConfirm')}
                disabled={busy || !selectedRouteId}
                trigger={
                  <Button disabled={busy || !selectedRouteId}>
                    {currentRoute ? t('moveRoute') : t('linkRouteConfirm')}
                  </Button>
                }
                onConfirm={handleLinkRoute}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('routeHint')}
            </p>
          </Card>

          <Card
            title={t('bagsSection', { count: bags.length })}
            action={
              <ConfirmDialog
                title={t('addBagTitle')}
                description={t('addBagDescription')}
                confirmText={t('addBag')}
                disabled={busy}
                trigger={
                  <Button variant="secondary" disabled={busy}>
                    <PlusIcon className="size-4" />
                    {t('addBag')}
                  </Button>
                }
                onConfirm={handleAddBag}
              />
            }
          >
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tCommon('code')}</TableHead>
                    <TableHead>{tCommon('collected')}</TableHead>
                    <TableHead>{tCommon('processed')}</TableHead>
                    <TableHead>{t('weightKg')}</TableHead>
                    <TableHead>{tCommon('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.items.length > 0 ? (
                    pagination.items.map((bag) => (
                      <TableRow key={bag.id}>
                        <TableCell className="font-medium">
                          {bag.friendlyCode}
                        </TableCell>
                        <TableCell>
                          {bag.usedAt ? tCommon('yes') : tCommon('no')}
                        </TableCell>
                        <TableCell>
                          {bag.processedAt ? tCommon('yes') : tCommon('no')}
                        </TableCell>
                        <TableCell>
                          {bag.weight != null
                            ? Number(bag.weight).toFixed(2)
                            : '-'}
                        </TableCell>
                        <TableCell className="space-x-2">
                          <ConfirmDialog
                            title={t('unassignBagTitle')}
                            description={t('unassignBagDescription')}
                            confirmText={t('unassignBagConfirm')}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                title={t('unassignBagTitle')}
                                disabled={busy}
                              >
                                <Link2Off className="size-4" />
                              </Button>
                            }
                            onConfirm={() => handleUnassignBag(bag)}
                          />
                          <ConfirmDialog
                            title={t('deleteBagTitle')}
                            description={t('deleteBagDescription')}
                            confirmText={tCommon('delete')}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-600 hover:text-red-700"
                                title={t('deleteBagTitle')}
                                disabled={busy}
                              >
                                <TrashIcon className="size-4" />
                              </Button>
                            }
                            onConfirm={() => handleDeleteBag(bag)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-6 text-center text-muted-foreground"
                      >
                        {t('noBags')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <TablePagination pagination={pagination} />
            </div>
          </Card>
        </>
      )}
    </section>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-secondary">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
