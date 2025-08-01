import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetCasingRanges, useUpdateCasingRange, useDeleteCasingRange } from '../api/casingRange';
import type { CasingRange } from '../api/types';

const casingRangeFields = (t: any) => [
  {
    name: 'min_size',
    label: t('forms.min_size'),
    type: 'number',
    placeholder: t('placeholders.enter_min_size'),
    required: true,
    step: '0.1',
  },
  {
    name: 'max_size',
    label: t('forms.max_size'),
    type: 'number',
    placeholder: t('placeholders.enter_max_size'),
    required: true,
    step: '0.1',
  },
  {
    name: 'casing_size',
    label: t('forms.casing_size'),
    type: 'number',
    placeholder: t('placeholders.enter_casing_size'),
    required: true,
    step: '0.1',
  },
];

const columns = (t: any) => [
  {
    header: t('forms.min_size'),
    accessorKey: 'min_size',
  },
  {
    header: t('forms.max_size'),
    accessorKey: 'max_size',
  },
  {
    header: t('forms.casing_size'),
    accessorKey: 'casing_size',
  },
];

export default function CasingRangesPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<CasingRange | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const { data: rangesData, isLoading } = useGetCasingRanges({
    params: {
      search: searchTerm
    }
  });

  const fields = casingRangeFields(t);

  const ranges = (Array.isArray(rangesData) ? rangesData : rangesData?.results) || [];
  const enhancedRanges = ranges.map((range: CasingRange, index: number) => ({
    ...range,
    displayId: index + 1
  }));

  const { mutate: updateRange, isPending: isUpdating } = useUpdateCasingRange();
  const { mutate: deleteRange } = useDeleteCasingRange();

  const handleEdit = (range: CasingRange) => {
    setEditingRange(range);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<CasingRange>) => {
    if (!editingRange?.id) return;

    updateRange(
      { ...data, id: editingRange.id } as CasingRange,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.casing_ranges') }));
          setIsFormOpen(false);
          setEditingRange(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.casing_ranges') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteRange(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.casing_ranges') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.casing_ranges') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.casing_ranges')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_casing_range')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedRanges}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-casing-range')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingRange || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
