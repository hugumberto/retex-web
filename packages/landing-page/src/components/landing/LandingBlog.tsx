'use client';

import { Link } from '@/i18n/navigation';
import {
  apiUrl,
  BlogPost,
  excerpt,
  formatDate,
  isoDate,
  PaginatedResult,
} from '@/lib/blog';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

function BlogSidePost({ post }: { post: BlogPost }) {
  const t = useTranslations('blog');

  return (
    <Link href={`/blog/${post.slug}`} className="blog-row">
      <div className="blog-thumb">
        {post.hero ? (
          <img src={post.hero} alt={post.title} />
        ) : (
          <div className="blog-thumb-placeholder" aria-hidden />
        )}
      </div>
      <div className="blog-copy">
        <small>{post.categories?.[0]?.title ?? t('defaultCategory')}</small>
        <h3>{post.title}</h3>
        <p>{excerpt(post.body, 110)}</p>
        <div className="blog-meta-row">
          <time className="blog-date" dateTime={isoDate(post.publishDate)}>
            {formatDate(post.publishDate)}
          </time>
        </div>
      </div>
    </Link>
  );
}

export default function LandingBlog() {
  const t = useTranslations('blog');
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch(apiUrl('blog-post/public?limit=4'))
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((res: PaginatedResult<BlogPost>) => setPosts(res.data ?? []))
      .catch(() => {
        /* secção fica escondida quando a API não responde */
      });
  }, []);

  if (posts.length === 0) return null;

  const [featured, ...rest] = posts;
  const side = rest.slice(0, 3);

  return (
    <section id="blog" className="landing-section blog">
      <p className="blog-kicker">{t('kicker')}</p>
      <h2>{t('sectionTitle')}</h2>
      <div className="blog-grid">
        <Link href={`/blog/${featured.slug}`} className="blog-featured">
          <div className="blog-featured-visual">
            {featured.hero ? (
              <img src={featured.hero} alt={featured.title} />
            ) : (
              <div className="blog-featured-visual--placeholder" aria-hidden />
            )}
          </div>
          <div className="blog-copy blog-copy--featured">
            <small>
              {featured.categories?.[0]?.title ?? t('defaultCategory')}
            </small>
            <h3>{featured.title}</h3>
            <p>{excerpt(featured.body)}</p>
            <div className="blog-meta-row">
              <time
                className="blog-date"
                dateTime={isoDate(featured.publishDate)}
              >
                {formatDate(featured.publishDate)}
              </time>
            </div>
          </div>
        </Link>
        {side.length > 0 && (
          <div className="blog-side">
            {side.map((post) => (
              <BlogSidePost key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
      <div className="blog-see-all-row">
        <Link href="/blog" className="blog-see-all">
          {t('seeAll')}
        </Link>
      </div>
    </section>
  );
}
