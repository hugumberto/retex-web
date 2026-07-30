import { Header } from '@/components/landing/Header';
import LandingFooter from '@/components/landing/LandingFooter';
import { Link } from '@/i18n/navigation';
import { localeHtmlLang, type Locale } from '@/i18n/routing';
import {
  apiUrl,
  BlogPost,
  formatDateLong,
  isoDate,
  PaginatedResult,
  stripHtml,
} from '@/lib/blog';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr', 'blockquote',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's', 'span', 'mark', 'sub', 'sup',
    'a', 'img', 'pre', 'code',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      apiUrl(`blog-post/public/${encodeURIComponent(slug)}`),
      { next: { revalidate: 300 } }
    );
    if (res.status === 404 || !res.ok) return null;
    const post: BlogPost = await res.json();
    post.body = sanitizeHtml(post.body ?? '', SANITIZE_OPTIONS);
    return post;
  } catch {
    return null;
  }
}

async function getRecent(excludeSlug: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(apiUrl('blog-post/public?limit=4'), {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const { data }: PaginatedResult<BlogPost> = await res.json();
    return (data ?? []).filter((p) => p.slug !== excludeSlug).slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    const t = await getTranslations({ locale, namespace: 'metadata.post' });
    return { title: t('notFound') };
  }

  const description = stripHtml(post.body).slice(0, 160);
  return {
    title: `${post.title} | RETEX`,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      ...(post.hero ? { images: [{ url: post.hero }] } : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const dateLocale = localeHtmlLang[locale as Locale] ?? 'pt-PT';
  const recent = await getRecent(slug);

  return (
    <main className="landing-shell flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 mt-[4rem]">
        <article className="blog-article">
          <header className="blog-article-head">
            {post.categories?.[0] && (
              <small className="blog-article-category">
                {post.categories[0].title}
              </small>
            )}
            <h1>{post.title}</h1>
            {post.publishDate && (
              <time
                className="blog-article-date"
                dateTime={isoDate(post.publishDate)}
              >
                {formatDateLong(post.publishDate, dateLocale)}
              </time>
            )}
          </header>

          <div className="blog-article-grid">
            <div className="blog-article-main">
              {post.hero && (
                <div className="blog-article-hero">
                  <img src={post.hero} alt={post.title} />
                </div>
              )}
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.body }}
              />
            </div>

            {recent.length > 0 && (
              <aside className="blog-article-aside">
                <h2 className="blog-aside-title">{t('recentTitle')}</h2>
                <div className="blog-aside-list">
                  {recent.map((p) => (
                    <Link
                      key={p.id}
                      href={`/blog/${p.slug}`}
                      className="blog-aside-item"
                    >
                      <div className="blog-aside-thumb">
                        {p.hero ? (
                          <img src={p.hero} alt={p.title} />
                        ) : (
                          <div
                            className="blog-thumb-placeholder"
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="blog-aside-copy">
                        <h3>{p.title}</h3>
                        <time
                          className="blog-date"
                          dateTime={isoDate(p.publishDate)}
                        >
                          {formatDateLong(p.publishDate, dateLocale)}
                        </time>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </article>
      </div>
      <LandingFooter />
    </main>
  );
}
