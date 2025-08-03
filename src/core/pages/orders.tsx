import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useGetOrders, useUpdateOrder, useDeleteOrder } from "../api/order";
import type { Order } from "../api/order";

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

  const { data: orders } = useGetOrders();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder();

  const ordersData = Array.isArray(orders) ? orders : orders?.results || [];

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

    if (window.confirm(t("messages.delete_confirm"))) {
      deleteOrder(order.id, {
        onSuccess: () => {
          toast.success(t("messages.deleted"));
        },
        onError: () => {
          toast.error(t("messages.error"));
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
        toast.success(t("messages.updated"));
        setIsEditDialogOpen(false);
        setEditingOrder(null);
      },
      onError: () => {
        toast.error(t("messages.error"));
      },
    });
  };

  // ...expanded row logic removed...

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("pages.orders")}</h1>
        <Button onClick={() => navigate("/orders/create")}>
          {t("common.create")}
        </Button>
      </div>

      <div className="overflow-x-auto shadow-sm rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t("forms.created_at")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t("forms.deadline")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t("forms.counterparty")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t("forms.organization")}</th>
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
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t("forms.project")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t("forms.store")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t("forms.description")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t("forms.seller")}</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-24">{t("forms.operator")}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ordersData.map((order: any) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div className="truncate" title={formatDate(order.created_at)}>
                    {formatDate(order.created_at)?.split(' ')[0] || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  <div className="truncate" title={formatDate(order.deadline_date)}>
                    {formatDate(order.deadline_date)?.split(' ')[0] || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate font-medium text-gray-900" title={order.agent?.name}>
                    {order.agent?.name || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate text-gray-700" title={order.organization?.name}>
                    {order.organization?.name || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-sm font-semibold text-green-700">
                  {order.total_amount ? Number(order.total_amount).toLocaleString() : '0'}
                </td>
                <td className="px-3 py-2 text-right text-sm text-blue-600">
                  {order.advance_payment ? Number(order.advance_payment).toLocaleString() : '0'}
                </td>
                <td className="px-3 py-2 text-right text-sm text-orange-600">
                  {order.discount_amount ? Number(order.discount_amount).toLocaleString() : '0'}
                </td>
                <td className="px-3 py-2 text-right text-sm font-medium text-red-700">
                  {order.remaining_balance ? Number(order.remaining_balance).toLocaleString() : '0'}
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate text-gray-700" title={order.project?.name}>
                    {order.project?.name || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate text-gray-700" title={order.store?.name}>
                    {order.store?.name || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate text-gray-600" title={order?.description}>
                    {order?.description || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate text-gray-700" title={order.seller?.name}>
                    {order.seller?.name || '-'}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm">
                  <div className="truncate text-gray-700" title={order.operator?.name}>
                    {order.operator?.name || '-'}
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
                      ✏️
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleDeleteClick(order)}
                      title={t("common.delete")}
                    >
                      🗑️
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
