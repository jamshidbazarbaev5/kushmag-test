import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetMonthlySalaries, useCreateMonthlySalary, useUpdateMonthlySalary, useDeleteMonthlySalary } from '../api/monthlySalary';
import { useGetUsers, useCreateUser } from '../api/user';
import type { MonthlySalary } from '../api/types';
import type { User } from '../api/user';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

interface EditingMonthlySalary extends Partial<MonthlySalary> {
  id?: number;
  isNew?: boolean;
}

export default function MonthlySalariesPage() {
  const { t } = useTranslation();
  const [editingRowId, setEditingRowId] = useState<number | 'new' | null>(null);
  const [editingData, setEditingData] = useState<EditingMonthlySalary>({});
//   const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Set current month as default (YYYY-MM-01 format for API)
    return new Date().toISOString().slice(0, 7) + '-01';
  });
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  
  const { data: monthlySalariesData, isLoading } = useGetMonthlySalaries({
    params: {
    //   ...(searchTerm && { search: searchTerm }),
      ...(selectedMonth && { month: selectedMonth })
    }
  }) as { data: MonthlySalary[] | undefined, isLoading: boolean };
  
  const { data: usersData } = useGetUsers() as { data: User[] | undefined };

  const { mutate: createMonthlySalary, isPending: isCreating } = useCreateMonthlySalary();
  const { mutate: updateMonthlySalary, isPending: isUpdating } = useUpdateMonthlySalary();
  const { mutate: deleteMonthlySalary } = useDeleteMonthlySalary();
  const { mutate: createUser } = useCreateUser();

  const monthlySalaries = monthlySalariesData || [];
  const users = usersData || [];

  // Chart colors

  // Process data for charts
 


  const userForm = useForm<User>({
    defaultValues: {
      username: '',
      password: '',
      full_name: '',
      phone_number: '',
      role: 'SOTRUDNIK',
      fixed_salary: 0,
      order_percentage: 1,
    }
  });

  // Calculate total salary
  const calculateTotalSalary = (data: Partial<MonthlySalary>) => {
    const fixedSalary = Number(data.fixed_salary) || 0;
    const orderPercentageSalary = Number(data.order_percentage_salary) || 0;
    const bonuses = Number(data.bonuses) || 0;
    const penalties = Number(data.penalties) || 0;
    
    return fixedSalary + orderPercentageSalary + bonuses - penalties;
  };

  // Auto-calculate order percentage salary using actual orders data
  const calculateOrderPercentageSalary = (orderPercentage: number, ordersTotal: number = 0) => {
    // Calculate based on actual orders total sum
    return (ordersTotal * orderPercentage) / 100;
  };

  const handleEdit = (salary: MonthlySalary) => {
    setEditingRowId(salary.id!);
    setEditingData(salary);
  };

  const handleAddNew = () => {
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`; // YYYY-MM-01 format
    setEditingRowId('new');
    setEditingData({
      isNew: true,
      month: currentMonth,
      user: 0,
      fixed_salary: 0,
      order_percentage: 1,
      order_percentage_salary: 0,
      penalties: 0,
      bonuses: 0,
      total_salary: 0,
      orders_total_sum: 0,
    });
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const handleSave = () => {
    if (!editingData.user || !editingData.month) {
      toast.error(t('messages.error.required_fields'));
      return;
    }

    const totalSalary = calculateTotalSalary(editingData);
    const dataToSave = {
      ...editingData,
      total_salary: totalSalary,
    };

    if (editingData.isNew) {
      delete dataToSave.id;
      delete dataToSave.isNew;
      createMonthlySalary(dataToSave as MonthlySalary, {
        onSuccess: () => {
          toast.success(t('messages.success.created', { item: t('navigation.monthly_salaries') }));
          handleCancel();
        },
        onError: () => toast.error(t('messages.error.create', { item: t('navigation.monthly_salaries') })),
      });
    } else {
      updateMonthlySalary(dataToSave as MonthlySalary, {
        onSuccess: () => {
          toast.success(t('messages.success.updated', { item: t('navigation.monthly_salaries') }));
          handleCancel();
        },
        onError: () => toast.error(t('messages.error.update', { item: t('navigation.monthly_salaries') })),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm(t('messages.confirm.delete'))) {
      deleteMonthlySalary(id, {
        onSuccess: () => toast.success(t('messages.success.deleted', { item: t('navigation.monthly_salaries') })),
        onError: () => toast.error(t('messages.error.delete', { item: t('navigation.monthly_salaries') })),
      });
    }
  };

  const handleFieldChange = (field: keyof MonthlySalary, value: any) => {
    const updatedData = { ...editingData, [field]: value };
    
    // Ensure month is always set to first day of the month
    if (field === 'month') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const firstDayOfMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        updatedData[field] = firstDayOfMonth;
      }
    }
    
    // Auto-fill data when user is selected
    if (field === 'user') {
      const selectedUser = users.find(user => user.id === Number(value));
      if (selectedUser) {
        updatedData.fixed_salary = selectedUser.fixed_salary || 0;
        updatedData.order_percentage = selectedUser.order_percentage || 1;
        // Use orders_total_sum from current editing data or 0 as fallback
        const ordersTotal = editingData.orders_total_sum || 0;
        updatedData.order_percentage_salary = calculateOrderPercentageSalary(selectedUser.order_percentage || 1, ordersTotal);
      }
    }
    
    // Recalculate order percentage salary when order percentage changes
    if (field === 'order_percentage') {
      // Use orders_total_sum from current editing data or 0 as fallback
      const ordersTotal = editingData.orders_total_sum || 0;
      updatedData.order_percentage_salary = calculateOrderPercentageSalary(Number(value), ordersTotal);
    }
    
    // Recalculate total salary
    updatedData.total_salary = calculateTotalSalary(updatedData);
    
    setEditingData(updatedData);
  };

  const handleCreateUser = (data: User) => {
    createUser(data, {
      onSuccess: (newUser: User) => {
        toast.success(t('messages.success.created', { item: t('navigation.users') }));
        setShowCreateUserModal(false);
        userForm.reset();
        // Select the newly created user
        handleFieldChange('user', newUser.id);
      },
      onError: () => toast.error(t('messages.error.create', { item: t('navigation.users') })),
    });
  };

  const renderEditableCell = (
    value: any,
    field: keyof MonthlySalary,
    type: 'text' | 'number' | 'select' | 'month' | 'date' = 'text',
    options?: { value: any; label: string }[],
    rowId?: number | 'new'
  ) => {
    // Only show editable input if this specific row is being edited
    if (editingRowId !== rowId) {
      return <span>{value}</span>;
    }

    const inputValue = editingData[field] ?? value ?? '';

    if (type === 'select') {
      return (
        <Select
          value={String(inputValue)}
          onValueChange={(value) => handleFieldChange(field, field === 'user' ? Number(value) : value)}
        >
          <SelectTrigger className="w-40 min-w-40">
            <SelectValue placeholder={t('placeholders.select')} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
            {field === 'user' && (
              <div className="p-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateUserModal(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('navigation.create_user')}
                </Button>
              </div>
            )}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type={type}
        value={inputValue}
        onChange={(e) => handleFieldChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-40 min-w-40"
        disabled={field === 'total_salary' || field === 'order_percentage_salary'}
      />
    );
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('navigation.monthly_salaries')}</h1>
        <Button onClick={handleAddNew} disabled={editingRowId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          {t('common.add')}
        </Button>
      </div>

      <Tabs defaultValue="table" className="w-full">
       

        <TabsContent value="table" className="space-y-4">
          <div className="flex gap-4">
            {/* <Input
              type="text"
              placeholder={t('placeholders.search_monthly_salary')}
              className="flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            /> */}
            <div className="flex gap-2">
              <Input
                type="month"
                placeholder={t('forms.month')}
                className="w-48"
                value={selectedMonth ? selectedMonth.slice(0, 7) : ''}
                onChange={(e) => setSelectedMonth(e.target.value ? `${e.target.value}-01` : '')}
              />
              {selectedMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMonth('')}
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('forms.month')}</TableHead>
                  <TableHead>{t('forms.user')}</TableHead>
                  <TableHead>{t('forms.fixed_salary')}</TableHead>
                  <TableHead>{t('forms.order_percentage')} (%)</TableHead>
                  <TableHead>{t('forms.order_percentage_salary')}</TableHead>
                  <TableHead>{t('forms.penalties')}</TableHead>
                  <TableHead>{t('forms.bonuses')}</TableHead>
                  <TableHead>{t('forms.total_salary')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editingRowId === 'new' && (
                  <TableRow>
                    <TableCell>
                      {renderEditableCell(editingData.month, 'month', 'date', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(
                        editingData.user,
                        'user',
                        'select',
                        users.map(user => ({ value: user.id!, label: `${user.full_name} (${user.username})` })),
                        'new'
                      )}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(editingData.fixed_salary, 'fixed_salary', 'number', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(editingData.order_percentage, 'order_percentage', 'number', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(editingData.order_percentage_salary, 'order_percentage_salary', 'number', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(editingData.penalties, 'penalties', 'number', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(editingData.bonuses, 'bonuses', 'number', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(editingData.total_salary, 'total_salary', 'number', undefined, 'new')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSave} disabled={isCreating}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                {monthlySalaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell>
                      {renderEditableCell(salary.month, 'month', 'date', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {editingRowId === salary.id ? 
                        renderEditableCell(
                          salary.user,
                          'user',
                          'select',
                          users.map(user => ({ value: user.id!, label: `${user.full_name} (${user.username})` })),
                          salary.id
                        ) :
                        salary.user_details ? `${salary.user_details.full_name} (${salary.user_details.username})` : 
                        users.find(user => user.id === salary.user)?.username || `User ${salary.user}`
                      }
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(salary.fixed_salary, 'fixed_salary', 'number', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(salary.order_percentage, 'order_percentage', 'number', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(salary.order_percentage_salary, 'order_percentage_salary', 'number', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(salary.penalties, 'penalties', 'number', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(salary.bonuses, 'bonuses', 'number', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(salary.total_salary, 'total_salary', 'number', undefined, salary.id)}
                    </TableCell>
                    <TableCell>
                      {editingRowId === salary.id ? (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(salary)}
                            disabled={editingRowId !== null}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(salary.id!)}
                            disabled={editingRowId !== null}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

      
      </Tabs>

      {/* Create User Modal */}
      <Dialog open={showCreateUserModal} onOpenChange={setShowCreateUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('navigation.create_user')}</DialogTitle>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4">
              <FormField
                control={userForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('placeholders.enter_username')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('placeholders.enter_password')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.full_name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('placeholders.enter_full_name')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.phone_number')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('placeholders.enter_phone_number')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.role')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="PRODAVEC">PRODAVEC</SelectItem>
                        <SelectItem value="ZAMERSHIK">ZAMERSHIK</SelectItem>
                        <SelectItem value="OPERATOR">OPERATOR</SelectItem>
                        <SelectItem value="SOTRUDNIK">SOTRUDNIK</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="api_login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.api_login')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('placeholders.enter_api_login')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="api_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.api_password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={t('placeholders.enter_api_password')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="fixed_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.fixed_salary')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t('placeholders.enter_fixed_salary')} 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="order_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('forms.order_percentage')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={t('placeholders.enter_order_percentage')} 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateUserModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {t('common.create')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
