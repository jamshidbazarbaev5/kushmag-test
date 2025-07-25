import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { type Material, useGetMaterials, useUpdateMaterial, useDeleteMaterial } from '../api/material';

const materialFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.material_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.material_name'),
    accessorKey: 'name',
  },
];

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: materialsData, isLoading } = useGetMaterials({
    params: {
      name: searchTerm
    }
  }) as { data: Material[] | undefined, isLoading: boolean };

  const fields = materialFields(t);

  // Get the materials array directly from the response
  const materials = materialsData || [];

  // Enhance materials with display ID
  const enhancedMaterials = materials.map((material: Material, index: number) => ({
    ...material,
    displayId: index + 1
  }));

  const { mutate: updateMaterial, isPending: isUpdating } = useUpdateMaterial();
  const { mutate: deleteMaterial } = useDeleteMaterial();

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Material>) => {
    if (!editingMaterial?.id) return;

    updateMaterial(
      { ...data, id: editingMaterial.id } as Material,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.materials') }));
          setIsFormOpen(false);
          setEditingMaterial(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.materials') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteMaterial(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.materials') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.materials') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.materials')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_material')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedMaterials}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-material')}
        // totalCount={enhancedMaterials.length}
        // pageSize={30}
        // currentPage={1}
        // onPageChange={() => {}}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingMaterial || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
