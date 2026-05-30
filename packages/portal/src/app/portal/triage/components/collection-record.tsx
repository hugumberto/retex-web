import { Brand } from '@/app/types/brand';
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
import { Frown, Meh, Shirt, Smile, Snowflake, Sun, X } from 'lucide-react';
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

function OptionSelector({
  options,
  selected,
  onSelect,
}: {
  options: TriageOption[];
  selected?: string;
  onSelect: (value: string) => void;
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
  onAdd: () => void;
  isAddDisabled?: boolean;
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
  onAdd,
  isAddDisabled,
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
                <TableHead>Tipo</TableHead>
                <TableHead>Estação</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <TableRow key={`${item.packageId}-${item.brandId}-${index}`}>
                    <TableCell>{item.quality}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.season}</TableCell>
                    <TableCell>
                      {brands.find((brand) => brand.id === item.brandId)
                        ?.name ?? item.brandId}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
              <SelectTrigger className="w-full">
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
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-secondary">Qualidade *</p>
          <OptionSelector
            options={qualityOptions}
            selected={quality}
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
            onSelect={(value) =>
              onClothingTypeChange(value as 'UPPER_PART' | 'UNDER_PART')
            }
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="min-w-24"
            onClick={onAdd}
            disabled={isAddDisabled}
          >
            Adicionar
          </Button>
          <Button type="button" variant="secondary" className="min-w-24">
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
