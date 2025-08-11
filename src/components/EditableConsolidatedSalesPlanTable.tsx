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
import { Save, X, Edit, Plus, Calendar, Eye } from "lucide-react";
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
  };
  year: number;
  details: SalesPlanDetail[];
}

interface EditableConsolidatedSalesPlanTableProps {
  data: SalesPlanData[];
  year?: number;
  onUpdatePlan?: (planId: number, updatedDetails: SalesPlanDetail[]) => void;
  onCreatePlan?: (plan: Omit<SalesPlanData, "id">) => void;
  users?: Array<{ id: number; full_name: string }>;
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
> = ({ data, year, onUpdatePlan, onCreatePlan, users = [] }) => {
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

  // Helper function to get sales plan value for a specific month and user
  const getSalesPlanForMonth = (
    details: SalesPlanDetail[],
    month: number,
  ): string => {
    const monthDetail = details.find((detail) => detail.month === month);
    return monthDetail ? String(monthDetail.sales_plan) : "0";
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

  // Handle form submission
  const handleSubmit = () => {
    if (!isAdmin) {
      toast.error("You don't have permission to modify plans");
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
            {users.length > 0 && isAdmin && (
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

          if (yearData.length === 0) return null;

          return (
            <Card key={displayYear}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {displayYear} {t("yearly_plans.sales_plans_all_users")}
                  </CardTitle>
                  {isAdmin && (
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
                      <TableRow>
                        <TableHead className="w-32">
                          {t("yearly_plans.user")}
                        </TableHead>
                        {MONTH_NAMES.map((month, index) => (
                          <TableHead
                            key={index}
                            className="text-center min-w-20"
                          >
                            {month}
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
                            className="hover:bg-gray-50"
                          >
                            <TableCell className="font-medium">
                              {plan.user.full_name}
                            </TableCell>
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              const value = getSalesPlanForMonth(
                                plan.details,
                                month,
                              );

                              return (
                                <TableCell key={index} className="text-center">
                                  <span
                                    className="px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                    onClick={() =>
                                      handleMonthClick(plan, month)
                                    }
                                    title={`View daily plans for ${MONTH_NAMES[month - 1]} ${plan.year}`}
                                  >
                                    {parseFloat(value).toLocaleString()}
                                  </span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              <span className="px-2 py-1 bg-green-50 rounded">
                                {total.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewOrEditPlan(plan)}
                                className="h-8 w-8 p-0"
                                title={
                                  isAdmin ? t("common.edit") : t("common.view")
                                }
                              >
                                {isAdmin ? (
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
                            const monthTotal = yearData.reduce((sum, plan) => {
                              const monthValue = parseFloat(
                                getSalesPlanForMonth(plan.details, index + 1) ||
                                  "0",
                              );
                              return sum + monthValue;
                            }, 0);
                            return (
                              <TableCell key={index} className="text-center">
                                <span className="px-2 py-1 bg-blue-100 rounded">
                                  {monthTotal.toLocaleString()}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center">
                            <span className="px-2 py-1 bg-green-100 rounded">
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
                                .toLocaleString()}
                            </span>
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
                : isAdmin
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
                  disabled={modalState.mode === "edit" || !isAdmin}
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
                  disabled={modalState.mode === "edit" || !isAdmin}
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
                    <TableHead className="text-center">
                      {t("yearly_plans.clients_plan")}
                    </TableHead>
                    <TableHead className="text-center">
                      {t("yearly_plans.sales_count_plan")}
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
                          readOnly={!isAdmin}
                        />
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
                          readOnly={!isAdmin}
                        />
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
                          readOnly={!isAdmin}
                        />
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
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <WideDialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              <X className="w-4 h-4 mr-2" />
              {isAdmin ? t("common.cancel") : t("common.close")}
            </Button>
            {isAdmin && (
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
