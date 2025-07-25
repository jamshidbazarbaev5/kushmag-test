import { createResourceApiHooks } from  '../helpers/createResourceApi';



export interface Material { 
     id: number;
  name: string;
}
// API endpoints
const MATERIAL_URL = 'materials/';

// Create material API hooks using the factory function
export const {
  useGetResources: useGetMaterials,
  useGetResource: useGetMaterial,
  useCreateResource: useCreateMaterial,
  useUpdateResource: useUpdateMaterial,
  useDeleteResource: useDeleteMaterial,
} = createResourceApiHooks<Material>(MATERIAL_URL, 'materials');
