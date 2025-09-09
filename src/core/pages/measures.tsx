import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useDeleteMeasure,
  useGetMeasures,
  useExportMeasure,
} from "../api/measure";
import { toast } from "sonner";
import { useGetAllUsers } from "../api/user";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { ResourceTable } from "../helpers/ResourceTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Filter,
  X,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
// import { format } from 'date-fns';
// import { create } from 'zustand';

export default function MeasuresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    client_name: "",
    client_phone: "",
    zamer_status: "",
    measure_date_after: "",
    measure_date_before: "",
    created_at_after: "",
    created_at_before: "",
    zamershik: "",
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.is_superuser;

  // Check if current user can create orders (admin, operator, or prodavec)
  const canCreateOrder =
    isAdmin ||
    currentUser?.role === "OPERATOR" ||
    currentUser?.role === "PRODAVEC";

  // Debounced filter update
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Build query params for API call
  const buildQueryParams = useCallback(() => {
    const params: Record<string, any> = {
      page,
      page_size: 30,
    };
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    return params;
  }, [page, debouncedFilters]);

  const {
    data: measuresData,
    isLoading,
    refetch,
  } = useGetMeasures({
    params: buildQueryParams(),
  });
  const { data: users } = useGetAllUsers();
  const { mutate: deleteMeasure } = useDeleteMeasure();
  const { mutate: exportMeasure } = useExportMeasure();

  const measures = Array.isArray(measuresData)
    ? measuresData
    : measuresData?.results || [];
  const totalCount = Array.isArray(measuresData)
    ? measuresData.length
    : (measuresData as { count: number })?.count || 0;

  // Get filtered users based on role
  const zamershikUsers = (users || []).filter(
    (user: any) => user.role === "ZAMERSHIK",
  );

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for API
    const apiValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: apiValue }));
    setPage(1); // Reset to first page when filtering
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  // Refetch data when debounced filters or page change
  useEffect(() => {
    refetch();
  }, [debouncedFilters, page, refetch]);
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

  const clearFilters = useCallback(() => {
    const emptyFilters = {
      client_name: "",
      client_phone: "",
      zamer_status: "",
      measure_date_after: "",
      measure_date_before: "",
      created_at_after: "",
      created_at_before: "",
      zamershik: "",
    };
    setFilters(emptyFilters);
    setDebouncedFilters(emptyFilters);
    setPage(1);
  }, []);
  const columns: any = [
    {
      header: t("tables.created_at"),
      accessorKey: "date",
      cell: (row: any) => <p>{formatDate(row.created_at)}</p>,
    },
    {
      header: t("tables.client_name"),
      accessorKey: "client_name",
    },
    {
      header: t("tables.client_phone"),
      accessorKey: "client_phone",
    },
    {
      header: t("tables.address"),
      accessorKey: "address",
    },
    {
      header: t("tables.status"),
      accessorKey: "zamer_status",
      cell: (row: any) => (
        <div
          className={`px-2 py-1 rounded-full text-sm inline-block
          ${
            row?.zamer_status === "completed"
              ? "bg-green-100 text-green-800"
              : row?.zamer_status === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {t(`status.${row?.zamer_status}`)}
        </div>
      ),
    },
    // {
    //   header: t('tables.created_at'),
    //   accessorKey: 'created_at',
    //   cell: ({ row }:any) => format(new Date(row?.original?.created_at), 'dd.MM.yyyy HH:mm'),
    // },
    {
      header: t("tables.actions"),
      id: "actions",
      cell: (row: any) => <ActionsDropdown row={row} />,
    },
  ];
  const handleDelete = (id: number) => {
    if (window.confirm(t("messages.confirm.delete"))) {
      deleteMeasure(id, {
        onSuccess: () => {
          toast.success(t("messages.measure_deleted_successfully"));
          refetch(); // Refetch data after deletion
        },
        onError: (error) => {
          console.error("Error deleting measure:", error);
          toast.error(
            t("messages.error.delete", { item: t("navigation.measures") }),
          );
        },
      });
    }
  };

  const handleExportMeasure = (id: number) => {
    exportMeasure(id);
  };

  // Custom dropdown component for actions
  const ActionsDropdown = ({ row }: { row: any }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{
      top: number;
      left: number;
      position: "bottom" | "top";
    }>({
      top: 0,
      left: 0,
      position: "bottom",
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const calculatePosition = () => {
      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Calculate dropdown height based on number of items
      let dropdownHeight = 16; // base padding (py-1 = 4px top + 4px bottom = 8px, plus some buffer)
      dropdownHeight += 40; // Edit button
      dropdownHeight += 40; // Export button
      if (!row?.order_status && canCreateOrder) dropdownHeight += 40; // Create Order
      if (isAdmin) dropdownHeight += 50; // Delete button + separator

      const spaceBelow = viewportHeight - rect.bottom - 10; // 10px buffer
      const spaceAbove = rect.top - 10; // 10px buffer

      // Determine if dropdown should open up or down
      const position =
        spaceBelow < dropdownHeight && spaceAbove > dropdownHeight
          ? "top"
          : "bottom";

      // Calculate optimal left position
      const dropdownWidth = 192; // w-48 = 192px
      let left = rect.left;

      // Adjust if dropdown would go off-screen on the right
      if (left + dropdownWidth > viewportWidth) {
        left = rect.right - dropdownWidth;
      }

      // Ensure minimum left position
      if (left < 10) {
        left = 10;
      }

      // Calculate top position
      let top;
      if (position === "top") {
        top = rect.top - dropdownHeight;
      } else {
        top = rect.bottom + 4;
      }

      // Ensure dropdown doesn't go above viewport
      if (top < 10) {
        top = 10;
                                                                                                                  }

      // Ensure dropdown doesn't go below viewport
      if (top + dropdownHeight > viewportHeight - 10) {
        top = viewportHeight - dropdownHeight - 10;
      }

      setDropdownPosition({ top, left, position });
    };

    const handleToggle = (event: React.MouseEvent) => {
      event.stopPropagation(); // Prevent event bubbling to row click
      if (!isOpen) {
        calculatePosition();
      }
      setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
          document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    return (
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8 w-8 p-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {isOpen &&
          createPortal(
            <div
              ref={dropdownRef}
              className="fixed z-[9999] w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                maxHeight: "300px",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/measures/${row?.id}/edit`);
                  setIsOpen(false);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t("actions.edit")}
              </button>

              <button
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportMeasure(row?.id);
                  setIsOpen(false);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("actions.export")}
              </button>

              {/* Show Create Order button if order status is null and user can create orders */}
              {!row?.order_status && canCreateOrder && (
                <button
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/orders/create-from-measure/${row?.id}`);
                    setIsOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("actions.create_order")}
                </button>
              )}

              {/* Show Delete button only for admin users */}
              {isAdmin && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(row?.id);
                      setIsOpen(false);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("actions.delete")}
                  </button>
                </>
              )}
            </div>,
            document.body,
          )}
      </div>
    );
  };
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("titles.measures")}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("common.filters")}
          </Button>
          <Button onClick={() => navigate("/measures/create")}>
            {t("actions.create")}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("common.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-visible">
              {/* Client Name Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("tables.client_name")}
                </label>
                <Input
                  placeholder={t("tables.client_name")}
                  className="h-9 w-full"
                  value={filters.client_name}
                  onChange={(e) =>
                    handleFilterChange("client_name", e.target.value)
                  }
                />
              </div>

              {/* Client Phone Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("tables.client_phone")}
                </label>
                <Input
                  placeholder={t("tables.client_phone")}
                  className="h-9 w-full"
                  value={filters.client_phone}
                  onChange={(e) =>
                    handleFilterChange("client_phone", e.target.value)
                  }
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("tables.status")}
                </label>
                <Select
                  value={filters.zamer_status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("zamer_status", value)
                  }
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder={t("forms.select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="new">{t("status.new")}</SelectItem>
                    <SelectItem value="completed">
                      {t("status.completed")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("status.cancelled")}
                    </SelectItem>
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
                  <SelectTrigger className="h-9 w-full">
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

              {/* Measure Date After */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.measure_date_after")}
                </label>
                <Input
                  type="date"
                  className="h-9 w-full"
                  value={filters.measure_date_after}
                  onChange={(e) =>
                    handleFilterChange("measure_date_after", e.target.value)
                  }
                />
              </div>

              {/* Measure Date Before */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.measure_date_before")}
                </label>
                <Input
                  type="date"
                  className="h-9 w-full"
                  value={filters.measure_date_before}
                  onChange={(e) =>
                    handleFilterChange("measure_date_before", e.target.value)
                  }
                />
              </div>

              {/* Created At After */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.created_at_after")}
                </label>
                <Input
                  type="date"
                  className="h-9 w-full"
                  value={filters.created_at_after}
                  onChange={(e) =>
                    handleFilterChange("created_at_after", e.target.value)
                  }
                />
              </div>

              {/* Created At Before */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.created_at_before")}
                </label>
                <Input
                  type="date"
                  className="h-9 w-full"
                  value={filters.created_at_before}
                  onChange={(e) =>
                    handleFilterChange("created_at_before", e.target.value)
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

      <ResourceTable
        data={measures || []}
        totalCount={totalCount}
        pageSize={30}
        currentPage={page}
        // onDelete={handleDelete}
        onPageChange={(newPage) => {
          setPage(newPage);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onRowClick={(row) => navigate(`/measures/${row?.id}/edit`)}
        columns={columns}
        isLoading={isLoading}
      />
    </div>
  );
}
