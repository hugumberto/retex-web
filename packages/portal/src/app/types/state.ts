import React from "react";
import { Brand } from "./brand";
import { UserDTO } from "./user";
import { StorageUnitDTO } from "./storage-unit";


export interface AuthSlice {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDTO | null;
  setAccessToken: (t: string | null) => void;
  setRefreshToken: (t: string | null) => void;
  setUser: (u: UserDTO | null) => void;
  logout: () => Promise<void>;
}

export interface UiSlice {
  pageTitle: string;
  setPageTitle: (title: string) => void;
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void;
}
export interface PackageSortingSlice {
  brandState:[Brand[],React.Dispatch<React.SetStateAction<Brand[]>>];
  storageUnitState:[StorageUnitDTO[],React.Dispatch<React.SetStateAction<StorageUnitDTO[]>>];
}

export type State<T> = Partial<T> | T | ((state: T) => Partial<T> | T);
export type SetState<T> = (partial: State<T>, replace?: boolean, name?: string) => void;
export interface AppStore extends UiSlice, AuthSlice, PackageSortingSlice {}
