import { Header } from '@/components/landing/Header';
import LandingFooter from '@/components/landing/LandingFooter';
import {
  apiUrl,
  BlogPost,
  excerpt,
  formatDate,
  isoDate,
  PaginatedResult,
} from '@/lib/blog';
import Link from 'next/link';

export const metadata = {
  title: 'Blog | RETEX',
  description: 'Novidades, artigos e atualizações da RETEX.',
};

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
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const { data: posts, meta } = await getPosts(current);
  const totalPages = Math.max(1, meta.totalPages);

  return (
    <main className="landing-shell flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 mt-[4rem]">
        <section className="landing-section blog-index">
          <header className="blog-index-head">
            <h1>Blog</h1>
            <p>Encontra aqui novidades e ideias sobre moda circular</p>
          </header>

          {posts.length === 0 ? (
            <p className="blog-empty">Ainda não há artigos publicados.</p>
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
                    <small>{post.categories?.[0]?.title ?? 'Blog'}</small>
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
            <nav className="blog-pagination" aria-label="Paginação do blog">
              {current > 1 ? (
                <Link
                  href={`/blog?page=${current - 1}`}
                  className="blog-page-btn"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="blog-page-btn is-disabled">← Anterior</span>
              )}
              <span className="blog-page-info">
                Página {current} de {totalPages}
              </span>
              {current < totalPages ? (
                <Link
                  href={`/blog?page=${current + 1}`}
                  className="blog-page-btn"
                >
                  Seguinte →
                </Link>
              ) : (
                <span className="blog-page-btn is-disabled">Seguinte →</span>
              )}
            </nav>
          )}
        </section>
      </div>
      <LandingFooter />
    </main>
  );
}
