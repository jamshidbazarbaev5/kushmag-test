import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateColor } from '../api/color';

const colorFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.color_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreateColorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createColor, isPending: isCreating } = useCreateColor();

  const handleSubmit = (data: { name: string }) => {
    createColor({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.colors') }));
        navigate('/colors');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.colors') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={colorFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
