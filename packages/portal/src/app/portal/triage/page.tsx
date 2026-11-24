'use client';

import { Role } from '@/app/types/user';
import { getUserRoles } from '@/lib/access-control';
import { useAppStore } from '@/store';
import TriageOverview from './triage-overview';
import TriageStation from './triage-station';

/**
 * Triagem: a administração vê a supervisão dos postos; quem só faz triagem
 * (OPS) entra direto no posto. O posto também abre em /portal/triage/posto.
 */
export default function TriagePage() {
  const { user } = useAppStore();
  if (!user) return null;
  return getUserRoles(user).includes(Role.ADMIN) ? <TriageOverview /> : <TriageStation />;
}
