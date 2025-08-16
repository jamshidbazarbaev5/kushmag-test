import { createResourceApiHooks } from "../helpers/createResourceApi";

interface ModelMeta {
  href: string;
  type: string;
  mediaType: string;
}

interface ModelReference {
  id: string;
  accountId?: string;
  name: string;
  meta: ModelMeta;
}

interface Door {
  model: ModelReference;
  material: number;
  material_type: number;
  massif: number;
  color: number;
  patina_color: number;
  beading_main: number;
  beading_additional: number;
  glass_type: number;
  threshold: number;
  height: number;
  width: number;
  quantity: number;
  price: string;
  extensions?: {
    model: ModelReference;
    height: number;
    width: number;
    quantity: number;
    price: string;
  }[];
  casings?: {
    model: ModelReference;
    width: number;
    height: number;
    quantity: number;
    price: string;
  }[];
  crowns?: {
    model: ModelReference;
    width: number;
    quantity: number;
    price: string;
  }[];
  accessories?: {
    model: ModelReference;
    accessory_type: "cube" | "leg" | "glass" | "lock" | "topsa" | "beading";
    quantity: number;
    price: string;
  }[];
}

export interface Order {
  id?: number;
  rate: ModelReference;
  store: ModelReference;
  project: ModelReference;
  agent: ModelReference;
  organization: ModelReference;
  status:any;
  salesChannel: ModelReference;
  address: string;
  // order_code: string;
  // order_date: string;
  deadline_date: string;
  seller: ModelReference;
  operator: ModelReference;
  discount_percentage: number;
  discount_amount: string;
  total_amount: string;
  branch?: ModelReference;
  zamershik?: ModelReference;
  advance_payment: string;
  agreement_amount: string;
  remaining_balance: string;
  description: string;
  doors: Door[];
}

export interface OrderTotals {
  total_discount_amount: number;
  total_total_amount: number;
  total_advance_payment: number;
  total_remaining_balance: number;
}

export interface OrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
  overall_totals?: OrderTotals;
  page_totals?: OrderTotals;
}

const ORDER_URL = "orders/";

export const {
  useGetResources: useGetOrders,
  useGetResource: useGetOrder,
  useCreateResource: useCreateOrder,
  useUpdateResource: useUpdateOrder,
  useDeleteResource: useDeleteOrder,
} = createResourceApiHooks<Order, OrdersResponse>(ORDER_URL, "orders");

// Add calculate order functionality
import { useMutation } from "@tanstack/react-query";
import api from "./api";

export interface CalculateOrderResponse {
  total_sum: number;
  door_price: number;
  casing_price: number;
  extension_price: number;
  crown_price: number;
  accessory_price: number;
}

export const useCalculateOrder = () => {
  return useMutation<CalculateOrderResponse, Error, any>({
    mutationFn: async (orderData: any) => {
      const response = await api.post("orders/calculate/", orderData);
      return response.data;
    },
  });
};

export const useSendToMoySklad = () => {
  return useMutation<any, Error, number>({
    mutationFn: async (orderId: number) => {
      const response = await api.post(`orders/${orderId}/moy_sklad/`, {});
      return response.data;
    },
  });
};

export const useChangeOrderStatus = () => {
  return useMutation<any, Error, { orderId: number; status: number }>({
    mutationFn: async ({ orderId, status }) => {
      const response = await api.post(`orders/${orderId}/change-status/`, {
        status,
      });
      return response.data;
    },
  });
};
