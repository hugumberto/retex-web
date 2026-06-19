'use client';

import { AddressDTO } from '@/app/types/user';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { CheckCircle2, MapPin, Star, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddressForm from './address-form';

export default function Perfil() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data, status } = await api.get<AddressDTO[]>('/me/address');
      if (!isSuccessStatus(status)) throw new Error();
      setAddresses(data);
    } catch {
      toast.error('Não foi possível carregar os endereços');
    }
  }, []);

  useEffect(() => {
    setPageTitle('Perfil');
    setBreadcrumbs([{ label: 'Perfil', href: '/portal/perfil' }]);
    fetchAddresses();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchAddresses, setBreadcrumbs, setPageTitle]);

  const handleSetDefault = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.patch(`/me/address/${id}/default`);
        if (!isSuccessStatus(res.status)) throw new Error();
        await fetchAddresses();
        toast.success('Endereço padrão actualizado');
      } catch {
        toast.error('Erro ao definir endereço padrão');
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchAddresses]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        await toast.promise(
          (async () => {
            const res = await api.delete(`/me/address/${id}`);
            if (!isSuccessStatus(res.status)) throw new Error();
            await fetchAddresses();
          })(),
          {
            loading: 'A eliminar...',
            success: 'Endereço eliminado',
            error: 'Erro ao eliminar endereço',
          }
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchAddresses]
  );

  return (
    <section id="perfil-page" className="flex flex-col gap-6">
      <div className="flex justify-end">
        <AddressForm onSave={fetchAddresses} />
      </div>

      {addresses.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          Não tens endereços guardados.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="relative rounded-xl border border-secondary/20 bg-white p-4 shadow-sm flex flex-col gap-3"
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-white">
                  <Star className="size-3" /> Padrão
                </span>
              )}

              <div className="flex items-start gap-2 text-secondary">
                <MapPin className="size-4 mt-0.5 shrink-0" />
                <div className="text-sm leading-snug">
                  <p className="font-medium">
                    {addr.street}{addr.number ? `, ${addr.number}` : ''}
                    {addr.complement ? ` — ${addr.complement}` : ''}
                  </p>
                  <p className="text-muted-foreground">
                    {[addr.zipCode, addr.city].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-muted-foreground">{addr.country}</p>
                </div>
              </div>

              <div className={`flex items-center gap-1.5 text-xs font-medium ${addr.isInServiceZone ? 'text-emerald-600' : 'text-slate-400'}`}>
                {addr.isInServiceZone
                  ? <><CheckCircle2 className="size-3.5" /> Zona de actuação</>
                  : <><XCircle className="size-3.5" /> Fora da zona de actuação</>
                }
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-secondary/10">
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs"
                  >
                    Definir padrão
                  </Button>
                )}
                <ConfirmDialog
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isSubmitting}
                      className="text-xs text-destructive hover:text-destructive ml-auto"
                    >
                      Eliminar
                    </Button>
                  }
                  onConfirm={() => handleDelete(addr.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
