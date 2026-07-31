import { render, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import React from 'react';
import ptMessages from '../i18n/messages/pt.json';

/**
 * Os componentes passaram a depender do contexto do next-intl. Os testes
 * continuam a asserir sobre os textos em português (o locale por omissão), por
 * isso basta injectar as mensagens PT.
 */
export function renderWithIntl(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="pt" messages={ptMessages}>
        {children}
      </NextIntlClientProvider>
    ),
  });
}
