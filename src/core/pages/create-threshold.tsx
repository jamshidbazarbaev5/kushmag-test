import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateThreshold } from '../api/threshold';

const thresholdFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.threshold_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreateThresholdPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createThreshold, isPending: isCreating } = useCreateThreshold();

  const handleSubmit = (data: { name: string }) => {
    createThreshold({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.thresholds') }));
        navigate('/thresholds');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.thresholds') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={thresholdFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
