'use client';

import { BlogPostDTO, BlogPostHighlight, BlogPostStatus } from '@/app/types/blog';
import { PaginatedResult } from '@/app/types/helper';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import TablePagination from '@/components/custom/table-pagination';
import { usePagination } from '@/hooks/use-pagination';
import { useAppStore } from '@/store';
import { useTranslations } from 'next-intl';
import { EyeIcon, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BlogCrud() {
  const t = useTranslations('blog');
  const tCommon = useTranslations('common');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const pagination = usePagination(posts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, status } = await api.get<PaginatedResult<BlogPostDTO>>(
        '/blog-post?limit=100'
      );
      if (!isSuccessStatus(status)) throw new Error('Erro ao buscar posts');
      setPosts(data.data);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.delete(`/blog-post/${id}`);
        if (!isSuccessStatus(res.status)) throw new Error('Erro ao eliminar post');
        await fetchPosts();
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPosts]
  );

  const handleDeleteWithToast = useCallback(
    async (id: string) => {
      await toast.promise(handleDelete(id), {
        loading: tCommon('loading'),
        success: t('deleteSuccess'),
        error: t('deleteError'),
      });
    },
    [handleDelete, t, tCommon]
  );

  const handlePublish = useCallback(
    async (id: string) => {
      await toast.promise(
        (async () => {
          const res = await api.put(`/blog-post/${id}/publish`);
          if (!isSuccessStatus(res.status)) throw new Error('Erro ao publicar');
          await fetchPosts();
        })(),
        {
          loading: t('publishing'),
          success: t('publishSuccess'),
          error: t('publishError'),
        }
      );
    },
    [fetchPosts, t]
  );

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/blog' }]);
    fetchPosts();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchPosts, setBreadcrumbs, setPageTitle, t]);

  const highlightLabel = (h: BlogPostHighlight) => {
    if (h === BlogPostHighlight.FEATURED) return t('highlightFeatured');
    if (h === BlogPostHighlight.HIGHLIGHTED) return t('highlightHighlighted');
    return '-';
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <Button asChild variant="secondary">
          <Link href="/portal/blog/new">{t('createPost')}</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <div className="w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon('title')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead>{t('highlight')}</TableHead>
              <TableHead>{tCommon('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.items.length > 0 ? (
              pagination.items.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>
                    {post.status === BlogPostStatus.PUBLISHED
                      ? t('statusPublished')
                      : t('statusDraft')}
                  </TableCell>
                  <TableCell>{highlightLabel(post.highlight)}</TableCell>
                  <TableCell className="space-x-2">
                    <Button asChild variant="ghost" size="icon" className="size-8">
                      <Link href={`/portal/blog/${post.id}`}>
                        <PencilIcon className="size-4" />
                      </Link>
                    </Button>
                    {post.status === BlogPostStatus.DRAFT && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title={t('publish')}
                        onClick={() => handlePublish(post.id)}
                        disabled={isSubmitting}
                      >
                        <EyeIcon className="size-4" />
                      </Button>
                    )}
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          className="size-8"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      }
                      onConfirm={() => handleDeleteWithToast(post.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>

        <TablePagination pagination={pagination} />
      </div>
    </section>
  );
}
