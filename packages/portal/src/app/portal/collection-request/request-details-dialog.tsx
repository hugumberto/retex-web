'use client';

import { useTranslations } from 'next-intl';
import { CollectionRequestDTO } from '@/app/types/collection-request';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SearchIcon } from 'lucide-react';
import { Role } from '@/app/types/user';
import { getUserRoles } from '@/lib/access-control';
import { formatZip, streetLine } from '@/lib/address';
import { useAppStore } from '@/store';
import { STATUS_CLASS } from '@/lib/collection-request-status';

type Props = {
  request: CollectionRequestDTO;
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink">{label}</span>
      <span className="break-words text-sm font-medium text-navy">
        {value !== undefined && value !== null && value !== '' ? value : '—'}
      </span>
    </div>
  );
}

export default function RequestDetailsDialog({ request }: Props) {
  const t = useTranslations('collectionRequest');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const user = request.user;
  const address = request.address;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  // Coordenadas só interessam à equipa (rotas); o cliente não precisa de as ver.
  const { user: viewer } = useAppStore();
  const isTeam = getUserRoles(viewer).some((r) => r === Role.ADMIN || r === Role.OPS);
  const weight = request.weight != null && Number(request.weight) > 0
    ? `${Number(request.weight).toLocaleString('pt-PT', { maximumFractionDigits: 1 })}`
    : undefined;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title={t('viewAllTooltip')}
        >
          <SearchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-left text-[22px] font-bold text-navy">
            {t('detailsHeading', { code: request.friendlyCode ?? '' })}
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_CLASS[request.status] ?? ''}`}>
              {tStatus(request.status)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h3 className="mb-2.5 border-b border-line-soft pb-2 text-left text-[15px] font-semibold text-navy">
              {t('detailsTitle')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tCommon('code')} value={request.friendlyCode} />
              <Field
                label={tCommon('status')}
                value={tStatus(request.status)}
              />
              <Field
                label={t('estimatedBags')}
                value={request.estimatedBags}
              />
              <Field
                label={t('preferredWindow')}
                value={
                  request.preferredDate
                    ? [
                        new Date(
                          `${request.preferredDate.slice(0, 10)}T12:00:00`
                        ).toLocaleDateString('pt-PT'),
                        request.preferredInterval,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : undefined
                }
              />
              <Field label={tCommon('weightKg')} value={weight} />
              <Field
                label={tCommon('createdAt')}
                value={
                  request.createdAt
                    ? new Date(request.createdAt).toLocaleString('pt-PT')
                    : undefined
                }
              />
              <Field label={t('route')} value={request.route?.friendlyCode} />
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 border-b border-line-soft pb-2 text-left text-[15px] font-semibold text-navy">
              {t('clientSection')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tCommon('name')} value={fullName} />
              {request.company ? (
                <Field label={t('companyLabel')} value={request.company.name} />
              ) : null}
              <Field label={tCommon('email')} value={user?.email} />
              <Field label={t('phone')} value={user?.contactPhone} />
            </div>
          </section>

          <section>
            <h3 className="mb-2.5 border-b border-line-soft pb-2 text-left text-[15px] font-semibold text-navy">{tCommon('address')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('street')} value={streetLine(address?.street, address?.number) || undefined} />
              <Field label={t('complement')} value={address?.complement} />
              <Field label={t('zipCode')} value={formatZip(address?.zipCode) || undefined} />
              <Field label={tCommon('city')} value={address?.city} />
              <Field label={t('cityDivision')} value={address?.cityDivision} />
              <Field label={t('countryDivision')} value={address?.countryDivision} />
              <Field label={t('country')} value={address?.country} />
              {isTeam && (address?.lat != null || address?.long != null) && (
                <Field
                  label={t('coordinates')}
                  value={
                    address?.lat != null && address?.long != null
                      ? `${address.lat}, ${address.long}`
                      : undefined
                  }
                />
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
