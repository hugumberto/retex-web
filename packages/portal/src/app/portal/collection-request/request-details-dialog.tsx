'use client';

import { CollectionRequestDTO } from '@/app/types/collection-request';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { STATUS_LABEL } from '@/lib/collection-request-status';
import { SearchIcon } from 'lucide-react';

type Props = {
  request: CollectionRequestDTO;
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-secondary break-words">
        {value !== undefined && value !== null && value !== '' ? value : '—'}
      </span>
    </div>
  );
}

export default function RequestDetailsDialog({ request }: Props) {
  const user = request.user;
  const address = request.address;
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          title="Ver todos os dados"
        >
          <SearchIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-secondary">
            Solicitação {request.friendlyCode ?? ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-secondary">
              Solicitação
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código" value={request.friendlyCode} />
              <Field
                label="Estado"
                value={STATUS_LABEL[request.status] ?? request.status}
              />
              <Field
                label="Sacos estimados"
                value={request.estimatedBags}
              />
              <Field label="Peso (kg)" value={request.weight} />
              <Field
                label="Criado em"
                value={
                  request.createdAt
                    ? new Date(request.createdAt).toLocaleString('pt-PT')
                    : undefined
                }
              />
              <Field label="Recolha (rota)" value={request.route?.friendlyCode} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-secondary">
              Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" value={fullName} />
              <Field label="Email" value={user?.email} />
              <Field label="Contacto" value={user?.contactPhone} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-secondary">Morada</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rua" value={address?.street} />
              <Field label="Nº" value={address?.number} />
              <Field label="Complemento" value={address?.complement} />
              <Field label="Código postal" value={address?.zipCode} />
              <Field label="Localidade" value={address?.city} />
              <Field label="Freguesia" value={address?.cityDivision} />
              <Field label="Distrito" value={address?.countryDivision} />
              <Field label="País" value={address?.country} />
              {(address?.lat != null || address?.long != null) && (
                <Field
                  label="Coordenadas"
                  value={
                    address?.lat != null && address?.long != null
                      ? `${address.lat}, ${address.long}`
                      : undefined
                  }
                />
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
