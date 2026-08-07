'use client';

import { useTranslations } from 'next-intl';
import { Brand } from '@/app/types/brand';
import { CollectionRequestDTO, CollectionRequestStatus } from '@/app/types/collection-request';
import { StorageUnitDTO } from '@/app/types/storage-unit';
import { CollectionRequestBagDTO, TriageResponse } from '@/app/types/collection-request-bag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AddTriage, { buildTriageKey, TriageListItem } from './components/add-triage';
import CollectionRecord from './components/collection-record';
import CollectionRequestUserData from './components/collection-request-user-data';

// Extrai a mensagem de erro do servidor (string ou array do class-validator).
// O fallback é passado já traduzido por quem chama.
const finishErrorMessage = (error: unknown, fallback: string): string => {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string') return message;
  return fallback;
};

// Marcas por ordem alfabética (case-insensitive, pt-PT).
const sortBrands = (list: Brand[]) =>
  [...list].sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '', 'pt', { sensitivity: 'base' })
  );

export default function Triage() {
  const t = useTranslations('triage');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const tBrand = useTranslations('brand');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const scanCodeInputRef = useRef<HTMLInputElement>(null);
  const bagInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  const [scanCode, setScanCode] = useState('');
  const [selectedCollectionRequest, setSelectedCollectionRequest] = useState<CollectionRequestDTO | null>(
    null
  );
  const [bags, setBags] = useState<CollectionRequestBagDTO[]>([]);
  const [activeBagId, setActiveBagId] = useState<string | null>(null);
  // Consulta/escaneamento do saco + peso do saco ativo (um por vez).
  const [bagCode, setBagCode] = useState('');
  const [bagWeight, setBagWeight] = useState('');
  const [isProcessingBag, setIsProcessingBag] = useState(false);
  const [isLoadingCollectionRequest, setIsLoadingCollectionRequest] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [isFinishingTriage, setIsFinishingTriage] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quality, setQuality] = useState<'GOOD' | 'MEDIUM' | 'BAD'>();
  const [season, setSeason] = useState<'SUMMER' | 'WINTER'>();
  const [clothingType, setClothingType] = useState<
    'UPPER_PART' | 'UNDER_PART'
  >();
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>();
  const [ageGroup, setAgeGroup] = useState<'ADULT' | 'CHILD'>();
  const [triageItems, setTriageItems] = useState<TriageListItem[]>([]);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [storageCode, setStorageCode] = useState('');
  const [storageUnits, setStorageUnits] = useState<StorageUnitDTO[]>([]);
  const [isLoadingStorageUnit, setIsLoadingStorageUnit] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const { data, status } = await api.get<Brand[]>('/brand');
        if (!isSuccessStatus(status)) throw new Error(t('brandsLoadError'));
        setBrands(sortBrands(data));
      } catch (error) {
        console.error('Erro ao buscar marcas:', error);
        toast.error('Não foi possível carregar as marcas');
      }
    };

    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/triage' }]);
    fetchBrands();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle, t]);

  // Cria a marca escrita na triagem sem sair do ecrã: persiste, junta-a à lista
  // disponível (mantendo a ordem alfabética) e deixa-a selecionada.
  const handleCreateBrand = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      try {
        const { data, status } = await api.post<Brand>('/brand', {
          name: trimmed,
        });
        if (!isSuccessStatus(status)) throw new Error();
        setBrands((prev) => sortBrands([...prev, data]));
        setBrandId(data.id);
        toast.success(tBrand('createSuccess'));
        return data.id;
      } catch (error) {
        // 409 = já existe uma marca com este nome (comparação sem espaços/caixa).
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        toast.error(
          status === 409 ? tBrand('duplicateName') : tBrand('createError')
        );
        return null;
      }
    },
    [tBrand]
  );

  const isViewMode = selectedCollectionRequest?.status === CollectionRequestStatus.STOCKED;
  const allProcessed =
    bags.length > 0 && bags.every((bag) => bag.processedAt != null);
  const activeItems = triageItems.filter(
    (item) => item.bagId === activeBagId
  );
  const processedCount = bags.filter((bag) => bag.processedAt != null).length;
  // Mostra todos os sacos: processados, o que está em processamento (ativo)
  // e os pendentes (ainda por processar).
  const visibleBags = bags;
  const activeBag = bags.find((bag) => bag.id === activeBagId) ?? null;

  const handleScanCodeBlur = async () => {
    const code = scanCode.trim();
    if (!code || selectedCollectionRequest) return;

    setIsLoadingCollectionRequest(true);
    try {
      const { data, status } = await api.get<TriageResponse>(
        `/triage/${code}`
      );
      if (!isSuccessStatus(status)) throw new Error(t('lookupError'));

      setSelectedCollectionRequest(data.collectionRequest);
      setBags(data.bags ?? []);
      setActiveBagId(null);
      setBagCode('');
      setBagWeight('');

      const mappedItems = (data.collectionRequest.items ?? []).map((collectionRequestItem) => ({
        id: collectionRequestItem.id,
        collectionRequestId: data.collectionRequest.id,
        bagId: collectionRequestItem.bag?.id,
        quality: collectionRequestItem.quality,
        type: collectionRequestItem.type,
        season: collectionRequestItem.season,
        sex: collectionRequestItem.sex,
        ageGroup: collectionRequestItem.ageGroup,
        brandId: collectionRequestItem.brand?.id ?? '',
        quantity: collectionRequestItem.quantity,
      })) as TriageListItem[];

      const mappedStorageUnits = (data.collectionRequest.items ?? []).reduce<
        StorageUnitDTO[]
      >((acc, collectionRequestItem) => {
        const storageUnit = collectionRequestItem.storageUnit;
        if (!storageUnit?.id) return acc;
        if (acc.some((current) => current.id === storageUnit.id)) return acc;
        acc.push(storageUnit);
        return acc;
      }, []);

      setTriageItems(mappedItems);
      setStorageUnits(mappedStorageUnits);
      toast.success(t('requestLoaded'));
      // Foco vai para o campo de código do saco.
      requestAnimationFrame(() => bagInputRef.current?.focus());
    } catch (error) {
      console.error('Erro ao consultar triagem:', error);
      setSelectedCollectionRequest(null);
      setBags([]);
      setTriageItems([]);
      setStorageUnits([]);
      toast.error(t('requestNotFound'));
      // Não encontrou: limpa e mantém o foco no campo da solicitação.
      setScanCode('');
      requestAnimationFrame(() => scanCodeInputRef.current?.focus());
    } finally {
      setIsLoadingCollectionRequest(false);
    }
  };

  const collectionRequestWeight = bags.reduce(
    (sum, bag) => sum + Number(bag.weight ?? 0),
    0
  );

  const clearItemForm = () => {
    setBrandId('');
    setQuantity('');
    setQuality(undefined);
    setSeason(undefined);
    setClothingType(undefined);
    setSex(undefined);
    setAgeGroup(undefined);
  };

  // Escaneia/consulta o saco localmente contra os sacos da solicitação.
  const handleBagScan = () => {
    const code = bagCode.trim();
    if (!code || !selectedCollectionRequest) return;

    const bag = bags.find(
      (q) => q.token === code || q.friendlyCode === code
    );
    if (!bag) {
      toast.error(t('bagNotInRequest'));
      setBagCode('');
      requestAnimationFrame(() => bagInputRef.current?.focus());
      return;
    }
    if (bag.processedAt != null) {
      toast.error(t('bagAlreadyProcessed'));
      setBagCode('');
      requestAnimationFrame(() => bagInputRef.current?.focus());
      return;
    }

    setActiveBagId(bag.id);
    setBagWeight('');
    clearItemForm();
    setBagCode('');
    requestAnimationFrame(() => weightInputRef.current?.focus());
  };

  const handleAddTriageItem = async () => {
    if (!selectedCollectionRequest?.id || !activeBagId) {
      toast.error(t('selectBagFirst'));
      return;
    }
    if (!brandId) {
      toast.error(t('selectBrand'));
      return;
    }
    if (!quality || !season || !clothingType || !sex || !ageGroup) {
      toast.error(t('selectAttributes'));
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      toast.error(t('invalidQuantity'));
      return;
    }

    const payload = {
      collectionRequestId: selectedCollectionRequest.id,
      bagId: activeBagId,
      quality,
      type: clothingType,
      season,
      sex,
      ageGroup,
      brandId,
      quantity: parsedQuantity,
    };

    setIsCreatingItem(true);
    try {
      const { data, status } = await api.post<{ id?: string }>(
        '/items',
        payload
      );
      if (!isSuccessStatus(status)) throw new Error(t('itemCreateError'));

      setTriageItems((current) => [
        ...current,
        { ...payload, id: data?.id } as TriageListItem,
      ]);
      clearItemForm();
      toast.success(t('itemAdded'));
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast.error('Não foi possível adicionar o item');
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleDeleteTriageItem = async (item: TriageListItem) => {
    if (!item.id) {
      toast.error(t('itemMissingId'));
      return;
    }
    setDeletingItemId(item.id);
    try {
      const { status } = await api.delete(`/items/${item.id}`);
      if (!isSuccessStatus(status)) throw new Error(t('itemRemoveError'));
      setTriageItems((current) => current.filter((it) => it.id !== item.id));
      toast.success(t('itemRemoved'));
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error(t('itemRemoveError'));
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleProcessBag = async () => {
    if (!activeBagId) return;
    const parsedWeight = Number(bagWeight);
    if (
      !bagWeight.trim() ||
      Number.isNaN(parsedWeight) ||
      parsedWeight < 0
    ) {
      toast.error(t('invalidBagWeight'));
      return;
    }

    setIsProcessingBag(true);
    try {
      const { status } = await api.post(`/triage/bag/${activeBagId}/process`, {
        weight: parsedWeight,
      });
      if (!isSuccessStatus(status)) throw new Error(t('bagProcessError'));

      // Atualiza o saco + o peso do pacote localmente (evita novo GET).
      setBags((current) =>
        current.map((bag) =>
          bag.id === activeBagId
            ? {
                ...bag,
                weight: parsedWeight,
                processedAt: new Date().toISOString(),
              }
            : bag
        )
      );
      setSelectedCollectionRequest((current) =>
        current ? { ...current, status: CollectionRequestStatus.SCREENING } : current
      );
      setActiveBagId(null);
      setBagWeight('');
      clearItemForm();
      toast.success(t('bagProcessed'));
      requestAnimationFrame(() => bagInputRef.current?.focus());
    } catch (error) {
      console.error('Erro ao processar saco:', error);
      toast.error(t('bagProcessError'));
    } finally {
      setIsProcessingBag(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedCollectionRequest?.id) return;
    setIsSavingProgress(true);
    try {
      // Persiste os vínculos item→unidade de armazenamento já escaneados
      // (sem finalizar), para que reapareçam ao reconsultar a solicitação.
      const itemIds = triageItems
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id));
      const storageUnitIds = storageUnits.map((unit) => unit.id);
      if (itemIds.length > 0 && storageUnitIds.length > 0) {
        const { status: bindStatus } = await api.post(
          '/items/bind-storage-units',
          { items: itemIds, storageUnits: storageUnitIds, finalize: false }
        );
        if (!isSuccessStatus(bindStatus)) {
          throw new Error(t('storageUnitsSaveError'));
        }
      }

      const { status } = await api.patch(`/collection-request/${selectedCollectionRequest.id}`, {
        status: CollectionRequestStatus.SCREENING,
      });
      if (!isSuccessStatus(status)) throw new Error(t('progressSaveError'));
      setSelectedCollectionRequest((current) =>
        current ? { ...current, status: CollectionRequestStatus.SCREENING } : current
      );
      toast.success(t('progressSaved'));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      toast.error(t('progressSaveError'));
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleStorageCodeSubmit = async () => {
    const storageUnitId = storageCode.trim();
    if (!storageUnitId) {
      toast.error(t('storageCodeRequired'));
      return;
    }
    setIsLoadingStorageUnit(true);
    try {
      const { data, status } = await api.get<StorageUnitDTO>(
        `/storage-unit/${storageUnitId}`
      );
      if (!isSuccessStatus(status)) throw new Error(t('storageUnitFetchError'));
      if (storageUnits.some((unit) => unit.id === data.id)) {
        toast.error(t('storageUnitAlreadyAdded'));
        return;
      }
      const storageKey = buildTriageKey(data);
      const hasMatchingItem = triageItems.some(
        (item) => buildTriageKey(item) === storageKey
      );
      if (!hasMatchingItem) {
        toast.error(
          t('storageUnitMismatch')
        );
        return;
      }
      setStorageUnits((current) => [...current, data]);
      setStorageCode('');
      toast.success(t('storageUnitAdded'));
    } catch (error) {
      console.error('Erro ao obter unidade de armazenamento:', error);
      toast.error(t('storageUnitNotFound'));
    } finally {
      setIsLoadingStorageUnit(false);
    }
  };

  const resetTriageState = () => {
    setScanCode('');
    setSelectedCollectionRequest(null);
    setBags([]);
    setActiveBagId(null);
    setBagCode('');
    setBagWeight('');
    clearItemForm();
    setTriageItems([]);
    setStorageCode('');
    setStorageUnits([]);
  };

  const handleFinishTriage = async () => {
    if (!selectedCollectionRequest?.id) return;
    if (!allProcessed) {
      toast.error(t('processBagsFirst'));
      return;
    }
    if (triageItems.length === 0) {
      toast.error(t('addItemsFirst'));
      return;
    }
    if (storageUnits.filter((unit) => !!unit?.id).length === 0) {
      toast.error(t('addStorageUnitsFirst'));
      return;
    }
    if (triageItems.some((item) => !item.id)) {
      toast.error(t('persistItemsFirst'));
      return;
    }
    // Cada combinação de item precisa de uma unidade compatível (mesmo gate do
    // servidor). Evita o round-trip: dá mensagem imediata em vez de erro 400.
    const storageUnitKeys = new Set(
      storageUnits
        .filter((unit) => !!unit?.id)
        .map((unit) => buildTriageKey(unit))
    );
    if (triageItems.some((item) => !storageUnitKeys.has(buildTriageKey(item)))) {
      toast.error(
        t('storageUnitPerCombination')
      );
      return;
    }
    const itemIds = triageItems
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id));
    const storageUnitIds = storageUnits
      .map((unit) => unit.id)
      .filter((id): id is string => Boolean(id));

    setIsFinishingTriage(true);
    try {
      const { status: bindStatus } = await api.post(
        '/items/bind-storage-units',
        { items: itemIds, storageUnits: storageUnitIds }
      );
      if (!isSuccessStatus(bindStatus)) {
        throw new Error(t('bindItemsError'));
      }

      const { status: collectionRequestStatus } = await api.patch(
        `/collection-request/${selectedCollectionRequest.id}`,
        { status: CollectionRequestStatus.STOCKED }
      );
      if (!isSuccessStatus(collectionRequestStatus)) {
        throw new Error(t('statusUpdateError'));
      }

      toast.success(t('finishSuccess'));
      resetTriageState();
      requestAnimationFrame(() => scanCodeInputRef.current?.focus());
    } catch (error) {
      console.error('Erro ao finalizar triagem:', error);
      toast.error(finishErrorMessage(error, t('finishError')));
    } finally {
      setIsFinishingTriage(false);
    }
  };

  const isAddFormInvalid =
    !selectedCollectionRequest ||
    !activeBagId ||
    isLoadingCollectionRequest ||
    isCreatingItem ||
    !brandId ||
    !quantity.trim() ||
    !quality ||
    !season ||
    !clothingType ||
    !sex ||
    !ageGroup;

  return (
    <section id="triage-page" className="flex flex-col gap-6">
      {/* Consulta */}
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t('lookupCodeLabel')}
        </label>
        <div className="flex flex-wrap items-center gap-3">
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
            placeholder={t('lookupCodePlaceholder')}
            autoFocus
            disabled={!!selectedCollectionRequest || isLoadingCollectionRequest}
            className="max-w-md"
          />
          {selectedCollectionRequest && (
            <>
              <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                {selectedCollectionRequest.friendlyCode ?? selectedCollectionRequest.id}
              </span>
              <span className="text-sm text-secondary">
                {t('totalWeight')} <strong>{collectionRequestWeight.toFixed(2)} kg</strong>
              </span>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {tStatus(selectedCollectionRequest.status)}
              </span>
            </>
          )}
        </div>
      </div>

      {selectedCollectionRequest && (
        <CollectionRequestUserData
          user={selectedCollectionRequest.user}
          address={selectedCollectionRequest.address}
        />
      )}

      {/* Consulta do saco (escaneamento) + peso do saco */}
      {selectedCollectionRequest && !isViewMode && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <label className="mb-1 block text-sm font-medium text-secondary">
            {t('bagCodeLabel')}
          </label>
          <Input
            ref={bagInputRef}
            value={bagCode}
            onChange={(e) => setBagCode(e.target.value)}
            onBlur={handleBagScan}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleBagScan();
              }
            }}
            placeholder={t('bagCodePlaceholder')}
            disabled={!!activeBagId}
            className="max-w-md"
          />

          {activeBagId && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-secondary">
                Peso do saco{' '}
                <strong className="text-secondary">
                  {activeBag?.friendlyCode}
                </strong>{' '}
                (kg) *
              </label>
              <Input
                ref={weightInputRef}
                type="number"
                min={0}
                value={bagWeight}
                onChange={(e) => setBagWeight(e.target.value)}
                className="max-w-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Sacos (QR codes) — processados, em processamento e pendentes */}
      {selectedCollectionRequest && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary">
              {t('bagsSection')}
            </h2>
            <span className="text-sm font-medium text-secondary">
              Processados: {processedCount} / {bags.length} sacos
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('code')}</TableHead>
                <TableHead>{tCommon('weightKg')}</TableHead>
                <TableHead>{tCommon('items')}</TableHead>
                <TableHead>{tCommon('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleBags.length > 0 ? (
                visibleBags.map((bag) => {
                  // Soma das quantidades dos itens vinculados a este saco.
                  const itemsCount = triageItems
                    .filter((item) => item.bagId === bag.id)
                    .reduce(
                      (sum, item) => sum + (Number(item.quantity) || 0),
                      0
                    );
                  const processed = bag.processedAt != null;
                  const isActive = bag.id === activeBagId;
                  // O peso em edição (bagWeight) só se aplica ao saco ativo.
                  const rawWeight = processed
                    ? bag.weight
                    : isActive
                    ? bagWeight
                    : null;
                  const numWeight = Number(rawWeight);
                  const displayWeight =
                    rawWeight != null &&
                    `${rawWeight}`.trim() !== '' &&
                    Number.isFinite(numWeight)
                      ? numWeight.toFixed(2)
                      : '-';
                  const stateClass = processed
                    ? 'bg-green-100 text-green-800'
                    : isActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-700';
                  const stateLabel = processed
                    ? 'Processado'
                    : isActive
                    ? t('inProgress')
                    : 'Pendente';
                  return (
                    <TableRow key={bag.id}>
                      <TableCell className="font-medium">
                        {bag.friendlyCode}
                      </TableCell>
                      <TableCell>{displayWeight}</TableCell>
                      <TableCell>{itemsCount}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold ${stateClass}`}
                        >
                          {stateLabel}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    {t('noBags')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Itens do saco ativo */}
      {selectedCollectionRequest && activeBagId && !isViewMode && (
        <div className="flex flex-col gap-6">
          <CollectionRecord
            selectedCollectionRequestId={selectedCollectionRequest.id}
            isViewMode={isViewMode}
            items={activeItems}
            brands={brands}
            brandId={brandId}
            onBrandChange={setBrandId}
            onCreateBrand={handleCreateBrand}
            quantity={quantity}
            onQuantityChange={setQuantity}
            quality={quality}
            onQualityChange={setQuality}
            season={season}
            onSeasonChange={setSeason}
            clothingType={clothingType}
            onClothingTypeChange={setClothingType}
            sex={sex}
            onSexChange={setSex}
            ageGroup={ageGroup}
            onAgeGroupChange={setAgeGroup}
            onAdd={handleAddTriageItem}
            onDeleteItem={(item) => handleDeleteTriageItem(item)}
            deletingItemIndex={
              activeItems.findIndex((it) => it.id === deletingItemId) < 0
                ? null
                : activeItems.findIndex((it) => it.id === deletingItemId)
            }
            isAddDisabled={isAddFormInvalid}
          />
        </div>
      )}

      {/* Unidades de armazenamento */}
      {selectedCollectionRequest && (
        <AddTriage
          items={triageItems}
          brands={brands}
          isViewMode={isViewMode}
          storageCode={storageCode}
          onStorageCodeChange={setStorageCode}
          onStorageCodeSubmit={handleStorageCodeSubmit}
          storageUnits={storageUnits}
          isLoadingStorageUnit={isLoadingStorageUnit}
          onDeleteItem={(item) => handleDeleteTriageItem(item)}
          deletingItemIndex={null}
          onFinishTriage={handleFinishTriage}
          isFinishingTriage={isFinishingTriage}
          disableFinish={!allProcessed}
          hideFinishButton
        />
      )}

      {/* Espaço para a barra flutuante não cobrir o conteúdo */}
      {selectedCollectionRequest && <div className="h-24" />}

      {/* Barra flutuante de ações */}
      {selectedCollectionRequest && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-secondary/25 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            {activeBagId && !isViewMode && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleProcessBag}
                disabled={isProcessingBag || !bagWeight.trim()}
              >
                {t('saveBag')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveProgress}
              disabled={isSavingProgress || isViewMode}
            >
              {t('saveProgress')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleFinishTriage}
              disabled={isFinishingTriage || isViewMode}
            >
              {t('finish')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetTriageState}
            >
              {t('newLookup')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
