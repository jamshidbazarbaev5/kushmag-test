import { createResourceApiHooks } from '../helpers/createResourceApi';

export interface User {
  id?: number;
  username: string;
  password?: string;
  full_name: string;
  phone_number: string;
  role: 'ADMIN' | 'PRODAVEC' | 'ZAMERSHIK' | 'OPERATOR' | 'SOTRUDNIK';
  api_login?: string;
  api_password?: string;
  fixed_salary?: number;
  order_percentage?: number;
  moy_sklad_staff?: {
    meta: {
      href: string;
      type: string;
      mediaType: string;
    }
  };
  staff_member?: any
}

const USER_URL = 'users/';

export const {
  useGetResources: useGetUsers,
  useGetResource: useGetUser,
  useCreateResource: useCreateUser,
  useUpdateResource: useUpdateUser,
  useDeleteResource: useDeleteUser,
} = createResourceApiHooks<User>(USER_URL, 'users');
