'use client';

import { FaqCategoryDTO, FaqItemDTO, FaqStatus } from '@/app/types/faq';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import Toggle from '@/components/custom/toggle';
import { moveItem, useDragOrder } from '@/hooks/use-drag-order';
import api from '@/lib/api';
import { siteUrl } from '@/lib/site';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// Perguntas mostradas de início; "Carregar mais" mostra as seguintes.
const PAGE = 10;
// Id das perguntas ainda não gravadas.
const NEW = 'new';

type ItemForm = { id: string; title: string; description: string; categoryId: string };

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

/** Perguntas frequentes (Figma 18-Admin-FAQ): grupos à esquerda, perguntas do grupo à direita. */
export default function Faq() {
  const t = useTranslations('faqPage');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [groups, setGroups] = useState<FaqCategoryDTO[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState<ItemForm | null>(null);
  const [newGroup, setNewGroup] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ title: string; description: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [site, setSite] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<FaqCategoryDTO[]>('/faq/all');
      const sorted = data.map((g) => ({
        ...g,
        items: [...(g.items ?? [])].sort((a, b) => a.position - b.position),
      }));
      setGroups(sorted);
      setSelectedId((cur) => (cur && sorted.some((g) => g.id === cur) ? cur : (sorted[0]?.id ?? null)));
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setSite(siteUrl());
    setPageTitle(t('title'));
    setBreadcrumbs([{ label: t('crumb') }]);
    load();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [load, setPageTitle, setBreadcrumbs, t]);

  const list = groups ?? [];
  const group = list.find((g) => g.id === selectedId) ?? null;
  const items = useMemo(() => group?.items ?? [], [group]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? items.filter((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
      : items;
  }, [items, search]);

  const setGroupItems = (groupId: string, next: FaqItemDTO[]) =>
    setGroups((cur) => (cur ?? []).map((g) => (g.id === groupId ? { ...g, items: next } : g)));

  const saveGroupOrder = async (next: FaqCategoryDTO[]) => {
    const previous = groups;
    setGroups(next);
    try {
      await api.put('/faq/order', { ids: next.map((g) => g.id) });
    } catch (error) {
      setGroups(previous);
      toast.error(apiMessage(error, t('orderError')));
    }
  };

  const saveItemOrder = async (next: FaqItemDTO[]) => {
    if (!group) return;
    const previous = group.items;
    setGroupItems(group.id, next);
    try {
      await api.put(`/faq/category/${group.id}/order`, { ids: next.map((i) => i.id) });
    } catch (error) {
      setGroupItems(group.id, previous);
      toast.error(apiMessage(error, t('orderError')));
    }
  };

  const groupDrag = useDragOrder(list, saveGroupOrder);
  // Com pesquisa, a ordem visível não é a do grupo: não se arrasta.
  const itemDrag = useDragOrder(items, saveItemOrder);

  const patchItem = async (item: FaqItemDTO, data: Partial<FaqItemDTO>) => {
    if (!group) return;
    setGroupItems(group.id, items.map((i) => (i.id === item.id ? { ...i, ...data } : i)));
    try {
      await api.patch(`/faq/item/${item.id}`, data);
    } catch (error) {
      setGroupItems(group.id, items);
      toast.error(apiMessage(error, t('saveError')));
    }
  };

  const setGroupVisible = async (visible: boolean) => {
    if (!group) return;
    const status = visible ? FaqStatus.ACTIVE : FaqStatus.INACTIVE;
    setGroups((cur) => (cur ?? []).map((g) => (g.id === group.id ? { ...g, status } : g)));
    try {
      await api.patch(`/faq/category/${group.id}`, { status });
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
      load();
    }
  };

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing || !editing.title.trim() || !editing.description.trim()) return;
    setBusy(true);
    try {
      const body = { title: editing.title.trim(), description: editing.description.trim() };
      if (editing.id === NEW) {
        await api.post(`/faq/category/${editing.categoryId}/item`, body);
      } else {
        const original = items.find((i) => i.id === editing.id);
        await api.patch(`/faq/item/${editing.id}`, {
          ...body,
          ...(original && original.categoryId !== editing.categoryId ? { categoryId: editing.categoryId } : {}),
        });
      }
      toast.success(t('saved'));
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async (item: FaqItemDTO) => {
    try {
      await api.delete(`/faq/item/${item.id}`);
      toast.success(t('deleted'));
      if (editing?.id === item.id) setEditing(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('deleteError')));
    }
  };

  const createGroup = async (event: FormEvent) => {
    event.preventDefault();
    const title = newGroup?.trim();
    if (!title) return;
    try {
      const { data } = await api.post<FaqCategoryDTO>('/faq/category', { title });
      setNewGroup(null);
      setSelectedId(data.id);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    }
  };

  const saveRename = async (event: FormEvent) => {
    event.preventDefault();
    if (!group || !renaming?.title.trim()) return;
    try {
      await api.patch(`/faq/category/${group.id}`, {
        title: renaming.title.trim(),
        description: renaming.description.trim(),
      });
      setRenaming(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    }
  };

  const removeGroup = async () => {
    if (!group) return;
    try {
      await api.delete(`/faq/category/${group.id}`);
      toast.success(t('groupDeleted'));
      setSelectedId(null);
      setRenaming(null);
      await load();
    } catch (error) {
      toast.error(apiMessage(error, t('deleteError')));
    }
  };

  const newQuestion = () => {
    if (!group) {
      toast.error(t('pickGroup'));
      return;
    }
    setSearch('');
    setShown(Math.max(shown, items.length + 1));
    setEditing({ id: NEW, title: '', description: '', categoryId: group.id });
  };

  const visibleCount = items.filter((i) => i.visible).length;
  const field =
    'h-11 w-full rounded-lg border border-field bg-white px-3.5 text-sm text-navy outline-none placeholder:text-ink/60 focus:border-navy';

  const itemEditor = (form: ItemForm) => (
    <form onSubmit={saveItem} className="flex flex-col gap-3 px-4 pb-4 pl-[60px]">
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-navy">
        {t('item.question')}
        <input
          autoFocus
          required
          value={form.title}
          onChange={(e) => setEditing({ ...form, title: e.target.value })}
          maxLength={255}
          className={cn(field, 'font-normal')}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-navy">
        {t('item.answer')}
        <textarea
          required
          rows={5}
          value={form.description}
          onChange={(e) => setEditing({ ...form, description: e.target.value })}
          className="rounded-lg border border-field px-3.5 py-2.5 text-sm font-normal text-navy outline-none focus:border-navy"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-[13px] text-navy">
          <span className="sr-only">{t('item.group')}</span>
          <select
            value={form.categoryId}
            onChange={(e) => setEditing({ ...form, categoryId: e.target.value })}
            className="h-9 rounded-lg border border-field bg-white px-2.5 text-[13px]"
          >
            {list.map((g) => (
              <option key={g.id} value={g.id}>
                {t('item.groupOption', { name: g.title })}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="h-9 rounded-full border-[1.5px] border-navy px-4 text-[13px] font-semibold text-navy"
          >
            {t('item.cancel')}
          </button>
          <button
            type="submit"
            disabled={busy || !form.title.trim() || !form.description.trim()}
            className="h-9 rounded-full bg-navy px-4 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {t('item.save')}
          </button>
        </div>
      </div>
    </form>
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <a
          href={`${site}/faq`}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center rounded-full border-[1.5px] border-navy bg-white px-5 text-sm font-semibold text-navy hover:bg-panel"
        >
          {t('viewSite')}
        </a>
        <button
          type="button"
          onClick={newQuestion}
          className="flex h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90"
        >
          + {t('newQuestion')}
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Grupos */}
        <nav className="flex flex-col gap-2 rounded-2xl border border-line-soft bg-white p-3" aria-label={t('groups')}>
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.06em] text-ink">{t('groups')}</p>
          {list.map((g, index) => {
            const active = g.id === selectedId;
            return (
              <div
                key={g.id}
                {...groupDrag.handlers(g)}
                className={cn(
                  'group flex items-center gap-1 rounded-xl border',
                  active ? 'border-[1.5px] border-navy bg-row-selected' : 'border-transparent hover:bg-panel',
                  groupDrag.dragging === g.id && 'opacity-50',
                  groupDrag.over === g.id && groupDrag.dragging !== g.id && 'outline outline-2 outline-teal'
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(g.id);
                    setEditing(null);
                    setRenaming(null);
                    setSearch('');
                    setShown(PAGE);
                  }}
                  aria-current={active ? 'true' : undefined}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2.5 py-2.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-navy">{g.title}</span>
                    <span className="block font-mono text-[10px] text-ink">
                      {t('groupMeta', {
                        count: g.items?.length ?? 0,
                        status: g.status === FaqStatus.ACTIVE ? t('visible') : t('hidden'),
                      })}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-navy" />
                </button>
                <span className="flex flex-col">
                  <button
                    type="button"
                    aria-label={t('moveUp', { name: g.title })}
                    disabled={index === 0}
                    onClick={() => saveGroupOrder(moveItem(list, index, index - 1))}
                    className="sr-only focus:not-sr-only"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={t('moveDown', { name: g.title })}
                    disabled={index === list.length - 1}
                    onClick={() => saveGroupOrder(moveItem(list, index, index + 1))}
                    className="sr-only focus:not-sr-only"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                </span>
              </div>
            );
          })}
          {newGroup !== null ? (
            <form onSubmit={createGroup} className="flex flex-col gap-2 rounded-xl border border-field p-2">
              <input
                autoFocus
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder={t('newGroupPlaceholder')}
                maxLength={255}
                className="h-9 rounded-lg border border-field px-2.5 text-[13px] outline-none focus:border-navy"
              />
              <div className="flex justify-end gap-1.5">
                <button type="button" onClick={() => setNewGroup(null)} className="px-2 text-[13px] text-ink">
                  {t('item.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newGroup.trim()}
                  className="h-8 rounded-full bg-navy px-3 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {t('create')}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setNewGroup('')}
              className="flex h-10 items-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-slate px-3 text-[13px] font-semibold text-teal hover:bg-panel"
            >
              <Plus className="size-4" />
              {t('newGroup')}
            </button>
          )}
        </nav>

        {/* Perguntas do grupo */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-line-soft bg-white">
          {group ? (
            <>
              <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
                {renaming ? (
                  <form onSubmit={saveRename} className="flex flex-1 flex-col gap-2">
                    <input
                      autoFocus
                      value={renaming.title}
                      onChange={(e) => setRenaming({ ...renaming, title: e.target.value })}
                      aria-label={t('rename')}
                      maxLength={255}
                      className={field}
                    />
                    <input
                      value={renaming.description}
                      onChange={(e) => setRenaming({ ...renaming, description: e.target.value })}
                      placeholder={t('descriptionPlaceholder')}
                      className={field}
                    />
                    <div className="flex flex-wrap justify-between gap-2">
                      <ConfirmDialog
                        trigger={
                          <button type="button" className="text-[13px] font-semibold text-[#a12a1e]">
                            {t('deleteGroup')}
                          </button>
                        }
                        title={t('deleteGroupTitle', { name: group.title })}
                        description={t('deleteGroupBody', { count: items.length })}
                        onConfirm={removeGroup}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRenaming(null)}
                          className="h-9 rounded-full border-[1.5px] border-navy px-4 text-[13px] font-semibold text-navy"
                        >
                          {t('item.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="h-9 rounded-full bg-navy px-4 text-[13px] font-semibold text-white"
                        >
                          {t('item.save')}
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-navy">{group.title}</h2>
                    <p className="font-mono text-[10px] text-ink">
                      {t('groupSummary', { count: items.length, visible: visibleCount })}
                    </p>
                  </div>
                )}
                {!renaming ? (
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="flex items-center gap-2 text-[13px] text-ink">
                      {t('groupVisible')}
                      <Toggle
                        checked={group.status === FaqStatus.ACTIVE}
                        onChange={setGroupVisible}
                        label={t('groupVisible')}
                      />
                    </span>
                    <button
                      type="button"
                      onClick={() => setRenaming({ title: group.title, description: group.description ?? '' })}
                      className="h-9 rounded-full border-[1.5px] border-navy px-4 text-[13px] font-semibold text-navy hover:bg-panel"
                    >
                      {t('rename')}
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="px-4 py-3">
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search')}
                  className={field}
                />
              </div>

              <div className="flex flex-col gap-2 px-4 pb-4">
                {filtered.slice(0, shown).map((item) => {
                  const index = items.findIndex((i) => i.id === item.id);
                  const open = editing?.id === item.id;
                  const drag = search ? {} : itemDrag.handlers(item);
                  return (
                    <div
                      key={item.id}
                      {...drag}
                      className={cn(
                        'rounded-xl border',
                        open ? 'border-[1.5px] border-navy' : 'border-line-soft',
                        itemDrag.dragging === item.id && 'opacity-50',
                        itemDrag.over === item.id && itemDrag.dragging !== item.id && 'outline outline-2 outline-teal'
                      )}
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <GripVertical className={cn('size-4 shrink-0 text-slate', !search && 'cursor-grab')} aria-hidden />
                        <span className="flex flex-col">
                          <button
                            type="button"
                            aria-label={t('moveUp', { name: item.title })}
                            disabled={!!search || index === 0}
                            onClick={() => saveItemOrder(moveItem(items, index, index - 1))}
                            className="sr-only focus:not-sr-only"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={t('moveDown', { name: item.title })}
                            disabled={!!search || index === items.length - 1}
                            onClick={() => saveItemOrder(moveItem(items, index, index + 1))}
                            className="sr-only focus:not-sr-only"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        </span>
                        <span className="w-6 shrink-0 font-mono text-[11px] text-ink">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditing(
                              open
                                ? null
                                : { id: item.id, title: item.title, description: item.description, categoryId: item.categoryId }
                            )
                          }
                          className={cn('min-w-0 flex-1 text-left', !item.visible && 'opacity-50')}
                        >
                          <span className="block truncate text-[14px] font-semibold text-navy">{item.title}</span>
                          {!open ? (
                            <span className="block truncate text-xs text-ink">{item.description}</span>
                          ) : null}
                        </button>
                        <Toggle
                          checked={item.visible}
                          onChange={(visible) => patchItem(item, { visible })}
                          label={t('itemVisible', { name: item.title })}
                        />
                        <ConfirmDialog
                          trigger={
                            <button
                              type="button"
                              aria-label={t('deleteItem', { name: item.title })}
                              className="rounded p-1.5 text-[#a12a1e] hover:bg-panel"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          }
                          title={t('deleteItemTitle')}
                          description={item.title}
                          onConfirm={() => removeItem(item)}
                        />
                        <button
                          type="button"
                          aria-label={open ? t('collapse') : t('expand')}
                          aria-expanded={open}
                          onClick={() =>
                            setEditing(
                              open
                                ? null
                                : { id: item.id, title: item.title, description: item.description, categoryId: item.categoryId }
                            )
                          }
                          className="p-1 text-navy"
                        >
                          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                        </button>
                      </div>
                      {open && editing ? itemEditor(editing) : null}
                    </div>
                  );
                })}
                {editing?.id === NEW ? (
                  <div className="rounded-xl border-[1.5px] border-navy pt-3">
                    <p className="px-4 pb-2 pl-[60px] text-[13px] font-semibold text-teal">{t('newQuestion')}</p>
                    {itemEditor(editing)}
                  </div>
                ) : null}
                {items.length === 0 && editing?.id !== NEW ? (
                  <p className="py-6 text-center text-sm text-ink">{t('emptyGroup')}</p>
                ) : null}
                {items.length > 0 && filtered.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink">{t('noMatch')}</p>
                ) : null}
              </div>
              <div className="flex items-center justify-between border-t border-line-soft px-4 py-3 text-sm text-ink">
                <span>{t('showing', { shown: Math.min(shown, filtered.length), total: filtered.length })}</span>
                {shown < filtered.length ? (
                  <button type="button" onClick={() => setShown(shown + PAGE)} className="font-semibold text-teal">
                    {t('loadMore')}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="p-6 text-sm text-ink">{groups ? t('noGroups') : t('loading')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
