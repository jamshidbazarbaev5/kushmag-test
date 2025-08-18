import { useState, useCallback, useMemo } from "react";
import { SearchableSelect } from "./SearchableSelect";
import {
  useSearchMaterials,
  useSearchMaterialTypes,
  useSearchMassifs,
  useSearchColors,
  useSearchPatinaColors,
  useSearchBeadings,
  useSearchGlassTypes,
  useSearchStores,
  useSearchProjects,
  useSearchOrganizations,
  useSearchBranches,
  useSearchSalesChannels,
  useSearchSellers,
  useSearchOperators,
  useSearchCounterparties,
  useSearchZamershiks,
  formatSearchableOptions,
} from "../hooks/useSearchableResources";

interface SearchableResourceSelectProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  resourceType:
    | "materials"
    | "material-types"
    | "massifs"
    | "colors"
    | "patina-colors"
    | "beadings"
    | "glass-types"
    | "stores"
    | "projects"
    | "organizations"
    | "branches"
    | "sales-channels"
    | "sellers"
    | "operators"
    | "counterparties"
    | "zamershiks";
  disabled?: boolean;
  className?: string;
  allowReset?: boolean;
}

export function SearchableResourceSelect({
  value,
  onChange,
  placeholder,
  resourceType,
  disabled = false,
  className,
  allowReset = true,
}: SearchableResourceSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Debug logging
  console.log(`SearchableResourceSelect [${resourceType}]:`, {
    value,
    disabled,
    placeholder,
    searchTerm,
  });

  // Map resource types to their corresponding hooks
  const useResourceHook = useMemo(() => {
    switch (resourceType) {
      case "materials":
        return useSearchMaterials;
      case "material-types":
        return useSearchMaterialTypes;
      case "massifs":
        return useSearchMassifs;
      case "colors":
        return useSearchColors;
      case "patina-colors":
        return useSearchPatinaColors;
      case "beadings":
        return useSearchBeadings;
      case "glass-types":
        return useSearchGlassTypes;
      case "stores":
        return useSearchStores;
      case "projects":
        return useSearchProjects;
      case "organizations":
        return useSearchOrganizations;
      case "branches":
        return useSearchBranches;
      case "sales-channels":
        return useSearchSalesChannels;
      case "sellers":
        return useSearchSellers;
      case "operators":
        return useSearchOperators;
      case "counterparties":
        return useSearchCounterparties;
      case "zamershiks":
        return useSearchZamershiks;
      default:
        return useSearchMaterials;
    }
  }, [resourceType]);

  // Fetch data using the appropriate hook
  const { data, isLoading, error } = useResourceHook({
    search: searchTerm,
    enabled: true,
  });

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

  // Format options for the select component
  const options = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.log(
        `SearchableResourceSelect [${resourceType}] - No data:`,
        data,
      );
      return [];
    }
    const formattedOptions = formatSearchableOptions(data);
    console.log(
      `SearchableResourceSelect [${resourceType}] - Options:`,
      formattedOptions,
    );
    return formattedOptions;
  }, [data, resourceType]);

  // Handle errors
  if (error) {
    console.error(`Error loading ${resourceType}:`, error);
  }

  // Debug loading state
  console.log(
    `SearchableResourceSelect [${resourceType}] - Loading:`,
    isLoading,
  );

  return (
    <SearchableSelect
      value={value}
      onChange={(selectedValue) => {
        console.log(
          "SearchableResourceSelect - onChange called with:",
          selectedValue,
        );
        console.log("SearchableResourceSelect - Calling parent onChange");
        onChange(selectedValue);
        console.log("SearchableResourceSelect - Parent onChange completed");
      }}
      placeholder={placeholder}
      options={options}
      onSearch={handleSearch}
      isLoading={isLoading}
      disabled={disabled}
      className={className}
      allowReset={allowReset}
    />
  );
}
