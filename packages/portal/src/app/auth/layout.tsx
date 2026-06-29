import { Toaster } from 'sonner';

// Garante que as notificações (toast) aparecem nas páginas de autenticação
// (ativar conta, repor senha, login) — o Toaster só existia no layout do portal.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster richColors />
    </>
  );
}
