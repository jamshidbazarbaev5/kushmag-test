import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import SearchableSelect from "@/components/ui/searchable-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useGetOrders, useUpdateOrder, useDeleteOrder } from "../api/order";
import type { Order } from "../api/order";
import {
  useSearchableProjects,
  useSearchableStores,
  useSearchableOrganizations,
  useSearchableSalesChannels,
  useSearchableSellers,
  useSearchableOperators,
  useSearchableCounterparties,
} from "../api/references";
import { useSearchableUsers } from "../api/user";
import { useSearchZamershiks } from "../hooks/useSearchableResources";
import {
  Pencil,
  Trash,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Eye,
  Plus,
  Info,
} from "lucide-react";
import api from "../api/api";

import { useAuth } from "../context/AuthContext";

// Utility function to make status-based API requests
export const getOrdersByStatus = async (
  statusId: number,
  additionalParams?: Record<string, any>,
) => {
  try {
    const params = {
      status: statusId,
      ...additionalParams,
    };
    const response = await api.get("orders/", { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders with status ${statusId}:`, error);
    throw error;
  }
};

// Utility function to get all available statuses
export const getAllStatuses = async () => {
  try {
    const response = await api.get("statuses/");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.results || [];
  } catch (error) {
    console.error("Error fetching statuses:", error);
    throw error;
  }
};

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeStatusTab, setActiveStatusTab] = useState(
    currentUser?.role === "MANUFACTURE" ? "moy_sklad" : "all",
  );
  const [counterpartSearchQuery, setCounterpartSearchQuery] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [showStatusChangeDropdown, setShowStatusChangeDropdown] = useState<
    string | null
  >(null);
  const statusChangeDropdownRef = useRef<HTMLDivElement>(null);

  // Search states for all selects
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [organizationSearchQuery, setOrganizationSearchQuery] = useState("");
  const [salesChannelSearchQuery, setSalesChannelSearchQuery] = useState("");
  const [sellerSearchQuery, setSellerSearchQuery] = useState("");
  const [operatorSearchQuery, setOperatorSearchQuery] = useState("");
  const [zamershikSearchQuery, setZamershikSearchQuery] = useState("");
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  const [filters, setFilters] = useState({
    project: "",
    store: "",
    agent: "",
    organization: "",
    salesChannel: "",
    seller: "",
    operator: "",
    order_status: "",
    created_at_after: "",
    created_at_before: "",
    deadline_date_after: "",
    deadline_date_before: "",
    zamershik: "",
    admin: "",
  });

  // Column visibility state with localStorage persistence
  const [showColumnsDialog, setShowColumnsDialog] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const savedColumns = localStorage.getItem("ordersColumnVisibility");
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        // Override price columns for MANUFACTURE role
        if (currentUser?.role === "MANUFACTURE") {
          return {
            ...parsed,
            advance_payment: false,
            discount_amount: false,
            remaining_balance: false,
            total_amount: false,
            agreement_amount: false,
            discount_percentage: false,
          };
        }
        return parsed;
      } catch {
        // If parsing fails, fall back to default
      }
    }
    const defaultColumns = {
      number: true,
      order_status: true,
      moy_sklad_id: true,
      client_name: false,
      client_phone: false,
      created_at: true,
      deadline_date: true,
      counterparty: true,
      organization: true,
      address: false,
      advance_payment: true,
      discount_amount: true,
      remaining_balance: true,
      total_amount: false,
      project: true,
      store: true,
      description: true,
      seller: true,
      zamershik: true,
      admin: true,
      operator: true,
      sales_channel: false,
      discount_percentage: false,
      agreement_amount: false,
      measure_date: false,
      status: true,
      actions: true,
      order_code: true,
    };

    // Hide price columns for MANUFACTURE role
    if (currentUser?.role === "MANUFACTURE") {
      return {
        ...defaultColumns,
        advance_payment: false,
        discount_amount: false,
        remaining_balance: false,
        total_amount: false,
        agreement_amount: false,
        discount_percentage: false,
      };
    }

    return defaultColumns;
  });

  const statusTabs = [
    { key: "all", label: t("common.all") },
    { key: "draft", label: t("order_status.draft") },
    { key: "moy_sklad", label: t("order_status.moy_sklad") },
    { key: "cancelled", label: t("order_status.cancelled") },
  ];

  // Fetch statuses from API
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await api.get("statuses/");
        // Handle both array and paginated response formats
        const statusData = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];
        setStatuses(statusData);
      } catch (error) {
        console.error("Error fetching statuses:", error);
        // Set empty array on error to prevent loading indefinitely
        setStatuses([]);
      }
    };
    fetchStatuses();
  }, []);

  // Function to render status badge
  const renderStatusBadge = (statusObject: any) => {
    if (!statusObject || typeof statusObject !== "object") {
      return <span className="text-gray-500">-</span>;
    }

    // Ensure we have the required properties
    const bgColor = statusObject.bg_color || "#gray-400";
    const textColor = statusObject.text_color || "#ffffff";
    const statusText = statusObject.status || "Unknown";

    return (
      <span
        className="px-2 py-1 rounded-full text-xs font-medium inline-block shadow-sm border"
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: bgColor,
        }}
      >
        {statusText}
      </span>
    );
  };

  // Function to handle status change
  const handleStatusChange = async (orderId: string, newStatusId: number) => {
    try {
      await api.post(`orders/${orderId}/change-status/`, {
        status: newStatusId,
      });

      toast.success(
        t("messages.status_changed_successfully") ||
          "Status changed successfully",
      );
      setShowStatusChangeDropdown(null);
      // Refresh the orders data
      refetchOrders();
    } catch (error: any) {
      console.error("Error changing status:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        t("messages.error.change_status") ||
        "Error changing status";
      toast.error(errorMessage);
    }
  };

  const handleColumnVisibilityChange = (column: string, checked: boolean) => {
    // Prevent MANUFACTURE role from showing price columns
    if (
      currentUser?.role === "MANUFACTURE" &&
      [
        "advance_payment",
        "discount_amount",
        "remaining_balance",
        "total_amount",
        "agreement_amount",
        "discount_percentage",
      ].includes(column)
    ) {
      return;
    }

    const newColumns = {
      ...visibleColumns,
      [column]: checked,
    };
    setVisibleColumns(newColumns);
    localStorage.setItem("ordersColumnVisibility", JSON.stringify(newColumns));
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenActionMenu(null);
      }

      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
      if (
        statusChangeDropdownRef.current &&
        !statusChangeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusChangeDropdown(null);
      }
    };

    if (openActionMenu || showStatusDropdown || showStatusChangeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionMenu, showStatusDropdown, showStatusChangeDropdown]);

  const formatToTruncate = (text: string, length: number = 10): string => {
    return text?.length > length ? `${text.substring(0, length)}...` : text;
  };

  // Fetch filter options with search capabilities
  const { data: projects, isLoading: projectsLoading } =
    useSearchableProjects(projectSearchQuery);
  const { data: stores, isLoading: storesLoading } =
    useSearchableStores(storeSearchQuery);
  // const { data: agents } = useGetCounterparties();
  const { data: organizations, isLoading: organizationsLoading } =
    useSearchableOrganizations(organizationSearchQuery);
  const { data: salesChannels, isLoading: salesChannelsLoading } =
    useSearchableSalesChannels(salesChannelSearchQuery);
  const { data: sellers, isLoading: sellersLoading } =
    useSearchableSellers(sellerSearchQuery);
  const { data: operators, isLoading: operatorsLoading } =
    useSearchableOperators(operatorSearchQuery);
  const { data: zamershikUsers, isLoading: zamershikUsersLoading } =
    useSearchZamershiks({ search: zamershikSearchQuery });
  const { data: adminUsers, isLoading: adminUsersLoading } =
    useSearchableUsers(adminSearchQuery);
  const { data: counterparties, isLoading: counterpartiesLoading } =
    useSearchableCounterparties(counterpartSearchQuery);

  // Build query params for API call
  const buildQueryParams = () => {
    const params: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });

    // For MANUFACTURE role, always filter to moy_sklad status only
    if (currentUser?.role === "MANUFACTURE") {
      params.order_status = "moy_sklad";
    } else {
      // Add status filter based on active tab for other roles
      if (activeStatusTab !== "all") {
        // Check if activeStatusTab is a numeric status ID
        if (!isNaN(Number(activeStatusTab))) {
          params.status = Number(activeStatusTab);
        } else {
          // Fallback to old behavior for string-based status
          params.order_status = activeStatusTab;
        }
      }
    }

    params.page = currentPage;
    params.page_size = pageSize;
    return params;
  };

  const {
    data: orders,
    isLoading,
    isFetching,
    refetch: refetchOrders,
  } = useGetOrders({ params: buildQueryParams() });

  // Debug logging
  console.log("Current page:", currentPage);
  console.log("Query params:", buildQueryParams());
  console.log("Active status tab:", activeStatusTab);
  console.log("Orders data:", orders);
  console.log("Is loading:", isLoading, "Is fetching:", isFetching);
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder();

  const ordersData = Array.isArray(orders) ? orders : orders?.results || [];
  const totalCount =
    !Array.isArray(orders) && orders?.count ? orders.count : ordersData.length;
  const itemsPerPage = pageSize;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasNextPage = !Array.isArray(orders) && orders?.next !== null;
  const hasPreviousPage = !Array.isArray(orders) && orders?.previous !== null;

  // Debug logging for pagination
  console.log("Orders data length:", ordersData.length);
  console.log("Total count:", totalCount);
  console.log("Total pages:", totalPages);
  console.log("Has next page:", hasNextPage);
  console.log("Has previous page:", hasPreviousPage);

  // Extract totals data from API response
  const overallTotals = !Array.isArray(orders) ? orders?.overall_totals : null;
  const pageTotals = !Array.isArray(orders) ? orders?.page_totals : null;

  const handleFilterChange = (key: string, value: string) => {
    const apiValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: apiValue }));
    setCurrentPage(1);
  };

  const handleStatusTabChange = (status: string) => {
    // MANUFACTURE role can only view moy_sklad status
    if (currentUser?.role === "MANUFACTURE" && status !== "moy_sklad") {
      return;
    }
    setActiveStatusTab(status);
    setCurrentPage(1);
  };

  const handleCounterpartSelect = (value: string | number) => {
    setFilters((prev) => ({ ...prev, agent: String(value) }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      project: "",
      store: "",
      agent: "",
      organization: "",
      salesChannel: "",
      seller: "",
      operator: "",
      order_status: "",
      created_at_after: "",
      created_at_before: "",
      deadline_date_after: "",
      deadline_date_before: "",
      zamershik: "",
      admin: "",
    });
    setActiveStatusTab(
      currentUser?.role === "MANUFACTURE" ? "moy_sklad" : "all",
    );
    setCounterpartSearchQuery("");
    setProjectSearchQuery("");
    setStoreSearchQuery("");
    setOrganizationSearchQuery("");
    setSalesChannelSearchQuery("");
    setSellerSearchQuery("");
    setOperatorSearchQuery("");
    setZamershikSearchQuery("");
    setAdminSearchQuery("");
    setCurrentPage(1);
  };

  // Get filtered users based on role
  const filteredZamershikUsers = Array.isArray(zamershikUsers)
    ? zamershikUsers
    : [];

  const filteredAdminUsers =
    !Array.isArray(adminUsers) && adminUsers?.results
      ? adminUsers.results.filter((user: any) => user.role === "ADMIN")
      : Array.isArray(adminUsers)
        ? adminUsers.filter((user: any) => user.role === "ADMIN")
        : [];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  const handleDeleteClick = (order: Order) => {
    if (!order.id) return;

    if (window.confirm(t("messages.confirm.delete"))) {
      deleteOrder(order.id, {
        onSuccess: () => {
          toast.success(t("messages.order_deleted_successfully"));
        },
        onError: () => {
          toast.error(
            t("messages.error.delete", { item: t("navigation.orders") }),
          );
        },
      });
    }
  };

  const handleUpdateSubmit = async (data: any) => {
    if (!editingOrder?.id) return;

    const orderData = {
      ...editingOrder,
      ...data,
    };

    updateOrder(orderData, {
      onSuccess: () => {
        toast.success(t("messages.order_updated_successfully"));
        setIsEditDialogOpen(false);
        setEditingOrder(null);
      },
      onError: () => {
        toast.error(t("messages.error_updating_order"));
      },
    });
  };

  const handleExportOrder = async (order: Order) => {
    if (!order.id) return;

    try {
      const response = await api.get(`/orders/${order.id}/export/`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order_${order.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting order:", error);
      toast.error("Failed to export order");
    }
  };

  const handleRowClick = (order: Order) => {
    navigate(`/orders/edit/${order.id}`);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("pages.orders")}</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-md">
            {[20, 50, 100].map((size) => (
              <Button
                key={size}
                variant={pageSize === size ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 h-8"
              >
                {size}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("common.filters")}
          </Button>

          <Button variant="outline" onClick={() => setShowColumnsDialog(true)}>
            <Eye className="h-4 w-4 mr-2" />
            {t("common.show_columns")}
          </Button>

          <div className="relative" ref={statusDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <Info className="h-4 w-4 mr-2" />
              {t("common.status_legend") || "Status Legend"}
            </Button>

            {showStatusDropdown && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Status Colors
                  </div>
                  <div className="space-y-2">
                    {/* Clear Filter Option */}
                    <div
                      className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer border-b border-gray-100 pb-2 mb-2"
                      onClick={() => {
                        setActiveStatusTab("all");
                        setCurrentPage(1);
                        setShowStatusDropdown(false);
                      }}
                    >
                      <span className="px-2 py-1 rounded text-xs font-medium flex-1 text-center bg-gray-100 text-gray-700">
                        Очистить фильтры
                      </span>
                    </div>

                    {statuses.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-2">
                        Loading...
                      </div>
                    ) : (
                      statuses.map((status) => (
                        <div
                          key={status.id}
                          className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer"
                          onClick={() => {
                            setActiveStatusTab(status.id.toString());
                            setCurrentPage(1);
                            setShowStatusDropdown(false);
                          }}
                        >
                          <span
                            className="px-2 py-1 rounded text-xs font-medium flex-1 text-center"
                            style={{
                              backgroundColor: status.bg_color,
                              color: status.text_color,
                            }}
                          >
                            {status.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {currentUser?.role !== "MANUFACTURE" && (
            <Button onClick={() => navigate("/orders/create")}>
              <Plus className="h-4 w-4 mr-2" />
              {t("common.create")}
            </Button>
          )}
        </div>
      </div>

      {/* Status Tabs - Hidden for MANUFACTURE role */}
      {currentUser?.role !== "MANUFACTURE" && (
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusTabChange(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeStatusTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Show active status filter if numeric ID is selected */}
          {!isNaN(Number(activeStatusTab)) && activeStatusTab !== "all" && (
            <div className="flex items-center ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
              <span>
                {statuses.find((s) => s.id.toString() === activeStatusTab)
                  ?.status || `Status ${activeStatusTab}`}
              </span>
              <button
                onClick={() => setActiveStatusTab("all")}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status indicator for MANUFACTURE role */}
      {currentUser?.role === "MANUFACTURE" && (
        <div className="flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">
            {t("order_status.moy_sklad")} {t("common.orders") || "Orders"}
          </span>
        </div>
      )}

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>{t("common.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* Counterpart Search Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.counterparty")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(counterparties)
                    ? counterparties
                    : counterparties?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.agent || "all"}
                  onValueChange={handleCounterpartSelect}
                  placeholder={t("forms.search_counterparty")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={counterpartiesLoading}
                  searchQuery={counterpartSearchQuery}
                  onSearchQueryChange={setCounterpartSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Project Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.project")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(projects)
                    ? projects
                    : projects?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.project || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("project", String(value))
                  }
                  placeholder={t("forms.select_project")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={projectsLoading}
                  searchQuery={projectSearchQuery}
                  onSearchQueryChange={setProjectSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Store Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.store")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(stores)
                    ? stores
                    : stores?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.store || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("store", String(value))
                  }
                  placeholder={t("forms.select_store")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={storesLoading}
                  searchQuery={storeSearchQuery}
                  onSearchQueryChange={setStoreSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Organization Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.organization")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(organizations)
                    ? organizations
                    : organizations?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.organization || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("organization", String(value))
                  }
                  placeholder={t("forms.select_organization")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={organizationsLoading}
                  searchQuery={organizationSearchQuery}
                  onSearchQueryChange={setOrganizationSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Sales Channel Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.sales_channel")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(salesChannels)
                    ? salesChannels
                    : salesChannels?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.salesChannel || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("salesChannel", String(value))
                  }
                  placeholder={t("forms.select_sales_channel")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={salesChannelsLoading}
                  searchQuery={salesChannelSearchQuery}
                  onSearchQueryChange={setSalesChannelSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Seller Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.seller")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(sellers)
                    ? sellers
                    : sellers?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.seller || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("seller", String(value))
                  }
                  placeholder={t("forms.select_seller")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={sellersLoading}
                  searchQuery={sellerSearchQuery}
                  onSearchQueryChange={setSellerSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Operator Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.operator")}
                </label>
                <SearchableSelect
                  options={(Array.isArray(operators)
                    ? operators
                    : operators?.results || []
                  ).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                  }))}
                  value={filters.operator || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("operator", String(value))
                  }
                  placeholder={t("forms.select_operator")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={operatorsLoading}
                  searchQuery={operatorSearchQuery}
                  onSearchQueryChange={setOperatorSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                />
              </div>

              {/* Zamershik Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.zamershik")}
                </label>
                <SearchableSelect
                  options={filteredZamershikUsers.map(
                    (user: { id: number; name: string }) => ({
                      id: user.id,
                      name: user.name,
                    }),
                  )}
                  value={filters.zamershik || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("zamershik", String(value))
                  }
                  placeholder={t("forms.select_zamershik")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={zamershikUsersLoading}
                  searchQuery={zamershikSearchQuery}
                  onSearchQueryChange={setZamershikSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                  displayKey="name"
                />
              </div>

              {/* Admin Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.admin")}
                </label>
                <SearchableSelect
                  options={filteredAdminUsers.map((user: any) => ({
                    id: user.id,
                    name: user.full_name,
                  }))}
                  value={filters.admin || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("admin", String(value))
                  }
                  placeholder={t("forms.select_admin")}
                  searchPlaceholder={t("common.search")}
                  allOptionLabel={t("common.all")}
                  showAllOption={true}
                  isLoading={adminUsersLoading}
                  searchQuery={adminSearchQuery}
                  onSearchQueryChange={setAdminSearchQuery}
                  className="min-w-[200px]"
                  emptyMessage={t("common.no_results_found")}
                  displayKey="name"
                />
              </div>

              {/* Order Date After */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.order_date_after")}
                </label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.created_at_after}
                  onChange={(e) =>
                    handleFilterChange("created_at_after", e.target.value)
                  }
                />
              </div>

              {/* Order Date Before */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.order_date_before")}
                </label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.created_at_before}
                  onChange={(e) =>
                    handleFilterChange("created_at_before", e.target.value)
                  }
                />
              </div>

              {/* Deadline Date After */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.deadline_date_after")}
                </label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.deadline_date_after}
                  onChange={(e) =>
                    handleFilterChange("deadline_date_after", e.target.value)
                  }
                />
              </div>

              {/* Deadline Date Before */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.deadline_date_before")}
                </label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.deadline_date_before}
                  onChange={(e) =>
                    handleFilterChange("deadline_date_before", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                {t("common.clear_filters")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto shadow-sm rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              {visibleColumns.number && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                  №
                </th>
              )}
              {visibleColumns.order_status && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.order_status")}
                </th>
              )}
              {visibleColumns.status && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  <div className="flex items-center gap-1">
                    {t("forms.status")}
                    <button
                      onClick={() => setShowStatusDropdown(true)}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Show status legend"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              )}
              {visibleColumns.moy_sklad_id && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.moy_sklad_id")}
                </th>
              )}
              {visibleColumns.order_code && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.order_code")}
                </th>
              )}
              {visibleColumns.client_name && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.client_name")}
                </th>
              )}
              {visibleColumns.client_phone && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.client_phone")}
                </th>
              )}
              {visibleColumns.created_at && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.created_at")}
                </th>
              )}
              {visibleColumns.deadline_date && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.deadline")}
                </th>
              )}
              {visibleColumns.counterparty && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  {t("forms.counterparty")}
                </th>
              )}
              {visibleColumns.organization && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  {t("forms.organization")}
                </th>
              )}
              {visibleColumns.address && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  {t("forms.address")}
                </th>
              )}
              {visibleColumns.total_amount && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  {t("forms.total_amount")}
                </th>
              )}
              {visibleColumns.advance_payment && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  {t("forms.advance_payment")}
                </th>
              )}
              {visibleColumns.discount_amount && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  {t("forms.discount_amount")}
                </th>
              )}
              {visibleColumns.discount_percentage && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  {t("forms.discount_percentage")}
                </th>
              )}
              {visibleColumns.agreement_amount && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  {t("forms.agreement_amount")}
                </th>
              )}
              {visibleColumns.remaining_balance && (
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  {t("forms.remaining_balance")}
                </th>
              )}
              {visibleColumns.project && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.project")}
                </th>
              )}
              {visibleColumns.store && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.store")}
                </th>
              )}
              {visibleColumns.sales_channel && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.sales_channel")}
                </th>
              )}
              {visibleColumns.description && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  {t("forms.description")}
                </th>
              )}
              {visibleColumns.seller && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.seller")}
                </th>
              )}
              {visibleColumns.zamershik && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.zamershik")}
                </th>
              )}
              {visibleColumns.admin && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.admin")}
                </th>
              )}
              {visibleColumns.operator && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.operator")}
                </th>
              )}
              {visibleColumns.measure_date && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.measure_date")}
                </th>
              )}
              {visibleColumns.actions && (
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                  {t("common.actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading || isFetching ? (
              <tr>
                <td
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2">{t("common.loading")}</span>
                  </div>
                </td>
              </tr>
            ) : ordersData.length === 0 ? (
              <tr>
                <td
                  colSpan={Object.values(visibleColumns).filter(Boolean).length}
                  className="px-3 py-8 text-center text-gray-500"
                >
                  {t("common.no_data")}
                </td>
              </tr>
            ) : (
              ordersData.map((order: any, index: number) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleRowClick(order)}
                >
                  {visibleColumns.number && (
                    <td className="px-3 py-2 text-center text-sm font-medium text-gray-700">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                  )}
                  {visibleColumns.order_status && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div
                        className="truncate"
                        title={formatDate(order.status)}
                      >
                        {order.order_status
                          ? t(`order_status.${order.order_status}`)
                          : "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.status && (
                    <td className="px-3 py-2">
                      <div
                        className="relative"
                        ref={
                          showStatusChangeDropdown === order.id
                            ? statusChangeDropdownRef
                            : null
                        }
                      >
                        <div
                          className={`flex items-center justify-start ${
                            currentUser?.role !== "MANUFACTURE"
                              ? "cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200 group"
                              : "cursor-default"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (currentUser?.role !== "MANUFACTURE") {
                              setShowStatusChangeDropdown(
                                showStatusChangeDropdown === order.id
                                  ? null
                                  : order.id,
                              );
                            }
                          }}
                          title={
                            currentUser?.role !== "MANUFACTURE"
                              ? "Click to change status"
                              : "Status (read-only)"
                          }
                        >
                          {renderStatusBadge(order.status)}
                          {currentUser?.role !== "MANUFACTURE" && (
                            <span className="ml-1 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              ✏️
                            </span>
                          )}
                        </div>

                        {showStatusChangeDropdown === order.id &&
                          currentUser?.role !== "MANUFACTURE" && (
                            <div
                              className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-3">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                  {/*Change Status*/}
                                </div>
                                <div className="space-y-2">
                                  {statuses.length === 0 ? (
                                    <div className="text-xs text-gray-500 text-center py-2">
                                      Loading...
                                    </div>
                                  ) : (
                                    statuses.map((status) => {
                                      const isCurrent =
                                        order.status?.id === status.id;
                                      return (
                                        <div
                                          key={status.id}
                                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                            isCurrent
                                              ? "bg-gray-100 opacity-50 cursor-not-allowed"
                                              : "hover:bg-gray-50"
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isCurrent) {
                                              handleStatusChange(
                                                order.id,
                                                status.id,
                                              );
                                            }
                                          }}
                                        >
                                          <span
                                            className="px-2 py-1 rounded text-xs font-medium flex-1 text-center"
                                            style={{
                                              backgroundColor: status.bg_color,
                                              color: status.text_color,
                                            }}
                                          >
                                            {status.status}
                                          </span>
                                          {isCurrent && (
                                            <span className="text-xs text-gray-500 font-medium">
                                              {t("forms.current")}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </td>
                  )}
                  {visibleColumns.moy_sklad_id && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div className="truncate" title={order.name}>
                        {order.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.order_code && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div className="truncate" title={order.order_cde}>
                        {order.order_code || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.client_name && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div className="truncate" title={order.client_name}>
                        {order.client_name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.client_phone && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div className="truncate" title={order.client_phone}>
                        {order.client_phone || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.created_at && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div
                        className="truncate"
                        title={formatDate(order.created_at)}
                      >
                        {formatDate(order.created_at)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.deadline_date && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div
                        className="truncate"
                        title={formatDate(order.deadline_date)}
                      >
                        {formatDate(order.deadline_date)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.counterparty && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate font-medium text-gray-900"
                        title={order.agent?.name}
                      >
                        {order.agent?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.organization && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.organization?.name}
                      >
                        {order.organization?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.address && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.address}
                      >
                        {order.address || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.total_amount && (
                    <td className="px-3 py-2 text-right text-sm font-semibold text-green-700">
                      {order.total_amount
                        ? Number(order.total_amount).toLocaleString()
                        : "0"}
                    </td>
                  )}
                  {visibleColumns.advance_payment && (
                    <td className="px-3 py-2 text-right text-sm text-blue-600">
                      {order.advance_payment
                        ? Number(order.advance_payment).toLocaleString()
                        : "0"}
                    </td>
                  )}
                  {visibleColumns.discount_amount && (
                    <td className="px-3 py-2 text-right text-sm text-orange-600">
                      {order.discount_amount
                        ? Number(order.discount_amount).toLocaleString()
                        : "0"}
                    </td>
                  )}
                  {visibleColumns.discount_percentage && (
                    <td className="px-3 py-2 text-right text-sm text-purple-600">
                      {order.discount_percentage
                        ? `${order.discount_percentage}%`
                        : "0%"}
                    </td>
                  )}
                  {visibleColumns.agreement_amount && (
                    <td className="px-3 py-2 text-right text-sm text-indigo-600">
                      {order.agreement_amount
                        ? Number(order.agreement_amount).toLocaleString()
                        : "0"}
                    </td>
                  )}
                  {visibleColumns.remaining_balance && (
                    <td className="px-3 py-2 text-right text-sm font-medium text-red-700">
                      {order.remaining_balance
                        ? Number(order.remaining_balance).toLocaleString()
                        : "0"}
                    </td>
                  )}
                  {visibleColumns.project && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.project?.name}
                      >
                        {order.project?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.store && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.store?.name}
                      >
                        {order.store?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.sales_channel && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.salesChannel?.name}
                      >
                        {order.salesChannel?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.description && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-600"
                        title={order?.description}
                      >
                        {formatToTruncate(order?.description)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.seller && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.seller?.name}
                      >
                        {order.seller?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.zamershik && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.zamershik?.full_name}
                      >
                        {order.zamershik?.full_name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.admin && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.admin?.full_name}
                      >
                        {order.admin?.full_name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.operator && (
                    <td className="px-3 py-2 text-sm">
                      <div
                        className="truncate text-gray-700"
                        title={order.operator?.name}
                      >
                        {order.operator?.name || "-"}
                      </div>
                    </td>
                  )}
                  {visibleColumns.measure_date && (
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <div
                        className="truncate"
                        title={formatDate(order.measure_date)}
                      >
                        {formatDate(order.measure_date)}
                      </div>
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td
                      className="px-3 py-2 relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() =>
                            setOpenActionMenu(
                              openActionMenu === order.id ? null : order.id,
                            )
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {openActionMenu === order.id && (
                          <div
                            ref={menuRef}
                            className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-36"
                          >
                            <div className="py-1">
                              <button
                                className="flex items-center justify-start w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  navigate(`/orders/edit/${order.id}`);
                                  setOpenActionMenu(null);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                {t("common.edit")}
                              </button>
                              <button
                                className="flex items-center justify-start w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  handleExportOrder(order);
                                  setOpenActionMenu(null);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {t("common.export")}
                              </button>

                              {currentUser?.role !== "MANUFACTURE" && (
                                <button
                                  className="flex items-center justify-start w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    handleDeleteClick(order);
                                    setOpenActionMenu(null);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  {t("common.delete")}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}

            {/* Page Totals Row */}
            {pageTotals && (
              <tr className="bg-gray-100 border-t border-gray-300">
                <td
                  className="px-3 py-2 text-sm font-semibold text-gray-700"
                  colSpan={visibleColumns.number ? 1 : 0}
                >
                  {visibleColumns.number && "На странице"}
                </td>
                {!visibleColumns.number && visibleColumns.order_status && (
                  <td className="px-3 py-2 text-sm font-semibold text-gray-700">
                    На странице
                  </td>
                )}
                {visibleColumns.order_status && visibleColumns.number && (
                  <td className="px-3 py-2"></td>
                )}
                {visibleColumns.status && <td className="px-3 py-2"></td>}
                {visibleColumns.moy_sklad_id && <td className="px-3 py-2"></td>}
                {visibleColumns.order_code && <td className="px-3 py-2"></td>}
                {visibleColumns.client_name && <td className="px-3 py-2"></td>}
                {visibleColumns.client_phone && <td className="px-3 py-2"></td>}
                {visibleColumns.created_at && <td className="px-3 py-2"></td>}
                {visibleColumns.deadline_date && (
                  <td className="px-3 py-2"></td>
                )}
                {visibleColumns.counterparty && <td className="px-3 py-2"></td>}
                {visibleColumns.organization && <td className="px-3 py-2"></td>}
                {visibleColumns.address && <td className="px-3 py-2"></td>}
                {visibleColumns.total_amount && (
                  <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                    {Number(
                      pageTotals.total_total_amount || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.advance_payment && (
                  <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                    {Number(
                      pageTotals.total_advance_payment || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.discount_amount && (
                  <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                    {Number(
                      pageTotals.total_discount_amount || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.discount_percentage && (
                  <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                    {Number(pageTotals.total_discount_percentage || 0).toFixed(
                      2,
                    )}
                    %
                  </td>
                )}
                {visibleColumns.agreement_amount && (
                  <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                    {Number(
                      pageTotals.total_agreement_amount || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.remaining_balance && (
                  <td className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                    {Number(
                      pageTotals.total_remaining_balance || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.project && <td className="px-3 py-2"></td>}
                {visibleColumns.store && <td className="px-3 py-2"></td>}
                {visibleColumns.sales_channel && (
                  <td className="px-3 py-2"></td>
                )}
                {visibleColumns.description && <td className="px-3 py-2"></td>}
                {visibleColumns.seller && <td className="px-3 py-2"></td>}
                {visibleColumns.zamershik && <td className="px-3 py-2"></td>}
                {visibleColumns.admin && <td className="px-3 py-2"></td>}
                {visibleColumns.operator && <td className="px-3 py-2"></td>}
                {visibleColumns.measure_date && <td className="px-3 py-2"></td>}
                {visibleColumns.actions && <td className="px-3 py-2"></td>}
              </tr>
            )}

            {/* Overall Totals Row */}
            {overallTotals && (
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td
                  className="px-3 py-2 text-sm font-bold text-blue-900"
                  colSpan={visibleColumns.number ? 1 : 0}
                >
                  {visibleColumns.number && "Общее"}
                </td>
                {!visibleColumns.number && visibleColumns.order_status && (
                  <td className="px-3 py-2 text-sm font-bold text-blue-900">
                    Общее
                  </td>
                )}
                {visibleColumns.order_status && visibleColumns.number && (
                  <td className="px-3 py-2"></td>
                )}
                {visibleColumns.status && <td className="px-3 py-2"></td>}
                {visibleColumns.moy_sklad_id && <td className="px-3 py-2"></td>}
                {visibleColumns.order_code && <td className="px-3 py-2"></td>}
                {visibleColumns.client_name && <td className="px-3 py-2"></td>}
                {visibleColumns.client_phone && <td className="px-3 py-2"></td>}
                {visibleColumns.created_at && <td className="px-3 py-2"></td>}
                {visibleColumns.deadline_date && (
                  <td className="px-3 py-2"></td>
                )}
                {visibleColumns.counterparty && <td className="px-3 py-2"></td>}
                {visibleColumns.organization && <td className="px-3 py-2"></td>}
                {visibleColumns.address && <td className="px-3 py-2"></td>}
                {visibleColumns.total_amount && (
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-900">
                    {Number(
                      overallTotals.total_total_amount || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.advance_payment && (
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-900">
                    {Number(
                      overallTotals.total_advance_payment || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.discount_amount && (
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-900">
                    {Number(
                      overallTotals.total_discount_amount || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.discount_percentage && (
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-900">
                    {Number(
                      overallTotals.total_discount_percentage || 0,
                    ).toFixed(2)}
                    %
                  </td>
                )}
                {visibleColumns.agreement_amount && (
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-900">
                    {Number(
                      overallTotals.total_agreement_amount || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.remaining_balance && (
                  <td className="px-3 py-2 text-right text-sm font-bold text-blue-900">
                    {Number(
                      overallTotals.total_remaining_balance || 0,
                    ).toLocaleString()}
                  </td>
                )}
                {visibleColumns.project && <td className="px-3 py-2"></td>}
                {visibleColumns.store && <td className="px-3 py-2"></td>}
                {visibleColumns.sales_channel && (
                  <td className="px-3 py-2"></td>
                )}
                {visibleColumns.description && <td className="px-3 py-2"></td>}
                {visibleColumns.seller && <td className="px-3 py-2"></td>}
                {visibleColumns.zamershik && <td className="px-3 py-2"></td>}
                {visibleColumns.admin && <td className="px-3 py-2"></td>}
                {visibleColumns.operator && <td className="px-3 py-2"></td>}
                {visibleColumns.measure_date && <td className="px-3 py-2"></td>}
                {visibleColumns.actions && <td className="px-3 py-2"></td>}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(totalCount > itemsPerPage || hasNextPage || hasPreviousPage) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t("pagination.page")} {currentPage}{" "}
            {totalPages > 0 && `${t("pagination.of")} ${totalPages}`}
            <span className="ml-2 text-gray-500">
              ({totalCount} {t("common.items")} {t("common.total")})
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(
                  "Previous page clicked, current page:",
                  currentPage,
                );
                setCurrentPage((prev) => Math.max(1, prev - 1));
              }}
              disabled={!hasPreviousPage && currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("pagination.previous")}
            </Button>

            {/* Show current page info */}
            <div className="flex items-center px-3 py-1 text-sm text-gray-600">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}-
              {Math.min(currentPage * itemsPerPage, totalCount)}{" "}
              {t("pagination.of")} {totalCount}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("Next page clicked, current page:", currentPage);
                setCurrentPage((prev) => prev + 1);
              }}
              disabled={!hasNextPage && currentPage >= totalPages}
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Column Visibility Dialog */}
      <Dialog open={showColumnsDialog} onOpenChange={setShowColumnsDialog}>
        <DialogContent>
          <div className="space-y-4">
            <h4 className="font-medium leading-none">
              {t("common.toggle_columns")}
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {Object.entries(visibleColumns).map(([key, value]) => {
                const isPriceColumn = [
                  "advance_payment",
                  "discount_amount",
                  "remaining_balance",
                  "total_amount",
                  "agreement_amount",
                  "discount_percentage",
                ].includes(key);
                const isDisabled =
                  currentUser?.role === "MANUFACTURE" && isPriceColumn;

                return (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={Boolean(value)}
                      disabled={isDisabled}
                      onChange={(e) =>
                        handleColumnVisibilityChange(key, e.target.checked)
                      }
                      className={`rounded border border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                    <label
                      htmlFor={key}
                      className={`text-sm font-medium leading-none ${
                        isDisabled
                          ? "cursor-not-allowed opacity-50 text-gray-400"
                          : "cursor-pointer"
                      }`}
                    >
                      {t(`forms.${key}`) ||
                        key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      {isDisabled && (
                        <span className="ml-1 text-xs text-gray-400">
                          (Hidden for MANUFACTURE)
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowColumnsDialog(false)}>
                {t("common.done")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <ResourceForm
            fields={[]}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingOrder || {}}
            isSubmitting={isUpdating}
            title={t("messages.edit")}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
