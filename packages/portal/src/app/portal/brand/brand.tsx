'use client';

import { Brand } from '@/app/types/brand';
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
import { useTranslations } from 'next-intl';
import { TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import BrandForm from './brand-form';

export default function BrandCrud() {
  const t = useTranslations('brand');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pagination = usePagination(brands);

  const fetchBrands = useCallback(async () => {
    try {
      const { data, status } = await api.get<Brand[]>('/brand');
      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao buscar marcas');
      }
      setBrands(data);
    } catch (error) {
      console.error('Erro ao buscar marcas:', error);
      toast.error(t('loadError'));
    }
  }, []);

  const handleDeleteBrand = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.delete(`/brand/${id}`);
        if (!isSuccessStatus(res.status)) {
          throw new Error('Erro ao eliminar marca');
        }
        await fetchBrands();
      } catch (error) {
        console.error('Erro ao eliminar marca:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchBrands]
  );

  const handleDeleteWithToast = useCallback(
    async (id: string) => {
      await toast.promise(handleDeleteBrand(id), {
        loading: tCommon('loading'),
        success: () => t('deleteSuccess'),
        error: () => t('deleteError'),
      });
    },
    [handleDeleteBrand]
  );

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/brand' }]);
    fetchBrands();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchBrands, setBreadcrumbs, setPageTitle, t]);

  const handleSave = useCallback(async () => {
    await fetchBrands();
  }, [fetchBrands]);

  return (
    <section id="brand-page" className="space-y-6">
      <div className="flex justify-end">
        <BrandForm onSave={handleSave} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{t('manual')}</TableHead>
                <TableHead>{tCommon('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.length > 0 ? (
                pagination.items.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>{brand.name}</TableCell>
                    <TableCell>{brand.manual ? tCommon('yes') : tCommon('no')}</TableCell>
                    <TableCell className="space-x-2">
                      <BrandForm
                        brandId={brand.id}
                        initialData={brand}
                        onSave={handleSave}
                      />
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="size-8"
                          >
                            <TrashIcon />
                          </Button>
                        }
                        onConfirm={() => handleDeleteWithToast(brand.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {tCommon('noRecords')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination pagination={pagination} />
      </div>
    </section>
  );
}
