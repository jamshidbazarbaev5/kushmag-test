import { useMemo } from 'react';
import { useGetThresholds } from '../api/threshold';

export interface SelectOption {
  value: string;
  label: string;
}

export function useThresholdOptions() {
  const { data: thresholdsResponse, isLoading, error } = useGetThresholds();

  const thresholdOptions = useMemo(() => {
    if (!thresholdsResponse) return [];

    // Handle both paginated and non-paginated responses
    const thresholds = Array.isArray(thresholdsResponse)
      ? thresholdsResponse
      : thresholdsResponse.results || [];

    return thresholds.map((threshold) => ({
      value: threshold.id.toString(),
      label: threshold.name,
    }));
  }, [thresholdsResponse]);

  return {
    thresholdOptions,
    isLoading,
    error,
  };
}
