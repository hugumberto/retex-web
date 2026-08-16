'use client';

import type { KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

export type AutocompleteOption = {
  value: string;
  label: string;
};

// Comparação tolerante a acentos e maiúsculas: escrever "sao" encontra "São".
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

type AutocompleteProps = {
  options: AutocompleteOption[];
  /** Valor selecionado; string vazia quando não há seleção. */
  value: string;
  onChange: (value: string) => void;
  emptyMessage: string;
  placeholder?: string;
  disabled?: boolean;
  /** Mostra a linha de criação quando o texto escrito não corresponde a nenhuma opção. */
  allowCreate?: boolean;
  createLabel?: (query: string) => string;
  /** Persiste a nova opção e devolve o seu valor, ou null se falhou. */
  onCreate?: (label: string) => Promise<string | null>;
  id?: string;
  className?: string;
};

export default function Autocomplete({
  options,
  value,
  onChange,
  emptyMessage,
  placeholder,
  disabled,
  allowCreate,
  createLabel,
  onCreate,
  id,
  className,
}: AutocompleteProps) {
  const generatedId = useId();
  const inputId = id ?? `autocomplete-${generatedId}`;
  const listId = `${inputId}-list`;
  const listRef = useRef<HTMLUListElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  // Só filtramos depois de o utilizador escrever: ao abrir com uma opção já
  // selecionada, o texto do campo é o rótulo dela e filtrar por ele esconderia
  // todas as outras.
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? '';

  // Fechado, o campo mostra sempre o rótulo da seleção — nunca texto órfão.
  // Depende de `selectedLabel` porque as opções podem chegar depois do valor.
  useEffect(() => {
    if (!open) {
      setQuery(selectedLabel);
      setIsTyping(false);
    }
  }, [open, selectedLabel]);

  const filteredOptions = useMemo(() => {
    const needle = normalize(query);
    if (!isTyping || !needle) return options;
    return options.filter((option) => normalize(option.label).includes(needle));
  }, [options, query, isTyping]);

  const trimmedQuery = query.trim();
  const showCreateRow = Boolean(
    allowCreate &&
      onCreate &&
      isTyping &&
      trimmedQuery &&
      !options.some((option) => normalize(option.label) === normalize(query))
  );

  // A linha de criação é o último item navegável da lista.
  const createRowIndex = filteredOptions.length;
  const itemCount = filteredOptions.length + (showCreateRow ? 1 : 0);

  useEffect(() => {
    setHighlightedIndex((current) =>
      itemCount === 0 ? 0 : Math.min(current, itemCount - 1)
    );
  }, [itemCount]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${highlightedIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex, open]);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    const selectedIndex = options.findIndex((option) => option.value === value);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [disabled, options, value]);

  const selectOption = useCallback(
    (option: AutocompleteOption) => {
      onChange(option.value);
      setOpen(false);
    },
    [onChange]
  );

  const createOption = useCallback(async () => {
    if (!onCreate || isCreating || !trimmedQuery) return;
    setIsCreating(true);
    try {
      const created = await onCreate(trimmedQuery);
      // Em caso de falha a lista fica aberta com o texto escrito, para o
      // utilizador poder corrigir sem reescrever tudo.
      if (created) {
        onChange(created);
        setOpen(false);
      }
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, onChange, onCreate, trimmedQuery]);

  const activateHighlighted = useCallback(() => {
    if (showCreateRow && highlightedIndex === createRowIndex) {
      void createOption();
      return;
    }
    const option = filteredOptions[highlightedIndex];
    if (option) selectOption(option);
  }, [
    createOption,
    createRowIndex,
    filteredOptions,
    highlightedIndex,
    selectOption,
    showCreateRow,
  ]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (itemCount === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((current) => (current + step + itemCount) % itemCount);
      return;
    }

    if (event.key === 'Enter') {
      if (!open) return;
      // Sem isto o Enter propagava para o ecrã de triagem (leitura de códigos).
      event.preventDefault();
      activateHighlighted();
      return;
    }

    if (event.key === 'Escape') {
      if (!open) return;
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        id={inputId}
        role="combobox"
        autoComplete="off"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={
          open && itemCount > 0 ? `${listId}-${highlightedIndex}` : undefined
        }
        className="pr-9"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsTyping(true);
          setHighlightedIndex(0);
          if (!open) setOpen(true);
        }}
        onFocus={openList}
        onClick={openList}
        // As opções cancelam o mousedown, por isso o blur só ocorre quando o
        // utilizador sai mesmo do campo.
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-secondary opacity-50" />

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[color:var(--color-secondary)] p-1"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === value}
              data-index={index}
              className={cn(
                'cursor-pointer rounded-sm px-2 py-1.5 text-sm text-secondary select-none',
                index === highlightedIndex && 'bg-accent text-accent-foreground'
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </li>
          ))}

          {filteredOptions.length === 0 && !showCreateRow && (
            <li className="px-2 py-1.5 text-sm text-secondary/55">
              {emptyMessage}
            </li>
          )}

          {showCreateRow && (
            <li
              id={`${listId}-${createRowIndex}`}
              role="option"
              aria-selected={false}
              aria-disabled={isCreating}
              data-index={createRowIndex}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-secondary select-none',
                filteredOptions.length > 0 && 'mt-1 border-t pt-2',
                createRowIndex === highlightedIndex &&
                  'bg-accent text-accent-foreground',
                isCreating && 'pointer-events-none opacity-50'
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlightedIndex(createRowIndex)}
              onClick={() => void createOption()}
            >
              <PlusIcon className="size-4 shrink-0" />
              {createLabel?.(trimmedQuery) ?? trimmedQuery}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
