'use client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StorageUnitDTO, Quality } from '../../types/storage-unit';
import StorageUnitForm from './storage-unit-form';
import api from '@/lib/api';
import { useAppStore } from '@/store';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
import { Checkbox } from '@/components/ui/checkbox';

const qualityMap: Record<Quality, string> = {
  [Quality.GOOD]: 'Bom',
  [Quality.MEDIUM]: 'Regular',
  [Quality.BAD]: 'Ruim',
};

export default function StorageUnit() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [storageUnits, setStorageUnits] = useState<StorageUnitDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      const { data } = await api.get<StorageUnitDTO[]>('/storage-unit');
      setStorageUnits(data);
    } catch (e) {
      console.error('Failed to fetch storage units', e);
    }
  };

  useEffect(() => {
    setPageTitle('Armazenamento');
    setBreadcrumbs([{ label: 'Armazenamento', href: '/portal/storage-unit' }]);
    fetchData();

    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle]);

  const onSave = async () => {
    await fetchData();
  };

  const handleDeleteUnit = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/storage-unit/${id}`);
      if (res.status !== 200) throw new Error('Erro ao eliminar unidade');
      await fetchData();
    } catch (error) {
      console.error('Erro ao eliminar unidade:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectUnit = (id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedUnits((prev) => [...prev, id]);
    } else {
      setSelectedUnits((prev) => prev.filter((unitId) => unitId !== id));
    }
  };

  return (
    <section id="storage-unit-page" className="flex flex-col items-center">
      <StorageUnitForm onSave={onSave} />
      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Id</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Qualidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {storageUnits?.length > 0 ? (
              storageUnits.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedUnits.includes(storageUnit.id)}
                        onCheckedChange={(checked) => handleSelectUnit(storageUnit.id, !!checked)}
                      />
                      <span className="font-medium">{storageUnit.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{storageUnit.brand.name}</TableCell>
                  <TableCell>
                    {storageUnit.quality in qualityMap ? qualityMap[storageUnit.quality] : 'Desconhecido'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        storageUnit.status === 'ATIVO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {storageUnit.status}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <StorageUnitForm
                      storageUnitId={storageUnit.id}
                      onSave={onSave}
                    />
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          className="size-8"
                        >
                          <TrashIcon />
                        </Button>
                      }
                      onConfirm={async () => {
                        await toast.promise(
                          handleDeleteUnit(storageUnit.id),
                          {
                            loading: 'Loading...',
                            success: () => {
                              return 'Unidade de Armazenamento desativada com sucesso';
                            },
                            error: () => {
                              return 'Erro ao desativar a Unidade de Armazenamento';
                            },
                          }
                        );
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhum registro encontrado!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}