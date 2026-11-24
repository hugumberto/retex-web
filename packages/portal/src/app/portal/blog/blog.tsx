'use client';

import { BlogCategory, BlogPostDTO, BlogPostHighlight, BlogPostStatus } from '@/app/types/blog';
import { PaginatedResult } from '@/app/types/helper';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import api from '@/lib/api';
import { siteUrl } from '@/lib/site';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { ChevronDown, Eye, ImageIcon, Pencil, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import BlogTabs from './blog-tabs';

type StatusFilter = 'ALL' | BlogPostStatus | 'HIGHLIGHTED';
type Sort = 'recent' | 'oldest' | 'title';

const MONTHS: Record<string, string[]> = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
};

/** Artigos do blog (Figma 15-Admin-Blog). */
export default function BlogCrud() {
  const t = useTranslations('blogList');
  const locale = useLocale();
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [posts, setPosts] = useState<BlogPostDTO[] | null>(null);
  const [categories, setCategories] = useState<BlogCategory[] | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [category, setCategory] = useState<string>('ALL');
  const [sort, setSort] = useState<Sort>('recent');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState('');

  const load = useCallback(async () => {
    try {
      const [{ data: page }, { data: cats }] = await Promise.all([
        api.get<PaginatedResult<BlogPostDTO>>('/blog-post', { params: { limit: 100 } }),
        api.get<BlogCategory[]>('/blog-category'),
      ]);
      setPosts(page.data);
      setCategories(cats);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setSite(siteUrl());
    setPageTitle(t('title'));
    setBreadcrumbs([{ label: t('crumbSite'), href: '/portal/blog' }, { label: t('crumbPosts') }]);
    load();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [load, setPageTitle, setBreadcrumbs, t]);

  const all = useMemo(() => posts ?? [], [posts]);
  const counts = {
    published: all.filter((p) => p.status === BlogPostStatus.PUBLISHED).length,
    drafts: all.filter((p) => p.status === BlogPostStatus.DRAFT).length,
    scheduled: all.filter((p) => p.status === BlogPostStatus.SCHEDULED).length,
    highlighted: all.filter((p) => p.highlight === BlogPostHighlight.HIGHLIGHTED).length,
  };

  const byStatus = useMemo(
    () =>
      all.filter((p) =>
        status === 'ALL'
          ? true
          : status === 'HIGHLIGHTED'
            ? p.highlight !== BlogPostHighlight.NONE
            : p.status === status
      ),
    [all, status]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = byStatus.filter(
      (p) =>
        (category === 'ALL' || p.categories?.some((c) => c.id === category)) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(q)))
    );
    const time = (p: BlogPostDTO) => new Date(p.updatedAt).getTime();
    return [...list].sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title, locale) : sort === 'oldest' ? time(a) - time(b) : time(b) - time(a)
    );
  }, [byStatus, category, search, sort, locale]);

  const dateLabel = (value: string | Date) => {
    const d = new Date(value);
    const months = MONTHS[locale];
    return months ? `${format(d, 'dd')} ${months[d.getMonth()]} ${format(d, 'yyyy')}` : format(d, 'dd/MM/yyyy');
  };

  const run = async (work: () => Promise<unknown>, ok: string, fail: string) => {
    setBusy(true);
    try {
      await work();
      toast.success(ok);
      await load();
    } catch {
      toast.error(fail);
    } finally {
      setBusy(false);
    }
  };

  const toggleStar = (post: BlogPostDTO) => {
    const next =
      post.highlight === BlogPostHighlight.HIGHLIGHTED ? BlogPostHighlight.NONE : BlogPostHighlight.HIGHLIGHTED;
    return run(
      () => api.patch(`/blog-post/${post.id}/highlight`, { highlight: next }),
      next === BlogPostHighlight.HIGHLIGHTED ? t('star.on') : t('star.off'),
      t('star.error')
    );
  };

  const remove = (ids: string[]) =>
    run(
      async () => {
        for (const id of ids) await api.delete(`/blog-post/${id}`);
        setSelected([]);
      },
      t('delete.done', { count: ids.length }),
      t('delete.error')
    );

  const publish = (ids: string[]) =>
    run(
      async () => {
        for (const id of ids) await api.put(`/blog-post/${id}/publish`);
        setSelected([]);
      },
      t('bulk.published', { count: ids.length }),
      t('bulk.publishError')
    );

  const allChecked = visible.length > 0 && visible.every((p) => selected.includes(p.id));

  const statCard = (key: StatusFilter, label: string, value: number, hint: string) => {
    const active = status === key;
    return (
      <button
        type="button"
        onClick={() => setStatus(active ? 'ALL' : key)}
        aria-pressed={active}
        className={cn(
          'flex flex-col gap-1 rounded-2xl border bg-white px-4 py-3.5 text-left transition-colors',
          active ? 'border-[1.5px] border-navy' : 'border-line-soft hover:border-field'
        )}
      >
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-navy">
          <span className={cn('size-1.5 rounded-full', active ? 'bg-teal' : 'bg-slate')} />
          {label}
        </span>
        <span className="text-[28px] font-bold leading-tight text-navy">{posts ? value : '—'}</span>
        <span className="font-mono text-[10px] text-ink">{hint}</span>
      </button>
    );
  };

  const statusBadge = (post: BlogPostDTO) => (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
        post.status === BlogPostStatus.PUBLISHED && 'bg-mint text-forest',
        post.status === BlogPostStatus.DRAFT && 'bg-neutral-badge text-ink',
        post.status === BlogPostStatus.SCHEDULED && 'bg-[#fdf1dc] text-[#8a5a12]'
      )}
      title={
        post.status === BlogPostStatus.SCHEDULED && post.publishDate
          ? t('status.scheduledFor', { date: format(new Date(post.publishDate), 'dd/MM/yyyy HH:mm') })
          : undefined
      }
    >
      {t(`status.${post.status}`)}
    </span>
  );

  const siteHost = site.replace(/^https?:\/\//, '');

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <BlogTabs active="posts" posts={posts?.length ?? null} categories={categories?.length ?? null} />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            data-1p-ignore
            data-lpignore="true"
            className="h-11 w-full rounded-lg border border-field bg-white px-3.5 text-sm text-navy outline-none placeholder:text-ink/70 focus:border-navy sm:w-[260px]"
          />
          <a
            href={`${site}/blog`}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-semibold text-navy hover:bg-panel"
          >
            {t('viewSite')}
          </a>
          <Link
            href="/portal/blog/new"
            className="flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            + {t('newPost')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCard(BlogPostStatus.PUBLISHED, t('stats.published'), counts.published, t('stats.publishedHint', { site: siteHost }))}
        {statCard(BlogPostStatus.DRAFT, t('stats.drafts'), counts.drafts, t('stats.draftsHint'))}
        {statCard(
          BlogPostStatus.SCHEDULED,
          t('stats.scheduled'),
          counts.scheduled,
          t('stats.scheduledHint', { count: counts.scheduled })
        )}
        {statCard('HIGHLIGHTED', t('stats.highlighted'), counts.highlighted, t('stats.highlightedHint'))}
      </div>

      <div className="rounded-2xl border border-line-soft bg-white">
        <div className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[{ id: 'ALL', title: t('allCategories'), count: byStatus.length }, ...(categories ?? []).map((c) => ({
              id: c.id,
              title: c.title,
              count: byStatus.filter((p) => p.categories?.some((pc) => pc.id === c.id)).length,
            }))].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  'h-8 rounded-full border px-3.5 text-[13px]',
                  category === c.id ? 'border-navy bg-navy font-semibold text-white' : 'border-navy/60 text-navy hover:bg-panel'
                )}
              >
                {c.id === 'ALL' ? `${c.title} · ${c.count}` : c.title}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-sm text-ink">
            {t('sort.label')}
            <span className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="appearance-none bg-transparent pr-5 font-semibold text-navy outline-none"
              >
                {(['recent', 'oldest', 'title'] as Sort[]).map((s) => (
                  <option key={s} value={s}>
                    {t(`sort.${s}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-navy" />
            </span>
          </label>
        </div>

        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-line-soft bg-row-selected px-4 py-2.5 text-sm text-navy">
            <span className="font-semibold">{t('bulk.selected', { count: selected.length })}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => publish(selected)}
              className="h-8 rounded-full border border-navy px-3 text-[13px] font-semibold hover:bg-white"
            >
              {t('bulk.publish')}
            </button>
            <ConfirmDialog
              trigger={
                <button
                  type="button"
                  disabled={busy}
                  className="h-8 rounded-full border border-[#a12a1e] px-3 text-[13px] font-semibold text-[#a12a1e] hover:bg-white"
                >
                  {t('bulk.delete')}
                </button>
              }
              title={t('delete.titleMany', { count: selected.length })}
              description={t('delete.body')}
              onConfirm={() => remove(selected)}
            />
            <button type="button" onClick={() => setSelected([])} className="ml-auto text-[13px] text-ink underline">
              {t('bulk.clear')}
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm text-navy">
            <thead className="border-t border-line-soft bg-canvas font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={t('selectAll')}
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? [] : visible.map((p) => p.id))}
                    className="size-4 accent-navy"
                  />
                </th>
                {['post', 'category', 'status', 'highlight', 'updated'].map((col) => (
                  <th key={col} className="px-3 py-3 font-normal">
                    {t(`columns.${col}`)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-normal">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((post) => {
                const checked = selected.includes(post.id);
                const principal = post.highlight === BlogPostHighlight.HIGHLIGHTED;
                const secondary = post.highlight === BlogPostHighlight.FEATURED;
                return (
                  <tr key={post.id} className={cn('border-t border-line-soft', checked && 'bg-row-selected')}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={t('select', { title: post.title })}
                        checked={checked}
                        onChange={() =>
                          setSelected((cur) => (checked ? cur.filter((id) => id !== post.id) : [...cur, post.id]))
                        }
                        className="size-4 accent-navy"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-sky">
                          {post.hero ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.hero} alt="" className="size-full object-cover" />
                          ) : (
                            <ImageIcon className="size-4 text-teal" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[340px]">
                          <Link href={`/portal/blog/${post.id}`} className="block truncate font-semibold hover:underline">
                            {post.title}
                          </Link>
                          <p className="truncate font-mono text-[10px] text-ink">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{post.categories?.[0]?.title ?? <span className="text-ink">—</span>}</td>
                    <td className="px-3 py-3">{statusBadge(post)}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleStar(post)}
                        title={principal ? t('star.principal') : secondary ? t('star.secondary') : t('star.make')}
                        aria-label={principal ? t('star.principal') : t('star.make')}
                        className="p-1"
                      >
                        <Star
                          className={cn(
                            'size-[18px]',
                            principal ? 'fill-teal text-teal' : secondary ? 'fill-sky text-teal' : 'text-slate'
                          )}
                        />
                      </button>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{dateLabel(post.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/portal/blog/${post.id}`}
                          aria-label={t('actions.edit')}
                          title={t('actions.edit')}
                          className="rounded p-1.5 text-navy hover:bg-panel"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        {post.status === BlogPostStatus.PUBLISHED ? (
                          <a
                            href={`${site}/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t('actions.view')}
                            title={t('actions.view')}
                            className="rounded p-1.5 text-navy hover:bg-panel"
                          >
                            <Eye className="size-4" />
                          </a>
                        ) : (
                          <span className="p-1.5 text-slate" title={t('actions.notPublished')}>
                            <Eye className="size-4" />
                          </span>
                        )}
                        <ConfirmDialog
                          trigger={
                            <button
                              type="button"
                              disabled={busy}
                              aria-label={t('actions.delete')}
                              title={t('actions.delete')}
                              className="rounded p-1.5 text-[#a12a1e] hover:bg-panel"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          }
                          title={t('delete.title', { title: post.title })}
                          description={t('delete.body')}
                          onConfirm={() => remove([post.id])}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {posts && visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border-t border-line-soft px-4 py-8 text-center text-ink">
                    {all.length === 0 ? t('empty') : t('emptyFilter')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-1 border-t border-line-soft px-4 py-3.5 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
          <span>{t('showing', { shown: visible.length, total: all.length })}</span>
          <span className="font-mono text-[10px]">{t('starNote')}</span>
        </div>
      </div>
    </section>
  );
}
