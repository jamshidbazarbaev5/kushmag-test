import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { MaterialType  } from './types';

const MATERIAL_TYPE_URL = 'material-types/';

export const {
  useGetResources: useGetMaterialTypes,
  useGetResource: useGetMaterialType,
  useCreateResource: useCreateMaterialType,
  useUpdateResource: useUpdateMaterialType,
  useDeleteResource: useDeleteMaterialType,
} = createResourceApiHooks<MaterialType>(MATERIAL_TYPE_URL, 'material-types');
