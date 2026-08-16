'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value || '-'}</span>
    </div>
  );
}

export default function MyCompany() {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('enums.companyProfile');
  const tPermission = useTranslations('enums.companyPermission');
  const { companyContext, companyContextLoaded, setPageTitle, setBreadcrumbs } =
    useAppStore();

  useEffect(() => {
    setPageTitle(t('myCompanyTitle'));
    setBreadcrumbs([
      { label: t('myCompanyTitle'), href: '/portal/my-company' },
    ]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle, t]);

  if (!companyContextLoaded) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  // O guard já impede lá chegar sem contexto; isto cobre o caso de o membro ser
  // desativado com a sessão aberta.
  if (!companyContext) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {t('noCompanyContext')}
      </p>
    );
  }

  const { company, profile, permissions } = companyContext;

  return (
    <section id="my-company-page" className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-secondary">{company.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={t('legalName')} value={company.legalName} />
          <Field label={t('taxId')} value={company.taxId} />
          <Field label={tCommon('code')} value={company.friendlyCode} />
          <Field label={tCommon('email')} value={company.email} />
          <Field label={t('phone')} value={company.phone} />
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('status')}
            </span>
            <Badge
              variant={company.status === 'ACTIVE' ? 'default' : 'outline'}
              className="w-fit"
            >
              {company.status === 'ACTIVE'
                ? tCommon('active')
                : tCommon('inactive')}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-secondary text-base">
            {t('myProfile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field
            label={t('profile')}
            value={profile.companyId ? profile.name : tProfile(profile.key)}
          />
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('permissions')}
            </span>
            <div className="flex flex-wrap gap-2">
              {permissions.length > 0 ? (
                permissions.map((permission) => (
                  <Badge key={permission} variant="outline">
                    {tPermission(permission)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t('readOnlyHint')}</p>
    </section>
  );
}
