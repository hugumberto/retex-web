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
import { useAppStore } from '@/store';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import FaqCategoryForm from './faq-category-form';
import FaqItemForm from './faq-item-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Faq() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [categories, setCategories] = useState<FaqCategoryDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemsCategory, setItemsCategory] = useState<FaqCategoryDTO | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, status } = await api.get<FaqCategoryDTO[]>('/faq/all');
      if (!isSuccessStatus(status)) throw new Error();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Não foi possível carregar as categorias FAQ');
    }
  }, []);

  useEffect(() => {
    setPageTitle('FAQ');
    setBreadcrumbs([{ label: 'FAQ', href: '/portal/faq' }]);
    fetchCategories();
    return () => { setPageTitle(''); setBreadcrumbs([]); };
  }, [fetchCategories, setBreadcrumbs, setPageTitle]);

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const res = await api.delete(`/faq/category/${id}`);
          if (!isSuccessStatus(res.status) && res.status !== 204) throw new Error();
          await fetchCategories();
        })(),
        { loading: 'A eliminar...', success: 'Categoria eliminada', error: 'Erro ao eliminar categoria' }
      );
      setIsSubmitting(false);
    },
    [fetchCategories]
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
        { loading: 'A eliminar...', success: 'Item eliminado', error: 'Erro ao eliminar item' }
      );
      setIsSubmitting(false);
    },
    [fetchCategories]
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
        <h2 className="text-lg font-semibold text-secondary mb-4">Categorias FAQ</h2>
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Acção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cat.status === FaqStatus.ACTIVE
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cat.status === FaqStatus.ACTIVE ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => openItemsDialog(cat)}
                      >
                        {cat.items?.length ?? 0} item(s)
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
                    Nenhuma categoria criada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Items management dialog */}
      <Dialog open={!!itemsCategory} onOpenChange={(open) => { if (!open) setItemsCategory(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemsCategory?.title} — Itens</DialogTitle>
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
                <TableHead>Pergunta</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Acção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(itemsCategory?.items?.length ?? 0) > 0 ? (
                (itemsCategory?.items ?? []).map((item: FaqItemDTO) => (
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
                    Nenhum item adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </section>
  );
}
