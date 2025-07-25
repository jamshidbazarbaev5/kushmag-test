import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useCreateBeading } from '../api/beading';
import type { Beading } from '../api/types';

const beadingFields = (t: any) => [
  {
    name: 'name',
    label: t('forms.beading_name'),
    type: 'text',
    placeholder: t('placeholders.enter_name'),
    required: true,
  },
  {
    name: 'type',
    label: t('forms.beading_type'),
    type: 'select',
    options: [
      { value: 'main', label: t('forms.beading_type_main') },
      { value: 'additional', label: t('forms.beading_type_additional') }
    ],
    required: true,
  }
];

export default function CreateBeadingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mutate: createBeading, isPending: isCreating } = useCreateBeading();

  const handleSubmit = (data: Pick<Beading, 'name' | 'type'>) => {
    createBeading({ id: 0, ...data }, {
      onSuccess: () => {
        toast.success(t('messages.success.created', { item: t('navigation.beadings') }));
        navigate('/beadings');
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.beadings') })),
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="">
        <ResourceForm
          fields={beadingFields(t)}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
