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

interface ConsolidatedSalesPlanTableProps {
  data: SalesPlanData[];
  getUserName?: (userId: number) => string;
  year?: number;
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

const ConsolidatedSalesPlanTable: React.FC<ConsolidatedSalesPlanTableProps> = ({
  data,
  getUserName = (userId) => `User ${userId}`,
  year,
}) => {
  // Helper function to get sales plan value for a specific month and user
  const getSalesPlanForMonth = (
    details: SalesPlanDetail[],
    month: number,
  ): string => {
    const monthDetail = details.find((detail) => detail.month === month);
    return monthDetail ? String(monthDetail.sales_plan) : "0";
  };

  // Group data by year if multiple years exist
  const groupedByYear = data.reduce(
    (acc, plan) => {
      if (!acc[plan.year]) {
        acc[plan.year] = [];
      }
      acc[plan.year].push(plan);
      return acc;
    },
    {} as Record<number, SalesPlanData[]>,
  );

  const years = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);
  const displayYears = year ? [year] : years;

  return (
    <div className="space-y-6">
      {displayYears.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No sales plan data found</p>
          </CardContent>
        </Card>
      ) : (
        displayYears.map((displayYear) => {
          const yearData = groupedByYear[displayYear] || [];

          if (yearData.length === 0) return null;

          return (
            <Card key={displayYear}>
              <CardHeader>
                <CardTitle>{displayYear} Sales Plans - All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">User</TableHead>
                        {MONTH_NAMES.map((month, index) => (
                          <TableHead
                            key={index}
                            className="text-center min-w-20"
                          >
                            {month}
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-24">
                          Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearData.map((plan) => {
                        // Calculate total for the year
                        const total = plan.details.reduce((sum, detail) => {
                          return (
                            sum + parseFloat(String(detail.sales_plan) || "0")
                          );
                        }, 0);

                        return (
                          <TableRow
                            key={plan.id || `plan-${plan.user}-${plan.year}`}
                          >
                            <TableCell className="font-medium">
                              {getUserName(plan.user)}
                            </TableCell>
                            {Array.from({ length: 12 }, (_, index) => (
                              <TableCell key={index} className="text-center">
                                {getSalesPlanForMonth(plan.details, index + 1)}
                              </TableCell>
                            ))}
                            <TableCell className="text-center font-semibold">
                              {total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Summary row if multiple users */}
                      {yearData.length > 1 && (
                        <TableRow className="bg-gray-50 font-semibold border-t-2">
                          <TableCell>Total</TableCell>
                          {Array.from({ length: 12 }, (_, index) => {
                            const monthTotal = yearData.reduce((sum, plan) => {
                              const monthValue = parseFloat(
                                getSalesPlanForMonth(plan.details, index + 1) ||
                                  "0",
                              );
                              return sum + monthValue;
                            }, 0);
                            return (
                              <TableCell key={index} className="text-center">
                                {monthTotal.toFixed(2)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            {yearData
                              .reduce((sum, plan) => {
                                const planTotal = plan.details.reduce(
                                  (planSum, detail) => {
                                    return (
                                      planSum +
                                      parseFloat(
                                        String(detail.sales_plan) || "0",
                                      )
                                    );
                                  },
                                  0,
                                );
                                return sum + planTotal;
                              }, 0)
                              .toFixed(2)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default ConsolidatedSalesPlanTable;
