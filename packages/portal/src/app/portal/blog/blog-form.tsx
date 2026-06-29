'use client';

import {
  BLOG_POST_HIGHLIGHT_LABELS,
  BlogPostFormData,
  BlogPostHighlight,
  BlogPostStatus,
} from '@/app/types/blog';
import { CategoryPickerForm } from '@/components/form/category-picker-form';
import ImageUploadForm from '@/components/form/image-upload-form';
import { InputForm } from '@/components/form/input-form';
import { KeywordsForm } from '@/components/form/keyword-form';
import { SelectForm } from '@/components/form/select-form';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface BlogFormProps {
  blogPostId?: string;
  initialData?: BlogPostFormData;
}

const slugify = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function BlogForm({ blogPostId, initialData }: BlogFormProps) {
  const router = useRouter();
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const isEditing = !!blogPostId;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<BlogPostFormData>({
    defaultValues: initialData ?? {
      body: '',
      slug: '',
      title: '',
      hero: '',
      tags: [],
      categoryIds: [],
      status: BlogPostStatus.DRAFT,
      highlight: BlogPostHighlight.NONE,
    },
  });

  useEffect(() => {
    if (initialData) reset(initialData);
  }, [initialData, reset]);

  useEffect(() => {
    const label = isEditing ? 'Editar Post' : 'Criar Post';
    setPageTitle(label);
    setBreadcrumbs([
      { label: 'Blog', href: '/portal/blog' },
      { label, href: '#' },
    ]);
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [isEditing, setBreadcrumbs, setPageTitle]);

  const titleValue = watch('title');
  const bodyValue = watch('body');

  useEffect(() => {
    if (!dirtyFields?.slug) {
      setValue('slug', titleValue ? slugify(titleValue) : '', {
        shouldValidate: true,
        shouldDirty: false,
      });
    }
  }, [titleValue, dirtyFields?.slug, setValue]);

  const onSubmit = useCallback(
    async (data: BlogPostFormData) => {
      setIsSubmitting(true);
      await toast.promise(
        (async () => {
          const res = await api.post('/blog-post', {
            ...data,
            // The select stores the value as a string; the backend expects the
            // numeric highlight enum (integer column), so coerce before sending.
            highlight: Number(data.highlight),
            ...(blogPostId ? { id: blogPostId } : {}),
          });
          if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
          router.push('/portal/blog');
        })(),
        {
          loading: 'Carregando...',
          success: `Post ${isEditing ? 'atualizado' : 'criado'} com sucesso!`,
          error: `Erro ao ${isEditing ? 'atualizar' : 'criar'} o post.`,
        }
      );
      setIsSubmitting(false);
    },
    [blogPostId, isEditing, router]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputForm
            label="Título"
            name="title"
            control={control}
            rules={{ required: 'O título é obrigatório' }}
            errors={errors}
          />
        </div>
        <div>
          <InputForm
            label="Slug"
            name="slug"
            control={control}
            rules={{ required: 'O slug é obrigatório' }}
            errors={errors}
          />
        </div>
        <div>
          <ImageUploadForm
            label="Hero Image"
            name="hero"
            control={control}
            rules={{ required: 'A imagem hero é obrigatória' }}
          />
        </div>
        <div>
          <KeywordsForm label="Keywords" name="tags" control={control} />
        </div>
        <div className="md:col-span-2">
          <CategoryPickerForm
            label="Categorias"
            name="categoryIds"
            control={control}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Status"
            name="status"
            control={control}
            options={[BlogPostStatus.DRAFT, BlogPostStatus.PUBLISHED]}
            errors={errors}
          />
        </div>
        <div>
          <SelectForm
            label="Highlight"
            name="highlight"
            control={control}
            options={[
              BlogPostHighlight.NONE,
              BlogPostHighlight.FEATURED,
              BlogPostHighlight.HIGHLIGHTED,
            ].map((value) => ({
              label: BLOG_POST_HIGHLIGHT_LABELS[value],
              value,
            }))}
            errors={errors}
          />
        </div>
      </div>

      <SimpleEditor
        content={bodyValue}
        onChange={(html) => setValue('body', html, { shouldDirty: true })}
      />

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/portal/blog')}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="secondary" disabled={isSubmitting}>
          {isSubmitting ? 'Processando...' : isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
}
