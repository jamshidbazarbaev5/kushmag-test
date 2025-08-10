import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetDailyPlans, type DailyPlanResponse } from "../api/dailyPlan";
import { t } from "i18next";
const MONTH_NAMES = [
  t("months.january"),
  t("months.february"),
  t("months.march"),
  t("months.april"),
  t("months.may"),
  t("months.june"),
  t("months.july"),
  t("months.august"),
  t("months.september"),
  t("months.october"),
  t("months.november"),
  t("months.december"),
];

export default function DailyPlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const userId = searchParams.get("user");
  const userName = searchParams.get("userName");

  const { data: dailyPlans, isLoading } = useGetDailyPlans({
    params: {
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
      user: userId ? parseInt(userId) : undefined,
    },
  });

  const planData = Array.isArray(dailyPlans)
    ? dailyPlans[0]
    : (dailyPlans as unknown as DailyPlanResponse);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "2-digit",
  });
};

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600 bg-green-50";
    if (percentage >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/yearly-plans")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">{t("daily_plans.no_data")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/yearly-plans")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("navigation.daily_plans")}
            </h1>
            <p className="text-gray-600">
              {userName || (planData as DailyPlanResponse)?.user?.full_name} -{" "}
              {MONTH_NAMES[parseInt(month!) - 1]} {year}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("daily_plans.daily_breakdown")}</span>
            <div className="text-sm font-normal text-gray-600">
              {(planData as DailyPlanResponse)?.details?.length || 0}{" "}
              {t("daily_plans.days")}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">
                    {t("daily_plans.date")}
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
                {(planData as DailyPlanResponse)?.details?.map(
                  (detail, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {formatDate(detail.date)}
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
                          {formatPercentage(detail.sales_count_percentage)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Section */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {t("daily_plans.total_sales")}
                  </h3>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-blue-600">
                      {(planData as DailyPlanResponse)?.details
                        ?.reduce((sum, detail) => sum + detail.sales, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t("daily_plans.plan")}:{" "}
                      {(planData as DailyPlanResponse)?.details
                        ?.reduce((sum, detail) => sum + detail.sales_plan, 0)
                        .toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {t("daily_plans.total_clients")}
                  </h3>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-green-600">
                      {(planData as DailyPlanResponse)?.details?.reduce(
                        (sum, detail) => sum + detail.clients,
                        0,
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t("daily_plans.plan")}:{" "}
                      {(planData as DailyPlanResponse)?.details?.reduce(
                        (sum, detail) => sum + detail.clients_plan,
                        0,
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {t("daily_plans.total_sales_count")}
                  </h3>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-purple-600">
                      {(planData as DailyPlanResponse)?.details?.reduce(
                        (sum, detail) => sum + detail.sales_count,
                        0,
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t("daily_plans.plan")}:{" "}
                      {(planData as DailyPlanResponse)?.details?.reduce(
                        (sum, detail) => sum + detail.sales_count_plan,
                        0,
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
