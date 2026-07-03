'use client';

import { InputForm } from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { PrinterIcon } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { QrCodeDTO } from '../../types/qr-code';

interface QrCodeFormData {
  quantity: number;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function QrCode() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [results, setResults] = useState<QrCodeDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QrCodeFormData>({
    defaultValues: { quantity: 1 },
  });

  useEffect(() => {
    setPageTitle('QR Codes');
    setBreadcrumbs([{ label: 'QR Codes', href: '/portal/qr-code' }]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setPageTitle, setBreadcrumbs]);

  const handleGenerate = useCallback(async (data: QrCodeFormData) => {
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<QrCodeDTO[]>('/qr-code/generate', { quantity });
      if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
      setResults(res.data);
      toast.success(`${res.data.length} QR codes gerados`);
    } catch (error) {
      console.error('Erro ao gerar QR codes:', error);
      toast.error('Não foi possível gerar os QR codes');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handlePrint = useCallback(() => {
    if (!results.length || !gridRef.current) return;

    const canvases = Array.from(
      gridRef.current.querySelectorAll('canvas')
    ) as HTMLCanvasElement[];

    const cells = results
      .map((item, index) => {
        const dataUrl = canvases[index]?.toDataURL('image/png') ?? '';
        return `
          <div class="cell">
            <img class="qr" src="${dataUrl}" alt="QR ${escapeHtml(
              item.friendlyCode
            )}" />
            <p class="code">${escapeHtml(item.friendlyCode)}</p>
          </div>`;
      })
      .join('');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Permita pop-ups para imprimir as etiquetas');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Codes</title>
          <style>
            body { margin: 0; padding: 24px; font-family: Arial, sans-serif; color: #013364; }
            .grid { display: flex; flex-wrap: wrap; gap: 16px; }
            .cell {
              border: 1px solid #02748e; border-radius: 10px; padding: 12px;
              width: 160px; text-align: center; page-break-inside: avoid;
            }
            .qr { width: 130px; height: 130px; display: block; margin: 0 auto 8px; }
            .code { margin: 0; font-size: 14px; font-weight: 700; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="grid">${cells}</div>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [results]);

  return (
    <section id="qr-code-page" className="flex flex-col gap-6">
      <form
        onSubmit={handleSubmit(handleGenerate)}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="w-40">
          <InputForm
            label="Quantidade"
            name="quantity"
            type="number"
            control={control}
            rules={{
              required: 'A quantidade é obrigatória',
              min: { value: 1, message: 'Mínimo de 1' },
              max: { value: 500, message: 'Máximo de 500' },
            }}
            errors={errors}
          />
        </div>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? 'A gerar...' : 'Gerar'}
        </Button>
        {results.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <PrinterIcon className="size-4" />
            Imprimir
          </Button>
        )}
      </form>

      {results.length > 0 && (
        <div
          ref={gridRef}
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        >
          {results.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center gap-2 rounded-lg border border-secondary/25 p-3"
            >
              <QRCodeCanvas value={item.token} size={120} />
              <span className="text-sm font-semibold tracking-wide text-secondary">
                {item.friendlyCode}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
