import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { Lock } from './types';

const LOCK_URL = 'locks/';

export const {
  useGetResources: useGetLocks,
  useGetResource: useGetLock,
  useCreateResource: useCreateLock,
  useUpdateResource: useUpdateLock,
  useDeleteResource: useDeleteLock,
} = createResourceApiHooks<Lock>(LOCK_URL, 'locks');
