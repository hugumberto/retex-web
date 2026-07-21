'use client';

import { Brand } from '@/app/types/brand';
import { PackageDTO, PackageStatus } from '@/app/types/package';
import { STATUS_LABEL } from '@/lib/package-status';
import { StorageUnitDTO } from '@/app/types/storage-unit';
import { QrCodeDTO, TriageResponse } from '@/app/types/qr-code';
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
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import AddTriage, { buildTriageKey, TriageListItem } from './components/add-triage';
import CollectionRecord from './components/collection-record';
import PackageUserData from './components/package-user-data';

// Extrai a mensagem de erro do servidor (string ou array do class-validator).
const finishErrorMessage = (error: unknown): string => {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  if (typeof message === 'string') return message;
  return 'Não foi possível finalizar a triagem';
};

export default function Triage() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const scanCodeInputRef = useRef<HTMLInputElement>(null);
  const volumeInputRef = useRef<HTMLInputElement>(null);
  const weightInputRef = useRef<HTMLInputElement>(null);

  const [scanCode, setScanCode] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<PackageDTO | null>(
    null
  );
  const [qrCodes, setQrCodes] = useState<QrCodeDTO[]>([]);
  const [activeQrId, setActiveQrId] = useState<string | null>(null);
  // Consulta/escaneamento do volume + peso do volume ativo (um por vez).
  const [volumeCode, setVolumeCode] = useState('');
  const [volumeWeight, setVolumeWeight] = useState('');
  const [isProcessingVolume, setIsProcessingVolume] = useState(false);
  const [isLoadingPackage, setIsLoadingPackage] = useState(false);
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
        if (!isSuccessStatus(status)) throw new Error('Erro ao buscar marcas');
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

  const isViewMode = selectedPackage?.status === PackageStatus.STOCKED;
  const allProcessed =
    qrCodes.length > 0 && qrCodes.every((qr) => qr.processedAt != null);
  const activeItems = triageItems.filter(
    (item) => item.qrCodeId === activeQrId
  );
  const processedCount = qrCodes.filter((qr) => qr.processedAt != null).length;
  // Só os processados e o que está em processamento (ativo); nunca os pendentes.
  const visibleVolumes = qrCodes.filter(
    (qr) => qr.processedAt != null || qr.id === activeQrId
  );
  const activeQr = qrCodes.find((qr) => qr.id === activeQrId) ?? null;

  const handleScanCodeBlur = async () => {
    const code = scanCode.trim();
    if (!code || selectedPackage) return;

    setIsLoadingPackage(true);
    try {
      const { data, status } = await api.get<TriageResponse>(
        `/triage/${code}`
      );
      if (!isSuccessStatus(status)) throw new Error('Erro ao consultar');

      setSelectedPackage(data.package);
      setQrCodes(data.qrCodes ?? []);
      setActiveQrId(null);
      setVolumeCode('');
      setVolumeWeight('');

      const mappedItems = (data.package.items ?? []).map((packageItem) => ({
        id: packageItem.id,
        packageId: data.package.id,
        qrCodeId: packageItem.qrCode?.id,
        quality: packageItem.quality,
        type: packageItem.type,
        season: packageItem.season,
        sex: packageItem.sex,
        ageGroup: packageItem.ageGroup,
        brandId: packageItem.brand?.id ?? '',
        quantity: packageItem.quantity,
      })) as TriageListItem[];

      const mappedStorageUnits = (data.package.items ?? []).reduce<
        StorageUnitDTO[]
      >((acc, packageItem) => {
        const storageUnit = packageItem.storageUnit;
        if (!storageUnit?.id) return acc;
        if (acc.some((current) => current.id === storageUnit.id)) return acc;
        acc.push(storageUnit);
        return acc;
      }, []);

      setTriageItems(mappedItems);
      setStorageUnits(mappedStorageUnits);
      toast.success('Solicitação carregada com sucesso');
      // Foco vai para o campo de código do volume.
      requestAnimationFrame(() => volumeInputRef.current?.focus());
    } catch (error) {
      console.error('Erro ao consultar triagem:', error);
      setSelectedPackage(null);
      setQrCodes([]);
      setTriageItems([]);
      setStorageUnits([]);
      toast.error('Nenhuma solicitação encontrada para o código informado');
      // Não encontrou: limpa e mantém o foco no campo da solicitação.
      setScanCode('');
      requestAnimationFrame(() => scanCodeInputRef.current?.focus());
    } finally {
      setIsLoadingPackage(false);
    }
  };

  const packageWeight = qrCodes.reduce(
    (sum, qr) => sum + Number(qr.weight ?? 0),
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

  // Escaneia/consulta o volume localmente contra os volumes da solicitação.
  const handleVolumeScan = () => {
    const code = volumeCode.trim();
    if (!code || !selectedPackage) return;

    const qr = qrCodes.find(
      (q) => q.token === code || q.friendlyCode === code
    );
    if (!qr) {
      toast.error('Volume não pertence a esta solicitação');
      setVolumeCode('');
      requestAnimationFrame(() => volumeInputRef.current?.focus());
      return;
    }
    if (qr.processedAt != null) {
      toast.error('Volume já processado');
      setVolumeCode('');
      requestAnimationFrame(() => volumeInputRef.current?.focus());
      return;
    }

    setActiveQrId(qr.id);
    setVolumeWeight('');
    clearItemForm();
    setVolumeCode('');
    requestAnimationFrame(() => weightInputRef.current?.focus());
  };

  const handleAddTriageItem = async () => {
    if (!selectedPackage?.id || !activeQrId) {
      toast.error('Selecione um volume antes de adicionar o item');
      return;
    }
    if (!brandId) {
      toast.error('Selecione uma marca');
      return;
    }
    if (!quality || !season || !clothingType || !sex || !ageGroup) {
      toast.error('Selecione qualidade, estação, tipo, sexo e faixa etária');
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!quantity.trim() || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      toast.error('Informe uma quantidade válida');
      return;
    }

    const payload = {
      packageId: selectedPackage.id,
      qrCodeId: activeQrId,
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
      if (!isSuccessStatus(status)) throw new Error('Erro ao criar item');

      setTriageItems((current) => [
        ...current,
        { ...payload, id: data?.id } as TriageListItem,
      ]);
      clearItemForm();
      toast.success('Item adicionado ao volume');
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast.error('Não foi possível adicionar o item');
    } finally {
      setIsCreatingItem(false);
    }
  };

  const handleDeleteTriageItem = async (item: TriageListItem) => {
    if (!item.id) {
      toast.error('Este item não possui identificador para remoção');
      return;
    }
    setDeletingItemId(item.id);
    try {
      const { status } = await api.delete(`/items/${item.id}`);
      if (!isSuccessStatus(status)) throw new Error('Erro ao remover item');
      setTriageItems((current) => current.filter((it) => it.id !== item.id));
      toast.success('Item removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast.error('Não foi possível remover o item');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleProcessVolume = async () => {
    if (!activeQrId) return;
    const parsedWeight = Number(volumeWeight);
    if (
      !volumeWeight.trim() ||
      Number.isNaN(parsedWeight) ||
      parsedWeight < 0
    ) {
      toast.error('Informe um peso válido para o volume');
      return;
    }

    setIsProcessingVolume(true);
    try {
      const { status } = await api.post(`/triage/qr/${activeQrId}/process`, {
        weight: parsedWeight,
      });
      if (!isSuccessStatus(status)) throw new Error('Erro ao processar volume');

      // Atualiza o volume + o peso do pacote localmente (evita novo GET).
      setQrCodes((current) =>
        current.map((qr) =>
          qr.id === activeQrId
            ? {
                ...qr,
                weight: parsedWeight,
                processedAt: new Date().toISOString(),
              }
            : qr
        )
      );
      setSelectedPackage((current) =>
        current ? { ...current, status: PackageStatus.SCREENING } : current
      );
      setActiveQrId(null);
      setVolumeWeight('');
      clearItemForm();
      toast.success('Volume processado');
      requestAnimationFrame(() => volumeInputRef.current?.focus());
    } catch (error) {
      console.error('Erro ao processar volume:', error);
      toast.error('Não foi possível processar o volume');
    } finally {
      setIsProcessingVolume(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!selectedPackage?.id) return;
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
          throw new Error('Erro ao guardar as unidades de armazenamento');
        }
      }

      const { status } = await api.patch(`/package/${selectedPackage.id}`, {
        status: PackageStatus.SCREENING,
      });
      if (!isSuccessStatus(status)) throw new Error('Erro ao salvar progresso');
      setSelectedPackage((current) =>
        current ? { ...current, status: PackageStatus.SCREENING } : current
      );
      toast.success('Progresso salvo (em triagem)');
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      toast.error('Não foi possível salvar o progresso');
    } finally {
      setIsSavingProgress(false);
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
      if (!isSuccessStatus(status)) throw new Error('Erro ao obter unidade');
      if (storageUnits.some((unit) => unit.id === data.id)) {
        toast.error('Esta unidade de armazenamento já foi adicionada');
        return;
      }
      const storageKey = buildTriageKey(data);
      const hasMatchingItem = triageItems.some(
        (item) => buildTriageKey(item) === storageKey
      );
      if (!hasMatchingItem) {
        toast.error(
          'Os atributos desta unidade não conferem com nenhum item da lista'
        );
        return;
      }
      setStorageUnits((current) => [...current, data]);
      setStorageCode('');
      toast.success('Unidade de armazenamento adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao obter unidade de armazenamento:', error);
      toast.error('Unidade de armazenamento não encontrada');
    } finally {
      setIsLoadingStorageUnit(false);
    }
  };

  const resetTriageState = () => {
    setScanCode('');
    setSelectedPackage(null);
    setQrCodes([]);
    setActiveQrId(null);
    setVolumeCode('');
    setVolumeWeight('');
    clearItemForm();
    setTriageItems([]);
    setStorageCode('');
    setStorageUnits([]);
  };

  const handleFinishTriage = async () => {
    if (!selectedPackage?.id) return;
    if (!allProcessed) {
      toast.error('Processe todos os volumes antes de finalizar');
      return;
    }
    if (triageItems.length === 0) {
      toast.error('Adicione itens antes de finalizar');
      return;
    }
    if (storageUnits.filter((unit) => !!unit?.id).length === 0) {
      toast.error('Adicione unidades de armazenamento antes de finalizar');
      return;
    }
    if (triageItems.some((item) => !item.id)) {
      toast.error('Todos os itens devem ser persistidos antes de finalizar');
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
        'Cada combinação de itens precisa de uma unidade de armazenamento correspondente'
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
        throw new Error('Erro ao vincular itens às unidades de armazenamento');
      }

      const { status: packageStatus } = await api.patch(
        `/package/${selectedPackage.id}`,
        { status: PackageStatus.STOCKED }
      );
      if (!isSuccessStatus(packageStatus)) {
        throw new Error('Erro ao atualizar status do pacote');
      }

      toast.success('Triagem finalizada com sucesso');
      resetTriageState();
      requestAnimationFrame(() => scanCodeInputRef.current?.focus());
    } catch (error) {
      console.error('Erro ao finalizar triagem:', error);
      toast.error(finishErrorMessage(error));
    } finally {
      setIsFinishingTriage(false);
    }
  };

  const isAddFormInvalid =
    !selectedPackage ||
    !activeQrId ||
    isLoadingPackage ||
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
          Código (solicitação ou volume) *
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
            placeholder="Código da solicitação ou de um QR"
            autoFocus
            disabled={!!selectedPackage || isLoadingPackage}
            className="max-w-md"
          />
          {selectedPackage && (
            <>
              <span className="inline-flex rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                {selectedPackage.friendlyCode ?? selectedPackage.id}
              </span>
              <span className="text-sm text-secondary">
                Peso total: <strong>{packageWeight.toFixed(2)} kg</strong>
              </span>
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                {STATUS_LABEL[selectedPackage.status] ?? selectedPackage.status}
              </span>
            </>
          )}
        </div>
      </div>

      {selectedPackage && (
        <PackageUserData
          user={selectedPackage.user}
          address={selectedPackage.address}
        />
      )}

      {/* Consulta do volume (escaneamento) + peso do volume */}
      {selectedPackage && !isViewMode && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <label className="mb-1 block text-sm font-medium text-secondary">
            Código do volume (QR) *
          </label>
          <Input
            ref={volumeInputRef}
            value={volumeCode}
            onChange={(e) => setVolumeCode(e.target.value)}
            onBlur={handleVolumeScan}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleVolumeScan();
              }
            }}
            placeholder="Escaneie ou digite o código do volume e pressione Enter"
            disabled={!!activeQrId}
            className="max-w-md"
          />

          {activeQrId && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-secondary">
                Peso do volume{' '}
                <strong className="text-secondary">
                  {activeQr?.friendlyCode}
                </strong>{' '}
                (kg) *
              </label>
              <Input
                ref={weightInputRef}
                type="number"
                min={0}
                value={volumeWeight}
                onChange={(e) => setVolumeWeight(e.target.value)}
                className="max-w-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Volumes (QR codes) — processados + em processamento */}
      {selectedPackage && (
        <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-secondary">
              Volumes (QR codes)
            </h2>
            <span className="text-sm font-medium text-secondary">
              Processados: {processedCount} / {qrCodes.length} volumes
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Peso (kg)</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleVolumes.length > 0 ? (
                visibleVolumes.map((qr) => {
                  const itemsCount = triageItems.filter(
                    (item) => item.qrCodeId === qr.id
                  ).length;
                  const processed = qr.processedAt != null;
                  const rawWeight = processed ? qr.weight : volumeWeight;
                  const numWeight = Number(rawWeight);
                  const displayWeight =
                    rawWeight != null &&
                    `${rawWeight}`.trim() !== '' &&
                    Number.isFinite(numWeight)
                      ? numWeight.toFixed(2)
                      : '-';
                  return (
                    <TableRow key={qr.id}>
                      <TableCell className="font-medium">
                        {qr.friendlyCode}
                      </TableCell>
                      <TableCell>{displayWeight}</TableCell>
                      <TableCell>{itemsCount}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                            processed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {processed ? 'Processado' : 'Em processamento'}
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
                    Nenhum volume em processamento ou processado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Itens do volume ativo */}
      {selectedPackage && activeQrId && !isViewMode && (
        <div className="flex flex-col gap-6">
          <CollectionRecord
            selectedPackageId={selectedPackage.id}
            isViewMode={isViewMode}
            items={activeItems}
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
      {selectedPackage && (
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
      {selectedPackage && <div className="h-24" />}

      {/* Barra flutuante de ações */}
      {selectedPackage && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-secondary/25 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            {activeQrId && !isViewMode && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleProcessVolume}
                disabled={isProcessingVolume || !volumeWeight.trim()}
              >
                Guardar volume
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveProgress}
              disabled={isSavingProgress || isViewMode}
            >
              Salvar progresso
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleFinishTriage}
              disabled={isFinishingTriage || isViewMode}
            >
              Finalizar triagem
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetTriageState}
            >
              Nova consulta
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
