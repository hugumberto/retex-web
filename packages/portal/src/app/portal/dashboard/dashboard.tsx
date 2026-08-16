'use client';

import { Role } from '@/app/types/user';
import { DashboardSkeleton } from '@/components/dashboard';
import { getUserRoles } from '@/lib/access-control';
import { useAppStore } from '@/store';
import AdminDashboard from './admin-dashboard';
import ScopedDashboard from './scoped-dashboard';

/**
 * A mesma rota serve três audiências: ADMIN vê a operação toda, e qualquer
 * outro utilizador vê os seus próprios números — da empresa, se for membro de
 * uma, ou dele próprio.
 */
export default function Dashboard() {
  const { user, companyContextLoaded } = useAppStore();
  const isAdmin = getUserRoles(user).includes(Role.ADMIN);

  // O contexto de empresa fica fora do localStorage de propósito, por isso em
  // cada recarregamento há uma janela em que a audiência é desconhecida. O
  // ADMIN decide-se só pela role e não precisa de esperar; os restantes sim,
  // senão o ecrã pisca a vista errada antes de assentar.
  if (!isAdmin && !companyContextLoaded) {
    return <DashboardSkeleton />;
  }

  return isAdmin ? <AdminDashboard /> : <ScopedDashboard />;
}
