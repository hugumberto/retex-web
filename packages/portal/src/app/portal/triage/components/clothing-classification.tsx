import { useTranslations } from 'next-intl';
import { Brand } from '@/app/types/brand';
import {
  AgeGroup,
  Category,
  Condition,
  Destination,
  Season,
  Sex,
} from '@/app/types/triage';
import Autocomplete from '@/components/custom/autocomplete';
import { PantsIcon } from '@/components/icons/pants-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Baby,
  Briefcase,
  Check,
  ChevronDown,
  Dumbbell,
  Layers,
  Moon,
  Package,
  Shirt,
  Snowflake,
  Sun,
  Trash2,
  User,
  UserRound,
  Waves,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

/** Formulário de uma peça na triagem. */
export type ClassificationForm = {
  sex?: Sex;
  ageGroup?: AgeGroup;
  // Mosaico escolhido; quando junta duas partes, `category` fica por escolher.
  tileKey?: string;
  category?: Category;
  condition?: Condition;
  destination: Destination;
  season?: Season;
  denim?: boolean;
  brandId: string;
  quantity: string;
  material: string;
  color: string;
  size: string;
};

// A esmagadora maioria dos itens é registada à unidade, por isso o campo já
// vem preenchido — poupa uma escrita por item num ecrã usado ao ritmo do scanner.
export const EMPTY_CLASSIFICATION: ClassificationForm = {
  destination: Destination.REUSE,
  brandId: '',
  quantity: '1',
  material: '',
  color: '',
  size: '',
};

// Só faz sentido perguntar por denim nas peças que podem ser de ganga.
const DENIM_CATEGORIES = [
  Category.TROUSERS,
  Category.SHORTS,
  Category.SKIRT,
  Category.JUMPSUIT,
  Category.COAT,
];

const REUSE_DESTINATIONS = [
  Destination.REUSE,
  Destination.VINTAGE,
  Destination.RECONDITIONING,
  Destination.UPCYCLING,
  Destination.STOCK_RESERVE,
];

type Tile = {
  key: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  // Uma categoria = escolha direta; várias = conjunto separado por partes.
  categories: Category[];
};

type PanelTheme = {
  border: string;
  surface: string;
  title: string;
  activeTab: string;
  tab: string;
  activeTile: string;
  tile: string;
};

// Os dois painéis distinguem-se pelos tons da marca — o azul-escuro do
// `primary` e o azul-petróleo do `secondary` — e não por azul/rosa, que não
// pertencem à paleta. O que separa um painel do outro é sobretudo o ícone, o
// título e a posição; a cor é só reforço.
const MALE_THEME: PanelTheme = {
  border: 'border-primary/20',
  surface: 'bg-primary/5',
  title: 'text-primary',
  activeTab: 'bg-primary text-white border-primary',
  tab: 'bg-white text-primary border-primary/25 hover:bg-primary/10',
  activeTile: 'border-primary bg-primary/5 ring-2 ring-primary/25',
  tile: 'text-primary',
};

const FEMALE_THEME: PanelTheme = {
  border: 'border-secondary/25',
  surface: 'bg-secondary/5',
  title: 'text-secondary',
  activeTab: 'bg-secondary text-white border-secondary',
  tab: 'bg-white text-secondary border-secondary/25 hover:bg-secondary/10',
  activeTile: 'border-secondary bg-secondary/5 ring-2 ring-secondary/25',
  tile: 'text-secondary',
};

function ChoiceButtons<T extends string>({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: { value: T; label: string }[];
  selected?: T;
  onSelect: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={selected === option.value ? 'secondary' : 'outline'}
          className={cn(
            'min-w-24',
            selected === option.value && 'ring-2 ring-secondary/25'
          )}
          onClick={() => onSelect(option.value)}
          disabled={disabled}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-secondary/15 bg-white px-4 py-3 md:flex-row md:items-center">
      <div className="text-sm font-medium text-secondary md:w-48 md:shrink-0">
        {label}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type ClassificationProps = {
  form: ClassificationForm;
  onChange: (patch: Partial<ClassificationForm>) => void;
  brands: Brand[];
  onCreateBrand: (name: string) => Promise<string | null>;
  onRegister: () => void | Promise<void>;
  // Regista já, só com a quantidade: não reutilizável ou acessório.
  onQuickRegister: (
    destination: Destination.NON_REUSABLE | Destination.ACCESSORY
  ) => void | Promise<void>;
  isRegisterDisabled?: boolean;
  isBusy?: boolean;
  disabled?: boolean;
};

export default function ClothingClassification({
  form,
  onChange,
  brands,
  onCreateBrand,
  onRegister,
  onQuickRegister,
  isRegisterDisabled,
  isBusy,
  disabled,
}: ClassificationProps) {
  const t = useTranslations('triage');
  const tTiles = useTranslations('triage.tiles');
  const tCategory = useTranslations('enums.category');
  const tCondition = useTranslations('enums.condition');
  const tDestination = useTranslations('enums.destination');
  const tSeason = useTranslations('enums.season');
  const tCommon = useTranslations('common');
  const [showDetails, setShowDetails] = useState(false);
  // Separador (adulto / infantil) de cada painel; o painel ativo é o do sexo.
  const [tabs, setTabs] = useState<Record<Sex, AgeGroup>>({
    [Sex.MALE]: form.sex === Sex.MALE ? form.ageGroup ?? AgeGroup.ADULT : AgeGroup.ADULT,
    [Sex.FEMALE]:
      form.sex === Sex.FEMALE ? form.ageGroup ?? AgeGroup.ADULT : AgeGroup.ADULT,
  });

  const tilesBySex = useMemo<Record<Sex, Tile[]>>(() => {
    const suits: Tile = {
      key: 'suits',
      label: tTiles('suits'),
      hint: tTiles('suitsHint'),
      icon: Briefcase,
      categories: [Category.SUIT_JACKET, Category.SUIT_TROUSERS],
    };
    const sportswear = (hint: string): Tile => ({
      key: 'sportswear',
      label: tTiles('sportswear'),
      hint,
      icon: Dumbbell,
      categories: [Category.SPORTSWEAR_TOP, Category.SPORTSWEAR_BOTTOM],
    });
    const pajamas: Tile = {
      key: 'pajamas',
      label: tTiles('pajamas'),
      hint: tTiles('pajamasHint'),
      icon: Moon,
      categories: [Category.PAJAMA_TOP, Category.PAJAMA_BOTTOM],
    };
    const common = {
      trousers: {
        key: 'trousers',
        label: tTiles('trousers'),
        hint: tTiles('trousersHint'),
        icon: PantsIcon,
        categories: [Category.TROUSERS],
      },
      shorts: {
        key: 'shorts',
        label: tTiles('shorts'),
        icon: PantsIcon,
        categories: [Category.SHORTS],
      },
      sweaters: {
        key: 'sweaters',
        label: tTiles('sweaters'),
        hint: tTiles('sweatersHint'),
        icon: Shirt,
        categories: [Category.SWEATER],
      },
      coats: {
        key: 'coats',
        label: tTiles('coats'),
        hint: tTiles('coatsHint'),
        icon: Shirt,
        categories: [Category.COAT],
      },
      jumpsuits: {
        key: 'jumpsuits',
        label: tTiles('jumpsuits'),
        icon: Layers,
        categories: [Category.JUMPSUIT],
      },
    } satisfies Record<string, Tile>;

    return {
      [Sex.MALE]: [
        {
          key: 'tops',
          label: tTiles('tops'),
          icon: Shirt,
          categories: [Category.TOP],
        },
        common.trousers,
        common.shorts,
        common.sweaters,
        common.coats,
        suits,
        {
          key: 'underwear',
          label: tTiles('underwear'),
          hint: tTiles('underwearMaleHint'),
          icon: Layers,
          categories: [Category.UNDERSHIRT, Category.UNDERPANTS],
        },
        sportswear(tTiles('sportswearHint')),
        {
          key: 'swimwear',
          label: tTiles('swimwear'),
          hint: tTiles('swimwearMaleHint'),
          icon: Waves,
          categories: [Category.SWIM_BOTTOM],
        },
        pajamas,
        common.jumpsuits,
      ],
      [Sex.FEMALE]: [
        {
          key: 'tops',
          label: tTiles('topsFemale'),
          icon: Shirt,
          categories: [Category.TOP],
        },
        {
          key: 'dresses',
          label: tTiles('dresses'),
          icon: Shirt,
          categories: [Category.DRESS],
        },
        {
          key: 'skirts',
          label: tTiles('skirts'),
          icon: PantsIcon,
          categories: [Category.SKIRT],
        },
        common.trousers,
        common.shorts,
        common.sweaters,
        common.coats,
        suits,
        {
          key: 'underwear',
          label: tTiles('underwear'),
          hint: tTiles('underwearFemaleHint'),
          icon: Layers,
          categories: [Category.BRA, Category.UNDERPANTS],
        },
        sportswear(tTiles('sportswearHint')),
        {
          key: 'swimwear',
          label: tTiles('swimwear'),
          hint: tTiles('swimwearFemaleHint'),
          icon: Waves,
          categories: [Category.SWIM_TOP, Category.SWIM_BOTTOM, Category.SWIMSUIT],
        },
        pajamas,
        common.jumpsuits,
      ],
    };
  }, [tTiles]);

  const brandOptions = useMemo(
    () => brands.map((item) => ({ value: item.id, label: item.name })),
    [brands]
  );

  const selectedTile = form.sex
    ? tilesBySex[form.sex].find((tile) => tile.key === form.tileKey)
    : undefined;
  const showDenim = !!form.category && DENIM_CATEGORIES.includes(form.category);

  const selectTab = (sex: Sex, ageGroup: AgeGroup) => {
    setTabs((current) => ({ ...current, [sex]: ageGroup }));
    // Mudar de painel limpa a categoria: os mosaicos de cada sexo diferem.
    onChange(
      form.sex === sex
        ? { ageGroup }
        : { sex, ageGroup, tileKey: undefined, category: undefined, denim: undefined }
    );
  };

  const selectTile = (sex: Sex, tile: Tile) => {
    const category = tile.categories.length === 1 ? tile.categories[0] : undefined;
    onChange({
      sex,
      ageGroup: tabs[sex],
      tileKey: tile.key,
      category,
      denim: category && DENIM_CATEGORIES.includes(category) ? form.denim : undefined,
    });
  };

  const renderPanel = (sex: Sex) => {
    const theme = sex === Sex.MALE ? MALE_THEME : FEMALE_THEME;
    const isActivePanel = form.sex === sex;
    const PanelIcon = sex === Sex.MALE ? User : UserRound;

    return (
      <div className={cn('rounded-2xl border p-4', theme.border, theme.surface)}>
        <div className="mb-3 flex items-center gap-3">
          <PanelIcon className={cn('size-8', theme.title)} />
          <div>
            <h3 className={cn('text-lg font-bold uppercase', theme.title)}>
              {sex === Sex.MALE ? t('maleTitle') : t('femaleTitle')}
            </h3>
            <p className={cn('text-xs', theme.title)}>
              {sex === Sex.MALE ? t('maleSubtitle') : t('femaleSubtitle')}
            </p>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          {[AgeGroup.ADULT, AgeGroup.CHILD].map((ageGroup) => {
            const isActive = tabs[sex] === ageGroup;
            const TabIcon = ageGroup === AgeGroup.ADULT ? User : Baby;
            const label =
              sex === Sex.MALE
                ? ageGroup === AgeGroup.ADULT
                  ? t('adultMale')
                  : t('childMale')
                : ageGroup === AgeGroup.ADULT
                ? t('adultFemale')
                : t('childFemale');
            return (
              <button
                key={ageGroup}
                type="button"
                disabled={disabled}
                onClick={() => selectTab(sex, ageGroup)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                  isActive ? theme.activeTab : theme.tab
                )}
              >
                <TabIcon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
          {tilesBySex[sex].map((tile) => {
            const Icon = tile.icon;
            const isSelected = isActivePanel && form.tileKey === tile.key;
            return (
              <button
                key={tile.key}
                type="button"
                disabled={disabled}
                onClick={() => selectTile(sex, tile)}
                className={cn(
                  'flex min-h-24 flex-col items-center justify-center gap-1 rounded-lg border border-secondary/15 bg-white p-2 text-center transition-colors hover:bg-secondary/5 disabled:opacity-50',
                  isSelected && theme.activeTile
                )}
              >
                <Icon className={cn('size-6', theme.tile)} />
                <span className="text-[11px] font-semibold leading-tight text-secondary">
                  {tile.label}
                </span>
                {tile.hint && (
                  <span className="text-[10px] leading-tight text-secondary/60">
                    ({tile.hint})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Conjuntos: cada parte é registada como uma peça, no seu lote. */}
        {isActivePanel && selectedTile && selectedTile.categories.length > 1 && (
          <div className="mt-3 rounded-lg border border-secondary/15 bg-white p-3">
            <p className="mb-2 text-xs font-medium text-secondary">
              {t('partChoice')}
            </p>
            <ChoiceButtons
              options={selectedTile.categories.map((category) => ({
                value: category,
                label: tCategory(category),
              }))}
              selected={form.category}
              onSelect={(category) => onChange({ category })}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 text-center">
        <h2 className="text-2xl font-bold uppercase text-secondary">
          {t('classificationTitle')}
        </h2>
        <p className="text-sm text-secondary/70">{t('classificationSubtitle')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderPanel(Sex.MALE)}
        {renderPanel(Sex.FEMALE)}
      </div>

      <div className="mt-4 space-y-2">
        {showDenim && (
          <FieldRow
            label={
              <>
                {t('denimLabel')}{' '}
                <span className="text-xs font-normal text-secondary/60">
                  {t('denimHint')}
                </span>
              </>
            }
          >
            <ChoiceButtons
              options={[
                { value: 'yes', label: tCommon('yes') },
                { value: 'no', label: tCommon('no') },
              ]}
              selected={
                form.denim === undefined ? undefined : form.denim ? 'yes' : 'no'
              }
              onSelect={(value) => onChange({ denim: value === 'yes' })}
              disabled={disabled}
            />
          </FieldRow>
        )}

        <FieldRow label={t('brandLabel')}>
          <Autocomplete
            options={brandOptions}
            value={form.brandId}
            onChange={(brandId) => onChange({ brandId })}
            placeholder={t('brandPlaceholder')}
            emptyMessage={t('brandNotFound')}
            disabled={disabled}
            allowCreate={!disabled}
            createLabel={(query) => t('createBrandOption', { name: query })}
            onCreate={onCreateBrand}
            className="w-full"
          />
        </FieldRow>

        <FieldRow label={t('quantityLabel')}>
          <Input
            type="number"
            min={1}
            value={form.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
            disabled={disabled}
            className="max-w-32"
          />
        </FieldRow>

        <FieldRow label={t('conditionLabel')}>
          <ChoiceButtons
            options={Object.values(Condition).map((value) => ({
              value,
              label: tCondition(value),
            }))}
            selected={form.condition}
            onSelect={(condition) => onChange({ condition })}
            disabled={disabled}
          />
        </FieldRow>

        <FieldRow label={t('destinationLabel')}>
          <ChoiceButtons
            options={REUSE_DESTINATIONS.map((value) => ({
              value,
              label: tDestination(value),
            }))}
            selected={form.destination}
            onSelect={(destination) => onChange({ destination })}
            disabled={disabled}
          />
        </FieldRow>

        <FieldRow label={t('seasonLabel')}>
          <div className="flex flex-wrap gap-2">
            {[Season.SUMMER, Season.WINTER].map((season) => {
              const Icon = season === Season.SUMMER ? Sun : Snowflake;
              const isActive = form.season === season;
              return (
                <Button
                  key={season}
                  type="button"
                  variant={isActive ? 'secondary' : 'outline'}
                  className={cn('min-w-24', isActive && 'ring-2 ring-secondary/25')}
                  onClick={() => onChange({ season })}
                  disabled={disabled}
                >
                  <Icon className="size-4" />
                  {tSeason(season)}
                </Button>
              );
            })}
          </div>
        </FieldRow>

        <div className="rounded-xl border border-secondary/15 bg-white">
          <button
            type="button"
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-secondary"
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
          >
            {t('moreDetails')}
            <ChevronDown
              className={cn('size-4 transition-transform', showDetails && 'rotate-180')}
            />
          </button>
          {showDetails && (
            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-3">
              {(
                [
                  ['material', t('materialLabel'), 100],
                  ['color', t('colorLabel'), 50],
                  ['size', t('sizeLabel'), 20],
                ] as const
              ).map(([field, label, maxLength]) => (
                <label key={field} className="text-sm text-secondary">
                  <span className="mb-1 block">{label}</span>
                  <Input
                    value={form[field]}
                    maxLength={maxLength}
                    onChange={(e) => onChange({ [field]: e.target.value })}
                    disabled={disabled}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-green-200 bg-green-50/60 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-secondary">
            {t('otherRecordsTitle')}
          </p>
          <p className="mb-2 text-xs text-secondary/70">{t('otherRecordsHint')}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => onQuickRegister(Destination.NON_REUSABLE)}
              disabled={disabled || isBusy}
            >
              <Trash2 className="size-4" />
              {t('nonReusableButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onQuickRegister(Destination.ACCESSORY)}
              disabled={disabled || isBusy}
            >
              <Package className="size-4" />
              {t('accessoryButton')}
            </Button>
          </div>
        </div>
        <Button
          type="button"
          className="h-12 min-w-48 bg-green-700 text-base text-white hover:bg-green-800"
          onClick={onRegister}
          disabled={disabled || isBusy || isRegisterDisabled}
        >
          <Check className="size-5" />
          {t('registerItem')}
        </Button>
      </div>
    </div>
  );
}
