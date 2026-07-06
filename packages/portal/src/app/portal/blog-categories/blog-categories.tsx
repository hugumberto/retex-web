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
import { useAppStore } from '@/store';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import BlogCategoryForm from './blog-category-form';

export default function BlogCategories() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, status } = await api.get<BlogCategory[]>('/blog-category');
      if (!isSuccessStatus(status)) throw new Error();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Não foi possível carregar as categorias');
    }
  }, []);

  useEffect(() => {
    setPageTitle('Categorias do Blog');
    setBreadcrumbs([
      { label: 'Blog', href: '/portal/blog' },
      { label: 'Categorias', href: '/portal/blog-categories' },
    ]);
    fetchCategories();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchCategories, setBreadcrumbs, setPageTitle]);

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
          loading: 'A eliminar...',
          success: 'Categoria eliminada',
          error: 'Erro ao eliminar categoria',
        }
      );
      setIsSubmitting(false);
    },
    [fetchCategories]
  );

  return (
    <section id="blog-categories-page" className="flex flex-col gap-6">
      <div className="flex justify-end">
        <BlogCategoryForm onSave={fetchCategories} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">
          Categorias do Blog
        </h2>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((cat) => (
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
                          ? 'Activo'
                          : 'Inactivo'}
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
                    Nenhuma categoria criada.
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
