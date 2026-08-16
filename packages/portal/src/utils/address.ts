/**
 * A TomTom Search API devolve `municipality` / `municipalitySubdivision`
 * concatenados por vírgula para códigos postais que abrangem várias
 * localidades (ex.: `4475-390` → "Maia, Trofa, Vila do Conde"). Guardar essa
 * string agregada rebenta a coluna `varchar(255)` do backend. Normalizamos
 * para a primeira entrada e limitamos a 255 chars por segurança.
 */
export const firstAddressPart = (value?: string): string =>
  (value ?? '').split(',')[0].trim().slice(0, 255);

export type PostalCodeLookup = {
  street: string;
  city: string;
  cityDivision: string;
  country: string;
  countryDivision: string;
  lat: string;
  long: string;
};

/**
 * Preenche uma morada a partir do código postal, pela Search API da TomTom.
 *
 * Devolve `null` quando o código postal não tem resultados — é um caso normal,
 * não um erro. Falhas de rede ou da API propagam-se, para quem chama poder
 * distinguir "não existe" de "não consegui perguntar".
 *
 * As coordenadas vêm como string porque é assim que os DTOs de morada as
 * aceitam; sem elas a API geocodifica pelo endereço, o que é mais lento e menos
 * exato do que o ponto que a TomTom já devolveu aqui.
 */
export async function lookupPostalCode(
  postalCode: string
): Promise<PostalCodeLookup | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_TOMTOM_API_URL}${encodeURIComponent(
      postalCode
    )}.json?typeahead=false&limit=1&countrySet=pt&extendedPostalCodesFor=addr&minFuzzyLevel=1&maxFuzzyLevel=2&view=Unified&relatedPois=off&key=${
      process.env.NEXT_PUBLIC_TOMTOM_API_KEY
    }`
  );
  if (!res.ok) throw new Error('TomTom search failed');

  const { results } = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const { address, position } = results[0];
  return {
    street: address.streetName ?? '',
    city: firstAddressPart(address.municipality),
    cityDivision: firstAddressPart(address.municipalitySubdivision),
    country: address.country ?? '',
    countryDivision: firstAddressPart(
      address.countrySecondarySubdivision ?? address.countrySubdivision
    ),
    lat: position?.lat ? String(position.lat) : '',
    long: position?.lon ? String(position.lon) : '',
  };
}
