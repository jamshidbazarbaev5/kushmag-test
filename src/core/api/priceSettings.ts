import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export interface PriceType {
  id: string;
  name: string;
  externalCode: string;
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
}

export interface PriceSetting {
  id?: number;
  product:
    | "door"
    | "extension"
    | "casing"
    | "crown"
    | "cube"
    | "leg"
    | "glass"
    | "lock"
    | "topsa"
    | "beading";
  price_type: string; // UUID from price types
}

export interface PriceSettingWithPriceType extends PriceSetting {
  price_type_name?: string;
}

// Product options with translations
export const PRODUCT_CHOICES = [
  { value: "door", label: "Дверь" },
  { value: "extension", label: "Добор" },
  { value: "casing", label: "Наличник" },
  { value: "crown", label: "Корона" },
  { value: "cube", label: "Кубик" },
  { value: "leg", label: "Ножка" },
  { value: "glass", label: "Стекло" },
  { value: "lock", label: "Замок" },
  { value: "topsa", label: "Топса" },
  { value: "beading", label: "Шпингалет" },
] as const;

// Price Types API hooks
export const useGetPriceTypes = () => {
  return useQuery({
    queryKey: ["priceTypes"],
    queryFn: async () => {
      const response = await api.get<PriceType[]>("price-types/");
      return response.data;
    },
  });
};

// Price Settings API hooks
export const useGetPriceSettings = (options?: {
  params?: Record<string, unknown>;
}) => {
  return useQuery({
    queryKey: ["priceSettings", options?.params],
    queryFn: async () => {
      const response = await api.get<PriceSettingWithPriceType[]>(
        "price-settings/",
        {
          params: options?.params,
        },
      );
      return response.data;
    },
  });
};

export const useGetPriceSetting = (id: string | number) => {
  return useQuery({
    queryKey: ["priceSettings", id],
    queryFn: async () => {
      const response = await api.get<PriceSettingWithPriceType>(
        `price-settings/${id}/`,
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreatePriceSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPriceSetting: Omit<PriceSetting, "id">) => {
      const response = await api.post<PriceSetting>(
        "price-settings/",
        newPriceSetting,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceSettings"] });
    },
  });
};

export const useUpdatePriceSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priceSetting: PriceSetting) => {
      if (!priceSetting.id)
        throw new Error("Price setting ID is required for update");

      const response = await api.put<PriceSetting>(
        `price-settings/${priceSetting.id}/`,
        priceSetting,
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["priceSettings"] });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ["priceSettings", data.id] });
      }
    },
  });
};

export const useDeletePriceSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(`price-settings/${id}/`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceSettings"] });
    },
  });
};
