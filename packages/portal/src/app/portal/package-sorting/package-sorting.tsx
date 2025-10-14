import { InputForm } from '@/components/form/input-form';
import api from '@/lib/api';
import { useAppStore } from '@/store';
import { useState } from 'react';

export default function PackageSorting() {
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
    setPageTitle('Triagem');
    setBreadcrumbs([{ label: 'Triagem', href: '/portal/package-collection' }]);
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleConfirm();
        }}
      >
        <div>
          <InputForm
            label="Peso"
            name="weight"
            type="number"
            control={control}
            rules={{
              required: 'O peso é obrigatório',
            }}
            errors={errors}
          />
        </div>
      </form>
    </section>
  );
}
