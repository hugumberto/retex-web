'use client';

import { BlogCategory, BlogCategoryStatus } from '@/app/types/blog';
import { PaginatedResult } from '@/app/types/helper';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import Toggle from '@/components/custom/toggle';
import { moveItem, useDragOrder } from '@/hooks/use-drag-order';
import api from '@/lib/api';
import { siteUrl } from '@/lib/site';
import { slugify } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { ArrowDown, ArrowUp, GripVertical, Info, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import BlogTabs from '../blog/blog-tabs';

type Form = { id?: string; title: string; description: string; visible: boolean };
const EMPTY: Form = { title: '', description: '', visible: true };

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

/** Categorias do blog (Figma 17-Admin-Blog-Categorias): ordem no site, visibilidade e edição. */
export default function BlogCategories() {
  const t = useTranslations('blogCategoriesPage');
  const tList = useTranslations('blogList');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [categories, setCategories] = useState<BlogCategory[] | null>(null);
  const [postsTotal, setPostsTotal] = useState<number | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState('');

  const load = useCallback(async () => {
    try {
      const [{ data }, { data: posts }] = await Promise.all([
        api.get<BlogCategory[]>('/blog-category'),
        api.get<PaginatedResult<unknown>>('/blog-post', { params: { limit: 1 } }),
      ]);
      setCategories(Array.isArray(data) ? data : []);
      setPostsTotal(posts.meta?.total ?? null);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setSite(siteUrl());
    setPageTitle(t('title'));
    setBreadcrumbs([{ label: tList('crumbSite'), href: '/portal/blog' }, { label: t('crumb') }]);
    load();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [load, setPageTitle, setBreadcrumbs, t, tList]);

  const list = categories ?? [];

  const saveOrder = async (next: BlogCategory[]) => {
    const previous = categories;
    setCategories(next);
    try {
      await api.put('/blog-category/order', { ids: next.map((c) => c.id) });
    } catch (error) {
      setCategories(previous);
      toast.error(apiMessage(error, t('orderError')));
    }
  };
  const { handlers, dragging, over } = useDragOrder(list, saveOrder);

  const setVisible = async (category: BlogCategory, visible: boolean) => {
    try {
      await api.patch(`/blog-category/${category.id}`, {
        status: visible ? BlogCategoryStatus.ACTIVE : BlogCategoryStatus.INACTIVE,
      });
      setCategories((cur) =>
        (cur ?? []).map((c) =>
          c.id === category.id ? { ...c, status: visible ? BlogCategoryStatus.ACTIVE : BlogCategoryStatus.INACTIVE } : c
        )
      );
      if (form?.id === category.id) setForm({ ...form, visible });
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    }
  };

  const edit = (category: BlogCategory) =>
    setForm({
      id: category.id,
      title: category.title,
      description: category.description ?? '',
      visible: category.status === BlogCategoryStatus.ACTIVE,
    });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form || !form.title.trim()) return;
    setSaving(true);
    const body = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.visible ? BlogCategoryStatus.ACTIVE : BlogCategoryStatus.INACTIVE,
    };
    try {
      if (form.id) await api.patch(`/blog-category/${form.id}`, body);
      else await api.post('/blog-category', body);
      toast.success(form.id ? t('saved') : t('created'));
      setForm(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: BlogCategory) => {
    try {
      await api.delete(`/blog-category/${category.id}`);
      toast.success(t('deleted'));
      if (form?.id === category.id) setForm(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('deleteError')));
    }
  };

  const editing = form?.id ? list.find((c) => c.id === form.id) : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <BlogTabs active="categories" posts={postsTotal} categories={categories?.length ?? null} />
        <div className="flex flex-wrap gap-2">
          <a
            href={`${site}/blog`}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-semibold text-navy hover:bg-panel"
          >
            {tList('viewSite')}
          </a>
          <button
            type="button"
            onClick={() => setForm({ ...EMPTY })}
            className="flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            + {t('new')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="rounded-2xl border border-line-soft bg-white">
          <div className="flex items-baseline justify-between gap-3 px-4 py-4">
            <h2 className="text-lg font-semibold text-navy">{t('order')}</h2>
            <span className="hidden font-mono text-[10px] text-ink sm:inline">{t('dragHint')}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm text-navy">
              <thead className="bg-canvas font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
                <tr>
                  <th className="w-12 px-4 py-3" />
                  <th className="px-3 py-3 font-normal">{t('columns.name')}</th>
                  <th className="px-3 py-3 font-normal">{t('columns.posts')}</th>
                  <th className="px-3 py-3 font-normal">{t('columns.visible')}</th>
                  <th className="px-4 py-3 text-right font-normal">{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((category, index) => {
                  const visible = category.status === BlogCategoryStatus.ACTIVE;
                  const posts = category.postsCount ?? 0;
                  return (
                    <tr
                      key={category.id}
                      {...handlers(category)}
                      className={cn(
                        'border-t border-line-soft',
                        form?.id === category.id && 'bg-row-selected',
                        dragging === category.id && 'opacity-50',
                        over === category.id && dragging !== category.id && 'outline outline-2 -outline-offset-2 outline-teal'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 text-slate">
                          <GripVertical className="size-4 cursor-grab" aria-hidden />
                          {/* Para teclado: aparecem ao receber foco. */}
                          <button
                            type="button"
                            aria-label={t('moveUp', { name: category.title })}
                            disabled={index === 0}
                            onClick={() => saveOrder(moveItem(list, index, index - 1))}
                            className="sr-only focus:not-sr-only focus:rounded focus:bg-panel focus:p-0.5"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={t('moveDown', { name: category.title })}
                            disabled={index === list.length - 1}
                            onClick={() => saveOrder(moveItem(list, index, index + 1))}
                            className="sr-only focus:not-sr-only focus:rounded focus:bg-panel focus:p-0.5"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{category.title}</p>
                        <p className="font-mono text-[10px] text-ink">/blog/categoria/{category.slug}</p>
                      </td>
                      <td className="px-3 py-3 font-mono">{posts}</td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-2">
                          <Toggle
                            checked={visible}
                            onChange={(v) => setVisible(category, v)}
                            label={t('visibleToggle', { name: category.title })}
                          />
                          <span className="text-[13px] text-ink">{visible ? t('visible') : t('hidden')}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => edit(category)}
                            aria-label={t('edit', { name: category.title })}
                            className="rounded p-1.5 text-navy hover:bg-panel"
                          >
                            <Pencil className="size-4" />
                          </button>
                          {posts > 0 ? (
                            <span className="p-1.5 text-line-soft" title={t('cannotDelete')}>
                              <Trash2 className="size-4" />
                            </span>
                          ) : (
                            <ConfirmDialog
                              trigger={
                                <button
                                  type="button"
                                  aria-label={t('delete', { name: category.title })}
                                  className="rounded p-1.5 text-[#a12a1e] hover:bg-panel"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              }
                              title={t('deleteTitle', { name: category.title })}
                              description={t('deleteBody')}
                              onConfirm={() => remove(category)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {categories && list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border-t border-line-soft px-4 py-8 text-center text-ink">
                      {t('empty')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="flex items-center gap-2 border-t border-line-soft px-4 py-3.5 text-[13px] text-ink">
            <Info className="size-4 shrink-0" />
            {t('deleteRule')}
          </p>
        </div>

        {form ? (
          <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-line-soft bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-navy">{form.id ? t('form.editTitle') : t('form.newTitle')}</h2>
              {editing ? (
                <span className="font-mono text-[11px] text-ink">
                  {t('form.posts', { count: editing.postsCount ?? 0 })}
                </span>
              ) : null}
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              {t('form.name')}
              <input
                autoFocus
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={255}
                data-1p-ignore
                data-lpignore="true"
                className="h-11 rounded-lg border border-field px-3.5 font-normal outline-none focus:border-navy"
              />
            </label>
            <div className="rounded-lg bg-panel px-3.5 py-2.5">
              <p className="font-mono text-[11px] text-ink">
                /blog/categoria/<span className="text-teal">{slugify(form.title) || '…'}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink">{t('form.slugHint')}</p>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              {t('form.description')}
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
                rows={2}
                placeholder={t('form.descriptionPlaceholder')}
                className="rounded-lg border border-field px-3.5 py-2.5 font-normal outline-none placeholder:text-ink/60 focus:border-navy"
              />
            </label>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-panel px-3.5 py-3">
              <div>
                <p className="text-sm font-semibold text-navy">{t('form.visible')}</p>
                <p className="text-xs text-ink">{t('form.visibleHint')}</p>
              </div>
              <Toggle
                checked={form.visible}
                onChange={(visible) => setForm({ ...form, visible })}
                label={t('form.visible')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setForm(null)}
                className="h-11 rounded-full border-[1.5px] border-navy px-5 text-sm font-semibold text-navy hover:bg-panel"
              >
                {t('form.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="h-11 rounded-full bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {form.id ? t('form.save') : t('form.create')}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-field bg-white/60 p-5 text-sm text-ink">
            {t('form.placeholder')}
          </div>
        )}
      </div>
    </section>
  );
}
