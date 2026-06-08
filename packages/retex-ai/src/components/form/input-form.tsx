import { Control, Controller, FieldErrors, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface InputFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: string;
  placeholder?: string;
  rules?: RegisterOptions<T, Path<T>>;
  errors?: FieldErrors<T>;
}

export function InputForm<T extends FieldValues>({
  name, control, label, type = 'text', placeholder, rules, errors,
}: InputFormProps<T>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name as string}>{label}</Label>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <Input id={name as string} type={type} placeholder={placeholder} {...field} />
        )}
      />
      {errors?.[name] && (
        <p className="text-xs text-destructive">{errors[name]?.message as string}</p>
      )}
    </div>
  );
}
