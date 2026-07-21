// Rótulos PT-PT dos atributos de itens (qualidade, sexo, faixa etária, tipo,
// estação), apresentados ao utilizador nas tabelas de triagem/armazém.
// Keyed por string para ser agnóstico ao enum de origem (package.ts vs
// storage-unit.ts partilham os mesmos valores).

export const QUALITY_LABEL: Record<string, string> = {
  GOOD: 'Boa',
  MEDIUM: 'Regular',
  BAD: 'Má',
};

export const SEX_LABEL: Record<string, string> = {
  MALE: 'Homem',
  FEMALE: 'Mulher',
};

export const AGE_GROUP_LABEL: Record<string, string> = {
  ADULT: 'Adulto',
  CHILD: 'Infantil',
};

export const TYPE_LABEL: Record<string, string> = {
  UPPER_PART: 'Superior',
  UNDER_PART: 'Inferior',
};

export const SEASON_LABEL: Record<string, string> = {
  SUMMER: 'Verão',
  WINTER: 'Inverno',
};
