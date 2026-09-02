import { useTranslations } from 'next-intl';
import { Brand } from '@/app/types/brand';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { TriageListItem } from './add-triage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Autocomplete from '@/components/custom/autocomplete';
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
import { cn } from '@/lib/utils';
import {
  Baby,
  Frown,
  Meh,
  Shirt,
  Smile,
  Snowflake,
  Sun,
  TrashIcon,
  User,
  UserRound,
  X,
} from 'lucide-react';
import { PantsIcon } from '@/components/icons/pants-icon';
import React, { useMemo } from 'react';

type TriageOption = {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function OptionSelector({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: TriageOption[];
  selected?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = selected === option.value;

        return (
          <Button
            key={option.value}
            variant={isActive ? 'secondary' : 'outline'}
            type="button"
            className={cn(
              'h-14 min-w-24 flex-col gap-1 rounded-lg px-3',
              isActive && 'ring-2 ring-secondary/25'
            )}
            onClick={() => onSelect(option.value)}
            disabled={disabled}
          >
            <Icon className="size-4" />
            <span className="text-[11px]">{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

type CollectionRecordProps = {
  selectedCollectionRequestId?: string;
  items: TriageListItem[];
  brands: Brand[];
  brandId: string;
  onBrandChange: (value: string) => void;
  /** Persiste uma marca nova e devolve o seu id, ou null se falhou. */
  onCreateBrand: (name: string) => Promise<string | null>;
  quantity: string;
  onQuantityChange: (value: string) => void;
  quality?: 'GOOD' | 'MEDIUM' | 'BAD';
  onQualityChange: (value: 'GOOD' | 'MEDIUM' | 'BAD') => void;
  season?: 'SUMMER' | 'WINTER';
  onSeasonChange: (value: 'SUMMER' | 'WINTER') => void;
  clothingType?: 'UPPER_PART' | 'UNDER_PART';
  onClothingTypeChange: (value: 'UPPER_PART' | 'UNDER_PART') => void;
  sex?: 'MALE' | 'FEMALE';
  onSexChange: (value: 'MALE' | 'FEMALE') => void;
  ageGroup?: 'ADULT' | 'CHILD';
  onAgeGroupChange: (value: 'ADULT' | 'CHILD') => void;
  onAdd: () => void | Promise<void>;
  onDeleteItem: (item: TriageListItem, index: number) => void | Promise<void>;
  deletingItemIndex?: number | null;
  isAddDisabled?: boolean;
  isViewMode?: boolean;
};

export default function CollectionRecord({
  selectedCollectionRequestId,
  items,
  brands,
  brandId,
  onBrandChange,
  onCreateBrand,
  quantity,
  onQuantityChange,
  quality,
  onQualityChange,
  season,
  onSeasonChange,
  clothingType,
  onClothingTypeChange,
  sex,
  onSexChange,
  ageGroup,
  onAgeGroupChange,
  onAdd,
  onDeleteItem,
  deletingItemIndex,
  isAddDisabled,
  isViewMode,
}: CollectionRecordProps) {
  const t = useTranslations('triage');
  const pagination = usePagination(items);
  const tCommon = useTranslations('common');
  const tQuality = useTranslations('enums.quality');
  const tSex = useTranslations('enums.sex');
  const tAgeGroup = useTranslations('enums.ageGroup');
  const tItemType = useTranslations('enums.itemType');
  const tSeason = useTranslations('enums.season');

  // Opções construídas dentro do componente para seguirem o idioma activo.
  const qualityOptions: TriageOption[] = [
    { value: 'GOOD', label: tQuality('GOOD'), icon: Smile },
    { value: 'MEDIUM', label: tQuality('MEDIUM'), icon: Meh },
    { value: 'BAD', label: tQuality('BAD'), icon: Frown },
  ];
  const seasonOptions: TriageOption[] = [
    { value: 'SUMMER', label: tSeason('SUMMER'), icon: Sun },
    { value: 'WINTER', label: tSeason('WINTER'), icon: Snowflake },
  ];
  const clothingTypeOptions: TriageOption[] = [
    { value: 'UPPER_PART', label: tItemType('UPPER_PART'), icon: Shirt },
    { value: 'UNDER_PART', label: tItemType('UNDER_PART'), icon: PantsIcon },
  ];
  const sexOptions: TriageOption[] = [
    { value: 'MALE', label: tSex('MALE'), icon: User },
    { value: 'FEMALE', label: tSex('FEMALE'), icon: UserRound },
  ];
  const ageGroupOptions: TriageOption[] = [
    { value: 'ADULT', label: tAgeGroup('ADULT'), icon: User },
    { value: 'CHILD', label: tAgeGroup('CHILD'), icon: Baby },
  ];

  const brandOptions = useMemo(
    () => brands.map((item) => ({ value: item.id, label: item.name })),
    [brands]
  );

  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          {t('recordSection')}
        </h2>
        <X className="size-5 text-secondary" />
      </div>

      <div className="space-y-5">
        <div>
          <Table>
            <TableHeader>
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
              {pagination.items.length > 0 ? (
                pagination.items.map((item, index) => (
                  <TableRow
                    key={`${item.collectionRequestId}-${item.brandId}-${index}`}
                  >
                    <TableCell>
                      {tQuality(item.quality)}
                    </TableCell>
                    <TableCell>{tSex(item.sex)}</TableCell>
                    <TableCell>
                      {tAgeGroup(item.ageGroup)}
                    </TableCell>
                    <TableCell>{tItemType(item.type)}</TableCell>
                    <TableCell>
                      {tSeason(item.season)}
                    </TableCell>
                    <TableCell>
                      {(brands.find((brand) => brand.id === item.brandId)
                        ?.name ??
                        item.brandId) ||
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
                    colSpan={8}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">
              {t('brandLabel')}
            </label>
            <Autocomplete
              options={brandOptions}
              value={brandId}
              onChange={onBrandChange}
              placeholder={t('brandPlaceholder')}
              emptyMessage={t('brandNotFound')}
              disabled={isViewMode}
              allowCreate={!isViewMode}
              createLabel={(query) => t('createBrandOption', { name: query })}
              onCreate={onCreateBrand}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">
              {t('quantityLabel')}
            </label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              disabled={isViewMode}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">{t('qualityLabel')}</p>
          <OptionSelector
            options={qualityOptions}
            selected={quality}
            disabled={isViewMode}
            onSelect={(value) =>
              onQualityChange(value as 'GOOD' | 'MEDIUM' | 'BAD')
            }
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">{t('seasonLabel')}</p>
          <OptionSelector
            options={seasonOptions}
            selected={season}
            disabled={isViewMode}
            onSelect={(value) => onSeasonChange(value as 'SUMMER' | 'WINTER')}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">
            {t('clothingTypeLabel')}
          </p>
          <OptionSelector
            options={clothingTypeOptions}
            selected={clothingType}
            disabled={isViewMode}
            onSelect={(value) =>
              onClothingTypeChange(value as 'UPPER_PART' | 'UNDER_PART')
            }
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">{t('sexLabel')}</p>
          <OptionSelector
            options={sexOptions}
            selected={sex}
            disabled={isViewMode}
            onSelect={(value) => onSexChange(value as 'MALE' | 'FEMALE')}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">
            {t('ageGroupLabel')}
          </p>
          <OptionSelector
            options={ageGroupOptions}
            selected={ageGroup}
            disabled={isViewMode}
            onSelect={(value) => onAgeGroupChange(value as 'ADULT' | 'CHILD')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="min-w-24"
            onClick={onAdd}
            disabled={isAddDisabled || isViewMode}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
