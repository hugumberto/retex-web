import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form';

import { RegisterOptions } from 'react-hook-form';

interface SelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  id?: string;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  errors?: FieldErrors<T>;
  className?: string;
}

export function SelectForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  options,
  placeholder = 'Selecionar',
  rules,
  errors,
  className,
}: SelectFieldProps<T>) {
  const error = errors?.[name];
  return (
    <div>
      <Label htmlFor={id || name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id={id || name}
                className={`mt-1 w-full px-3 py-2 border ${
                  error ? 'border-red-500' : 'border-secondary'
                } rounded-md shadow-sm ${className || ''}`}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(options) ? options : []).map((option) =>
                  typeof option === 'string' ? (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ) : (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {error && typeof error.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}
