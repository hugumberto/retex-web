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
import { UserFormData, UserResponse } from '../types/user';
import { fetchWithAuth } from '@/lib/fetcher';

export default function User() {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [editingUser, setEditingUser] = useState<UserFormData | undefined>();
  const fetchData = async () => {
    const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}user`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Failed to fetch users');
      return;
    }
    const data: UserResponse[] = await res.json();
    setUsers(data);
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleToggleForm = (userToEdit?: UserResponse) => {
    if (userToEdit) {
      setEditingUser({
        id: userToEdit.id,
        firstName: userToEdit.firstName,
        lastName: userToEdit.lastName,
        email: userToEdit.email,
        contactPhone: userToEdit.contactPhone,
        documentNumber: userToEdit.documentNumber,
        role: userToEdit.roles.map((role) => role.role),
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

  const handleDeleteUser = async (user: UserResponse) => {
    if (window.confirm('Tem certeza que deseja eliminar este usuário?')) {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}user/${user.id}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              contactPhone: user.contactPhone,
              documentNumber: user.documentNumber,
              password: '',
              status: 'INACTIVE',
            }),
          }
        );
        if (!res.ok) throw new Error('Erro ao eliminar usuário');
        await fetchData();
      } catch (error) {
        console.error('Erro ao eliminar usuário:', error);
      }
    }
  };

  return (
    <section
      id="user-page"
      className="py-16 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]"
    >
      <h1 className="text-4xl md:text-5xl font-bold text-center text-neutral-950 mb-8">
        Usuário
      </h1>

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
          onSave={() => {
            setShowForm(false);
            setEditingUser(undefined);
            fetchData();
          }}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <Table>
            <caption className="p-4 text-left text-sm text-gray-500">
              Detalhes dos Usuários.
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>id</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles.map((role) => role.role).join(', ')}
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
                      onClick={() => handleDeleteUser(user)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-sm text-gray-500"
                  >
                    {
                      'Nenhum usuário encontrado. Clique em "Criar Novo Usuário" para adicionar um.'
                    }
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
