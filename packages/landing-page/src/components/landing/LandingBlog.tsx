function BlogSidePost() {
  return (
    <article className="blog-row">
      <div className="blog-thumb">
        <div className="blog-thumb-placeholder" aria-hidden />
      </div>
      <div className="blog-copy">
        <small>Categoria</small>
        <h3>Título do post no Blog Título do post no Blog</h3>
        <p>
          Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus dolorem.
        </p>
        <div className="blog-meta-row">
          <time className="blog-date" dateTime="2025-05-13">
            13.05.25
          </time>
        </div>
      </div>
    </article>
  );
}

export default function LandingBlog() {
  return (
    <section id="blog" className="landing-section blog">
      <p className="blog-kicker">Novidades</p>
      <h2>O Nosso Blog</h2>
      <div className="blog-grid">
        <article className="blog-featured">
          <div className="blog-featured-visual blog-featured-visual--placeholder" />
          <div className="blog-copy blog-copy--featured">
            <small>Categoria</small>
            <h3>Título do post no Blog</h3>
            <p>
              Lorem ipsum dolor sit amet. Cum galisum omnis ea necessitatibus
              dolorem sed distinctio impedit. At vero eos et accusam et justo duo
              dolores et ea rebum.
            </p>
            <div className="blog-meta-row">
              <time className="blog-date" dateTime="2025-05-13">
                13.05.25
              </time>
            </div>
          </div>
        </article>
        <div className="blog-side">
          <BlogSidePost />
          <BlogSidePost />
          <BlogSidePost />
        </div>
      </div>
    </section>
  );
}
