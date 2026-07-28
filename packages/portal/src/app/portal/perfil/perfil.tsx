'use client';

import { AddressDTO } from '@/app/types/user';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { DialogForm } from '@/components/form/dialog-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { AxiosError } from 'axios';
import { CheckCircle2, MapPin, Phone, Star, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AddressForm from './address-form';

interface ContactFormData {
  contactPhone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Perfil() {
  const { setPageTitle, setBreadcrumbs, user, setUser } = useAppStore();
  const [addresses, setAddresses] = useState<AddressDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const contactForm = useForm<ContactFormData>({
    defaultValues: { contactPhone: user?.contactPhone ?? '' },
  });
  const passwordForm = useForm<PasswordFormData>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

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

  const submitContact = contactForm.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      const res = await api.patch('/me', { contactPhone: data.contactPhone });
      if (!isSuccessStatus(res.status)) throw new Error();
      if (user) setUser({ ...user, contactPhone: data.contactPhone });
      setContactOpen(false);
      toast.success('Contacto actualizado');
    } catch (err) {
      const message = (err as AxiosError<{ message: string }>)?.response?.data?.message
        ?? 'Não foi possível actualizar o contacto';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  const submitPassword = passwordForm.handleSubmit(async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', { message: 'As palavras-passe não coincidem' });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.patch('/me/password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      if (!isSuccessStatus(res.status) && res.status !== 204) throw new Error();
      passwordForm.reset();
      setPasswordOpen(false);
      toast.success('Palavra-passe alterada com sucesso');
    } catch (err) {
      const message = (err as AxiosError<{ message: string }>)?.response?.data?.message
        ?? 'Não foi possível alterar a palavra-passe';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

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
            error: (err) =>
              (err as AxiosError<{ message?: string }>)?.response?.data
                ?.message ?? 'Erro ao eliminar endereço',
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
      {/* User info card */}
      <div className="rounded-2xl border border-secondary/35 bg-white p-5 lg:p-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">Dados Pessoais</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5" />
              <span>{user?.contactPhone || '—'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <DialogForm<ContactFormData>
              title="Editar Contacto"
              confirmText="Guardar"
              loading={isSubmitting}
              errors={contactForm.formState.errors}
              onConfirm={submitContact}
              open={contactOpen}
              onOpenChange={(open) => {
                setContactOpen(open);
                if (!open) contactForm.reset({ contactPhone: user?.contactPhone ?? '' });
              }}
              trigger={<Button variant="outline" size="sm">Editar Contacto</Button>}
            >
              <Input
                placeholder="Contacto telefónico*"
                className={contactForm.formState.errors.contactPhone ? 'border-red-500' : ''}
                {...contactForm.register('contactPhone', { required: 'Campo obrigatório' })}
              />
            </DialogForm>

            <DialogForm<PasswordFormData>
              title="Alterar Palavra-passe"
              confirmText="Alterar"
              loading={isSubmitting}
              errors={passwordForm.formState.errors}
              onConfirm={submitPassword}
              open={passwordOpen}
              onOpenChange={(open) => {
                setPasswordOpen(open);
                if (!open) passwordForm.reset();
              }}
              trigger={<Button variant="outline" size="sm">Alterar Palavra-passe</Button>}
            >
              <div className="flex flex-col gap-3">
                <Input
                  type="password"
                  placeholder="Palavra-passe actual*"
                  className={passwordForm.formState.errors.currentPassword ? 'border-red-500' : ''}
                  {...passwordForm.register('currentPassword', { required: 'Campo obrigatório' })}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
                <Input
                  type="password"
                  placeholder="Nova palavra-passe*"
                  className={passwordForm.formState.errors.newPassword ? 'border-red-500' : ''}
                  {...passwordForm.register('newPassword', {
                    required: 'Campo obrigatório',
                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                  })}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
                <Input
                  type="password"
                  placeholder="Confirmar palavra-passe*"
                  className={passwordForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
                  {...passwordForm.register('confirmPassword', { required: 'Campo obrigatório' })}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </DialogForm>
          </div>
        </div>
      </div>

      {/* Address section */}
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
