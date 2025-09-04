import { createResourceApiHooks } from "../helpers/createResourceApi";

export interface YearlyPlanDetail {
  month: number;
  sales_plan: string | number;
  clients_plan: string | number;
  sales_count_plan: string | number;
  sales?: number;
  clients?: number;
  sales_count?: number;
  sales_percentage?: number;
  clients_percentage?: number;
  sales_count_percentage?: number;
}

export interface YearlyPlan {
  id?: number;
  user: {
    id: number;
    full_name: string;
    role?: string;
  };
  year: number;
  details: YearlyPlanDetail[];
}

export interface CreateYearlyPlanRequest {
  user: number;
  year: number;
  details: {
    month: number;
    sales_plan: number;
    clients_plan: number;
    sales_count_plan: number;
  }[];
}

export interface UpdateYearlyPlanRequest {
  id: number;
  user?: number;
  year: number;
  details: {
    month: number;
    sales_plan: number;
    clients_plan: number;
    sales_count_plan: number;
  }[];
}

export interface YearlyPlanParams {
  year?: number;
  user?: number;
  role?: string;
}

export interface YearlyPlanTotals {
  year: string;
  month: string;
  total_plan: number;
  total_sales: number;
  percent_done: number;
}

export interface YearlyPlanTotalsParams {
  year: number;
  month?: number;
}

const YEARLY_PLAN_URL = "yearly-plans/";

export const {
  useGetResources: useGetYearlyPlans,
  useGetResource: useGetYearlyPlan,
  useDeleteResource: useDeleteYearlyPlan,
} = createResourceApiHooks<YearlyPlan>(YEARLY_PLAN_URL, "yearly-plans");

// Custom create hook that uses the proper request interface
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export const useCreateYearlyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPlan: CreateYearlyPlanRequest) => {
      const response = await api.post<YearlyPlan>(YEARLY_PLAN_URL, newPlan);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yearly-plans"] });
    },
  });
};

export const useUpdateYearlyPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatePlan: UpdateYearlyPlanRequest) => {
      const response = await api.put<YearlyPlan>(
        `${YEARLY_PLAN_URL}${updatePlan.id}/`,
        updatePlan,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["yearly-plans"] });
    },
  });
};

export const useGetYearlyPlanTotals = () => {
  return useMutation({
    mutationFn: async (params: YearlyPlanTotalsParams) => {
      const queryParams = new URLSearchParams({
        year: params.year.toString(),
        ...(params.month && { month: params.month.toString() }),
      });
      const response = await api.get<YearlyPlanTotals>(
        `yearly-plans/totals/?${queryParams.toString()}`,
      );
      return response.data;
    },
  });
};
