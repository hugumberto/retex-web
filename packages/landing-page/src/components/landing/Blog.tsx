'use client';

import { useEffect, useState } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  content: string;
  excerpt: string;
  date: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Blog() {
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        setLoading(true);
    
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/blog/public`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (!res.ok) {
          throw new Error('API not available');
        }

        const data = await res.json();
        
        if (data.featured && data.recent) {
          setFeaturedPost(data.featured);
          setRecentPosts(data.recent);
        } else if (Array.isArray(data) && data.length > 0) {
          setFeaturedPost(data[0]);
          setRecentPosts(data.slice(1, 4));
        } else if (Array.isArray(data.posts) && data.posts.length > 0) {
          setFeaturedPost(data.posts[0]);
          setRecentPosts(data.posts.slice(1, 4));
        } else {
          throw new Error('No blog posts available');
        }
      } catch {
        setFeaturedPost({
          id: '1',
          title: 'Título do post no Blog',
          category: 'Categoria',
          content:
            'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit aut consequuntur necessitatibus aut quidem blanditiis. Et impedit delectus est voluptates possimus rem',
          excerpt:
            'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit aut consequuntur necessitatibus aut quidem blanditiis. Et impedit delectus est voluptates possimus rem',
          date: '13.05.25',
        });
        setRecentPosts([
          {
            id: '2',
            title: 'Título do post no Blog Título do post no Blog',
            category: 'Categoria',
            content:
              'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit aut consequuntur necessitatibus aut quidem blanditiis.',
            excerpt:
              'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit',
            date: '13.05.25',
          },
          {
            id: '3',
            title: 'Título do post no Blog Título do post no Blog',
            category: 'Categoria',
            content:
              'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit aut consequuntur necessitatibus aut quidem blanditiis.',
            excerpt:
              'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit',
            date: '13.05.25',
          },
          {
            id: '4',
            title: 'Título do post no Blog Título do post no Blog',
            category: 'Categoria',
            content:
              'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit aut consequuntur necessitatibus aut quidem blanditiis.',
            excerpt:
              'Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem sed distinctio impedit',
            date: '13.05.25',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <section id="blog" className="py-16 px-4 md:px-8 font-family-poppins">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-primary">A carregar blog...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-16 px-4 md:px-8 font-family-poppins">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <p className="text-sm mb-2" style={{ color: '#02748e' }}>
            Novidades
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">
            O Nosso Blog
          </h1>
        </div>

        {/* Layout de Duas Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Post em Destaque */}
          <div className="lg:col-span-2">
            {featuredPost && (
              <article className="bg-white rounded-lg overflow-hidden shadow-sm">
                {/* Imagem em Destaque */}
                <div
                  className="relative w-full h-64 md:h-96"
                  style={{ backgroundColor: '#02748e33' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: '#02748e4d' }}
                    ></div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                  <span
                    className="inline-block px-3 py-1 text-xs font-medium rounded-full mb-4"
                    style={{
                      color: '#02748e',
                      backgroundColor: '#02748e1a',
                    }}
                  >
                    {featuredPost.category}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {featuredPost.content}
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: '#02748e' }}
                  >
                    {featuredPost.date}
                  </p>
                </div>
              </article>
            )}
          </div>

          {/* Coluna Direita - Barra Lateral de Posts Recentes */}
          <div className="lg:col-span-1 space-y-6">
            {recentPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm"
              >
                {/* Imagem Pequena */}
                <div
                  className="relative w-full h-32"
                  style={{ backgroundColor: '#02748e33' }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: '#02748e4d' }}
                    ></div>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <span
                    className="inline-block px-2 py-1 text-xs font-medium rounded-full mb-2"
                    style={{
                      color: '#02748e',
                      backgroundColor: '#02748e1a',
                    }}
                  >
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold text-primary mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: '#02748e' }}
                  >
                    {post.date}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

