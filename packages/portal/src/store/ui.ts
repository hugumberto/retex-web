import { UiSlice } from '@/app/types/state';

export const createUiSlice = (
  set: (state: Partial<UiSlice>) => void
): UiSlice => ({
  isDarkMode: false,
  pageTitle: '',
  setPageTitle: (title: string) => set({ pageTitle: title }),
  breadcrumbs: [],
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  setTheme: (isDarkMode) => set({ isDarkMode }),
});
