'use client';

import { BlogCategory, BlogCategoryStatus } from '@/app/types/blog';
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
import BlogCategoryForm from './blog-category-form';

export default function BlogCategories() {
  const t = useTranslations('blogCategories');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const pagination = usePagination(categories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, status } = await api.get<BlogCategory[]>('/blog-category');
      if (!isSuccessStatus(status)) throw new Error();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([
      { label: t('blogBreadcrumb'), href: '/portal/blog' },
      { label: t('categoriesBreadcrumb'), href: '/portal/blog-categories' },
    ]);
    fetchCategories();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchCategories, setBreadcrumbs, setPageTitle, t]);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const res = await api.delete(`/blog-category/${id}`);
          if (!isSuccessStatus(res.status) && res.status !== 204) throw new Error();
          await fetchCategories();
        })(),
        {
          loading: tCommon('deleting'),
          success: t('deleteSuccess'),
          error: t('deleteError'),
        }
      );
      setIsSubmitting(false);
    },
    [fetchCategories, t, tCommon]
  );

  return (
    <section id="blog-categories-page" className="flex flex-col gap-6">
      <div className="flex justify-end">
        <BlogCategoryForm onSave={fetchCategories} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">
          {t('pageTitle')}
        </h2>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('title')}</TableHead>
                <TableHead>{tCommon('slug')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tCommon('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.length > 0 ? (
                pagination.items.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.slug}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          cat.status === BlogCategoryStatus.ACTIVE
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {cat.status === BlogCategoryStatus.ACTIVE
                          ? tCommon('active')
                          : tCommon('inactive')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BlogCategoryForm
                          onSave={fetchCategories}
                          category={cat}
                          trigger={
                            <Button variant="ghost" size="icon" className="size-8">
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        />
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSubmitting}
                              className="size-8"
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleDelete(cat.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination pagination={pagination} />
        </div>
      </div>
    </section>
  );
}
