// app/store/company.ts
import { CompanySlice } from '@/app/types/state';

export const createCompanySlice = (
  set: (state: Partial<CompanySlice>) => void
): CompanySlice => ({
  companyContext: null,
  // Arranca a `false` de propósito: enquanto não soubermos se o utilizador é (ou
  // não) membro de uma empresa, o guard não pode decidir sobre as rotas de
  // empresa. Ver `Protected` em app/portal/guard/guard.tsx.
  companyContextLoaded: false,
  setCompanyContext: (companyContext) =>
    set({ companyContext, companyContextLoaded: true }),
  clearCompanyContext: () =>
    set({ companyContext: null, companyContextLoaded: false }),
});
