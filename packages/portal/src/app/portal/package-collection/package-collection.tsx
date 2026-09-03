'use client';

import { useTranslations } from 'next-intl';
import {
  PackageCollectionDTO,
  CollectionStatus,
  PackageCollectionTableDTO,
} from '@/app/types/package-collection';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
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
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useAppStore } from '@/store';
import {
  CheckCircle2Icon,
  ChevronsRightIcon,
  MailIcon,
  PrinterIcon,
  QrCodeIcon,
  TrashIcon,
} from 'lucide-react';
import { CollectionRequestBagDTO } from '@/app/types/collection-request-bag';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PaginatedResult } from '../../types/helper';
import PackageCollectionForm from './package-collection-form';
import RouteBagsDialog from './route-bags-dialog';

// Próximo estado no ciclo da rota. DRAFTING→CREATED tem botão próprio
// ("Confirmar recolha", que dispara os emails); FINISHED é terminal.
const NEXT_STATUS: Partial<Record<CollectionStatus, CollectionStatus>> = {
  [CollectionStatus.CREATED]: CollectionStatus.WAITING_TO_START,
  [CollectionStatus.WAITING_TO_START]: CollectionStatus.IN_TRANSIT,
  [CollectionStatus.IN_TRANSIT]: CollectionStatus.FINISHED,
};

// A API pagina a 10 por omissão e este ecrã não tem paginação: pedimos o máximo
// permitido por página (o DTO limita a 100) e seguimos as páginas seguintes, para
// a listagem ser mesmo toda. O teto de páginas é só uma salvaguarda.
const PAGE_LIMIT = 100;
const MAX_PAGES = 20;

const ALL_STATUSES = 'ALL';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function PackageCollection() {
  const t = useTranslations('packageCollection');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionStatus');
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageCollections, setPackageCollections] = useState<
    PackageCollectionTableDTO[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<
    CollectionStatus | typeof ALL_STATUSES
  >(ALL_STATUSES);

  // Filtro do lado do cliente: a lista já vem toda, e assim trocar de estado é
  // imediato e não gasta um pedido — o mesmo que o ecrã de Utilizadores faz.
  const filteredCollections = useMemo(
    () =>
      packageCollections.filter(
        (collection) =>
          statusFilter === ALL_STATUSES || collection.status === statusFilter
      ),
    [packageCollections, statusFilter]
  );

  const pagination = usePagination(filteredCollections, statusFilter);

  const fetchData = async () => {
    const collected: PackageCollectionTableDTO[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const { data } = await api.get<PaginatedResult<PackageCollectionTableDTO>>(
        `/route?page=${page}&limit=${PAGE_LIMIT}`
      );
      collected.push(...data.data);
      totalPages = data.meta?.totalPages ?? 1;
      page += 1;
    } while (page <= totalPages && page <= MAX_PAGES);

    setPackageCollections(collected);
  };

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([
      { label: t('pageTitle'), href: '/portal/package-collection' },
    ]);
    fetchData();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle]);

  const onSave = async () => {
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/route/${id}`);
      if (res.status !== 200) throw new Error('Erro na requisição');
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCreated = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.put(`/route/${id}`, {
        status: CollectionStatus.CREATED,
      });
      if (res.status !== 200) throw new Error('Erro na requisição');
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (id: string, next: CollectionStatus) => {
    setIsSubmitting(true);
    try {
      const res = await api.put(`/route/${id}`, { status: next });
      if (res.status !== 200) throw new Error('Erro na requisição');
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Disparo manual do questionário de satisfação aos clientes da recolha
  // (apenas quando a recolha está FINISHED).
  const handleDispatchSurvey = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/route/${id}/send-survey`);
      if (res.status < 200 || res.status >= 300) {
        throw new Error('Erro na requisição');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintQrCodes = async (id: string) => {
    const { data, status } = await api.get<CollectionRequestBagDTO[]>(
      `/route/${id}/bags`
    );
    if (status !== 200) {
      throw new Error(t('qrFetchError'));
    }
    if (!data.length) {
      throw new Error(t('noQrCodes'));
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=900');
    if (!printWindow) {
      throw new Error(t('popupBlocked'));
    }

    // A impressora usa etiquetas de 60x40mm (paisagem): um QR code por página/etiqueta.
    const labels = data
      .map((bag) => {
        const code = escapeHtml(bag.friendlyCode);
        const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(
          bag.token
        )}`;
        return `<div class="label"><img src="${qrSource}" alt="QR ${code}" /><div class="code">${code}</div></div>`;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('qrCodesTitle')}</title>
          <style>
            @page { size: 60mm 40mm; margin: 0; }
            html, body { margin:0; padding:0; font-family: Arial, sans-serif; color:#013364; }
            .label {
              width: 60mm;
              height: 40mm;
              box-sizing: border-box;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1.5mm;
              page-break-after: always;
              break-after: page;
            }
            .label:last-child { page-break-after: auto; break-after: auto; }
            /* 26mm de QR + o código cabem na altura útil (40mm menos 4mm de
               margem interna); em retrato o QR podia ser maior. */
            .label img { width: 26mm; height: 26mm; object-fit: contain; }
            .code { font-size: 13pt; font-weight:700; letter-spacing:1px; color:#02748e; text-align:center; }
            @media print { .label { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          ${labels}
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
  };

  const handlePrintRoute = async (id: string) => {
    const { data, status } = await api.get<PackageCollectionDTO>(
      `/route/${id}`
    );
    if (status !== 200) {
      throw new Error(t('printFetchError'));
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=900');
    if (!printWindow) {
      throw new Error(t('popupBlocked'));
    }

    const routeId = escapeHtml(data.id);
    const routeCode = escapeHtml(data.friendlyCode ?? '-');
    const driverName = escapeHtml(
      `${data.driver.firstName ?? ''} ${data.driver.lastName ?? ''}`.trim() ||
        '-'
    );
    const routeDate = new Date(data.startDate).toLocaleDateString('pt-PT');
    const safeDate = escapeHtml(routeDate);
    const logoSource = `${window.location.origin}/assets/logo.png`;
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
      data.id
    )}`;

    const rows = data.collectionRequests
      .map((pkg) => {
        const requester = escapeHtml(
          `${pkg.user.firstName ?? ''} ${pkg.user.lastName ?? ''}`.trim() || '-'
        );
        const address = escapeHtml(
          `${pkg.address?.street ?? ''}, ${pkg.address?.number ?? ''} ${
            pkg.address?.city ?? ''
          }`.trim() || '-'
        );
        const code = escapeHtml(pkg.friendlyCode ?? '-');
        // O motorista precisa de ligar ao cliente a partir desta folha, sem ter
        // de procurar a ficha individual mais à frente.
        const phone = escapeHtml(pkg.user.contactPhone ?? '-');

        return `<tr><td>${code}</td><td>${requester}</td><td>${phone}</td><td>${address}</td></tr>`;
      })
      .join('');

    const tableRows =
      rows ||
      `<tr><td colspan="4" style="text-align:center;color:#6b7280;">${t(
        'noRouteItems'
      )}</td></tr>`;

    const itemPages = data.collectionRequests
      .map((pkg, index) => {
        const itemId = escapeHtml(pkg.id);
        const itemCode = escapeHtml(pkg.friendlyCode ?? '-');
        const requesterName = escapeHtml(
          `${pkg.user.firstName ?? ''} ${pkg.user.lastName ?? ''}`.trim() || '-'
        );
        const requesterEmail = escapeHtml(pkg.user.email ?? '-');
        const requesterPhone = escapeHtml(pkg.user.contactPhone ?? '-');
        const fullAddress = escapeHtml(
          `${pkg.address?.street ?? ''}, ${pkg.address?.number ?? ''}${
            pkg.address?.complement ? `, ${pkg.address?.complement}` : ''
          }, ${pkg.address?.zipCode ?? ''} ${pkg.address?.city ?? ''}`
            .replace(/\s+,/g, ',')
            .trim() || '-'
        );
        const itemQrSource = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
          pkg.id
        )}`;

        return `
          <article class="sheet item-sheet page-break">
            <header class="item-header">
              <img class="logo small" src="${logoSource}" alt="Retex" />
              <div class="meta">
                <p><strong>${t('routeWithColon')}</strong> ${routeCode}</p>
                <p><strong>${t('itemWithColon')}</strong> ${itemCode}</p>
                <p><strong>${t('dateWithColon')}</strong> ${safeDate}</p>
                <p><strong>${t('page')}</strong> ${index + 2}</p>
              </div>
              <img class="bag" src="${itemQrSource}" alt="QR Item ${itemId}" />
            </header>

            <section class="content">
              <h2 class="table-title">${t('itemDetails')}</h2>
              <div class="detail-grid">
                <div class="detail-card">
                  <h3>${t('requesterData')}</h3>
                  <p><strong>${t('nameWithColon')}</strong> ${requesterName}</p>
                  <p><strong>${t(
                    'emailWithColon'
                  )}</strong> ${requesterEmail}</p>
                  <p><strong>${t(
                    'phoneWithColon'
                  )}</strong> ${requesterPhone}</p>
                </div>
                <div class="detail-card">
                  <h3>${t('pickupAddress')}</h3>
                  <p>${fullAddress}</p>
                </div>
              </div>

              <div class="outside-signature">
                <span>${t('customerSignature')}</span>
                <div class="signature-line"></div>
              </div>

              <div class="receipt-block">
                <div class="cut-line">
                  <span>${t('cutLine')}</span>
                </div>

                <section class="receipt">
                  <div class="receipt-header">${t('customerReceipt')}</div>
                  <div class="receipt-content">
                    <div class="receipt-body">
                      <p><strong>${t('itemCode')}</strong> ${itemCode}</p>
                      <p><strong>${t('routeCode')}</strong> ${routeCode}</p>
                      <p><strong>${t('dateWithColon')}</strong> ${safeDate}</p>
                      <p><strong>${t(
                        'driverWithColon'
                      )}</strong> ${driverName}</p>
                      <p><strong>${t(
                        'customerWithColon'
                      )}</strong> ${requesterName}</p>
                      <p><strong>${t(
                        'addressWithColon'
                      )}</strong> ${fullAddress}</p>
                    </div>
                    <img class="receipt-bag" src="${itemQrSource}" alt="QR Recibo ${itemId}" />
                  </div>
                  <div class="receipt-signatures">
                    <div>
                      <span>${t('driverSignature')}</span>
                      <div class="signature-line"></div>
                    </div>
                  </div>
                </section>
              </div>
            </section>
          </article>
        `;
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Rota ${routeId}</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
            }
            .sheet {
              border: 1px solid #cbd5e1;
              border-radius: 14px;
              overflow: hidden;
            }
            .item-sheet {
              display: flex;
              flex-direction: column;
              min-height: 980px;
            }
            .header {
              display: grid;
              grid-template-columns: 1fr 220px;
              gap: 24px;
              align-items: center;
              padding: 20px 24px;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }
            .logo {
              width: 160px;
              height: auto;
              margin-bottom: 16px;
            }
            .meta p {
              margin: 4px 0;
              font-size: 15px;
            }
            .bag {
              width: 220px;
              height: 220px;
              object-fit: contain;
              justify-self: end;
            }
            .content {
              padding: 16px 24px 24px;
            }
            .item-sheet .content {
              display: flex;
              flex-direction: column;
              flex: 1;
            }
            .item-sheet .receipt-block {
              margin-top: auto;
            }
            .item-header {
              display: grid;
              grid-template-columns: 1fr 1fr 220px;
              gap: 16px;
              align-items: center;
              padding: 20px 24px;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
            }
            .logo.small {
              width: 130px;
              margin-bottom: 0;
            }
            .table-title {
              margin: 0 0 10px;
              color: #0f766e;
              font-size: 16px;
              font-weight: 700;
            }
            .detail-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 18px;
            }
            .detail-card {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 12px;
            }
            .detail-card h3 {
              margin: 0 0 8px;
              color: #0b6b79;
              font-size: 14px;
            }
            .detail-card p {
              margin: 4px 0;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background: #e2f0f5;
              color: #0b6b79;
              font-weight: 700;
            }
            .receipt {
              margin-top: 14px;
              border: 2px dashed #0b6b79;
              border-radius: 12px;
              overflow: hidden;
            }
            .cut-line {
              margin: 8px 0 14px;
              border-top: 2px dashed #94a3b8;
              text-align: center;
              position: relative;
            }
            .cut-line span {
              position: relative;
              top: -10px;
              background: #fff;
              padding: 0 8px;
              color: #64748b;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: .06em;
            }
            .receipt-header {
              padding: 10px 12px;
              background: #e2f0f5;
              color: #0b6b79;
              font-weight: 700;
              font-size: 13px;
              letter-spacing: .04em;
            }
            .receipt-content {
              display: grid;
              grid-template-columns: 1fr 130px;
              gap: 8px;
              align-items: center;
              padding-right: 8px;
            }
            .receipt-body {
              padding: 12px;
            }
            .receipt-body p {
              margin: 5px 0;
              font-size: 13px;
            }
            .receipt-bag {
              width: 120px;
              height: 120px;
              object-fit: contain;
              justify-self: end;
            }
            .receipt-signatures {
              display: grid;
              grid-template-columns: 1fr;
              gap: 12px;
              padding: 8px 12px 14px;
            }
            .receipt-signatures span {
              display: block;
              margin-bottom: 18px;
              font-size: 12px;
              color: #334155;
            }
            .signature-line {
              border-bottom: 1px solid #475569;
              height: 1px;
            }
            .outside-signature {
              margin-top: 14px;
              padding: 8px 4px 2px;
            }
            .outside-signature span {
              display: block;
              margin-bottom: 18px;
              font-size: 12px;
              color: #334155;
            }
            .page-break {
              page-break-before: always;
              break-before: page;
              margin-top: 14px;
            }
            @media print {
              body {
                padding: 0;
              }
              .sheet {
                border: 0;
                border-radius: 0;
              }
              .item-sheet {
                min-height: 100vh;
              }
              .page-break {
                margin-top: 0;
              }
            }
          </style>
        </head>
        <body>
          <article class="sheet">
            <header class="header">
              <div>
                <img class="logo" src="${logoSource}" alt="Retex" />
                <div class="meta">
                  <p><strong>${t('routeCode')}</strong> ${routeCode}</p>
                  <p><strong>${t('dateWithColon')}</strong> ${safeDate}</p>
                  <p><strong>${t('driverWithColon')}</strong> ${driverName}</p>
                </div>
              </div>
              <img class="bag" src="${qrSource}" alt="QR ${routeId}" />
            </header>
            <section class="content">
              <h2 class="table-title">${t('routeItems')}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${tCommon('code')}</th>
                    <th>${t('requester')}</th>
                    <th>${tCommon('phone')}</th>
                    <th>${tCommon('address')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </section>
          </article>
          ${itemPages}
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
  };

  return (
    <section id="package-collection-page" className="space-y-6">
      <div className="flex justify-end">
        <PackageCollectionForm onSave={() => onSave()} />
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as CollectionStatus | typeof ALL_STATUSES)
            }
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder={tCommon('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>{t('allStatuses')}</SelectItem>
              {Object.values(CollectionStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {tStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('code')}</TableHead>
                <TableHead>{t('driver')}</TableHead>
                <TableHead>{t('pickupDate')}</TableHead>
                <TableHead>{t('requestCount')}</TableHead>
                <TableHead>{t('confirmations')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
                <TableHead>{tCommon('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.items.map((packageCollection) => (
                <TableRow key={packageCollection.id}>
                  <TableCell className="font-medium">
                    {packageCollection.friendlyCode ?? '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {`${packageCollection.driver.firstName} ${packageCollection.driver.lastName}`}
                  </TableCell>
                  <TableCell>
                    {packageCollection.startDate
                      ? new Date(packageCollection.startDate).toLocaleDateString(
                          'pt-PT'
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {packageCollection.collectionRequestsCount}
                  </TableCell>
                  <TableCell>
                    {packageCollection.confirmedCount ?? 0}
                    {' / '}
                    {packageCollection.collectionRequestsCount}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        packageCollection.status === CollectionStatus.IN_TRANSIT
                          ? 'bg-yellow-100 text-yellow-800'
                          : packageCollection.status ===
                            CollectionStatus.WAITING_TO_START
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {tStatus(packageCollection.status) ??
                        packageCollection.status}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <RouteBagsDialog
                      routeId={packageCollection.id}
                      routeCode={packageCollection.friendlyCode}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={async () => {
                        await toast.promise(
                          handlePrintRoute(packageCollection.id),
                          {
                            loading: t('preparingPrint'),
                            success: () => t('printReady'),
                            error: () => t('printError'),
                          }
                        );
                      }}
                      title={t('printRouteTooltip')}
                    >
                      <PrinterIcon />
                    </Button>
                    {(packageCollection.status === CollectionStatus.IN_TRANSIT ||
                      packageCollection.status === CollectionStatus.FINISHED) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={async () => {
                          await toast.promise(
                            handlePrintQrCodes(packageCollection.id),
                            {
                              loading: t('preparingQr'),
                              success: () => t('qrPrintReady'),
                              error: (e) =>
                                (e as Error)?.message || t('qrPrintError'),
                            }
                          );
                        }}
                        title={t('printQrTooltip')}
                      >
                        <QrCodeIcon />
                      </Button>
                    )}
                    {packageCollection.status === CollectionStatus.FINISHED && (
                      <ConfirmDialog
                        title={t('surveyTitle')}
                        description={t('surveyDescription')}
                        confirmText={t('surveyConfirm')}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="size-8 text-secondary hover:text-secondary/80"
                            title={t('surveyTooltip')}
                          >
                            <MailIcon />
                          </Button>
                        }
                        onConfirm={async () => {
                          await toast.promise(
                            handleDispatchSurvey(packageCollection.id),
                            {
                              loading: t('sendingSurvey'),
                              success: () => t('surveySuccess'),
                              error: () => t('surveyError'),
                            }
                          );
                        }}
                      />
                    )}
                    <PackageCollectionForm
                      packageCollectionId={packageCollection.id}
                      onSave={() => onSave()}
                    />
                    {packageCollection.status === CollectionStatus.DRAFTING && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="size-8 text-green-600 hover:text-green-700"
                            title={t('confirmTooltip')}
                          >
                            <CheckCircle2Icon />
                          </Button>
                        }
                        onConfirm={async () => {
                          await toast.promise(
                            handleSetCreated(packageCollection.id),
                            {
                              loading: 'Loading...',
                              success: () => t('confirmSuccess'),
                              error: () => t('confirmError'),
                            }
                          );
                        }}
                      />
                    )}
                    {NEXT_STATUS[packageCollection.status] && (
                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className="size-8 text-blue-600 hover:text-blue-700"
                            title={t('advanceTo', {
                              status: tStatus(
                                NEXT_STATUS[packageCollection.status]!
                              ),
                            })}
                          >
                            <ChevronsRightIcon />
                          </Button>
                        }
                        onConfirm={async () => {
                          const next = NEXT_STATUS[packageCollection.status];
                          if (!next) return;
                          await toast.promise(
                            handleAdvanceStatus(packageCollection.id, next),
                            {
                              loading: 'Loading...',
                              success: () =>
                                `Estado atualizado para ${tStatus(next) ?? next}`,
                              error: () => t('statusUpdateError'),
                            }
                          );
                        }}
                      />
                    )}
                    {packageCollection.status !== CollectionStatus.FINISHED && (
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
                        onConfirm={async () => {
                          await toast.promise(
                            handleDelete(packageCollection.id),
                            {
                              loading: 'Loading...',
                              success: () => t('deactivateSuccess'),
                              error: () => t('deactivateError'),
                            }
                          );
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {pagination.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-gray-500"
                  >
                    {t('empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination pagination={pagination} />
      </div>
    </section>
  );
}
