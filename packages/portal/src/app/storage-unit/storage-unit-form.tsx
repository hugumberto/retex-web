'use client'; 

import React, { useState, useEffect } from 'react';

interface StorageUnitFormProps {
  onFormClose: () => void; 
  initialData?: { id: string; mark: string; quality: string };
  onSave: (data: { id?: string; mark: string; quality: string }) => void; 
}

export default function StorageUnitForm({ onFormClose, initialData, onSave }: StorageUnitFormProps) {
  const [mark, setMarca] = useState('');
  const [quality, setQualidade] = useState('');

  // Define the options for the dropdowns
  const brandOptions = [
    'Selecione uma marca', 
    'Zara',
    'Bershka',
    'Pull & Bear',
    'Stradivarius',
    'H&M',
    'Primark',
    'C&A',
    'Mango',
    'Shein',
    'Asos',
  ];

  const qualityOptions = [
    'Selecione a qualidade', 
    'Excelente',
    'Boa',
    'Média',
    'Fraca',
  ];

  useEffect(() => {
    if (initialData) {
      setMarca(initialData.mark);
      setQualidade(initialData.quality);
    } else {
      setMarca(brandOptions[0]);
      setQualidade(qualityOptions[0]);
    }
  }, [initialData]); 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 

    // Basic validation: ensure options other than the placeholder are selected
    if (mark === brandOptions[0] || quality === qualityOptions[0]) {
        alert('Por favor, selecione uma Marca e uma Qualidade válidas.');
        return;
    }

    const formData = { mark, quality };

    // Call the `onSave` prop function.
    // If `initialData` exists, include its `id` to signify an update operation.
    // Otherwise, it's a new creation.
    onSave(initialData ? { ...formData, id: initialData.id } : formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData ? 'Editar Unidade de Armazenamento' : 'Criar Nova Unidade de Armazenamento'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label>
          <select
            id="marca"
            name="marca"
            value={mark} 
            onChange={(e) => setMarca(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required 
          >
            {brandOptions.map((option, index) => (
              <option
                key={option} 
                value={option}
                disabled={index === 0} // Disable the placeholder option
              >
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="qualidade" className="block text-sm font-medium text-gray-700">Qualidade</label>
          <select
            id="qualidade"
            name="qualidade"
            value={quality} 
            onChange={(e) => setQualidade(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required 
          >
            {qualityOptions.map((option, index) => (
              <option
                key={option} 
                value={option}
                disabled={index === 0} 
              >
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onFormClose} // Calls the parent-provided handler to close the form
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit" 
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {initialData ? 'Guardar Alterações' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  );
}