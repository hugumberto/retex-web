'use client';

import { VehicleDTO } from '@/app/types/vehicle';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { cn, isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Pencil, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

type FormState = { plate: string; name: string; capacityBags: string; active: boolean };

const EMPTY: FormState = { plate: '', name: '', capacityBags: '', active: true };

const field =
  'h-12 w-full rounded-[10px] border border-field bg-white px-4 text-sm text-navy focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30';

// A API devolve a mensagem já traduzida (string ou lista do class-validator).
const apiMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string | string[] } } })
    ?.response?.data?.message;
  if (Array.isArray(message)) return message.join('; ');
  return typeof message === 'string' ? message : fallback;
};

/** Definições → Veículos: matrícula, descrição e capacidade em sacos. */
export default function Vehicles() {
  const t = useTranslations('vehicles');
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([]);
  const [editing, setEditing] = useState<VehicleDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [isSaving, setIsSaving] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      const { data, status } = await api.get<VehicleDTO[]>('/vehicle');
      if (!isSuccessStatus(status)) throw new Error();
      setVehicles(data ?? []);
    } catch {
      toast.error(t('loadError'));
    }
  }, [t]);

  useEffect(() => {
    setPageTitle(t('pageTitle'));
    setBreadcrumbs([{ label: t('pageTitle'), href: '/portal/vehicles' }]);
    fetchVehicles();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [fetchVehicles, setBreadcrumbs, setPageTitle, t]);

  const openForm = (vehicle: VehicleDTO | null) => {
    setEditing(vehicle);
    setForm(
      vehicle
        ? {
            plate: vehicle.plate,
            name: vehicle.name,
            capacityBags: String(vehicle.capacityBags),
            active: vehicle.active,
          }
        : EMPTY
    );
    setOpen(true);
  };

  const capacity = Number(form.capacityBags);
  const isValid =
    form.plate.trim() !== '' &&
    form.name.trim() !== '' &&
    Number.isInteger(capacity) &&
    capacity >= 1;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    setIsSaving(true);
    const payload = {
      plate: form.plate,
      name: form.name,
      capacityBags: capacity,
      active: form.active,
    };
    try {
      const res = editing
        ? await api.put(`/vehicle/${editing.id}`, payload)
        : await api.post('/vehicle', payload);
      if (!isSuccessStatus(res.status)) throw new Error();
      toast.success(editing ? t('updated') : t('created'));
      setOpen(false);
      await fetchVehicles();
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (vehicle: VehicleDTO) => {
    try {
      const res = await api.put(`/vehicle/${vehicle.id}`, { active: !vehicle.active });
      if (!isSuccessStatus(res.status)) throw new Error();
      await fetchVehicles();
    } catch (error) {
      toast.error(apiMessage(error, t('saveError')));
    }
  };

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink">{t('description')}</p>
        <button
          type="button"
          onClick={() => openForm(null)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(to_right,#013364,#02748e)] px-[22px] text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="size-4" />
          {t('add')}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-soft bg-white">
        <table className="w-full text-[13px] text-navy">
          <thead>
            <tr className="h-10 bg-panel text-left text-[10px] uppercase tracking-[0.06em] text-ink">
              <th className="pl-4 font-normal">{t('columns.plate')}</th>
              <th className="font-normal">{t('columns.name')}</th>
              <th className="font-normal">{t('columns.capacity')}</th>
              <th className="font-normal">{t('columns.status')}</th>
              <th className="pr-4 font-normal">
                <span className="sr-only">{t('columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-ink">
                  {t('empty')}
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="h-[52px] border-t border-line">
                  <td className="pl-4 font-mono text-xs">{vehicle.plate}</td>
                  <td>{vehicle.name}</td>
                  <td>{t('bags', { count: vehicle.capacityBags })}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleActive(vehicle)}
                      title={vehicle.active ? t('deactivate') : t('activate')}
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-[3px] text-[11px] font-semibold',
                        vehicle.active ? 'bg-mint text-forest' : 'bg-neutral-badge text-ink'
                      )}
                    >
                      {vehicle.active ? t('active') : t('inactive')}
                    </button>
                  </td>
                  <td className="pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => openForm(vehicle)}
                      aria-label={t('edit', { plate: vehicle.plate })}
                      className="inline-flex size-8 items-center justify-center rounded-md text-ink hover:bg-panel hover:text-navy"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={save} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="text-navy">
                {editing ? t('editTitle') : t('addTitle')}
              </DialogTitle>
            </DialogHeader>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-navy">{t('fields.plate')}</span>
              <input
                value={form.plate}
                maxLength={20}
                placeholder="AA-00-BB"
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                className={cn(field, 'font-mono uppercase')}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-navy">{t('fields.name')}</span>
              <input
                value={form.name}
                maxLength={100}
                placeholder={t('fields.namePlaceholder')}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={field}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-navy">{t('fields.capacity')}</span>
              <input
                type="number"
                min={1}
                step={1}
                value={form.capacityBags}
                onChange={(e) => setForm({ ...form, capacityBags: e.target.value })}
                className={field}
                required
              />
            </label>
            <label className="flex items-center gap-3 text-sm text-navy">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="size-[18px] accent-navy"
              />
              {t('fields.active')}
            </label>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 items-center rounded-full border border-navy bg-white px-[22px] text-sm font-semibold text-navy hover:bg-panel"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={!isValid || isSaving}
                className="inline-flex h-11 items-center rounded-full bg-navy px-[22px] text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? t('saving') : t('save')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
