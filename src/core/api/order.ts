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
  order_code: string;
  order_date: string;
  deadline_date: string;
  seller: ModelReference;
  operator: ModelReference;
  discount_percentage: number;
  discount_amount: string;
  total_amount: string;
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
