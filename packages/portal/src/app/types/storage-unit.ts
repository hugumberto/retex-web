export enum Quality {
  GOOD = 'GOOD',
  MEDIUM = 'MEDIUM',
  BAD = 'BAD',
}
export enum Status {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
export enum Sex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}
export enum AgeGroup {
  ADULT = 'ADULT',
  CHILD = 'CHILD',
}
export enum Type {
  UPPER_PART = 'UPPER_PART',
  UNDER_PART = 'UNDER_PART',
}
export enum Season {
  SUMMER = 'SUMMER',
  WINTER = 'WINTER',
}

export type StorageUnitDTO = {
  id: string;
  quality: Quality;
  sex: Sex;
  ageGroup: AgeGroup;
  type: Type;
  season: Season;
  status: Status;
  weight: number;
};

export type StorageUnitFormData = {
  quality: Quality;
  sex: Sex;
  ageGroup: AgeGroup;
  type: Type;
  season: Season;
  state: Status;
  weight: number;
};
