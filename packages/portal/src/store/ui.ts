import { UiSlice } from "@/app/types/state";

export const createUiSlice = (
  set: (state: Partial<UiSlice>) => void
): UiSlice => ({
  pageTitle: '',
  setPageTitle: (title: string) => set({ pageTitle: title }),
  breadcrumbs: [],
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
});


