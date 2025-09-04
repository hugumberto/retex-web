import { AppStore } from '@/app/types/state';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { createUiSlice } from './ui';

import { StateCreator } from 'zustand';
import { createAuthSlice } from './auth';

const createStateCreator: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  AppStore
> = (set, get) => ({
  ...createUiSlice(set),
  ...createAuthSlice(set),
});

export const useAppStore = create<AppStore>()(
  devtools(persist(createStateCreator, { name: 'app-storage' }))
);
