import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Color } from './types';

const COLOR_URL = 'colors/';

export const {
  useGetResources: useGetColors,
  useGetResource: useGetColor,
  useCreateResource: useCreateColor,
  useUpdateResource: useUpdateColor,
  useDeleteResource: useDeleteColor,
} = createResourceApiHooks<Color>(COLOR_URL, 'colors');
