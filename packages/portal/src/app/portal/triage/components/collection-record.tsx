import { Brand } from '@/app/types/brand';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import {
  AGE_GROUP_LABEL,
  QUALITY_LABEL,
  SEASON_LABEL,
  SEX_LABEL,
  TYPE_LABEL,
} from '@/lib/item-labels';
import { TriageListItem } from './add-triage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import React from 'react';

type TriageOption = {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const qualityOptions: TriageOption[] = [
  { value: 'GOOD', label: 'Boa', icon: Smile },
  { value: 'MEDIUM', label: 'Regular', icon: Meh },
  { value: 'BAD', label: 'Má', icon: Frown },
];

const seasonOptions: TriageOption[] = [
  { value: 'SUMMER', label: 'Verão', icon: Sun },
  { value: 'WINTER', label: 'Inverno', icon: Snowflake },
];

const clothingTypeOptions: TriageOption[] = [
  { value: 'UPPER_PART', label: 'Parte de cima', icon: Shirt },
  { value: 'UNDER_PART', label: 'Parte de baixo', icon: Shirt },
];

const sexOptions: TriageOption[] = [
  { value: 'MALE', label: 'Homem', icon: User },
  { value: 'FEMALE', label: 'Mulher', icon: UserRound },
];

const ageGroupOptions: TriageOption[] = [
  { value: 'ADULT', label: 'Adulto', icon: User },
  { value: 'CHILD', label: 'Infantil', icon: Baby },
];

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
  selectedPackageId?: string;
  items: TriageListItem[];
  brands: Brand[];
  brandId: string;
  onBrandChange: (value: string) => void;
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
  selectedPackageId,
  items,
  brands,
  brandId,
  onBrandChange,
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
  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          Registo de Triagem
        </h2>
        <X className="size-5 text-secondary" />
      </div>

      <div className="space-y-5">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qualidade</TableHead>
                <TableHead>Sexo</TableHead>
                <TableHead>Faixa etária</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estação</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <TableRow key={`${item.packageId}-${item.brandId}-${index}`}>
                    <TableCell>{QUALITY_LABEL[item.quality] ?? item.quality}</TableCell>
                    <TableCell>{SEX_LABEL[item.sex] ?? item.sex}</TableCell>
                    <TableCell>{AGE_GROUP_LABEL[item.ageGroup] ?? item.ageGroup}</TableCell>
                    <TableCell>{TYPE_LABEL[item.type] ?? item.type}</TableCell>
                    <TableCell>{SEASON_LABEL[item.season] ?? item.season}</TableCell>
                    <TableCell>
                      {(brands.find((brand) => brand.id === item.brandId)
                        ?.name ??
                        item.brandId) ||
                        '-'}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <ConfirmDialog
                        title="Remover item?"
                        description="Tem certeza que deseja remover este item da triagem?"
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
                    {selectedPackageId ?? 'Tabela de itens'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">
              Marca *
            </label>
            <Select value={brandId} onValueChange={onBrandChange}>
              <SelectTrigger className="w-full" disabled={isViewMode}>
                <SelectValue placeholder="Selecionar marca" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-secondary">
              Quantidade *
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
          <p className="mb-2 text-sm font-medium text-secondary">Qualidade *</p>
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
          <p className="mb-2 text-sm font-medium text-secondary">Estação *</p>
          <OptionSelector
            options={seasonOptions}
            selected={season}
            disabled={isViewMode}
            onSelect={(value) => onSeasonChange(value as 'SUMMER' | 'WINTER')}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">
            Tipo de Roupa *
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
          <p className="mb-2 text-sm font-medium text-secondary">Sexo *</p>
          <OptionSelector
            options={sexOptions}
            selected={sex}
            disabled={isViewMode}
            onSelect={(value) => onSexChange(value as 'MALE' | 'FEMALE')}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">
            Faixa etária *
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
          <Button
            type="button"
            variant="secondary"
            className="min-w-24"
            disabled={isViewMode}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
