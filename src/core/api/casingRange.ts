import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { CasingRange } from './types';

const casingRangeApi = createResourceApiHooks<CasingRange>('casing-ranges/', 'CasingRange');

export const useGetCasingRanges = casingRangeApi.useGetResources;
export const useCreateCasingRange = casingRangeApi.useCreateResource;
export const useUpdateCasingRange = casingRangeApi.useUpdateResource;
export const useDeleteCasingRange = casingRangeApi.useDeleteResource;
