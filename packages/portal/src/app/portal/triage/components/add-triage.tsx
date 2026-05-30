import { Brand } from '@/app/types/brand';
import { Quality, StorageUnitDTO } from '@/app/types/storage-unit';
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

export type TriageListItem = {
  id?: string;
  packageId: string;
  quality: 'GOOD' | 'MEDIUM' | 'BAD';
  type: 'UPPER_PART' | 'UNDER_PART';
  season: 'SUMMER' | 'WINTER';
  brandId: string;
  quantity: number;
};

type AddTriageProps = {
  items: TriageListItem[];
  brands: Brand[];
  storageCode: string;
  onStorageCodeChange: (value: string) => void;
  onStorageCodeSubmit: () => Promise<void>;
  storageUnits: StorageUnitDTO[];
  isLoadingStorageUnit?: boolean;
  onDeleteItem: (item: TriageListItem, index: number) => void | Promise<void>;
  deletingItemIndex?: number | null;
};

export default function AddTriage({
  items,
  brands,
  storageCode,
  onStorageCodeChange,
  onStorageCodeSubmit,
  storageUnits,
  isLoadingStorageUnit,
  onDeleteItem,
  deletingItemIndex,
}: AddTriageProps) {
  const storageInputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusStorageInputRef = useRef(false);
  const itemBrandQualityKeys = new Set(
    items
      .filter((item) => !!item.brandId)
      .map((item) => `${item.brandId}::${item.quality}`)
  );
  const storageBrandQualityKeys = new Set(
    storageUnits.map(
      (storageUnit) => `${storageUnit.brand.id}::${storageUnit.quality}`
    )
  );

  const allStorageBrandQualityInItems = storageUnits.every((storageUnit) =>
    itemBrandQualityKeys.has(`${storageUnit.brand.id}::${storageUnit.quality}`)
  );
  const allItemBrandQualityInStorage = [...itemBrandQualityKeys].every((key) =>
    storageBrandQualityKeys.has(key)
  );

  const isFinishDisabled =
    items.length === 0 ||
    storageUnits.length === 0 ||
    !allStorageBrandQualityInItems ||
    !allItemBrandQualityInStorage;

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
                  <TableCell>{item.quality}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.season}</TableCell>
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
                          disabled={deletingItemIndex === index}
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
                  colSpan={6}
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
            placeholder="Digite o código e pressione Enter"
            disabled={isLoadingStorageUnit}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marca</TableHead>
              <TableHead>Qualidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storageUnits.length > 0 ? (
              storageUnits.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell>{storageUnit.brand.name}</TableCell>
                  <TableCell>{QUALITY_MAP[storageUnit.quality]}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-24 text-center text-secondary/55"
                >
                  Nenhuma unidade de armazenamento adicionada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="secondary"
            className="min-w-40"
            disabled={isFinishDisabled}
          >
            <Check className="size-4" />
            Finalizar Triagem
          </Button>
        </div>
      </div>
    </div>
  );
}
