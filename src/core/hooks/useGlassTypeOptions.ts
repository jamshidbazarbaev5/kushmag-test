import { useMemo } from 'react';
import { useGetGlassTypes } from '../api/glassType';

export interface SelectOption {
  value: string;
  label: string;
}

export function useGlassTypeOptions() {
  const { data: glassTypesResponse, isLoading, error } = useGetGlassTypes();

  const glassTypeOptions = useMemo(() => {
    if (!glassTypesResponse) return [];

    // Handle both paginated and non-paginated responses
    const glassTypes = Array.isArray(glassTypesResponse)
      ? glassTypesResponse
      : glassTypesResponse.results || [];

    return glassTypes.map((glassType) => ({
      value: glassType.id.toString(),
      label: glassType.name,
    }));
  }, [glassTypesResponse]);

  return {
    glassTypeOptions,
    isLoading,
    error,
  };
}
