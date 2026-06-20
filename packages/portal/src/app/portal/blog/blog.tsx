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
import { useAppStore } from '@/store';
import { EyeIcon, PencilIcon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BlogCrud() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const { data, status } = await api.get<PaginatedResult<BlogPostDTO>>(
        '/blog-post?limit=100'
      );
      if (!isSuccessStatus(status)) throw new Error('Erro ao buscar posts');
      setPosts(data.data);
    } catch {
      toast.error('Não foi possível carregar os posts');
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.delete(`/blog-post/${id}`);
        if (!isSuccessStatus(res.status)) throw new Error('Erro ao eliminar post');
        await fetchPosts();
      } catch (err) {
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchPosts]
  );

  const handleDeleteWithToast = useCallback(
    async (id: string) => {
      await toast.promise(handleDelete(id), {
        loading: 'Carregando...',
        success: 'Post eliminado com sucesso!',
        error: 'Erro ao eliminar o post',
      });
    },
    [handleDelete]
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
          loading: 'Publicando...',
          success: 'Post publicado com sucesso!',
          error: 'Erro ao publicar o post',
        }
      );
    },
    [fetchPosts]
  );

  useEffect(() => {
    setPageTitle('Blog');
    setBreadcrumbs([{ label: 'Blog', href: '/portal/blog' }]);
    fetchPosts();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchPosts, setBreadcrumbs, setPageTitle]);

  const highlightLabel = (h: BlogPostHighlight) => {
    if (h === BlogPostHighlight.FEATURED) return 'Destaque';
    if (h === BlogPostHighlight.HIGHLIGHTED) return 'Realçado';
    return '-';
  };

  return (
    <section className="flex flex-col">
      <div className="flex justify-end mb-4">
        <Button asChild variant="secondary">
          <Link href="/portal/blog/new">Criar Post</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Destaque</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length > 0 ? (
            posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell>
                  {post.status === BlogPostStatus.PUBLISHED
                    ? 'Publicado'
                    : 'Rascunho'}
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
                      title="Publicar"
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
                Nenhum post encontrado!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
