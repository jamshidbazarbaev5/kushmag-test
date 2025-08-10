import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Exact data structure from the user's example
interface YearlyPlanDetail {
  month: number;
  sales_plan: string;
  clients_plan: string;
  sales_count_plan: string;
  sales: number;
  clients: number;
  sales_count: number;
  sales_percentage: number;
  clients_percentage: number;
  sales_count_percentage: number;
}

interface YearlyPlanData {
  id: number;
  user: number;
  year: number;
  details: YearlyPlanDetail[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YearlyPlanDemo: React.FC = () => {
  // Sample data matching the user's structure
  const sampleData: YearlyPlanData = {
    id: 4,
    user: 1,
    year: 2025,
    details: [
      {
        month: 1,
        sales_plan: "1000.00",
        clients_plan: "50.00",
        sales_count_plan: "200.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 2,
        sales_plan: "1200.00",
        clients_plan: "55.00",
        sales_count_plan: "210.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 3,
        sales_plan: "1300.00",
        clients_plan: "60.00",
        sales_count_plan: "220.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 4,
        sales_plan: "1400.00",
        clients_plan: "65.00",
        sales_count_plan: "230.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 5,
        sales_plan: "1500.00",
        clients_plan: "70.00",
        sales_count_plan: "240.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 6,
        sales_plan: "1600.00",
        clients_plan: "75.00",
        sales_count_plan: "250.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 7,
        sales_plan: "1700.00",
        clients_plan: "80.00",
        sales_count_plan: "260.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 8,
        sales_plan: "1800.00",
        clients_plan: "85.00",
        sales_count_plan: "270.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 9,
        sales_plan: "1900.00",
        clients_plan: "90.00",
        sales_count_plan: "280.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 10,
        sales_plan: "2000.00",
        clients_plan: "95.00",
        sales_count_plan: "290.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 11,
        sales_plan: "2100.00",
        clients_plan: "100.00",
        sales_count_plan: "300.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      },
      {
        month: 12,
        sales_plan: "2200.00",
        clients_plan: "105.00",
        sales_count_plan: "310.00",
        sales: 0,
        clients: 0,
        sales_count: 0,
        sales_percentage: 0.0,
        clients_percentage: 0.0,
        sales_count_percentage: 0.0
      }
    ]
  };

  // Helper function to get sales plan value for a specific month
  const getSalesPlanForMonth = (month: number): string => {
    const monthDetail = sampleData.details.find(detail => detail.month === month);
    return monthDetail ? monthDetail.sales_plan : '0';
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>
            User {sampleData.user} - {sampleData.year} Sales Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {MONTH_NAMES.map((month, index) => (
                    <TableHead key={index} className="text-center min-w-24">
                      {month}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  {Array.from({ length: 12 }, (_, index) => (
                    <TableCell key={index} className="text-center font-medium">
                      ${getSalesPlanForMonth(index + 1)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Summary Row */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Annual Sales Plan:</span>
              <span className="text-lg font-bold text-green-600">
                ${sampleData.details.reduce((total, detail) =>
                  total + parseFloat(detail.sales_plan), 0
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Monthly View */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Compact Monthly Sales Plan View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sampleData.details.map((detail) => (
              <div key={detail.month} className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-gray-600">
                  {MONTH_NAMES[detail.month - 1]}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  ${detail.sales_plan}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YearlyPlanDemo;
