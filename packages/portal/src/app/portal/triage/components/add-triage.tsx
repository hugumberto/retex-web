import { useTranslations } from 'next-intl';
import { Brand } from '@/app/types/brand';
import { StorageUnitDTO } from '@/app/types/storage-unit';
import {
  AgeGroup,
  Category,
  Condition,
  Destination,
  Season,
  Sex,
  StorageSlot,
  Type,
  resolveStorageSlot,
  storageSlotKey,
} from '@/app/types/triage';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { Button } from '@/components/ui/button';
import ScanInput from '@/components/custom/scan-input';
import { useEffect, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Check, TrashIcon, X } from 'lucide-react';

export type TriageListItem = {
  id?: string;
  collectionRequestId: string;
  bagId?: string;
  destination: Destination;
  sex?: Sex | null;
  ageGroup?: AgeGroup | null;
  season?: Season | null;
  type?: Type | null;
  category?: Category | null;
  condition?: Condition | null;
  brandId?: string;
  quantity: number;
};

/**
 * Chave do lote de uma peça (null = não vai para lote nenhum, ex.: acessório).
 * Só os indicadores básicos contam — o mesmo critério com que o servidor
 * vincula as peças às unidades de armazenamento.
 */
export const itemSlotKey = (item: TriageListItem) => {
  const slot = resolveStorageSlot(item);
  return slot ? storageSlotKey(slot) : null;
};

export const unitSlotKey = (unit: StorageUnitDTO) => storageSlotKey(unit);

// "Homem · Verão · Superior" — rótulo legível de um lote.
export function useSlotLabel() {
  const tGroup = useTranslations('enums.storageGroup');
  const tSeason = useTranslations('enums.season');
  const tItemType = useTranslations('enums.itemType');
  return (slot: Pick<StorageSlot, 'group'> & Partial<StorageSlot>) =>
    [
      tGroup(slot.group),
      slot.season ? tSeason(slot.season) : null,
      slot.type ? tItemType(slot.type) : null,
    ]
      .filter(Boolean)
      .join(' · ');
}

/** Colunas comuns das tabelas de peças (registo do saco e itens da triagem). */
export function useItemColumns(brands: Brand[]) {
  const tCommon = useTranslations('common');
  const tCategory = useTranslations('enums.category');
  const tCondition = useTranslations('enums.condition');
  const tDestination = useTranslations('enums.destination');
  const slotLabel = useSlotLabel();
  const t = useTranslations('triage');

  const headers = [
    tCommon('category'),
    tCommon('storageSlot'),
    tCommon('condition'),
    tCommon('destination'),
    tCommon('brand'),
    tCommon('quantity'),
  ];

  const cells = (item: TriageListItem) => {
    const slot = resolveStorageSlot(item);
    return [
      item.category ? tCategory(item.category) : '-',
      slot ? slotLabel(slot) : t('noStorage'),
      item.condition ? tCondition(item.condition) : '-',
      tDestination(item.destination),
      (brands.find((brand) => brand.id === item.brandId)?.name ?? item.brandId) ||
        '-',
      item.quantity,
    ];
  };

  return { headers, cells };
}

/**
 * Linha de item já coberto por uma unidade de armazenamento adicionada.
 *
 * O `hover:` não é opcional: o `TableRow` base traz `hover:bg-muted/50`, que
 * sem isto apagaria o verde ao passar o rato e pareceria avaria.
 */
const COVERED_ROW_CLASS = 'bg-green-50 hover:bg-green-100';

type AddTriageProps = {
  items: TriageListItem[];
  brands: Brand[];
  isViewMode?: boolean;
  storageCode: string;
  onStorageCodeChange: (value: string) => void;
  onStorageCodeSubmit: (code?: string) => Promise<void>;
  storageUnits: StorageUnitDTO[];
  isLoadingStorageUnit?: boolean;
  onDeleteItem: (item: TriageListItem, index: number) => void | Promise<void>;
  deletingItemIndex?: number | null;
  onFinishTriage: () => void | Promise<void>;
  isFinishingTriage?: boolean;
  disableFinish?: boolean;
  hideFinishButton?: boolean;
};

export default function AddTriage({
  items,
  brands,
  isViewMode,
  storageCode,
  onStorageCodeChange,
  onStorageCodeSubmit,
  storageUnits,
  isLoadingStorageUnit,
  onDeleteItem,
  deletingItemIndex,
  onFinishTriage,
  isFinishingTriage,
  disableFinish,
  hideFinishButton,
}: AddTriageProps) {
  const t = useTranslations('triage');
  const tCommon = useTranslations('common');
  const slotLabel = useSlotLabel();
  const itemColumns = useItemColumns(brands);
  const storageInputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusStorageInputRef = useRef(false);
  const validStorageUnits = storageUnits.filter(
    (storageUnit): storageUnit is StorageUnitDTO => Boolean(storageUnit?.id)
  );
  // Peças sem lote (acessórios) não precisam de unidade de armazenamento.
  const itemTriageKeys = new Set(
    items.map(itemSlotKey).filter((key): key is string => key != null)
  );
  const storageTriageKeys = new Set(validStorageUnits.map(unitSlotKey));
  const isCovered = (item: TriageListItem) => {
    const key = itemSlotKey(item);
    return key == null || storageTriageKeys.has(key);
  };

  // Os itens já cobertos por uma unidade de armazenamento vão para o fim, para
  // o operador ver primeiro o que ainda falta cobrir. O `sort` é estável, por
  // isso a ordem relativa dentro de cada grupo mantém-se.
  //
  // O índice original vai colado ao item: `onDeleteItem` e `deletingItemIndex`
  // são posicionais sobre `items` e apontariam para a linha errada se aqui se
  // usasse o índice da ordenação.
  const orderedItems = items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) => Number(isCovered(a.item)) - Number(isCovered(b.item))
    );
  const itemsPagination = usePagination(orderedItems);
  const unitsPagination = usePagination(validStorageUnits);

  const allStorageKeysInItems = validStorageUnits.every((storageUnit) =>
    itemTriageKeys.has(unitSlotKey(storageUnit))
  );
  const allItemKeysInStorage = [...itemTriageKeys].every((key) =>
    storageTriageKeys.has(key)
  );

  const isFinishDisabled =
    disableFinish ||
    items.length === 0 ||
    (itemTriageKeys.size > 0 && validStorageUnits.length === 0) ||
    !allStorageKeysInItems ||
    !allItemKeysInStorage;

  useEffect(() => {
    if (!isLoadingStorageUnit && shouldRefocusStorageInputRef.current) {
      storageInputRef.current?.focus();
      shouldRefocusStorageInputRef.current = false;
    }
  }, [isLoadingStorageUnit]);

  const handleStorageCodeEnter = async (scanned?: string) => {
    shouldRefocusStorageInputRef.current = true;

    try {
      await onStorageCodeSubmit(scanned);
    } finally {
      onStorageCodeChange('');
    }
  };

  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          {t('itemsSection')}
        </h2>
        <X className="size-5 text-secondary" />
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary">
            {t('storageCodeLabel')}
          </label>
          <ScanInput
            inputRef={storageInputRef}
            value={storageCode}
            onChange={onStorageCodeChange}
            onScan={handleStorageCodeEnter}
            scanTitle={t('storageCodeLabel')}
            placeholder={t('storageCodePlaceholder')}
            disabled={isLoadingStorageUnit || isViewMode}
          />
        </div>

        {/* Lado a lado: o conteúdo de cada tabela só se lê contra o da outra.
            O `min-w-0` nas colunas não é opcional: as células têm
            `whitespace-nowrap`, e um item de grelha assume `min-width: auto`,
            recusando encolher abaixo do conteúdo. Sem isto a coluna estica até
            à largura da tabela, o `overflow-x-auto` do contentor nunca chega a
            atuar e é a página inteira que passa a transbordar em ecrãs
            estreitos. */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="min-w-0 space-y-2 lg:col-span-3">
            <h3 className="text-sm font-medium text-secondary">
              {tCommon('items')}
            </h3>
            <Table containerClassName="max-h-[300px]">
              <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                <TableRow>
                  {itemColumns.headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                  <TableHead>{tCommon('action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsPagination.items.length > 0 ? (
                  itemsPagination.items.map(({ item, index }) => (
                    <TableRow
                      key={
                        item.id ??
                        `${item.collectionRequestId}-${item.brandId}-${index}`
                      }
                      // Verde quando há uma unidade adicionada do mesmo lote
                      // (grupo × estação × parte) — o critério com que o servidor
                      // vincula — ou quando a peça não vai para lote nenhum. Os
                      // itens que ficam brancos são os que ainda faltam cobrir
                      // para poder finalizar.
                      className={cn(isCovered(item) && COVERED_ROW_CLASS)}
                    >
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
                              disabled={
                                deletingItemIndex === index || isViewMode
                              }
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

            <TablePagination pagination={itemsPagination} />
          </div>

          <div className="min-w-0 space-y-2 lg:col-span-2">
            <h3 className="text-sm font-medium text-secondary">
              {t('storageUnitsSection')}
            </h3>
            <Table containerClassName="max-h-[300px]">
              <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10">
                <TableRow>
                  <TableHead>{tCommon('code')}</TableHead>
                  <TableHead>{tCommon('storageSlot')}</TableHead>
                  <TableHead>{tCommon('location')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsPagination.items.length > 0 ? (
                  unitsPagination.items.map((storageUnit) => (
                    <TableRow key={storageUnit.id}>
                      <TableCell className="font-medium">
                        {storageUnit.friendlyCode ?? '-'}
                      </TableCell>
                      <TableCell>{slotLabel(storageUnit)}</TableCell>
                      <TableCell>{storageUnit.location || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-secondary/55"
                    >
                      {t('noStorageUnits')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination pagination={unitsPagination} />
          </div>
        </div>

        {!hideFinishButton && (
          <div className="flex justify-center pt-1">
            <Button
              type="button"
              variant="secondary"
              className="min-w-40"
              disabled={isFinishDisabled || isViewMode}
              onClick={onFinishTriage}
              aria-busy={isFinishingTriage}
            >
              <Check className="size-4" />
              {t('finish')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
