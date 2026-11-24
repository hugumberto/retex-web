'use client';

import { BlogPostDTO } from '@/app/types/blog';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import BlogForm from '../blog-form';

export default function EditBlogPage() {
  const t = useTranslations('blogEditor');
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPostDTO | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get<BlogPostDTO>(`/blog-post/${params.id}`)
      .then(({ data }) => setPost(data))
      .catch(() => {
        setFailed(true);
        toast.error(t('loadError'));
      });
  }, [params.id, t]);

  if (failed) return <p className="p-6 text-ink">{t('loadError')}</p>;
  if (!post) return <p className="p-6 text-ink">{t('loading')}</p>;
  return <BlogForm key={post.id} post={post} />;
}
