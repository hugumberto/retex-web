'use client';

import { BlogCategory } from '@/app/types/blog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import {
  Control,
  Controller,
  FieldErrors,
  FieldValues,
  Path,
} from 'react-hook-form';
import { toast } from 'sonner';

interface CategoryPickerFormProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  id?: string;
  errors?: FieldErrors<T>;
  className?: string;
}

export function CategoryPickerForm<T extends FieldValues>({
  name,
  control,
  label,
  id,
  errors,
  className,
}: CategoryPickerFormProps<T>) {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const error = errors?.[name];

  const fetchCategories = useCallback(async () => {
    try {
      const { data, status } = await api.get<BlogCategory[]>('/blog-category');
      if (isSuccessStatus(status)) setCategories(data);
    } catch {
      // silencioso: a lista fica vazia, o utilizador ainda pode criar
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (onChange: (ids: string[]) => void, selected: string[]) => {
    const title = newTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      const { data, status } = await api.post<BlogCategory>('/blog-category', {
        title,
      });
      if (!isSuccessStatus(status)) throw new Error();
      setCategories((prev) => [...prev, data].sort((a, b) => a.title.localeCompare(b.title)));
      onChange([...selected, data.id]);
      setNewTitle('');
    } catch {
      toast.error('Não foi possível criar a categoria');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={className}>
      <Label htmlFor={id || name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value) ? field.value : [];
          const toggle = (categoryId: string) => {
            if (selected.includes(categoryId)) {
              field.onChange(selected.filter((cId) => cId !== categoryId));
            } else {
              field.onChange([...selected, categoryId]);
            }
          };

          return (
            <div className="mt-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                {categories.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Sem categorias. Crie a primeira abaixo.
                  </span>
                )}
                {categories.map((category) => {
                  const isSelected = selected.includes(category.id);
                  return (
                    <Badge
                      key={category.id}
                      variant="outline"
                      onClick={() => toggle(category.id)}
                      aria-pressed={isSelected}
                      className={`cursor-pointer select-none px-3 py-1 transition-colors ${
                        isSelected
                          ? 'border-transparent bg-secondary text-white hover:bg-secondary/90'
                          : 'border-secondary text-secondary hover:bg-secondary/10'
                      }`}
                    >
                      {category.title}
                    </Badge>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      createCategory(field.onChange, selected);
                    }
                  }}
                  placeholder="Nova categoria..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!newTitle.trim() || creating}
                  onClick={() => createCategory(field.onChange, selected)}
                >
                  Adicionar
                </Button>
              </div>

              {error && typeof error.message === 'string' && (
                <p className="text-red-500 text-sm">{error.message}</p>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
