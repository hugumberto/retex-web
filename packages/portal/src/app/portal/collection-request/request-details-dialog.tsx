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

type Props = {
  request: CollectionRequestDTO;
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-secondary break-words">
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
          <DialogTitle className="text-secondary">
            Solicitação {request.friendlyCode ?? ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-secondary">
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
              <Field label={tCommon('weightKg')} value={request.weight} />
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
            <h3 className="mb-2 text-sm font-semibold text-secondary">
              Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tCommon('name')} value={fullName} />
              <Field label={tCommon('email')} value={user?.email} />
              <Field label={t('phone')} value={user?.contactPhone} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-secondary">{tCommon('address')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('street')} value={address?.street} />
              <Field label={t('number')} value={address?.number} />
              <Field label={t('complement')} value={address?.complement} />
              <Field label={t('zipCode')} value={address?.zipCode} />
              <Field label={tCommon('city')} value={address?.city} />
              <Field label={t('cityDivision')} value={address?.cityDivision} />
              <Field label={t('countryDivision')} value={address?.countryDivision} />
              <Field label={t('country')} value={address?.country} />
              {(address?.lat != null || address?.long != null) && (
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
