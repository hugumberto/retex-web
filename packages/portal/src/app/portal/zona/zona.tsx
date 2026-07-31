'use client';

import { ZoneDTO } from '@/app/types/zone';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
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
import { useLocale, useTranslations } from 'next-intl';
import { SendIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import ZonaForm from './zona-form';

export default function Zona() {
  const t = useTranslations('zones');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [zones, setZones] = useState<ZoneDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = useCallback(async () => {
    try {
      const { data, status } = await api.get<ZoneDTO[]>('/zone');
      if (!isSuccessStatus(status)) throw new Error('Erro ao buscar zonas');
      setZones(data);
    } catch (error) {
      console.error('Erro ao buscar zonas:', error);
      toast.error(t('loadError'));
    }
  }, [t]);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.delete(`/zone/${id}`);
        if (!isSuccessStatus(res.status) && res.status !== 204) {
          throw new Error('Erro ao eliminar zona');
        }
        await fetchZones();
      } catch (error) {
        console.error('Erro ao eliminar zona:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchZones]
  );

  const handleDeleteWithToast = useCallback(
    async (id: string) => {
      await toast.promise(handleDelete(id), {
        loading: t('deleting'),
        success: () => t('deleteSuccess'),
        error: () => t('deleteError'),
      });
    },
    [handleDelete, t]
  );

  const handleNotify = useCallback(async (id: string) => {
    setIsSubmitting(true);
    await toast.promise(
      (async () => {
        const res = await api.post<{ notified: number }>(`/zone/${id}/notify`);
        if (!isSuccessStatus(res.status)) throw new Error('Erro ao notificar');
        return res.data?.notified ?? 0;
      })(),
      {
        loading: t('notifying'),
        success: (n: number) => t('notifySuccess', { count: n }),
        error: () => t('notifyError'),
      }
    );
    setIsSubmitting(false);
  }, [t]);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/zona' }]);
    fetchZones();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchZones, setBreadcrumbs, setPageTitle, t]);

  const handleSave = useCallback(async () => {
    await fetchZones();
  }, [fetchZones]);

  return (
    <section id="zona-page" className="flex flex-col items-center">
      <ZonaForm onSave={handleSave} />

      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon('city')}</TableHead>
              <TableHead>{t('createdAt')}</TableHead>
              <TableHead>{tCommon('action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length > 0 ? (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="capitalize">{zone.city}</TableCell>
                  <TableCell>
                    {new Date(zone.createdAt).toLocaleDateString(locale)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ConfirmDialog
                        title={t('notifyTitle')}
                        description={t('notifyDescription')}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="size-8"
                            title={t('notifyInactiveTooltip')}
                          >
                            <SendIcon />
                          </Button>
                        }
                        onConfirm={() => handleNotify(zone.id)}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="size-8"
                            title={t('deleteTooltip')}
                          >
                            <TrashIcon />
                          </Button>
                        }
                        onConfirm={() => handleDeleteWithToast(zone.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
