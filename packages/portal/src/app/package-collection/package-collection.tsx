'use client';

import { useState } from 'react';
import PackageCollectionForm from './package-collection-form';
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
import {
  PackageCollectionResponse,
  PackageCollectionFormData,
  CollectionStatus,
  Shift,
} from '@/app/types/package-collection';

export default function PackageCollection() {
  const [showForm, setShowForm] = useState(false);
  const [packageCollections, setPackageCollections] = useState<PackageCollectionResponse[]>([
    {
      id: 'rec1',
      driver: 'Hugo Gonçalves',
      packageQty: 2,
      status: CollectionStatus.AWAITING_COLLECTION,
      collectionDate: '2025-08-08',
      shift: Shift.NIGHT,
      selectedCollectionItems: ['addr1', 'addr2'], 
      createdAt: '2025-08-08T10:00:00Z',
      updatedAt: '2025-08-08T10:00:00Z',
      deletedAt: null,
    },
    {
      id: 'rec2',
      driver: 'Tamara Fedorenko',
      packageQty: 1,
      status: CollectionStatus.IN_TRANSIT,
      collectionDate: '2025-08-08',
      shift: Shift.AFTERNOON,
      selectedCollectionItems: ['addr1', 'addr3'], 
      createdAt: '2025-08-08T11:00:00Z',
      updatedAt: '2025-08-08T11:00:00Z',
      deletedAt: null,
    },
  ]);
  const [editingPackageCollection, setEditingPackageCollection] = useState<PackageCollectionFormData | undefined>();

  const handleToggleForm = (packageCollectionToEdit?: PackageCollectionResponse) => {
    if (packageCollectionToEdit) {
      setEditingPackageCollection({
        id: packageCollectionToEdit.id,
        driver: packageCollectionToEdit.driver,
        collectionDate: packageCollectionToEdit.collectionDate,
        shift: packageCollectionToEdit.shift,
        selectedCollectionItems: packageCollectionToEdit.selectedCollectionItems, 
      });
    } else {
      setEditingPackageCollection(undefined);
    }
    setShowForm((prev) => !prev);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPackageCollection(undefined);
  };

  const handleSavePackageCollection = async (formData: PackageCollectionFormData) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (formData.id) {
      setPackageCollections((prevCollections) =>
        prevCollections.map((collection) =>
          collection.id === formData.id
            ? {
                ...collection,
                driver: formData.driver,
                packageQty: formData.selectedCollectionItems.length,
                collectionDate: formData.collectionDate,
                shift: formData.shift,
                selectedCollectionItems: formData.selectedCollectionItems,
                updatedAt: new Date().toISOString(),
              }
            : collection
        )
      );
    } else {
      const newPackageCollection: PackageCollectionResponse = {
        id: Date.now().toString(),
        driver: formData.driver,
        packageQty: formData.selectedCollectionItems.length,
        status: CollectionStatus.AWAITING_COLLECTION,
        collectionDate: formData.collectionDate,
        shift: formData.shift,
        selectedCollectionItems: formData.selectedCollectionItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      };

      setPackageCollections((prevCollections) => [...prevCollections, newPackageCollection]);
    }

    console.log('Saving package collection:', formData);
    handleFormClose();
  };

  const handleDeletePackageCollection = async (id: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta recolha de encomendas?')) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPackageCollections((prevCollections) => prevCollections.filter((collection) => collection.id !== id));
    }
  };

  return (
    <section id="package-collection-page" className="py-16 px-4 flex flex-col items-center min-h-[calc(100vh-80px)]">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-neutral-950 mb-8">
        Recolha de Encomendas
      </h1>
      
      {!showForm && (
      <Button
        className="mt-6 mb-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        onClick={() => handleToggleForm()}
      >
        Criar Nova Recolha de Encomendas
      </Button>
       )}

      {showForm ? (
        <PackageCollectionForm
          onFormClose={handleFormClose}
          initialData={editingPackageCollection}
          onSave={handleSavePackageCollection}
        />
      ) : (
        <div className="mt-8 w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
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
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </TableCell>
                  <TableCell className="font-medium">{packageCollection.driver}</TableCell>
                  <TableCell>{packageCollection.packageQty}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        packageCollection.status === CollectionStatus.IN_TRANSIT ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}
                    >
                      {packageCollection.status}
                    </span>
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleToggleForm(packageCollection)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDeletePackageCollection(packageCollection.id)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {packageCollections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                    Nenhuma recolha de encomendas encontrada. Clique em "Criar Nova Recolha de Encomendas" para adicionar uma.
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
