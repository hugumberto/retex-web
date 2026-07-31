'use client';

import { useTranslations } from 'next-intl';
import { CollectionRequestBagDTO } from '@/app/types/collection-request-bag';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
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
import { Link2Off, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CollectionRequestInfo = {
  id: string;
  friendlyCode?: string;
  status: string;
  estimatedBags?: number;
  bagsGenerated?: number;
};

type CollectionRequestBagsResponse = {
  collectionRequest: CollectionRequestInfo;
  bags: CollectionRequestBagDTO[];
};

export default function Bags() {
  const t = useTranslations('bags');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [code, setCode] = useState('');
  const [pkg, setPkg] = useState<CollectionRequestInfo | null>(null);
  const [bags, setBags] = useState<CollectionRequestBagDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/bags' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, t]);

  const search = async (value: string) => {
    const target = value.trim();
    if (!target) return;
    setIsLoading(true);
    try {
      const { data, status } = await api.get<CollectionRequestBagsResponse>(
        `/collection-request-bag/collection-request/${target}`
      );
      if (!isSuccessStatus(status)) throw new Error();
      setPkg(data.collectionRequest);
      setBags(data.bags ?? []);
    } catch (error) {
      const httpStatus = (error as { response?: { status?: number } })?.response
        ?.status;
      setPkg(null);
      setBags([]);
      toast.error(
        httpStatus === 404
          ? t('requestNotFound')
          : t('loadError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    if (pkg?.friendlyCode || pkg?.id) {
      await search(pkg.friendlyCode ?? pkg.id);
    }
  };

  const handleUnassign = async (bag: CollectionRequestBagDTO) => {
    setBusyId(bag.id);
    try {
      const res = await api.patch(`/collection-request-bag/${bag.id}/unassign`);
      if (!isSuccessStatus(res.status)) throw new Error();
      toast.success(t('unassignSuccess'));
      await refresh();
    } catch {
      toast.error(t('unassignError'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (bag: CollectionRequestBagDTO) => {
    setBusyId(bag.id);
    try {
      const res = await api.delete(`/collection-request-bag/${bag.id}`);
      if (!isSuccessStatus(res.status)) throw new Error();
      toast.success(t('deleteSuccess'));
      await refresh();
    } catch {
      toast.error(t('deleteError'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t('requestCodeLabel')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                search(code);
              }
            }}
            placeholder={t('requestCodePlaceholder')}
            className="max-w-xs"
          />
          <Button
            variant="secondary"
            onClick={() => search(code)}
            disabled={isLoading}
          >
            Procurar
          </Button>
        </div>
      </div>

      {pkg && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-secondary">
              {pkg.friendlyCode ?? pkg.id}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-secondary">
              <span>
                Estado:{' '}
                <strong>
                  {tStatus(pkg.status)}
                </strong>
              </span>
              <span>
                {t('collectedBags')} <strong>{pkg.bagsGenerated ?? 0}</strong>
              </span>
              {pkg.estimatedBags != null && (
                <span>
                  Estimados: <strong>{pkg.estimatedBags}</strong>
                </span>
              )}
            </div>
          </div>

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
                {bags.length > 0 ? (
                  bags.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        {b.friendlyCode}
                      </TableCell>
                      <TableCell>{b.usedAt ? tCommon('yes') : tCommon('no')}</TableCell>
                      <TableCell>{b.processedAt ? tCommon('yes') : tCommon('no')}</TableCell>
                      <TableCell>
                        {b.weight != null
                          ? Number(b.weight).toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <ConfirmDialog
                          title={t('unassignTitle')}
                          description={t('unassignDescription')}
                          confirmText={t('unassignConfirm')}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title={t('unassignTooltip')}
                              disabled={busyId === b.id}
                            >
                              <Link2Off className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleUnassign(b)}
                        />
                        <ConfirmDialog
                          title={t('deleteTitle')}
                          description={t('deleteDescription')}
                          confirmText={tCommon('delete')}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-600 hover:text-red-700"
                              title={t('deleteTitle')}
                              disabled={busyId === b.id}
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleDelete(b)}
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
                      {t('empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
