import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateMassif } from '../api/massif';

const massifFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.massif_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreateMassifPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createMassif, isPending: isCreating } = useCreateMassif();

  const handleSubmit = (data: { name: string }) => {
    createMassif({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.massifs') }));
        navigate('/massifs');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.massifs') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={massifFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
