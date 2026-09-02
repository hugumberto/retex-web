'use client';

import {
  CompanyMemberDTO,
  CompanyMemberStatus,
  CompanyProfileDTO,
} from '@/app/types/company';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { PencilIcon, UserCheck, UserX } from 'lucide-react';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import MemberForm from './member-form';

type MemberTableProps = {
  members: CompanyMemberDTO[];
  profiles: CompanyProfileDTO[];
  /** `/company/me` (gestor) ou `/company/:id` (admin). */
  basePath: string;
  canManage: boolean;
  /** Id do utilizador autenticado, para não se poder desativar a si próprio. */
  currentUserId?: string;
  onChanged: () => void;
};

export default function MemberTable({
  members,
  profiles,
  basePath,
  canManage,
  currentUserId,
  onChanged,
}: MemberTableProps) {
  const t = useTranslations('company');
  const tCommon = useTranslations('common');
  const tProfile = useTranslations('enums.companyProfile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pagination = usePagination(members);

  const profileLabel = (profile?: CompanyProfileDTO) => {
    if (!profile) return '-';
    return profile.companyId ? profile.name : tProfile(profile.key);
  };

  const handleToggleStatus = useCallback(
    async (member: CompanyMemberDTO) => {
      const nextStatus =
        member.status === CompanyMemberStatus.ACTIVE
          ? CompanyMemberStatus.INACTIVE
          : CompanyMemberStatus.ACTIVE;

      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.patch(`${basePath}/members/${member.id}`, {
              status: nextStatus,
            });
            if (!isSuccessStatus(res.status)) {
              throw new Error('Erro na requisição');
            }
          })(),
          {
            loading: tCommon('loading'),
            success: () => {
              onChanged();
              return nextStatus === CompanyMemberStatus.ACTIVE
                ? t('memberActivateSuccess')
                : t('memberDeactivateSuccess');
            },
            error: t('memberUpdateError'),
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [basePath, onChanged, t, tCommon]
  );

  const columnCount = canManage ? 5 : 4;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon('name')}</TableHead>
            <TableHead>{tCommon('email')}</TableHead>
            <TableHead>{t('profile')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            {canManage && <TableHead>{tCommon('action')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.items.length > 0 ? (
            pagination.items.map((member) => {
              const isActive = member.status === CompanyMemberStatus.ACTIVE;
              // A API só valida que o membro é da mesma empresa, por isso nada
              // impediria um gestor de se auto-suspender e ficar sem acesso.
              const isSelf = !!currentUserId && member.userId === currentUserId;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    {`${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim() ||
                      '-'}
                  </TableCell>
                  <TableCell>{member.user?.email ?? '-'}</TableCell>
                  <TableCell>{profileLabel(member.profile)}</TableCell>
                  <TableCell>
                    <Badge variant={isActive ? 'default' : 'outline'}>
                      {isActive ? tCommon('active') : tCommon('inactive')}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="space-x-2">
                      <MemberForm
                        basePath={basePath}
                        profiles={profiles}
                        member={member}
                        onSaved={onChanged}
                        trigger={
                          <Button variant="ghost" size="icon" className="size-8">
                            <PencilIcon className="size-4" />
                          </Button>
                        }
                      />
                      {!isSelf && (
                        <ConfirmDialog
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={isSubmitting}
                            >
                              {isActive ? (
                                <UserX className="size-4" />
                              ) : (
                                <UserCheck className="size-4" />
                              )}
                            </Button>
                          }
                          title={
                            isActive ? t('deactivateMember') : t('activateMember')
                          }
                          description={
                            isActive
                              ? t('deactivateMemberHint')
                              : t('activateMemberHint')
                          }
                          onConfirm={() => handleToggleStatus(member)}
                        />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnCount}
                className="text-center py-6 text-muted-foreground"
              >
                {t('noMembers')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination pagination={pagination} />
    </>
  );
}
