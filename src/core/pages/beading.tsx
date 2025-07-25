import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetBeadings, useUpdateBeading, useDeleteBeading } from '../api/beading';
import type { Beading } from '../api/types';

const beadingFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.beading_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
  {
    name: 'type',
    label: t('forms.beading_type'),
    type: 'select',
    options: [
      { value: 'main', label: t('forms.beading_type_main') },
      { value: 'additional', label: t('forms.beading_type_additional') }
    ],
    required: true,
  }
];

const columns = (t: any) => [
  {
    header: t('forms.beading_name'),
    accessorKey: 'name',
  },
  {
    header: t('forms.beading_type'),
    accessorKey: 'type',
    cell: (row: { type: 'main' | 'additional' }) => t(`forms.beading_type_${row.type}`),
  }
];

export default function BeadingsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBeading, setEditingBeading] = useState<Beading | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: beadingsData, isLoading } = useGetBeadings({
    params: {
      name: searchTerm
    }
  }) as { data: Beading[] | undefined, isLoading: boolean };

  const fields = beadingFields(t);

  const beadings = beadingsData || [];
  const enhancedBeadings = beadings.map((beading: Beading, index: number) => ({
    ...beading,
    displayId: index + 1
  }));

  const { mutate: updateBeading, isPending: isUpdating } = useUpdateBeading();
  const { mutate: deleteBeading } = useDeleteBeading();

  const handleEdit = (beading: Beading) => {
    setEditingBeading(beading);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Beading>) => {
    if (!editingBeading?.id) return;

    updateBeading(
      { ...data, id: editingBeading.id } as Beading,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.beadings') }));
          setIsFormOpen(false);
          setEditingBeading(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.beadings') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteBeading(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.beadings') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.beadings') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.beadings')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_beading')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedBeadings}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-beading')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingBeading || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
