'use client';

import { useState } from 'react';
import StorageUnitForm from './storage-unit-form';

interface StorageUnitItem {
  id: string;
  mark: string;
  quality: string;
  status: string;
}

export default function StorageUnit() {
  const [showForm, setShowForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingUnit, setEditingUnit] = useState<StorageUnitItem | null>(null);

  const [storageUnits, setStorageUnits] = useState<StorageUnitItem[]>([
    { id: '1', mark: 'Zara', quality: 'Excelente', status: 'Disponível' },
    { id: '2', mark: 'Bershka', quality: 'Boa', status: 'Em Armazém' },
    { id: '3', mark: 'Pull & Bear', quality: 'Média', status: 'Disponível' },
    { id: '4', mark: 'Stradivarius', quality: 'Boa', status: 'Em Trânsito' },
    { id: '5', mark: 'H&M', quality: 'Média', status: 'Em Manutenção' },
  ]);

  const handleToggleForm = () => {
    if (showForm) {
      setEditingUnit(null);
    }
    setShowForm((prev) => !prev);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUnit(null);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedItems((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const handleSaveUnit = (formData: { id?: string; mark: string; quality: string }) => {
    if (formData.id) {
      setStorageUnits((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === formData.id
            ? { ...unit, mark: formData.mark, quality: formData.quality }
            : unit
        )
      );
    } else {
      const newId = String(Date.now());
      const newUnit: StorageUnitItem = {
        id: newId,
        mark: formData.mark,
        quality: formData.quality,
        status: 'Disponível',
      };
      setStorageUnits((prevUnits) => [...prevUnits, newUnit]);
    }
    handleFormClose();
  };

  const handleEdit = (unitId: string) => {
    const unitToEdit = storageUnits.find((unit) => unit.id === unitId);
    if (unitToEdit) {
      setEditingUnit(unitToEdit);
      setShowForm(true);
    }
  };

  const handleDelete = (unitId: string) => {
    if (window.confirm('Tem certeza que deseja eliminar esta unidade?')) {
      setStorageUnits((prevUnits) => prevUnits.filter((unit) => unit.id !== unitId));
      setSelectedItems((prevSelected) => {
        const newSelected = new Set(prevSelected);
        newSelected.delete(unitId);
        return newSelected;
      });
    }
  };

  return (
    <section id="storage-unit" className="text-white py-16 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]">
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
          initialData={editingUnit || undefined}
          onSave={handleSaveUnit}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="p-4 text-left text-sm text-gray-500">Detalhes das Unidades de Armazenamento.</caption>
            <thead className="bg-gray-50">
              <tr>
                {/* REMOVED CHECKBOX HEADER - Header now starts directly with Marca */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualidade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {storageUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50 transition-colors duration-150">
                  {/* CHECKBOX DATA CELL - This remains the first cell in each data row */}
                  <td className="p-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      checked={selectedItems.has(unit.id)}
                      onChange={() => handleCheckboxChange(unit.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.mark}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.quality}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      unit.status === 'Disponível' ? 'bg-green-100 text-green-800' :
                      unit.status === 'Em Armazém' ? 'bg-blue-100 text-blue-800' :
                      unit.status === 'Em Trânsito' ? 'bg-yellow-100 text-yellow-800' :
                      unit.status === 'Em Manutenção' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(unit.id)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(unit.id)}
                      className="text-red-600 hover:text-red-900 text-sm hover:underline ml-2"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {storageUnits.length === 0 && (
                <tr>
                  {/* colSpan is now 5 because the data rows have 5 cells (Checkbox + 4 data columns),
                      while the header has 4. This is to match data row count */}
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {'Nenhuma unidade de armazenamento encontrada. Clique em "Criar Nova Unidade" para adicionar uma.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}