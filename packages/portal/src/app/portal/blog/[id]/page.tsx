'use client';

import { BlogPostDTO, BlogPostFormData } from '@/app/types/blog';
import { PaginatedResult } from '@/app/types/helper';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import BlogForm from '../blog-form';

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<BlogPostFormData | undefined>();
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    try {
      const { data, status } = await api.get<PaginatedResult<BlogPostDTO>>(
        '/blog-post?limit=100'
      );
      if (!isSuccessStatus(status)) throw new Error();
      const post = data.data.find((p) => p.id === params.id);
      if (!post) {
        toast.error('Post não encontrado');
        return;
      }
      setInitialData({
        id: post.id,
        title: post.title,
        slug: post.slug,
        body: post.body,
        hero: post.hero,
        tags: post.tags,
        status: post.status,
        highlight: post.highlight,
        categoryIds: post.categories?.map((category) => category.id) ?? [],
      });
    } catch {
      toast.error('Não foi possível carregar o post');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  if (loading) {
    return <p className="p-6 text-muted-foreground">Carregando...</p>;
  }

  return <BlogForm blogPostId={params.id} initialData={initialData} />;
}
