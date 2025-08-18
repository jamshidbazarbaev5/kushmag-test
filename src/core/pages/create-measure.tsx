import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
// import { useCreateMeasure } from '../api/measure';
import { useGetAllUsers } from '../api/user';
import { useCreateMeasure } from '../api/measure';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function CreateMeasurePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {mutate:createMeasure} = useCreateMeasure();
  const { data: currentUser } = useCurrentUser();
  
  // Fetch all users and filter zamershiks
  const { data: usersData } = useGetAllUsers();

  const zamershiks = (usersData || []).filter((user: any) => user.role === 'ZAMERSHIK');

  // Check if current user is a zamershik
  const isCurrentUserZamershik = currentUser?.role === 'ZAMERSHIK';

  const fields = [
    {
      name: 'client_name',
      label: t('forms.client_name'),
      type: 'text',
      placeholder: t('placeholders.enter_client_name'),
      required: true,
    },
    {
      name: 'client_phone',
      label: t('forms.client_phone'),
      type: 'text',
      placeholder: t('placeholders.enter_client_phone'),
      required: true,
    },
    {
      name: 'address',
      label: t('forms.address'),
      type: 'text',
      placeholder: t('placeholders.enter_address'),
      required: true,
    },
    // Only show zamershik select if current user is not a zamershik
    ...(isCurrentUserZamershik ? [] : [{
      name: 'zamershik',
      label: t('forms.zamershik'),
      type: 'select',
      required: true,
      options: zamershiks.map(user => ({
        value: user.id,
        label: user.full_name
      }))
    }])
  ];

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // If current user is a zamershik, set their ID as the zamershik
      const submitData = isCurrentUserZamershik 
        ? { ...data, zamershik: currentUser?.id }
        : data;
        
      await createMeasure(submitData);
      toast.success(t('messages.measure_created_successfully'));
      navigate('/measures');
    } catch (error) {
      toast.error(t('messages.error_creating_measure'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className=" mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t('titles.create_measure')}</h1>
        <ResourceForm
          fields={fields}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          title={t('messages.create')}
        />
      </div>
    </div>
  );
}
