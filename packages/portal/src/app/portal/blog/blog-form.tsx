'use client';

import { BlogCategory, BlogPostDTO, BlogPostHighlight, BlogPostStatus } from '@/app/types/blog';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { siteUrl } from '@/lib/site';
import { slugify } from '@/lib/slugify';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { Check, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const SUMMARY_MAX = 160;
const HERO_WIDTH = 1200;
const AUTOSAVE_MS = 3000;
const WORDS_PER_MINUTE = 200;

type Draft = {
  title: string;
  slug: string;
  slugEdited: boolean;
  summary: string;
  body: string;
  hero: string;
  heroAlt: string;
  status: BlogPostStatus;
  publishDate: string; // datetime-local
  categoryIds: string[];
  tags: string[];
  highlight: BlogPostHighlight;
};

type SaveState = 'idle' | 'saving' | 'error';

const fromPost = (post?: BlogPostDTO): Draft => ({
  title: post?.title ?? '',
  slug: post?.slug ?? '',
  slugEdited: !!post,
  summary: post?.summary ?? '',
  body: post?.body ?? '',
  hero: post?.hero ?? '',
  heroAlt: post?.heroAlt ?? '',
  status: post?.status ?? BlogPostStatus.DRAFT,
  publishDate:
    post?.status === BlogPostStatus.SCHEDULED && post.publishDate
      ? format(new Date(post.publishDate), "yyyy-MM-dd'T'HH:mm")
      : '',
  categoryIds: post?.categories?.map((c) => c.id) ?? [],
  tags: post?.tags ?? [],
  highlight: Number(post?.highlight ?? BlogPostHighlight.NONE) as BlogPostHighlight,
});

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

/** Reduz a imagem para no máximo 1200 px de largura (o cartão e o Google não precisam de mais). */
const resizeImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image'));
      img.onload = () => {
        const scale = Math.min(1, HERO_WIDTH / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/** Editor de artigo (Figma 16-Admin-Blog-Editor). */
export default function BlogForm({ post }: { post?: BlogPostDTO }) {
  const t = useTranslations('blogEditor');
  const tList = useTranslations('blogList');
  const router = useRouter();
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [id, setId] = useState<string | undefined>(post?.id);
  const [savedStatus, setSavedStatus] = useState<BlogPostStatus | null>(post?.status ?? null);
  const [draft, setDraft] = useState<Draft>(() => fromPost(post));
  const [save, setSave] = useState<SaveState>('idle');
  // O que está gravado; diferente do rascunho = por guardar.
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(fromPost(post)));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [site, setSite] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSite(siteUrl());
    const label = post ? t('editTitle') : t('newTitle');
    setPageTitle(label);
    setBreadcrumbs([{ label: tList('crumbSite'), href: '/portal/blog' }, { label }]);
    api
      .get<BlogCategory[]>('/blog-category')
      .then(({ data }) => setCategories(data))
      .catch(() => toast.error(t('categories.loadError')));
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [post, setPageTitle, setBreadcrumbs, t, tList]);

  const update = (patch: Partial<Draft>) =>
    setDraft((cur) => {
      const next = { ...cur, ...patch };
      if (patch.title !== undefined && !cur.slugEdited) next.slug = slugify(patch.title);
      return next;
    });

  const dirty = JSON.stringify(draft) !== snapshot;
  const saveLabel = save === 'saving' ? 'saving' : save === 'error' ? 'error' : dirty ? 'dirty' : id ? 'saved' : 'idle';

  const missing = useMemo(() => {
    const list: string[] = [];
    if (!draft.title.trim()) list.push(t('missing.title'));
    if (!draft.slug.trim()) list.push(t('missing.slug'));
    if (!textOf(draft.body)) list.push(t('missing.body'));
    if (!draft.hero) list.push(t('missing.hero'));
    return list;
  }, [draft, t]);

  const persist = useCallback(
    async (status: BlogPostStatus, quiet: boolean) => {
      if (missing.length) {
        if (!quiet) toast.error(t('missing.toast', { fields: missing.join(', ') }));
        return false;
      }
      if (status === BlogPostStatus.SCHEDULED && (!draft.publishDate || new Date(draft.publishDate) <= new Date())) {
        if (!quiet) toast.error(t('publication.dateInPast'));
        return false;
      }
      setSave('saving');
      try {
        const { data } = await api.post<BlogPostDTO>('/blog-post', {
          ...(id ? { id } : {}),
          title: draft.title.trim(),
          slug: draft.slug.trim(),
          summary: draft.summary.trim() || null,
          body: draft.body,
          hero: draft.hero,
          heroAlt: draft.heroAlt.trim() || null,
          tags: draft.tags,
          categoryIds: draft.categoryIds,
          highlight: draft.highlight,
          status,
          ...(status === BlogPostStatus.SCHEDULED ? { publishDate: new Date(draft.publishDate).toISOString() } : {}),
        });
        if (!id && data?.id) {
          setId(data.id);
          // Sem recarregar a página: o endereço passa a ser o do artigo.
          window.history.replaceState(null, '', `/portal/blog/${data.id}`);
        }
        setSavedStatus(status);
        setSnapshot(JSON.stringify(draft));
        setSave('idle');
        return true;
      } catch (error) {
        setSave('error');
        if (!quiet) toast.error(apiMessage(error, t('saveError')));
        return false;
      }
    },
    [draft, id, missing, t]
  );

  // Rascunhos guardam-se sozinhos; artigos no site só com o botão.
  useEffect(() => {
    if (!dirty || save === 'saving' || draft.status !== BlogPostStatus.DRAFT) return;
    if (savedStatus && savedStatus !== BlogPostStatus.DRAFT) return;
    if (missing.length) return;
    const timer = window.setTimeout(() => persist(BlogPostStatus.DRAFT, true), AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, save, draft.status, savedStatus, missing.length, persist]);

  const submit = async () => {
    setBusy(true);
    const ok = await persist(draft.status, false);
    setBusy(false);
    if (!ok) return;
    toast.success(
      draft.status === BlogPostStatus.PUBLISHED
        ? t('done.published')
        : draft.status === BlogPostStatus.SCHEDULED
          ? t('done.scheduled', { date: format(new Date(draft.publishDate), 'dd/MM/yyyy HH:mm') })
          : t('done.draft')
    );
    if (draft.status !== BlogPostStatus.DRAFT) router.push('/portal/blog');
  };

  const pickImage = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error(t('image.type'));
      return;
    }
    try {
      update({ hero: await resizeImage(file) });
    } catch {
      toast.error(t('image.error'));
    }
  };

  const addCategory = async () => {
    const title = newCategory.trim();
    if (!title) return;
    try {
      const { data } = await api.post<BlogCategory>('/blog-category', { title });
      setCategories((cur) => [...cur, data]);
      update({ categoryIds: [...draft.categoryIds, data.id] });
      setNewCategory('');
    } catch (error) {
      toast.error(apiMessage(error, t('categories.createError')));
    }
  };

  const addTag = (value: string) => {
    const tag = value.trim().replace(/,$/, '');
    if (tag && !draft.tags.includes(tag)) update({ tags: [...draft.tags, tag] });
    setTagInput('');
  };

  const words = textOf(draft.body).split(' ').filter(Boolean).length;
  const minutes = words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : 0;
  const siteHost = site.replace(/^https?:\/\//, '');
  const primaryLabel =
    draft.status === BlogPostStatus.SCHEDULED
      ? t('actions.schedule')
      : draft.status === BlogPostStatus.PUBLISHED
        ? savedStatus === BlogPostStatus.PUBLISHED
          ? t('actions.saveChanges')
          : t('actions.publish')
        : t('actions.saveDraft');

  const card = 'rounded-2xl border border-line-soft bg-white p-5';
  const fieldClass =
    'h-11 w-full rounded-lg border border-field bg-white px-3.5 text-sm text-navy outline-none placeholder:text-ink/60 focus:border-navy';
  const sideTitle = 'text-[15px] font-semibold text-navy';

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de ações */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              savedStatus === BlogPostStatus.PUBLISHED
                ? 'bg-mint text-forest'
                : savedStatus === BlogPostStatus.SCHEDULED
                  ? 'bg-[#fdf1dc] text-[#8a5a12]'
                  : 'bg-neutral-badge text-ink'
            )}
          >
            {tList(`status.${savedStatus ?? BlogPostStatus.DRAFT}`)}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-ink" aria-live="polite">
            {saveLabel === 'saved' ? <Check className="size-3.5" /> : null}
            {t(`save.${saveLabel}`)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="h-11 rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-semibold text-navy hover:bg-panel"
          >
            {t('actions.preview')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="h-11 rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-50"
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Título, endereço e resumo */}
          <section className={cn(card, 'flex flex-col gap-4')}>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              {t('fields.title')} *
              <input
                value={draft.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={t('fields.titlePlaceholder')}
                maxLength={255}
                data-1p-ignore
                data-lpignore="true"
                className={cn(fieldClass, 'font-normal')}
              />
            </label>
            <div className="rounded-lg bg-panel px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                {editingSlug ? (
                  <input
                    autoFocus
                    value={draft.slug}
                    onChange={(e) => setDraft((cur) => ({ ...cur, slug: slugify(e.target.value), slugEdited: true }))}
                    onBlur={() => setEditingSlug(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingSlug(false)}
                    aria-label={t('fields.slug')}
                    className="h-8 flex-1 rounded border border-field bg-white px-2 font-mono text-xs text-navy outline-none"
                  />
                ) : (
                  <p className="truncate font-mono text-xs text-ink">
                    {siteHost}/blog/ <span className="text-teal">{draft.slug || t('fields.slugPlaceholder')}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setEditingSlug((v) => !v)}
                  className="shrink-0 text-[13px] font-semibold text-teal"
                >
                  {editingSlug ? t('fields.slugDone') : t('fields.slugEdit')}
                </button>
              </div>
              <p className="mt-0.5 text-xs text-ink">{t('fields.slugHint')}</p>
            </div>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-navy">
              {t('fields.summary')}
              <input
                value={draft.summary}
                onChange={(e) => update({ summary: e.target.value.slice(0, SUMMARY_MAX) })}
                placeholder={t('fields.summaryPlaceholder')}
                maxLength={SUMMARY_MAX}
                className={cn(fieldClass, 'font-normal')}
              />
              <span className="font-mono text-[10px] font-normal text-ink">
                {draft.summary.length} / {SUMMARY_MAX} {t('fields.characters')}
              </span>
            </label>
          </section>

          {/* Corpo */}
          <section className="overflow-hidden rounded-2xl border border-line-soft bg-white">
            <SimpleEditor content={draft.body} onChange={(html) => update({ body: html })} />
            <div className="flex justify-between border-t border-line-soft px-4 py-2.5 font-mono text-[10px] text-ink">
              <span>{t('body.words', { count: words })}</span>
              <span>{minutes ? t('body.reading', { minutes }) : t('body.readingNone')}</span>
            </div>
          </section>

          {/* Google */}
          <section className={cn(card, 'flex flex-col gap-2')}>
            <h2 className={sideTitle}>{t('google.title')}</h2>
            <p className="text-xs text-ink">{t('google.hint')}</p>
            <div className="mt-1 rounded-lg border border-line-soft px-4 py-3">
              <p className="text-xs text-ink">
                {siteHost} › blog › {draft.slug || t('fields.slugPlaceholder')}
              </p>
              <p className="mt-0.5 truncate text-[18px] text-[#1a0dab]">
                {draft.title || t('google.titlePlaceholder')} | RETEX
              </p>
              <p className="mt-0.5 line-clamp-2 text-[13px] text-ink">
                {draft.summary || textOf(draft.body).slice(0, SUMMARY_MAX) || t('google.summaryPlaceholder')}
              </p>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          {/* Publicação */}
          <section className={cn(card, 'flex flex-col gap-3')}>
            <h2 className={sideTitle}>{t('publication.title')}</h2>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-panel p-1" role="radiogroup" aria-label={t('publication.title')}>
              {[BlogPostStatus.DRAFT, BlogPostStatus.PUBLISHED, BlogPostStatus.SCHEDULED].map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={draft.status === s}
                  onClick={() => update({ status: s })}
                  className={cn(
                    'h-9 rounded-md text-[13px]',
                    draft.status === s ? 'bg-white font-semibold text-navy shadow-sm' : 'text-ink hover:text-navy'
                  )}
                >
                  {tList(`status.${s}`)}
                </button>
              ))}
            </div>
            {draft.status === BlogPostStatus.SCHEDULED ? (
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-navy">
                {t('publication.when')}
                <input
                  type="datetime-local"
                  value={draft.publishDate}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => update({ publishDate: e.target.value })}
                  className={cn(fieldClass, 'font-normal')}
                />
              </label>
            ) : null}
            <p className="text-xs text-ink">{t(`publication.hint.${draft.status}`)}</p>
          </section>

          {/* Imagem */}
          <section className={cn(card, 'flex flex-col gap-3')}>
            <h2 className={sideTitle}>{t('image.title')} *</h2>
            {draft.hero ? (
              <div className="relative overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.hero} alt={draft.heroAlt} className="aspect-[1200/630] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => update({ hero: '' })}
                  aria-label={t('image.remove')}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-navy"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  pickImage(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed px-4 py-6 text-center',
                  dragOver ? 'border-navy bg-sky/60' : 'border-slate bg-panel'
                )}
              >
                <Upload className="size-5 text-teal" />
                <span className="text-[13px] font-semibold text-navy">{t('image.drop')}</span>
                <span className="font-mono text-[10px] text-ink">{t('image.formats')}</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                pickImage(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-navy">
              {t('image.alt')}
              <input
                value={draft.heroAlt}
                onChange={(e) => update({ heroAlt: e.target.value })}
                placeholder={t('image.altPlaceholder')}
                maxLength={255}
                className={cn(fieldClass, 'font-normal')}
              />
            </label>
          </section>

          {/* Categorias */}
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-baseline justify-between">
              <h2 className={sideTitle}>{t('categories.title')}</h2>
              <Link href="/portal/blog/categorias" className="text-[13px] font-semibold text-teal">
                {t('categories.manage')}
              </Link>
            </div>
            {categories.length === 0 ? <p className="text-xs text-ink">{t('categories.none')}</p> : null}
            {categories.map((c) => {
              const checked = draft.categoryIds.includes(c.id);
              return (
                <label key={c.id} className="flex items-center gap-2.5 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      update({
                        categoryIds: checked ? draft.categoryIds.filter((x) => x !== c.id) : [...draft.categoryIds, c.id],
                      })
                    }
                    className="size-4 accent-navy"
                  />
                  {c.title}
                </label>
              );
            })}
            <div className="flex gap-2">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                placeholder={t('categories.newPlaceholder')}
                className="h-9 min-w-0 flex-1 rounded-lg border border-field px-3 text-[13px] outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={!newCategory.trim()}
                className="h-9 rounded-full border-[1.5px] border-navy px-3.5 text-[13px] font-semibold text-navy disabled:opacity-50"
              >
                {t('categories.add')}
              </button>
            </div>
          </section>

          {/* Palavras-chave */}
          <section className={cn(card, 'flex flex-col gap-3')}>
            <h2 className={sideTitle}>{t('tags.title')}</h2>
            <div className="flex flex-col gap-2 rounded-lg border border-field px-2.5 py-2">
              {draft.tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {draft.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 rounded bg-sky px-2 py-0.5 text-xs text-navy">
                      {tag}
                      <button
                        type="button"
                        aria-label={t('tags.remove', { tag })}
                        onClick={() => update({ tags: draft.tags.filter((x) => x !== tag) })}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag(tagInput);
                  } else if (e.key === 'Backspace' && !tagInput && draft.tags.length) {
                    update({ tags: draft.tags.slice(0, -1) });
                  }
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={t('tags.placeholder')}
                aria-label={t('tags.title')}
                className="h-7 text-[13px] text-navy outline-none placeholder:text-ink/60"
              />
            </div>
          </section>

          {/* Destaque */}
          <section className={cn(card, 'flex flex-col gap-2.5')}>
            <h2 className={sideTitle}>{t('highlight.title')}</h2>
            {[BlogPostHighlight.NONE, BlogPostHighlight.HIGHLIGHTED, BlogPostHighlight.FEATURED].map((h) => (
              <label
                key={h}
                className={cn(
                  'flex cursor-pointer gap-2.5 rounded-lg border px-3 py-2.5',
                  draft.highlight === h ? 'border-[1.5px] border-navy bg-row-selected' : 'border-line-soft'
                )}
              >
                <input
                  type="radio"
                  name="highlight"
                  checked={draft.highlight === h}
                  onChange={() => update({ highlight: h })}
                  className="mt-0.5 size-4 accent-navy"
                />
                <span>
                  <span className="block text-[13px] font-semibold text-navy">{t(`highlight.${h}.label`)}</span>
                  <span className="block text-xs text-ink">{t(`highlight.${h}.hint`)}</span>
                </span>
              </label>
            ))}
          </section>
        </aside>
      </div>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle className="sr-only">{t('actions.preview')}</DialogTitle>
          </DialogHeader>
          <article className="flex flex-col gap-4 text-navy">
            {draft.categoryIds.length ? (
              <small className="font-mono text-[11px] uppercase tracking-[0.06em] text-teal">
                {categories.find((c) => c.id === draft.categoryIds[0])?.title}
              </small>
            ) : null}
            <h1 className="text-left text-[30px] font-bold leading-tight">{draft.title || t('google.titlePlaceholder')}</h1>
            {draft.summary ? <p className="text-[15px] text-ink">{draft.summary}</p> : null}
            {draft.hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.hero} alt={draft.heroAlt} className="w-full rounded-xl" />
            ) : null}
            <div className="simple-editor-content prose max-w-none" dangerouslySetInnerHTML={{ __html: draft.body }} />
          </article>
        </DialogContent>
      </Dialog>
    </div>
  );
}
