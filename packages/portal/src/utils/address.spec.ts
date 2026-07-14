import { firstAddressPart } from './address';

describe('firstAddressPart', () => {
  it('devolve apenas a primeira localidade de uma string agregada', () => {
    expect(firstAddressPart('Maia, Trofa, Vila do Conde')).toBe('Maia');
  });

  it('devolve apenas a primeira freguesia e limita a 255 chars', () => {
    const freguesias = [
      'Nogueira e Silva Escura',
      'Castêlo da Maia',
      'Barca',
      'Espinhosa',
      'Milheirós',
      'União das Freguesias de Coronado (São Romão e São Mamede)',
    ].join(', ');

    const result = firstAddressPart(freguesias);

    expect(result).toBe('Nogueira e Silva Escura');
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it('mantém um valor único inalterado', () => {
    expect(firstAddressPart('Porto')).toBe('Porto');
  });

  it('faz trim dos espaços à volta da primeira entrada', () => {
    expect(firstAddressPart('  Lisboa , Sintra ')).toBe('Lisboa');
  });

  it('devolve string vazia para undefined ou vazio', () => {
    expect(firstAddressPart(undefined)).toBe('');
    expect(firstAddressPart('')).toBe('');
  });

  it('trunca uma primeira entrada com mais de 255 chars', () => {
    const longFirst = 'A'.repeat(300);
    expect(firstAddressPart(longFirst).length).toBe(255);
  });
});
