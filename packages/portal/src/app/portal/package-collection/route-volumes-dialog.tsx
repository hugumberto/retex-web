'use client';

import { QrCodeDTO } from '@/app/types/qr-code';
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
import { STATUS_LABEL } from '@/lib/collection-request-status';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type RouteCollectionRequestVolumes = {
  collectionRequest: {
    id: string;
    friendlyCode?: string | null;
    status: string;
    clientName: string;
    estimatedVolumes?: number;
  };
  qrCodes: QrCodeDTO[];
};

type Props = {
  routeId: string;
  routeCode?: string | null;
};

export default function RouteVolumesDialog({ routeId, routeCode }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RouteCollectionRequestVolumes[]>([]);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next) {
      setIsLoading(true);
      try {
        const res = await api.get<RouteCollectionRequestVolumes[]>(
          `/route/${routeId}/collection-request-volumes`
        );
        if (!isSuccessStatus(res.status)) throw new Error();
        setData(res.data ?? []);
      } catch {
        toast.error('Não foi possível carregar os pacotes da recolha');
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
          title="Ver pacotes e volumes"
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
            Pacotes desta recolha e os volumes (QR codes) vinculados a cada um.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            A carregar...
          </p>
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum pacote nesta recolha
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
                        {STATUS_LABEL[entry.collectionRequest.status as CollectionRequestStatus] ??
                          entry.collectionRequest.status}
                      </strong>
                    </span>
                    <span>
                      Volumes: <strong>{entry.qrCodes.length}</strong>
                    </span>
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código do volume</TableHead>
                        <TableHead>Recolhido</TableHead>
                        <TableHead>Processado</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.qrCodes.length > 0 ? (
                        entry.qrCodes.map((qr) => (
                          <TableRow key={qr.id}>
                            <TableCell className="font-medium">
                              {qr.friendlyCode}
                            </TableCell>
                            <TableCell>{qr.usedAt ? 'Sim' : 'Não'}</TableCell>
                            <TableCell>
                              {qr.processedAt ? 'Sim' : 'Não'}
                            </TableCell>
                            <TableCell>
                              {qr.weight != null
                                ? Number(qr.weight).toFixed(2)
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
                            Sem volumes vinculados
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
