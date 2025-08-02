import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetOrders, useUpdateOrder, useDeleteOrder } from '../api/order';
import type { Order } from '../api/order';

import { format } from 'date-fns';

const DoorDetails = ({ door, t }: { door: any; t: any }) => (
  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <span className="font-semibold">{t('forms.door_model')}:</span>
        <p>{door.model?.name || 'N/A'}</p>
      </div>
      <div>
        <span className="font-semibold">{t('common.height')}:</span>
        <p>{door.height}m</p>
      </div>
      <div>
        <span className="font-semibold">{t('common.width')}:</span>
        <p>{door.width}m</p>
      </div>
      <div>
        <span className="font-semibold">{t('common.quantity')}:</span>
        <p>{door.quantity}</p>
      </div>
      <div>
        <span className="font-semibold">{t('forms.price')}:</span>
        <p>{door.price}</p>
      </div>
    </div>

    {door.extensions && door.extensions.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('forms.extensions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {door.extensions.map((ext: any, idx: number) => (
            <div key={idx} className="grid grid-cols-5 gap-2 text-sm mb-2">
              <span><span className="font-medium">{t('forms.model')}:</span> {ext.model?.name}</span>
              <span><span className="font-medium">{t('common.height')}:</span> {ext.height}m</span>
              <span><span className="font-medium">{t('common.width')}:</span> {ext.width}m</span>
              <span><span className="font-medium">{t('common.quantity')}:</span> x{ext.quantity}</span>
              <span><span className="font-medium">{t('forms.price')}:</span> {ext.price}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )}

    {door.casings && door.casings.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('forms.casings')}</CardTitle>
        </CardHeader>
        <CardContent>
          {door.casings.map((casing: any, idx: number) => (
            <div key={idx} className="grid grid-cols-5 gap-2 text-sm mb-2">
              <span><span className="font-medium">{t('forms.model')}:</span> {casing.model?.name}</span>
              <span><span className="font-medium">{t('common.height')}:</span> {casing.height}m</span>
              <span><span className="font-medium">{t('common.width')}:</span> {casing.width}m</span>
              <span><span className="font-medium">{t('common.quantity')}:</span> x{casing.quantity}</span>
              <span><span className="font-medium">{t('forms.price')}:</span> {casing.price}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )}

    {door.crowns && door.crowns.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('forms.crowns')}</CardTitle>
        </CardHeader>
        <CardContent>
          {door.crowns.map((crown: any, idx: number) => (
            <div key={idx} className="grid grid-cols-4 gap-2 text-sm mb-2">
              <span><span className="font-medium">{t('forms.model')}:</span> {crown.model?.name}</span>
              <span><span className="font-medium">{t('common.width')}:</span> {crown.width}m</span>
              <span><span className="font-medium">{t('common.quantity')}:</span> x{crown.quantity}</span>
              <span><span className="font-medium">{t('forms.price')}:</span> {crown.price}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )}

    {door.accessories && door.accessories.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t('forms.accessories')}</CardTitle>
        </CardHeader>
        <CardContent>
          {door.accessories.map((accessory: any, idx: number) => (
            <div key={idx} className="grid grid-cols-4 gap-2 text-sm mb-2">
              <span><span className="font-medium">{t('forms.model')}:</span> {accessory.model?.name}</span>
              <span><span className="font-medium">{t('forms.type')}:</span> {t(`accessory_types.${accessory.accessory_type}`)}</span>
              <span><span className="font-medium">{t('common.quantity')}:</span> x{accessory.quantity}</span>
              <span><span className="font-medium">{t('forms.price')}:</span> {accessory.price}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
);



export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const { data: orders } = useGetOrders();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder();

  const ordersData = Array.isArray(orders) ? orders : orders?.results || [];

  const toggleRowExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const handleEditClick = (order: Order) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

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

  const renderExpandedContent = (order: any) => (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-semibold mb-2">{t('common.details')}</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">{t('forms.address')}:</span> {order.address}</p>
            <p><span className="font-medium">{t('forms.description')}:</span> {order.description}</p>
            <p><span className="font-medium">{t('forms.discount_percentage')}:</span> {order.discount_percentage}%</p>
            <p><span className="font-medium">{t('forms.discount_amount')}:</span> {order.discount_amount} {order.rate?.name}</p>
            <p><span className="font-medium">{t('forms.advance_payment')}:</span> {order.advance_payment} {order.rate?.name}</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">{t('forms.organization_info')}</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">{t('forms.organization')}:</span> {order.organization?.name}</p>
            <p><span className="font-medium">{t('forms.project')}:</span> {order.project?.name}</p>
            <p><span className="font-medium">{t('forms.store')}:</span> {order.store?.name}</p>
            <p><span className="font-medium">{t('forms.sales_channel')}:</span> {order.salesChannel?.name}</p>
            <p><span className="font-medium">{t('forms.operator')}:</span> {order.operator?.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">{t('forms.configured_doors')}</h4>
        {order.doors && order.doors.map((door: any, doorIndex: number) => (
          <DoorDetails key={doorIndex} door={door} t={t} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('pages.orders')}</h1>
        <Button onClick={() => navigate('/orders/create')}>
          {t('common.create')}
        </Button>
      </div>

      <div className="space-y-4">
        {ordersData.map((order: any) => (
          <div key={order.id} className="border rounded-lg">
            <div className="p-4 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">{t('forms.order_code')}</span>
                  <p className="font-medium">{order.order_code}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.order_date')}</span>
                  <p className="font-medium">
                    {order.order_date ? format(new Date(order.order_date), 'dd.MM.yyyy') : ''}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.deadline_date')}</span>
                  <p className="font-medium">
                    {order.deadline_date ? format(new Date(order.deadline_date), 'dd.MM.yyyy') : ''}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.agent')}</span>
                  <p className="font-medium">{order.agent?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.seller')}</span>
                  <p className="font-medium">{order.seller?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.doors_count')}</span>
                  <p className="font-medium">{order.doors?.length || 0}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.total_amount')}</span>
                  <p className="font-medium">{order.total_amount} {order.rate?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t('forms.remaining_balance')}</span>
                  <p className="font-medium">{order.remaining_balance} {order.rate?.name}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => toggleRowExpansion(order.id)}
                >
                  {expandedRows.has(order.id) ? t('common.collapse') : t('common.expand')}
                </Button>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEditClick(order)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(order)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </div>
            {expandedRows.has(order.id) && renderExpandedContent(order)}
          </div>
        ))}
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
