import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetColors, useUpdateColor, useDeleteColor } from '../api/color';
import type { Color } from '../api/types';

const colorFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.color_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.color_name'),
    accessorKey: 'name',
  },
];

export default function ColorsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: colorsData, isLoading } = useGetColors({
    params: {
      name: searchTerm
    }
  }) as { data: Color[] | undefined, isLoading: boolean };

  const fields = colorFields(t);

  const colors = colorsData || [];
  const enhancedColors = colors.map((color: Color, index: number) => ({
    ...color,
    displayId: index + 1
  }));

  const { mutate: updateColor, isPending: isUpdating } = useUpdateColor();
  const { mutate: deleteColor } = useDeleteColor();

  const handleEdit = (color: Color) => {
    setEditingColor(color);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Color>) => {
    if (!editingColor?.id) return;

    updateColor(
      { ...data, id: editingColor.id } as Color,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.colors') }));
          setIsFormOpen(false);
          setEditingColor(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.colors') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteColor(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.colors') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.colors') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.colors')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_color')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedColors}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-color')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingColor || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
