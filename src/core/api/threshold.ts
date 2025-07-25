import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Threshold } from './types';

const THRESHOLD_URL = 'thresholds/';

export const {
  useGetResources: useGetThresholds,
  useGetResource: useGetThreshold,
  useCreateResource: useCreateThreshold,
  useUpdateResource: useUpdateThreshold,
  useDeleteResource: useDeleteThreshold,
} = createResourceApiHooks<Threshold>(THRESHOLD_URL, 'thresholds');
