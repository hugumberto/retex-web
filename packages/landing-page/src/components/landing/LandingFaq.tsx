'use client';

import { useEffect, useState } from 'react';

interface FaqItem {
  title: string;
  description: string;
}

interface FaqCategory {
  title: string;
  description: string;
  status: string;
  items: FaqItem[];
}

export default function LandingFaq() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}faq`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ category: FaqCategory }>) =>
        setCategories(data.map((d) => d.category))
      )
      .catch(() => {
        /* secção fica escondida quando a API não responde */
      });
  }, []);

  if (categories.length === 0) return null;

  return (
    <>
      {categories.map((category) => (
        <section key={category.title} id="faq" className="landing-section faq">
          <h2>{category.title}</h2>
          <p className="faq-subtitle">{category.description}</p>
          <div className="faq-list">
            {category.items.map((item) => (
              <details key={item.title}>
                <summary>{item.title}</summary>
                <p>{item.description}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
