import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetUsers } from "../api/user";
import EditableConsolidatedSalesPlanTable from "@/components/EditableConsolidatedSalesPlanTable";
import {
  useGetYearlyPlans,
  useCreateYearlyPlan,
  useUpdateYearlyPlan,
} from "../api/yearlyPlan";
import { useGetDailyPlans, type DailyPlanResponse } from "../api/dailyPlan";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function YearlyPlansPage() {
  const { t } = useTranslation();
  const [selectedUser] = useState<string>("");
  const [selectedYear] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"yearly" | "daily">("yearly");

  const { data: users } = useGetUsers();
  const { data: yearlyPlans, isLoading } = useGetYearlyPlans({
    params: {
      year: 2025,
    },
  });
  const { data: dailyPlans, isLoading: isDailyLoading } = useGetDailyPlans({
    params: {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
    },
  });
  const { mutate: createYearlyPlan } = useCreateYearlyPlan();
  const { mutate: updateYearlyPlan } = useUpdateYearlyPlan();

  const usersList = Array.isArray(users) ? users : users?.results || [];
  const plansList = Array.isArray(yearlyPlans)
    ? yearlyPlans
    : yearlyPlans?.results || [];
  const dailyPlansList: DailyPlanResponse[] = Array.isArray(dailyPlans)
    ? dailyPlans
    : [];

  const filteredPlans = plansList.filter((plan) => {
    if (selectedUser && plan.user.id.toString() !== selectedUser) return false;
    if (selectedYear && plan.year.toString() !== selectedYear) return false;
    return true;
  });

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600 bg-green-50";
    if (percentage >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.yearly_plans")}</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "yearly" | "daily")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="yearly">
            {t("navigation.yearly_plans")}
          </TabsTrigger>
          <TabsTrigger value="daily">{t("navigation.daily_plans")}</TabsTrigger>
        </TabsList>

        <TabsContent value="yearly" className="space-y-6">
          {/* Filters
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("common.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="user-filter">{t("yearly_plans.user")}</Label>
              <Select
                value={selectedUser || undefined}
                onValueChange={(value) => setSelectedUser(value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("yearly_plans.all_users")} />
                </SelectTrigger>
                <SelectContent>
                  {usersList.map((user) => (
                    <SelectItem key={user.id} value={user.id!.toString()}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedUser && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser("")}
                  className="mt-2"
                >
                  {t("common.clear_filters")}
                </Button>
              )}
            </div>
            <div>
              <Label htmlFor="year-filter">{t("yearly_plans.year")}</Label>
              <Select
                value={selectedYear || undefined}
                onValueChange={(value) => setSelectedYear(value || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("yearly_plans.all_years")} />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedYear && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedYear("")}
                  className="mt-2"
                >
                  {t("common.clear_filters")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card> */}

          {/* Consolidated Sales Plans */}
          <div className="space-y-6">
            {isLoading ? (
              <div>{t("common.loading")}</div>
            ) : (
              <EditableConsolidatedSalesPlanTable
                data={filteredPlans}
                year={selectedYear ? parseInt(selectedYear) : undefined}
                onUpdatePlan={(planId, updatedDetails) => {
                  const plan = plansList.find((p) => p.id === planId);
                  if (plan) {
                    updateYearlyPlan({
                      id: planId,
                      user: plan.user,
                      year: plan.year,
                      details: updatedDetails.map((detail) => ({
                        month: detail.month,
                        sales_plan: parseFloat(String(detail.sales_plan)),
                        clients_plan: parseFloat(
                          String(detail.clients_plan) || "0",
                        ),
                        sales_count_plan: parseFloat(
                          String(detail.sales_count_plan) || "0",
                        ),
                      })),
                    });
                  }
                }}
                onCreatePlan={(newPlan) => {
                  createYearlyPlan({
                    user: newPlan.user.id,
                    year: newPlan.year,
                    details: newPlan.details.map((detail) => ({
                      month: detail.month,
                      sales_plan: parseFloat(String(detail.sales_plan)),
                      clients_plan: parseFloat(
                        String(detail.clients_plan) || "0",
                      ),
                      sales_count_plan: parseFloat(
                        String(detail.sales_count_plan) || "0",
                      ),
                    })),
                  });
                }}
                users={usersList
                  .filter((user) => user.id !== undefined)
                  .map((user) => ({
                    id: user.id!,
                    full_name: user.full_name,
                  }))}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          {/* Date Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {t("daily_plans.select_date")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(new Date())}
                >
                  {t("daily_plans.today")}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {t("daily_plans.selected_date")}:{" "}
                {format(selectedDate, "dd/MM/yyyy")}
              </p>
            </CardContent>
          </Card>

          {/* Daily Plans Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("daily_plans.daily_breakdown")} -{" "}
                {format(selectedDate, "dd/MM/yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isDailyLoading ? (
                <div className="text-center py-8">
                  <div className="text-lg">{t("common.loading")}</div>
                </div>
              ) : dailyPlansList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">{t("daily_plans.no_data")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-48">
                          {t("daily_plans.user")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.sales_plan")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.sales_actual")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.sales_percentage")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.clients_plan")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.clients_actual")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.clients_percentage")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.sales_count_plan")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.sales_count_actual")}
                        </TableHead>
                        <TableHead className="text-center">
                          {t("daily_plans.sales_count_percentage")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyPlansList.map((plan) => {
                        const detail = plan.details[0]; // Since we're getting data for a single day
                        return (
                          <TableRow key={plan.user.id}>
                            <TableCell className="font-medium">
                              {plan.user.full_name}
                            </TableCell>

                            {/* Sales */}
                            <TableCell className="text-center">
                              {detail.sales_plan.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {detail.sales.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getPercentageColor(
                                  detail.sales_percentage,
                                )}`}
                              >
                                {formatPercentage(detail.sales_percentage)}
                              </span>
                            </TableCell>

                            {/* Clients */}
                            <TableCell className="text-center">
                              {detail.clients_plan}
                            </TableCell>
                            <TableCell className="text-center">
                              {detail.clients}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getPercentageColor(
                                  detail.clients_percentage,
                                )}`}
                              >
                                {formatPercentage(detail.clients_percentage)}
                              </span>
                            </TableCell>

                            {/* Sales Count */}
                            <TableCell className="text-center">
                              {detail.sales_count_plan}
                            </TableCell>
                            <TableCell className="text-center">
                              {detail.sales_count}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getPercentageColor(
                                  detail.sales_count_percentage,
                                )}`}
                              >
                                {formatPercentage(
                                  detail.sales_count_percentage,
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
