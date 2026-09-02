import { useTranslations } from 'next-intl';
import { Brand } from '@/app/types/brand';
import {
  StorageUnitDTO,
} from '@/app/types/storage-unit';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  quality: 'GOOD' | 'MEDIUM' | 'BAD';
  type: 'UPPER_PART' | 'UNDER_PART';
  season: 'SUMMER' | 'WINTER';
  sex: 'MALE' | 'FEMALE';
  ageGroup: 'ADULT' | 'CHILD';
  brandId: string;
  quantity: number;
};

// Chave de casamento item <-> unidade de armazenamento (atributos de triagem).
export const buildTriageKey = (attrs: {
  quality: string;
  sex: string;
  ageGroup: string;
  type: string;
  season: string;
}) =>
  `${attrs.quality}::${attrs.sex}::${attrs.ageGroup}::${attrs.type}::${attrs.season}`;

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
  onStorageCodeSubmit: () => Promise<void>;
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
  const tQuality = useTranslations('enums.quality');
  const tSex = useTranslations('enums.sex');
  const tAgeGroup = useTranslations('enums.ageGroup');
  const tItemType = useTranslations('enums.itemType');
  const tSeason = useTranslations('enums.season');
  const storageInputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusStorageInputRef = useRef(false);
  const validStorageUnits = storageUnits.filter(
    (storageUnit): storageUnit is StorageUnitDTO => Boolean(storageUnit?.id)
  );
  const itemTriageKeys = new Set(items.map((item) => buildTriageKey(item)));
  const storageTriageKeys = new Set(
    validStorageUnits.map((storageUnit) => buildTriageKey(storageUnit))
  );

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
      (a, b) =>
        Number(storageTriageKeys.has(buildTriageKey(a.item))) -
        Number(storageTriageKeys.has(buildTriageKey(b.item)))
    );
  const itemsPagination = usePagination(orderedItems);
  const unitsPagination = usePagination(validStorageUnits);

  const hasInvalidItemCombination = items.some(
    (item) =>
      !item.quality || !item.sex || !item.ageGroup || !item.type || !item.season
  );

  const allStorageKeysInItems = validStorageUnits.every((storageUnit) =>
    itemTriageKeys.has(buildTriageKey(storageUnit))
  );
  const allItemKeysInStorage = [...itemTriageKeys].every((key) =>
    storageTriageKeys.has(key)
  );

  const isFinishDisabled =
    disableFinish ||
    items.length === 0 ||
    validStorageUnits.length === 0 ||
    hasInvalidItemCombination ||
    !allStorageKeysInItems ||
    !allItemKeysInStorage;

  useEffect(() => {
    if (!isLoadingStorageUnit && shouldRefocusStorageInputRef.current) {
      storageInputRef.current?.focus();
      shouldRefocusStorageInputRef.current = false;
    }
  }, [isLoadingStorageUnit]);

  const handleStorageCodeEnter = async () => {
    shouldRefocusStorageInputRef.current = true;

    try {
      await onStorageCodeSubmit();
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
          <Input
            ref={storageInputRef}
            value={storageCode}
            onChange={(e) => onStorageCodeChange(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                await handleStorageCodeEnter();
              }
            }}
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
                  <TableHead>{tCommon('quality')}</TableHead>
                  <TableHead>{tCommon('sex')}</TableHead>
                  <TableHead>{tCommon('ageGroup')}</TableHead>
                  <TableHead>{tCommon('type')}</TableHead>
                  <TableHead>{tCommon('season')}</TableHead>
                  <TableHead>{tCommon('brand')}</TableHead>
                  <TableHead>{tCommon('quantity')}</TableHead>
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
                      // Verde quando há uma unidade adicionada com os mesmos
                      // cinco atributos — que é exatamente o critério com que o
                      // servidor vincula (findCompatibleStorageUnit). Os itens
                      // que ficam brancos são os que ainda faltam cobrir para
                      // poder finalizar.
                      className={cn(
                        storageTriageKeys.has(buildTriageKey(item)) &&
                          COVERED_ROW_CLASS
                      )}
                    >
                      <TableCell>
                        {tQuality(item.quality) ?? item.quality}
                      </TableCell>
                      <TableCell>{tSex(item.sex) ?? item.sex}</TableCell>
                      <TableCell>
                        {tAgeGroup(item.ageGroup) ?? item.ageGroup}
                      </TableCell>
                      <TableCell>
                        {tItemType(item.type) ?? item.type}
                      </TableCell>
                      <TableCell>
                        {tSeason(item.season) ?? item.season}
                      </TableCell>
                      <TableCell>
                        {(brands.find((brand) => brand.id === item.brandId)
                          ?.name ?? item.brandId) ||
                          '-'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
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
                      colSpan={8}
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
                  <TableHead>{tCommon('quality')}</TableHead>
                  <TableHead>{tCommon('sex')}</TableHead>
                  <TableHead>{tCommon('ageGroup')}</TableHead>
                  <TableHead>{tCommon('part')}</TableHead>
                  <TableHead>{tCommon('season')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsPagination.items.length > 0 ? (
                  unitsPagination.items.map((storageUnit) => (
                    <TableRow key={storageUnit.id}>
                      <TableCell>{tQuality(storageUnit.quality)}</TableCell>
                      <TableCell>{tSex(storageUnit.sex)}</TableCell>
                      <TableCell>{tAgeGroup(storageUnit.ageGroup)}</TableCell>
                      <TableCell>{tItemType(storageUnit.type)}</TableCell>
                      <TableCell>{tSeason(storageUnit.season)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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
