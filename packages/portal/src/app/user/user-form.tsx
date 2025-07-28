'use client';

import React, { useState, useEffect } from 'react';

interface UserFormProps {
  onFormClose: () => void;
  initialData?: {
    id: string;
    primeiroNome: string;
    ultimoNome: string;
    email: string;
    perfil: string; 
  };
  onSave: (data: {
    id?: string;
    primeiroNome: string;
    ultimoNome: string;
    email: string;
    telefone: string;
    perfil: string;
  }) => void;
}

export default function UserForm({ onFormClose, initialData, onSave }: UserFormProps) {
  const [primeiroNome, setPrimeiroNome] = useState('');
  const [ultimoNome, setUltimoNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState(''); 
  const [selectedPerfil, setSelectedPerfil] = useState(''); 

  const profileOptions = ['Operacao', 'Admin', 'Motorista']; 

  useEffect(() => {
    if (initialData) {
      setPrimeiroNome(initialData.primeiroNome);
      setUltimoNome(initialData.ultimoNome);
      setEmail(initialData.email);
      setSelectedPerfil(initialData.perfil || '');
    } else {
      setPrimeiroNome('');
      setUltimoNome('');
      setEmail('');
      setTelefone('');
      setSelectedPerfil('');
    }
  }, [initialData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!primeiroNome || !ultimoNome || !email || !selectedPerfil) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um perfil.');
      return;
    }

    const formData = { primeiroNome, ultimoNome, email, telefone, perfil: selectedPerfil };
    onSave(initialData ? { ...formData, id: initialData.id } : formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData ? 'Editar Usuário' : 'Cadastro de Usuário'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Primeiro Nome */}
        <div>
          <label htmlFor="primeiroNome" className="block text-sm font-medium text-gray-700">Primeiro Nome</label>
          <input
            type="text"
            id="primeiroNome"
            name="primeiroNome"
            value={primeiroNome}
            onChange={(e) => setPrimeiroNome(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required
          />
        </div>

        {/* Ultimo Nome */}
        <div>
          <label htmlFor="ultimoNome" className="block text-sm font-medium text-gray-700">Ultimo Nome</label>
          <input
            type="text"
            id="ultimoNome"
            name="ultimoNome"
            value={ultimoNome}
            onChange={(e) => setUltimoNome(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email" 
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required
          />
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            type="text"
            id="telefone"
            name="telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
          />
        </div>

         {/* Perfil Dropdown */}
         <div>
          <label htmlFor="perfil" className="block text-sm font-medium text-gray-700">Perfil</label>
          <select
            id="perfil"
            name="perfil"
            value={selectedPerfil}
            onChange={(e) => setSelectedPerfil(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required
          >
            <option value="">Selecione um perfil</option>
            {profileOptions.map((profile) => (
              <option key={profile} value={profile}>
                {profile}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onFormClose}
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