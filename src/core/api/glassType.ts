import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { GlassType } from './types';

const GLASS_TYPE_URL = 'glass-types/';

export const {
  useGetResources: useGetGlassTypes,
  useGetResource: useGetGlassType,
  useCreateResource: useCreateGlassType,
  useUpdateResource: useUpdateGlassType,
  useDeleteResource: useDeleteGlassType,
} = createResourceApiHooks<GlassType>(GLASS_TYPE_URL, 'glass-types');
