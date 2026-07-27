'use client';

import { QrCodeDTO } from '@/app/types/qr-code';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAppStore } from '@/store';
import { Link2Off, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type CollectionRequestInfo = {
  id: string;
  friendlyCode?: string;
  status: string;
  estimatedVolumes?: number;
  qrCodesGenerated?: number;
};

type CollectionRequestVolumesResponse = {
  collectionRequest: CollectionRequestInfo;
  volumes: QrCodeDTO[];
};

export default function Volumes() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [code, setCode] = useState('');
  const [pkg, setPkg] = useState<CollectionRequestInfo | null>(null);
  const [volumes, setVolumes] = useState<QrCodeDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setPageTitle('Volumes do Pacote');
    setBreadcrumbs([{ label: 'Volumes do Pacote', href: '/portal/volumes' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs]);

  const search = async (value: string) => {
    const target = value.trim();
    if (!target) return;
    setIsLoading(true);
    try {
      const { data, status } = await api.get<CollectionRequestVolumesResponse>(
        `/qr-code/collection-request/${target}`
      );
      if (!isSuccessStatus(status)) throw new Error();
      setPkg(data.collectionRequest);
      setVolumes(data.volumes ?? []);
    } catch (error) {
      const httpStatus = (error as { response?: { status?: number } })?.response
        ?.status;
      setPkg(null);
      setVolumes([]);
      toast.error(
        httpStatus === 404
          ? 'Nenhuma solicitação encontrada para o código'
          : 'Não foi possível carregar os volumes'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    if (pkg?.friendlyCode || pkg?.id) {
      await search(pkg.friendlyCode ?? pkg.id);
    }
  };

  const handleUnassign = async (volume: QrCodeDTO) => {
    setBusyId(volume.id);
    try {
      const res = await api.patch(`/qr-code/${volume.id}/unassign`);
      if (!isSuccessStatus(res.status)) throw new Error();
      toast.success('Volume desassociado do pacote');
      await refresh();
    } catch {
      toast.error('Não foi possível desassociar o volume');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (volume: QrCodeDTO) => {
    setBusyId(volume.id);
    try {
      const res = await api.delete(`/qr-code/${volume.id}`);
      if (!isSuccessStatus(res.status)) throw new Error();
      toast.success('Volume eliminado');
      await refresh();
    } catch {
      toast.error('Não foi possível eliminar o volume');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <label className="mb-1 block text-sm font-medium text-secondary">
          Código da solicitação (ou UUID)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                search(code);
              }
            }}
            placeholder="ex.: 2026-MCLPCM"
            className="max-w-xs"
          />
          <Button
            variant="secondary"
            onClick={() => search(code)}
            disabled={isLoading}
          >
            Procurar
          </Button>
        </div>
      </div>

      {pkg && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-secondary">
              {pkg.friendlyCode ?? pkg.id}
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-secondary">
              <span>
                Estado:{' '}
                <strong>
                  {STATUS_LABEL[pkg.status as CollectionRequestStatus] ?? pkg.status}
                </strong>
              </span>
              <span>
                Volumes recolhidos: <strong>{pkg.qrCodesGenerated ?? 0}</strong>
              </span>
              {pkg.estimatedVolumes != null && (
                <span>
                  Estimados: <strong>{pkg.estimatedVolumes}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Recolhido</TableHead>
                  <TableHead>Processado</TableHead>
                  <TableHead>Peso (kg)</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {volumes.length > 0 ? (
                  volumes.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">
                        {v.friendlyCode}
                      </TableCell>
                      <TableCell>{v.usedAt ? 'Sim' : 'Não'}</TableCell>
                      <TableCell>{v.processedAt ? 'Sim' : 'Não'}</TableCell>
                      <TableCell>
                        {v.weight != null
                          ? Number(v.weight).toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell className="space-x-2">
                        <ConfirmDialog
                          title="Desassociar volume"
                          description="O volume será desvinculado deste pacote (volta ao pool da rota). Continuar?"
                          confirmText="Desassociar"
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="Desassociar do pacote"
                              disabled={busyId === v.id}
                            >
                              <Link2Off className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleUnassign(v)}
                        />
                        <ConfirmDialog
                          title="Eliminar volume"
                          description="O volume será eliminado. Esta ação atualiza o nº de volumes recolhidos do pacote."
                          confirmText="Eliminar"
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-600 hover:text-red-700"
                              title="Eliminar volume"
                              disabled={busyId === v.id}
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          }
                          onConfirm={() => handleDelete(v)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Nenhum volume associado a esta solicitação
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
