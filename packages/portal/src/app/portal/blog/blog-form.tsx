'use client';

import {
  BlogPostFormData,
  BlogPostHighlight,
  BlogPostStatus,
} from '@/app/types/blog';
import ImageUploadForm from '@/components/form/image-upload-form';
// import {
//   PackageCollectionDTO,
//   PackageCollectionFormData,
//   Shift,
// } from '@/app/types/package-collection';
// import { DialogForm } from '@/components/form/dialog-form';
import { InputForm } from '@/components/form/input-form';
import { KeywordsForm } from '@/components/form/keyword-form';
import { SelectForm } from '@/components/form/select-form';
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor';
// import { Button } from '@/components/ui/button';
// import api from '@/lib/api';
// import { isSuccessStatus } from '@/lib/utils';
// import { PencilIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
// import { toast } from 'sonner';

interface BlogFormProps {
  packageCollectionId?: string;
  onSave: () => void;
}

export default function BlogForm({
  packageCollectionId,
  onSave,
}: BlogFormProps) {
  // Helper to convert a title into a URL-friendly slug
  const slugify = (input: string): string => {
    return input
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '') // remove diacritics
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // spaces to hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // trim hyphens at ends
  };

  const {
    control,
    // reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<BlogPostFormData>({
    defaultValues: {
      body: '',
      slug: '',
      title: '',
      hero: '',
      tags: [],
      status: BlogPostStatus.DRAFT,
      highlight: BlogPostHighlight.NONE,
    },
  });
  // const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isOpen, setIsOpen] = useState(false);
  // const [isEditing] = useState(!!packageCollectionId);
  const postHighlightOptions = [
    BlogPostHighlight.NONE,
    BlogPostHighlight.HIGHLIGHTED,
    BlogPostHighlight.FEATURED,
  ];
  const statusOptions = [BlogPostStatus.DRAFT, BlogPostStatus.PUBLISHED];

  // Auto-fill slug from title continuously until the user edits slug manually
  const titleValue = watch('title');

  useEffect(() => {
    // If user hasn't manually changed slug, keep it in sync with title
    if (!dirtyFields?.slug) {
      const next = titleValue ? slugify(titleValue) : '';
      setValue('slug', next, { shouldValidate: true, shouldDirty: false });
    }
  }, [titleValue, dirtyFields?.slug, setValue]);

  // const fetchCollectionDataById = async (
  //   id: string
  // ): Promise<BlogPostDTO | undefined> => {
  //   const { data, status } = await api.get<BlogPostDTO>(`/route/${id}`);
  //   if (!isSuccessStatus(status)) {
  //     console.error('Failed to fetch storage units');
  //     return;
  //   }
  //   return data;
  // };

  // const getEditingItem = async (): Promise<BlogPostFormData | undefined> => {
  //   if (packageCollectionId) {
  //     const data = await fetchCollectionDataById(packageCollectionId);
  //     if (data) {
  //       return {
  //         body: '',
  //         slug: '',
  //         title: '',
  //         hero: '',
  //         tags: [],
  //         status: BlogPostStatus.DRAFT,
  //         highlight: BlogPostHighlight.NONE,
  //       };
  //     } else {
  //       return undefined;
  //     }
  //   }
  //   return undefined;
  // };

  // const handleOpenChange = (open: boolean) => {
  //   setIsOpen(open);
  //   if (open && isEditing && packageCollectionId) {
  //     getEditingItem().then((data) => {
  //       reset(data);
  //     });
  //   }
  // };

  // const submit = async (data: BlogPostFormData) => {
  //   setIsSubmitting(true);
  //   toast.promise(
  //     async () => {
  //       if (isEditing) {
  //         const res = await api.put(`/route/${packageCollectionId}`, {
  //           ...data,
  //         });
  //         if (!isSuccessStatus(res.status))
  //           throw new Error('Erro na requisição');
  //         reset();
  //         return;
  //       }
  //       const res = await api.post(`/route`, {
  //         ...data,
  //       });
  //       if (!isSuccessStatus(res.status)) throw new Error('Erro na requisição');
  //       reset();
  //     },
  //     {
  //       loading: 'Loading...',
  //       success: () => {
  //         onSave?.();
  //         return `Recolha de Encomendas ${
  //           isEditing ? 'atualizada' : 'criada'
  //         } com sucesso`;
  //       },
  //       error: () => {
  //         return `Erro ao ${
  //           isEditing ? 'atualizar' : 'criar'
  //         } a recolha de encomendas`;
  //       },
  //     }
  //   );
  //   setIsSubmitting(false);
  // };

  return (
    <>
      {/* <DialogForm
       triggerText="Criar"
       title="Blog Post"
       onConfirm={handleSubmit(submit)}
       onOpenChange={handleOpenChange}
       loading={isSubmitting}
       errors={errors}
       trigger={
         isEditing ? (
           <Button variant="ghost" size="icon" className="size-8">
             <PencilIcon className="size-4" />
           </Button>
         ) : (
           <Button variant="secondary" className="ml-auto block">
             Criar
           </Button>
         )
       }
     >          */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <InputForm
            label="Titulo"
            name="title"
            control={control}
            rules={{ required: 'O motorista é obrigatório' }}
          />
        </div>
        <div>
          <InputForm
            label="Slug"
            name="slug"
            control={control}
            rules={{ required: 'O slug é obrigatório' }}
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
        <div className="col-span-1 md:col-span-2">
          <SelectForm
            label="Status"
            name="status"
            control={control}
            options={statusOptions}
            errors={errors}
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <SelectForm
            label="Highlight"
            name="highlight"
            control={control}
            options={postHighlightOptions}
            errors={errors}
          />
        </div>
      </div>
      <div>
        <SimpleEditor />
      </div>

      {/* </DialogForm> */}
    </>
  );
}
