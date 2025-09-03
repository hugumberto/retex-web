import { DatePicker } from '@/components/custom/date-picker';
import { Label } from '@/components/ui/label';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';

interface DatePickerFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  id?: string;
  placeholder?: string;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  errors?: FieldErrors<T>;
  className?: string;
}

export function DatePickerForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  placeholder,
  rules,
  errors,
  className,
}: DatePickerFormProps<T>) {
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
            <DatePicker
              {...field}
              selected={field.value}
              onChange={(date: unknown) => field.onChange(date)}
              className={`mt-1  w-full px-3 py-2 ${
                error ? 'border-red-500' : 'border-secondary'
              } rounded-md shadow-sm ${className || ''}`}
              placeholder={placeholder}
            />
            {error && typeof error.message === 'string' && (
              <p className="text-red-500 text-sm mt-1">{error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}
