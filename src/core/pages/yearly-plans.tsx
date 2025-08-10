import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useGetUsers } from "../api/user";
import EditableConsolidatedSalesPlanTable from "@/components/EditableConsolidatedSalesPlanTable";
import {
  useGetYearlyPlans,
  useCreateYearlyPlan,
  useUpdateYearlyPlan,
} from "../api/yearlyPlan";

export default function YearlyPlansPage() {
  const { t } = useTranslation();
  const [selectedUser] = useState<string>("");
  const [selectedYear] = useState<string>("");

  const { data: users } = useGetUsers();
  const { data: yearlyPlans, isLoading } = useGetYearlyPlans({
    params: {
      year: 2025,
    },
  });
  const { mutate: createYearlyPlan } = useCreateYearlyPlan();
  const { mutate: updateYearlyPlan } = useUpdateYearlyPlan();

  const usersList = Array.isArray(users) ? users : users?.results || [];
  const plansList = Array.isArray(yearlyPlans)
    ? yearlyPlans
    : yearlyPlans?.results || [];

  const filteredPlans = plansList.filter((plan) => {
    if (selectedUser && plan.user.id.toString() !== selectedUser) return false;
    if (selectedYear && plan.year.toString() !== selectedYear) return false;
    return true;
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.yearly_plans")}</h1>
      </div>

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
                  clients_plan: parseFloat(String(detail.clients_plan) || "0"),
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
    </div>
  );
}
