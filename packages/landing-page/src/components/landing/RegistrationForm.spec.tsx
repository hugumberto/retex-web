import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithIntl } from '../../test-utils/intl';
import RegistrationForm from './RegistrationForm';

const TOMTOM_URL = 'https://api.tomtom.test/search/';

const tomtomResponse = (overrides: Record<string, unknown> = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({
    results: [
      {
        address: {
          streetName: 'Vereda do Alto de Vilar',
          municipality: 'Maia, Trofa, Vila do Conde',
          municipalitySubdivision:
            'Nogueira e Silva Escura, Castêlo da Maia, Barca, Espinhosa, Milheirós, União das Freguesias de Coronado (São Romão e São Mamede)',
          countrySecondarySubdivision: 'Porto',
          countrySubdivision: 'Norte',
          country: 'Portugal',
          ...overrides,
        },
        position: { lat: 41.253486, lon: -8.603952 },
      },
    ],
  }),
});

const registerResponse = {
  ok: true,
  status: 200,
  json: async () => ({ inServiceZone: true }),
};

describe('RegistrationForm — normalização do endereço TomTom', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test/';
    process.env.NEXT_PUBLIC_TOMTOM_API_URL = TOMTOM_URL;
    process.env.NEXT_PUBLIC_TOMTOM_API_KEY = 'test-key';
  });

  const registerCall = () =>
    fetchMock.mock.calls.find((c) => String(c[0]).includes('user/register'));

  const fillRequiredFields = () => {
    fireEvent.change(screen.getByRole('textbox', { name: /nome/i }), {
      target: { value: 'José' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /apelido/i }), {
      target: { value: 'Matos' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'jose@example.com' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /telemóvel/i }), {
      target: { value: '911133133' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /morada/i }), {
      target: { value: 'Vereda do Alto de Vilar' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /porta/i }), {
      target: { value: '35' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /masculino/i }));
    fireEvent.change(screen.getByLabelText(/data de nascimento/i), {
      target: { value: '1989-08-25' },
    });
  };

  const triggerZipLookup = (value = '4475-390') => {
    const zip = screen.getByRole('textbox', { name: /código postal/i });
    fireEvent.change(zip, { target: { value } });
    fireEvent.blur(zip, { target: { value } });
  };

  it('guarda apenas a primeira localidade/freguesia da resposta agregada (regressão do 500)', async () => {
    fetchMock.mockImplementation((url: RequestInfo | URL) =>
      String(url).includes('tomtom')
        ? Promise.resolve(tomtomResponse())
        : Promise.resolve(registerResponse)
    );

    renderWithIntl(<RegistrationForm />);
    fillRequiredFields();
    triggerZipLookup();

    const cityInput = screen.getByRole('textbox', {
      name: /localidade/i,
    }) as HTMLInputElement;
    const divisionInput = screen.getByRole('textbox', {
      name: /freguesia/i,
    }) as HTMLInputElement;

    await waitFor(() => expect(cityInput.value).toBe('Maia'));
    expect(divisionInput.value).toBe('Nogueira e Silva Escura');

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(registerCall()).toBeTruthy());

    const body = JSON.parse(String((registerCall()![1] as RequestInit).body));

    expect(body.address.city).toBe('Maia');
    expect(body.address.cityDivision).toBe('Nogueira e Silva Escura');
    expect(body.address.cityDivision.length).toBeLessThanOrEqual(255);

    // Após sucesso, o formulário é limpo.
    const nomeInput = screen.getByRole('textbox', {
      name: /nome/i,
    }) as HTMLInputElement;
    await waitFor(() => expect(nomeInput.value).toBe(''));
    expect(cityInput.value).toBe('');
    expect(divisionInput.value).toBe('');
  });

  it('permite preencher a freguesia à mão quando a TomTom não a devolve', async () => {
    fetchMock.mockImplementation((url: RequestInfo | URL) =>
      String(url).includes('tomtom')
        ? Promise.resolve(tomtomResponse({ municipalitySubdivision: '' }))
        : Promise.resolve(registerResponse)
    );

    renderWithIntl(<RegistrationForm />);
    fillRequiredFields();
    triggerZipLookup();

    const divisionInput = screen.getByRole('textbox', {
      name: /freguesia/i,
    }) as HTMLInputElement;

    await waitFor(() => expect(divisionInput.value).toBe(''));

    fireEvent.change(divisionInput, { target: { value: 'Águas Santas' } });

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => expect(registerCall()).toBeTruthy());

    const body = JSON.parse(
      String((registerCall()![1] as RequestInit).body)
    );

    expect(body.address.cityDivision).toBe('Águas Santas');
  });
});
