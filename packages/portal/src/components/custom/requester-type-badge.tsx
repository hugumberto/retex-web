'use client';

import { CompanyDTO } from '@/app/types/company';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface RequesterTypeBadgeProps {
  companyId?: string | null;
  company?: CompanyDTO | null;
}

/**
 * Marca as solicitações de empresa na listagem e na construção de rotas.
 *
 * Só aparece para empresas — um crachá em cada linha de particular seria ruído,
 * já que são a maioria. Mostra o nome da empresa quando a API o traz, que é o
 * que a operação precisa para agrupar recolhas do mesmo cliente.
 */
export default function RequesterTypeBadge({
  companyId,
  company,
}: RequesterTypeBadgeProps) {
  const t = useTranslations('company');

  if (!companyId && !company) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className="ml-1 gap-1 border-[#02748E] bg-[#E6F2F5] text-[#02748E] font-medium"
      title={company?.name ?? t('badgeTitle')}
    >
      <Building2 className="h-3 w-3" aria-hidden />
      {company?.name ?? t('badgeLabel')}
    </Badge>
  );
}
