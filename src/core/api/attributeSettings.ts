import { createResourceApiHooks } from '../helpers/createResourceApi';
import type { AttributeSettings } from './types';

const ATTRIBUTE_SETTINGS_URL = 'attribute-settings/';

export const {
  useGetResources: useGetAttributeSettings,
  useUpdateResource: useUpdateAttributeSettings,
} = createResourceApiHooks<AttributeSettings>(ATTRIBUTE_SETTINGS_URL, 'attribute-settings');
