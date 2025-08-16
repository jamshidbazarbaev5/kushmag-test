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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Target } from "lucide-react";
import { format } from "date-fns";

export default function YearlyPlansPage() {
  const { t } = useTranslation();
  const [selectedUser] = useState<string>("");
  const [selectedYear] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"yearly" | "daily">("yearly");
  const [viewMode, setViewMode] = useState<"planned" | "comparison">("planned");

  const { data: users } = useGetUsers();
  const { data: yearlyPlans, isLoading } = useGetYearlyPlans({
    params: {
      year: 2025,
      ...(selectedRole && { role: selectedRole }),
    },
  });
  const { data: dailyPlans, isLoading: isDailyLoading } = useGetDailyPlans({
    params: {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
      ...(selectedRole && { role: selectedRole }),
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

  // Since role filtering is now handled by the API, we don't need client-side filtering for role
  const filteredDailyPlans = dailyPlansList;

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600 bg-green-50";
    if (percentage >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div>
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
          {/* Filters and View Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Role Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {t("forms.role")}:
                    </span>
                    <Select
                      value={selectedRole || "all"}
                      onValueChange={(value) =>
                        setSelectedRole(value === "all" ? "" : value)
                      }
                    >
                      <SelectTrigger className="h-9 min-w-[150px]">
                        <SelectValue
                          placeholder={t("placeholders.select_role")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        <SelectItem value="ADMIN">
                          {t("roles.admin")}
                        </SelectItem>
                        <SelectItem value="PRODAVEC">
                          {t("roles.prodavec")}
                        </SelectItem>
                        <SelectItem value="MANUFACTURE">
                          {t("roles.manufacture")}
                        </SelectItem>
                        <SelectItem value="ZAMERSHIK">
                          {t("roles.zamershik")}
                        </SelectItem>
                        <SelectItem value="OPERATOR">
                          {t("roles.operator")}
                        </SelectItem>
                        <SelectItem value="SOTRUDNIK">
                          {t("roles.sotrudnik")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {t("yearly_plans.view_mode")}:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "planned" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("planned")}
                        className="flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        {t("yearly_plans.planned_values")}
                      </Button>

                      <Button
                        variant={
                          viewMode === "comparison" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setViewMode("comparison")}
                        className="flex items-center gap-2"
                      >
                        <CalendarIcon className="w-4 h-4" />
                        {t("yearly_plans.comparison_view")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend for comparison view */}
          {viewMode === "comparison" && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-6 text-sm">
                  {/* <span className="font-medium">{t("common.legend")}:</span> */}
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 rounded"></div>
                    <span className="text-blue-600">
                      {t("yearly_plans.planned_values")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-100 rounded"></div>
                    <span className="text-orange-600">
                      {t("yearly_plans.actual_values")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <span className="text-green-600">≥100%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                      <span className="text-yellow-600">75-99%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 rounded"></div>
                      <span className="text-red-600">&lt;75%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consolidated Sales Plans */}
          <div className="space-y-6">
            {isLoading ? (
              <div>{t("common.loading")}</div>
            ) : (
              <EditableConsolidatedSalesPlanTable
                data={filteredPlans}
                year={selectedYear ? parseInt(selectedYear) : undefined}
                viewMode={viewMode}
                onUpdatePlan={(planId, updatedDetails) => {
                  const plan = plansList.find((p) => p.id === planId);
                  if (plan) {
                    updateYearlyPlan({
                      id: planId,
                      user: plan.user.id,
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
                  .filter((user) => !selectedRole || user.role === selectedRole)
                  .map((user) => ({
                    id: user.id!,
                    full_name: user.full_name,
                  }))}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          {/* Date Selector and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {t("daily_plans.select_date")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
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

                {/* Role Filter for Daily Plans */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {t("forms.role")}:
                  </span>
                  <Select
                    value={selectedRole || "all"}
                    onValueChange={(value) =>
                      setSelectedRole(value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-9 min-w-[150px]">
                      <SelectValue
                        placeholder={t("placeholders.select_role")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      <SelectItem value="ADMIN">{t("roles.admin")}</SelectItem>
                      <SelectItem value="PRODAVEC">
                        {t("roles.prodavec")}
                      </SelectItem>
                      <SelectItem value="ZAMERSHIK">
                        {t("roles.zamershik")}
                      </SelectItem>
                      <SelectItem value="OPERATOR">
                        {t("roles.operator")}
                      </SelectItem>
                      <SelectItem value="MANUFACTURE">
                        {t("roles.manufacture")}
                      </SelectItem>
                      <SelectItem value="SOTRUDNIK">
                        {t("roles.sotrudnik")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              ) : filteredDailyPlans.length === 0 ? (
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
                      {filteredDailyPlans.map((plan) => {
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
