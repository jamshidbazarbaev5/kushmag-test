import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateGlassType } from '../api/glassType';

const glassTypeFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.glass_type_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreateGlassTypePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createGlassType, isPending: isCreating } = useCreateGlassType();

  const handleSubmit = (data: { name: string }) => {
    createGlassType({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.glass_types') }));
        navigate('/glass-types');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.glass_types') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={glassTypeFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
