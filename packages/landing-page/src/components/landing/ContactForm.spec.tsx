import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactForm from './ContactForm';

jest.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <select
      data-testid="mock-select"
      value={value ?? ''}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      <option value="">Selecione</option>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => children,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => children,
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

describe('ContactForm', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test/';
    process.env.NEXT_PUBLIC_TOMTOM_API_URL = 'https://tomtom.test/';
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY = 'tomtom-key';
  });

  it('mostra erros obrigatorios ao tentar enviar vazio', async () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole('button', { name: /submeter/i }));

    const requiredMessages = await screen.findAllByText('Campo obrigatório');
    expect(requiredMessages.length).toBeGreaterThan(0);
  });

  it('preenche a morada pelo codigo postal e envia o formulario', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              address: {
                streetName: 'Rua das Flores',
                municipality: 'Lisboa',
                countrySubdivision: 'Lisboa',
                countrySecondarySubdivision: 'Grande Lisboa',
                municipalitySubdivision: 'Santa Maria Maior',
                country: 'Portugal',
              },
              position: {
                lat: 38.7223,
                lon: -9.1393,
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

    render(<ContactForm />);

    fireEvent.change(screen.getByPlaceholderText('Nome*'), {
      target: { value: 'Ana' },
    });
    fireEvent.change(screen.getByPlaceholderText('Apelido*'), {
      target: { value: 'Silva' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email*'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contacto*'), {
      target: { value: '912345678' },
    });
    fireEvent.change(screen.getByPlaceholderText('NIF*'), {
      target: { value: '123456789' },
    });

    const postalCodeInput = screen.getByPlaceholderText('Código Postal');
    fireEvent.change(postalCodeInput, {
      target: { value: '1000-001' },
    });
    fireEvent.blur(postalCodeInput);

    await waitFor(() => {
      expect(
        (screen.getByPlaceholderText('Morada') as HTMLInputElement).value
      ).toBe('Rua das Flores');
    });

    fireEvent.change(screen.getByPlaceholderText('Nº edifício/porta*'), {
      target: { value: '12' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submeter/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(fetchMock.mock.calls[0][0]).toContain('https://tomtom.test/1000-001');
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.test/package');

    const submitRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const submitBody = JSON.parse(String(submitRequest.body));

    expect(submitBody.address.street).toBe('Rua das Flores');
    expect(submitBody.address.city).toBe('Lisboa');
    expect(submitBody.address.number).toBe('12');

    await waitFor(() => {
      expect(
        screen.getByText('Formulário enviado com sucesso!')
      ).toBeTruthy();
    });
  });
});
