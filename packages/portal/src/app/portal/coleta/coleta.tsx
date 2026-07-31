'use client';

import { useTranslations } from 'next-intl';
import { CollectionRequestDTO, CollectionRequestStatus } from '@/app/types/collection-request';
import { PackageCollectionDTO } from '@/app/types/package-collection';
import { CollectionResponse, CollectionRequestBagDTO } from '@/app/types/collection-request-bag';
import CollectionRequestUserData from '../triage/components/collection-request-user-data';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return typeof message === 'string' ? message : fallback;
};

export default function Coleta() {
  const t = useTranslations('pickup');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [scanCode, setScanCode] = useState('');
  const [pkg, setPkg] = useState<CollectionRequestDTO | null>(null);
  // Pacotes de uma recolha (quando o código inserido é de uma rota) — para o
  // utilizador escolher qual pacote recolher.
  const [routeCollectionRequests, setRouteCollectionRequests] = useState<CollectionRequestDTO[]>([]);
  const [boundCodes, setBoundCodes] = useState<CollectionRequestBagDTO[]>([]);
  const [isLoadingCollectionRequest, setIsLoadingCollectionRequest] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const scanRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/coleta' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, t]);

  const canCollect = pkg?.status === CollectionRequestStatus.WAITING_FOR_COLLECTION;
  const isCollected = pkg?.status === CollectionRequestStatus.COLLECTED;

  // Assim que a solicitação fica coletável (input de QR montado), foca-o.
  useEffect(() => {
    if (pkg && canCollect) {
      requestAnimationFrame(() => qrRef.current?.focus());
    }
  }, [pkg, canCollect]);

  // Carrega um pacote pelo id/código e prepara a tela de recolha.
  const loadCollectionRequest = useCallback(async (code: string) => {
    const { data, status } = await api.get<CollectionResponse>(
      `/collection/${code}`
    );
    if (!isSuccessStatus(status)) throw new Error('Erro na requisição');
    setPkg(data.collectionRequest);
    setBoundCodes(data.bags ?? []);
    setRouteCollectionRequests([]);
    // O foco no input de QR é feito pelo useEffect ao ficar coletável.
  }, []);

  const handleScanBlur = useCallback(async () => {
    const code = scanCode.trim();
    if (!code || pkg) return;

    setIsLoadingCollectionRequest(true);
    try {
      // 1) Tenta como pacote (código amigável do pacote ou id).
      await loadCollectionRequest(code);
      toast.success(t('requestLoaded'));
    } catch {
      // 2) Não é um pacote — tenta como recolha (código da rota): lista os
      //    pacotes da rota para o utilizador escolher qual recolher.
      try {
        const { data: route } = await api.get<PackageCollectionDTO>(
          `/route/${code}`
        );
        const pkgs = route.collectionRequests ?? [];
        if (pkgs.length === 0) {
          setRouteCollectionRequests([]);
          toast.error(t('routeHasNoRequests'));
        } else {
          setRouteCollectionRequests(pkgs);
          toast.success(t('routeLoaded'));
        }
      } catch {
        setPkg(null);
        setBoundCodes([]);
        setRouteCollectionRequests([]);
        toast.error(t('notFoundForCode'));
      }
    } finally {
      setIsLoadingCollectionRequest(false);
    }
  }, [scanCode, pkg, loadCollectionRequest]);

  // Seleção de um pacote a partir da lista da recolha.
  const handleSelectRouteCollectionRequest = useCallback(
    async (collectionRequestId: string) => {
      setIsLoadingCollectionRequest(true);
      try {
        await loadCollectionRequest(collectionRequestId);
        toast.success(t('requestLoaded'));
      } catch {
        toast.error(t('loadSelectedError'));
      } finally {
        setIsLoadingCollectionRequest(false);
      }
    },
    [loadCollectionRequest]
  );

  const handleBind = useCallback(async () => {
    const code = qrInput.trim();
    if (!code || !pkg || !canCollect) return;

    setIsBinding(true);
    try {
      const { data, status } = await api.post<CollectionRequestBagDTO>(
        `/collection/${pkg.id}/bind`,
        { code }
      );
      if (!isSuccessStatus(status)) throw new Error('Erro na requisição');
      setBoundCodes((current) =>
        current.some((bag) => bag.id === data.id) ? current : [...current, data]
      );
      toast.success(t('bagBound'));
    } catch (error) {
      console.error('Erro ao vincular QR code:', error);
      toast.error(errorMessage(error, t('bindQrError')));
    } finally {
      // Em qualquer caso (leitura correta ou incorreta): limpa o campo e mantém
      // o foco. O foco é feito após o re-render (input reabilitado).
      setQrInput('');
      setIsBinding(false);
      requestAnimationFrame(() => qrRef.current?.focus());
    }
  }, [qrInput, pkg, canCollect]);

  const handleFinalize = useCallback(async () => {
    if (!pkg || !canCollect) return;

    setIsFinalizing(true);
    try {
      const { data, status } = await api.post<CollectionRequestDTO>(
        `/collection/${pkg.id}/finalize`
      );
      if (!isSuccessStatus(status)) throw new Error('Erro na requisição');
      setPkg(data);
      toast.success(t('finishSuccess'));
    } catch (error) {
      console.error('Erro ao finalizar coleta:', error);
      toast.error(errorMessage(error, t('finishError')));
    } finally {
      setIsFinalizing(false);
    }
  }, [pkg, canCollect]);

  const handleCancel = useCallback(async () => {
    if (!pkg) return;
    const reason = cancelReason.trim();
    if (!reason) {
      toast.error(t('cancelReasonRequired'));
      return;
    }
    setIsCancelling(true);
    try {
      const { data, status } = await api.post<CollectionRequestDTO>(
        `/collection/${pkg.id}/cancel`,
        { reason }
      );
      if (!isSuccessStatus(status)) throw new Error('Erro na requisição');
      setPkg(data);
      setShowCancel(false);
      setCancelReason('');
      toast.success(t('cancelSuccess'));
    } catch (error) {
      console.error('Erro ao cancelar recolha:', error);
      toast.error(errorMessage(error, t('cancelError')));
    } finally {
      setIsCancelling(false);
    }
  }, [pkg, cancelReason]);

  const handleReset = () => {
    setScanCode('');
    setPkg(null);
    setRouteCollectionRequests([]);
    setBoundCodes([]);
    setQrInput('');
    setShowCancel(false);
    setCancelReason('');
    requestAnimationFrame(() => scanRef.current?.focus());
  };

  return (
    <section id="coleta-page" className="flex flex-col gap-6">
      {/* Código da solicitação */}
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t('requestCodeLabel')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            ref={scanRef}
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onBlur={handleScanBlur}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                await handleScanBlur();
              }
            }}
            placeholder={t('requestCodePlaceholder')}
            autoFocus
            disabled={!!pkg || isLoadingCollectionRequest}
            className="max-w-md"
          />
          {pkg && (
            <>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  isCollected
                    ? 'bg-blue-100 text-blue-800'
                    : canCollect
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {tStatus(pkg.status)}
              </span>
              {canCollect && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowCancel(true)}
                >
                  {t('cancelPickup')}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleReset}>
                {t('newPickup')}
              </Button>
            </>
          )}
        </div>
        {pkg && !canCollect && !isCollected && (
          <p className="mt-3 text-sm text-amber-700">
            {t('notAwaitingPickup')}
          </p>
        )}
      </div>

      {/* Pacotes da recolha (quando o código inserido é de uma rota) */}
      {!pkg && routeCollectionRequests.length > 0 && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <h2 className="mb-4 text-xl font-semibold text-secondary">
            {t('routeRequests')}
          </h2>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon('code')}</TableHead>
                  <TableHead>{tCommon('customer')}</TableHead>
                  <TableHead>{tCommon('status')}</TableHead>
                  <TableHead>{tCommon('action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routeCollectionRequests.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium tracking-wide">
                      {item.friendlyCode ?? '-'}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">
                      {`${item.user?.firstName ?? ''} ${
                        item.user?.lastName ?? ''
                      }`.trim() || '-'}
                    </TableCell>
                    <TableCell>{tStatus(item.status)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={isLoadingCollectionRequest}
                        onClick={() => handleSelectRouteCollectionRequest(item.id)}
                      >
                        Selecionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Dados do cliente */}
      {pkg && <CollectionRequestUserData user={pkg.user} address={pkg.address} />}

      {/* Vínculo de sacos */}
      {pkg && (canCollect || isCollected) && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary">
              {t('collectedBags')}
            </h2>
            <span className="text-sm text-muted-foreground">
              {boundCodes.length}
              {pkg.estimatedBags ? ` / ${pkg.estimatedBags}` : ''}{' '}
              saco(s)
            </span>
          </div>

          {canCollect && (
            <div className="mb-5">
              <label className="mb-1 block text-sm font-medium text-secondary">
                {t('bindQrLabel')}
              </label>
              <Input
                ref={qrRef}
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await handleBind();
                  }
                }}
                placeholder={t('bindQrPlaceholder')}
                disabled={isBinding}
                className="max-w-md"
              />
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('code')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boundCodes.length > 0 ? (
                boundCodes.map((bag) => (
                  <TableRow key={bag.id}>
                    <TableCell className="font-medium tracking-wide">
                      {bag.friendlyCode}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold text-blue-800">
                        Utilizado
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t('noBagsBound')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {canCollect && (
            <div className="mt-5 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleFinalize}
                disabled={isFinalizing || boundCodes.length === 0}
              >
                {t('finish')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Diálogo de cancelamento com motivo */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-secondary">
              {t('cancelPickup')}
            </DialogTitle>
            <DialogDescription>
              {t('cancelReasonHelp')}
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={t('cancelReasonPlaceholder')}
            className="w-full rounded-md border border-secondary/25 p-3 text-sm outline-none focus:border-secondary/50"
          />
          <DialogFooter className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancel(false)}
              disabled={isCancelling}
            >
              Voltar
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleCancel}
              disabled={isCancelling || !cancelReason.trim()}
            >
              {t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
