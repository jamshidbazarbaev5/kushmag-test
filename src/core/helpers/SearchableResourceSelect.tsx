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
import { useGetMaterial } from "../api/material";
import { useGetMaterialType } from "../api/materialType";
import { useGetMassif } from "../api/massif";
import { useGetColor } from "../api/color";
import { useGetPatinaColor } from "../api/patinaColor";
import { useGetBeading } from "../api/beading";
import { useGetGlassType } from "../api/glassType";

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

  // Fetch individual items for supported resource types
  const hasValue = value !== null && value !== undefined && value !== "";

  const materialQuery = useGetMaterial(
    resourceType === "materials" && hasValue ? value : "",
  );

  const materialTypeQuery = useGetMaterialType(
    resourceType === "material-types" && hasValue ? value : "",
  );

  const massifQuery = useGetMassif(
    resourceType === "massifs" && hasValue ? value : "",
  );

  const colorQuery = useGetColor(
    resourceType === "colors" && hasValue ? value : "",
  );

  const patinaColorQuery = useGetPatinaColor(
    resourceType === "patina-colors" && hasValue ? value : "",
  );

  const beadingQuery = useGetBeading(
    resourceType === "beadings" && hasValue ? value : "",
  );

  const glassTypeQuery = useGetGlassType(
    resourceType === "glass-types" && hasValue ? value : "",
  );

  // Get the appropriate individual query result
  const getIndividualData = () => {
    switch (resourceType) {
      case "materials":
        return materialQuery.data;
      case "material-types":
        return materialTypeQuery.data;
      case "massifs":
        return massifQuery.data;
      case "colors":
        return colorQuery.data;
      case "patina-colors":
        return patinaColorQuery.data;
      case "beadings":
        return beadingQuery.data;
      case "glass-types":
        return glassTypeQuery.data;
      default:
        return null;
    }
  };

  const individualItemData = getIndividualData();

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
    let baseOptions: { value: string | number; label: string }[] = [];

    if (data && Array.isArray(data)) {
      baseOptions = formatSearchableOptions(data);
    }

    // Add individual item if it exists and isn't already in the list
    if (individualItemData && hasValue) {
      const individualOption = {
        value: individualItemData.id,
        label: individualItemData.name,
      };

      const existsInOptions = baseOptions.some(
        (opt) =>
          opt.value === individualOption.value ||
          opt.value?.toString() === individualOption.value?.toString(),
      );

      if (!existsInOptions) {
        baseOptions = [individualOption, ...baseOptions];
      }
    }

    console.log(
      `SearchableResourceSelect [${resourceType}] - Final Options:`,
      baseOptions,
    );

    return baseOptions;
  }, [data, resourceType, individualItemData, hasValue]);

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
