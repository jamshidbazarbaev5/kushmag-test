import { useQuery } from "@tanstack/react-query";
import api from "./api";

export interface StaffMember {
  id: string;
  accountId: string;
  name: string;
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  phone_number: string;
  role: string;
}

export const useGetSellers = () => {
  return useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>("/sellers");
      return data;
    },
  });
};

export const useGetOperators = () => {
  return useQuery({
    queryKey: ["operators"],
    queryFn: async () => {
      const { data } = await api.get<StaffMember[]>("/operators");
      return data;
    },
  });
};

export const useGetZamershiks = () => {
  return useQuery({
    queryKey: ["zamershiks"],
    queryFn: async () => {
      const params = {
        role: "ZAMERSHIK",
        search: "", // Include empty search to show all results
      };

      const response = await api.get("/users/", { params });

      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        return response.data.map((user: User) => ({
          id: user.id.toString(),
          accountId: user.id.toString(),
          name: user.full_name || user.username,
          meta: {
            href: "",
            type: "employee",
            mediaType: "application/json",
          },
        }));
      } else if (response.data?.results) {
        return response.data.results.map((user: User) => ({
          id: user.id.toString(),
          accountId: user.id.toString(),
          name: user.full_name || user.username,
          meta: {
            href: "",
            type: "employee",
            mediaType: "application/json",
          },
        }));
      }

      return response.data;
    },
  });
};
