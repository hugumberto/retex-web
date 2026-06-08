import { AppStore, AuthSlice } from '@/app/types/state';
import { StateCreator, create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createAuthSlice } from './auth';
import { createUiSlice } from './ui';

const createStateCreator: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  AppStore
> = (set, get) => ({
  ...createUiSlice(set),
  ...createAuthSlice(set, get as () => AuthSlice),
});

export const useAppStore = create<AppStore>()(
  devtools(persist(createStateCreator, { name: 'retex-ai-storage' }))
);
