import { Toaster } from 'sonner';
import '../global.css';

/**
 * Entrar, ativar conta e repor palavra-passe: faixa da marca à esquerda (em
 * ecrãs largos) e o cartão do formulário à direita.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="hidden w-[420px] shrink-0 flex-col justify-between bg-[linear-gradient(160deg,#013364_0%,#02748e_100%)] p-10 text-white lg:flex">
        <span className="text-[28px] font-bold">ReTeX:ID</span>
        <div>
          <p className="text-[26px] font-bold leading-tight">wear. care. share. repeat.</p>
          <p className="mt-3 max-w-[300px] text-sm text-white/75">
            Recolha, triagem e impacto do vestuário pós-consumo, num só sítio.
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-white/60">portal retex</span>
      </aside>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-8">
        <span className="text-[26px] font-bold text-navy lg:hidden">ReTeX:ID</span>
        {children}
      </main>
      <Toaster richColors />
    </div>
  );
}
