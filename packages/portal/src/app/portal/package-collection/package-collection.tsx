'use client';

import {
  CollectionStatus,
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
import api from '@/lib/api';
import { useAppStore } from '@/store';
import { TrashIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PaginatedResult } from '../../types/helper';
import PackageCollectionForm from './package-collection-form';

export default function PackageCollection() {
  const { setPageTitle, setBreadcrumbs } = useAppStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageCollections, setPackageCollections] = useState<
    PackageCollectionTableDTO[]
  >([]);

  const fetchData = async () => {
    const { data } = await api.get<PaginatedResult<PackageCollectionTableDTO>>(
      `/route`
    );
    setPackageCollections(data.data);
  };

  useEffect(() => {
    setPageTitle('Recolha');
    setBreadcrumbs([{ label: 'Recolha', href: '/package-collection' }]);
    fetchData();
    return () => {
      setPageTitle('');
      setBreadcrumbs([]);
    };
  }, [setBreadcrumbs, setPageTitle]);

  const onSave = async () => {
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/route/${id}`);
      if (res.status !== 200) throw new Error('Erro na requisição');
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
