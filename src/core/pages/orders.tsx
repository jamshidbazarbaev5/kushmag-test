import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetOrders, useUpdateOrder, useDeleteOrder } from '../api/order';
import type { Order } from '../api/order';

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
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  }
  const handleDeleteClick = (order: Order) => {
    if (!order.id) return;

    if (window.confirm(t('messages.delete_confirm'))) {
      deleteOrder(order.id, {
        onSuccess: () => {
          toast.success(t('messages.deleted'));
        },
        onError: () => {
          toast.error(t('messages.error'));
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
        toast.success(t('messages.updated'));
        setIsEditDialogOpen(false);
        setEditingOrder(null);
      },
      onError: () => {
        toast.error(t('messages.error'));
      },
    });
  };

  // ...expanded row logic removed...

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('pages.orders')}</h1>
        <Button onClick={() => navigate('/orders/create')}>
          {t('common.create')}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded-lg bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">{t('forms.created_at')}</th>
              <th className="px-4 py-2 text-left">{t('forms.deadline')}</th>
              <th className="px-4 py-2 text-left">{t('forms.counterparty')}</th>
              <th className="px-4 py-2 text-left">{t('forms.organization')}</th>
              <th className="px-4 py-2 text-left">{t('forms.total_amount')}</th>
              <th className="px-4 py-2 text-left">{t('forms.advance_payment')}</th>
              <th className="px-4 py-2 text-left">{t('forms.remaining_balance')}</th>
              <th className="px-4 py-2 text-left">{t('forms.project')}</th>
              <th className="px-4 py-2 text-left">{t('forms.store')}</th>
              <th className="px-4 py-2 text-left">{t('forms.description')}</th>
              <th className="px-4 py-2 text-left">{t('forms.seller')}</th>
              <th className="px-4 py-2 text-left">{t('forms.operator')}</th>
              <th className="px-4 py-2 text-left">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {ordersData.map((order: any) => (
              <tr key={order.id} className="border-b">
                <td className="px-4 py-2">{formatDate(order.created_at) || ''}</td>
                 <td className="px-4 py-2">{formatDate(order.deadline_date) || ''}</td>
                <td className="px-4 py-2">{order.agent?.name || ''}</td>
                <td className="px-4 py-2">{order.organization?.name || ''}</td>
                <td className="px-4 py-2">{Number(order.total_amount).toFixed(0)}</td>
                <td className="px-4 py-2">{Number(order.advance_payment).toFixed(0)}</td>
                <td className="px-4 py-2">{Number(order.remaining_balance).toFixed(0)}</td>
                <td className="px-4 py-2">{order.project?.name || ''}</td>
                <td className="px-4 py-2">{order.store?.name || ''}</td>
                <td className="px-4 py-2">{order?.description || ''}</td>
                <td className="px-4 py-2">{order.seller?.name || ''}</td>
                <td className="px-4 py-2">{order.operator?.name || ''}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/orders/edit/${order.id}`)}
                    >
                      {t('common.edit_advanced')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(order)}>
                      {t('common.delete')}
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
            title={t('messages.edit')}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
