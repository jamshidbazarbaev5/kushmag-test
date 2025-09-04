import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { useGetAllUsers } from "../api/user";
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

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Filter,
  Activity,
  Trophy,
  // Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import {
  // PerformanceRating,
  PerformanceGauge,
} from "@/components/PerformanceIndicators";

export default function YearlyPlansPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [_filtersRestoredFromStorage, setFiltersRestoredFromStorage] =
    useState(false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === "ADMIN";

  // localStorage key for filter persistence
  const FILTERS_STORAGE_KEY = "yearly-plans-filters";

  // Helper functions for localStorage management
  const saveFiltersToStorage = (filters: Record<string, string>) => {
    try {
      const existingFilters = JSON.parse(
        localStorage.getItem(FILTERS_STORAGE_KEY) || "{}",
      );
      const updatedFilters = {
        ...existingFilters,
        ...filters,
        _timestamp: new Date().toISOString(),
        _savedAt: Date.now().toString(),
      };
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(updatedFilters));
    } catch (error) {
      console.error("Failed to save filters to localStorage:", error);
    }
  };

  const getFiltersFromStorage = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) || "{}");
    } catch (error) {
      console.error("Failed to load filters from localStorage:", error);
      return {};
    }
  };

  // Helper functions for URL parameter management
  const getUrlParam = (key: string, defaultValue: string = "") => {
    return searchParams.get(key) || defaultValue;
  };

  const updateUrlParam = useCallback(
    (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      setSearchParams(newParams, { replace: true });

      // Also save to localStorage
      saveFiltersToStorage({ [key]: value });
    },
    [searchParams, setSearchParams],
  );

  // Get filter values with localStorage fallback
  const storageFilters = getFiltersFromStorage();
  const selectedUser = getUrlParam("user") || storageFilters.user || "";
  const selectedYear =
    getUrlParam("year") ||
    storageFilters.year ||
    new Date().getFullYear().toString();
  const selectedRole = getUrlParam("role") || storageFilters.role || "";
  const activeTab = (getUrlParam("tab") || storageFilters.tab || "yearly") as
    | "yearly"
    | "daily";
  const viewMode = (getUrlParam("view") || storageFilters.view || "planned") as
    | "planned"
    | "comparison";
  const userSearchTerm = getUrlParam("search") || storageFilters.search || "";

  // Date handling - convert URL date string back to Date object
  const urlDate = getUrlParam("date") || storageFilters.date;
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (urlDate) {
      const parsedDate = new Date(urlDate);
      return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    }
    return new Date();
  });

  // Update URL when date changes
  useEffect(() => {
    updateUrlParam("date", selectedDate.toISOString().split("T")[0]);
  }, [selectedDate, updateUrlParam]);

  // Initialize URL parameters from localStorage on first load (if no URL params exist)
  useEffect(() => {
    const hasUrlParams = Array.from(searchParams.keys()).length > 0;
    if (!hasUrlParams) {
      const savedFilters = getFiltersFromStorage();
      if (Object.keys(savedFilters).length > 0) {
        const newParams = new URLSearchParams();
        Object.entries(savedFilters).forEach(([key, value]) => {
          if (value) {
            newParams.set(key, value);
          }
        });
        // Set defaults if not in storage
        if (!savedFilters.year) {
          newParams.set("year", new Date().getFullYear().toString());
        }
        if (!savedFilters.tab) {
          newParams.set("tab", "yearly");
        }
        if (!savedFilters.view) {
          newParams.set("view", "planned");
        }
        if (!savedFilters.date) {
          newParams.set("date", new Date().toISOString().split("T")[0]);
        }
        setSearchParams(newParams, { replace: true });
        setFiltersRestoredFromStorage(true);
      }
    }
  }, [setSearchParams, searchParams]);

  // Functions to update filters and URL
  const setSelectedYear = (year: string) => {
    updateUrlParam("year", year);
  };

  const setSelectedRole = (role: string) => {
    updateUrlParam("role", role);
  };

  const setActiveTab = (tab: "yearly" | "daily") => {
    updateUrlParam("tab", tab);
  };

  const setViewMode = (mode: "planned" | "comparison") => {
    updateUrlParam("view", mode);
  };

  const setUserSearchTerm = (term: string) => {
    updateUrlParam("search", term);
  };





  const { data: users } = useGetAllUsers();
  const { data: yearlyPlans, isLoading } = useGetYearlyPlans({
    params: {
      year: parseInt(selectedYear),
      ...(isAdmin && selectedRole && { role: selectedRole }),
    },
  });
  const { data: dailyPlans, isLoading: isDailyLoading } = useGetDailyPlans({
    params: {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth() + 1,
      day: selectedDate.getDate(),
      ...(isAdmin && selectedRole && { role: selectedRole }),
    },
  });
  const { mutate: createYearlyPlan } = useCreateYearlyPlan();
  const { mutate: updateYearlyPlan } = useUpdateYearlyPlan();

  const usersList = users || [];
  const plansList = Array.isArray(yearlyPlans)
    ? yearlyPlans
    : yearlyPlans?.results || [];
  const dailyPlansList: DailyPlanResponse[] = Array.isArray(dailyPlans)
    ? dailyPlans
    : [];

  const filteredPlans = plansList.filter((plan) => {
    if (selectedUser && plan.user.id.toString() !== selectedUser) return false;
    if (selectedYear && plan.year.toString() !== selectedYear) return false;
    if (
      userSearchTerm &&
      !plan.user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Since role filtering is now handled by the API, we don't need client-side filtering for role
  // But we still apply user search filtering on the client side
  const filteredDailyPlans = dailyPlansList.filter((plan) => {
    if (
      userSearchTerm &&
      !plan.user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  // Sort daily plans by overall performance for trophy display
  const sortedDailyPlans = [...filteredDailyPlans].sort((a, b) => {
    const detailA = a.details[0];
    const detailB = b.details[0];

    // Calculate overall performance score (average of all percentages)
    const performanceA =
      ((detailA?.sales_percentage || 0) +
        (detailA?.clients_percentage || 0) +
        (detailA?.sales_count_percentage || 0)) /
      3;

    const performanceB =
      ((detailB?.sales_percentage || 0) +
        (detailB?.clients_percentage || 0) +
        (detailB?.sales_count_percentage || 0)) /
      3;

    return performanceB - performanceA; // Descending order
  });

  // Function to get trophy icon for top performers
  const getTrophyIcon = (index: number) => {
    if (index === 0)
      return <Trophy className="w-4 h-4 text-yellow-500 fill-current" />;
    if (index === 1)
      return <Trophy className="w-4 h-4 text-gray-400 fill-current" />;
    if (index === 2)
      return <Trophy className="w-4 h-4 text-amber-600 fill-current" />;
    return null;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getPerformanceBadgeVariant = (percentage: number) => {
    if (percentage >= 100) return "default";
    if (percentage >= 75) return "secondary";
    return "secondary";
  };

  // Calculate enhanced summary statistics
  const calculateEnhancedStats = () => {
    const totalUsers = filteredPlans.length;
    const totalPlannedSales = filteredPlans.reduce(
      (sum, plan) =>
        sum +
        plan.details.reduce(
          (planSum, detail) =>
            planSum + parseFloat(String(detail.sales_plan) || "0"),
          0,
        ),
      0,
    );

    const totalActualSales = filteredPlans.reduce(
      (sum, plan) =>
        sum +
        plan.details.reduce(
          (planSum, detail) => planSum + (detail.sales || 0),
          0,
        ),
      0,
    );

    const overallPerformance =
      totalPlannedSales > 0 ? (totalActualSales / totalPlannedSales) * 100 : 0;

    const highPerformers = filteredPlans.filter((plan) => {
      const planTotal = plan.details.reduce(
        (sum, detail) => sum + (detail.sales || 0),
        0,
      );
      const plannedTotal = plan.details.reduce(
        (sum, detail) => sum + parseFloat(String(detail.sales_plan) || "0"),
        0,
      );
      return plannedTotal > 0 && (planTotal / plannedTotal) * 100 >= 100;
    }).length;

    const averagePerformance =
      filteredPlans.length > 0
        ? filteredPlans.reduce((sum, plan) => {
            const planTotal = plan.details.reduce(
              (acc, detail) => acc + (detail.sales || 0),
              0,
            );
            const plannedTotal = plan.details.reduce(
              (acc, detail) =>
                acc + parseFloat(String(detail.sales_plan) || "0"),
              0,
            );
            const performance =
              plannedTotal > 0 ? (planTotal / plannedTotal) * 100 : 0;
            return sum + performance;
          }, 0) / filteredPlans.length
        : 0;

    // Calculate trend for the last 3 months
    const currentMonth = new Date().getMonth() + 1;
    const trendMonths = Math.min(currentMonth, 3);
    const recentPerformance = filteredPlans.map((plan) => {
      const recentDetails = plan.details
        .filter(
          (d) =>
            d.month <= currentMonth && d.month > currentMonth - trendMonths,
        )
        .reduce(
          (acc, detail) => ({
            planned: acc.planned + parseFloat(String(detail.sales_plan) || "0"),
            actual: acc.actual + (detail.sales || 0),
          }),
          { planned: 0, actual: 0 },
        );

      return recentDetails.planned > 0
        ? (recentDetails.actual / recentDetails.planned) * 100
        : 0;
    });

    const recentAverage =
      recentPerformance.length > 0
        ? recentPerformance.reduce((sum, perf) => sum + perf, 0) /
          recentPerformance.length
        : 0;

    return {
      totalUsers,
      totalPlannedSales,
      totalActualSales,
      overallPerformance,
      highPerformers,
      averagePerformance,
      recentAverage,
      performanceTrend: recentAverage - averagePerformance,
      topPerformer: filteredPlans.reduce(
        (top, plan) => {
          const planTotal = plan.details.reduce(
            (sum, detail) => sum + (detail.sales || 0),
            0,
          );
          const plannedTotal = plan.details.reduce(
            (sum, detail) => sum + parseFloat(String(detail.sales_plan) || "0"),
            0,
          );
          const performance =
            plannedTotal > 0 ? (planTotal / plannedTotal) * 100 : 0;

          if (!top || performance > top.performance) {
            return { user: plan.user.full_name, performance };
          }
          return top;
        },
        null as { user: string; performance: number } | null,
      ),
    };
  };

  const enhancedStats = calculateEnhancedStats();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("navigation.yearly_plans")}
            </h1>
            {/* Active filters summary */}
          
          </div>
        
        </div>

       

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Users - Only show for admin users */}
          {isAdmin && (
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Всего пользователей
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {enhancedStats.totalUsers}
                    </p>
                    {/* <p className="text-xs text-blue-600 mt-1">Active users</p> */}
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Планируемые продажи
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enhancedStats.totalPlannedSales.toLocaleString()}
                  </p>
                  {/* <p className="text-xs text-green-600 mt-1">Target amount</p> */}
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Фактические продажи
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {enhancedStats.totalActualSales.toLocaleString()}
                  </p>
                  {/* <p className="text-xs text-purple-600 mt-1">
                    Achieved amount
                  </p> */}
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Выполнение
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {enhancedStats.overallPerformance.toFixed(1)}%
                    </p>
                    {enhancedStats.performanceTrend >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
                <PerformanceGauge
                  percentage={enhancedStats.overallPerformance}
                  size={50}
                  strokeWidth={4}
                  showValue={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* High Performers - Only show for admin users */}
          {isAdmin && (
            <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("forms.high_performers")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {enhancedStats.highPerformers}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">
                      ≥100% {t("forms.achievment")}
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Performer Highlight - Only show for admin users */}
        {/* {isAdmin && enhancedStats.topPerformer && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      🏆 {t("forms.top_performer")}
                    </p>
                    <p className="text-lg font-bold text-yellow-900">
                      {enhancedStats.topPerformer.user} -{" "}
                      {enhancedStats.topPerformer.performance.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <PerformanceRating
                    percentage={enhancedStats.topPerformer.performance}
                    maxStars={5}
                    size="md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "yearly" | "daily")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger
            value="yearly"
            className="flex items-center gap-2 text-base"
          >
            <BarChart3 className="w-4 h-4" />
            {t("navigation.yearly_plans")}
          </TabsTrigger>
          <TabsTrigger
            value="daily"
            className="flex items-center gap-2 text-base"
          >
            <CalendarIcon className="w-4 h-4" />
            {t("navigation.daily_plans")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yearly" className="space-y-6">
          {/* Enhanced Filters and Controls */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="w-5 h-5" />
                {/* Filters & Controls */}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
             

              {/* Active Filters Indicator */}
              {(selectedRole ||
                userSearchTerm ||
                selectedYear !== new Date().getFullYear().toString() ||
                viewMode !== "planned") && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-800">
                 Активные фильтри
                  </span>
                  {selectedYear !== new Date().getFullYear().toString() && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 flex items-center gap-1"
                    >
                      Year: {selectedYear}
                      <button
                        onClick={() =>
                          setSelectedYear(new Date().getFullYear().toString())
                        }
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                        aria-label="Clear year filter"
                      >
                        ✕
                      </button>
                    </Badge>
                  )}
                  {selectedRole && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 flex items-center gap-1"
                    >
                      {t('forms.role')}:{" "}
                      {t(`roles.${selectedRole.toLowerCase()}`, selectedRole)}
                      <button
                        onClick={() => setSelectedRole("")}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                        aria-label="Clear role filter"
                      >
                        ✕
                      </button>
                    </Badge>
                  )}
                  {userSearchTerm && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 flex items-center gap-1"
                    >
                      Search: "{userSearchTerm}"
                      <button
                        onClick={() => setUserSearchTerm("")}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                        aria-label="Clear search filter"
                      >
                        ✕
                      </button>
                    </Badge>
                  )}
                  {viewMode !== "planned" && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 flex items-center gap-1"
                    >
                      {t('forms.view')}: {t(`yearly_plans.${viewMode}_view`, viewMode)}
                      <button
                        onClick={() => setViewMode("planned")}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                        aria-label="Clear view mode filter"
                      >
                        ✕
                      </button>
                    </Badge>
                  )}
                </div>
              )}

              {/* Role Filter and View Mode - Only show role filter for admin */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Year Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      {t("yearly_plans.year")}:
                    </span>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Role Filter - Only show for admin users */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        {t("forms.role")}:
                      </span>
                      <Select
                        value={selectedRole || "all"}
                        onValueChange={(value) =>
                          setSelectedRole(value === "all" ? "" : value)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue
                            placeholder={t("placeholders.select_role")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("common.all")}</SelectItem>
                          {/* <SelectItem value="ADMIN">
                              {t("roles.admin")}
                            </SelectItem> */}
                          <SelectItem value="PRODAVEC">
                            {t("roles.prodavec")}
                          </SelectItem>
                          {/* <SelectItem value="MANUFACTURE">
                            {t("roles.manufacture")}
                          </SelectItem> */}
                          <SelectItem value="ZAMERSHIK">
                            {t("roles.zamershik")}
                          </SelectItem>
                          <SelectItem value="OPERATOR">
                            {t("roles.operator")}
                          </SelectItem>
                          {/* <SelectItem value="SOTRUDNIK">
                            {t("roles.sotrudnik")}
                          </SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {t("yearly_plans.view_mode")}:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                    <Button
                      variant={viewMode === "planned" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("planned")}
                      className="flex items-center gap-2 h-8"
                    >
                      <Target className="w-4 h-4" />
                      {t("yearly_plans.planned_values")}
                    </Button>

                    <Button
                      variant={viewMode === "comparison" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("comparison")}
                      className="flex items-center gap-2 h-8"
                    >
                      <BarChart3 className="w-4 h-4" />
                      {t("yearly_plans.comparison_view")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Legend for comparison view */}
          {viewMode === "comparison" && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  <div className="flex items-center gap-2">
                    {/* <div className="w-2 h-2 bg-blue-500 rounded-full"></div> */}
                    {/* <span className="text-sm font-medium text-gray-700">
                      Legend:
                    </span> */}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700 font-medium">
                        {t("yearly_plans.planned_values")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-orange-700 font-medium">
                        {t("yearly_plans.actual_values")}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-xs text-gray-600 font-medium">
                        {t("forms.performance")}
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 bg-green-100 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 text-xs font-medium">
                          ≥100%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 bg-yellow-100 rounded-full">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-yellow-700 text-xs font-medium">
                          75-99%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 bg-red-100 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 text-xs font-medium">
                          &lt;75%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Consolidated Sales Plans */}
          <div className="space-y-6">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-32" />
                        {Array.from({ length: 12 }).map((_, j) => (
                          <Skeleton key={j} className="h-10 w-16" />
                        ))}
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                  .filter(
                    (user) =>
                      !isAdmin || !selectedRole || user.role === selectedRole,
                  )
                  .map((user) => ({
                    id: user.id!,
                    full_name: user.full_name,
                    role: user.role,
                  }))}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          {/* Enhanced Date Selector and Filters */}
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CalendarIcon className="w-5 h-5" />
                {t("daily_plans.select_date")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1">
                    {/* <label className="text-sm font-medium text-gray-600">
                      Select Date:
                    </label> */}
                    <input
                      type="date"
                      value={format(selectedDate, "yyyy-MM-dd")}
                      onChange={(e) =>
                        setSelectedDate(new Date(e.target.value))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  {/* <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600 opacity-0">
                      Quick:
                    </label>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDate(new Date())}
                      className="flex items-center gap-2"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      {t("daily_plans.today")}
                    </Button>
                  </div> */}

                  {/* Role Filter for Daily Plans - Only show for admin users */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        {/* {t("forms.role")}: */}
                      </span>
                      <Select
                        value={selectedRole || "all"}
                        onValueChange={(value) =>
                          setSelectedRole(value === "all" ? "" : value)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue
                            placeholder={t("placeholders.select_role")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("common.all")}</SelectItem>
                         
                          <SelectItem value="PRODAVEC">
                            {t("roles.prodavec")}
                          </SelectItem>
                          <SelectItem value="ZAMERSHIK">
                            {t("roles.zamershik")}
                          </SelectItem>
                          <SelectItem value="OPERATOR">
                            {t("roles.operator")}
                          </SelectItem>
                         
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

               

                {/* Clear Filters Button for Daily Plans */}
                {(selectedRole || userSearchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateUrlParam("role", "");
                      updateUrlParam("search", "");
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <Filter className="w-4 h-4" />
                    {t("common.clear_filters", "Clear Filters")}
                  </Button>
                )}
              </div>

              {/* <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  📅 {t("daily_plans.selected_date")}: {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                </p>
              </div> */}
            </CardContent>
          </Card>

          {/* Enhanced Daily Plans Table */}
          <Card className="shadow-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <BarChart3 className="w-5 h-5" />
                {t("daily_plans.daily_breakdown")} -{" "}
                {format(selectedDate, "dd/MM/yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isDailyLoading ? (
                <div className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="text-lg text-gray-600">
                        {t("common.loading")}
                      </div>
                    </div>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-32" />
                        {Array.from({ length: 9 }).map((_, j) => (
                          <Skeleton key={j} className="h-12 w-20" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredDailyPlans.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg mb-2">
                    {t("daily_plans.no_data")}
                  </p>
                  <p className="text-gray-400 text-sm">
                    No plans found for the selected date and filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                        <TableHead className="w-48 font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {t("daily_plans.user")}
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-blue-50">
                          <div className="flex flex-col items-center gap-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span>{t("daily_plans.sales_plan")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-green-50">
                          <div className="flex flex-col items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>{t("daily_plans.sales_actual")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-purple-50">
                          <div className="flex flex-col items-center gap-1">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <span>{t("daily_plans.sales_percentage")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-blue-50">
                          <div className="flex flex-col items-center gap-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span>{t("daily_plans.clients_plan")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-green-50">
                          <div className="flex flex-col items-center gap-1">
                            <Users className="w-4 h-4 text-green-600" />
                            <span>{t("daily_plans.clients_actual")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-purple-50">
                          <div className="flex flex-col items-center gap-1">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <span>{t("daily_plans.clients_percentage")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-blue-50">
                          <div className="flex flex-col items-center gap-1">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span>{t("daily_plans.sales_count_plan")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-green-50">
                          <div className="flex flex-col items-center gap-1">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span>{t("daily_plans.sales_count_actual")}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center font-semibold text-gray-700 bg-purple-50">
                          <div className="flex flex-col items-center gap-1">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            <span>
                              {t("daily_plans.sales_count_percentage")}
                            </span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedDailyPlans.map((plan, index) => {
                        const detail = plan.details[0]; // Since we're getting data for a single day
                        const isEvenRow = index % 2 === 0;
                        return (
                          <TableRow
                            key={plan.user.id}
                            className={`hover:bg-blue-50 transition-colors ${
                              isEvenRow ? "bg-white" : "bg-gray-25"
                            }`}
                          >
                            <TableCell className="font-medium text-gray-900 border-r border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {plan.user.full_name.charAt(0)}
                                </div>
                                <div className="flex items-center gap-2">
                                  {plan.user.full_name}
                                  {getTrophyIcon(index)}
                                </div>
                              </div>
                            </TableCell>

                            {/* Sales */}
                            <TableCell className="text-center bg-blue-25 font-medium text-blue-900">
                              {detail.sales_plan.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center bg-green-25 font-medium text-green-900">
                              {detail.sales.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center bg-purple-25">
                              <div className="flex flex-col items-center gap-1">
                                <Badge
                                  variant={getPerformanceBadgeVariant(
                                    detail.sales_percentage,
                                  )}
                                  className="text-xs font-bold"
                                >
                                  {formatPercentage(detail.sales_percentage)}
                                </Badge>
                                {detail.sales_percentage >= 100 ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            </TableCell>

                            {/* Clients */}
                            <TableCell className="text-center bg-blue-25 font-medium text-blue-900">
                              {detail.clients_plan}
                            </TableCell>
                            <TableCell className="text-center bg-green-25 font-medium text-green-900">
                              {detail.clients}
                            </TableCell>
                            <TableCell className="text-center bg-purple-25">
                              <div className="flex flex-col items-center gap-1">
                                <Badge
                                  variant={getPerformanceBadgeVariant(
                                    detail.clients_percentage,
                                  )}
                                  className="text-xs font-bold"
                                >
                                  {formatPercentage(detail.clients_percentage)}
                                </Badge>
                                {detail.clients_percentage >= 100 ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            </TableCell>

                            {/* Sales Count */}
                            <TableCell className="text-center bg-blue-25 font-medium text-blue-900">
                              {detail.sales_count_plan}
                            </TableCell>
                            <TableCell className="text-center bg-green-25 font-medium text-green-900">
                              {detail.sales_count}
                            </TableCell>
                            <TableCell className="text-center bg-purple-25">
                              <div className="flex flex-col items-center gap-1">
                                <Badge
                                  variant={getPerformanceBadgeVariant(
                                    detail.sales_count_percentage,
                                  )}
                                  className="text-xs font-bold"
                                >
                                  {formatPercentage(
                                    detail.sales_count_percentage,
                                  )}
                                </Badge>
                                {detail.sales_count_percentage >= 100 ? (
                                  <TrendingUp className="w-3 h-3 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-red-600" />
                                )}
                              </div>
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
