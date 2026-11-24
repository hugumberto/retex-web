'use client';

import { CollectionRequestDTO, CollectionRequestStatus } from '@/app/types/collection-request';
import { Role } from '@/app/types/user';
import { getUserRoles } from '@/lib/access-control';
import { streetLine } from '@/lib/address';
import api from '@/lib/api';
import { STATUS_CLASS } from '@/lib/collection-request-status';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Percurso que o cliente vê para o pedido em curso.
const STEPS = ['requested', 'scheduled', 'collected', 'sorting', 'done'] as const;

const stepOf = (status: CollectionRequestStatus): number => {
  switch (status) {
    case CollectionRequestStatus.CREATED:
      return 0;
    case CollectionRequestStatus.CONFIRMED:
    case CollectionRequestStatus.WAITING_FOR_COLLECTION:
      return 1;
    case CollectionRequestStatus.COLLECTED:
    case CollectionRequestStatus.IN_TRANSIT:
    case CollectionRequestStatus.IN_HOUSE:
      return 2;
    case CollectionRequestStatus.SCREENING:
      return 3;
    case CollectionRequestStatus.STOCKED:
      return 4;
    default:
      return -1;
  }
};

const ACTIVE = (s: CollectionRequestStatus) =>
  s !== CollectionRequestStatus.STOCKED &&
  s !== CollectionRequestStatus.CANCELLED &&
  s !== CollectionRequestStatus.OUT_OF_ZONE;

/** Início do portal. O cliente vê o pedido em curso e os seus pedidos. */
export default function Index() {
  const t = useTranslations('portalHome');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const { setPageTitle, setBreadcrumbs, user } = useAppStore();
  const [requests, setRequests] = useState<CollectionRequestDTO[] | null>(null);

  const isUserRole = getUserRoles(user).includes(Role.USER);

  const fetchRequests = useCallback(async () => {
    try {
      const { data } = await api.get<CollectionRequestDTO[]>('/me/collection-requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t('loadError'));
      setRequests([]);
    }
  }, [t]);

  useEffect(() => {
    setPageTitle('');
    setBreadcrumbs([]);
    if (isUserRole) fetchRequests();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs, isUserRole, fetchRequests]);

  const sorted = [...(requests ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const active = sorted.find((r) => ACTIVE(r.status)) ?? null;
  const step = active ? stepOf(active.status) : -1;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-left text-[22px] font-bold text-navy">
            {user?.firstName ? t('greetingWithName', { name: user.firstName }) : t('greeting')}
          </h2>
          <p className="text-sm text-ink">{t('welcome')}</p>
        </div>
        {isUserRole && !active ? (
          <Link
            href="/portal/collection-request"
            className="flex h-11 items-center self-start rounded-full bg-navy px-5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            + {t('newRequest')}
          </Link>
        ) : null}
      </div>

      {isUserRole && active ? (
        <div className="flex flex-col gap-5 rounded-2xl bg-[linear-gradient(110deg,#013364_0%,#02748e_100%)] p-6 text-white">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/70">{t('activeLabel')}</p>
              <p className="text-[22px] font-bold">{active.friendlyCode}</p>
            </div>
            <p className="text-sm text-white/80">{t(`hint.${STEPS[Math.max(0, step)]}`)}</p>
          </div>
          <ol className="grid grid-cols-5 gap-2">
            {STEPS.map((key, i) => (
              <li key={key} className="flex flex-col gap-2">
                <span className={cn('h-1.5 rounded-full', i <= step ? 'bg-white' : 'bg-white/25')} />
                <span className={cn('flex items-center gap-1 text-[12px]', i <= step ? 'text-white' : 'text-white/60')}>
                  {i < step ? <Check className="size-3.5" /> : null}
                  {t(`steps.${key}`)}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/85">
            <span>{streetLine(active.address?.street, active.address?.number)}</span>
            {active.estimatedBags ? <span>{t('bags', { count: active.estimatedBags })}</span> : null}
            {active.preferredDate ? (
              <span>
                {t('preferred', {
                  date: format(new Date(`${active.preferredDate.slice(0, 10)}T12:00:00`), 'dd/MM'),
                  window: active.preferredInterval ?? '',
                })}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {isUserRole ? (
        <div className="rounded-2xl border border-line-soft bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-lg font-semibold text-navy">{t('myRequests')}</h3>
            <Link href="/portal/collection-request" className="text-sm font-semibold text-teal">
              {t('seeAll')}
            </Link>
          </div>
          {requests === null ? (
            <p className="border-t border-line-soft px-5 py-6 text-center text-sm text-ink">{t('loading')}</p>
          ) : sorted.length === 0 ? (
            <p className="border-t border-line-soft px-5 py-6 text-center text-sm text-ink">{t('empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm text-navy">
                <thead className="bg-canvas font-mono text-[10px] uppercase tracking-[0.06em] text-ink">
                  <tr>
                    {['code', 'address', 'bags', 'created', 'status'].map((c) => (
                      <th key={c} className="px-5 py-3 font-normal">
                        {t(`columns.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 5).map((r) => (
                    <tr key={r.id} className="border-t border-line-soft">
                      <td className="px-5 py-3 font-mono">{r.friendlyCode ?? '—'}</td>
                      <td className="px-5 py-3">
                        {[streetLine(r.address?.street, r.address?.number), r.address?.city].filter(Boolean).join(', ')}
                      </td>
                      <td className="px-5 py-3 font-mono">{r.estimatedBags ?? '—'}</td>
                      <td className="px-5 py-3 font-mono text-xs">{format(new Date(r.createdAt), 'dd/MM/yyyy')}</td>
                      <td className="px-5 py-3">
                        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', STATUS_CLASS[r.status])}>
                          {tStatus(r.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
