'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import ConfirmDialog from '@/components/custom/confirmation-dialog';
import api from '@/lib/api';
import { isSuccessStatus } from '@/lib/utils';
import { useAppStore } from '@/store';
import { UserDTO, UserStatus } from '../../types/user'; 
import UserForm from './user-form';

// Constants for display status (Portuguese labels)
const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
};


export default function User() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, status } = await api.get<UserDTO[]>(`/user`);
      if (!isSuccessStatus(status)) {
        throw new Error('Failed to fetch users');
      }
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  }, []);

  const handleDeleteUser = useCallback(
    async (id: string) => {
      setIsSubmitting(true);
      try {
        const res = await api.delete(`/user/${id}`);
        if (res.status !== 200) throw new Error('Erro ao eliminar usuário');
        await fetchUsers();
      } catch (error) {
        console.error('Erro ao eliminar usuário:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchUsers]
  );
  
  const handleSelectUser = useCallback((id: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedUsers((prev: string[]) => [...prev, id]);
    } else {
      setSelectedUsers((prev: string[]) => prev.filter((userId: string) => userId !== id));
    }
  }, []);

  const handleDeleteWithToast = useCallback(
    async (id: string) => {
      await toast.promise(handleDeleteUser(id), {
        loading: 'Carregando...',
        success: () => 'Utilizador eliminado com sucesso',
        error: () => 'Erro ao eliminar o Utilizador',
      });
    },
    [handleDeleteUser]
  );
  
  // useEffect for header/breadcrumbs and initial data fetch
  useEffect(() => {
    setPageTitle('Utilizadores');
    setBreadcrumbs([{ label: 'Utilizadores', href: '/portal/user' }]);
    fetchUsers();
    
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle, fetchUsers]);

  const handleSave = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  return (
    <section id="user-page" className="flex flex-col items-center">
      <UserForm onSave={handleSave} />
      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Id</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked: boolean) =>
                          handleSelectUser(user.id, !!checked)
                        }
                      />
                      <span className="font-medium">{user.id}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.contactPhone}</TableCell>
                  <TableCell>
                    {user.roles.map((r) => r.role).join(', ')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === UserStatus.ATIVO || user.status === UserStatus.ACTIVE
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {STATUS_MAP[user.status]}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <UserForm userId={user.id} initialData={user} onSave={handleSave} />
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
                      onConfirm={() => handleDeleteWithToast(user.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                >
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
