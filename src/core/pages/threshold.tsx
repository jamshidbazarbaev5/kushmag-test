import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetThresholds, useUpdateThreshold, useDeleteThreshold } from '../api/threshold';
import type { Threshold } from '../api/types';

const thresholdFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.threshold_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

const columns = (t: any) => [
  {
    header: t('forms.threshold_name'),
    accessorKey: 'name',
  },
];

export default function ThresholdsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState<Threshold | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: thresholdsData, isLoading } = useGetThresholds({
    params: {
      name: searchTerm
    }
  }) as { data: Threshold[] | undefined, isLoading: boolean };

  const fields = thresholdFields(t);

  const thresholds = thresholdsData || [];
  const enhancedThresholds = thresholds.map((threshold: Threshold, index: number) => ({
    ...threshold,
    displayId: index + 1
  }));

  const { mutate: updateThreshold, isPending: isUpdating } = useUpdateThreshold();
  const { mutate: deleteThreshold } = useDeleteThreshold();

  const handleEdit = (threshold: Threshold) => {
    setEditingThreshold(threshold);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<Threshold>) => {
    if (!editingThreshold?.id) return;

    updateThreshold(
      { ...data, id: editingThreshold.id } as Threshold,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.thresholds') }));
          setIsFormOpen(false);
          setEditingThreshold(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.thresholds') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteThreshold(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.thresholds') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.thresholds') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.thresholds')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_threshold')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedThresholds}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-threshold')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingThreshold || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
