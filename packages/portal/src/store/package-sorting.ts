import { PackageSortingSlice, UiSlice } from "@/app/types/state";

export const createPackageSortingSlice = (
  set: (state: Partial<PackageSortingSlice>) => void
): PackageSortingSlice => ({
  brandState: [[], ()=>{}],
  storageUnitState: [[], (value) => set({ storageUnitState: [value, (v) => set({ storageUnitState: [v, (v2) => set({ storageUnitState: [v2, () => {}] })] })] })]
});


