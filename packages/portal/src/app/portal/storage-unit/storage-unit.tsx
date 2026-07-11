'use client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PrinterIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import ConfirmDialog from '@/components/custom/confirmation-dialog';
import api from '@/lib/api';
import { useAppStore } from '@/store';
import {
  AgeGroup,
  Quality,
  Season,
  Sex,
  StorageUnitDTO,
  Type,
} from '../../types/storage-unit';
import StorageUnitForm from './storage-unit-form';

// Constants
const QUALITY_MAP: Record<Quality, string> = {
  [Quality.GOOD]: 'Bom',
  [Quality.MEDIUM]: 'Regular',
  [Quality.BAD]: 'Mau',
};

const SEX_MAP: Record<Sex, string> = {
  [Sex.MALE]: 'Homem',
  [Sex.FEMALE]: 'Mulher',
};

const AGE_GROUP_MAP: Record<AgeGroup, string> = {
  [AgeGroup.ADULT]: 'Adulto',
  [AgeGroup.CHILD]: 'Infantil',
};

const TYPE_MAP: Record<Type, string> = {
  [Type.UPPER_PART]: 'Superior',
  [Type.UNDER_PART]: 'Inferior',
};

const SEASON_MAP: Record<Season, string> = {
  [Season.SUMMER]: 'Verão',
  [Season.WINTER]: 'Inverno',
};

const STATUS_MAP: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function StorageUnit() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [storageUnits, setStorageUnits] = useState<StorageUnitDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStorageUnits = useCallback(async () => {
    try {
      const { data } = await api.get<StorageUnitDTO[]>('/storage-unit');
      setStorageUnits(data);
    } catch (error) {
      console.error('Failed to fetch storage units', error);
    }
  }, []);

  const handleDeleteUnit = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.delete(`/storage-unit/${id}`);
        if (res.status !== 200) throw new Error('Erro ao eliminar unidade');
        await fetchStorageUnits();
      } catch (error) {
        console.error('Erro ao eliminar unidade:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchStorageUnits]
  );

  const handleDeleteWithToast = useCallback(
    async (id: string) => {
      await toast.promise(handleDeleteUnit(id), {
        loading: 'Carregando...',
        success: () => 'Unidade de Armazenamento desativada com sucesso',
        error: () => 'Erro ao desativar a Unidade de Armazenamento',
      });
    },
    [handleDeleteUnit]
  );

  const handlePrintLabel = useCallback((unit: StorageUnitDTO) => {
    const printWindow = window.open('', '_blank', 'width=420,height=640');
    if (!printWindow) {
      toast.error('Permita pop-ups para imprimir a etiqueta');
      return;
    }

    const unitId = escapeHtml(unit.id);
    const friendlyCode = escapeHtml(unit.friendlyCode ?? '-');
    const quality = escapeHtml(QUALITY_MAP[unit.quality]);
    const sex = escapeHtml(SEX_MAP[unit.sex]);
    const ageGroup = escapeHtml(AGE_GROUP_MAP[unit.ageGroup]);
    const type = escapeHtml(TYPE_MAP[unit.type]);
    const season = escapeHtml(SEASON_MAP[unit.season]);
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      unit.id
    )}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta ${unitId}</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, sans-serif;
              color: #013364;
            }
            .label {
              border: 2px solid #02748e;
              border-radius: 12px;
              padding: 20px;
              width: 320px;
              margin: 0 auto;
              text-align: center;
            }
            .title {
              margin: 0 0 12px;
              font-size: 18px;
              font-weight: 700;
            }
            .qr {
              width: 220px;
              height: 220px;
              margin: 10px auto 16px;
              display: block;
            }
            .text {
              margin: 6px 0;
              font-size: 15px;
            }
            .code {
              margin: 0 0 12px;
              font-size: 22px;
              font-weight: 700;
              letter-spacing: 1px;
              color: #02748e;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <h1 class="title">Etiqueta do Item</h1>
            <p class="code">${friendlyCode}</p>
            <img class="qr" src="${qrSource}" alt="QR Code ${unitId}" />
            <p class="text"><strong>Código:</strong> ${friendlyCode}</p>
            <p class="text"><strong>Qualidade:</strong> ${quality}</p>
            <p class="text"><strong>Sexo:</strong> ${sex}</p>
            <p class="text"><strong>Faixa etária:</strong> ${ageGroup}</p>
            <p class="text"><strong>Parte:</strong> ${type}</p>
            <p class="text"><strong>Estação:</strong> ${season}</p>
          </div>
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  useEffect(() => {
    setPageTitle('Armazenamento');
    setBreadcrumbs([{ label: 'Armazenamento', href: '/portal/storage-unit' }]);
    fetchStorageUnits();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle, fetchStorageUnits]);

  const handleSave = useCallback(async () => {
    await fetchStorageUnits();
  }, [fetchStorageUnits]);

  return (
    <section id="storage-unit-page" className="flex flex-col items-center">
      <StorageUnitForm onSave={handleSave} />
      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Faixa etária</TableHead>
              <TableHead>Parte</TableHead>
              <TableHead>Estação</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storageUnits?.length > 0 ? (
              storageUnits.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell className="font-medium">
                    {storageUnit.friendlyCode ?? '-'}
                  </TableCell>
                  <TableCell>{QUALITY_MAP[storageUnit.quality]}</TableCell>
                  <TableCell>{SEX_MAP[storageUnit.sex]}</TableCell>
                  <TableCell>{AGE_GROUP_MAP[storageUnit.ageGroup]}</TableCell>
                  <TableCell>{TYPE_MAP[storageUnit.type]}</TableCell>
                  <TableCell>{SEASON_MAP[storageUnit.season]}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        storageUnit.status === 'ATIVO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {STATUS_MAP[storageUnit.status]}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handlePrintLabel(storageUnit)}
                      title="Imprimir etiqueta"
                    >
                      <PrinterIcon />
                    </Button>
                    <StorageUnitForm
                      storageUnitId={storageUnit.id}
                      initialData={storageUnit}
                      onSave={handleSave}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          className="size-8"
                        >
                          <TrashIcon />
                        </Button>
                      }
                      onConfirm={() => handleDeleteWithToast(storageUnit.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-6 text-muted-foreground"
                >
                  Nenhum registro encontrado!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
