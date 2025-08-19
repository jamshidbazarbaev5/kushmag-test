import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { DeadlineDay } from './types';

const DEADLINE_DAY_URL = 'deadline-day/';

export const {
  useGetResources: useGetDeadlineDays,
  useGetResource: useGetDeadlineDay,
  useUpdateResource: useUpdateDeadlineDay,
} = createResourceApiHooks<DeadlineDay>(DEADLINE_DAY_URL, 'deadline-days');
