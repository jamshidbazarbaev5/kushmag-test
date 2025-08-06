import { createResourceApiHooks } from '../helpers/createResourceApi';

interface Meta {
  href: string;
  type: string;
  mediaType: string;
}

interface BaseReference {
  id: string;
  accountId?: string;
  name: string;
  meta: Meta;
}

export interface Currency extends BaseReference {
  fullName: string;
  isoCode: string;
}

export interface Store extends BaseReference {}
export interface Project extends BaseReference {}
export interface Counterparty extends BaseReference {}
export interface Organization extends BaseReference {}
export interface SalesChannel extends BaseReference {}
export interface Seller extends BaseReference {}
export interface Operator extends BaseReference {}
export interface Branch extends BaseReference {
 
}

const CURRENCY_URL = 'currency/';
const STORE_URL = 'store/';
const PROJECT_URL = 'project/';
const COUNTERPARTY_URL = 'counterparty/';
const ORGANIZATION_URL = 'organization/';
const SALESCHANNEL_URL = 'saleschannel/';
const SELLER_URL = 'sellers/';
const OPERATOR_URL = 'operators/';
const BRANCH_URL = 'branches/';

export const {
  useGetResources: useGetCurrencies,
  useGetResource: useGetCurrency,
} = createResourceApiHooks<Currency>(CURRENCY_URL, 'currency');

export const {
  useGetResources: useGetStores,
  useGetResource: useGetStore,
} = createResourceApiHooks<Store>(STORE_URL, 'store');

export const {
  useGetResources: useGetProjects,
  useGetResource: useGetProject,
} = createResourceApiHooks<Project>(PROJECT_URL, 'project');

export const {
  useGetResources: useGetCounterparties,
  useGetResource: useGetCounterparty,
} = createResourceApiHooks<Counterparty>(COUNTERPARTY_URL, 'counterparty');

export const {
  useGetResources: useGetOrganizations,
  useGetResource: useGetOrganization,
} = createResourceApiHooks<Organization>(ORGANIZATION_URL, 'organization');

export const {
  useGetResources: useGetSalesChannels,
  useGetResource: useGetSalesChannel,
} = createResourceApiHooks<SalesChannel>(SALESCHANNEL_URL, 'saleschannel');

export const {
  useGetResources: useGetSellers,
  useGetResource: useGetSeller,
} = createResourceApiHooks<Seller>(SELLER_URL, 'sellers');

export const {
  useGetResources: useGetOperators,
  useGetResource: useGetOperator,
} = createResourceApiHooks<Operator>(OPERATOR_URL, 'operators');

export const {
  useGetResources: useGetBranches,
  useGetResource: useGetBranch,
} = createResourceApiHooks<Branch>(BRANCH_URL, 'branches');