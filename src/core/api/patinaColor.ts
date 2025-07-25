import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { PatinaColor } from './types';

const PATINA_COLOR_URL = 'patina-colors/';

export const {
  useGetResources: useGetPatinaColors,
  useGetResource: useGetPatinaColor,
  useCreateResource: useCreatePatinaColor,
  useUpdateResource: useUpdatePatinaColor,
  useDeleteResource: useDeletePatinaColor,
} = createResourceApiHooks<PatinaColor>(PATINA_COLOR_URL, 'patina-colors');
