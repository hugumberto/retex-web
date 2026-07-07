'use client';

import {
  PackageCollectionDTO,
  CollectionStatus,
  PackageCollectionTableDTO,
} from '@/app/types/package-collection';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { useAppStore } from '@/store';
import { PrinterIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PaginatedResult } from '../../types/helper';
import PackageCollectionForm from './package-collection-form';
import Barcode from '@/components/custom/bar-code';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function PackageCollection() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageCollections, setPackageCollections] = useState<
    PackageCollectionTableDTO[]
  >([]);

  const fetchData = async () => {
    const { data } = await api.get<PaginatedResult<PackageCollectionTableDTO>>(
      `/route`
    );
    setPackageCollections(data.data);
  };

  useEffect(() => {
    setPageTitle('Gerir Recolha');
    setBreadcrumbs([{ label: 'Gerir Recolha', href: '/portal/package-collection' }]);
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

  const handlePrintRoute = async (id: string) => {
    const { data, status } = await api.get<PackageCollectionDTO>(
      `/route/${id}`
    );
    if (status !== 200) {
      throw new Error('Erro ao buscar dados da rota para impressão');
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=900');
    if (!printWindow) {
      throw new Error('Permita pop-ups para imprimir');
    }

    const routeId = escapeHtml(data.id);
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

    const rows = data.packages
      .map((pkg) => {
        const requester = escapeHtml(
          `${pkg.user.firstName ?? ''} ${pkg.user.lastName ?? ''}`.trim() || '-'
        );
        const address = escapeHtml(
          `${pkg.address.street ?? ''}, ${pkg.address.number ?? ''} ${
            pkg.address.city ?? ''
          }`.trim() || '-'
        );

        return `<tr><td>${requester}</td><td>${address}</td></tr>`;
      })
      .join('');

    const tableRows =
      rows ||
      '<tr><td colspan="2" style="text-align:center;color:#6b7280;">Sem itens na rota</td></tr>';

    const itemPages = data.packages
      .map((pkg, index) => {
        const itemId = escapeHtml(pkg.id);
        const requesterName = escapeHtml(
          `${pkg.user.firstName ?? ''} ${pkg.user.lastName ?? ''}`.trim() || '-'
        );
        const requesterEmail = escapeHtml(pkg.user.email ?? '-');
        const requesterPhone = escapeHtml(pkg.user.contactPhone ?? '-');
        const fullAddress = escapeHtml(
          `${pkg.address.street ?? ''}, ${pkg.address.number ?? ''}${
            pkg.address.complement ? `, ${pkg.address.complement}` : ''
          }, ${pkg.address.zipCode ?? ''} ${pkg.address.city ?? ''}`
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
                <p><strong>Rota:</strong> ${routeId}</p>
                <p><strong>Item:</strong> ${itemId}</p>
                <p><strong>Data:</strong> ${safeDate}</p>
                <p><strong>Página:</strong> ${index + 2}</p>
              </div>
              <img class="qr" src="${itemQrSource}" alt="QR Item ${itemId}" />
            </header>

            <section class="content">
              <h2 class="table-title">Detalhes do Item</h2>
              <div class="detail-grid">
                <div class="detail-card">
                  <h3>Dados do Requerente</h3>
                  <p><strong>Nome:</strong> ${requesterName}</p>
                  <p><strong>Email:</strong> ${requesterEmail}</p>
                  <p><strong>Telefone:</strong> ${requesterPhone}</p>
                </div>
                <div class="detail-card">
                  <h3>Endereço de Recolha</h3>
                  <p>${fullAddress}</p>
                </div>
              </div>

              <div class="outside-signature">
                <span>Assinatura do Cliente</span>
                <div class="signature-line"></div>
              </div>

              <div class="receipt-block">
                <div class="cut-line">
                  <span>Linha de Corte</span>
                </div>

                <section class="receipt">
                  <div class="receipt-header">RECIBO DO CLIENTE</div>
                  <div class="receipt-content">
                    <div class="receipt-body">
                      <p><strong>ID do Item:</strong> ${itemId}</p>
                      <p><strong>Data:</strong> ${safeDate}</p>
                      <p><strong>Motorista:</strong> ${driverName}</p>
                      <p><strong>Cliente:</strong> ${requesterName}</p>
                      <p><strong>Endereço:</strong> ${fullAddress}</p>
                    </div>
                    <img class="receipt-qr" src="${itemQrSource}" alt="QR Recibo ${itemId}" />
                  </div>
                  <div class="receipt-signatures">
                    <div>
                      <span>Assinatura do Motorista</span>
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
            .qr {
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
            .receipt-qr {
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
                  <p><strong>ID da Rota:</strong> ${routeId}</p>
                  <p><strong>Data:</strong> ${safeDate}</p>
                  <p><strong>Motorista:</strong> ${driverName}</p>
                </div>
              </div>
              <img class="qr" src="${qrSource}" alt="QR ${routeId}" />
            </header>
            <section class="content">
              <h2 class="table-title">Peças da Rota</h2>
              <table>
                <thead>
                  <tr>
                    <th>Requerente</th>
                    <th>Endereço</th>
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
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <section
      id="package-collection-page"
      className=" flex flex-col items-center"
    >
      <PackageCollectionForm onSave={() => onSave()} />

      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Recolha</TableHead>
              <TableHead>Qtd. Encomendas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packageCollections?.map((packageCollection) => (
              <TableRow key={packageCollection.id}>
                <TableCell>
                  <Checkbox className="h-4 w-4 " />
                </TableCell>
                <TableCell className="font-medium">
                  {`${packageCollection.driver.firstName} ${packageCollection.driver.lastName}`}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex justify-center">
                    <Barcode value={packageCollection.id} />
                  </div>
                </TableCell>
                <TableCell>{packageCollection.packagesCount}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      packageCollection.status === CollectionStatus.IN_TRANSIT
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {packageCollection.status}
                  </span>
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={async () => {
                      await toast.promise(
                        handlePrintRoute(packageCollection.id),
                        {
                          loading: 'A preparar impressão...',
                          success: () => 'Impressão pronta',
                          error: () => 'Erro ao preparar impressão da rota',
                        }
                      );
                    }}
                    title="Imprimir rota"
                  >
                    <PrinterIcon />
                  </Button>
                  <PackageCollectionForm
                    packageCollectionId={packageCollection.id}
                    onSave={() => onSave()}
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
                    onConfirm={async () => {
                      await toast.promise(handleDelete(packageCollection.id), {
                        loading: 'Loading...',
                        success: () => {
                          return 'Recolha de Encomendas desativada com sucesso';
                        },
                        error: () => {
                          return 'Erro ao desativar a recolha de encomendas';
                        },
                      });
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {packageCollections.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-gray-500"
                >
                  {
                    ' Nenhuma recolha de encomendas encontrada. Clique em "Criar Nova Recolha de Encomendas" para adicionar uma.'
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
