'use client';

import { Brand } from '@/app/types/brand';
import { PackageDTO } from '@/app/types/package';
import { StorageUnitDTO } from '@/app/types/storage-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddTriage, { TriageListItem } from './components/add-triage';
import CollectionRecord from './components/collection-record';
import PackageUserData from './components/package-user-data';

export default function Triage() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [scanCode, setScanCode] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageDTO | null>(
    null
  );
  const [isLoadingPackage, setIsLoadingPackage] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quality, setQuality] = useState<'GOOD' | 'MEDIUM' | 'BAD'>();
  const [season, setSeason] = useState<'SUMMER' | 'WINTER'>();
  const [clothingType, setClothingType] = useState<
    'UPPER_PART' | 'UNDER_PART'
  >();
  const [triageItems, setTriageItems] = useState<TriageListItem[]>([]);
  const [storageCode, setStorageCode] = useState('');
  const [storageUnits, setStorageUnits] = useState<StorageUnitDTO[]>([]);
  const [isLoadingStorageUnit, setIsLoadingStorageUnit] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, status } = await api.get<Brand[]>('/brand');
        if (!isSuccessStatus(status)) {
          throw new Error('Erro ao buscar marcas');
        }

        setBrands(data);
      } catch (error) {
        console.error('Erro ao buscar marcas:', error);
        toast.error('Não foi possível carregar as marcas');
      }
    };

    setPageTitle('Triagem');
    setBreadcrumbs([{ label: 'Triagem', href: '/portal/triage' }]);
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
        throw new Error('Erro ao obter pacote por id');
      }

      setSelectedPackage(data);
      setWeight(data.weight !== undefined ? String(data.weight) : '');
      toast.success('Pacote carregado com sucesso');
    } catch (error) {
      console.error('Erro ao obter pacote por id:', error);
      setSelectedPackage(null);
      toast.error('Pacote não encontrado para o código informado');
    } finally {
      setIsLoadingPackage(false);
    }
  };

  const handleSaveWeight = async () => {
    if (!selectedPackage?.id) {
      toast.error('Carregue um pacote antes de salvar o peso');
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
        throw new Error('Erro ao atualizar pacote');
      }

      setSelectedPackage((current) =>
        current ? { ...current, weight: parsedWeight } : current
      );
      toast.success('Peso salvo com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar pacote:', error);
      toast.error('Não foi possível salvar o peso');
    } finally {
      setIsSavingWeight(false);
    }
  };

  const handleAddTriageItem = () => {
    if (!selectedPackage?.id) {
      toast.error('Carregue um pacote antes de adicionar o item');
      return;
    }

    if (!brandId) {
      toast.error('Selecione uma marca');
      return;
    }

    if (!quality || !season || !clothingType) {
      toast.error('Selecione qualidade, estação e tipo de roupa');
      return;
    }

    if (!quantity.trim()) {
      toast.error('Informe a quantidade');
      return;
    }

    const parsedQuantity = Number(quantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    const item: TriageListItem = {
      packageId: selectedPackage.id,
      quality,
      type: clothingType,
      season,
      brandId,
      quantity: parsedQuantity,
    };

    const isDuplicatedItem = triageItems.some(
      (existingItem) =>
        existingItem.packageId === item.packageId &&
        existingItem.brandId === item.brandId &&
        existingItem.quality === item.quality &&
        existingItem.type === item.type &&
        existingItem.season === item.season
    );

    if (isDuplicatedItem) {
      toast.error('Este item já foi adicionado à lista de triagem');
      return;
    }

    setTriageItems((current) => [...current, item]);
    setBrandId('');
    setQuantity('');
    setQuality(undefined);
    setSeason(undefined);
    setClothingType(undefined);
    toast.success('Item adicionado à lista de triagem');
  };

  const handleStorageCodeSubmit = async () => {
    const storageUnitId = storageCode.trim();
    if (!storageUnitId) {
      toast.error('Informe o código do armazenamento');
      return;
    }

    setIsLoadingStorageUnit(true);
    try {
      const { data, status } = await api.get<StorageUnitDTO>(
        `/storage-unit/${storageUnitId}`
      );

      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao obter unidade de armazenamento por id');
      }

      if (storageUnits.some((unit) => unit.id === data.id)) {
        toast.error('Esta unidade de armazenamento já foi adicionada');
        return;
      }

      setStorageUnits((current) => [...current, data]);
      setStorageCode('');
      toast.success('Unidade de armazenamento adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao obter unidade de armazenamento por id:', error);
      toast.error(
        'Unidade de armazenamento não encontrada para o código informado'
      );
    } finally {
      setIsLoadingStorageUnit(false);
    }
  };

  const isAddFormInvalid =
    !selectedPackage ||
    isLoadingPackage ||
    !brandId ||
    !quantity.trim() ||
    !quality ||
    !season ||
    !clothingType;

  const isSaveDisabled =
    isSavingWeight || isLoadingPackage || !selectedPackage || !weight.trim();

  return (
    <section id="triage-page" className="flex flex-col gap-6">
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">
                Código *
              </label>
              <Input
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onBlur={handleScanCodeBlur}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await handleScanCodeBlur();
                  }
                }}
                placeholder="Digite o código"
                autoFocus
                disabled={!!selectedPackage || isLoadingPackage}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-secondary">
                Peso *
              </label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Peso"
                disabled={isLoadingPackage}
                required
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-24"
                onClick={handleSaveWeight}
                disabled={isSaveDisabled}
              >
                Guardar
              </Button>
              <Button type="button" variant="secondary" className="min-w-32">
                Iniciar Triagem
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
                LER CÓDIGO
              </span>
            </div>
          </Button>
        </div>
      </div>

      <div>
        <PackageUserData
          user={selectedPackage?.user}
          address={selectedPackage?.address}
        />
      </div>

      <div className="flex flex-col gap-6">
        <CollectionRecord
          selectedPackageId={selectedPackage?.id}
          items={triageItems}
          brands={brands}
          brandId={brandId}
          onBrandChange={setBrandId}
          quantity={quantity}
          onQuantityChange={setQuantity}
          quality={quality}
          onQualityChange={setQuality}
          season={season}
          onSeasonChange={setSeason}
          clothingType={clothingType}
          onClothingTypeChange={setClothingType}
          onAdd={handleAddTriageItem}
          isAddDisabled={isAddFormInvalid}
        />

        <AddTriage
          items={triageItems}
          brands={brands}
          storageCode={storageCode}
          onStorageCodeChange={setStorageCode}
          onStorageCodeSubmit={handleStorageCodeSubmit}
          storageUnits={storageUnits}
          isLoadingStorageUnit={isLoadingStorageUnit}
        />
      </div>
    </section>
  );
}
