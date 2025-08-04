'use client';

import { useEffect, useState } from 'react';
import UserForm from './user-form';
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

interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile: string;
  status: string;
}

interface UserFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profile: string;
}

const fetchUsersFromApi = async (): Promise<UserResponse[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return [
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
  ];
};

export default function User() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [editingUser, setEditingUser] = useState<UserFormData | undefined>();

  const fetchData = async () => {
    try {
      const data = await fetchUsersFromApi();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Toggle the form visibility and set the user to be edited
  const handleToggleForm = (userToEdit?: UserResponse) => {
    if (userToEdit) {
      setEditingUser({
        id: userToEdit.id,
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        email: userToEdit.email,
        phone: userToEdit.phone,
        profile: userToEdit.profile,
      });
    } else {
      setEditingUser(undefined);
    }
    setShowForm((prev) => !prev);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(undefined);
  };

  const handleSaveUser = async (formData: UserFormData) => {
    console.log('Simulating saving user:', formData);

    setShowForm(false);
    setEditingUser(undefined);
    await fetchData(); 
  };

  
  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Tem certeza que deseja eliminar este usuário?')) {
      console.log('Simulating deleting user with ID:', id);

     
      await fetchData();
    }
  };

  return (
    <section id="user-page" className="py-16 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-neutral-950 mb-8">
        Usuário
      </h1>

      {/* Button to toggle the form */}
      <Button
        className="mt-6 mb-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        onClick={() => handleToggleForm()}
      >
        {showForm ? 'Fechar Formulário' : 'Criar Novo Usuário'}
      </Button>

      {showForm ? (
        <UserForm
          onFormClose={handleFormClose}
          initialData={editingUser}
          onSave={handleSaveUser}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <Table>
            <caption className="p-4 text-left text-sm text-gray-500">Detalhes dos Usuários.</caption>
            <TableHeader>
              <TableRow>
                <TableHead>id</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.profile}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                        user.status === 'Inativo' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleToggleForm(user)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    Nenhum usuário encontrado. Clique em "Criar Novo Usuário" para adicionar um.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
