import { createResourceApiHooks } from '../helpers/createResourceApi';

interface Extension {
  width: number;
  height: number;
  quantity: number;
}

interface Crown {
  quantity: number;
}

interface Door {
  room_name: string;
  glass_type: number;
  width: number;
  height: number;
  quantity: number;
  opening_side: 'onga' | 'shepke';
  swing_direction: 'sirtka' | 'ishke';
  construction_side: 'sirtka' | 'ishke';
  promog: 'bar' | 'joq';
  threshold: number;
  casing_zamer: 'p' | 'g';
  extensions?: Extension[];
  crowns?: Crown[];
}

export interface Measure {
  id?: number;
  client_name: string;
  client_phone: string;
  address: string;
  zamer_status: 'new' | 'completed' | 'cancelled';
  zamershik?: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
  doors: Door[];
}
const MEASURE_URL = 'measures/';

export const {
  useGetResources: useGetMeasures,
  useGetResource: useGetMeasure,
  useCreateResource: useCreateMeasure,
  useUpdateResource: useUpdateMeasure,
  useDeleteResource: useDeleteMeasure,
} = createResourceApiHooks<Measure>(MEASURE_URL, 'measures');

