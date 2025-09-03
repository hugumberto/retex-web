import { Label } from '@/components/ui/label';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { Input } from '../ui/input';

interface InputFormProps<T extends FieldValues> {
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

export function InputForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  type = 'text',
  placeholder,
  rules,
  errors,
  className,
}: InputFormProps<T>) {
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
            <Input
              {...field}
              id={id || name}
              type={type}
              placeholder={placeholder}
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
        )}
      />
    </div>
  );
}
