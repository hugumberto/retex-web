'use client';

import { use, useEffect, useState } from 'react';
import StorageUnitForm from './storage-unit-form';
import { StorageUnitResponse } from '../types/storage-unit';
import {
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  Table,
} from '@/components/ui/table';
interface StorageUnitItem {
  id: string;
  mark: string;
  quality: string;
  status: string;
}

export default function StorageUnit() {
  const [showForm, setShowForm] = useState(false);
  const [storageUnits, setStorageUnits] = useState<StorageUnitResponse[]>();
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}storage-unit`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) {
        console.error('Failed to fetch storage units');
        return;
      }
      const data: StorageUnitResponse[] = await res.json();
      console.log('[xxx] ~ fetchData ~ data:', data);
      setStorageUnits(data);
    };
    fetchData();
  }, []);

  const handleToggleForm = () => {
    setShowForm((prev) => !prev);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  // const handleCheckboxChange = (id: string) => {
  //   setSelectedItems((prevSelected) => {
  //     const newSelected = new Set(prevSelected);
  //     if (newSelected.has(id)) {
  //       newSelected.delete(id);
  //     } else {
  //       newSelected.add(id);
  //     }
  //     return newSelected;
  //   });
  // };

  // const handleSaveUnit = (formData: {
  //   id?: string;
  //   mark: string;
  //   quality: string;
  // }) => {
  //   if (formData.id) {
  //     setStorageUnits((prevUnits) =>
  //       prevUnits.map((unit) =>
  //         unit.id === formData.id
  //           ? { ...unit, mark: formData.mark, quality: formData.quality }
  //           : unit
  //       )
  //     );
  //   } else {
  //     const newId = String(Date.now());
  //     const newUnit: StorageUnitItem = {
  //       id: newId,
  //       mark: formData.mark,
  //       quality: formData.quality,
  //       status: 'Disponível',
  //     };
  //     setStorageUnits((prevUnits) => [...prevUnits, newUnit]);
  //   }
  //   handleFormClose();
  // };

  // const handleEdit = (unitId: string) => {
  //   const unitToEdit = storageUnits.find((unit) => unit.id === unitId);
  //   if (unitToEdit) {
  //     setEditingUnit(unitToEdit);
  //     setShowForm(true);
  //   }
  // };

  // const handleDelete = (unitId: string) => {
  //   if (window.confirm('Tem certeza que deseja eliminar esta unidade?')) {
  //     setStorageUnits((prevUnits) =>
  //       prevUnits.filter((unit) => unit.id !== unitId)
  //     );
  //     setSelectedItems((prevSelected) => {
  //       const newSelected = new Set(prevSelected);
  //       newSelected.delete(unitId);
  //       return newSelected;
  //     });
  //   }
  // };

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
        onClick={handleToggleForm}
      >
        {showForm ? 'Fechar Formulário' : 'Criar Nova Unidade'}
      </button>

      {showForm ? (
        <StorageUnitForm
          onFormClose={handleFormClose}
          // initialData={editingUnit || undefined}
          // onSave={handleSaveUnit}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">id</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Qualidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storageUnits?.map((storageUnit) => (
                <TableRow key={storageUnit.id}>
                  <TableCell>{storageUnit.id}</TableCell>
                  <TableCell>{storageUnit.brand.name}</TableCell>
                  <TableCell>{storageUnit.quality}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
