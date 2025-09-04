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
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StorageUnitData, StorageUnitDTO } from '../../types/storage-unit';
import StorageUnitForm from './storage-unit-form';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';

export default function StorageUnit() {
  const [showForm, setShowForm] = useState(false);
  const [storageUnits, setStorageUnits] = useState<StorageUnitDTO[]>();
  const [editingUnit, setEditingUnit] = useState<StorageUnitData | undefined>();

  const fetchData = async () => {
    const { data, status } = await api.get<StorageUnitDTO[]>(`/storage-unit`);
    if (!isSuccessStatus(status)) {
      console.error('Failed to fetch storage units');
      return;
    }
    setStorageUnits(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleForm = (item?: StorageUnitDTO | undefined) => {
    if (item) {
      setEditingUnit({
        id: item.id,
        brandId: item.brand.id,
        quality: item.quality,
        weight: item.weight,
      });
    } else {
      setEditingUnit(undefined);
    }
    setShowForm((prev) => !prev);
  };

  const handleFormClose = async () => {
    setShowForm(false);
    await fetchData();
  };

  const handleDeleteUnit = async (id: string) => {
    try {
      const res = await api.delete(`/storage-unit/${id}`);
      if (!isSuccessStatus(res.status))
        throw new Error('Erro ao eliminar unidade');
      await fetchData();
    } catch (error) {
      console.error('Erro ao eliminar unidade:', error);
    }
  };

  return (
    <section
      id="storage-unit"
      className="py-16 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-center text-neutral-950 mb-8">
        Armazenamento
      </h1>

      <button
        className="mt-6 mb-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        onClick={() => handleToggleForm()}
      >
        {showForm ? 'Fechar Formulário' : 'Criar Nova Unidade'}
      </button>

      {showForm ? (
        <StorageUnitForm
          onFormClose={handleFormClose}
          initialData={editingUnit}
          onSave={() => {
            setShowForm(false);
            setEditingUnit(undefined);
            fetchData();
          }}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">id</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Qualidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storageUnits?.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell>{storageUnit.id}</TableCell>
                  <TableCell>{storageUnit.brand.name}</TableCell>
                  <TableCell>{storageUnit.quality}</TableCell>
                  <TableCell>
                    <Button
                      variant="default"
                      size="icon"
                      className="size-8"
                      onClick={() => handleToggleForm(storageUnit)}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDeleteUnit(storageUnit.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
