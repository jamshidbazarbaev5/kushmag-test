import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ResourceTable } from '../helpers/ResourceTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResourceForm } from '../helpers/ResourceForm';
import { toast } from 'sonner';
import { useGetOrders, useUpdateOrder, useDeleteOrder } from '../api/order';
import type { Order } from '../api/order';

import { format } from 'date-fns';

const columns = (t: any) => [
  {
    header: t('forms.order_code'),
    accessorKey: 'order_code',
  },
  {
    header: t('forms.order_date'),
    accessorKey: 'order_date',
    cell: ({ getValue }: any) => format(new Date(getValue()), 'dd.MM.yyyy HH:mm'),
  },
  {
    header: t('forms.deadline_date'),
    accessorKey: 'deadline_date',
    cell: ({ getValue }: any) => format(new Date(getValue()), 'dd.MM.yyyy HH:mm'),
  },
  {
    header: t('forms.agent'),
    accessorKey: 'agent.name',
  },
  {
    header: t('forms.seller'),
    accessorKey: 'seller.name',
  },
  {
    header: t('forms.total_amount'),
    accessorKey: 'total_amount',
  },
  {
    header: t('forms.remaining_balance'),
    accessorKey: 'remaining_balance',
  },
];

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: orders, isLoading } = useGetOrders();
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: deleteOrder } = useDeleteOrder();

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

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('pages.orders')}</h1>
        <Button onClick={() => navigate('/orders/create')}>
          {t('common.create')}
        </Button>
      </div>

      <ResourceTable
        columns={columns(t)}
        data={Array.isArray(orders) ? orders : orders?.results || []}
        isLoading={isLoading}
        actions={(row) => (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleEditClick(row)}>
              {t('common.edit')}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(row)}>
              {t('common.delete')}
            </Button>
          </div>
        )}
      />

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
