import { useTranslations } from 'next-intl';
import { Brand } from '@/app/types/brand';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { TriageListItem, useItemColumns } from './add-triage';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { TrashIcon, X } from 'lucide-react';

type CollectionRecordProps = {
  items: TriageListItem[];
  brands: Brand[];
  onDeleteItem: (item: TriageListItem, index: number) => void | Promise<void>;
  deletingItemIndex?: number | null;
  isViewMode?: boolean;
};

/** Peças já registadas no saco ativo. */
export default function CollectionRecord({
  items,
  brands,
  onDeleteItem,
  deletingItemIndex,
  isViewMode,
}: CollectionRecordProps) {
  const t = useTranslations('triage');
  const tCommon = useTranslations('common');
  const pagination = usePagination(items);
  const itemColumns = useItemColumns(brands);

  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          {t('recordSection')}
        </h2>
        <X className="size-5 text-secondary" />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {itemColumns.headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
            <TableHead>{tCommon('action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.items.length > 0 ? (
            pagination.items.map((item, index) => (
              <TableRow key={item.id ?? `${item.collectionRequestId}-${index}`}>
                {itemColumns.cells(item).map((value, cellIndex) => (
                  <TableCell key={cellIndex}>{value}</TableCell>
                ))}
                <TableCell>
                  <ConfirmDialog
                    title={t('removeItemTitle')}
                    description={t('removeItemDescription')}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={deletingItemIndex === index || isViewMode}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    }
                    onConfirm={() => onDeleteItem(item, index)}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={itemColumns.headers.length + 1}
                className="h-20 text-center text-secondary/55"
              >
                {t('itemsTableCaption')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination pagination={pagination} />
    </div>
  );
}
