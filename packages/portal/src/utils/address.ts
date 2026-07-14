/**
 * A TomTom Search API devolve `municipality` / `municipalitySubdivision`
 * concatenados por vírgula para códigos postais que abrangem várias
 * localidades (ex.: `4475-390` → "Maia, Trofa, Vila do Conde"). Guardar essa
 * string agregada rebenta a coluna `varchar(255)` do backend. Normalizamos
 * para a primeira entrada e limitamos a 255 chars por segurança.
 */
export const firstAddressPart = (value?: string): string =>
  (value ?? '').split(',')[0].trim().slice(0, 255);
