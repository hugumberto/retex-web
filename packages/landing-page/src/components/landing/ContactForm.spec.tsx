import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ContactForm from './ContactForm';

describe('ContactForm', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test/';
  });

  it('mostra erros obrigatorios ao tentar enviar vazio', async () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole('button', { name: /submeter/i }));

    const requiredMessages = await screen.findAllByText('Campo obrigatório');
    expect(requiredMessages.length).toBeGreaterThan(0);
  });

  it('remove o erro obrigatorio do nome quando o campo e preenchido', async () => {
    render(<ContactForm />);

    const nomeInput = screen.getByRole('textbox', { name: /nome/i });

    fireEvent.click(screen.getByRole('button', { name: /submeter/i }));

    await waitFor(() => {
      expect(nomeInput.className).toContain('field-error');
    });

    fireEvent.change(nomeInput, {
      target: { value: 'Ana Silva' },
    });

    await waitFor(() => {
      expect(nomeInput.className).not.toContain('field-error');
    });
  });

  it('envia o formulario para a API package', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    render(<ContactForm />);

    fireEvent.change(screen.getByRole('textbox', { name: /nome/i }), {
      target: { value: 'Ana Silva' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /telemóvel/i }), {
      target: { value: '912345678' },
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: /local de recolha/i }),
      {
        target: { value: 'Rua das Flores 1, Lisboa' },
      }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: /horário de recolha/i }),
      {
        target: { value: 'Segunda de manhã' },
      }
    );
    fireEvent.change(screen.getByRole('textbox', { name: /mensagem/i }), {
      target: { value: 'Tenho sacos para recolher.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submeter/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/package');

    const submitRequest = fetchMock.mock.calls[0][1] as RequestInit;
    const submitBody = JSON.parse(String(submitRequest.body));

    expect(submitBody.firstName).toBe('Ana');
    expect(submitBody.lastName).toBe('Silva');
    expect(submitBody.email).toBe('ana@example.com');
    expect(submitBody.contactPhone).toBe('912345678');
    expect(submitBody.dayOfWeek).toBe('Segunda-Feira');
    expect(submitBody.timeOfDay).toBe('Manhã');
    expect(submitBody.address.street).toBe('Rua das Flores 1, Lisboa');

    await waitFor(() => {
      expect(
        screen.getByText('Formulário enviado com sucesso!')
      ).toBeTruthy();
    });
  });
});
