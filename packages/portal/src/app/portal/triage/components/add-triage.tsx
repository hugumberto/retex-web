import { Brand } from '@/app/types/brand';
import { Quality, StorageUnitDTO } from '@/app/types/storage-unit';
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
import { Check, X } from 'lucide-react';

const QUALITY_MAP: Record<Quality, string> = {
  [Quality.GOOD]: 'Good',
  [Quality.MEDIUM]: 'Fair',
  [Quality.BAD]: 'Bad',
};

export type TriageListItem = {
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
};

export default function AddTriage({
  items,
  brands,
  storageCode,
  onStorageCodeChange,
  onStorageCodeSubmit,
  storageUnits,
  isLoadingStorageUnit,
}: AddTriageProps) {
  const storageInputRef = useRef<HTMLInputElement>(null);
  const shouldRefocusStorageInputRef = useRef(false);

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
        <h2 className="text-xl font-semibold text-secondary">Add - Triage</h2>
        <X className="size-5 text-secondary" />
      </div>

      <div className="space-y-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quality</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Quantity</TableHead>
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
                    {brands.find((brand) => brand.id === item.brandId)?.name ??
                      item.brandId}
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
                  Item table
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-secondary">
            Storage Code *
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
            placeholder="Type storage code and press Enter"
            disabled={isLoadingStorageUnit}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand</TableHead>
              <TableHead>Quality</TableHead>
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
                  No storage units added
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex justify-center pt-1">
          <Button type="button" variant="secondary" className="min-w-40">
            <Check className="size-4" />
            Finish Triage
          </Button>
        </div>
      </div>
    </div>
  );
}
