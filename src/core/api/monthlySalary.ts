import { createResourceApiHooks } from '../helpers/createResourceApi';

export interface MonthlySalary {
  id?: number;
  month: string; // Format: "2025-07-01"
  user: number;
  fixed_salary: number;
  order_percentage: number;
  order_percentage_salary: number;
  penalties: number;
  bonuses: number;
  total_salary: number;
  user_details?: {
    id: number;
    username: string;
    full_name: string;
    phone_number: string;
    role: string;
    fixed_salary: number;
    order_percentage: number;
  };
}

const MONTHLY_SALARY_URL = 'monthly-salaries/';

export const {
  useGetResources: useGetMonthlySalaries,
  useGetResource: useGetMonthlySalary,
  useCreateResource: useCreateMonthlySalary,
  useUpdateResource: useUpdateMonthlySalary,
  useDeleteResource: useDeleteMonthlySalary,
} = createResourceApiHooks<MonthlySalary>(MONTHLY_SALARY_URL, 'monthlySalaries');
