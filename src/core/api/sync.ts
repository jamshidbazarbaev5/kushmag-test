import { useMutation, useQuery } from "@tanstack/react-query";
import api from "./api";

// Types for sync functionality
export interface SyncResponse {
  status: string;
  message: string;
}

export interface SyncLog {
  id: number;
  sync_time: string;
  success: boolean;
  synced_models: string[];
  synced_models_translation: string[];
}

export interface SyncLogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SyncLog[];
}

export interface SyncAllRequest {
  models: string[];
}

// Available models with their translations
export const AVAILABLE_MODELS = {
  Product: "Товар",
  Agent: "Контрагент",
  UOM: "Единица измерения",
  Seller: "Продавец",
  Branch: "Филиал",
  Organization: "Организация",
  SalesChannel: "Канал продаж",
  Store: "Склад",
  Project: "Проект",
  Zamershik: "Замерщик",
  Operator: "Оператор",
  PriceType: "Тип цены",
} as const;

export type ModelKey = keyof typeof AVAILABLE_MODELS;

// Sync selected models
export const useSyncAll = () => {
  return useMutation<SyncResponse, Error, SyncAllRequest>({
    mutationFn: async (data: SyncAllRequest): Promise<SyncResponse> => {
      const response = await api.post("/sync-all/", data);
      return response.data;
    },
    onError: (error) => {
      console.error("Sync failed:", error);
    },
  });
};

// Get sync logs with pagination
export const useSyncLogs = (page: number = 1, pageSize: number = 20) => {
  return useQuery<SyncLogsResponse, Error>({
    queryKey: ["syncLogs", page, pageSize],
    queryFn: async (): Promise<SyncLogsResponse> => {
      const response = await api.get("/sync-logs/", {
        params: {
          page,
          page_size: pageSize,
        },
      });
      return response.data;
    },
  });
};
