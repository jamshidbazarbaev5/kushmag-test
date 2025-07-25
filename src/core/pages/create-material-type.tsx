import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateMaterialType } from '../api/materialType';
// import type { MaterialType } from '../api/types';

const materialTypeFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.material_type_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreateMaterialTypePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createMaterialType, isPending: isCreating } = useCreateMaterialType();

  const handleSubmit = (data: { name: string }) => {
    createMaterialType({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.material_types') }));
        navigate('/material-types');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.material_types') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={materialTypeFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
