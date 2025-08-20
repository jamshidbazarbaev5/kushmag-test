import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetMonthlySalaries } from "../api/monthlySalary";
import { useGetAllUsers as useGetUsersData } from "../api/user";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Tabs, TabsContent } from "@/components/ui/tabs";

import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { UserCheck } from "lucide-react";

interface SalaryData {
  id: number;
  user: number;
  month: string;
  fixed_salary: number;
  order_percentage: number;
  order_percentage_salary: number;
  penalties: number;
  bonuses: number;
  total_salary: number;
  orders_total_sum: number;
  user_details?: {
    id: number;
    username: string;
    full_name: string;
    phone_number: string;
    role: string;
    fixed_salary: number;
    order_percentage: number;
  };
}

export default function SalaryOverviewPage() {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toISOString().slice(0, 7) + "-01";
  });
  const [selectedRole, _setSelectedRole] = useState<string>("all");
  const [searchTerm, _setSearchTerm] = useState("");

  const { data: monthlySalariesData, isLoading } = useGetMonthlySalaries({
    params: {
      ...(selectedMonth && { month: selectedMonth }),
    },
  }) as {
    data: { results: SalaryData[]; totals?: any } | undefined;
    isLoading: boolean;
  };

  const { data: usersData } = useGetUsersData();

  const monthlySalaries = monthlySalariesData?.results || [];
  const users = usersData || [];

  // Filter data based on search and role
  const filteredSalaries = monthlySalaries.filter((salary) => {
    const userName =
      salary.user_details?.full_name ||
      users.find((user) => user.id === salary.user)?.full_name ||
      "";
    const userRole =
      salary.user_details?.role ||
      users.find((user) => user.id === salary.user)?.role ||
      "";

    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.user_details?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || userRole === selectedRole;

    return matchesSearch && matchesRole;
  });

  // // Calculate summary statistics
  // const summaryStats = {
  //   totalUsers: filteredSalaries.length,
  //   totalSalary: filteredSalaries.reduce((sum, salary) => sum + (salary.total_salary || 0), 0),
  //   averageSalary: filteredSalaries.length > 0 ?
  //     filteredSalaries.reduce((sum, salary) => sum + (salary.total_salary || 0), 0) / filteredSalaries.length : 0,
  //   totalFixedSalary: filteredSalaries.reduce((sum, salary) => sum + (salary.fixed_salary || 0), 0),
  //   totalOrderSalary: filteredSalaries.reduce((sum, salary) => sum + (salary.order_percentage_salary || 0), 0),
  //   totalBonuses: filteredSalaries.reduce((sum, salary) => sum + (salary.bonuses || 0), 0),
  //   totalPenalties: filteredSalaries.reduce((sum, salary) => sum + (salary.penalties || 0), 0),
  // };

  // Prepare chart data
  // const prepareChartData = () => {
  //   if (!filteredSalaries || filteredSalaries.length === 0) {
  //     return {
  //       salaryByUser: [],
  //       salaryComponents: [],
  //       roleDistribution: [],
  //     };
  //   }

  //   // Salary by User
  //   const salaryByUser = filteredSalaries.map(salary => {
  //     const userName = salary.user_details?.full_name ||
  //       users.find(user => user.id === salary.user)?.full_name || `User ${salary.user}`;

  //     return {
  //       name: userName,
  //       totalSalary: salary.total_salary || 0,
  //       fixedSalary: salary.fixed_salary || 0,
  //       orderSalary: salary.order_percentage_salary || 0,
  //       bonuses: salary.bonuses || 0,
  //       penalties: salary.penalties || 0,
  //     };
  //   });

  //   // Salary Components
  //   const salaryComponents = [
  //     { name: t('forms.fixed_salary'), value: summaryStats.totalFixedSalary },
  //     { name: t('forms.order_percentage_salary'), value: summaryStats.totalOrderSalary },
  //     { name: t('forms.bonuses'), value: summaryStats.totalBonuses },
  //     { name: t('forms.penalties'), value: summaryStats.totalPenalties },
  //   ].filter(item => item.value > 0);

  //   // Role Distribution
  //   const roleDistribution = filteredSalaries.reduce((acc, salary) => {
  //     const role = salary.user_details?.role ||
  //       users.find(user => user.id === salary.user)?.role || 'Unknown';

  //     if (!acc[role]) {
  //       acc[role] = { role, count: 0, totalSalary: 0 };
  //     }

  //     acc[role].count += 1;
  //     acc[role].totalSalary += salary.total_salary || 0;

  //     return acc;
  //   }, {} as Record<string, any>);

  //   return {
  //     salaryByUser,
  //     salaryComponents,
  //     roleDistribution: Object.values(roleDistribution),
  //   };
  // };

  // const chartData = prepareChartData();
  // const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t("navigation.monthly_salaries")}
        </h1>
        <div className="flex items-center gap-4">
          <Input
            type="month"
            value={selectedMonth ? selectedMonth.slice(0, 7) : ""}
            onChange={(e) =>
              setSelectedMonth(e.target.value ? `${e.target.value}-01` : "")
            }
            className="w-48"
          />
        </div>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("forms.staff_member")}</CardTitle>
              <CardDescription>
                {t("navigation.monthly_salaries")} - {filteredSalaries.length}{" "}
                {t("forms.staff_member")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSalaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                НЕТ ДАННЫХ
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("forms.user")}</TableHead>
                      <TableHead>{t("forms.date")}</TableHead>

                      {/* <TableHead>{t('forms.role')}</TableHead> */}
                      <TableHead>{t("forms.fixed_salary")}</TableHead>
                      <TableHead>{t("forms.order_percentage")} (%)</TableHead>
                      <TableHead>
                        {t("forms.order_percentage_salary")}
                      </TableHead>
                      <TableHead>{t("forms.penalties")}</TableHead>
                      <TableHead>{t("forms.bonuses")}</TableHead>
                      <TableHead>{t("forms.total_salary")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalaries.map((salary) => {
                      const userName =
                        salary.user_details?.full_name ||
                        users.find((user) => user.id === salary.user)
                          ?.full_name ||
                        `User ${salary.user}`;

                      return (
                        <TableRow key={salary.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              {userName}
                            </div>
                          </TableCell>
                          {/* <TableCell>
                          <Badge variant="secondary">
                            {getUserRoleLabel(userRole)}
                          </Badge>
                        </TableCell> */}
                          <TableCell>{salary.month || 0}</TableCell>
                          <TableCell>
                            {formatNumber(salary.fixed_salary || 0)}
                          </TableCell>
                          <TableCell>{salary.order_percentage || 0}%</TableCell>
                          <TableCell>
                            {formatNumber(salary.order_percentage_salary || 0)}
                          </TableCell>
                          <TableCell className="text-red-600">
                            -{formatNumber(salary.penalties || 0)}
                          </TableCell>
                          <TableCell className="text-green-600">
                            +{formatNumber(salary.bonuses || 0)}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatNumber(salary.total_salary || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
