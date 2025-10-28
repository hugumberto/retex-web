'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { Label } from '@/components/ui/label';

interface KeywordsFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  id?: string;
  type?: string;
  placeholder?: string;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  errors?: FieldErrors<T>;
  className?: string;
}

type KeywordsInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
};

// Presentational controlled input for keywords (chips) used by the form wrapper below
function KeywordsInput({
  value,
  onChange,
  placeholder = 'Add keywords and press Enter...',
  className,
}: KeywordsInputProps) {
  const [input, setInput] = React.useState('');

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput('');
  };

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeKeyword(value[value.length - 1]);
    }
  };

  return (
    <div
      className={`w-full border rounded-md p-2 flex flex-wrap items-center gap-2 focus-within:ring-2 focus-within:ring-ring ${
        className || ''
      }`}
    >
      {value.map((keyword) => (
        <Badge
          key={keyword}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          {keyword}
          <X
            aria-label={`Remove ${keyword}`}
            className="h-3 w-3 cursor-pointer"
            onClick={() => removeKeyword(keyword)}
          />
        </Badge>
      ))}
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
      />
    </div>
  );
}

// React Hook Form wrapper to use inside forms
export function KeywordsForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  placeholder,
  rules,
  errors,
  className,
}: KeywordsFormProps<T>) {
  const error = errors?.[name];

  return (
    <div className={className}>
      <Label htmlFor={id || name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => {
          const keywords = Array.isArray(field.value) ? field.value : [];
          return (
            <>
              <KeywordsInput
                value={keywords}
                onChange={(v) => field.onChange(v)}
                placeholder={placeholder}
                className={
                  error && typeof error === 'object' && 'message' in error
                    ? 'border-red-500'
                    : 'border-secondary'
                }
              />
              {error &&
                typeof error === 'object' &&
                'message' in error &&
                typeof error.message === 'string' && (
                  <p className="text-red-500 text-sm mt-1">{error.message}</p>
                )}
            </>
          );
        }}
      />
    </div>
  );
}
