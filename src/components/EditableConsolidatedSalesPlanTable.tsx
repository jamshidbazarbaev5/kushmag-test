import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WideDialog,
  WideDialogContent,
  WideDialogHeader,
  WideDialogTitle,
  WideDialogFooter,
} from "@/components/ui/wide-dialog";
import { Save, X, Edit, Plus, Calendar, Eye, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/core/context/AuthContext";

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
  user: {
    id: number;
    full_name: string;
    role?: string;
  };
  year: number;
  details: SalesPlanDetail[];
}

interface EditableConsolidatedSalesPlanTableProps {
  data: SalesPlanData[];
  year?: number;
  viewMode?: "planned" | "actual" | "comparison";
  onUpdatePlan?: (planId: number, updatedDetails: SalesPlanDetail[]) => void;
  onCreatePlan?: (plan: Omit<SalesPlanData, "id">) => void;
  users?: Array<{ id: number; full_name: string; role?: string }>;
}

interface PlanFormData {
  user: number;
  year: number;
  details: SalesPlanDetail[];
}

interface ModalState {
  isOpen: boolean;
  mode: "add" | "edit";
  planId?: number;
  initialData?: PlanFormData;
}

const EditableConsolidatedSalesPlanTable: React.FC<
  EditableConsolidatedSalesPlanTableProps
> = ({
  data,
  year,
  viewMode = "planned",
  onUpdatePlan,
  onCreatePlan,
  users = [],
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: "add",
  });
  const [formData, setFormData] = useState<PlanFormData>({
    user: 0,
    year: year || new Date().getFullYear(),
    details: [],
  });

  // Handle month click to navigate to daily plans
  const handleMonthClick = (plan: SalesPlanData, month: number) => {
    const searchParams = new URLSearchParams({
      year: plan.year.toString(),
      month: month.toString(),
      user: plan.user.id.toString(),
      userName: plan.user.full_name,
    });
    navigate(`/daily-plans?${searchParams.toString()}`);
  };

  // Initialize default plan details
  const getDefaultPlanDetails = (): SalesPlanDetail[] => {
    return Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      sales_plan: 0,
      clients_plan: 0,
      sales_count_plan: 0,
      sales: 0,
      clients: 0,
      sales_count: 0,
      sales_percentage: 0,
      clients_percentage: 0,
      sales_count_percentage: 0,
    }));
  };

  // Helper function to get percentage color for comparison view
  const getComparisonPercentageColor = (percentage: number) => {
    if (percentage >= 100) return "text-green-600 bg-green-50";
    if (percentage >= 75) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  // Helper function to format percentage
  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  // Open modal for adding new plan
  const handleAddPlan = () => {
    const defaultDetails = getDefaultPlanDetails();
    setFormData({
      user: 0,
      year: year || new Date().getFullYear(),
      details: defaultDetails,
    });
    setModalState({
      isOpen: true,
      mode: "add",
    });
  };

  // Open modal for viewing/editing existing plan
  const handleViewOrEditPlan = (plan: SalesPlanData) => {
    const planDetails = plan.details.map((detail) => ({
      month: detail.month,
      sales_plan: detail.sales_plan,
      clients_plan: detail.clients_plan || 0,
      sales_count_plan: detail.sales_count_plan || 0,
      sales: detail.sales || 0,
      clients: detail.clients || 0,
      sales_count: detail.sales_count || 0,
      sales_percentage: detail.sales_percentage || 0,
      clients_percentage: detail.clients_percentage || 0,
      sales_count_percentage: detail.sales_count_percentage || 0,
    }));

    setFormData({
      user: plan.user.id,
      year: plan.year,
      details: planDetails,
    });
    setModalState({
      isOpen: true,
      mode: "edit",
      planId: plan.id,
      initialData: {
        user: plan.user.id,
        year: plan.year,
        details: planDetails,
      },
    });
  };

  // Close modal
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      mode: "add",
    });
    setFormData({
      user: 0,
      year: year || new Date().getFullYear(),
      details: [],
    });
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === "ADMIN";

  // Check if current user is visitor (read-only mode)
  const isVisitor = currentUser?.role === "VISITOR";

  // Determine if user can edit (admin and not visitor)
  const canEdit = isAdmin && !isVisitor;

  // Handle form submission
  const handleSubmit = () => {
    if (!canEdit) {
      return;
    }

    if (formData.user === 0) {
      toast.error("Please select a user");
      return;
    }

    if (modalState.mode === "add" && onCreatePlan) {
      const selectedUser = users.find((u) => u.id === formData.user);
      const newPlan = {
        user: selectedUser || {
          id: formData.user,
          full_name: `User ${formData.user}`,
        },
        year: formData.year,
        details: formData.details.map((detail) => ({
          month: detail.month,
          sales_plan: parseFloat(String(detail.sales_plan)),
          clients_plan: parseFloat(String(detail.clients_plan) || "0"),
          sales_count_plan: parseFloat(String(detail.sales_count_plan) || "0"),
        })),
      };
      onCreatePlan(newPlan);
      toast.success("New yearly plan created successfully");
    } else if (
      modalState.mode === "edit" &&
      onUpdatePlan &&
      modalState.planId
    ) {
      const updatedDetails = formData.details.map((detail) => ({
        month: detail.month,
        sales_plan: parseFloat(String(detail.sales_plan)),
        clients_plan: parseFloat(String(detail.clients_plan) || "0"),
        sales_count_plan: parseFloat(String(detail.sales_count_plan) || "0"),
        sales: detail.sales || 0,
        clients: detail.clients || 0,
        sales_count: detail.sales_count || 0,
        sales_percentage: detail.sales_percentage || 0,
        clients_percentage: detail.clients_percentage || 0,
        sales_count_percentage: detail.sales_count_percentage || 0,
      }));
      onUpdatePlan(modalState.planId, updatedDetails);
      toast.success("Yearly plan updated successfully");
    }

    handleCloseModal();
  };

  // Update form data for specific month and field
  const updateFormDetail = (
    month: number,
    field: keyof SalesPlanDetail,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.map((detail) =>
        detail.month === month ? { ...detail, [field]: value } : detail,
      ),
    }));
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

  // Get users not in current year's plans
  const currentYearData = year ? groupedByYear[year] || [] : [];
  const usersWithPlans = new Set(currentYearData.map((plan) => plan.user.id));
  const availableUsers =
    modalState.mode === "add"
      ? users.filter((user) => !usersWithPlans.has(user.id))
      : users;

  return (
    <div className="space-y-6">
      {displayYears.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">{t("yearly_plans.no_data")}</p>
            {users.length > 0 && canEdit && onCreatePlan && (
              <Button onClick={handleAddPlan}>
                <Plus className="w-4 h-4 mr-2" />
                {t("yearly_plans.add_first_plan")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        displayYears.map((displayYear) => {
          const yearData = groupedByYear[displayYear] || [];

          // Sort yearData by performance for trophy display
          const sortedYearData = [...yearData].sort((a, b) => {
            const totalPlannedA = a.details.reduce(
              (sum, detail) =>
                sum + parseFloat(String(detail.sales_plan) || "0"),
              0,
            );
            const totalActualA = a.details.reduce(
              (sum, detail) => sum + (detail.sales || 0),
              0,
            );
            const performanceA =
              totalPlannedA > 0 ? (totalActualA / totalPlannedA) * 100 : 0;

            const totalPlannedB = b.details.reduce(
              (sum, detail) =>
                sum + parseFloat(String(detail.sales_plan) || "0"),
              0,
            );
            const totalActualB = b.details.reduce(
              (sum, detail) => sum + (detail.sales || 0),
              0,
            );
            const performanceB =
              totalPlannedB > 0 ? (totalActualB / totalPlannedB) * 100 : 0;

            return performanceB - performanceA; // Descending order
          });

          // Function to get trophy icon for top performers
          const getTrophyIcon = (index: number) => {
            if (index === 0)
              return (
                <Trophy className="w-4 h-4 text-yellow-500 fill-current ml-2" />
              );
            if (index === 1)
              return (
                <Trophy className="w-4 h-4 text-gray-400 fill-current ml-2" />
              );
            if (index === 2)
              return (
                <Trophy className="w-4 h-4 text-amber-600 fill-current ml-2" />
              );
            return null;
          };

          if (yearData.length === 0) return null;

          return (
            <Card key={displayYear}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {displayYear} {t("yearly_plans.sales_plans_all_users")} -{" "}
                    {viewMode === "actual"
                      ? t("yearly_plans.actual_values")
                      : viewMode === "comparison"
                        ? t("yearly_plans.comparison_view")
                        : t("yearly_plans.planned_values")}
                  </CardTitle>
                  {canEdit && onCreatePlan && (
                    <Button onClick={handleAddPlan} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      {t("yearly_plans.add_user_plan")}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">
                          {t("yearly_plans.user")}
                        </TableHead>
                        {MONTH_NAMES.map((month, index) => (
                          <TableHead
                            key={index}
                            className={`text-center min-w-24 ${
                              viewMode === "comparison" ? "min-w-32" : ""
                            }`}
                          >
                            {month}
                            {viewMode === "comparison" && (
                              <div className="text-xs text-gray-500 mt-1">
                                План / Фактический / %
                              </div>
                            )}
                          </TableHead>
                        ))}
                        <TableHead className="text-center min-w-24">
                          {t("yearly_plans.total")}
                        </TableHead>
                        <TableHead className="text-center min-w-20">
                          {t("common.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedYearData.map((plan, index) => {
                        // Calculate total for the year
                        const totalPlanned = plan.details.reduce(
                          (sum, detail) => {
                            return (
                              sum + parseFloat(String(detail.sales_plan) || "0")
                            );
                          },
                          0,
                        );

                        const totalActual = plan.details.reduce(
                          (sum, detail) => {
                            return sum + (detail.sales || 0);
                          },
                          0,
                        );

                        const total =
                          viewMode === "actual" ? totalActual : totalPlanned;

                        return (
                          <TableRow
                            key={plan.id || `plan-${plan.user}-${plan.year}`}
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {plan.user.full_name}
                                {plan.user.role === "ADMIN" && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                )}
                                {getTrophyIcon(index)}
                              </div>
                            </TableCell>
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              const monthDetail = plan.details.find(
                                (d) => d.month === month,
                              );
                              const plannedValue = monthDetail
                                ? parseFloat(
                                    String(monthDetail.sales_plan) || "0",
                                  )
                                : 0;
                              const actualValue = monthDetail
                                ? monthDetail.sales || 0
                                : 0;
                              const percentage =
                                plannedValue > 0
                                  ? (actualValue / plannedValue) * 100
                                  : 0;

                              if (viewMode === "comparison") {
                                return (
                                  <TableCell
                                    key={index}
                                    className="text-center"
                                  >
                                    <div className="space-y-1">
                                      <div className="text-xs text-blue-600 font-medium">
                                        {plannedValue.toLocaleString()}
                                      </div>
                                      <div className="text-xs text-orange-600 font-medium">
                                        {actualValue.toLocaleString()}
                                      </div>
                                      <div
                                        className={`text-xs px-1 py-0.5 rounded ${getComparisonPercentageColor(percentage)}`}
                                      >
                                        {formatPercentage(percentage)}
                                      </div>
                                    </div>
                                  </TableCell>
                                );
                              }

                              const value =
                                viewMode === "actual"
                                  ? actualValue
                                  : plannedValue;

                              return (
                                <TableCell key={index} className="text-center">
                                  <span
                                    className={`px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
                                      viewMode === "actual"
                                        ? "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                                        : "hover:bg-blue-50 hover:text-blue-600"
                                    }`}
                                    onClick={() =>
                                      handleMonthClick(plan, month)
                                    }
                                    title={`View daily plans for ${MONTH_NAMES[month - 1]} ${plan.year}`}
                                  >
                                    {value.toLocaleString()}
                                  </span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              {viewMode === "comparison" ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-blue-600 font-medium">
                                    {totalPlanned.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-orange-600 font-medium">
                                    {totalActual.toLocaleString()}
                                  </div>
                                  <div
                                    className={`text-xs px-1 py-0.5 rounded ${getComparisonPercentageColor(totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0)}`}
                                  >
                                    {formatPercentage(
                                      totalPlanned > 0
                                        ? (totalActual / totalPlanned) * 100
                                        : 0,
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span
                                  className={`px-2 py-1 rounded ${
                                    viewMode === "actual"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-green-50"
                                  }`}
                                >
                                  {total.toLocaleString()}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewOrEditPlan(plan)}
                                className="h-8 w-8 p-0"
                                title={
                                  canEdit && onUpdatePlan
                                    ? t("common.edit")
                                    : t("common.view")
                                }
                              >
                                {canEdit && onUpdatePlan ? (
                                  <Edit className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Summary row if multiple users */}
                      {yearData.length > 1 && (
                        <TableRow className="bg-gray-50 font-semibold border-t-2">
                          <TableCell>{t("yearly_plans.total")}</TableCell>
                          {Array.from({ length: 12 }, (_, index) => {
                            const monthTotalPlanned = sortedYearData.reduce(
                              (sum, plan) => {
                                const monthDetail = plan.details.find(
                                  (d) => d.month === index + 1,
                                );
                                if (!monthDetail) return sum;
                                return (
                                  sum +
                                  parseFloat(
                                    String(monthDetail.sales_plan) || "0",
                                  )
                                );
                              },
                              0,
                            );

                            const monthTotalActual = sortedYearData.reduce(
                              (sum, plan) => {
                                const monthDetail = plan.details.find(
                                  (d) => d.month === index + 1,
                                );
                                if (!monthDetail) return sum;
                                return sum + (monthDetail.sales || 0);
                              },
                              0,
                            );

                            if (viewMode === "comparison") {
                              const percentage =
                                monthTotalPlanned > 0
                                  ? (monthTotalActual / monthTotalPlanned) * 100
                                  : 0;
                              return (
                                <TableCell key={index} className="text-center">
                                  <div className="space-y-1">
                                    <div className="text-xs text-blue-600 font-bold">
                                      {monthTotalPlanned.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-orange-600 font-bold">
                                      {monthTotalActual.toLocaleString()}
                                    </div>
                                    <div
                                      className={`text-xs px-1 py-0.5 rounded font-medium ${getComparisonPercentageColor(percentage)}`}
                                    >
                                      {formatPercentage(percentage)}
                                    </div>
                                  </div>
                                </TableCell>
                              );
                            }

                            const monthTotal =
                              viewMode === "actual"
                                ? monthTotalActual
                                : monthTotalPlanned;
                            return (
                              <TableCell key={index} className="text-center">
                                <span
                                  className={`px-2 py-1 rounded ${
                                    viewMode === "actual"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100"
                                  }`}
                                >
                                  {monthTotal.toLocaleString()}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            {viewMode === "comparison" ? (
                              (() => {
                                const grandTotalPlanned = sortedYearData.reduce(
                                  (sum, plan) => {
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
                                  },
                                  0,
                                );

                                const grandTotalActual = sortedYearData.reduce(
                                  (sum, plan) => {
                                    const planTotal = plan.details.reduce(
                                      (planSum, detail) => {
                                        return planSum + (detail.sales || 0);
                                      },
                                      0,
                                    );
                                    return sum + planTotal;
                                  },
                                  0,
                                );

                                const grandPercentage =
                                  grandTotalPlanned > 0
                                    ? (grandTotalActual / grandTotalPlanned) *
                                      100
                                    : 0;

                                return (
                                  <div className="space-y-1">
                                    <div className="text-xs text-blue-600 font-bold">
                                      {grandTotalPlanned.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-orange-600 font-bold">
                                      {grandTotalActual.toLocaleString()}
                                    </div>
                                    <div
                                      className={`text-xs px-1 py-0.5 rounded font-medium ${getComparisonPercentageColor(grandPercentage)}`}
                                    >
                                      {formatPercentage(grandPercentage)}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <span
                                className={`px-2 py-1 rounded ${
                                  viewMode === "actual"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-green-100"
                                }`}
                              >
                                {yearData
                                  .reduce((sum, plan) => {
                                    const planTotal = plan.details.reduce(
                                      (planSum, detail) => {
                                        if (viewMode === "actual") {
                                          return planSum + (detail.sales || 0);
                                        }
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
                                  .toLocaleString()}
                              </span>
                            )}
                          </TableCell>
                          <TableCell></TableCell>
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

      {/* Plan Modal */}
      <WideDialog open={modalState.isOpen} onOpenChange={handleCloseModal}>
        <WideDialogContent
          width="extra-wide"
          className="max-h-[90vh] overflow-y-auto"
        >
          <WideDialogHeader>
            <WideDialogTitle>
              {modalState.mode === "add"
                ? t("yearly_plans.add_new_plan")
                : canEdit && onUpdatePlan
                  ? t("yearly_plans.edit_plan")
                  : t("yearly_plans.view_plan")}
            </WideDialogTitle>
          </WideDialogHeader>

          <div className="space-y-6">
            {/* User and Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user-select">{t("yearly_plans.user")}</Label>
                <Select
                  value={formData.user.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, user: parseInt(value) }))
                  }
                  disabled={modalState.mode === "edit" || !canEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("yearly_plans.select_user")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year-select">{t("yearly_plans.year")}</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      year: parseInt(e.target.value),
                    }))
                  }
                  min="2020"
                  max="2030"
                  disabled={modalState.mode === "edit" || !canEdit}
                />
              </div>
            </div>

            {/* Monthly Plans Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-24">
                      {t("yearly_plans.month")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("yearly_plans.sales_plan")}
                    </TableHead>
                    <TableHead className="text-center bg-blue-50">
                      {t("yearly_plans.sales_actual")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("yearly_plans.clients_plan")}
                    </TableHead>
                    <TableHead className="text-center bg-blue-50">
                      {t("yearly_plans.clients_actual")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("yearly_plans.sales_count_plan")}
                    </TableHead>
                    <TableHead className="text-center bg-blue-50">
                      {t("yearly_plans.sales_count_actual")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.details.map((detail, index) => (
                    <TableRow
                      key={detail.month}
                      className={index % 2 === 0 ? "bg-gray-25" : ""}
                    >
                      <TableCell className="font-medium">
                        {MONTH_NAMES[detail.month - 1]}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={detail.sales_plan}
                          onChange={(e) =>
                            updateFormDetail(
                              detail.month,
                              "sales_plan",
                              e.target.value,
                            )
                          }
                          className="text-center"
                          readOnly={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="bg-blue-25">
                        <div className="text-center py-2 px-3 bg-gray-100 rounded text-sm">
                          {(detail.sales || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={detail.clients_plan || 0}
                          onChange={(e) =>
                            updateFormDetail(
                              detail.month,
                              "clients_plan",
                              e.target.value,
                            )
                          }
                          className="text-center"
                          readOnly={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="bg-blue-25">
                        <div className="text-center py-2 px-3 bg-gray-100 rounded text-sm">
                          {(detail.clients || 0).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={detail.sales_count_plan || 0}
                          onChange={(e) =>
                            updateFormDetail(
                              detail.month,
                              "sales_count_plan",
                              e.target.value,
                            )
                          }
                          className="text-center"
                          readOnly={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="bg-blue-25">
                        <div className="text-center py-2 px-3 bg-gray-100 rounded text-sm">
                          {(detail.sales_count || 0).toLocaleString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Total Row */}
                  <TableRow className=" font-semibold">
                    <TableCell>{t("yearly_plans.total")}</TableCell>
                    <TableCell className="text-center">
                      {formData.details
                        .reduce(
                          (sum, detail) =>
                            sum + parseFloat(String(detail.sales_plan) || "0"),
                          0,
                        )
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center bg-blue-50">
                      {formData.details
                        .reduce((sum, detail) => sum + (detail.sales || 0), 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {formData.details
                        .reduce(
                          (sum, detail) =>
                            sum +
                            parseFloat(String(detail.clients_plan) || "0"),
                          0,
                        )
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center bg-blue-50">
                      {formData.details
                        .reduce((sum, detail) => sum + (detail.clients || 0), 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {formData.details
                        .reduce(
                          (sum, detail) =>
                            sum +
                            parseFloat(String(detail.sales_count_plan) || "0"),
                          0,
                        )
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center bg-blue-50">
                      {formData.details
                        .reduce(
                          (sum, detail) => sum + (detail.sales_count || 0),
                          0,
                        )
                        .toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <WideDialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              <X className="w-4 h-4 mr-2" />
              {canEdit ? t("common.cancel") : t("common.close")}
            </Button>
            {canEdit &&
              (modalState.mode === "add" ? onCreatePlan : onUpdatePlan) && (
                <Button onClick={handleSubmit} disabled={formData.user === 0}>
                  <Save className="w-4 h-4 mr-2" />
                  {modalState.mode === "add"
                    ? t("common.create")
                    : t("common.save")}
                </Button>
              )}
          </WideDialogFooter>
        </WideDialogContent>
      </WideDialog>
    </div>
  );
};

export default EditableConsolidatedSalesPlanTable;
