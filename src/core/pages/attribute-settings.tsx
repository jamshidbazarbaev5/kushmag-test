import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetAttributeSettings, useUpdateAttributeSettings } from '../api/attributeSettings';
import type { AttributeSettings } from '../api/types';

const attributeSettingsFields = (t: any) => [
  {
    name: 'casing_size',
    label: t('forms.casing_size'),
    type: 'number',
    step: '0.01',
    placeholder: t('placeholders.enter_casing_size'),
    required: true,
  },
  {
    name: 'crown_size',
    label: t('forms.crown_size'),
    type: 'number',
    step: '0.01',
    placeholder: t('placeholders.enter_crown_size'),
    required: true,
  },
  {
    name: 'casing_formula',
    label: t('forms.casing_formula'),
    type: 'select',
    // step: '0.01',
    placeholder: t('placeholders.enter_crown_size'),
    options:[
      { value: 'true', label: t('forms.formula_1') },
      { value: 'false', label: t('forms.formula_2') },
    ],
    required: true,
  },
  
];

export default function AttributeSettingsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { t } = useTranslation();
  
  const { data: attributeSettingsData, isLoading } = useGetAttributeSettings();
  const attributeSettings = Array.isArray(attributeSettingsData) 
    ? attributeSettingsData[0] 
    : attributeSettingsData?.results?.[0];

  const fields = attributeSettingsFields(t);
  const { mutate: updateAttributeSettings, isPending: isUpdating } = useUpdateAttributeSettings();

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<AttributeSettings>) => {
    if (!attributeSettings?.id) return;

    updateAttributeSettings(
      { ...data, id: attributeSettings.id } as AttributeSettings,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.attribute_settings') }));
          setIsFormOpen(false);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.attribute_settings') })),
      }
    );
  };

  if (isLoading) {
    return <div>{t('messages.loading')}</div>;
  }

  if (!attributeSettings) {
    return <div>{t('messages.no_data')}</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.attribute_settings')}</h1>
        <button
          onClick={handleEdit}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          {t('buttons.edit')}
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-medium">{t('forms.casing_size')}</label>
            <p>{attributeSettings.casing_size}</p>
          </div>
          <div>
            <label className="font-medium">{t('forms.crown_size')}</label>
            <p>{attributeSettings.crown_size}</p>
          </div>
          <div>
            <label className="font-medium">{t('forms.casing_formula')}</label>
            <p>{attributeSettings.casing_formula ? t('forms.formula_1') : t('forms.formula_2')}</p>
          </div>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={attributeSettings}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
