import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateMaterial } from '../api/material';

const materialFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.material_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
];

export default function CreateMaterialPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createMaterial, isPending: isCreating } = useCreateMaterial();

  const handleSubmit = (data: { name: string }) => {
    createMaterial({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.materials') }));
        navigate('/materials');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.materials') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* <div className=" mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.create_material')}</h1>
      </div> */}
      
      <div className="">
        <ResourceForm
          fields={materialFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
