import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Frame } from './types';

const FRAME_URL = 'frames/';

export const {
  useGetResources: useGetFrames,
  useGetResource: useGetFrame,
  useCreateResource: useCreateFrame,
  useUpdateResource: useUpdateFrame,
  useDeleteResource: useDeleteFrame,
} = createResourceApiHooks<Frame>(FRAME_URL, 'frames');
