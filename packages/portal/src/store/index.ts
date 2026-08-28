import { AppStore } from '@/app/types/state';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { createUiSlice } from './ui';

import { StateCreator } from 'zustand';
import { createAuthSlice } from './auth';
import { createCompanySlice } from './company';

const createStateCreator: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  AppStore
> = (set, get) => ({
  ...createUiSlice(set),
  ...createAuthSlice(set, get),
  ...createCompanySlice(set),
});

export const useAppStore = create<AppStore>()(
  devtools(
    persist(createStateCreator, {
      name: 'app-storage',
      // O contexto de empresa fica deliberadamente FORA do localStorage: as
      // permissões do perfil têm de ser revalidadas a cada arranque, senão um
      // perfil revogado sobrevivia em cache no cliente. É a mesma razão pela
      // qual a API o mantém fora do JWT (CompanyContextService).
      partialize: ({ companyContext, companyContextLoaded, ...rest }) => rest,
    })
  )
);
