'use client';

import { Role, UserDTO } from '@/app/types/user';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { isMaster, isPrivilegedUser } from '@/lib/access-control';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Loader2, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import ResetPasswordForm from './reset-password-form';
import UserForm from './user-form';

type Kind = 'PERSON' | 'COMPANY' | 'MUNICIPALITY' | 'DRIVER' | 'TEAM';
type Tab = 'ALL' | Kind;

type Entry = {
  kind: Kind;
  id: string;
  name: string;
  email: string | null;
  taxId: string | null;
  companyKind: string | null;
  locations: number;
  roles: string[];
  plate: string | null;
  city: string | null;
  collections: number;
  deliveredKg: number;
  lastActivityAt: string | null;
  inRoute: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_EMAIL';
};

type Directory = {
  data: Entry[];
  total: number;
  counts: Record<Tab, number>;
  page: number;
  limit: number;
};

const TABS: Tab[] = ['ALL', 'PERSON', 'COMPANY', 'MUNICIPALITY', 'DRIVER', 'TEAM'];
const LIMIT = 25;

const KIND_BADGE: Record<Kind, string> = {
  PERSON: 'bg-[#dceff3] text-[#02566a]',
  COMPANY: 'bg-[#e6f2ee] text-forest',
  MUNICIPALITY: 'bg-[#ece6f8] text-[#4b3590]',
  DRIVER: 'bg-[#dceff3] text-navy',
  TEAM: 'bg-neutral-badge text-ink',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-mint text-forest',
  PENDING_EMAIL: 'bg-[#dceff3] text-[#02566a]',
  INACTIVE: 'bg-neutral-badge text-ink',
};

// Perfis que se podem dar num convite; ADMIN só para o MASTER (a API recusa na mesma).
const INVITE_ROLES = [Role.USER, Role.DRIVER, Role.OPS, Role.ADMIN];

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

/** Utilizadores (Figma 13-Admin-Utilizadores): pessoas e entidades numa só lista. */
export default function UsersDirectory() {
  const t = useTranslations('usersDirectory');
  const tUsers = useTranslations('users');
  const tRole = useTranslations('enums.role');
  const tKind = useTranslations('enums.companyKind');
  const locale = useLocale();
  const { user: currentUser, setPageTitle, setBreadcrumbs } = useAppStore();
  const currentIsMaster = isMaster(currentUser);

  const [tab, setTab] = useState<Tab>('ALL');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [managing, setManaging] = useState<UserDTO | null>(null);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ firstName: '', lastName: '', email: '', contactPhone: '', role: Role.USER });
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    setPageTitle(t('title'));
    setBreadcrumbs([]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, t]);

  // Pesquisa no servidor, depois de parar de escrever.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Directory>('/user/directory', {
        params: { kind: tab === 'ALL' ? undefined : tab, q: debounced || undefined, page, limit: LIMIT },
      });
      setDirectory(data);
    } catch {
      toast.error(tUsers('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [tab, debounced, page, tUsers]);

  useEffect(() => {
    load();
  }, [load]);

  const numberFormat = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }), [locale]);

  const activity = (entry: Entry) => {
    if (entry.inRoute) return t('activity.inRoute');
    if (!entry.lastActivityAt) return '—';
    const date = new Date(entry.lastActivityAt);
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
    if (days === 0) return t('activity.today');
    if (days === 1) return t('activity.yesterday');
    return dateFormat.format(date);
  };

  const subtitle = (entry: Entry) => {
    if (entry.kind === 'COMPANY' || entry.kind === 'MUNICIPALITY') {
      return [
        entry.taxId ? t('taxId', { taxId: entry.taxId }) : null,
        entry.companyKind && entry.companyKind !== 'COMPANY' && entry.companyKind !== 'MUNICIPALITY'
          ? tKind(entry.companyKind)
          : null,
        entry.locations ? t('locations', { count: entry.locations }) : null,
      ]
        .filter(Boolean)
        .join(' · ');
    }
    if (entry.kind === 'DRIVER') return entry.plate ? t('vehicle', { plate: entry.plate }) : entry.email;
    if (entry.kind === 'TEAM') {
      return entry.roles
        .filter((r) => r !== Role.USER)
        .map((r) => tRole(r))
        .join(' · ');
    }
    return entry.email;
  };

  const manage = async (entry: Entry) => {
    setLoadingUserId(entry.id);
    try {
      const { data } = await api.get<UserDTO>(`/user/${entry.id}`);
      setManaging(data);
    } catch {
      toast.error(tUsers('loadError'));
    } finally {
      setLoadingUserId(null);
    }
  };

  const deactivate = async (user: UserDTO) => {
    try {
      await api.put(`/user/${user.id}`, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactPhone: user.contactPhone,
        status: 'INACTIVE',
      });
      toast.success(tUsers('deleteSuccess'));
      setManaging(null);
      await load();
    } catch {
      toast.error(tUsers('deleteError'));
    }
  };

  const sendInvite = async (event: FormEvent) => {
    event.preventDefault();
    setIsInviting(true);
    try {
      await api.post('/user/invite', {
        firstName: invite.firstName,
        lastName: invite.lastName,
        email: invite.email,
        contactPhone: invite.contactPhone || undefined,
        roles: [invite.role],
      });
      toast.success(t('invite.sent', { email: invite.email }));
      setInviteOpen(false);
      setInvite({ firstName: '', lastName: '', email: '', contactPhone: '', role: Role.USER });
      setTab('ALL');
      setQuery(invite.email);
    } catch (error) {
      toast.error(apiMessage(error, t('invite.error')));
    } finally {
      setIsInviting(false);
    }
  };

  const total = directory?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const rows = directory?.data ?? [];
  const inputClass = 'h-10 rounded-lg border border-field px-3 text-sm';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          data-1p-ignore
          data-lpignore="true"
          className="h-[48px] w-full rounded-xl border border-line bg-white px-4 text-[15px] text-navy placeholder:text-ink/70 sm:w-[330px]"
        />
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="h-[48px] rounded-full bg-navy px-6 text-[15px] font-semibold text-white hover:bg-navy/90"
        >
          + {t('invite.button')}
        </button>
      </div>

      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setPage(1);
            }}
            className={cn(
              'inline-flex h-[34px] items-center gap-1.5 rounded-full border border-navy px-3.5 text-[14px] font-medium',
              tab === key ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-panel'
            )}
          >
            {t(`tabs.${key}`)}
            <span className={cn('font-mono text-[11px]', tab === key ? 'text-white/70' : 'text-ink')}>
              {numberFormat.format(directory?.counts?.[key] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-line-soft bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm text-navy">
            <thead className="bg-canvas font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
              <tr>
                {['name', 'type', 'city', 'collections', 'kg', 'activity', 'status'].map((col) => (
                  <th key={col} className="px-4 py-4 font-normal">
                    {t(`columns.${col}`)}
                  </th>
                ))}
                <th className="px-4 py-4">
                  <span className="sr-only">{t('columns.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody className={cn(isLoading && 'opacity-60')}>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink">
                    {isLoading ? t('loading') : t('empty')}
                  </td>
                </tr>
              ) : (
                rows.map((entry) => {
                  const isEntity = entry.kind === 'COMPANY' || entry.kind === 'MUNICIPALITY';
                  return (
                    <tr key={`${entry.kind}-${entry.id}`} className="border-t border-line-soft">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold">{entry.name || '—'}</p>
                        <p className="text-xs text-ink">{subtitle(entry) || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', KIND_BADGE[entry.kind])}>
                          {t(`kinds.${entry.kind}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{entry.city ?? '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-teal">
                        {entry.kind === 'TEAM' || entry.collections === 0 ? '—' : numberFormat.format(entry.collections)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-teal">
                        {entry.deliveredKg > 0 ? numberFormat.format(entry.deliveredKg) : '—'}
                      </td>
                      <td className="px-4 py-3.5">{activity(entry)}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn('whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_BADGE[entry.status])}>
                          {t(`status.${entry.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {isEntity ? (
                          <Link
                            href={`/portal/company/${entry.id}/members`}
                            className="text-xs font-semibold text-teal underline underline-offset-2"
                          >
                            {t('open')}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => manage(entry)}
                            disabled={loadingUserId === entry.id}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-teal underline underline-offset-2"
                          >
                            {loadingUserId === entry.id ? <Loader2 className="size-3 animate-spin" /> : null}
                            {t('manage')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3.5 text-[13px] text-ink">
          <span>{t('showing', { shown: rows.length, total: numberFormat.format(total) })}</span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-full border border-navy px-3 text-xs text-navy disabled:opacity-40"
            >
              {t('previous')}
            </button>
            <span className="font-mono text-xs">
              {page} / {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-full border border-navy px-3 text-xs text-navy disabled:opacity-40"
            >
              {t('next')}
            </button>
          </span>
          <span>{t('privacy')}</span>
        </div>
      </section>

      {/* Gerir uma pessoa: as ações que já existiam (editar, repor palavra-passe, desativar). */}
      <Dialog open={!!managing} onOpenChange={(open) => !open && setManaging(null)}>
        <DialogContent className="sm:max-w-[460px]">
          {managing ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {managing.firstName} {managing.lastName}
                </DialogTitle>
                <DialogDescription>
                  {managing.email} · {managing.roles.map((r) => tRole(r.role)).join(', ')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm text-navy">
                <div className="flex items-center justify-between gap-3">
                  <span>{t('actions.edit')}</span>
                  <UserForm
                    initialData={{
                      id: managing.id,
                      firstName: managing.firstName,
                      lastName: managing.lastName,
                      email: managing.email,
                      contactPhone: managing.contactPhone,
                      role: managing.roles.map((r) => r.role),
                    }}
                    onSave={() => {
                      setManaging(null);
                      load();
                    }}
                  />
                </div>
                {currentIsMaster || !isPrivilegedUser(managing) ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('actions.password')}</span>
                      <ResetPasswordForm user={managing} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('actions.deactivate')}</span>
                      <ConfirmDialog
                        trigger={
                          <Button variant="ghost" size="icon" className="size-8">
                            <TrashIcon className="size-4" />
                          </Button>
                        }
                        onConfirm={() => deactivate(managing)}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-ink">{t('actions.masterOnly')}</p>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={sendInvite} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{t('invite.title')}</DialogTitle>
              <DialogDescription>{t('invite.body')}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm text-navy">
                {t('invite.firstName')}
                <input
                  required
                  maxLength={255}
                  value={invite.firstName}
                  onChange={(e) => setInvite({ ...invite, firstName: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-navy">
                {t('invite.lastName')}
                <input
                  required
                  maxLength={255}
                  value={invite.lastName}
                  onChange={(e) => setInvite({ ...invite, lastName: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm text-navy">
              {t('invite.email')}
              <input
                required
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-navy">
              {t('invite.phone')}
              <input
                type="tel"
                maxLength={20}
                value={invite.contactPhone}
                onChange={(e) => setInvite({ ...invite, contactPhone: e.target.value })}
                className={inputClass}
              />
            </label>
            <fieldset className="flex flex-col gap-1.5 text-sm text-navy">
              <legend className="mb-1.5">{t('invite.role')}</legend>
              <div className="grid grid-cols-2 gap-2">
                {INVITE_ROLES.filter((role) => role !== Role.ADMIN || currentIsMaster).map((role) => (
                  <label
                    key={role}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2',
                      invite.role === role ? 'border-navy bg-panel' : 'border-field'
                    )}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      checked={invite.role === role}
                      onChange={() => setInvite({ ...invite, role })}
                    />
                    {tRole(role)}
                  </label>
                ))}
              </div>
            </fieldset>
            <DialogFooter>
              <button
                type="submit"
                disabled={isInviting}
                className="h-10 rounded-full bg-navy px-5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isInviting ? t('invite.sending') : t('invite.send')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
