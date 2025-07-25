import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetGlassTypes, useUpdateGlassType, useDeleteGlassType } from '../api/glassType';
import type { GlassType } from '../api/types';

const glassTypeFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.glass_type_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.glass_type_name'),
    accessorKey: 'name',
  },
];

export default function GlassTypesPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGlassType, setEditingGlassType] = useState<GlassType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: glassTypesData, isLoading } = useGetGlassTypes({
    params: {
      name: searchTerm
    }
  }) as { data: GlassType[] | undefined, isLoading: boolean };

  const fields = glassTypeFields(t);

  const glassTypes = glassTypesData || [];
  const enhancedGlassTypes = glassTypes.map((glassType: GlassType, index: number) => ({
    ...glassType,
    displayId: index + 1
  }));

  const { mutate: updateGlassType, isPending: isUpdating } = useUpdateGlassType();
  const { mutate: deleteGlassType } = useDeleteGlassType();

  const handleEdit = (glassType: GlassType) => {
    setEditingGlassType(glassType);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<GlassType>) => {
    if (!editingGlassType?.id) return;

    updateGlassType(
      { ...data, id: editingGlassType.id } as GlassType,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.glass_types') }));
          setIsFormOpen(false);
          setEditingGlassType(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.glass_types') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteGlassType(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.glass_types') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.glass_types') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.glass_types')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_glass_type')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedGlassTypes}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-glass-type')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingGlassType || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
