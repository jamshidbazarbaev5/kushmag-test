import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetMassifs, useUpdateMassif, useDeleteMassif } from '../api/massif';
import type { Massif } from '../api/types';

const massifFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.massif_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.massif_name'),
    accessorKey: 'name',
  },
];

export default function MassifsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMassif, setEditingMassif] = useState<Massif | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: massifsData, isLoading } = useGetMassifs({
    params: {
      name: searchTerm
    }
  }) as { data: Massif[] | undefined, isLoading: boolean };

  const fields = massifFields(t);

  const massifs = massifsData || [];
  const enhancedMassifs = massifs.map((massif: Massif, index: number) => ({
    ...massif,
    displayId: index + 1
  }));

  const { mutate: updateMassif, isPending: isUpdating } = useUpdateMassif();
  const { mutate: deleteMassif } = useDeleteMassif();

  const handleEdit = (massif: Massif) => {
    setEditingMassif(massif);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Massif>) => {
    if (!editingMassif?.id) return;

    updateMassif(
      { ...data, id: editingMassif.id } as Massif,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.massifs') }));
          setIsFormOpen(false);
          setEditingMassif(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.massifs') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMassif(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.massifs') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.massifs') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.massifs')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_massif')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedMassifs}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-massif')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingMassif || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
