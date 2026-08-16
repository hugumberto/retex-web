'use client';

import { CompanyAddressDTO, CompanyPermission } from '@/app/types/company';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddressForm from './address-form';

export default function MyCompanyAddresses() {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const { companyContext, setPageTitle, setBreadcrumbs } = useAppStore();
  const [addresses, setAddresses] = useState<CompanyAddressDTO[]>([]);

  // Ler moradas é de qualquer membro; criar exige ADDRESS_MANAGE. Esconder o
  // botão evita um 403 que o utilizador não conseguiria explicar.
  const canManage = !!companyContext?.permissions.includes(
    CompanyPermission.ADDRESS_MANAGE
  );

  const fetchAddresses = useCallback(async () => {
    try {
      const { data, status } = await api.get<CompanyAddressDTO[]>(
        '/company/me/addresses'
      );
      if (!isSuccessStatus(status)) throw new Error();
      setAddresses(data ?? []);
    } catch {
      toast.error(t('addressLoadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('addresses'));
    setBreadcrumbs([
      { label: t('myCompanyTitle'), href: '/portal/my-company' },
      { label: t('addresses'), href: '/portal/my-company/addresses' },
    ]);
    fetchAddresses();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchAddresses, setBreadcrumbs, setPageTitle, t]);

  return (
    <section id="my-company-addresses-page" className="flex flex-col gap-4">
      {canManage && (
        <div className="flex justify-end">
          <AddressForm onSaved={fetchAddresses} />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon('address')}</TableHead>
            <TableHead>{tCommon('city')}</TableHead>
            <TableHead>{t('zipCode')}</TableHead>
            <TableHead>{t('serviceZone')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <TableRow key={address.id}>
                <TableCell>
                  {[address.street, address.number, address.complement]
                    .filter(Boolean)
                    .join(', ')}
                </TableCell>
                <TableCell>{address.city}</TableCell>
                <TableCell>{address.zipCode}</TableCell>
                <TableCell>
                  <Badge variant={address.isInServiceZone ? 'default' : 'outline'}>
                    {address.isInServiceZone
                      ? t('inServiceZone')
                      : t('outOfServiceZone')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-6 text-muted-foreground"
              >
                {t('noAddresses')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
