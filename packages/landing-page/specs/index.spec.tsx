import React from 'react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../src/i18n/messages/pt.json';
import Page from '../src/app/[locale]/page';

// Em jsdom o next-intl resolve para o bundle de cliente, onde as APIs de
// servidor não existem. O smoke test só quer saber se a árvore renderiza.
jest.mock('next-intl/server', () => ({
  setRequestLocale: jest.fn(),
}));

// O router do App Router não está montado num teste de unidade; o Link e os
// hooks de navegação do next-intl são substituídos por equivalentes inertes.
jest.mock('@/i18n/navigation', () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  usePathname: () => '/',
}));

jest.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'pt' }),
}));

describe('Page', () => {
  it('should render successfully', async () => {
    // A página passou a ser um server component assíncrono (recebe o locale via
    // params), por isso resolvemos o elemento antes de o entregar ao RTL.
    const ui = await Page({ params: Promise.resolve({ locale: 'pt' }) });

    const { baseElement } = render(
      <NextIntlClientProvider locale="pt" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    );
    expect(baseElement).toBeTruthy();
  });
});
