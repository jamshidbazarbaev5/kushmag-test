import { createResourceApiHooks } from "../helpers/createResourceApi";

export interface DailyPlanDetail {
  date: string;
  sales_plan: number;
  clients_plan: number;
  sales_count_plan: number;
  sales: number;
  clients: number;
  sales_count: number;
  sales_percentage: number;
  clients_percentage: number;
  sales_count_percentage: number;
}

export interface DailyPlanResponse {
  id?: number;
  user: {
    id: number;
    full_name: string;
  };
  year: number;
  month: number;
  details: DailyPlanDetail[];
}

export interface DailyPlanParams {
  year?: number;
  month?: number;
  day?: number;
  user?: number;
}

const DAILY_PLAN_URL = "daily-plans/";

export const {
  useGetResources: useGetDailyPlans,
  useGetResource: useGetDailyPlan,
  useCreateResource: useCreateDailyPlan,
  useUpdateResource: useUpdateDailyPlan,
  useDeleteResource: useDeleteDailyPlan,
} = createResourceApiHooks<DailyPlanResponse>(DAILY_PLAN_URL, "daily-plans");
