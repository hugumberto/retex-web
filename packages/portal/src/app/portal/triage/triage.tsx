'use client';

import { Brand } from '@/app/types/brand';
import { PackageDTO } from '@/app/types/package';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddTriage from './components/add-triage';
import CollectionRecord from './components/collection-record';

export default function Triage() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [scanCode, setScanCode] = useState('');
  const [weight, setWeight] = useState('');
  const [collectionCode, setCollectionCode] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageDTO | null>(
    null
  );
  const [isLoadingPackage, setIsLoadingPackage] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [quality, setQuality] = useState('good');
  const [season, setSeason] = useState('summer');
  const [clothingType, setClothingType] = useState('top');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, status } = await api.get<Brand[]>('/brand');
        if (!isSuccessStatus(status)) {
          throw new Error('Erro ao buscar marcas');
        }

        setBrands(data.map((item) => item.name));
      } catch (error) {
        console.error('Erro ao buscar marcas:', error);
        toast.error('Não foi possível carregar as marcas');
      }
    };

    setPageTitle('Triage');
    setBreadcrumbs([{ label: 'Triage', href: '/portal/triage' }]);
    fetchBrands();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle]);

  const handleScanCodeBlur = async () => {
    const packageId = scanCode.trim();
    if (!packageId) return;

    setIsLoadingPackage(true);
    try {
      const { data, status } = await api.get<PackageDTO>(
        `/package/${packageId}`
      );
      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao obter package por id');
      }

      setSelectedPackage(data);
      setCollectionCode(data.route?.id ?? '');
      setWeight(data.weight !== undefined ? String(data.weight) : '');
      toast.success('Package carregado com sucesso');
    } catch (error) {
      console.error('Erro ao obter package por id:', error);
      setSelectedPackage(null);
      toast.error('Package não encontrado para o código informado');
    } finally {
      setIsLoadingPackage(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!selectedPackage?.id) {
      toast.error('Carregue um package antes de salvar o peso');
      return;
    }

    const parsedWeight = Number(weight);
    if (!weight.trim() || Number.isNaN(parsedWeight)) {
      toast.error('Informe um peso válido');
      return;
    }

    setIsSavingWeight(true);
    try {
      const { status } = await api.patch(`/package/${selectedPackage.id}`, {
        weight: parsedWeight,
      });

      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao atualizar package');
      }

      setSelectedPackage((current) =>
        current ? { ...current, weight: parsedWeight } : current
      );
      toast.success('Peso salvo com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar package:', error);
      toast.error('Não foi possível salvar o peso');
    } finally {
      setIsSavingWeight(false);
    }
  };

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
                onBlur={handleScanCodeBlur}
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
                disabled={isLoadingPackage}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-24"
                onClick={handleSaveWeight}
                disabled={isSavingWeight || isLoadingPackage}
              >
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
        <CollectionRecord
          collectionCode={collectionCode}
          onCollectionCodeChange={setCollectionCode}
          selectedPackageId={selectedPackage?.id}
          brands={brands}
          brand={brand}
          onBrandChange={setBrand}
          quantity={quantity}
          onQuantityChange={setQuantity}
          quality={quality}
          onQualityChange={setQuality}
          season={season}
          onSeasonChange={setSeason}
          clothingType={clothingType}
          onClothingTypeChange={setClothingType}
        />

        <AddTriage />
      </div>
    </section>
  );
}
