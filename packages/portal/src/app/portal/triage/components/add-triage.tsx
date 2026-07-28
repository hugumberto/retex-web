import { Brand } from '@/app/types/brand';
import {
  AgeGroup,
  Quality,
  Season,
  Sex,
  StorageUnitDTO,
  Type,
} from '@/app/types/storage-unit';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
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
import { Check, TrashIcon, X } from 'lucide-react';

const QUALITY_MAP: Record<Quality, string> = {
  [Quality.GOOD]: 'Boa',
  [Quality.MEDIUM]: 'Regular',
  [Quality.BAD]: 'Má',
};

const SEX_MAP: Record<Sex, string> = {
  [Sex.MALE]: 'Homem',
  [Sex.FEMALE]: 'Mulher',
};

const AGE_GROUP_MAP: Record<AgeGroup, string> = {
  [AgeGroup.ADULT]: 'Adulto',
  [AgeGroup.CHILD]: 'Infantil',
};

const TYPE_MAP: Record<Type, string> = {
  [Type.UPPER_PART]: 'Superior',
  [Type.UNDER_PART]: 'Inferior',
};

const SEASON_MAP: Record<Season, string> = {
  [Season.SUMMER]: 'Verão',
  [Season.WINTER]: 'Inverno',
};

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
  const storageInputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusStorageInputRef = useRef(false);
  const validStorageUnits = storageUnits.filter(
    (storageUnit): storageUnit is StorageUnitDTO => Boolean(storageUnit?.id)
  );
  const itemTriageKeys = new Set(items.map((item) => buildTriageKey(item)));
  const storageTriageKeys = new Set(
    validStorageUnits.map((storageUnit) => buildTriageKey(storageUnit))
  );

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
          Adicionar - Triagem
        </h2>
        <X className="size-5 text-secondary" />
      </div>

      <div className="space-y-6">
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
                <TableRow key={`${item.collectionRequestId}-${item.brandId}-${index}`}>
                  <TableCell>
                    {QUALITY_MAP[item.quality] ?? item.quality}
                  </TableCell>
                  <TableCell>{SEX_MAP[item.sex] ?? item.sex}</TableCell>
                  <TableCell>
                    {AGE_GROUP_MAP[item.ageGroup] ?? item.ageGroup}
                  </TableCell>
                  <TableCell>{TYPE_MAP[item.type] ?? item.type}</TableCell>
                  <TableCell>
                    {SEASON_MAP[item.season] ?? item.season}
                  </TableCell>
                  <TableCell>
                    {(brands.find((brand) => brand.id === item.brandId)?.name ??
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
                  Tabela de itens
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary">
            Código de Armazenamento *
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
            placeholder="Escaneie o QR ou digite o código"
            disabled={isLoadingStorageUnit || isViewMode}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Qualidade</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Faixa etária</TableHead>
              <TableHead>Parte</TableHead>
              <TableHead>Estação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validStorageUnits.length > 0 ? (
              validStorageUnits.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell>{QUALITY_MAP[storageUnit.quality]}</TableCell>
                  <TableCell>{SEX_MAP[storageUnit.sex]}</TableCell>
                  <TableCell>{AGE_GROUP_MAP[storageUnit.ageGroup]}</TableCell>
                  <TableCell>{TYPE_MAP[storageUnit.type]}</TableCell>
                  <TableCell>{SEASON_MAP[storageUnit.season]}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-secondary/55"
                >
                  Nenhuma unidade de armazenamento adicionada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
              Finalizar Triagem
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
