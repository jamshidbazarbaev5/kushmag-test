import { createResourceApiHooks } from '../helpers/createResourceApi';

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
    accessory_type: 'cube' | 'leg' | 'glass' | 'lock' | 'topsa' | 'beading';
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
  remaining_balance: string;
  description: string;
  doors: Door[];
}

const ORDER_URL = 'orders/';

export const {
  useGetResources: useGetOrders,
  useGetResource: useGetOrder,
  useCreateResource: useCreateOrder,
  useUpdateResource: useUpdateOrder,
  useDeleteResource: useDeleteOrder,
} = createResourceApiHooks<Order>(ORDER_URL, 'orders');

// Add calculate order functionality
import { useMutation } from '@tanstack/react-query';
import api from './api';

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
      const response = await api.post('orders/calculate/', orderData);
      return response.data;
    },
  });
};
