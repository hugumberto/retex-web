'use client';

import {
  CollectionStatus,
  PackageCollectionDTO,
  PackageCollectionTableDTO,
} from '@/app/types/package-collection';
import ConfirmDialog from '@/components/custom/confirmation-dialog';
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
import { fetchWithAuth } from '@/lib/fetcher';
import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PaginatedResult } from '../types/helper';
import PackageCollectionForm from './package-collection-form';

export default function PackageCollection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageCollections, setPackageCollections] = useState<
    PackageCollectionTableDTO[]
  >([]);

  const fetchData = async () => {
    const res = await fetchWithAuth(`/route`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Failed to fetch storage units');
      return;
    }
    const data: PaginatedResult<PackageCollectionTableDTO> = await res.json();
    setPackageCollections(data.data);
  };
  const fetchCollectionDataById = async (
    id: string
  ): Promise<PackageCollectionDTO | undefined> => {
    const res = await fetchWithAuth(`/route/${id}`, {
      method: 'get',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Failed to fetch storage units');
      return;
    }
    return await res.json();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSave = async () => {
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const data = await fetchCollectionDataById(id);
      const res = await fetchWithAuth(`/route/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          status: CollectionStatus.FINISHED,
        }),
      });
      if (!res.ok) throw new Error('Erro na requisição');
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="package-collection-page"
      className=" flex flex-col items-center"
    >
      <PackageCollectionForm onSave={() => onSave()} />

      <div className="mt-4 w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Qtd. Encomendas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packageCollections?.map((packageCollection) => (
              <TableRow key={packageCollection.id}>
                <TableCell>
                  <Checkbox className="h-4 w-4 " />
                </TableCell>
                <TableCell className="font-medium">
                  {`${packageCollection.driver.firstName} ${packageCollection.driver.lastName}`}
                </TableCell>
                <TableCell>{packageCollection.packagesCount}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      packageCollection.status === CollectionStatus.IN_TRANSIT
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {packageCollection.status}
                  </span>
                </TableCell>
                <TableCell className="space-x-2">
                  <PackageCollectionForm
                    packageCollectionId={packageCollection.id}
                    onSave={() => onSave()}
                  />
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
                    onConfirm={async () => {
                      await toast.promise(handleDelete(packageCollection.id), {
                        loading: 'Loading...',
                        success: () => {
                          return 'Recolha de Encomendas desativada com sucesso';
                        },
                        error: () => {
                          return 'Erro ao desativar a recolha de encomendas';
                        },
                      });
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {packageCollections.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-gray-500"
                >
                  {
                    ' Nenhuma recolha de encomendas encontrada. Clique em "Criar Nova Recolha de Encomendas" para adicionar uma.'
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
