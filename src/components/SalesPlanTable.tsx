import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SalesPlanDetail {
  month: number;
  sales_plan: string | number;
  clients_plan?: string | number;
  sales_count_plan?: string | number;
  sales?: number;
  clients?: number;
  sales_count?: number;
  sales_percentage?: number;
  clients_percentage?: number;
  sales_count_percentage?: number;
}

interface SalesPlanData {
  id?: number;
  user: number;
  year: number;
  details: SalesPlanDetail[];
  user_name?: string;
}

interface SalesPlanTableProps {
  data: SalesPlanData[];
  getUserName?: (userId: number) => string;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SalesPlanTable: React.FC<SalesPlanTableProps> = ({
  data,
  getUserName = (userId) => `User ${userId}`,
}) => {
  // Helper function to get sales plan value for a specific month
  const getSalesPlanForMonth = (
    details: SalesPlanDetail[],
    month: number,
  ): string => {
    const monthDetail = details.find((detail) => detail.month === month);
    return monthDetail ? String(monthDetail.sales_plan) : "0";
  };

  return (
    <div className="space-y-6">
      {data.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No sales plan data found</p>
          </CardContent>
        </Card>
      ) : (
        data.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>
                {getUserName(plan.user)} - {plan.year} Sales Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {MONTH_NAMES.map((month, index) => (
                        <TableHead key={index} className="text-center">
                          {month}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {Array.from({ length: 12 }, (_, index) => (
                        <TableCell key={index} className="text-center">
                          {getSalesPlanForMonth(plan.details, index + 1)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default SalesPlanTable;
