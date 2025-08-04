import { createResourceApiHooks } from '../helpers/createResourceApi';
import { useMutation } from '@tanstack/react-query';
import api from './api';

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

// Export single measure to Excel
export const useExportMeasure = () => {
  return useMutation({
    mutationFn: async (measureId: number) => {
      const response = await api.get(`measures/${measureId}/export/`, {
        responseType: 'blob',
      });
      
      // Create blob and download file
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `measure_${measureId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
  });
};

