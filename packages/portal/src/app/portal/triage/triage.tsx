'use client';

import Barcode from '@/components/custom/bar-code';
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
import { useAppStore } from '@/store';
import {
  Check,
  Frown,
  Meh,
  QrCode,
  Shirt,
  Smile,
  Snowflake,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type TriageOption = {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const qualityOptions: TriageOption[] = [
  { value: 'good', label: 'Good', icon: Smile },
  { value: 'fair', label: 'Fair', icon: Meh },
  { value: 'bad', label: 'Bad', icon: Frown },
];

const seasonOptions: TriageOption[] = [
  { value: 'summer', label: 'Summer', icon: Sun },
  { value: 'winter', label: 'Winter', icon: Snowflake },
];

const clothingTypeOptions: TriageOption[] = [
  { value: 'top', label: 'Top', icon: Shirt },
  { value: 'bottom', label: 'Bottom', icon: Shirt },
];

function OptionSelector({
  options,
  selected,
  onSelect,
}: {
  options: TriageOption[];
  selected: string;
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

export default function Triage() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [scanCode, setScanCode] = useState('');
  const [weight, setWeight] = useState('');
  const [collectionCode, setCollectionCode] = useState('');
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [quality, setQuality] = useState('good');
  const [season, setSeason] = useState('summer');
  const [clothingType, setClothingType] = useState('top');

  const brands = useMemo(() => ['Nike', 'Zara', 'H&M', "Levi's"], []);

  useEffect(() => {
    setPageTitle('Triage');
    setBreadcrumbs([{ label: 'Triage', href: '/portal/triage' }]);

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle]);

  return (
    <section id="triage-page" className="flex flex-col gap-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">
                Code
              </label>
              <Input
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Type code"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">
                Weight
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="min-w-24">
                Save
              </Button>
              <Button type="button" variant="secondary" className="min-w-32">
                Start Triage
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-28 w-full rounded-xl border-secondary/45 bg-secondary-muted/30 text-secondary lg:w-32"
          >
            <div className="flex flex-col items-center gap-2">
              <QrCode className="size-9" />
              <span className="text-[11px] font-semibold tracking-wide">
                SCAN CODE
              </span>
            </div>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary">
              Collection Record
            </h2>
            <X className="size-5 text-secondary" />
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">
                Code
              </label>
              <Input
                value={collectionCode}
                onChange={(e) => setCollectionCode(e.target.value)}
                placeholder="Collection code"
              />
            </div>

            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="h-20 text-center text-secondary/55">
                      Item table
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">
                  Brand
                </label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary">
                  Quantity
                </label>
                <Input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-secondary">Quality</p>
              <OptionSelector
                options={qualityOptions}
                selected={quality}
                onSelect={setQuality}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-secondary">Season</p>
              <OptionSelector
                options={seasonOptions}
                selected={season}
                onSelect={setSeason}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-secondary">
                Clothing Type
              </p>
              <OptionSelector
                options={clothingTypeOptions}
                selected={clothingType}
                onSelect={setClothingType}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" className="min-w-24">
                Add
              </Button>
              <Button type="button" variant="secondary" className="min-w-24">
                Next
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary">
              Add - Triage
            </h2>
            <X className="size-5 text-secondary" />
          </div>

          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="h-20 text-center text-secondary/55">
                    Item table
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-24 w-40 rounded-lg border-secondary/40 bg-secondary-muted/30"
              >
                <div className="flex flex-col items-center gap-2">
                  <Barcode
                    value="TRIAGE-ITEM"
                    width={1.2}
                    height={26}
                    fontSize={10}
                  />
                  <span className="text-[11px] text-secondary">Add items</span>
                </div>
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Storage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="h-24 text-center text-secondary/55">
                    Storage table
                  </TableCell>
                </TableRow>
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
      </div>
    </section>
  );
}
