import { useQuery } from "@tanstack/react-query";
import { createResourceApiHooks } from "../helpers/createResourceApi";
import api from "./api";

export interface User {
  id?: number;
  username: string;
  password?: string;
  full_name: string;
  phone_number: string;
  role:
    | "ADMIN"
    | "PRODAVEC"
    | "ZAMERSHIK"
    | "OPERATOR"
    | "SOTRUDNIK"
    | "MANUFACTURE";
  api_login?: string;
  api_password?: string;
  fixed_salary?: number;
  order_percentage?: number;
  date_joined?: string;
  moy_sklad_staff?: {
    meta: {
      href: string;
      type: string;
      mediaType: string;
    };
  };
  staff_member?: any;
}

interface PaginatedUsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

const USER_URL = "users/";

export const {
  useGetResources: useGetUsers,
  useGetResource: useGetUser,
  useCreateResource: useCreateUser,
  useUpdateResource: useUpdateUser,
  useDeleteResource: useDeleteUser,
} = createResourceApiHooks<User>(USER_URL, "users");

// Searchable hook for users
export const useSearchableUsers = (search: string = "") => {
  return useGetUsers({ search });
};

// Hook to fetch all users across all pages
export const useGetAllUsers = (options?: { search?: string }) => {
  return useQuery({
    queryKey: ["users", "all", options?.search],
    queryFn: async (): Promise<User[]> => {
      const allUsers: User[] = [];
      let nextUrl: string | null = `${USER_URL}`;

      // Add search parameter if provided
      if (options?.search) {
        nextUrl += `?search=${encodeURIComponent(options.search)}`;
      }

      while (nextUrl) {
        const response = await api.get<PaginatedUsersResponse>(nextUrl);
        const data: PaginatedUsersResponse = response.data;

        allUsers.push(...data.results);

        // Extract the next page URL
        nextUrl = data.next;

        // If next URL is relative, make it relative to the base URL
        if (nextUrl && nextUrl.startsWith('/api/')) {
          nextUrl = nextUrl.replace('/api/', '');
        }
      }

      return allUsers;
    },
  });
};
