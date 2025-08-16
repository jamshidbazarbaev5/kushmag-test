import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import api from '@/core/api/api';

interface Status {
  id: number;
  status: string;
  bg_color: string;
  text_color: string;
}

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  orderId: string | number;
  currentStatus?: Status;
}

export function StatusChangeModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  currentStatus,
}: StatusChangeModalProps) {
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch statuses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
    }
  }, [isOpen]);

  // Reset selected status when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
    }
  }, [isOpen]);

  const fetchStatuses = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('statuses/');
      const statusData = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      setStatuses(statusData);
    } catch (error) {
      console.error('Error fetching statuses:', error);
      toast.error(t('messages.error.fetch_statuses') || 'Error fetching statuses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      toast.error(t('messages.please_select_status') || 'Please select a status');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`orders/${orderId}/change-status/`, {
        status: selectedStatus.id,
      });

      toast.success(t('messages.status_changed_successfully') || 'Status changed successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error changing status:', error);
      const errorMessage = error.response?.data?.message ||
                          error.response?.data?.detail ||
                          t('messages.error.change_status') ||
                          'Error changing status';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusOption = (status: Status) => {
    const isSelected = selectedStatus?.id === status.id;
    const isCurrent = currentStatus?.id === status.id;

    return (
      <button
        key={status.id}
        onClick={() => setSelectedStatus(status)}
        disabled={isCurrent}
        className={`
          relative p-3 rounded-lg border-2 transition-all duration-200 text-left
          ${isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }
          ${isCurrent
            ? 'opacity-50 cursor-not-allowed bg-gray-100'
            : 'cursor-pointer'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-medium inline-block shadow-sm border"
            style={{
              backgroundColor: status.bg_color,
              color: status.text_color,
              borderColor: status.bg_color,
            }}
          >
            {status.status}
          </span>
          {isCurrent && (
            <span className="text-xs text-gray-500 font-medium">
              ({t('common.current') || 'Current'})
            </span>
          )}
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {t('orders.change_status') || 'Change Order Status'}
          </DialogTitle>
          <DialogDescription>
            {t('orders.select_new_status') || 'Select a new status for this order'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : statuses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('messages.no_statuses_available') || 'No statuses available'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statuses.map(renderStatusOption)}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={!selectedStatus || isSubmitting || isLoading}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('common.changing') || 'Changing...'}</span>
              </div>
            ) : (
              t('common.change_status') || 'Change Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
