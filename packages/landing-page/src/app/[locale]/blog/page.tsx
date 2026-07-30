import { Header } from '@/components/landing/Header';
import LandingFooter from '@/components/landing/LandingFooter';
import { Link } from '@/i18n/navigation';
import {
  apiUrl,
  BlogPost,
  excerpt,
  formatDate,
  isoDate,
  PaginatedResult,
} from '@/lib/blog';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.blog' });

  return { title: t('title'), description: t('description') };
}

const LIMIT = 12;

async function getPosts(page: number): Promise<PaginatedResult<BlogPost>> {
  try {
    const res = await fetch(
      apiUrl(`blog-post/public?page=${page}&limit=${LIMIT}`),
      { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      data: [],
      meta: { total: 0, page, limit: LIMIT, totalPages: 1 },
    };
  }
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const current = Math.max(1, Number(page) || 1);
  const { data: posts, meta } = await getPosts(current);
  const totalPages = Math.max(1, meta.totalPages);

  return (
    <main className="landing-shell flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 mt-[4rem]">
        <section className="landing-section blog-index">
          <header className="blog-index-head">
            <h1>{t('indexTitle')}</h1>
            <p>{t('indexSubtitle')}</p>
          </header>

          {posts.length === 0 ? (
            <p className="blog-empty">{t('empty')}</p>
          ) : (
            <div className="blog-index-grid">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="blog-card"
                >
                  <div className="blog-card-visual">
                    {post.hero ? (
                      <img src={post.hero} alt={post.title} />
                    ) : (
                      <div
                        className="blog-featured-visual--placeholder"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="blog-copy">
                    <small>
                      {post.categories?.[0]?.title ?? t('defaultCategory')}
                    </small>
                    <h3>{post.title}</h3>
                    <p>{excerpt(post.body, 130)}</p>
                    <div className="blog-meta-row">
                      <time
                        className="blog-date"
                        dateTime={isoDate(post.publishDate)}
                      >
                        {formatDate(post.publishDate)}
                      </time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="blog-pagination" aria-label={t('paginationAria')}>
              {current > 1 ? (
                <Link
                  href={`/blog?page=${current - 1}`}
                  className="blog-page-btn"
                >
                  {t('previous')}
                </Link>
              ) : (
                <span className="blog-page-btn is-disabled">
                  {t('previous')}
                </span>
              )}
              <span className="blog-page-info">
                {t('pageInfo', { current, total: totalPages })}
              </span>
              {current < totalPages ? (
                <Link
                  href={`/blog?page=${current + 1}`}
                  className="blog-page-btn"
                >
                  {t('next')}
                </Link>
              ) : (
                <span className="blog-page-btn is-disabled">{t('next')}</span>
              )}
            </nav>
          )}
        </section>
      </div>
      <LandingFooter />
    </main>
  );
}
