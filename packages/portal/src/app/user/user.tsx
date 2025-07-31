'use client';

import { useState } from 'react';
import UserForm from './user-form'; 

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile: string;
  status: string;
}

export default function User() {
  const [showForm, setShowForm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [users, setUsers] = useState<UserItem[]>([
    {
      id: 'usr1',
      firstName: 'Hugo',
      lastName: 'Gonçalves',
      email: 'hugo@retex.pt',
      phone: '987654321',
      profile: 'Admin', 
      status: 'Ativo',
    },
    {
      id: 'usr2',
      firstName: 'Tamara',
      lastName: 'Fedorenko',
      email: 'tamara@retex.pt',
      phone: '987654321',
      profile: 'Motorista',
      status: 'Ativo',
    },
  ]);

  const handleToggleForm = () => {
    if (!showForm) {
      setEditingUser(null);
    }
    setShowForm((prev) => !prev);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
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

  const handleSaveUser = (formData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profile: string;
  }) => {
    if (formData.id) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === formData.id
            ? {
                ...user,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                profile: formData.profile,
              }
            : user
        )
      );
    } else {
      const newId = String(Date.now());
      const newUser: UserItem = {
        id: newId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        profile: formData.profile,
        status: 'Ativo', 
      };
      setUsers((prevUsers) => [...prevUsers, newUser]);
    }
    handleFormClose();
  };

  const handleEdit = (userId: string) => {
    const userToEdit = users.find((user) => user.id === userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setShowForm(true);
    }
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Tem certeza que deseja eliminar este usuário?')) {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      setSelectedItems((prevSelected) => {
        const newSelected = new Set(prevSelected);
        newSelected.delete(userId);
        return newSelected;
      });
    }
  };

  return (
    <section id="user-page" className="text-white py-16 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-neutral-950 mb-8">
        Usuário
      </h1>

      {!showForm && (
        <button
          className="mt-6 mb-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
          onClick={handleToggleForm} 
        >
          Criar Novo Usuário
        </button>
      )}

      {showForm ? (
        <UserForm
          onFormClose={handleFormClose}
          initialData={editingUser || undefined}
          onSave={handleSaveUser}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <caption className="p-4 text-left text-sm text-gray-500">Detalhes dos Usuários.</caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="p-4 w-12"></th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="p-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      checked={selectedItems.has(user.id)}
                      onChange={() => handleCheckboxChange(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.profile}</td> 
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                      user.status === 'Inativo' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800' 
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(user.id)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 text-sm hover:underline ml-2"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhum usuário encontrado. Clique em "Criar Novo Usuário" para adicionar um.
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
