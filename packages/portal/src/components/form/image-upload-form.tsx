import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';

type ImageUploadInputProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  accept?: string;
  maxSize?: number; // bytes
  id?: string;
  className?: string;
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) ?? '');
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function ImageUploadInput({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  id,
  className,
}: ImageUploadInputProps) {
  const [localError, setLocalError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      setLocalError(
        `Imagem excede o tamanho máximo de ${(maxSize / (1024 * 1024)).toFixed(
          1
        )}MB`
      );
      // reset selection
      e.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      onChange(dataUrl);
    } catch {
      setLocalError('Falha ao ler arquivo da imagem');
    }
  };

  const handleClear = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <Input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
        />
        {value && (
          <Button type="button" data-style="ghost" onClick={handleClear}>
            Remover
          </Button>
        )}
      </div>
      {value && (
        <div className="mt-3">
          {/* Using native img for simplicity because source is a local data URL. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pré-visualização"
            className="h-28 w-28 rounded-md border object-cover"
          />
        </div>
      )}
      {localError && <p className="mt-1 text-sm text-red-500">{localError}</p>}
    </div>
  );
}

interface ImageUploadFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  id?: string;
  accept?: string;
  maxSize?: number;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  errors?: FieldErrors<T>;
  className?: string;
}

export function ImageUploadForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  accept,
  maxSize,
  rules,
  errors,
  className,
}: ImageUploadFormProps<T>) {
  const error = errors?.[name];

  return (
    <div className={className}>
      <Label htmlFor={id || name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => {
          const value = (field.value as string | null) ?? null;
          return (
            <>
              <ImageUploadInput
                id={id || name}
                value={value}
                onChange={(val) => field.onChange(val)}
                accept={accept}
                maxSize={maxSize}
                className={`mt-1  w-full px-3 py-2 border ${
                  error ? 'border-red-500' : 'border-secondary'
                } rounded-md shadow-sm ${className || ''}`}
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

export default ImageUploadForm;
