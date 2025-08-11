import { useState } from "react";
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
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useGetOrders, useUpdateOrder, useDeleteOrder } from "../api/order";
import type { Order } from "../api/order";
import {
  useGetProjects,
  useGetStores,
  useGetCounterparties,
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
  SendHorizontal,
  Download,
} from "lucide-react";
import api from "../api/api";

// import { format } from 'date-fns';

// const DoorDetails = ({ door, t }: { door: any; t: any }) => (
//   <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
//     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//       <div>
//         <span className="font-semibold">{t('forms.door_model')}:</span>
//         <p>{door.model?.name || 'N/A'}</p>
//       </div>
//       <div>
//         <span className="font-semibold">{t('common.height')}:</span>
//         <p>{door.height}m</p>
//       </div>
//       <div>
//         <span className="font-semibold">{t('common.width')}:</span>
//         <p>{door.width}m</p>
//       </div>
//       <div>
//         <span className="font-semibold">{t('common.quantity')}:</span>
//         <p>{door.quantity}</p>
//       </div>
//       <div>
//         <span className="font-semibold">{t('forms.price')}:</span>
//         <p>{door.price}</p>
//       </div>
//     </div>

//     {door.extensions && door.extensions.length > 0 && (
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm">{t('forms.extensions')}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {door.extensions.map((ext: any, idx: number) => (
//             <div key={idx} className="grid grid-cols-5 gap-2 text-sm mb-2">
//               <span><span className="font-medium">{t('forms.model')}:</span> {ext.model?.name}</span>
//               <span><span className="font-medium">{t('common.height')}:</span> {ext.height}m</span>
//               <span><span className="font-medium">{t('common.width')}:</span> {ext.width}m</span>
//               <span><span className="font-medium">{t('common.quantity')}:</span> x{ext.quantity}</span>
//               <span><span className="font-medium">{t('forms.price')}:</span> {ext.price}</span>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     )}

//     {door.casings && door.casings.length > 0 && (
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm">{t('forms.casings')}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {door.casings.map((casing: any, idx: number) => (
//             <div key={idx} className="grid grid-cols-5 gap-2 text-sm mb-2">
//               <span><span className="font-medium">{t('forms.model')}:</span> {casing.model?.name}</span>
//               <span><span className="font-medium">{t('common.height')}:</span> {casing.height}m</span>
//               <span><span className="font-medium">{t('common.width')}:</span> {casing.width}m</span>
//               <span><span className="font-medium">{t('common.quantity')}:</span> x{casing.quantity}</span>
//               <span><span className="font-medium">{t('forms.price')}:</span> {casing.price}</span>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     )}

//     {door.crowns && door.crowns.length > 0 && (
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm">{t('forms.crowns')}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {door.crowns.map((crown: any, idx: number) => (
//             <div key={idx} className="grid grid-cols-4 gap-2 text-sm mb-2">
//               <span><span className="font-medium">{t('forms.model')}:</span> {crown.model?.name}</span>
//               <span><span className="font-medium">{t('common.width')}:</span> {crown.width}m</span>
//               <span><span className="font-medium">{t('common.quantity')}:</span> x{crown.quantity}</span>
//               <span><span className="font-medium">{t('forms.price')}:</span> {crown.price}</span>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     )}

//     {door.accessories && door.accessories.length > 0 && (
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-sm">{t('forms.accessories')}</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {door.accessories.map((accessory: any, idx: number) => (
//             <div key={idx} className="grid grid-cols-4 gap-2 text-sm mb-2">
//               <span><span className="font-medium">{t('forms.model')}:</span> {accessory.model?.name}</span>
//               <span><span className="font-medium">{t('forms.type')}:</span> {t(`accessory_types.${accessory.accessory_type}`)}</span>
//               <span><span className="font-medium">{t('common.quantity')}:</span> x{accessory.quantity}</span>
//               <span><span className="font-medium">{t('forms.price')}:</span> {accessory.price}</span>
//             </div>
//           ))}
//         </CardContent>
//       </Card>
//     )}
//   </div>
// );

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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


  const formatToTruncate = (text: string, length: number = 10): string => {
    return text?.length > length ? `${text.substring(0, length)}...` : text;
  };
  // Fetch filter options
  const { data: projects } = useGetProjects();
  const { data: stores } = useGetStores();
  const { data: agents } = useGetCounterparties();
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
    params.page = currentPage;
    return params;
  };

  const { data: orders } = useGetOrders({ params: buildQueryParams() });
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder();

  const ordersData = Array.isArray(orders) ? orders : orders?.results || [];
  const totalPages =
    !Array.isArray(orders) && orders?.count ? Math.ceil(orders.count / 20) : 1;

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for API
    const apiValue = value === "all" ? "" : value;
    setFilters((prev) => ({ ...prev, [key]: apiValue }));
    setCurrentPage(1); // Reset to first page when filtering
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

  // const handleEditClick = (order: Order) => {
  //   setEditingOrder(order);
  //   setIsEditDialogOpen(true);
  // };

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

  const handleSendToMoySklad = (order: Order) => {
    if (!order.id) return;

    api
      .post(`orders/${order.id}/moy_sklad/`, {})
      .then(() => {
        toast.success(t("messages.order_sent_to_moy_sklad"));
      })
      .catch(() => {
        toast.error(t("messages.error_sending_order_to_moy_sklad"));
      });
  };

  const handleExportOrder = (order: Order) => {
    if (!order.id) return;

    const exportUrl = `https://kushmag.uz/api/orders/${order.id}/export/`;

    // Open the export URL in a new tab to trigger download
    window.open(exportUrl, "_blank");
  };

  // ...expanded row logic removed...

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

          <Button onClick={() => navigate("/orders/create")}>
            {t("common.create")}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>{t("common.filters")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
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

              {/* Agent Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.agent")}
                </label>
                <Select
                  value={filters.agent || "all"}
                  onValueChange={(value) => handleFilterChange("agent", value)}
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_agent")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {(Array.isArray(agents)
                      ? agents
                      : agents?.results || []
                    ).map((agent: any) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
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

              {/* Order Status Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("forms.order_status")}
                </label>
                <Select
                  value={filters.order_status || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("order_status", value)
                  }
                >
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t("forms.select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="draft">
                      {t("order_status.draft")}
                    </SelectItem>
                    <SelectItem value="moy_sklad">
                      {t("order_status.moy_sklad")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("order_status.cancelled")}
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
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-16">
                №
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.order_status")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.moy_sklad_id")}
              </th>

              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.created_at")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.deadline")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                {t("forms.counterparty")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                {t("forms.organization")}
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                {t("forms.total_amount")}
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                {t("forms.advance_payment")}
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                {t("forms.discount_amount")}
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                {t("forms.remaining_balance")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.project")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.store")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32  ">
                {t("forms.description")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.seller")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.zamershik")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.admin")}
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">
                {t("forms.operator")}
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ordersData.map((order: any, index: number) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-3 py-2 text-center text-sm font-medium text-gray-700">
                  {(currentPage - 1) * 20 + index + 1}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div className="truncate" title={formatDate(order.status)}>
                    {order.order_status
                      ? t(`order_status.${order.order_status}`)
                      : "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div className="truncate" title={order.name}>
                    {order.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div
                    className="truncate"
                    title={formatDate(order.created_at)}
                  >
                    {formatDate(order.created_at)}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div
                    className="truncate"
                    title={formatDate(order.deadline_date)}
                  >
                    {formatDate(order.deadline_date)}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate font-medium text-gray-900"
                    title={order.agent?.name}
                  >
                    {order.agent?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.organization?.name}
                  >
                    {order.organization?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-sm font-semibold text-green-700">
                  {order.total_amount
                    ? Number(order.total_amount).toLocaleString()
                    : "0"}
                </td>
                <td className="px-3 py-2 text-right text-sm text-blue-600">
                  {order.advance_payment
                    ? Number(order.advance_payment).toLocaleString()
                    : "0"}
                </td>
                <td className="px-3 py-2 text-right text-sm text-orange-600">
                  {order.discount_amount
                    ? Number(order.discount_amount).toLocaleString()
                    : "0"}
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium text-red-700">
                  {order.remaining_balance
                    ? Number(order.remaining_balance).toLocaleString()
                    : "0"}
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.project?.name}
                  >
                    {order.project?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.store?.name}
                  >
                    {order.store?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate  text-gray-600"
                    title={order?.description}
                  >
                   {formatToTruncate(order?.description)}
                  </div>
                </td>

                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.seller?.name}
                  >
                    {order.seller?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.seller?.name}
                  >
                    {order.admin?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.seller?.name}
                  >
                    {order.zamershik?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div
                    className="truncate text-gray-700"
                    title={order.operator?.name}
                  >
                    {order.operator?.name || "-"}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => navigate(`/orders/edit/${order.id}`)}
                      title={t("common.edit_advanced")}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleDeleteClick(order)}
                      title={t("common.delete")}
                    >
                      <Trash />
                    </Button>
                    <Button
                      size="sm"
                      variant="link"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSendToMoySklad(order)}
                      title={t("common.send_to_moy_sklad")}
                    >
                      <SendHorizontal />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleExportOrder(order)}
                      title={t("common.export")}
                    >
                      <Download />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t("pagination.page")} {currentPage} {t("pagination.of")}{" "}
            {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("pagination.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              {t("pagination.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
