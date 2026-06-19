import { Address } from '@/app/types/package';
import { UserDTO } from '@/app/types/user';

type PackageUserDataProps = {
  user?: UserDTO;
  address?: Address;
};

export default function PackageUserData({
  user,
  address,
}: PackageUserDataProps) {
  const fullName =
    user && `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  const fullAddress = address
    ? [
        `${address.street ?? ''} ${address.number ?? ''}`.trim(),
        address.complement,
        [address.zipCode, address.city].filter(Boolean).join(' '),
        address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="rounded-[24px] border border-secondary/45 bg-white p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary">
          Dados do Utilizador do Pacote
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Nome Completo
          </p>
          <p className="text-sm font-medium text-secondary">
            {fullName || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Email
          </p>
          <p className="text-sm font-medium text-secondary">
            {user?.email || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Telefone
          </p>
          <p className="text-sm font-medium text-secondary">
            {user?.contactPhone || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Número de Documento
          </p>
          <p className="text-sm font-medium text-secondary">
            {user?.documentNumber || '-'}
          </p>
        </div>

        <div className="rounded-xl border border-secondary/20 bg-secondary-muted/10 p-4 sm:col-span-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary/70">
            Endereço
          </p>
          <p className="text-sm font-medium text-secondary">
            {fullAddress || '-'}
          </p>
        </div>
      </div>
    </div>
  );
}
