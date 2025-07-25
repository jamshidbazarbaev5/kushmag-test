import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetPatinaColors, useUpdatePatinaColor, useDeletePatinaColor } from '../api/patinaColor';
import type { PatinaColor } from '../api/types';

const patinaColorFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.patina_color_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.patina_color_name'),
    accessorKey: 'name',
  },
];

export default function PatinaColorsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatinaColor, setEditingPatinaColor] = useState<PatinaColor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: patinaColorsData, isLoading } = useGetPatinaColors({
    params: {
      name: searchTerm
    }
  }) as { data: PatinaColor[] | undefined, isLoading: boolean };

  const fields = patinaColorFields(t);

  const patinaColors = patinaColorsData || [];
  const enhancedPatinaColors = patinaColors.map((patinaColor: PatinaColor, index: number) => ({
    ...patinaColor,
    displayId: index + 1
  }));

  const { mutate: updatePatinaColor, isPending: isUpdating } = useUpdatePatinaColor();
  const { mutate: deletePatinaColor } = useDeletePatinaColor();

  const handleEdit = (patinaColor: PatinaColor) => {
    setEditingPatinaColor(patinaColor);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<PatinaColor>) => {
    if (!editingPatinaColor?.id) return;

    updatePatinaColor(
      { ...data, id: editingPatinaColor.id } as PatinaColor,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.patina_colors') }));
          setIsFormOpen(false);
          setEditingPatinaColor(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.patina_colors') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deletePatinaColor(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.patina_colors') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.patina_colors') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.patina_colors')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_patina_color')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedPatinaColors}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-patina-color')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingPatinaColor || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
