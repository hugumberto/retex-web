'use client';

import { FaqCategoryDTO, FaqItemDTO, FaqStatus } from '@/app/types/faq';
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
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import FaqCategoryForm from './faq-category-form';
import FaqItemForm from './faq-item-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Faq() {
  const t = useTranslations('faq');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [categories, setCategories] = useState<FaqCategoryDTO[]>([]);
  const pagination = usePagination(categories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsCategory, setItemsCategory] = useState<FaqCategoryDTO | null>(null);
  // A chave de reposição é a categoria: abrir outra volta à primeira página.
  const itemsPagination = usePagination(
    itemsCategory?.items ?? [],
    itemsCategory?.id
  );

  const fetchCategories = useCallback(async () => {
    try {
      const { data, status } = await api.get<FaqCategoryDTO[]>('/faq/all');
      if (!isSuccessStatus(status)) throw new Error();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/faq' }]);
    fetchCategories();
    return () => { setPageTitle(''); setBreadcrumbs([]); };
  }, [fetchCategories, setBreadcrumbs, setPageTitle, t]);

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const res = await api.delete(`/faq/category/${id}`);
          if (!isSuccessStatus(res.status) && res.status !== 204) throw new Error();
          await fetchCategories();
        })(),
        {
          loading: tCommon('deleting'),
          success: t('categoryDeleted'),
          error: t('categoryDeleteError'),
        }
      );
      setIsSubmitting(false);
    },
    [fetchCategories, t, tCommon]
  );

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const res = await api.delete(`/faq/item/${itemId}`);
          if (!isSuccessStatus(res.status) && res.status !== 204) throw new Error();
          await fetchCategories();
          // Refresh itemsCategory data
          setItemsCategory((prev) =>
            prev ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) } : null
          );
        })(),
        {
          loading: tCommon('deleting'),
          success: t('itemDeleted'),
          error: t('itemDeleteError'),
        }
      );
      setIsSubmitting(false);
    },
    [fetchCategories, t, tCommon]
  );

  const handleSaveCategory = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  const handleSaveItem = useCallback(async () => {
    await fetchCategories();
    setItemsCategory((prev) => {
      if (!prev) return null;
      const updated = categories.find((c) => c.id === prev.id);
      return updated ?? prev;
    });
  }, [fetchCategories, categories]);

  const openItemsDialog = useCallback((category: FaqCategoryDTO) => {
    setItemsCategory(category);
  }, []);

  // Keep itemsCategory in sync after fetch
  useEffect(() => {
    if (itemsCategory) {
      const updated = categories.find((c) => c.id === itemsCategory.id);
      if (updated) setItemsCategory(updated);
    }
  }, [categories, itemsCategory]);

  return (
    <section id="faq-page" className="flex flex-col gap-6">
      <div className="flex justify-end">
        <FaqCategoryForm onSave={handleSaveCategory} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">
          {t('categoriesTitle')}
        </h2>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('title')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{t('items')}</TableHead>
                <TableHead>{tCommon('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.length > 0 ? (
                pagination.items.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cat.status === FaqStatus.ACTIVE
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cat.status === FaqStatus.ACTIVE
                          ? tCommon('active')
                          : tCommon('inactive')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => openItemsDialog(cat)}
                      >
                        {t('itemCount', { count: cat.items?.length ?? 0 })}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FaqCategoryForm
                          onSave={handleSaveCategory}
                          category={cat}
                          trigger={
                            <Button variant="ghost" size="icon" className="size-8">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" disabled={isSubmitting} className="size-8">
                              <TrashIcon className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleDeleteCategory(cat.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    {t('emptyCategories')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination pagination={pagination} />
        </div>
      </div>

      {/* Items management dialog */}
      <Dialog open={!!itemsCategory} onOpenChange={(open) => { if (!open) setItemsCategory(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('itemsDialogTitle', { category: itemsCategory?.title ?? '' })}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-end mb-2">
            {itemsCategory && (
              <FaqItemForm
                categoryId={itemsCategory.id}
                onSave={handleSaveItem}
              />
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('question')}</TableHead>
                <TableHead>{t('answer')}</TableHead>
                <TableHead>{tCommon('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemsPagination.items.length > 0 ? (
                itemsPagination.items.map((item: FaqItemDTO) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-[200px] truncate">{item.title}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{item.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {itemsCategory && (
                          <FaqItemForm
                            categoryId={itemsCategory.id}
                            onSave={handleSaveItem}
                            item={item}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-8">
                                <PencilIcon className="size-4" />
                              </Button>
                            }
                          />
                        )}
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" disabled={isSubmitting} className="size-8">
                              <TrashIcon className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleDeleteItem(item.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                    {t('emptyItems')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination pagination={itemsPagination} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
