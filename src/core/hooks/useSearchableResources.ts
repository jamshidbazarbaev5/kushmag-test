import { useQuery } from "@tanstack/react-query";
import api from "../api/api";

interface BaseResource {
  id: string | number;
  name: string;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface SearchableResourceHookOptions {
  search?: string;
  enabled?: boolean;
}

// Generic hook for searchable resources
function createSearchableResourceHook(baseUrl: string, queryKey: string) {
  return (options: SearchableResourceHookOptions = {}) => {
    const { search = "", enabled = true } = options;

    return useQuery({
      queryKey: [queryKey, "search", search],
      queryFn: async () => {
        const params: Record<string, string> = {};
        if (search) {
          params.search = search;
        }

        const response = await api.get(baseUrl, { params });

        // Handle both array and paginated response formats
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.results) {
          return response.data.results;
        }

        return response.data;
      },
      enabled,
      staleTime: 30000, // 30 seconds
      gcTime: 300000, // 5 minutes
    });
  };
}

// Material resources
export const useSearchMaterials = createSearchableResourceHook(
  "materials/",
  "searchable-materials",
);
export const useSearchMaterialTypes = createSearchableResourceHook(
  "material-types/",
  "searchable-material-types",
);
export const useSearchMassifs = createSearchableResourceHook(
  "massifs/",
  "searchable-massifs",
);
export const useSearchColors = createSearchableResourceHook(
  "colors/",
  "searchable-colors",
);
export const useSearchPatinaColors = createSearchableResourceHook(
  "patina-colors/",
  "searchable-patina-colors",
);
export const useSearchBeadings = createSearchableResourceHook(
  "beadings/",
  "searchable-beadings",
);
export const useSearchGlassTypes = createSearchableResourceHook(
  "glass-types/",
  "searchable-glass-types",
);

// Order information resources
export const useSearchStores = createSearchableResourceHook(
  "store/",
  "searchable-stores",
);
export const useSearchProjects = createSearchableResourceHook(
  "project/",
  "searchable-projects",
);
export const useSearchOrganizations = createSearchableResourceHook(
  "organization/",
  "searchable-organizations",
);
export const useSearchBranches = createSearchableResourceHook(
  "branches/",
  "searchable-branches",
);
export const useSearchSalesChannels = createSearchableResourceHook(
  "saleschannel/",
  "searchable-sales-channels",
);
export const useSearchSellers = (
  options: SearchableResourceHookOptions = {},
) => {
  const { search = "", enabled = true } = options;

  return useQuery({
    queryKey: ["searchable-sellers", "search", search],
    queryFn: async () => {
      const params: Record<string, string> = {
        role: "PRODAVEC",
      };

      // Always include search parameter, even if empty
      params.search = search;

      const response = await api.get("users/", { params });

      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data.map((user: User) => ({
          id: user.id.toString(),
          name: user.full_name || user.username,
        }));
      } else if (response.data?.results) {
        return response.data.results.map((user: User) => ({
          id: user.id.toString(),
          name: user.full_name || user.username,
        }));
      }

      return response.data;
    },
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};

export const useSearchOperators = (
  options: SearchableResourceHookOptions = {},
) => {
  const { search = "", enabled = true } = options;

  return useQuery({
    queryKey: ["searchable-operators", "search", search],
    queryFn: async () => {
      const params: Record<string, string> = {
        role: "OPERATOR",
      };

      // Always include search parameter, even if empty
      params.search = search;

      const response = await api.get("users/", { params });

      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data.map((user: User) => ({
          id: user.id.toString(),
          name: user.full_name || user.username,
        }));
      } else if (response.data?.results) {
        return response.data.results.map((user: User) => ({
          id: user.id.toString(),
          name: user.full_name || user.username,
        }));
      }

      return response.data;
    },
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};
export const useSearchCounterparties = createSearchableResourceHook(
  "counterparty/",
  "searchable-counterparties",
);
export const useSearchZamershiks = (
  options: SearchableResourceHookOptions = {},
) => {
  const { search = "", enabled = true } = options;

  return useQuery({
    queryKey: ["searchable-zamershiks", "search", search],
    queryFn: async () => {
      const params: Record<string, string> = {
        role: "ZAMERSHIK",
      };

      // Always include search parameter, even if empty
      params.search = search;

      const response = await api.get("users/", { params });

      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data.map((user: User) => ({
          id: user.id.toString(),
          name: user.full_name || user.username,
        }));
      } else if (response.data?.results) {
        return response.data.results.map((user: User) => ({
          id: user.id.toString(),
          name: user.full_name || user.username,
        }));
      }

      return response.data;
    },
    enabled,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
};

// Utility function to format options for select components
export const formatSearchableOptions = (data: BaseResource[] = []) => {
  return data.map((item) => ({
    value: item.id,
    label: item.name,
  }));
};
