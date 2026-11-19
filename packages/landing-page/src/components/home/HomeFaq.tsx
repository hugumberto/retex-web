'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type FaqItem = { title: string; description: string };

// A página inicial mostra só as primeiras perguntas; as restantes ficam em /faq.
const MAX_QUESTIONS = 5;

/**
 * Perguntas vindas da API (as mesmas de /faq). Sem resposta da API mostra-se
 * só o título e o link para a página completa, em vez de uma lista inventada.
 */
export default function HomeFaq() {
  const t = useTranslations('home.faq');
  const [items, setItems] = useState<FaqItem[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}faq`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Array<{ category: { items?: FaqItem[] } }>) =>
        setItems(
          data
            .flatMap((d) => d.category?.items ?? [])
            .slice(0, MAX_QUESTIONS)
        )
      )
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="flex w-full flex-col lg:max-w-[576px]">
      <h2 className="pb-6 text-[34px] font-bold tracking-[-0.03em] text-navy sm:text-[40px]">
        {t('title')}
      </h2>
      <div className="border-b border-line">
        {items.map((item, index) => (
          <details
            key={item.title}
            open={index === 0}
            className="group border-t border-line py-5"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2.5 text-[15px] font-semibold text-navy [&::-webkit-details-marker]:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/landing/seta-aberta.svg"
                alt=""
                width={8}
                height={6}
                className="rotate-90 transition-transform group-open:rotate-180"
              />
              {item.title}
            </summary>
            <p className="mt-3 text-sm leading-6 text-ink">{item.description}</p>
          </details>
        ))}
      </div>
      <Link
        href="/faq"
        className="pt-6 text-sm font-semibold text-teal underline underline-offset-2"
      >
        {t('seeAll')}
      </Link>
    </div>
  );
}
