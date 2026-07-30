import { useTranslations } from 'next-intl';
import { Address } from '@/app/types/collection-request';
import { UserDTO } from '@/app/types/user';

type CollectionRequestUserDataProps = {
  user?: UserDTO;
  address?: Address;
};

export default function CollectionRequestUserData({
  user,
  address,
}: CollectionRequestUserDataProps) {
  const t = useTranslations('triage');
  const tCommon = useTranslations('common');
  const fullName =
    user && `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const fullAddress = address
    ? [
        `${address.street ?? ''} ${address.number ?? ''}`.trim(),
        address.complement,
        [address.zipCode, address.city].filter(Boolean).join(' '),
        address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          {t('userDataSection')}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            {t('fullName')}
          </p>
          <p className="text-sm font-medium text-secondary">
            {fullName || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Email
          </p>
          <p className="text-sm font-medium text-secondary">
            {user?.email || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Telefone
          </p>
          <p className="text-sm font-medium text-secondary">
            {user?.contactPhone || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4 sm:col-span-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            {tCommon('address')}
          </p>
          <p className="text-sm font-medium text-secondary">
            {fullAddress || '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
