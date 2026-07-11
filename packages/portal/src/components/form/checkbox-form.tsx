import {
  Controller,
  Control,
  FieldValues,
  Path,
  FieldErrors,
  RegisterOptions,
} from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  id?: string;
  rules?: Omit<
    RegisterOptions<T, Path<T>>,
    'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
  >;
  errors?: FieldErrors<T>;
  className?: string;
  checked?: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CheckboxForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  rules,
  errors,
  className,
  checked,
  onCheckedChange,
  disabled,
}: CheckboxFormProps<T>) {
  const error = errors?.[name];
  return (
    <div>
      <div className="flex items-center gap-2">
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={() => (
            <Checkbox
              id={id || name}
              checked={checked}
              onCheckedChange={onCheckedChange}
              disabled={disabled}
              className={className}
            />
          )}
        />
        <Label htmlFor={id || name}>{label}</Label>
      </div>
      {error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string' && (
          <p className="text-red-500 text-sm mt-1">{error.message}</p>
        )}
    </div>
  );
}
