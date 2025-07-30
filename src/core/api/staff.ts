import { useQuery } from '@tanstack/react-query';
import api from './api';

export interface StaffMember {
  id: string;
  accountId: string;
  name: string;
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
}

export const useGetSellers = () => {
  return useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>('/sellers');
      return data;
    },
  });
};

export const useGetOperators = () => {
  return useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>('/operators');
      return data;
    },
  });
};
