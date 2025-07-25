import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Beading } from './types';

const BEADING_URL = 'beadings/';

export const {
  useGetResources: useGetBeadings,
  useGetResource: useGetBeading,
  useCreateResource: useCreateBeading,
  useUpdateResource: useUpdateBeading,
  useDeleteResource: useDeleteBeading,
} = createResourceApiHooks<Beading>(BEADING_URL, 'beadings');
