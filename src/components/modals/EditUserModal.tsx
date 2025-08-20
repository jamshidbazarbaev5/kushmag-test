import React, { useState, useEffect } from "react";
import {
  WideDialog,
  WideDialogContent,
  WideDialogHeader,
  WideDialogTitle,
} from "@/components/ui/wide-dialog";
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
import {
  Save,
  X,
  Edit2,
  User as UserIcon,
  Calendar,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import axios from "axios";
import type { User } from "@/core/api/user";
import {
  useGetSellers,
  useGetOperators,
  useGetZamershiks,
} from "@/core/api/staff";
import {
  useGetYearlyPlans,
  useUpdateYearlyPlan,
  useCreateYearlyPlan,
  type YearlyPlan,
} from "@/core/api/yearlyPlan";

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

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userData: Partial<User>) => void;
  isLoading?: boolean;
}

const MONTH_NAMES_KEYS = [
  "months.january",
  "months.february",
  "months.march",
  "months.april",
  "months.may",
  "months.june",
  "months.july",
  "months.august",
  "months.september",
  "months.october",
  "months.november",
  "months.december",
];

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface EditingCell {
  year: number;
  month: number;
  field: "sales_plan" | "clients_plan" | "sales_count_plan";
  value: string;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<Partial<User>>({});
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_YEAR);
  const [apiStatus, setApiStatus] = useState<
    "idle" | "checking" | "success" | "error"
  >("idle");
  const [_apiMessage, setApiMessage] = useState<string>("");

  // API hooks
  const { data: sellers } = useGetSellers();
  const { data: operators } = useGetOperators();
  const { data: zamershiks } = useGetZamershiks();
  const { data: yearlyPlans } = useGetYearlyPlans({
    params: { user_id: user?.id },
  });
  const { mutate: updateYearlyPlan } = useUpdateYearlyPlan();
  const { mutate: createYearlyPlan } = useCreateYearlyPlan();

  // Get plans data
  const plansList = Array.isArray(yearlyPlans)
    ? yearlyPlans
    : yearlyPlans?.results || [];
  const userPlans = plansList.filter((plan) => plan.user.id === user?.id);

  useEffect(() => {
    if (user) {
      const userData = { ...user };

      // Set the staff_member field if moy_sklad_staff exists
      if (
        userData.moy_sklad_staff &&
        ["PRODAVEC", "OPERATOR", "ZAMERSHIK"].includes(userData.role)
      ) {
        const staffList =
          userData.role === "PRODAVEC"
            ? sellers
            : userData.role === "OPERATOR"
              ? operators
              : zamershiks;
        const staffMember = staffList?.find(
          (staff: any) =>
            staff.meta.href === userData.moy_sklad_staff?.meta.href,
        );
        if (staffMember) {
          userData.staff_member = JSON.stringify(staffMember);
        }
      }

      setFormData(userData);
    }
  }, [user, sellers, operators, zamershiks]);

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as User["role"],
      staff_member: null,
    }));
  };

  const handleSave = () => {
    const dataToSave = { ...formData };

    // Handle staff member data
    if (dataToSave.staff_member) {
      try {
        const staffMember = JSON.parse(dataToSave.staff_member);
        dataToSave.moy_sklad_staff = {
          meta: staffMember.meta,
        };
        delete dataToSave.staff_member;
      } catch {
        console.error("Failed to parse staff member data");
      }
    }

    onSave(dataToSave);
  };

  const getStaffOptions = () => {
    if (!formData.role) return [];

    const staffList =
      formData.role === "PRODAVEC"
        ? sellers
        : formData.role === "OPERATOR"
          ? operators
          : formData.role === "ZAMERSHIK"
            ? zamershiks
            : [];

    return (
      staffList?.map((staff: any) => ({
        label: staff.name,
        value: JSON.stringify(staff),
      })) || []
    );
  };

  const shouldShowStaffField = () => {
    return ["PRODAVEC", "OPERATOR", "ZAMERSHIK"].includes(formData.role || "");
  };

  const checkApiConnection = async () => {
    if (!formData.api_login || !formData.api_password) {
      toast.error(t("messages.error.api_credentials_required"));
      return;
    }

    setApiStatus("checking");
    setApiMessage("");

    try {
      const response = await axios.post(
        "https://kushmag.uz/api/api-check/",
        {
          api_login: formData.api_login,
          api_password: formData.api_password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        },
      );

      if (response.status === 200) {
        setApiStatus("success");
        setApiMessage('Есть соеденение');
        toast.success('Есть соеденение');
      } else {
        setApiStatus("error");
        setApiMessage('Пароль или логин неверно');
        toast.error('Пароль или логин неверно');
      }
    } catch (error: any) {
      setApiStatus("error");
      const errorMessage =
    
       'Пароль или логин неверно'
      setApiMessage(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Yearly plan functions
  const getYearPlan = (year: number): YearlyPlan | null => {
    return userPlans.find((plan) => plan.year === year) || null;
  };

  const getSalesPlanForMonth = (
    plan: YearlyPlan | null,
    month: number,
    field: string,
  ): string => {
    if (!plan) return "0";
    const monthDetail = plan.details.find((detail) => detail.month === month);
    return monthDetail
      ? String(monthDetail[field as keyof SalesPlanDetail] || "0")
      : "0";
  };

  const handleCellEdit = (
    year: number,
    month: number,
    field: "sales_plan" | "clients_plan" | "sales_count_plan",
    currentValue: string,
  ) => {
    setEditingCell({ year, month, field, value: currentValue });
  };

  const handleSaveEdit = () => {
    if (!editingCell || !user?.id) return;

    const existingPlan = getYearPlan(editingCell.year);

    if (existingPlan) {
      // Update existing plan
      const updatedDetails = existingPlan.details.map((detail) => {
        if (detail.month === editingCell.month) {
          return { ...detail, [editingCell.field]: editingCell.value };
        }
        return detail;
      });

      // If month doesn't exist, add it
      if (
        !existingPlan.details.find(
          (detail) => detail.month === editingCell.month,
        )
      ) {
        updatedDetails.push({
          month: editingCell.month,
          sales_plan:
            editingCell.field === "sales_plan" ? editingCell.value : "0",
          clients_plan:
            editingCell.field === "clients_plan" ? editingCell.value : "0",
          sales_count_plan:
            editingCell.field === "sales_count_plan" ? editingCell.value : "0",
        });
      }

      updateYearlyPlan({
        id: existingPlan.id!,
        user: user.id!,
        year: editingCell.year,
        details: updatedDetails.map((detail) => ({
          month: detail.month,
          sales_plan: parseFloat(String(detail.sales_plan)),
          clients_plan: parseFloat(String(detail.clients_plan) || "0"),
          sales_count_plan: parseFloat(String(detail.sales_count_plan) || "0"),
        })),
      });
    } else {
      // Create new plan
      const details = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        sales_plan: 0,
        clients_plan: 0,
        sales_count_plan: 0,
      }));

      // Set the edited value
      const monthIndex = editingCell.month - 1;
      details[monthIndex] = {
        ...details[monthIndex],
        [editingCell.field]: parseFloat(editingCell.value) || 0,
      };

      createYearlyPlan({
        user: user.id,
        year: editingCell.year,
        details,
      });
    }

    setEditingCell(null);
    toast.success(
      t("messages.success.updated", { item: t("navigation.yearly_plans") }),
    );
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  const calculateYearTotal = (year: number, field: string): number => {
    const plan = getYearPlan(year);
    if (!plan) return 0;

    return plan.details.reduce((sum, detail) => {
      return (
        sum + parseFloat(String(detail[field as keyof SalesPlanDetail]) || "0")
      );
    }, 0);
  };

  if (!user) return null;

  return (
    <WideDialog open={isOpen} onOpenChange={onClose}>
      <WideDialogContent
        width="extra-wide"
        className="max-h-[90vh] overflow-y-auto"
      >
        <WideDialogHeader>
          <WideDialogTitle className="flex items-center space-x-2">
            <UserIcon className="w-5 h-5" />
            <span>
              {t("actions.edit")} {t("navigation.users")}: {user.full_name}
            </span>
          </WideDialogTitle>
        </WideDialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="profile"
              className="flex items-center space-x-2"
            >
              <UserIcon className="w-4 h-4" />
              <span>{t("forms.user")}</span>
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{t("navigation.yearly_plans")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("forms.user")} {t("common.information")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">{t("forms.username")}</Label>
                  <Input
                    id="username"
                    value={formData.username || ""}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    placeholder={t("placeholders.enter_username")}
                  />
                </div>

                <div>
                  <Label htmlFor="full_name">{t("forms.full_name")}</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ""}
                    onChange={(e) =>
                      handleInputChange("full_name", e.target.value)
                    }
                    placeholder={t("placeholders.enter_full_name")}
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number">
                    {t("forms.phone_number")}
                  </Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number || ""}
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                    placeholder={t("placeholders.enter_phone_number")}
                  />
                </div>

                <div>
                  <Label htmlFor="role">{t("forms.role")}</Label>
                  <Select
                    value={formData.role || ""}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("placeholders.select_role")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t("roles.admin")}</SelectItem>
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

                {shouldShowStaffField() && (
                  <div>
                    <Label htmlFor="staff_member">
                      {t("forms.staff_member")}
                    </Label>
                    <Select
                      value={formData.staff_member || ""}
                      onValueChange={(value) =>
                        handleInputChange("staff_member", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("placeholders.select_staff_member")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getStaffOptions().map((option: any) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="api_login">{t("forms.api_login")}</Label>
                  <Input
                    id="api_login"
                    value={formData.api_login || ""}
                    onChange={(e) =>
                      handleInputChange("api_login", e.target.value)
                    }
                    placeholder={t("placeholders.enter_api_login")}
                  />
                </div>

                <div>
                  <Label htmlFor="api_password">
                    {t("forms.api_password")}
                  </Label>
                  <Input
                    id="api_password"
                    type="password"
                    value={formData.api_password || ""}
                    onChange={(e) =>
                      handleInputChange("api_password", e.target.value)
                    }
                    placeholder={t("placeholders.enter_api_password")}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={checkApiConnection}
                      disabled={
                        apiStatus === "checking" ||
                        !formData.api_login ||
                        !formData.api_password
                      }
                      className="flex items-center space-x-2"
                    >
                      {apiStatus === "checking" && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      {apiStatus === "success" && (
                        <Wifi className="w-4 h-4 text-green-600" />
                      )}
                      {apiStatus === "error" && (
                        <WifiOff className="w-4 h-4 text-red-600" />
                      )}
                      {apiStatus === "idle" && <Wifi className="w-4 h-4" />}
                      <span>
                        {apiStatus === "checking"
                          ? t("common.checking")
                          : t("forms.check_api_connection")}
                      </span>
                    </Button>

                    {apiStatus === "success" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      
                      </div>
                    )}

                    {apiStatus === "error" && (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                       
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="fixed_salary">
                    {t("forms.fixed_salary")}
                  </Label>
                  <Input
                    id="fixed_salary"
                    type="number"
                    value={formData.fixed_salary || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "fixed_salary",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder={t("placeholders.enter_fixed_salary")}
                  />
                </div>

                <div>
                  <Label htmlFor="order_percentage">
                    {t("forms.order_percentage")}
                  </Label>
                  <Input
                    id="order_percentage"
                    type="number"
                    value={formData.order_percentage || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "order_percentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    placeholder={t("placeholders.enter_order_percentage")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{t("navigation.yearly_plans")}</CardTitle>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Sales Plan Table */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      {t("forms.sales_plan")}
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {MONTH_NAMES_KEYS.map((monthKey) => (
                              <TableHead
                                key={monthKey}
                                className="text-center min-w-20"
                              >
                                {t(monthKey).substring(0, 3)}
                              </TableHead>
                            ))}
                            <TableHead className="text-center min-w-24">
                              {t("common.total")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              const plan = getYearPlan(selectedYear);
                              const value = getSalesPlanForMonth(
                                plan,
                                month,
                                "sales_plan",
                              );
                              const isEditing =
                                editingCell?.year === selectedYear &&
                                editingCell?.month === month &&
                                editingCell?.field === "sales_plan";

                              return (
                                <TableCell
                                  key={index}
                                  className="text-center p-1"
                                >
                                  {isEditing ? (
                                    <div className="flex items-center space-x-1">
                                      <Input
                                        value={editingCell.value}
                                        onChange={(e) =>
                                          setEditingCell({
                                            ...editingCell,
                                            value: e.target.value,
                                          })
                                        }
                                        className="w-20 h-8 text-center"
                                        type="number"
                                        step="0.01"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleSaveEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Save className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center justify-center space-x-1 cursor-pointer hover:bg-gray-50 p-1 rounded group"
                                      onClick={() =>
                                        handleCellEdit(
                                          selectedYear,
                                          month,
                                          "sales_plan",
                                          value,
                                        )
                                      }
                                    >
                                      <span>{value}</span>
                                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              {calculateYearTotal(
                                selectedYear,
                                "sales_plan",
                              ).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Clients Plan Table */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      {t("forms.clients_plan")}
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {MONTH_NAMES_KEYS.map((monthKey) => (
                              <TableHead
                                key={monthKey}
                                className="text-center min-w-20"
                              >
                                {t(monthKey).substring(0, 3)}
                              </TableHead>
                            ))}
                            <TableHead className="text-center min-w-24">
                              {t("common.total")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              const plan = getYearPlan(selectedYear);
                              const value = getSalesPlanForMonth(
                                plan,
                                month,
                                "clients_plan",
                              );
                              const isEditing =
                                editingCell?.year === selectedYear &&
                                editingCell?.month === month &&
                                editingCell?.field === "clients_plan";

                              return (
                                <TableCell
                                  key={index}
                                  className="text-center p-1"
                                >
                                  {isEditing ? (
                                    <div className="flex items-center space-x-1">
                                      <Input
                                        value={editingCell.value}
                                        onChange={(e) =>
                                          setEditingCell({
                                            ...editingCell,
                                            value: e.target.value,
                                          })
                                        }
                                        className="w-20 h-8 text-center"
                                        type="number"
                                        step="0.01"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleSaveEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Save className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center justify-center space-x-1 cursor-pointer hover:bg-gray-50 p-1 rounded group"
                                      onClick={() =>
                                        handleCellEdit(
                                          selectedYear,
                                          month,
                                          "clients_plan",
                                          value,
                                        )
                                      }
                                    >
                                      <span>{value}</span>
                                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              {calculateYearTotal(
                                selectedYear,
                                "clients_plan",
                              ).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Sales Count Plan Table */}
                  <div>
                    <h4 className="font-semibold mb-2">
                      {t("forms.sales_count_plan")}
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {MONTH_NAMES_KEYS.map((monthKey) => (
                              <TableHead
                                key={monthKey}
                                className="text-center min-w-20"
                              >
                                {t(monthKey).substring(0, 3)}
                              </TableHead>
                            ))}
                            <TableHead className="text-center min-w-24">
                              {t("common.total")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              const plan = getYearPlan(selectedYear);
                              const value = getSalesPlanForMonth(
                                plan,
                                month,
                                "sales_count_plan",
                              );
                              const isEditing =
                                editingCell?.year === selectedYear &&
                                editingCell?.month === month &&
                                editingCell?.field === "sales_count_plan";

                              return (
                                <TableCell
                                  key={index}
                                  className="text-center p-1"
                                >
                                  {isEditing ? (
                                    <div className="flex items-center space-x-1">
                                      <Input
                                        value={editingCell.value}
                                        onChange={(e) =>
                                          setEditingCell({
                                            ...editingCell,
                                            value: e.target.value,
                                          })
                                        }
                                        className="w-20 h-8 text-center"
                                        type="number"
                                        step="0.01"
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleSaveEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Save className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleCancelEdit}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center justify-center space-x-1 cursor-pointer hover:bg-gray-50 p-1 rounded group"
                                      onClick={() =>
                                        handleCellEdit(
                                          selectedYear,
                                          month,
                                          "sales_count_plan",
                                          value,
                                        )
                                      }
                                    >
                                      <span>{value}</span>
                                      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              {calculateYearTotal(
                                selectedYear,
                                "sales_count_plan",
                              ).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </WideDialogContent>
    </WideDialog>
  );
};

export default EditUserModal;
