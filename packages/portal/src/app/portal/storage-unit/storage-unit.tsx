'use client';
import { useTranslations } from 'next-intl';
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
  StorageUnitDTO,
} from '../../types/storage-unit';
import StorageUnitForm from './storage-unit-form';

// Constants
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function StorageUnit() {
  const t = useTranslations('storageUnit');
  const tCommon = useTranslations('common');
  const tQuality = useTranslations('enums.quality');
  const tSex = useTranslations('enums.sex');
  const tAgeGroup = useTranslations('enums.ageGroup');
  const tItemType = useTranslations('enums.itemType');
  const tSeason = useTranslations('enums.season');
  const tUnitStatus = useTranslations('enums.unitStatus');
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
        if (res.status !== 200) throw new Error(t('deleteError'));
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
        success: () => t('deactivateSuccess'),
        error: () => t('deactivateError'),
      });
    },
    [handleDeleteUnit]
  );

  const handlePrintLabel = useCallback((unit: StorageUnitDTO) => {
    const printWindow = window.open('', '_blank', 'width=420,height=640');
    if (!printWindow) {
      toast.error(t('popupBlocked'));
      return;
    }

    const unitId = escapeHtml(unit.id);
    const friendlyCode = escapeHtml(unit.friendlyCode ?? '-');
    const quality = escapeHtml(tQuality(unit.quality));
    const sex = escapeHtml(tSex(unit.sex));
    const ageGroup = escapeHtml(tAgeGroup(unit.ageGroup));
    const type = escapeHtml(tItemType(unit.type));
    const season = escapeHtml(tSeason(unit.season));
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
            .bag {
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
            <h1 class="title">${t('itemLabel')}</h1>
            <p class="code">${friendlyCode}</p>
            <img class="bag" src="${qrSource}" alt="QR Code ${unitId}" />
            <p class="text"><strong>${t('codeWithColon')}</strong> ${friendlyCode}</p>
            <p class="text"><strong>${t('qualityWithColon')}</strong> ${quality}</p>
            <p class="text"><strong>${t('sexWithColon')}</strong> ${sex}</p>
            <p class="text"><strong>${t('ageGroupWithColon')}</strong> ${ageGroup}</p>
            <p class="text"><strong>${t('partWithColon')}</strong> ${type}</p>
            <p class="text"><strong>${t('seasonWithColon')}</strong> ${season}</p>
          </div>
          <script>
            (function () {
              // Os QR codes vêm de um serviço externo: se imprimirmos no
              // onload a caixa de impressão pode abrir antes de eles chegarem.
              var pending = [].slice.call(document.images).filter(function (img) {
                return !img.complete;
              });
              if (!pending.length) return window.print();

              var left = pending.length;
              var go = function () {
                if (left > 0 && --left === 0) window.print();
              };
              pending.forEach(function (img) {
                img.addEventListener('load', go);
                img.addEventListener('error', go);
              });

              // Rede lenta ou imagem em falta: imprime na mesma ao fim de 5s.
              setTimeout(function () {
                if (left > 0) { left = 0; window.print(); }
              }, 5000);
            })();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/storage-unit' }]);
    fetchStorageUnits();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle, fetchStorageUnits, t]);

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
              <TableHead>{tCommon('code')}</TableHead>
              <TableHead>{tCommon('quality')}</TableHead>
              <TableHead>{tCommon('sex')}</TableHead>
              <TableHead>{tCommon('ageGroup')}</TableHead>
              <TableHead>{tCommon('part')}</TableHead>
              <TableHead>{tCommon('season')}</TableHead>
              <TableHead>{t('weightKg')}</TableHead>
              <TableHead>{t('itemCount')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead>{tCommon('action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storageUnits?.length > 0 ? (
              storageUnits.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell className="font-medium">
                    {storageUnit.friendlyCode ?? '-'}
                  </TableCell>
                  <TableCell>{tQuality(storageUnit.quality)}</TableCell>
                  <TableCell>{tSex(storageUnit.sex)}</TableCell>
                  <TableCell>{tAgeGroup(storageUnit.ageGroup)}</TableCell>
                  <TableCell>{tItemType(storageUnit.type)}</TableCell>
                  <TableCell>{tSeason(storageUnit.season)}</TableCell>
                  <TableCell>{Number(storageUnit.weight ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{storageUnit.itemsCount ?? 0}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        storageUnit.status === 'ATIVO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {tUnitStatus(storageUnit.status)}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handlePrintLabel(storageUnit)}
                      title={t('printLabel')}
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
                  colSpan={10}
                  className="text-center py-6 text-muted-foreground"
                >
                  {tCommon('noRecords')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
