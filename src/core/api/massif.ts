import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Massif } from './types';

const MASSIF_URL = 'massifs/';

export const {
  useGetResources: useGetMassifs,
  useGetResource: useGetMassif,
  useCreateResource: useCreateMassif,
  useUpdateResource: useUpdateMassif,
  useDeleteResource: useDeleteMassif,
} = createResourceApiHooks<Massif>(MASSIF_URL, 'massifs');
