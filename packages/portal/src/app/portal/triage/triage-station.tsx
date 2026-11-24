'use client';

import { Brand } from '@/app/types/brand';
import { CollectionRequestDTO, CollectionRequestStatus } from '@/app/types/collection-request';
import { CollectionRequestBagDTO, TriageResponse } from '@/app/types/collection-request-bag';
import { StorageUnitDTO } from '@/app/types/storage-unit';
import {
  AgeGroup,
  CATEGORY_PART,
  CareLabel,
  Category,
  Condition,
  Destination,
  Season,
  Sex,
  StorageSlot,
  isReusableDestination,
  resolveStorageSlot,
  storageSlotKey,
} from '@/app/types/triage';
import Autocomplete from '@/components/custom/autocomplete';
import ScanInput from '@/components/custom/scan-input';
import api from '@/lib/api';
import { cn, normalizeFriendlyCode } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Role } from '@/app/types/user';
import { getUserRoles } from '@/lib/access-control';
import { Check, Minus, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { itemSlotKey, TriageListItem, unitSlotKey, useSlotLabel } from './components/add-triage';
import { ClassificationForm, EMPTY_CLASSIFICATION } from './components/clothing-classification';

type QueueEntry = {
  id: string;
  code: string | null;
  status: CollectionRequestStatus;
  clientName: string | null;
  bags: number;
  bagsProcessed: number;
  collectedAt: string | null;
  assignedStation?: number | null;
  openStation?: number | null;
};
type QueueResponse = {
  today: { pieces: number; requests: number };
  quickCategories: Category[];
  queue: QueueEntry[];
};

type Step = 'queue' | 'bag' | 'items' | 'boxes' | 'done';

type WrongBag = { code: string; otherCode?: string | null; otherClient?: string | null };

type Summary = {
  code: string;
  pieces: number;
  weight: number;
  bags: number;
  lots: number;
  split: { reuse: number; upcycling: number; nonReusable: number; accessory: number };
};

const STATION_KEY = 'retex.triage.station';
const STATIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const TRIAGEABLE = [
  CollectionRequestStatus.COLLECTED,
  CollectionRequestStatus.IN_HOUSE,
  CollectionRequestStatus.SCREENING,
];

// Destinos de quem passa por classificação completa (F1–F5).
const REUSE_DESTINATIONS = [
  Destination.REUSE,
  Destination.UPCYCLING,
  Destination.VINTAGE,
  Destination.RECONDITIONING,
  Destination.STOCK_RESERVE,
];

// Só se pergunta por ganga nas peças que podem ser de ganga.
const DENIM_CATEGORIES = [Category.TROUSERS, Category.SHORTS, Category.SKIRT, Category.JUMPSUIT, Category.COAT];

const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data
    ?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

// O decimal do Postgres chega como string; 0 conta como "sem peso".
const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const bagWeightOf = (bag: CollectionRequestBagDTO) => num(bag.weight);
const parseWeight = (value: string) => {
  const n = Number(value.replace(',', '.'));
  return value.trim() && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
};

const clientOf = (r?: CollectionRequestDTO | null) =>
  r?.company?.name ?? (`${r?.user?.firstName ?? ''} ${r?.user?.lastName ?? ''}`.trim() || '—');

const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
};

const sortBrands = (list: Brand[]) =>
  [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt', { sensitivity: 'base' }));

function Kbd({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <span
      className={cn(
        'rounded px-1 font-mono text-[9px] leading-4',
        light ? 'bg-white/20 text-white' : 'bg-mist text-ink'
      )}
    >
      {children}
    </span>
  );
}

function Choice({
  active,
  onClick,
  children,
  hotkey,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  hotkey?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative flex h-[52px] items-center justify-center rounded-xl border-[1.5px] px-3 text-[15px] font-medium transition-colors',
        active ? 'border-navy bg-navy text-white' : 'border-line bg-white text-navy hover:bg-panel',
        className
      )}
    >
      {hotkey ? (
        <span className="absolute left-1.5 top-1">
          <Kbd light={active}>{hotkey}</Kbd>
        </span>
      ) : null}
      {children}
    </button>
  );
}

/**
 * Posto de triagem (Figma "RETEX Triagem POV empregado"): ecrã inteiro, um
 * passo de cada vez — fila de pedidos, abrir saco, registar peças, guardar
 * saco, arrumar os lotes em caixas e concluir. As regras são as da API: só se
 * tria um pedido recolhido, em armazém ou em triagem; um saco só fecha com peso
 * e com peças; a triagem só fecha com todos os sacos processados e uma caixa
 * por lote.
 */
export default function TriageStation() {
  const t = useTranslations('triageStation');
  const tTriage = useTranslations('triage');
  const tStatus = useTranslations('enums.collectionRequestStatus');
  const tCategory = useTranslations('enums.category');
  const tCondition = useTranslations('enums.condition');
  const tCareLabel = useTranslations('enums.careLabel');
  const tDestination = useTranslations('enums.destination');
  const tSeason = useTranslations('enums.season');
  const tBrand = useTranslations('brand');
  const slotLabel = useSlotLabel();
  const { user } = useAppStore();

  const [station, setStation] = useState<number | null>(null);
  const [choosingStation, setChoosingStation] = useState(false);
  const [queue, setQueue] = useState<QueueResponse | null>(null);
  const [step, setStep] = useState<Step>('queue');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [request, setRequest] = useState<CollectionRequestDTO | null>(null);
  const [bags, setBags] = useState<CollectionRequestBagDTO[]>([]);
  const [items, setItems] = useState<TriageListItem[]>([]);
  const [units, setUnits] = useState<StorageUnitDTO[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [recentBrands, setRecentBrands] = useState<string[]>([]);

  const [bagCode, setBagCode] = useState('');
  const [candidateBag, setCandidateBag] = useState<CollectionRequestBagDTO | null>(null);
  const [wrongBag, setWrongBag] = useState<WrongBag | null>(null);
  const [bagWeight, setBagWeight] = useState('');
  const [activeBagId, setActiveBagId] = useState<string | null>(null);

  const [form, setForm] = useState<ClassificationForm>(EMPTY_CLASSIFICATION);
  const [moreDetails, setMoreDetails] = useState(false);
  const [lastPlaced, setLastPlaced] = useState<{ itemId?: string; slot: StorageSlot | null; label: string } | null>(
    null
  );
  const [isBusy, setIsBusy] = useState(false);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [emptyConfirmed, setEmptyConfirmed] = useState(false);
  const [boxCode, setBoxCode] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  // Pedido deixado em pausa neste posto (a supervisão vê "Em pausa").
  const [paused, setPaused] = useState<{ id: string; code: string | null } | null>(null);
  const isAdmin = getUserRoles(user).includes(Role.ADMIN);

  const codeRef = useRef<HTMLInputElement>(null);
  const bagRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLInputElement>(null);
  const otherCategoryRef = useRef<HTMLSelectElement>(null);

  // Posto guardado neste computador.
  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(STATION_KEY));
      if (STATIONS.includes(saved)) setStation(saved);
      else setChoosingStation(true);
    } catch {
      setChoosingStation(true);
    }
  }, []);

  const chooseStation = (n: number) => {
    setStation(n);
    setChoosingStation(false);
    try {
      window.localStorage.setItem(STATION_KEY, String(n));
    } catch {
      // Sem armazenamento: o posto vale só para esta sessão.
    }
  };

  const loadQueue = useCallback(async () => {
    try {
      const { data } = await api.get<QueueResponse>('/triage/queue', { params: station ? { station } : {} });
      setQueue(data);
      return data;
    } catch {
      toast.error(t('queue.loadError'));
      return null;
    }
  }, [t, station]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    api
      .get<Brand[]>('/brand')
      .then(({ data }) => setBrands(sortBrands(data)))
      .catch(() => toast.error(tTriage('brandsLoadError')));
  }, [tTriage]);

  // Na fila, volta a pedir de vez em quando (a supervisão pode atribuir pedidos a este posto).
  useEffect(() => {
    if (step !== 'queue') return;
    const id = window.setInterval(loadQueue, 30_000);
    return () => window.clearInterval(id);
  }, [step, loadQueue]);

  const resetRequest = () => {
    setRequest(null);
    setBags([]);
    setItems([]);
    setUnits([]);
    setBagCode('');
    setCandidateBag(null);
    setWrongBag(null);
    setBagWeight('');
    setActiveBagId(null);
    setForm(EMPTY_CLASSIFICATION);
    setLastPlaced(null);
    setBoxCode('');
  };

  const backToQueue = async () => {
    resetRequest();
    setCode('');
    setStep('queue');
    await loadQueue();
    requestAnimationFrame(() => codeRef.current?.focus());
  };

  // ── Passo 1: abrir um pedido ───────────────────────────────────────────────
  const openRequest = async (value: string) => {
    const lookup = value.trim();
    if (!lookup) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<TriageResponse>(`/triage/${encodeURIComponent(lookup)}`);
      const r = data.collectionRequest;
      if (r.status === CollectionRequestStatus.STOCKED) {
        toast.warning(t('queue.alreadyDone', { code: r.friendlyCode ?? '' }));
        return;
      }
      if (!TRIAGEABLE.includes(r.status)) {
        toast.error(t('queue.notReady', { status: tStatus(r.status) }));
        return;
      }
      resetRequest();
      setPaused(null);
      setRequest(r);
      const loadedBags = data.bags ?? [];
      setBags(loadedBags);
      setItems(
        (r.items ?? []).map((it) => ({
          id: it.id,
          collectionRequestId: r.id,
          bagId: it.bag?.id,
          destination: it.destination,
          type: it.type,
          season: it.season,
          sex: it.sex,
          ageGroup: it.ageGroup,
          category: it.category,
          condition: it.condition,
          careLabel: it.careLabel,
          brandId: it.brand?.id ?? '',
          quantity: it.quantity,
        })) as TriageListItem[]
      );
      setUnits(
        (r.items ?? []).reduce<StorageUnitDTO[]>((acc, it) => {
          if (it.storageUnit?.id && !acc.some((u) => u.id === it.storageUnit.id)) acc.push(it.storageUnit);
          return acc;
        }, [])
      );
      setCode('');
      const allDone = loadedBags.length > 0 && loadedBags.every((b) => b.processedAt != null && bagWeightOf(b) > 0);
      // Se o código lido era de um saco por abrir, já fica escolhido.
      const scannedBag = loadedBags.find(
        (b) => b.token === lookup || normalizeFriendlyCode(b.friendlyCode ?? '') === normalizeFriendlyCode(lookup)
      );
      setStep(allDone ? 'boxes' : 'bag');
      if (!allDone && scannedBag && scannedBag.processedAt == null) pickBag(scannedBag);
      else requestAnimationFrame(() => (allDone ? boxRef : bagRef).current?.focus());
    } catch {
      toast.error(t('queue.notFound'));
      setCode('');
      requestAnimationFrame(() => codeRef.current?.focus());
    } finally {
      setIsLoading(false);
    }
  };

  // ── Passo 2: abrir saco ────────────────────────────────────────────────────
  const pickBag = (bag: CollectionRequestBagDTO) => {
    setWrongBag(null);
    setCandidateBag(bag);
    setBagCode(bag.friendlyCode ?? bag.token);
    const known = bag.weight != null && num(bag.weight) > 0 ? bag.weight : bag.receivedWeight;
    setBagWeight(known != null && num(known) > 0 ? String(num(known)).replace('.', ',') : '');
    requestAnimationFrame(() => weightRef.current?.focus());
  };

  const scanBag = async (value: string) => {
    const lookup = value.trim();
    if (!lookup || !request) return;
    const bag = bags.find(
      (b) => b.token === lookup || normalizeFriendlyCode(b.friendlyCode ?? '') === normalizeFriendlyCode(lookup)
    );
    if (bag) {
      if (bag.processedAt != null && bagWeightOf(bag) > 0) {
        toast.error(tTriage('bagAlreadyProcessed'));
        setBagCode('');
        return;
      }
      pickBag(bag);
      return;
    }
    // Não é deste pedido: descobre de qual é, para o operador o pôr de lado.
    setCandidateBag(null);
    try {
      const { data } = await api.get<TriageResponse>(`/triage/${encodeURIComponent(lookup)}`);
      setWrongBag({
        code: lookup.toUpperCase(),
        otherCode: data.collectionRequest.friendlyCode,
        otherClient: clientOf(data.collectionRequest),
      });
      reportWrongBag(lookup, data.collectionRequest.friendlyCode);
    } catch {
      setWrongBag({ code: lookup.toUpperCase() });
      reportWrongBag(lookup, null);
    }
  };

  // Fica nos alertas da supervisão.
  const reportWrongBag = (bagCode: string, otherRequestCode: string | null | undefined) => {
    if (!station) return;
    api
      .post(`/triage/station/${station}/event`, {
        type: 'WRONG_BAG',
        code: bagCode,
        requestCode: request?.friendlyCode ?? null,
        otherRequestCode: otherRequestCode ?? null,
      })
      .catch(() => undefined);
  };

  const openBag = async () => {
    if (!candidateBag) return;
    const weight = parseWeight(bagWeight);
    if (weight == null) {
      toast.error(tTriage('invalidBagWeight'));
      weightRef.current?.focus();
      return;
    }
    setIsBusy(true);
    try {
      // Grava já o peso (sem fechar o saco): não se perde se o posto parar.
      await api.patch(`/triage/bag/${candidateBag.id}/weight`, { weight });
      setBags((current) => current.map((b) => (b.id === candidateBag.id ? { ...b, weight } : b)));
      setRequest((r) => (r ? { ...r, status: CollectionRequestStatus.SCREENING } : r));
      setActiveBagId(candidateBag.id);
      setCandidateBag(null);
      setBagCode('');
      setForm(EMPTY_CLASSIFICATION);
      setLastPlaced(null);
      setStep('items');
    } catch (error) {
      toast.error(apiMessage(error, tTriage('progressSaveError')));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Passo 3: registar peças ────────────────────────────────────────────────
  const activeBag = bags.find((b) => b.id === activeBagId) ?? null;
  const bagItems = items.filter((it) => it.bagId === activeBagId);
  const brandName = useCallback(
    (id?: string) => brands.find((b) => b.id === id)?.name ?? t('items.noBrand'),
    [brands, t]
  );
  const quickCategories = queue?.quickCategories ?? [];
  const otherCategories = Object.values(Category).filter((c) => !quickCategories.includes(c));
  const piecesOf = (list: TriageListItem[]) => list.reduce((sum, it) => sum + (it.quantity ?? 0), 0);

  // Lote para onde vai a peça que está a ser classificada.
  const previewSlot = useMemo(
    () =>
      resolveStorageSlot({
        destination: form.destination,
        sex: form.sex,
        ageGroup: form.ageGroup,
        season: form.season,
        type: form.category ? CATEGORY_PART[form.category] : null,
      }),
    [form]
  );

  const register = async (quick?: Destination.NON_REUSABLE | Destination.ACCESSORY) => {
    if (!request || !activeBagId || isBusy) return;
    const destination = quick ?? form.destination;
    const reusable = isReusableDestination(destination);
    if (reusable) {
      if (!form.sex || !form.ageGroup) return void toast.error(t('items.pickWho'));
      if (!form.category) return void toast.error(tTriage('selectCategory'));
      if (!form.brandId) return void toast.error(tTriage('selectBrand'));
      if (!form.condition || !form.season) return void toast.error(tTriage('selectAttributes'));
    }
    const quantity = Number(form.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return void toast.error(tTriage('invalidQuantity'));

    const payload = reusable
      ? {
          collectionRequestId: request.id,
          bagId: activeBagId,
          destination,
          sex: form.sex,
          ageGroup: form.ageGroup,
          category: form.category,
          condition: form.condition,
          careLabel: form.careLabel,
          season: form.season,
          denim: form.category && DENIM_CATEGORIES.includes(form.category) ? form.denim : undefined,
          brandId: form.brandId,
          quantity,
          material: form.material.trim() || undefined,
          color: form.color.trim() || undefined,
          size: form.size.trim() || undefined,
          station: station ?? undefined,
        }
      : {
          collectionRequestId: request.id,
          bagId: activeBagId,
          destination,
          brandId: form.brandId || undefined,
          quantity,
          station: station ?? undefined,
        };

    setIsBusy(true);
    try {
      const { data } = await api.post<{ id?: string; storageSlot?: StorageSlot | null }>('/items', payload);
      const item = {
        ...payload,
        id: data?.id,
        type: reusable && form.category ? CATEGORY_PART[form.category] : null,
      } as TriageListItem;
      setItems((current) => [...current, item]);
      const label = [
        brandName(form.brandId || undefined),
        form.category && reusable ? tCategory(form.category) : tDestination(destination),
        quantity > 1 ? t('items.qty', { count: quantity }) : null,
      ]
        .filter(Boolean)
        .join(' · ');
      setLastPlaced({ itemId: data?.id, slot: data?.storageSlot ?? null, label });
      if (form.brandId) {
        setRecentBrands((current) => [form.brandId, ...current.filter((id) => id !== form.brandId)].slice(0, 5));
      }
      // Para quem, estação e estado ficam: as peças de um saco costumam ser parecidas.
      setForm({
        ...EMPTY_CLASSIFICATION,
        sex: form.sex,
        ageGroup: form.ageGroup,
        season: form.season,
        condition: form.condition,
        destination: reusable ? form.destination : EMPTY_CLASSIFICATION.destination,
      });
    } catch (error) {
      toast.error(apiMessage(error, tTriage('itemCreateError')));
    } finally {
      setIsBusy(false);
    }
  };

  const removeItem = async (item?: TriageListItem) => {
    if (!item?.id || isBusy) return;
    setIsBusy(true);
    try {
      await api.delete(`/items/${item.id}`);
      setItems((current) => current.filter((it) => it.id !== item.id));
      if (lastPlaced?.itemId === item.id) setLastPlaced(null);
      toast.success(tTriage('itemRemoved'));
    } catch {
      toast.error(tTriage('itemRemoveError'));
    } finally {
      setIsBusy(false);
    }
  };

  const undoLast = () => {
    const last = [...bagItems].reverse()[0];
    if (last) removeItem(last);
  };

  const createBrand = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      try {
        const { data } = await api.post<Brand>('/brand', { name: trimmed });
        setBrands((prev) => sortBrands([...prev, data]));
        setForm((current) => ({ ...current, brandId: data.id }));
        toast.success(tBrand('createSuccess'));
        return data.id;
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        toast.error(status === 409 ? tBrand('duplicateName') : tBrand('createError'));
        return null;
      }
    },
    [tBrand]
  );

  // Guarda o progresso (peso do saco aberto e caixas já lidas) e volta à fila.
  const pause = async () => {
    if (!request) return;
    setIsBusy(true);
    try {
      const weight = parseWeight(bagWeight);
      if (activeBagId && weight != null) {
        await api.patch(`/triage/bag/${activeBagId}/weight`, { weight });
      }
      const itemIds = items.map((it) => it.id).filter((id): id is string => !!id);
      if (itemIds.length > 0 && units.length > 0) {
        await api.post('/items/bind-storage-units', {
          items: itemIds,
          storageUnits: units.map((u) => u.id),
          finalize: false,
        });
      }
      await api.patch(`/collection-request/${request.id}`, { status: CollectionRequestStatus.SCREENING });
      toast.success(tTriage('progressSaved'));
      const pausedRequest = { id: request.id, code: request.friendlyCode ?? null };
      await backToQueue();
      setPaused(pausedRequest);
    } catch (error) {
      toast.error(apiMessage(error, tTriage('progressSaveError')));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Passo 4: guardar saco ──────────────────────────────────────────────────
  const nextBag = bags.find((b) => b.id !== activeBagId && b.processedAt == null);
  const askCloseBag = () => {
    if (bagItems.length === 0) return void toast.error(tTriage('bagWithoutItems'));
    setEmptyConfirmed(false);
    setConfirmEmpty(true);
  };

  const closeBag = async () => {
    if (!activeBag || !emptyConfirmed) return;
    const weight = bagWeightOf(activeBag);
    if (weight <= 0) return void toast.error(tTriage('invalidBagWeight'));
    setIsBusy(true);
    try {
      await api.post(`/triage/bag/${activeBag.id}/process`, { weight });
      const updated = bags.map((b) =>
        b.id === activeBag.id ? { ...b, processedAt: new Date().toISOString() } : b
      );
      setBags(updated);
      setConfirmEmpty(false);
      setActiveBagId(null);
      setBagWeight('');
      setLastPlaced(null);
      toast.success(tTriage('bagProcessed'));
      if (updated.every((b) => b.processedAt != null)) {
        setStep('boxes');
        requestAnimationFrame(() => boxRef.current?.focus());
      } else {
        setStep('bag');
        requestAnimationFrame(() => bagRef.current?.focus());
      }
    } catch (error) {
      toast.error(apiMessage(error, tTriage('bagProcessError')));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Passo 5: caixas e finalizar ────────────────────────────────────────────
  const lots = useMemo(() => {
    const map = new Map<string, { key: string; slot: StorageSlot; pieces: number }>();
    items.forEach((it) => {
      const slot = resolveStorageSlot(it);
      if (!slot) return;
      const key = storageSlotKey(slot);
      const entry = map.get(key) ?? { key, slot, pieces: 0 };
      entry.pieces += it.quantity ?? 0;
      map.set(key, entry);
    });
    return [...map.values()];
  }, [items]);
  const unitFor = (key: string) => units.find((u) => unitSlotKey(u) === key);
  const pendingLot = lots.find((lot) => !unitFor(lot.key));
  const processedCount = bags.filter((b) => b.processedAt != null).length;
  const totalWeight = bags.reduce((sum, b) => sum + bagWeightOf(b), 0);
  const totalPieces = piecesOf(items);
  const checks = [
    { ok: bags.length > 0 && processedCount === bags.length, label: t('boxes.checkBags'), value: `${processedCount} / ${bags.length}` },
    {
      ok: bags.length > 0 && bags.every((b) => bagWeightOf(b) > 0),
      label: t('boxes.checkWeight'),
      value: `${totalWeight.toLocaleString('pt-PT', { maximumFractionDigits: 1 })} kg`,
    },
    { ok: totalPieces > 0, label: t('boxes.checkPieces'), value: t('items.pieces', { count: totalPieces }) },
    {
      ok: lots.every((lot) => unitFor(lot.key)),
      label: t('boxes.checkBoxes'),
      value: `${lots.filter((lot) => unitFor(lot.key)).length} / ${lots.length}`,
    },
  ];
  const ready = checks.every((c) => c.ok);

  const scanBox = async (value: string) => {
    const lookup = value.trim();
    if (!lookup) return;
    try {
      const { data } = await api.get<StorageUnitDTO>(`/storage-unit/${encodeURIComponent(lookup)}`);
      if (units.some((u) => u.id === data.id)) {
        toast.error(tTriage('storageUnitAlreadyAdded'));
      } else if (!lots.some((lot) => lot.key === unitSlotKey(data))) {
        toast.error(tTriage('storageUnitMismatch'));
      } else {
        setUnits((current) => [...current.filter((u) => unitSlotKey(u) !== unitSlotKey(data)), data]);
        toast.success(t('boxes.read', { lot: slotLabel(data) }));
      }
    } catch {
      toast.error(tTriage('storageUnitNotFound'));
    } finally {
      setBoxCode('');
      requestAnimationFrame(() => boxRef.current?.focus());
    }
  };

  const finish = async () => {
    if (!request || !ready || isBusy) return;
    setIsBusy(true);
    try {
      const itemIds = items.map((it) => it.id).filter((id): id is string => !!id);
      if (units.length > 0) {
        await api.post('/items/bind-storage-units', { items: itemIds, storageUnits: units.map((u) => u.id) });
      }
      await api.patch(`/collection-request/${request.id}`, { status: CollectionRequestStatus.STOCKED });
      const sumOf = (pred: (d: Destination) => boolean) =>
        items.filter((it) => pred(it.destination)).reduce((s, it) => s + (it.quantity ?? 0), 0);
      setSummary({
        code: request.friendlyCode ?? '',
        pieces: totalPieces,
        weight: totalWeight,
        bags: bags.length,
        lots: units.length,
        split: {
          reuse: sumOf((d) => isReusableDestination(d) && d !== Destination.UPCYCLING),
          upcycling: sumOf((d) => d === Destination.UPCYCLING),
          nonReusable: sumOf((d) => d === Destination.NON_REUSABLE),
          accessory: sumOf((d) => d === Destination.ACCESSORY),
        },
      });
      resetRequest();
      setStep('done');
      await loadQueue();
    } catch (error) {
      toast.error(apiMessage(error, tTriage('finishError')));
    } finally {
      setIsBusy(false);
    }
  };

  // ── Sinal para a supervisão ────────────────────────────────────────────────
  // O que o posto está a fazer; vai para a API quando muda e a cada minuto.
  const signal = station
    ? request
      ? {
          status: 'SORTING',
          collectionRequestId: request.id,
          pendingLots:
            step === 'boxes'
              ? lots.filter((lot) => !unitFor(lot.key)).map((lot) => ({ label: slotLabel(lot.slot), pieces: lot.pieces }))
              : [],
        }
      : paused
        ? { status: 'PAUSED', collectionRequestId: paused.id }
        : { status: 'FREE', collectionRequestId: null }
    : null;
  const signalKey = signal ? JSON.stringify(signal) : '';

  useEffect(() => {
    if (!station || !signalKey) return;
    const send = () => api.put(`/triage/station/${station}`, JSON.parse(signalKey)).catch(() => undefined);
    send();
    const id = window.setInterval(send, 60_000);
    return () => window.clearInterval(id);
  }, [station, signalKey]);

  // Ao sair do posto (outra página, fechar o separador) o posto fica livre.
  useEffect(() => {
    if (!station) return;
    const body = JSON.stringify({ status: 'FREE', release: true });
    const onHide = () => {
      const { accessToken } = useAppStore.getState();
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/triage/station/${station}`, {
        method: 'PUT',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body,
      }).catch(() => undefined);
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      api.put(`/triage/station/${station}`, JSON.parse(body)).catch(() => undefined);
    };
  }, [station]);

  // ── Atalhos de teclado ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (confirmEmpty) {
        if (event.key === 'Escape') setConfirmEmpty(false);
        if (event.key === 'Enter' && emptyConfirmed) {
          event.preventDefault();
          closeBag();
        }
        return;
      }
      if (step === 'done' && event.key === 'Enter' && !isTyping(event.target)) {
        const next = queue?.queue[0];
        if (next?.code) {
          event.preventDefault();
          openRequest(next.code);
        }
        return;
      }
      if (step !== 'items') return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !isTyping(event.target)) {
        event.preventDefault();
        undoLast();
        return;
      }
      if (event.key.startsWith('F') && /^F[1-5]$/.test(event.key)) {
        event.preventDefault();
        setForm((f) => ({ ...f, destination: REUSE_DESTINATIONS[Number(event.key.slice(1)) - 1] }));
        return;
      }
      if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const set = (patch: Partial<ClassificationForm>) => {
        event.preventDefault();
        setForm((f) => ({ ...f, ...patch }));
      };
      if (key === 'enter') return void (event.preventDefault(), register());
      if (key === 'q') return set({ sex: Sex.MALE });
      if (key === 'w') return set({ sex: Sex.FEMALE });
      if (key === 'a') return set({ ageGroup: AgeGroup.ADULT });
      if (key === 's') return set({ ageGroup: AgeGroup.CHILD });
      if (/^[1-7]$/.test(key) && quickCategories[Number(key) - 1]) {
        return set({ category: quickCategories[Number(key) - 1] });
      }
      if (key === '8') {
        event.preventDefault();
        otherCategoryRef.current?.focus();
        return;
      }
      if (key === 'e') return set({ condition: Condition.EXCELLENT });
      if (key === 'b') return set({ condition: Condition.GOOD });
      if (key === 'r') return set({ condition: Condition.REGULAR });
      if (key === 'v') return set({ season: Season.SUMMER });
      if (key === 'i') return set({ season: Season.WINTER });
      if (key === 'l') return set({ careLabel: CareLabel.LEGIBLE });
      if (key === 'g') return set({ careLabel: CareLabel.ILLEGIBLE });
      if (key === 'n') return set({ careLabel: CareLabel.MISSING });
      if (key === '+') return set({ quantity: String(Math.max(1, Number(form.quantity) || 1) + 1) });
      if (key === '-') return set({ quantity: String(Math.max(1, (Number(form.quantity) || 1) - 1)) });
      if (key === 'x') return void (event.preventDefault(), register(Destination.NON_REUSABLE));
      if (key === 'z') return void (event.preventDefault(), register(Destination.ACCESSORY));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Barra do posto ─────────────────────────────────────────────────────────
  const operator = user ? `${user.firstName ?? ''} ${(user.lastName ?? '').slice(0, 1)}.`.trim() : '';
  const header = (() => {
    const field = (label: string, value: React.ReactNode) => (
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-white/60">{label}</span>
        <span className="font-mono text-[15px] text-white">{value}</span>
      </div>
    );
    if (step === 'queue' || step === 'done' || !request) {
      return field(
        t('bar.today'),
        `${t('items.pieces', { count: queue?.today.pieces ?? 0 })} · ${t('bar.requests', {
          count: queue?.today.requests ?? 0,
        })}`
      );
    }
    if (step === 'items' && activeBag) {
      const index = bags.findIndex((b) => b.id === activeBag.id) + 1;
      return (
        <div className="flex gap-8">
          {field(t('bar.request'), request.friendlyCode)}
          {field(t('bar.openBag'), `${activeBag.friendlyCode} · ${index} ${t('bar.of')} ${bags.length}`)}
          {field(t('bar.weight'), `${bagWeightOf(activeBag).toLocaleString('pt-PT')} kg`)}
        </div>
      );
    }
    if (step === 'boxes') {
      return (
        <div className="flex gap-8">
          {field(t('bar.request'), request.friendlyCode)}
          {field(t('bar.bags'), t('bar.processed', { done: processedCount, total: bags.length }))}
        </div>
      );
    }
    return (
      <div className="flex gap-8">
        {field(t('bar.request'), request.friendlyCode)}
        {field(t('bar.client'), `${clientOf(request)} · ${t('items.bags', { count: bags.length })}`)}
      </div>
    );
  })();

  const lightButton =
    'h-10 rounded-full border border-white/70 px-4 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-50';
  const primaryGradient = 'bg-[linear-gradient(100deg,#013364_0%,#02748e_100%)] text-white';

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-auto bg-canvas text-navy">
      <header className="flex min-h-[72px] items-center justify-between gap-6 bg-[linear-gradient(100deg,#013364_0%,#02748e_100%)] px-7">
        <div className="flex items-center gap-3">
          <span className="text-[22px] font-bold text-white">ReTeX:ID</span>
          <button
            type="button"
            onClick={() => setChoosingStation(true)}
            className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/80 hover:text-white"
            title={t('station.change')}
          >
            {t('bar.station', { n: station ?? '–' })}
            {operator ? ` · ${operator}` : ''}
          </button>
        </div>
        {header}
        <div className="flex gap-2">
          {step === 'queue' || step === 'done' ? (
            <Link href={isAdmin ? '/portal/triage' : '/portal'} className={cn(lightButton, 'flex items-center')}>
              {t('bar.leave')}
            </Link>
          ) : step === 'bag' ? (
            <button type="button" onClick={backToQueue} className={lightButton}>
              ← {t('bar.backToQueue')}
            </button>
          ) : (
            <button type="button" onClick={pause} disabled={isBusy} className={lightButton}>
              {t('bar.pause')}
            </button>
          )}
          {step === 'items' ? (
            <button
              type="button"
              onClick={askCloseBag}
              disabled={isBusy}
              className="h-10 rounded-full bg-white px-4 text-[13px] font-semibold text-navy hover:bg-panel disabled:opacity-50"
            >
              {t('bar.closeBag')}
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex flex-1 gap-5 p-5">
        {/* 1 · Fila */}
        {step === 'queue' ? (
          <>
            <section className="flex flex-1 flex-col items-center justify-center gap-5 rounded-2xl bg-white p-8 text-center">
              <div className="flex size-[120px] items-center justify-center rounded-2xl border-2 border-dashed border-teal bg-[#eaf3f5]">
                <svg viewBox="0 0 40 40" className="size-16 text-navy" aria-hidden>
                  {[
                    [4, 4], [22, 4], [4, 22], [16, 16], [22, 22], [28, 28], [16, 28],
                  ].map(([x, y]) => (
                    <rect key={`${x}-${y}`} x={x} y={y} width={x === 16 || x === 28 ? 6 : 14} height={x === 16 || x === 28 ? 6 : 14} rx={1.5} fill="currentColor" />
                  ))}
                </svg>
              </div>
              {paused ? (
                <div className="flex w-full max-w-[580px] items-center gap-3 rounded-xl bg-[#fdf1dc] px-4 py-3 text-left">
                  <p className="flex-1 text-sm text-[#8a5a12]">
                    {t('queue.paused', { code: paused.code ?? '' })}
                  </p>
                  <button
                    type="button"
                    onClick={() => paused.code && openRequest(paused.code)}
                    className="h-9 rounded-full bg-navy px-4 text-[13px] font-semibold text-white"
                  >
                    {t('queue.continue')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaused(null)}
                    className="h-9 rounded-full border border-[#8a5a12] px-4 text-[13px] font-semibold text-[#8a5a12]"
                  >
                    {t('queue.endPause')}
                  </button>
                </div>
              ) : null}
              <h1 className="max-w-[420px] text-[28px] font-bold leading-tight">{t('queue.scanTitle')}</h1>
              <p className="text-[15px] text-ink">{t('queue.scanHint')}</p>
              <div className="flex w-full max-w-[580px] gap-2">
                <ScanInput
                  inputRef={codeRef}
                  value={code}
                  onChange={setCode}
                  onScan={openRequest}
                  autoFocus
                  disabled={isLoading || choosingStation}
                  placeholder="2026-"
                  scanTitle={t('queue.scanTitle')}
                  className="flex-1"
                  inputClassName="h-[52px] rounded-xl border-[1.5px] border-navy font-mono text-[18px]"
                />
                <button
                  type="button"
                  onClick={() => openRequest(code)}
                  disabled={isLoading}
                  className={cn('flex h-[52px] items-center gap-2 rounded-xl px-6 text-[17px] font-semibold', primaryGradient)}
                >
                  {t('queue.open')} <Kbd light>Enter</Kbd>
                </button>
              </div>
              <p className="text-xs text-ink">
                {t('queue.rule', {
                  collected: tStatus(CollectionRequestStatus.COLLECTED),
                  inHouse: tStatus(CollectionRequestStatus.IN_HOUSE),
                  screening: tStatus(CollectionRequestStatus.SCREENING),
                })}
              </p>
            </section>
            <aside className="flex w-[470px] shrink-0 flex-col rounded-2xl bg-white p-5">
              <div className="flex items-baseline justify-between border-b border-line-soft pb-3">
                <h2 className="text-[17px] font-semibold">{t('queue.title')}</h2>
                <span className="font-mono text-[10px] text-ink">{t('queue.order')}</span>
              </div>
              {(queue?.queue ?? []).length === 0 ? (
                <p className="py-6 text-sm text-ink">{t('queue.empty')}</p>
              ) : (
                (queue?.queue ?? []).map((entry) => {
                  const inProgress = entry.status === CollectionRequestStatus.SCREENING;
                  const assignedHere = !!station && entry.assignedStation === station;
                  const elsewhere = entry.openStation && entry.openStation !== station ? entry.openStation : null;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'flex items-center justify-between gap-3 border-b border-line-soft py-3',
                        assignedHere && '-mx-2 rounded-xl border-b-0 bg-[#eaf3f5] px-2'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[14px]">{entry.code}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                              inProgress ? 'bg-navy text-white' : 'bg-neutral-badge text-ink'
                            )}
                          >
                            {tStatus(entry.status)}
                          </span>
                          {assignedHere ? (
                            <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-semibold text-white">
                              {t('queue.assignedHere')}
                            </span>
                          ) : null}
                          {elsewhere ? (
                            <span className="rounded-full bg-[#fdf1dc] px-2 py-0.5 text-[10px] font-semibold text-[#8a5a12]">
                              {t('queue.openAt', { n: elsewhere })}
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-xs text-ink">
                          {[
                            entry.clientName ?? '—',
                            t('items.bags', { count: entry.bags }),
                            inProgress
                              ? t('queue.bagsDone', { done: entry.bagsProcessed, total: entry.bags })
                              : entry.collectedAt
                                ? t('queue.collectedOn', {
                                    date: new Date(entry.collectedAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                    }),
                                  })
                                : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => entry.code && openRequest(entry.code)}
                        className={cn(
                          'h-10 shrink-0 rounded-full px-5 text-sm font-semibold',
                          inProgress ? 'bg-navy text-white' : 'border-[1.5px] border-navy text-navy hover:bg-panel'
                        )}
                      >
                        {inProgress ? t('queue.continue') : t('queue.start')}
                      </button>
                    </div>
                  );
                })
              )}
            </aside>
          </>
        ) : null}

        {/* 2 · Abrir saco */}
        {step === 'bag' && request ? (
          <>
            <section className="flex flex-1 flex-col gap-5 rounded-2xl bg-white p-8">
              <h1 className="text-left text-[28px] font-bold">{t('bag.title')}</h1>
              <div className="flex gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-white',
                    wrongBag ? 'bg-[#a12a1e]' : candidateBag ? 'bg-forest' : 'bg-navy'
                  )}
                >
                  {wrongBag ? <X className="size-4" /> : candidateBag ? <Check className="size-4" /> : '1'}
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-[15px] font-semibold">{t('bag.scan')}</p>
                  <ScanInput
                    inputRef={bagRef}
                    value={bagCode}
                    onChange={(v) => {
                      setBagCode(v);
                      setWrongBag(null);
                      setCandidateBag(null);
                    }}
                    onScan={scanBag}
                    autoFocus
                    placeholder="2026-"
                    scanTitle={t('bag.scan')}
                    inputClassName={cn(
                      'h-[52px] rounded-xl border-[1.5px] font-mono text-[18px]',
                      wrongBag ? 'border-[#a12a1e] bg-[#fbecea]' : candidateBag ? 'border-forest bg-[#eef6f2]' : 'border-navy'
                    )}
                  />
                  {candidateBag ? <p className="text-xs text-forest">{t('bag.belongs')}</p> : null}
                  {wrongBag ? (
                    <div className="flex flex-col gap-2 rounded-xl bg-[#fbecea] p-4 text-[13px]">
                      <p className="text-[15px] font-semibold text-[#a12a1e]">
                        {wrongBag.otherCode ? t('bag.wrongTitle') : t('bag.unknownTitle')}
                      </p>
                      <p>
                        {wrongBag.otherCode
                          ? t('bag.wrongBody', {
                              bag: wrongBag.code,
                              request: wrongBag.otherCode,
                              client: wrongBag.otherClient ?? '—',
                            })
                          : t('bag.unknownBody', { bag: wrongBag.code })}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setWrongBag(null);
                            setBagCode('');
                            bagRef.current?.focus();
                          }}
                          className="h-10 rounded-full bg-navy px-4 font-semibold text-white"
                        >
                          {t('bag.readAnother')}
                        </button>
                        {wrongBag.otherCode ? (
                          <button
                            type="button"
                            onClick={() => openRequest(wrongBag.otherCode as string)}
                            className="h-10 rounded-full border-[1.5px] border-navy px-4 font-semibold"
                          >
                            {t('bag.openOther', { code: wrongBag.otherCode })}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={cn('flex gap-3', !candidateBag && 'opacity-40')}>
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                  2
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <label htmlFor="bag-weight" className="text-[15px] font-semibold">
                    {t('bag.weight')}
                  </label>
                  <div className="flex h-[64px] items-center gap-2 rounded-xl border-[1.5px] border-navy px-5">
                    <input
                      id="bag-weight"
                      ref={weightRef}
                      inputMode="decimal"
                      disabled={!candidateBag}
                      value={bagWeight}
                      onChange={(e) => setBagWeight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          openBag();
                        }
                      }}
                      placeholder="0,0"
                      data-1p-ignore
                      data-lpignore="true"
                      className="w-32 bg-transparent text-[32px] font-bold outline-none"
                    />
                    <span className="text-[15px] font-semibold">kg</span>
                    {candidateBag?.receivedWeight != null && num(candidateBag.receivedWeight) > 0 ? (
                      <span className="ml-auto text-xs text-ink">{t('bag.fromReception')}</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-ink">{t('bag.weightHint')}</p>
                </div>
              </div>

              <button
                type="button"
                disabled={!candidateBag || isBusy}
                onClick={openBag}
                className={cn(
                  'mt-auto flex h-[64px] flex-col items-center justify-center rounded-xl',
                  candidateBag ? primaryGradient : 'bg-mist text-white'
                )}
              >
                <span className="flex items-center gap-2 text-[17px] font-semibold">
                  {t('bag.open')} {candidateBag ? <Kbd light>Enter</Kbd> : null}
                </span>
                <span className="text-xs text-white/80">
                  {candidateBag
                    ? `${candidateBag.friendlyCode} · ${bagWeight || '—'} kg`
                    : t('bag.openHint')}
                </span>
              </button>
            </section>
            <BagList
              bags={bags}
              items={items}
              highlight={candidateBag?.id}
              onPick={(bag) => bag.processedAt == null && pickBag(bag)}
              t={t}
            />
          </>
        ) : null}

        {/* 3 · Registar peças */}
        {step === 'items' && request && activeBag ? (
          <>
            <section className="flex flex-1 flex-col gap-5 rounded-2xl bg-white p-5">
              <Row n={1} label={t('items.who')}>
                <div className="grid flex-1 grid-cols-4 gap-2">
                  <Choice hotkey="Q" active={form.sex === Sex.MALE} onClick={() => setForm({ ...form, sex: Sex.MALE })}>
                    {t('items.male')}
                  </Choice>
                  <Choice hotkey="W" active={form.sex === Sex.FEMALE} onClick={() => setForm({ ...form, sex: Sex.FEMALE })}>
                    {t('items.female')}
                  </Choice>
                  <Choice hotkey="A" active={form.ageGroup === AgeGroup.ADULT} onClick={() => setForm({ ...form, ageGroup: AgeGroup.ADULT })}>
                    {t('items.adult')}
                  </Choice>
                  <Choice hotkey="S" active={form.ageGroup === AgeGroup.CHILD} onClick={() => setForm({ ...form, ageGroup: AgeGroup.CHILD })}>
                    {t('items.child')}
                  </Choice>
                </div>
              </Row>

              <Row n={2} label={t('items.category')}>
                <div className="grid flex-1 grid-cols-4 gap-2">
                  {quickCategories.map((category, i) => (
                    <Choice
                      key={category}
                      hotkey={String(i + 1)}
                      active={form.category === category}
                      onClick={() => setForm({ ...form, category })}
                      className="text-sm"
                    >
                      {tCategory(category)}
                    </Choice>
                  ))}
                  <label
                    className={cn(
                      'relative flex h-[52px] items-center rounded-xl border-[1.5px] px-2',
                      form.category && !quickCategories.includes(form.category) ? 'border-navy bg-navy text-white' : 'border-line'
                    )}
                  >
                    <span className="absolute left-1.5 top-1">
                      <Kbd>8</Kbd>
                    </span>
                    <select
                      ref={otherCategoryRef}
                      aria-label={t('items.other')}
                      value={form.category && !quickCategories.includes(form.category) ? form.category : ''}
                      onChange={(e) => setForm({ ...form, category: (e.target.value || undefined) as Category | undefined })}
                      className="w-full bg-transparent pt-2 text-center text-sm font-medium outline-none"
                    >
                      <option value="">{t('items.other')}</option>
                      {otherCategories.map((c) => (
                        <option key={c} value={c} className="text-navy">
                          {tCategory(c)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </Row>

              <Row n={3} label={t('items.brand')}>
                <div className="flex flex-1 flex-col gap-2">
                  <Autocomplete
                    options={brands.map((b) => ({ value: b.id, label: b.name }))}
                    value={form.brandId}
                    onChange={(brandId) => setForm({ ...form, brandId })}
                    emptyMessage={tTriage('brandNotFound')}
                    placeholder={t('items.brandPlaceholder')}
                    allowCreate
                    createLabel={(q) => tTriage('createBrandOption', { name: q })}
                    onCreate={createBrand}
                  />
                  {recentBrands.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recentBrands.map((id) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setForm({ ...form, brandId: id })}
                          className={cn(
                            'h-8 rounded-full border px-4 text-[13px]',
                            form.brandId === id ? 'border-navy bg-navy text-white' : 'border-navy text-navy hover:bg-panel'
                          )}
                        >
                          {brandName(id)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Row>

              <Row n={4} label={t('items.details')}>
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <div className="flex h-[52px] items-center gap-1 rounded-xl bg-canvas px-1">
                    <button
                      type="button"
                      aria-label={t('items.less')}
                      onClick={() => setForm({ ...form, quantity: String(Math.max(1, (Number(form.quantity) || 1) - 1)) })}
                      className="flex size-11 items-center justify-center rounded-lg bg-white"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-16 text-center text-sm">{t('items.qtyLabel', { count: Number(form.quantity) || 1 })}</span>
                    <button
                      type="button"
                      aria-label={t('items.more')}
                      onClick={() => setForm({ ...form, quantity: String((Number(form.quantity) || 1) + 1) })}
                      className="flex size-11 items-center justify-center rounded-lg bg-white"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  {[
                    [Condition.EXCELLENT, 'E'],
                    [Condition.GOOD, 'B'],
                    [Condition.REGULAR, 'R'],
                  ].map(([value, key]) => (
                    <Choice
                      key={value}
                      hotkey={key}
                      active={form.condition === value}
                      onClick={() => setForm({ ...form, condition: value as Condition })}
                      className="min-w-[88px] text-sm"
                    >
                      {tCondition(value)}
                    </Choice>
                  ))}
                  <span className="mx-1 h-8 w-px bg-line" />
                  {[
                    [Season.SUMMER, 'V'],
                    [Season.WINTER, 'I'],
                  ].map(([value, key]) => (
                    <Choice
                      key={value}
                      hotkey={key}
                      active={form.season === value}
                      onClick={() => setForm({ ...form, season: value as Season })}
                      className="min-w-[80px] text-sm"
                    >
                      {tSeason(value)}
                    </Choice>
                  ))}
                  <span className="mx-1 h-8 w-px bg-line" />
                  <span className="text-xs text-ink">{t('items.careLabel')}</span>
                  {[
                    [CareLabel.LEGIBLE, 'L'],
                    [CareLabel.ILLEGIBLE, 'G'],
                    [CareLabel.MISSING, 'N'],
                  ].map(([value, key]) => (
                    <Choice
                      key={value}
                      hotkey={key}
                      active={form.careLabel === value}
                      onClick={() => setForm({ ...form, careLabel: value as CareLabel })}
                      className="min-w-[88px] text-sm"
                    >
                      {tCareLabel(value)}
                    </Choice>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMoreDetails((v) => !v)}
                    className="text-xs font-semibold text-teal underline underline-offset-2"
                  >
                    {moreDetails ? t('items.lessDetails') : t('items.moreDetails')}
                  </button>
                  {moreDetails ? (
                    <div className="flex w-full flex-wrap items-center gap-2">
                      {form.category && DENIM_CATEGORIES.includes(form.category) ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!form.denim}
                            onChange={(e) => setForm({ ...form, denim: e.target.checked })}
                          />
                          {t('items.denim')}
                        </label>
                      ) : null}
                      {(['size', 'color', 'material'] as const).map((field) => (
                        <input
                          key={field}
                          value={form[field]}
                          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                          placeholder={t(`items.${field}`)}
                          className="h-10 w-36 rounded-lg border border-line px-3 text-sm"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </Row>

              <Row n={5} label={t('items.destination')}>
                <div className="grid flex-1 grid-cols-5 gap-2">
                  {REUSE_DESTINATIONS.map((destination, i) => (
                    <button
                      key={destination}
                      type="button"
                      onClick={() => setForm({ ...form, destination })}
                      aria-pressed={form.destination === destination}
                      className={cn(
                        'relative flex h-[60px] flex-col items-center justify-center rounded-xl px-2 text-center text-[13px] font-semibold',
                        form.destination === destination
                          ? 'bg-teal text-white'
                          : destination === Destination.UPCYCLING
                            ? 'bg-[#dceff3] text-navy'
                            : 'bg-[#e6f2ee] text-navy'
                      )}
                    >
                      <span className="absolute left-1.5 top-1">
                        <Kbd light={form.destination === destination}>{`F${i + 1}`}</Kbd>
                      </span>
                      {tDestination(destination)}
                    </button>
                  ))}
                </div>
              </Row>

              <div className="mt-auto grid grid-cols-[1fr_1fr_2fr] gap-3 border-t border-line-soft pt-4">
                <Choice hotkey="X" onClick={() => register(Destination.NON_REUSABLE)} className="h-[60px]">
                  {tDestination(Destination.NON_REUSABLE)}
                </Choice>
                <Choice hotkey="Z" onClick={() => register(Destination.ACCESSORY)} className="h-[60px]">
                  {tDestination(Destination.ACCESSORY)}
                </Choice>
                <button
                  type="button"
                  onClick={() => register()}
                  disabled={isBusy}
                  className={cn('flex h-[60px] flex-col items-center justify-center rounded-xl', primaryGradient)}
                >
                  <span className="flex items-center gap-2 text-[17px] font-semibold">
                    {t('items.register')} <Kbd light>Enter ↵</Kbd>
                  </span>
                  <span className="text-xs text-white/80">
                    {previewSlot ? `→ ${t('items.goesTo', { slot: slotLabel(previewSlot) })}` : t('items.fillToSee')}
                  </span>
                </button>
              </div>
            </section>

            <aside className="flex w-[340px] shrink-0 flex-col gap-3">
              {lastPlaced ? (
                <div className="flex flex-col gap-2 rounded-2xl bg-forest p-5 text-white">
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/70">{t('items.placedIn')}</p>
                  <p className="text-[28px] font-bold leading-tight">
                    {lastPlaced.slot ? slotLabel(lastPlaced.slot) : t('items.noLot')}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] text-white/80">{lastPlaced.label}</span>
                    <button
                      type="button"
                      onClick={undoLast}
                      className="flex items-center gap-1.5 rounded-full border border-white/60 px-3 py-1 text-xs font-semibold"
                    >
                      {t('items.undo')} <Kbd light>Ctrl Z</Kbd>
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="flex flex-1 flex-col rounded-2xl bg-white p-4">
                <div className="flex items-baseline justify-between border-b border-line-soft pb-2">
                  <h2 className="text-[15px] font-semibold">{t('items.inBag')}</h2>
                  <span className="font-mono text-[11px] text-ink">{t('items.pieces', { count: piecesOf(bagItems) })}</span>
                </div>
                {bagItems.length === 0 ? (
                  <p className="py-4 text-xs text-ink">{t('items.emptyBag')}</p>
                ) : (
                  [...bagItems].reverse().map((it, i) => {
                    const slot = resolveStorageSlot(it);
                    return (
                      <div key={it.id ?? i} className="group flex items-center justify-between gap-2 border-b border-line-soft py-2 text-[13px]">
                        <span className="min-w-0 truncate">
                          {brandName(it.brandId)} · {it.category ? tCategory(it.category) : tDestination(it.destination)}
                          {it.quantity > 1 ? ` · ×${it.quantity}` : ''}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-[11px] text-ink">
                          {slot ? slotLabel(slot) : tDestination(it.destination)}
                          <button
                            type="button"
                            aria-label={tTriage('removeItemTitle')}
                            onClick={() => removeItem(it)}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[13px] font-semibold">{t('items.requestBags')}</h2>
                  <span className="font-mono text-[10px] text-ink">
                    {t('bar.processed', { done: processedCount, total: bags.length })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {bags.map((b) => {
                    const known = bagWeightOf(b) > 0 || num(b.receivedWeight) > 0;
                    const state = b.id === activeBagId ? 'open' : b.processedAt ? 'done' : known ? 'todo' : 'noWeight';
                    return (
                      <span
                        key={b.id}
                        className={cn(
                          'rounded-lg px-2.5 py-1.5 font-mono text-[11px] leading-tight',
                          state === 'open' && 'bg-navy text-white',
                          state === 'done' && 'bg-[#e6f2ee] text-forest',
                          state === 'todo' && 'bg-canvas text-ink',
                          state === 'noWeight' && 'bg-[#fdf1dc] text-[#8a5a12]'
                        )}
                      >
                        {(b.friendlyCode ?? '').replace(/^\d{4}-/, '')}
                        <br />
                        <span className="font-sans text-[10px]">{t(`items.bagState.${state}`)}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </aside>
          </>
        ) : null}

        {/* 5 · Caixas e finalizar */}
        {step === 'boxes' && request ? (
          <>
            <section className="flex flex-1 flex-col gap-4 rounded-2xl bg-white p-8">
              <h1 className="text-left text-[28px] font-bold">{t('boxes.title')}</h1>
              <p className="text-[15px] text-ink">{t('boxes.body')}</p>
              {pendingLot ? (
                <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-teal bg-[#eaf3f5] p-4">
                  <div className="flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-teal">{t('boxes.readNow')}</p>
                    <p className="text-[22px] font-bold">{slotLabel(pendingLot.slot)}</p>
                    <p className="text-xs text-ink">{t('items.pieces', { count: pendingLot.pieces })}</p>
                  </div>
                  <ScanInput
                    inputRef={boxRef}
                    value={boxCode}
                    onChange={setBoxCode}
                    onScan={scanBox}
                    autoFocus
                    placeholder={t('boxes.placeholder')}
                    scanTitle={t('boxes.readNow')}
                    className="w-[260px]"
                    inputClassName="h-11 rounded-full border-[1.5px] border-navy font-mono"
                  />
                </div>
              ) : null}
              <div className="flex flex-col">
                {lots.map((lot) => {
                  const unit = unitFor(lot.key);
                  return (
                    <div key={lot.key} className="flex items-center gap-3 border-b border-line-soft py-3">
                      <span
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full text-xs',
                          unit ? 'bg-forest text-white' : 'bg-[#fdf1dc] text-[#8a5a12]'
                        )}
                      >
                        {unit ? <Check className="size-3.5" /> : '!'}
                      </span>
                      <span className="text-[16px] font-semibold">{slotLabel(lot.slot)}</span>
                      <span className="text-xs text-ink">{t('items.pieces', { count: lot.pieces })}</span>
                      <span className={cn('ml-auto font-mono text-xs', unit ? 'text-ink' : 'text-[#8a5a12]')}>
                        {unit ? t('boxes.box', { code: unit.friendlyCode ?? unit.id.slice(0, 8) }) : t('boxes.toRead')}
                      </span>
                      {unit ? (
                        <button
                          type="button"
                          aria-label={t('boxes.remove')}
                          onClick={() => setUnits((current) => current.filter((u) => u.id !== unit.id))}
                          className="text-ink hover:text-navy"
                        >
                          <X className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                {lots.length === 0 ? <p className="text-sm text-ink">{t('boxes.noLots')}</p> : null}
              </div>
            </section>
            <aside className="flex w-[400px] shrink-0 flex-col gap-3 rounded-2xl bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[17px] font-semibold">{t('boxes.checklist')}</h2>
                <span className="font-mono text-[11px] text-ink">
                  {checks.filter((c) => c.ok).length} {t('bar.of')} {checks.length}
                </span>
              </div>
              {checks.map((check) => (
                <div
                  key={check.label}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-[13px]',
                    check.ok ? 'bg-[#eef6f2]' : 'bg-[#fdf1dc] font-semibold'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full',
                      check.ok ? 'bg-forest text-white' : 'bg-white text-[#8a5a12]'
                    )}
                  >
                    {check.ok ? <Check className="size-3.5" /> : '!'}
                  </span>
                  <span className="flex-1">{check.label}</span>
                  <span className="font-mono text-[11px]">{check.value}</span>
                </div>
              ))}
              {processedCount < bags.length ? (
                <button type="button" onClick={() => setStep('bag')} className="text-left text-xs font-semibold text-teal underline">
                  {t('boxes.backToBags')}
                </button>
              ) : null}
              <button
                type="button"
                disabled={!ready || isBusy}
                onClick={finish}
                className={cn(
                  'mt-auto flex h-[64px] flex-col items-center justify-center rounded-xl text-white',
                  ready ? primaryGradient : 'bg-mist'
                )}
              >
                <span className="text-[17px] font-semibold">{t('boxes.finish')}</span>
                {!ready ? (
                  <span className="text-xs">
                    {pendingLot ? t('boxes.missingBoxes', { count: lots.filter((l) => !unitFor(l.key)).length }) : t('boxes.notReady')}
                  </span>
                ) : null}
              </button>
              <p className="text-center text-xs text-ink">{t('boxes.finishHint')}</p>
            </aside>
          </>
        ) : null}

        {/* 6 · Concluído */}
        {step === 'done' && summary ? (
          <section className="mx-auto flex w-full max-w-[860px] flex-col items-center justify-center gap-5 rounded-2xl bg-white p-10 text-center">
            <span className="flex size-[84px] items-center justify-center rounded-full bg-forest text-white">
              <Check className="size-10" />
            </span>
            <h1 className="text-[30px] font-bold">{t('done.title', { code: summary.code })}</h1>
            <p className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="rounded-full bg-neutral-badge px-2 py-0.5 text-ink">{tStatus(CollectionRequestStatus.COLLECTED)}</span>›
              <span className="rounded-full bg-neutral-badge px-2 py-0.5 text-ink">{tStatus(CollectionRequestStatus.SCREENING)}</span>›
              <span className="rounded-full bg-mint px-2 py-0.5 text-forest">{tStatus(CollectionRequestStatus.STOCKED)}</span>
            </p>
            <div className="grid w-full grid-cols-3 gap-3">
              {[
                [String(summary.pieces), t('done.pieces')],
                [`${summary.weight.toLocaleString('pt-PT', { maximumFractionDigits: 1 })} kg`, t('items.bags', { count: summary.bags })],
                [String(summary.lots), t('done.lots')],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-canvas py-5">
                  <p className="text-[28px] font-bold">{value}</p>
                  <p className="text-[13px] text-ink">{label}</p>
                </div>
              ))}
            </div>
            {summary.pieces > 0 ? (
              <div className="flex w-full flex-col gap-2">
                <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
                  {(
                    [
                      ['reuse', 'bg-teal'],
                      ['upcycling', 'bg-[#7fb6c6]'],
                      ['nonReusable', 'bg-[#b8c7cd]'],
                      ['accessory', 'bg-line'],
                    ] as const
                  ).map(([key, color]) =>
                    summary.split[key] > 0 ? (
                      <span key={key} className={color} style={{ width: `${(summary.split[key] / summary.pieces) * 100}%` }} />
                    ) : null
                  )}
                </div>
                <p className="flex flex-wrap gap-4 text-xs text-ink">
                  {(['reuse', 'upcycling', 'nonReusable', 'accessory'] as const)
                    .filter((key) => summary.split[key] > 0)
                    .map((key) => (
                      <span key={key}>
                        {t(`done.split.${key}`)} · {summary.split[key]}
                      </span>
                    ))}
                </p>
              </div>
            ) : null}
            <div className="grid w-full grid-cols-2 gap-3">
              <button
                type="button"
                onClick={backToQueue}
                className="h-[60px] rounded-full border-[1.5px] border-navy text-[15px] font-semibold"
              >
                {t('done.backToQueue')}
              </button>
              {queue?.queue[0]?.code ? (
                <button
                  type="button"
                  onClick={() => openRequest(queue.queue[0].code as string)}
                  className={cn('flex h-[60px] flex-col items-center justify-center rounded-xl', primaryGradient)}
                >
                  <span className="flex items-center gap-2 text-[17px] font-semibold">
                    {t('done.next')} <Kbd light>Enter</Kbd>
                  </span>
                  <span className="text-xs text-white/80">
                    {[queue.queue[0].code, queue.queue[0].clientName, t('items.bags', { count: queue.queue[0].bags })]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </button>
              ) : (
                <p className="flex items-center justify-center rounded-xl bg-canvas text-sm text-ink">{t('queue.empty')}</p>
              )}
            </div>
            <p className="text-xs text-ink">{t('done.clientSees')}</p>
          </section>
        ) : null}
      </main>

      {/* 4 · Confirmar saco vazio */}
      {confirmEmpty && activeBag ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/30 p-4" role="dialog" aria-modal>
          <div className="flex w-full max-w-[520px] flex-col gap-4 rounded-2xl bg-white p-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink">
              {t('close.bag', { code: activeBag.friendlyCode, weight: bagWeightOf(activeBag).toLocaleString('pt-PT') })}
            </p>
            <h2 className="text-[26px] font-bold">{t('close.title')}</h2>
            <p className="text-[15px] text-ink">{t('close.body')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                [piecesOf(bagItems), t('close.pieces')],
                [new Set(bagItems.map(itemSlotKey).filter(Boolean)).size, t('close.lots')],
                [bagItems.filter((it) => !itemSlotKey(it)).reduce((s, it) => s + it.quantity, 0), t('close.noLot')],
              ].map(([value, label]) => (
                <div key={String(label)} className="rounded-xl bg-canvas p-3">
                  <p className="text-[22px] font-bold">{value}</p>
                  <p className="text-xs text-ink">{label}</p>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-3 rounded-xl border-[1.5px] border-navy px-4 py-3 text-[15px] font-semibold">
              <input
                type="checkbox"
                autoFocus
                checked={emptyConfirmed}
                onChange={(e) => setEmptyConfirmed(e.target.checked)}
                className="size-5"
              />
              {t('close.confirm')}
            </label>
            {nextBag ? (
              <p className="rounded-xl bg-[#fdf1dc] px-4 py-2.5 text-[13px]">
                {t('close.next', {
                  count: bags.filter((b) => b.id !== activeBagId && b.processedAt == null).length,
                  code: nextBag.friendlyCode,
                })}
              </p>
            ) : (
              <p className="rounded-xl bg-[#eef6f2] px-4 py-2.5 text-[13px]">{t('close.last')}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmEmpty(false)}
                className="h-[52px] rounded-full border-[1.5px] border-navy text-[15px] font-semibold"
              >
                {t('close.back')} <span className="font-mono text-xs">Esc</span>
              </button>
              <button
                type="button"
                disabled={!emptyConfirmed || isBusy}
                onClick={closeBag}
                className={cn('flex h-[52px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold', emptyConfirmed ? primaryGradient : 'bg-mist text-white')}
              >
                {t('close.save')} <Kbd light>Enter</Kbd>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Escolher o posto */}
      {choosingStation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4" role="dialog" aria-modal>
          <div className="flex w-full max-w-[420px] flex-col gap-4 rounded-2xl bg-white p-7">
            <h2 className="text-[22px] font-bold">{t('station.title')}</h2>
            <p className="text-sm text-ink">{t('station.body')}</p>
            <div className="grid grid-cols-4 gap-2">
              {STATIONS.map((n) => (
                <Choice key={n} active={station === n} onClick={() => chooseStation(n)}>
                  {n}
                </Choice>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex w-[130px] shrink-0 items-center gap-2 pt-3.5">
        <span className="flex size-6 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
          {n}
        </span>
        <span className="text-[15px] font-semibold">{label}</span>
      </div>
      {children}
    </div>
  );
}

function BagList({
  bags,
  items,
  highlight,
  onPick,
  t,
}: {
  bags: CollectionRequestBagDTO[];
  items: TriageListItem[];
  highlight?: string;
  onPick: (bag: CollectionRequestBagDTO) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const done = bags.filter((b) => b.processedAt != null).length;
  return (
    <aside className="flex w-[350px] shrink-0 flex-col gap-2.5 rounded-2xl bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold">{t('bag.listTitle')}</h2>
        <span className="font-mono text-[10px] text-ink">{t('bar.processed', { done, total: bags.length })}</span>
      </div>
      {bags.map((bag) => {
        const pieces = items.filter((it) => it.bagId === bag.id).reduce((s, it) => s + it.quantity, 0);
        const weight = num(bag.weight) > 0 ? num(bag.weight) : num(bag.receivedWeight);
        const state = bag.processedAt ? 'done' : bag.id === highlight ? 'opening' : 'todo';
        return (
          <button
            key={bag.id}
            type="button"
            onClick={() => onPick(bag)}
            disabled={!!bag.processedAt}
            className={cn(
              'flex flex-col gap-1 rounded-xl border px-4 py-3 text-left',
              state === 'opening' ? 'border-2 border-navy bg-[#eaf3f5]' : 'border-line-soft hover:bg-panel disabled:hover:bg-white'
            )}
          >
            <span className="flex items-center justify-between">
              <span className="font-mono text-[14px]">{bag.friendlyCode}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  state === 'done' && 'bg-[#e6f2ee] text-forest',
                  state === 'opening' && 'bg-navy text-white',
                  state === 'todo' && 'bg-neutral-badge text-ink'
                )}
              >
                {t(`bag.state.${state}`)}
              </span>
            </span>
            <span className={cn('text-xs', weight > 0 ? 'text-ink' : 'text-[#8a5a12]')}>
              {weight > 0 ? `${weight.toLocaleString('pt-PT')} kg` : t('bag.noWeight')} ·{' '}
              {pieces > 0 ? t('items.pieces', { count: pieces }) : '—'}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-ink">{t('bag.anyOrder')}</p>
    </aside>
  );
}
