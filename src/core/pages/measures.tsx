import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDeleteMeasure, useGetMeasures } from '../api/measure';
import { useGetUsers } from '../api/user';
import { ResourceTable } from '../helpers/ResourceTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { useState } from 'react';
// import { format } from 'date-fns';
// import { create } from 'zustand';

export default function MeasuresPage() {
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    client_name: '',
    client_phone: '',
    zamer_status: '',
    measure_date_after: '',
    measure_date_before: '',
    created_at_after: '',
    created_at_before: '',
    zamershik: ''
  });

  // Build query params for API call
  const buildQueryParams = () => {
    const params: Record<string, any> = {
      page,
      page_size: 30
    };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params[key] = value;
      }
    });
    return params;
  };

  const { data: measuresData, isLoading } = useGetMeasures({
    params: buildQueryParams()
  });
  const { data: users } = useGetUsers();
  const {mutate: deleteMeasure} = useDeleteMeasure();
  
  const measures = Array.isArray(measuresData) ? measuresData : measuresData?.results || [];
  const totalCount = Array.isArray(measuresData) 
    ? measuresData.length 
    : (measuresData as { count: number })?.count || 0;

  // Get filtered users based on role
  const zamershikUsers = !Array.isArray(users) && users?.results ? 
    users.results.filter((user: any) => user.role === 'ZAMERSHIK') : 
    (Array.isArray(users) ? users.filter((user: any) => user.role === 'ZAMERSHIK') : []);

  const handleFilterChange = (key: string, value: string) => {
    // Convert "all" back to empty string for API
    const apiValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: apiValue }));
    setPage(1); // Reset to first page when filtering
  };
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

  const clearFilters = () => {
    setFilters({
      client_name: '',
      client_phone: '',
      zamer_status: '',
      measure_date_after: '',
      measure_date_before: '',
      created_at_after: '',
      created_at_before: '',
      zamershik: ''
    });
    setPage(1);
  };
  const columns: any = [
    {
      header:t('tables.created_at'),
      accessorKey: 'date',
     cell:(row:any)=>(
          <p>
            {formatDate(row.created_at)}
          </p>
      )
  
    },  
    {
      header: t('tables.client_name'),
      accessorKey: 'client_name',
    },
    {
      header: t('tables.client_phone'),
      accessorKey: 'client_phone',
    },
    {
      header: t('tables.address'),
      accessorKey: 'address',
    },
    {
      header: t('tables.status'),
      accessorKey: 'zamer_status',
      cell: (row: any) => (
        <div className={`px-2 py-1 rounded-full text-sm inline-block
          ${row?.zamer_status === 'completed' ? 'bg-green-100 text-green-800' : 
            row?.zamer_status === 'cancelled' ? 'bg-red-100 text-red-800' : 
            'bg-yellow-100 text-yellow-800'}`}>
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
      header: t('tables.actions'),
      id: 'actions',
      cell: (row: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/measures/${row?.id}/edit`)}
          >
            {t('actions.edit')}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate(`/orders/create-from-measure/${row?.id}`)}
          >
            {t('actions.create_order')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(row?.id)}
          >
            {t('actions.delete')}
          </Button>
        </div>
      ),
    },
  ];
  const handleDelete = (id: number) => {
      deleteMeasure(id, {
    onSuccess: () => {
      // Optionally, you can show a success message or refresh the data
      setPage(1); // Reset to the first page after deletion
    },
    onError: (error) => {
      // Handle error, e.g., show a notification
      console.error('Error deleting measure:', error);
    },
  });
    // Implement delete functionality here
  };
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('titles.measures')}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t('common.filters')}
          </Button>
          <Button onClick={() => navigate('/measures/create')}>
            {t('actions.create')}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('common.filters')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* Client Name Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('tables.client_name')}</label>
                <Input
                  placeholder={t('tables.client_name')}
                  className="h-9 min-w-[200px]"
                  value={filters.client_name}
                  onChange={(e) => handleFilterChange('client_name', e.target.value)}
                />
              </div>

              {/* Client Phone Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('tables.client_phone')}</label>
                <Input
                  placeholder={t('tables.client_phone')}
                  className="h-9 min-w-[200px]"
                  value={filters.client_phone}
                  onChange={(e) => handleFilterChange('client_phone', e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('tables.status')}</label>
                <Select value={filters.zamer_status || 'all'} onValueChange={(value) => handleFilterChange('zamer_status', value)}>
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t('forms.select_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
                    <SelectItem value="new">{t('status.new')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zamershik Filter */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('forms.zamershik')}</label>
                <Select value={filters.zamershik || 'all'} onValueChange={(value) => handleFilterChange('zamershik', value)}>
                  <SelectTrigger className="h-9 min-w-[200px]">
                    <SelectValue placeholder={t('forms.select_zamershik')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.all')}</SelectItem>
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
                <label className="text-sm font-medium">{t('forms.measure_date_after')}</label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.measure_date_after}
                  onChange={(e) => handleFilterChange('measure_date_after', e.target.value)}
                />
              </div>

              {/* Measure Date Before */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('forms.measure_date_before')}</label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.measure_date_before}
                  onChange={(e) => handleFilterChange('measure_date_before', e.target.value)}
                />
              </div>

              {/* Created At After */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('forms.created_at_after')}</label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.created_at_after}
                  onChange={(e) => handleFilterChange('created_at_after', e.target.value)}
                />
              </div>

              {/* Created At Before */}
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('forms.created_at_before')}</label>
                <Input
                  type="date"
                  className="h-9 min-w-[140px]"
                  value={filters.created_at_before}
                  onChange={(e) => handleFilterChange('created_at_before', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                {t('common.clear_filters')}
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
        onPageChange={(newPage) => setPage(newPage)}
        columns={columns}
        isLoading={isLoading}
      />
    </div>
  );
}
