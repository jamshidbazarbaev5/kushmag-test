import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Cladding } from './types';

const CLADDING_URL = 'claddings/';

export const {
  useGetResources: useGetCladdings,
  useGetResource: useGetCladding,
  useCreateResource: useCreateCladding,
  useUpdateResource: useUpdateCladding,
  useDeleteResource: useDeleteCladding,
} = createResourceApiHooks<Cladding>(CLADDING_URL, 'claddings');
