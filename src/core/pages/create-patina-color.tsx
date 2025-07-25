import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreatePatinaColor } from '../api/patinaColor';

const patinaColorFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.patina_color_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreatePatinaColorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createPatinaColor, isPending: isCreating } = useCreatePatinaColor();

  const handleSubmit = (data: { name: string }) => {
    createPatinaColor({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.patina_colors') }));
        navigate('/patina-colors');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.patina_colors') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={patinaColorFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
