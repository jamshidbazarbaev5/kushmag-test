import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { SteelColor } from './types';

const STEEL_COLOR_URL = 'steel-colors/';

export const {
  useGetResources: useGetSteelColors,
  useGetResource: useGetSteelColor,
  useCreateResource: useCreateSteelColor,
  useUpdateResource: useUpdateSteelColor,
  useDeleteResource: useDeleteSteelColor,
} = createResourceApiHooks<SteelColor>(STEEL_COLOR_URL, 'steelColors');
