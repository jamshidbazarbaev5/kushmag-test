import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useGetOrders, useUpdateOrder, useDeleteOrder } from "../api/order";
import type { Order } from "../api/order";
import {
  useGetProjects,
  useGetStores,
  // useGetCounterparties,
  useGetOrganizations,
  useGetSalesChannels,
  useGetSellers,
  useGetOperators,
} from "../api/references";
import { useGetUsers } from "../api/user";
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
  Search,
  Plus,
} from "lucide-react";
import api from "../api/api";

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeStatusTab, setActiveStatusTab] = useState("all");
  const [counterpartSearchQuery, setCounterpartSearchQuery] = useState("");
  const [counterpartSearchResults, setCounterpartSearchResults] = useState<
    any[]
  >([]);
  const [showCounterpartDropdown, setShowCounterpartDropdown] = useState(false);
  const [isCounterpartLoading, setIsCounterpartLoading] = useState(false);
  const counterpartDropdownRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    project: "",
    store: "",
    agent: "",
    organization: "",
    salesChannel: "",
    seller: "",
    operator: "",
    order_status: "",
    order_date_after: "",
    order_date_before: "",
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
        return JSON.parse(savedColumns);
      } catch {
        // If parsing fails, fall back to default
      }
    }
    return {
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
      actions: true,
    };
  });

  const statusTabs = [
    { key: "all", label: t("common.all") },
    { key: "draft", label: t("order_status.draft") },
    { key: "moy_sklad", label: t("order_status.moy_sklad") },
    { key: "cancelled", label: t("order_status.cancelled") },
  ];

  const handleColumnVisibilityChange = (column: string, checked: boolean) => {
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
        counterpartDropdownRef.current &&
        !counterpartDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCounterpartDropdown(false);
      }
    };

    if (openActionMenu || showCounterpartDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionMenu, showCounterpartDropdown]);

  // Counterpart search functionality
  useEffect(() => {
    const searchCounterparts = async () => {
      if (counterpartSearchQuery.length < 2) {
        setCounterpartSearchResults([]);
        return;
      }

      setIsCounterpartLoading(true);
      try {
        const res = await api.get(
          `counterparty/?search=${encodeURIComponent(counterpartSearchQuery)}`,
        );
        const results = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setCounterpartSearchResults(results);
      } catch (error) {
        console.error("Error searching counterparties:", error);
        setCounterpartSearchResults([]);
      } finally {
        setIsCounterpartLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchCounterparts, 300);
    return () => clearTimeout(debounceTimeout);
  }, [counterpartSearchQuery]);

  const formatToTruncate = (text: string, length: number = 10): string => {
    return text?.length > length ? `${text.substring(0, length)}...` : text;
  };

  // Fetch filter options
  const { data: projects } = useGetProjects();
  const { data: stores } = useGetStores();
  // const { data: agents } = useGetCounterparties();
  const { data: organizations } = useGetOrganizations();
  const { data: salesChannels } = useGetSalesChannels();
  const { data: sellers } = useGetSellers();
  const { data: operators } = useGetOperators();
  const { data: users } = useGetUsers();

  // Build query params for API call
  const buildQueryParams = () => {
    const params: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });

    // Add status filter based on active tab
    if (activeStatusTab !== "all") {
      params.order_status = activeStatusTab;
    }

    params.page = currentPage;
    return params;
  };

  const { data: orders } = useGetOrders({ params: buildQueryParams() });
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder();

  const ordersData = Array.isArray(orders) ? orders : orders?.results || [];
  const totalCount =
    !Array.isArray(orders) && orders?.count ? orders.count : ordersData.length;
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasNextPage = !Array.isArray(orders) && orders?.next !== null;
  const hasPreviousPage = !Array.isArray(orders) && orders?.previous !== null;

  const handleFilterChange = (key: string, value: string) => {
    const apiValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: apiValue }));
    setCurrentPage(1);
  };

  const handleStatusTabChange = (status: string) => {
    setActiveStatusTab(status);
    setCurrentPage(1);
  };

  const handleCounterpartSelect = (counterpart: any) => {
    setFilters((prev) => ({ ...prev, agent: counterpart.id }));
    setCounterpartSearchQuery(counterpart.name);
    setShowCounterpartDropdown(false);
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
      order_date_after: "",
      order_date_before: "",
      deadline_date_after: "",
      deadline_date_before: "",
      zamershik: "",
      admin: "",
    });
    setActiveStatusTab("all");
    setCounterpartSearchQuery("");
    setCurrentPage(1);
  };

  // Get filtered users based on role
  const zamershikUsers =
    !Array.isArray(users) && users?.results
      ? users.results.filter((user: any) => user.role === "ZAMERSHIK")
      : Array.isArray(users)
        ? users.filter((user: any) => user.role === "ZAMERSHIK")
        : [];

  const adminUsers =
    !Array.isArray(users) && users?.results
      ? users.results.filter((user: any) => user.role === "ADMIN")
      : Array.isArray(users)
        ? users.filter((user: any) => user.role === "ADMIN")
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

  const handleExportOrder = (order: Order) => {
    if (!order.id) return;

    const exportUrl = `https://kushmag.uz/api/orders/${order.id}/export/`;
    window.open(exportUrl, "_blank");
  };

  const handleRowClick = (order: Order) => {
    navigate(`/orders/edit/${order.id}`);
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("pages.orders")}</h1>
        <div className="flex gap-2">
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

          <Button onClick={() => navigate("/orders/create")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("common.create")}
          </Button>
        </div>
      </div>

      {/* Status Tabs */}
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
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>{t("common.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* Counterpart Search Filter */}
              <div className="space-y-1 relative" ref={counterpartDropdownRef}>
                <label className="text-sm font-medium">
                  {t("forms.counterparty")}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={counterpartSearchQuery}
                    onChange={(e) => {
                      setCounterpartSearchQuery(e.target.value);
                      setShowCounterpartDropdown(true);
                    }}
                    onFocus={() => setShowCounterpartDropdown(true)}
                    placeholder={t("forms.search_counterparty")}
                    className="h-9 min-w-[200px]"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />

                  {showCounterpartDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {isCounterpartLoading ? (
                        <div className="p-3 text-center text-gray-500">
                          {t("common.loading")}...
                        </div>
                      ) : counterpartSearchResults.length > 0 ? (
                        counterpartSearchResults.map((counterpart) => (
                          <div
                            key={counterpart.id}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCounterpartSelect(counterpart)}
                          >
                            <div className="font-medium">
                              {counterpart.name}
                            </div>
                            {counterpart.phone && (
                              <div className="text-xs text-gray-500 mt-1">
                                {counterpart.phone}
                              </div>
                            )}
                          </div>
                        ))
                      ) : counterpartSearchQuery.length >= 2 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {t("common.no_results_found")}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          {t("common.type_to_search")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.project")}
                </label>
                <Select
                  value={filters.project || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("project", value)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_project")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(projects)
                      ? projects
                      : projects?.results || []
                    ).map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Store Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.store")}
                </label>
                <Select
                  value={filters.store || "all"}
                  onValueChange={(value) => handleFilterChange("store", value)}
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_store")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(stores)
                      ? stores
                      : stores?.results || []
                    ).map((store: any) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.organization")}
                </label>
                <Select
                  value={filters.organization || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("organization", value)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_organization")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(organizations)
                      ? organizations
                      : organizations?.results || []
                    ).map((org: any) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sales Channel Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.sales_channel")}
                </label>
                <Select
                  value={filters.salesChannel || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("salesChannel", value)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue
                      placeholder={t("forms.select_sales_channel")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(salesChannels)
                      ? salesChannels
                      : salesChannels?.results || []
                    ).map((channel: any) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seller Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.seller")}
                </label>
                <Select
                  value={filters.seller || "all"}
                  onValueChange={(value) => handleFilterChange("seller", value)}
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_seller")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(sellers)
                      ? sellers
                      : sellers?.results || []
                    ).map((seller: any) => (
                      <SelectItem key={seller.id} value={seller.id}>
                        {seller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.operator")}
                </label>
                <Select
                  value={filters.operator || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("operator", value)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_operator")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(operators)
                      ? operators
                      : operators?.results || []
                    ).map((operator: any) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zamershik Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.zamershik")}
                </label>
                <Select
                  value={filters.zamershik || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("zamershik", value)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_zamershik")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {zamershikUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.admin")}
                </label>
                <Select
                  value={filters.admin || "all"}
                  onValueChange={(value) => handleFilterChange("admin", value)}
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_admin")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {adminUsers.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Order Date After */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.order_date_after")}
                </label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.order_date_after}
                  onChange={(e) =>
                    handleFilterChange("order_date_after", e.target.value)
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
                  value={filters.order_date_before}
                  onChange={(e) =>
                    handleFilterChange("order_date_before", e.target.value)
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
              {visibleColumns.moy_sklad_id && (
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                  {t("forms.moy_sklad_id")}
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
            {ordersData.map((order: any, index: number) => (
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
                    <div className="truncate" title={formatDate(order.status)}>
                      {order.order_status
                        ? t(`order_status.${order.order_status}`)
                        : "-"}
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
                      title={order.zamershik?.name}
                    >
                      {order.zamershik?.name || "-"}
                    </div>
                  </td>
                )}
                {visibleColumns.admin && (
                  <td className="px-3 py-2 text-sm">
                    <div
                      className="truncate text-gray-700"
                      title={order.admin?.name}
                    >
                      {order.admin?.name || "-"}
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
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
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
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage((prev) => prev + 1)}
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
              {Object.entries(visibleColumns).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={key}
                    checked={Boolean(value)}
                    onChange={(e) =>
                      handleColumnVisibilityChange(key, e.target.checked)
                    }
                    className="rounded border border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <label
                    htmlFor={key}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {t(`forms.${key}`) ||
                      key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </label>
                </div>
              ))}
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
