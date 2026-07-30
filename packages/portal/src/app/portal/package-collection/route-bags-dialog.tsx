'use client';

import { useTranslations } from 'next-intl';
import { CollectionRequestBagDTO } from '@/app/types/collection-request-bag';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CollectionRequestStatus } from '@/app/types/collection-request';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type RouteCollectionRequestBags = {
  collectionRequest: {
    id: string;
    friendlyCode?: string | null;
    status: string;
    clientName: string;
    estimatedBags?: number;
  };
  bags: CollectionRequestBagDTO[];
};

type Props = {
  routeId: string;
  routeCode?: string | null;
};

export default function RouteBagsDialog({ routeId, routeCode }: Props) {
  const t = useTranslations('packageCollection');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RouteCollectionRequestBags[]>([]);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next) {
      setIsLoading(true);
      try {
        const res = await api.get<RouteCollectionRequestBags[]>(
          `/route/${routeId}/collection-request-bags`
        );
        if (!isSuccessStatus(res.status)) throw new Error();
        setData(res.data ?? []);
      } catch {
        toast.error(t('bagsLoadError'));
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title={t('viewBagsTooltip')}
        >
          <SearchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-3xl max-h-[85vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-secondary">
            Pacotes da recolha {routeCode ?? ''}
          </DialogTitle>
          <DialogDescription>
            {t('bagsDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {tCommon('loading')}
          </p>
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t('noRequestsInRoute')}
          </p>
        ) : (
          <div className="space-y-6">
            {data.map((entry) => (
              <div
                key={entry.collectionRequest.id}
                className="rounded-xl border border-secondary/30 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-secondary">
                    {entry.collectionRequest.friendlyCode ?? entry.collectionRequest.id}
                    {entry.collectionRequest.clientName
                      ? ` — ${entry.collectionRequest.clientName}`
                      : ''}
                  </h3>
                  <div className="flex flex-wrap gap-3 text-xs text-secondary">
                    <span>
                      Estado:{' '}
                      <strong>
                        {tStatus(entry.collectionRequest.status as CollectionRequestStatus) ??
                          entry.collectionRequest.status}
                      </strong>
                    </span>
                    <span>
                      Sacos: <strong>{entry.bags.length}</strong>
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('bagCode')}</TableHead>
                        <TableHead>{tCommon('collected')}</TableHead>
                        <TableHead>{tCommon('processed')}</TableHead>
                        <TableHead>{tCommon('weightKg')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.bags.length > 0 ? (
                        entry.bags.map((bag) => (
                          <TableRow key={bag.id}>
                            <TableCell className="font-medium">
                              {bag.friendlyCode}
                            </TableCell>
                            <TableCell>{bag.usedAt ? tCommon('yes') : tCommon('no')}</TableCell>
                            <TableCell>
                              {bag.processedAt ? tCommon('yes') : tCommon('no')}
                            </TableCell>
                            <TableCell>
                              {bag.weight != null
                                ? Number(bag.weight).toFixed(2)
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-4 text-center text-muted-foreground"
                          >
                            {t('noBagsBound')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
