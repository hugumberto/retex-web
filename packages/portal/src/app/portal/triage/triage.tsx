'use client';

import { Brand } from '@/app/types/brand';
import { PackageDTO, PackageStatus } from '@/app/types/package';
import { StorageUnitDTO } from '@/app/types/storage-unit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AddTriage, { TriageListItem } from './components/add-triage';
import CollectionRecord from './components/collection-record';
import PackageUserData from './components/package-user-data';

export default function Triage() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const scanCodeInputRef = useRef<HTMLInputElement>(null);

  const [scanCode, setScanCode] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageDTO | null>(
    null
  );
  const [isLoadingPackage, setIsLoadingPackage] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  const [isStartingTriage, setIsStartingTriage] = useState(false);
  const [isFinishingTriage, setIsFinishingTriage] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quality, setQuality] = useState<'GOOD' | 'MEDIUM' | 'BAD'>();
  const [season, setSeason] = useState<'SUMMER' | 'WINTER'>();
  const [clothingType, setClothingType] = useState<
    'UPPER_PART' | 'UNDER_PART'
  >();
  const [triageItems, setTriageItems] = useState<TriageListItem[]>([]);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [deletingItemIndex, setDeletingItemIndex] = useState<number | null>(
    null
  );
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
      const mappedItems = (data.items ?? []).map((packageItem) => {
        const fallbackBrandId = (packageItem as { brandId?: string }).brandId;
        const resolvedBrandId = packageItem.brand?.id ?? fallbackBrandId ?? '';
        const itemId = (packageItem as { id?: string }).id;

        return {
          id: itemId,
          packageId: data.id,
          quality: packageItem.quality,
          type: packageItem.type,
          season: packageItem.season,
          brandId: resolvedBrandId,
          quantity: packageItem.quantity,
        };
      });
      const mappedStorageUnits = (data.items ?? []).reduce<StorageUnitDTO[]>(
        (accumulator, packageItem) => {
          const storageUnit = packageItem.storageUnit;
          const brand = packageItem.brand;

          if (!storageUnit?.id || !brand?.id) {
            return accumulator;
          }

          if (
            accumulator.some(
              (currentStorageUnit) => currentStorageUnit.id === storageUnit.id
            )
          ) {
            return accumulator;
          }

          accumulator.push({
            ...storageUnit,
            brand,
          });
          return accumulator;
        },
        []
      );

      setTriageItems(mappedItems);
      setStorageUnits(mappedStorageUnits);
      toast.success('Pacote carregado com sucesso');
    } catch (error) {
      console.error('Erro ao obter pacote por id:', error);
      setSelectedPackage(null);
      setTriageItems([]);
      setStorageUnits([]);
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
        status: 'IN_HOUSE',
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

  const handleStartTriage = async () => {
    if (!selectedPackage?.id) {
      toast.error('Carregue um pacote antes de iniciar a triagem');
      return;
    }

    const parsedWeight = Number(weight);
    if (!weight.trim() || Number.isNaN(parsedWeight)) {
      toast.error('Informe um peso válido');
      return;
    }

    setIsStartingTriage(true);
    try {
      const { status } = await api.patch(`/package/${selectedPackage.id}`, {
        weight: parsedWeight,
        status: 'SCREENING',
      });

      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao iniciar triagem do pacote');
      }

      setSelectedPackage((current) =>
        current
          ? {
              ...current,
              weight: parsedWeight,
              status: PackageStatus.SCREENING,
            }
          : current
      );
      toast.success('Triagem iniciada com sucesso');
    } catch (error) {
      console.error('Erro ao iniciar triagem do pacote:', error);
      toast.error('Não foi possível iniciar a triagem');
    } finally {
      setIsStartingTriage(false);
    }
  };

  const handleAddTriageItem = async () => {
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

    setIsCreatingItem(true);
    try {
      const { data, status } = await api.post<{ id?: string }>('/items', item);
      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao criar item');
      }

      setTriageItems((current) => [...current, { ...item, id: data?.id }]);
      setBrandId('');
      setQuantity('');
      setQuality(undefined);
      setSeason(undefined);
      setClothingType(undefined);
      toast.success('Item adicionado à lista de triagem');
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast.error('Não foi possível adicionar o item');
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleDeleteTriageItem = async (
    item: TriageListItem,
    index: number
  ) => {
    if (!item.id) {
      toast.error('Este item não possui identificador para remoção');
      return;
    }

    setDeletingItemIndex(index);
    try {
      const { status } = await api.delete(`/items/${item.id}`);
      if (!isSuccessStatus(status)) {
        throw new Error('Erro ao remover item');
      }

      setTriageItems((current) =>
        current.filter((_, currentIndex) => currentIndex !== index)
      );
      toast.success('Item removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Não foi possível remover o item');
    } finally {
      setDeletingItemIndex(null);
    }
  };

  const resetTriageState = () => {
    setScanCode('');
    setWeight('');
    setSelectedPackage(null);
    setBrandId('');
    setQuantity('');
    setQuality(undefined);
    setSeason(undefined);
    setClothingType(undefined);
    setTriageItems([]);
    setStorageCode('');
    setStorageUnits([]);
  };

  const handleFinishTriage = async () => {
    if (!selectedPackage?.id) {
      toast.error('Carregue um pacote antes de finalizar a triagem');
      return;
    }

    if (triageItems.length === 0 || storageUnits.length === 0) {
      toast.error(
        'Adicione itens e unidades de armazenamento antes de finalizar'
      );
      return;
    }

    const itemBrandQualityKeys = new Set(
      triageItems.map((item) => `${item.brandId}::${item.quality}`)
    );
    const storageBrandQualityKeys = new Set(
      storageUnits.map(
        (storageUnit) => `${storageUnit.brand.id}::${storageUnit.quality}`
      )
    );

    const isValidCombination =
      [...itemBrandQualityKeys].every((key) =>
        storageBrandQualityKeys.has(key)
      ) &&
      [...storageBrandQualityKeys].every((key) =>
        itemBrandQualityKeys.has(key)
      );

    if (!isValidCombination) {
      toast.error('As combinações de marca e qualidade não conferem');
      return;
    }

    if (triageItems.some((item) => !item.id)) {
      toast.error('Todos os itens devem ser persistidos antes de finalizar');
      return;
    }

    const itemIds = triageItems
      .map((item) => item.id)
      .filter((itemId): itemId is string => Boolean(itemId));
    const storageUnitIds = storageUnits.map((storageUnit) => storageUnit.id);

    setIsFinishingTriage(true);
    try {
      const { status: bindStatus } = await api.post(
        '/items/bind-storage-units',
        {
          items: itemIds,
          storageUnits: storageUnitIds,
        }
      );

      if (!isSuccessStatus(bindStatus)) {
        throw new Error('Erro ao vincular itens às unidades de armazenamento');
      }

      const { status: packageStatus } = await api.patch(
        `/package/${selectedPackage.id}`,
        {
          status: PackageStatus.STOCKED,
        }
      );

      if (!isSuccessStatus(packageStatus)) {
        throw new Error('Erro ao atualizar status do pacote');
      }

      toast.success('Triagem finalizada com sucesso');
      resetTriageState();
      requestAnimationFrame(() => {
        scanCodeInputRef.current?.focus();
      });
    } catch (error) {
      console.error('Erro ao finalizar triagem:', error);
      toast.error('Não foi possível finalizar a triagem');
    } finally {
      setIsFinishingTriage(false);
    }
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

      const hasMatchingBrandInItems = triageItems.some(
        (item) => item.brandId && item.brandId === data.brand.id
      );

      if (!hasMatchingBrandInItems) {
        toast.error(
          'A marca desta unidade de armazenamento não está na lista de itens'
        );
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
    isCreatingItem ||
    !brandId ||
    !quantity.trim() ||
    !quality ||
    !season ||
    !clothingType;

  const weightAllowedStatuses = new Set<PackageStatus>([
    PackageStatus.CREATED,
    PackageStatus.OUT_OF_ZONE,
    PackageStatus.WAITING_FOR_COLLECTION,
    PackageStatus.COLLECTED,
    PackageStatus.IN_TRANSIT,
  ]);

  const isWeightStatusAllowed = selectedPackage
    ? weightAllowedStatuses.has(selectedPackage.status)
    : true;
  const isViewMode = selectedPackage?.status === PackageStatus.STOCKED;

  const isSaveDisabled =
    isSavingWeight ||
    isLoadingPackage ||
    !selectedPackage ||
    !weight.trim() ||
    !isWeightStatusAllowed ||
    isViewMode;
  const isStartTriageDisabled =
    isStartingTriage ||
    isLoadingPackage ||
    !selectedPackage ||
    !weight.trim() ||
    isViewMode;

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
                ref={scanCodeInputRef}
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
                disabled={
                  isLoadingPackage || !isWeightStatusAllowed || isViewMode
                }
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
              <Button
                type="button"
                variant="secondary"
                className="min-w-32"
                onClick={handleStartTriage}
                disabled={isStartTriageDisabled}
              >
                Iniciar Triagem
              </Button>
            </div>
          </div>
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
          isViewMode={isViewMode}
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
          onDeleteItem={handleDeleteTriageItem}
          deletingItemIndex={deletingItemIndex}
          isAddDisabled={isAddFormInvalid}
        />

        <AddTriage
          items={triageItems}
          brands={brands}
          isViewMode={isViewMode}
          storageCode={storageCode}
          onStorageCodeChange={setStorageCode}
          onStorageCodeSubmit={handleStorageCodeSubmit}
          storageUnits={storageUnits}
          isLoadingStorageUnit={isLoadingStorageUnit}
          onDeleteItem={handleDeleteTriageItem}
          deletingItemIndex={deletingItemIndex}
          onFinishTriage={handleFinishTriage}
          isFinishingTriage={isFinishingTriage}
        />
      </div>
    </section>
  );
}
