export const useGetProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('products/');
      return response.data;
    },
  });
};
import { useQuery } from '@tanstack/react-query';
import api  from './api';

export const useSearchProducts = (search?: string) => {
  return useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const response = await api.get(`/api/products`, {
        params: { search }
      });
      return response.data;
    },
    enabled: !!search
  });
};
