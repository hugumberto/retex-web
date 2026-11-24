'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';

// Ecrãs de trabalho (posto de triagem, motorista) têm a ação principal em
// baixo; aí os avisos aparecem em cima para não a taparem.
const TOP = ['/portal/triage', '/portal/coleta'];

export default function PortalToaster() {
  const pathname = usePathname() ?? '';
  const top = TOP.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return <Toaster richColors position={top ? 'top-center' : 'bottom-right'} />;
}
