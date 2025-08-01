import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateCasingRange } from '../api/casingRange';
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

export default function CreateCasingRangePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createRange, isPending: isCreating } = useCreateCasingRange();
  
  const fields = casingRangeFields(t);

  const handleSubmit = (data: Partial<CasingRange>) => {
    createRange(data as CasingRange, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.casing_ranges') }));
        navigate('/casing-ranges');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.casing_ranges') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {t('messages.create')} {t('navigation.casing_ranges')}
        </h1>
      </div>

      <ResourceForm
        fields={fields}
        onSubmit={handleSubmit}
        isSubmitting={isCreating}
      />
    </div>
  );
}
