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
}

export interface SyncLogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SyncLog[];
}

// Sync all data
export const useSyncAll = () => {
  return useMutation<SyncResponse, Error>({
    mutationFn: async (): Promise<SyncResponse> => {
      const response = await api.post("/sync-all/");
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
