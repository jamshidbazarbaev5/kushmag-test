import  { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  PlusIcon,
  EditIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  SearchIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '../../components/modals/DeleteConfirmationModal';

export interface TableField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: { value: string | number; label: string }[];
  required?: boolean;
  editable?: boolean;
}

interface InlineEditableTableProps<T extends { id?: number }> {
  title: string;
  data: T[];
  fields: TableField[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreate: (data: Omit<T, 'id'>) => Promise<void>;
  onUpdate: (id: number, data: Partial<T>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  searchPlaceholder?: string;
}

export function InlineEditableTable<T extends { id?: number }>({
  title,
  data,
  fields,
  isLoading,
  searchTerm,
  onSearchChange,
  onCreate,
  onUpdate,
  onDelete,
  searchPlaceholder = 'Search...'
}: InlineEditableTableProps<T>) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<T>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<T>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | undefined>(undefined);

  // Reset editing state when data changes
  useEffect(() => {
    setEditingId(null);
    setEditingData({});
  }, [data]);

  const handleEdit = (item: T) => {
    setEditingId(item.id!);
    setEditingData(item);
  };

  const handleSave = async () => {
    if (editingId && editingData) {
      try {
        await onUpdate(editingId, editingData);
        setEditingId(null);
        setEditingData({});
        toast.success(t('messages.success.updated'));
      } catch (error) {
        toast.error(t('messages.error.update'));
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleCreate = async () => {
    try {
      await onCreate(newItemData as Omit<T, 'id'>);
      setIsCreating(false);
      setNewItemData({});
      toast.success(t('messages.success.created'));
    } catch (error) {
      toast.error(t('messages.error.create'));
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewItemData({});
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      try {
        await onDelete(itemToDelete);
        setIsDeleteModalOpen(false);
        setItemToDelete(undefined);
        toast.success(t('messages.success.deleted'));
      } catch (error) {
        toast.error(t('messages.error.delete'));
      }
    }
  };

  const renderCell = (field: TableField, value: any, isEditing: boolean, onChange: (value: any) => void) => {
    if (!isEditing || !field.editable) {
      if (field.type === 'select' && field.options) {
        const option = field.options.find(opt => opt.value === value);
        return option ? option.label : value;
      }
      return value || '-';
    }

    if (field.type === 'select' && field.options) {
      return (
        <Select value={value?.toString() || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={field.type}
        value={value || ''}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={field.placeholder}
        className="h-8"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <PlusIcon className="h-4 w-4" />
          {t('common.create')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">№</TableHead>
              {fields.map((field) => (
                <TableHead key={field.name}>{field.label}</TableHead>
              ))}
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Create new item row */}
            {isCreating && (
              <TableRow className="bg-blue-50">
                <TableCell>-</TableCell>
                {fields.map((field) => (
                  <TableCell key={field.name}>
                    {renderCell(
                      { ...field, editable: true },
                      newItemData[field.name as keyof T],
                      true,
                      (value) => setNewItemData(prev => ({ ...prev, [field.name]: value }))
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreate}
                      className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelCreate}
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {data.map((item, index) => {
              const isEditing = editingId === item.id;
              return (
                <TableRow key={item.id || index} className={isEditing ? 'bg-yellow-50' : ''}>
                  <TableCell>{index + 1}</TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.name}>
                      {renderCell(
                        field,
                        isEditing ? editingData[field.name as keyof T] : item[field.name as keyof T],
                        isEditing,
                        (value) => setEditingData(prev => ({ ...prev, [field.name]: value }))
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleSave}
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          {item.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(item.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {data.length === 0 && !isCreating && (
              <TableRow>
                <TableCell colSpan={fields.length + 2} className="text-center py-8 text-gray-500">
                  {t('common.no_data')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title={t('common.confirm_delete')}
        description={t('common.delete_warning')}
      />
    </div>
  );
}
