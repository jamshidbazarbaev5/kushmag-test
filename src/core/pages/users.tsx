import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetUsers, useUpdateUser, useDeleteUser } from '../api/user';
import type { User } from '../api/user';
import { useGetSellers, useGetOperators } from '../api/staff';

const userFields = (t: any, { sellers, operators }: { sellers?: any[], operators?: any[] }) => [
  {
    name: 'username',
    label: t('forms.username'),
    type: 'text',
    placeholder: t('placeholders.enter_username'),
    required: true,
  },
  {
    name: 'full_name',
    label: t('forms.full_name'),
    type: 'text',
    placeholder: t('placeholders.enter_full_name'),
    required: true,
  },
  {
    name: 'phone_number',
    label: t('forms.phone_number'),
    type: 'text',
    placeholder: t('placeholders.enter_phone_number'),
    required: true,
  },
  {
    name: 'role',
    label: t('forms.role'),
    type: 'select',
    required: true,
    options: [
      { value: 'ADMIN', label: t('roles.admin') },
      { value: 'PRODAVEC', label: t('roles.prodavec') },
      { value: 'ZAMERSHIK', label: t('roles.zamershik') },
      { value: 'OPERATOR', label: t('roles.operator') },
      { value: 'SOTRUDNIK', label: t('roles.sotrudnik') },
    ],
    onChange: (value: string, _formData: any, onChange: (field: string, value: any) => void) => {
      onChange('role', value);
      onChange('staff_member', null);
    }
  },
  {
    name: 'staff_member',
    label: t('forms.staff_member'),
    type: 'select',
    required: (formData: any) => ['PRODAVEC', 'OPERATOR'].includes(formData.role),
    options: (formData: any) => {
      if (formData.role === 'PRODAVEC' && sellers) {
        return sellers.map(seller => ({
          label: seller.name,
          value: JSON.stringify(seller)
        }));
      }
      if (formData.role === 'OPERATOR' && operators) {
        return operators.map(operator => ({
          label: operator.name,
          value: JSON.stringify(operator)
        }));
      }
      return [];
    },
    show: (formData: any) => ['PRODAVEC', 'OPERATOR'].includes(formData.role),
  },
  {
    name: 'api_login',
    label: t('forms.api_login'),
    type: 'text',
    placeholder: t('placeholders.enter_api_login'),
  },
  {
    name: 'api_password',
    label: t('forms.api_password'),
    type: 'password',
    placeholder: t('placeholders.enter_api_password'),
  },
  {
    name: 'fixed_salary',
    label: t('forms.fixed_salary'),
    type: 'number',
    placeholder: t('placeholders.enter_fixed_salary'),
  },
];

const columns = (t: any) => [
  {
    header: t('forms.username'),
    accessorKey: 'username',
  },
  {
    header: t('forms.full_name'),
    accessorKey: 'full_name',
  },
  {
    header: t('forms.phone_number'),
    accessorKey: 'phone_number',
  },
  {
    header: t('forms.role'),
    accessorKey: 'role',
    // cell: (info: any) => {
    //   const role = info.row?.original.role as string;
    //   return t(`roles.${role?.toLowerCase()}`);
    // }
  },
  {
    header: t('forms.fixed_salary'),
    accessorKey: 'fixed_salary',
  },
];

export default function UsersPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const { data: sellers } = useGetSellers();
  const { data: operators } = useGetOperators();
  
  const { data: usersData, isLoading } = useGetUsers({
    params: {
      search: searchTerm
    }
  });

  const fields = userFields(t, { sellers, operators });

  const users = Array.isArray(usersData) ? usersData : usersData?.results || [];
  const enhancedUsers = users.map((user: User, index: number) => ({
    ...user,
    displayId: index + 1
  }));

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  const handleEdit = (user: User) => {
    // type UserWithStaffMember = User & { staff_member?: string };
    // const userData: UserWithStaffMember = { ...user };
    const userData = { ...user };
    
    // Set the staff_member field if moy_sklad_staff exists
    if (userData.moy_sklad_staff && ['PRODAVEC', 'OPERATOR'].includes(userData.role)) {
      const staffList = userData.role === 'PRODAVEC' ? sellers : operators;
      const staffMember = staffList?.find(staff => staff.meta.href === userData.moy_sklad_staff?.meta.href);
      if (staffMember) {
        userData.staff_member = JSON.stringify(staffMember);
      }
    }
    
    setEditingUser(userData);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<User> & { staff_member?: string }) => {
    if (!editingUser?.id) return;

    const formData = { ...data };
    if (formData.staff_member) {
      try {
        const staffMember = JSON.parse(formData.staff_member);
        formData.moy_sklad_staff = {
          meta: staffMember.meta
        };
        delete formData.staff_member;
      } catch (e) {
        console.error('Failed to parse staff member data');
      }
    }

    updateUser(
      { ...formData, id: editingUser.id } as User,
      {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.users') }));
          setIsFormOpen(false);
          setEditingUser(null);
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.users') })),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteUser(id, {
      onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.users') })),
      onError: () => toast.error(t('messages.error.delete', { item: t('navigation.users') })),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.users')}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('placeholders.search_user')}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <ResourceTable
        data={enhancedUsers}
        columns={columns(t)}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate('/create-user')}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingUser || {}}
            isSubmitting={isUpdating}
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
