import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetMaterialTypes, useUpdateMaterialType, useDeleteMaterialType } from '../api/materialType';
import type { MaterialType } from '../api/types';

const materialTypeFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.material_type_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.material_type_name'),
    accessorKey: 'name',
  },
];

export default function MaterialTypesPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterialType, setEditingMaterialType] = useState<MaterialType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: materialTypesData, isLoading } = useGetMaterialTypes({
    params: {
      name: searchTerm
    }
  }) as { data: MaterialType[] | undefined, isLoading: boolean };

  const fields = materialTypeFields(t);

  const materialTypes = materialTypesData || [];
  const enhancedMaterialTypes = materialTypes.map((materialType: MaterialType, index: number) => ({
    ...materialType,
    displayId: index + 1
  }));

  const { mutate: updateMaterialType, isPending: isUpdating } = useUpdateMaterialType();
  const { mutate: deleteMaterialType } = useDeleteMaterialType();

  const handleEdit = (materialType: MaterialType) => {
    setEditingMaterialType(materialType);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<MaterialType>) => {
    if (!editingMaterialType?.id) return;

    updateMaterialType(
      { ...data, id: editingMaterialType.id } as MaterialType,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.material_types') }));
          setIsFormOpen(false);
          setEditingMaterialType(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.material_types') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMaterialType(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.material_types') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.material_types') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.material_types')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_material_type')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedMaterialTypes}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-material-type')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingMaterialType || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
