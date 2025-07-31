'use client';

import React, { useState, useEffect } from 'react';

interface UserFormProps {
  onFormClose: () => void;
  initialData?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profile: string; 
  };
  onSave: (data: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profile: string;
  }) => void;
}

export default function UserForm({ onFormClose, initialData, onSave }: UserFormProps) {
  const [firstName, setfirstName] = useState('');
  const [lastName, setlastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [selectedProfile, setSelectedProfile] = useState(''); 

  const profileOptions = ['Operacao', 'Admin', 'Motorista']; 

  useEffect(() => {
    if (initialData) {
      setfirstName(initialData.firstName);
      setlastName(initialData.lastName);
      setEmail(initialData.email);
      setPhone(initialData.phone || '');
      setSelectedProfile(initialData.profile || '');
    } else {
      setfirstName('');
      setlastName('');
      setEmail('');
      setPhone('');
      setSelectedProfile('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !selectedProfile) {
      alert('Por favor, preencha todos os campos obrigatórios e selecione pelo menos um perfil.');
      return;
    }

    const formData = { firstName, lastName, email, phone, profile: selectedProfile };
    onSave(initialData ? { ...formData, id: initialData.id } : formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {initialData ? 'Editar Usuário' : 'Cadastro de Usuário'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Primeiro Nome</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(e) => setfirstName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
            required
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Ultimo Nome</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={lastName}
            onChange={(e) => setlastName(e.target.value)}
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

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900"
          />
        </div>

         {/* Profile Dropdown */}
         <div>
          <label htmlFor="profile" className="block text-sm font-medium text-gray-700">Perfil</label>
          <select
            id="profile"
            name="profile"
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
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
