import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetMeasures } from '../api/measure';
import { ResourceTable } from '../helpers/ResourceTable';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
// import { format } from 'date-fns';

export default function MeasuresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data: measuresData, isLoading } = useGetMeasures({
    params: {
      page,
      page_size: 30
    }
  });
  const measures = Array.isArray(measuresData) ? measuresData : measuresData?.results || [];
  const totalCount = Array.isArray(measuresData) 
    ? measuresData.length 
    : (measuresData as { count: number })?.count || 0;
  const columns: any = [
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
      
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/measures/${row?.id}/edit`)}
        >
          {t('actions.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('titles.measures')}</h1>
        <Button onClick={() => navigate('/measures/create')}>
          {t('actions.create')}
        </Button>
      </div>
      <ResourceTable
        data={measures || []}
        totalCount={totalCount}
        pageSize={30}
        currentPage={page}
        onPageChange={(newPage) => setPage(newPage)}
        columns={columns}
        isLoading={isLoading}
      />
    </div>
  );
}
