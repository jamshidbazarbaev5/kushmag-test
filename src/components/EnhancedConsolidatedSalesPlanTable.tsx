// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/core/context/AuthContext"
// import { toast } from "sonner";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// // import { Progress } from "@/components/ui/progress";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// import {
//   Calendar,
//   Plus,
//   Edit,
//   Eye,
//   TrendingUp,
//   TrendingDown,
//   BarChart3,
//   Target,
//   Star,
//   Award,
//   CheckCircle,
//   AlertTriangle,
//   XCircle,
//   Sparkles,
//   Zap,
//   // Fire,
//   Users,
//   Activity,
// } from "lucide-react";

// import {
//   PerformanceIndicator,
//   PerformanceRating,
//   PerformanceGauge,
//   PerformanceTier,
//   AnimatedPerformanceIndicator,
//   HeatMapCell,
//   getPerformanceTier,
// } from "./PerformanceIndicators";

// // Types
// interface SalesPlanDetail {
//   month: number;
//   sales_plan: number;
//   clients_plan?: number;
//   sales_count_plan?: number;
//   sales?: number;
//   clients?: number;
//   sales_count?: number;
//   sales_percentage?: number;
//   clients_percentage?: number;
//   sales_count_percentage?: number;
// }

// interface SalesPlanData {
//   id?: number;
//   user: {
//     id: number;
//     full_name: string;
//   };
//   year: number;
//   details: SalesPlanDetail[];
// }

// interface EnhancedConsolidatedSalesPlanTableProps {
//   data: SalesPlanData[];
//   year?: number;
//   viewMode?: "planned" | "actual" | "comparison";
//   visualMode?: "standard" | "heatmap" | "performance" | "dashboard";
//   onUpdatePlan?: (planId: number, updatedDetails: SalesPlanDetail[]) => void;
//   onCreatePlan?: (plan: Omit<SalesPlanData, "id">) => void;
//   users?: Array<{ id: number; full_name: string }>;
// }

// interface PlanFormData {
//   user: number;
//   year: number;
//   details: SalesPlanDetail[];
// }

// interface ModalState {
//   isOpen: boolean;
//   mode: "add" | "edit";
//   planId?: number;
//   initialData?: PlanFormData;
// }

// const EnhancedConsolidatedSalesPlanTable: React.FC<
//   EnhancedConsolidatedSalesPlanTableProps
// > = ({
//   data,
//   year,
//   viewMode = "planned",
//   visualMode = "performance",
//   onUpdatePlan,
//   onCreatePlan,
//   users = [],
// }) => {
//   const { t } = useTranslation();
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();

//   const MONTH_NAMES = [
//     t("months.january"),
//     t("months.february"),
//     t("months.march"),
//     t("months.april"),
//     t("months.may"),
//     t("months.june"),
//     t("months.july"),
//     t("months.august"),
//     t("months.september"),
//     t("months.october"),
//     t("months.november"),
//     t("months.december"),
//   ];

//   const [modalState, setModalState] = useState<ModalState>({
//     isOpen: false,
//     mode: "add",
//   });
//   const [formData, setFormData] = useState<PlanFormData>({
//     user: 0,
//     year: year || new Date().getFullYear(),
//     details: [],
//   });

//   // Handle month click to navigate to daily plans
//   const handleMonthClick = (plan: SalesPlanData, month: number) => {
//     const searchParams = new URLSearchParams({
//       year: plan.year.toString(),
//       month: month.toString(),
//       user: plan.user.id.toString(),
//       userName: plan.user.full_name,
//     });
//     navigate(`/daily-plans?${searchParams.toString()}`);
//   };

//   // Initialize default plan details
//   const getDefaultPlanDetails = (): SalesPlanDetail[] => {
//     return Array.from({ length: 12 }, (_, index) => ({
//       month: index + 1,
//       sales_plan: 0,
//       clients_plan: 0,
//       sales_count_plan: 0,
//       sales: 0,
//       clients: 0,
//       sales_count: 0,
//       sales_percentage: 0,
//       clients_percentage: 0,
//       sales_count_percentage: 0,
//     }));
//   };

//   // Helper function to get performance tier and styling
//   const getPerformanceStyle = (percentage: number) => {
//     const tier = getPerformanceTier(percentage);
//     return {
//       bgClass: tier.bgColor,
//       textClass: tier.textColor,
//       badge: tier.badge,
//       label: tier.label,
//       icon: tier.icon,
//     };
//   };

//   // Calculate summary stats for dashboard view
//   const calculateUserStats = (plan: SalesPlanData) => {
//     const totalPlanned = plan.details.reduce(
//       (sum, detail) => sum + parseFloat(String(detail.sales_plan) || "0"),
//       0,
//     );
//     const totalActual = plan.details.reduce(
//       (sum, detail) => sum + (detail.sales || 0),
//       0,
//     );
//     const overallPerformance =
//       totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

//     const monthsWithData = plan.details.filter((d) => d.sales_plan > 0).length;
//     const monthsAchieved = plan.details.filter(
//       (d) => d.sales_plan > 0 && (d.sales || 0) >= d.sales_plan,
//     ).length;

//     return {
//       totalPlanned,
//       totalActual,
//       overallPerformance,
//       monthsWithData,
//       monthsAchieved,
//       achievementRate:
//         monthsWithData > 0 ? (monthsAchieved / monthsWithData) * 100 : 0,
//     };
//   };

//   // Open modal for adding new plan
//   const handleAddPlan = () => {
//     const defaultDetails = getDefaultPlanDetails();
//     setFormData({
//       user: 0,
//       year: year || new Date().getFullYear(),
//       details: defaultDetails,
//     });
//     setModalState({
//       isOpen: true,
//       mode: "add",
//     });
//   };

//   // Open modal for viewing/editing existing plan
//   const handleViewOrEditPlan = (plan: SalesPlanData) => {
//     const planDetails = plan.details.map((detail) => ({
//       month: detail.month,
//       sales_plan: detail.sales_plan,
//       clients_plan: detail.clients_plan || 0,
//       sales_count_plan: detail.sales_count_plan || 0,
//       sales: detail.sales || 0,
//       clients: detail.clients || 0,
//       sales_count: detail.sales_count || 0,
//       sales_percentage: detail.sales_percentage || 0,
//       clients_percentage: detail.clients_percentage || 0,
//       sales_count_percentage: detail.sales_count_percentage || 0,
//     }));

//     setFormData({
//       user: plan.user.id,
//       year: plan.year,
//       details: planDetails,
//     });
//     setModalState({
//       isOpen: true,
//       mode: "edit",
//       planId: plan.id,
//       initialData: {
//         user: plan.user.id,
//         year: plan.year,
//         details: planDetails,
//       },
//     });
//   };

//   // Close modal
//   const handleCloseModal = () => {
//     setModalState({
//       isOpen: false,
//       mode: "add",
//     });
//     setFormData({
//       user: 0,
//       year: year || new Date().getFullYear(),
//       details: [],
//     });
//   };

//   // Check if current user is admin
//   const isAdmin = currentUser?.role === "ADMIN";

//   // Handle form submission
//   const handleSubmit = () => {
//     if (!isAdmin) {
//       toast.error("You don't have permission to modify plans");
//       return;
//     }

//     if (formData.user === 0) {
//       toast.error("Please select a user");
//       return;
//     }

//     if (modalState.mode === "add" && onCreatePlan) {
//       const selectedUser = users.find((u) => u.id === formData.user);
//       const newPlan = {
//         user: selectedUser || {
//           id: formData.user,
//           full_name: `User ${formData.user}`,
//         },
//         year: formData.year,
//         details: formData.details.map((detail) => ({
//           month: detail.month,
//           sales_plan: parseFloat(String(detail.sales_plan)),
//           clients_plan: parseFloat(String(detail.clients_plan) || "0"),
//           sales_count_plan: parseFloat(String(detail.sales_count_plan) || "0"),
//         })),
//       };
//       onCreatePlan(newPlan);
//       toast.success("New yearly plan created successfully");
//     } else if (
//       modalState.mode === "edit" &&
//       onUpdatePlan &&
//       modalState.planId
//     ) {
//       const updatedDetails = formData.details.map((detail) => ({
//         month: detail.month,
//         sales_plan: parseFloat(String(detail.sales_plan)),
//         clients_plan: parseFloat(String(detail.clients_plan) || "0"),
//         sales_count_plan: parseFloat(String(detail.sales_count_plan) || "0"),
//         sales: detail.sales || 0,
//         clients: detail.clients || 0,
//         sales_count: detail.sales_count || 0,
//         sales_percentage: detail.sales_percentage || 0,
//         clients_percentage: detail.clients_percentage || 0,
//         sales_count_percentage: detail.sales_count_percentage || 0,
//       }));
//       onUpdatePlan(modalState.planId, updatedDetails);
//       toast.success("Yearly plan updated successfully");
//     }

//     handleCloseModal();
//   };

//   // Update form data for specific month and field
//   const updateFormDetail = (
//     month: number,
//     field: keyof SalesPlanDetail,
//     value: string | number,
//   ) => {
//     setFormData((prev) => ({
//       ...prev,
//       details: prev.details.map((detail) =>
//         detail.month === month ? { ...detail, [field]: value } : detail,
//       ),
//     }));
//   };

//   // Group data by year if multiple years exist
//   const groupedByYear = data.reduce(
//     (acc, plan) => {
//       if (!acc[plan.year]) {
//         acc[plan.year] = [];
//       }
//       acc[plan.year].push(plan);
//       return acc;
//     },
//     {} as Record<number, SalesPlanData[]>,
//   );

//   const years = Object.keys(groupedByYear)
//     .map(Number)
//     .sort((a, b) => b - a);
//   const displayYears = year ? [year] : years;

//   // Get users not in current year's plans
//   const currentYearData = year ? groupedByYear[year] || [] : [];
//   const usersWithPlans = new Set(currentYearData.map((plan) => plan.user.id));
//   const availableUsers =
//     modalState.mode === "add"
//       ? users.filter((user) => !usersWithPlans.has(user.id))
//       : users;

//   // Render table based on visual mode
//   const renderTableContent = (yearData: SalesPlanData[]) => {
//     if (visualMode === "dashboard") {
//       return (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {yearData.map((plan) => {
//             const stats = calculateUserStats(plan);
//             return (
//               <Card
//                 key={plan.id || `plan-${plan.user.id}-${plan.year}`}
//                 className="hover:shadow-lg transition-shadow duration-200"
//               >
//                 <CardHeader className="pb-3">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
//                         {plan.user.full_name.charAt(0)}
//                       </div>
//                       <div>
//                         <h3 className="font-semibold text-gray-900">
//                           {plan.user.full_name}
//                         </h3>
//                         <p className="text-sm text-gray-500">
//                           Performance Dashboard
//                         </p>
//                       </div>
//                     </div>
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() => handleViewOrEditPlan(plan)}
//                       className="h-8 w-8 p-0"
//                     >
//                       {isAdmin ? (
//                         <Edit className="w-4 h-4" />
//                       ) : (
//                         <Eye className="w-4 h-4" />
//                       )}
//                     </Button>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   {/* Overall Performance */}
//                   <AnimatedPerformanceIndicator
//                     percentage={stats.overallPerformance}
//                     className="mb-4"
//                   />

//                   {/* Key Metrics */}
//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="text-center p-2 bg-blue-50 rounded-lg">
//                       <div className="text-sm font-medium text-blue-600">
//                         Planned
//                       </div>
//                       <div className="text-lg font-bold text-blue-900">
//                         {stats.totalPlanned.toLocaleString()}
//                       </div>
//                     </div>
//                     <div className="text-center p-2 bg-green-50 rounded-lg">
//                       <div className="text-sm font-medium text-green-600">
//                         Actual
//                       </div>
//                       <div className="text-lg font-bold text-green-900">
//                         {stats.totalActual.toLocaleString()}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Achievement Rate */}
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">Monthly Achievement</span>
//                       <span className="font-medium">
//                         {stats.monthsAchieved}/{stats.monthsWithData}
//                       </span>
//                     </div>
//                     {/* <Progress value={stats.achievementRate} className="h-2" /> */}
//                     <PerformanceRating
//                       percentage={stats.achievementRate}
//                       maxStars={5}
//                       size="sm"
//                     />
//                   </div>

//                   {/* Monthly Breakdown */}
//                   <div className="grid grid-cols-6 gap-1">
//                     {plan.details.slice(0, 12).map((detail, index) => {
//                       const percentage =
//                         detail.sales_plan > 0
//                           ? ((detail.sales || 0) / detail.sales_plan) * 100
//                           : 0;
//                       return (
//                         <div
//                           key={index}
//                           className="aspect-square relative cursor-pointer group"
//                           onClick={() => handleMonthClick(plan, detail.month)}
//                           title={`${MONTH_NAMES[index]}: ${percentage.toFixed(1)}%`}
//                         >
//                           <HeatMapCell
//                             value={detail.sales || 0}
//                             maxValue={detail.sales_plan}
//                             showValue={false}
//                             className="w-full h-full rounded hover:scale-110 transition-transform"
//                           />
//                           <div className="absolute inset-0 flex items-center justify-center">
//                             <span className="text-xs font-medium text-white">
//                               {MONTH_NAMES[index].slice(0, 1)}
//                             </span>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       );
//     }

//     // Traditional table view with enhanced visual indicators
//     return (
//       <div className="overflow-x-auto">
//         <Table>
//           <TableHeader>
//             <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
//               <TableHead className="font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
//                 <div className="flex items-center gap-2">
//                   <Users className="w-4 h-4" />
//                   {t("yearly_plans.user")}
//                 </div>
//               </TableHead>
//               {MONTH_NAMES.map((month, index) => (
//                 <TableHead
//                   key={index}
//                   className={`text-center min-w-32 font-semibold text-gray-700 ${
//                     viewMode === "comparison" ? "min-w-40" : ""
//                   }`}
//                 >
//                   <div className="flex flex-col items-center gap-1">
//                     <span>{month}</span>
//                     {visualMode === "performance" && (
//                       <div className="text-xs text-gray-500">
//                         Plan / Actual / Rating
//                       </div>
//                     )}
//                     {viewMode === "comparison" && visualMode === "standard" && (
//                       <div className="text-xs text-gray-500">
//                         План / Фактический / %
//                       </div>
//                     )}
//                   </div>
//                 </TableHead>
//               ))}
//               <TableHead className="text-center min-w-32 font-semibold text-gray-700">
//                 <div className="flex flex-col items-center gap-1">
//                   <Target className="w-4 h-4" />
//                   {t("yearly_plans.total")}
//                 </div>
//               </TableHead>
//               <TableHead className="text-center min-w-20 font-semibold text-gray-700">
//                 {t("common.actions")}
//               </TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {yearData.map((plan, planIndex) => {
//               const stats = calculateUserStats(plan);
//               const isEvenRow = planIndex % 2 === 0;

//               return (
//                 <TableRow
//                   key={plan.id || `plan-${plan.user.id}-${plan.year}`}
//                   className={`hover:bg-blue-50 transition-colors border-b ${
//                     isEvenRow ? "bg-white" : "bg-gray-25"
//                   }`}
//                 >
//                   <TableCell className="font-medium text-gray-900 sticky left-0 bg-inherit z-10 border-r border-gray-100">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
//                         {plan.user.full_name.charAt(0)}
//                       </div>
//                       <div>
//                         <div className="font-medium">{plan.user.full_name}</div>
//                         {visualMode === "performance" && (
//                           <div className="flex items-center gap-1 mt-1">
//                             <PerformanceRating
//                               percentage={stats.overallPerformance}
//                               maxStars={5}
//                               size="sm"
//                               showLabel={false}
//                             />
//                             <span className="text-xs text-gray-500">
//                               {stats.overallPerformance.toFixed(0)}%
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </TableCell>

//                   {Array.from({ length: 12 }, (_, index) => {
//                     const month = index + 1;
//                     const monthDetail = plan.details.find(
//                       (d) => d.month === month,
//                     );
//                     const plannedValue = monthDetail
//                       ? parseFloat(String(monthDetail.sales_plan) || "0")
//                       : 0;
//                     const actualValue = monthDetail
//                       ? monthDetail.sales || 0
//                       : 0;
//                     const percentage =
//                       plannedValue > 0 ? (actualValue / plannedValue) * 100 : 0;

//                     if (visualMode === "heatmap") {
//                       return (
//                         <TableCell key={index} className="p-1">
//                           <HeatMapCell
//                             value={
//                               viewMode === "actual" ? actualValue : plannedValue
//                             }
//                             maxValue={Math.max(
//                               ...yearData.flatMap((p) =>
//                                 p.details.map((d) =>
//                                   viewMode === "actual"
//                                     ? d.sales || 0
//                                     : d.sales_plan,
//                                 ),
//                               ),
//                             )}
//                             className="cursor-pointer"
//                             onClick={() => handleMonthClick(plan, month)}
//                           />
//                         </TableCell>
//                       );
//                     }

//                     if (visualMode === "performance") {
//                       return (
//                         <TableCell key={index} className="text-center p-2">
//                           <div className="space-y-2">
//                             <div className="flex justify-between text-xs">
//                               <span className="text-blue-600 font-medium">
//                                 {plannedValue.toLocaleString()}
//                               </span>
//                               <span className="text-orange-600 font-medium">
//                                 {actualValue.toLocaleString()}
//                               </span>
//                             </div>
//                             <PerformanceIndicator
//                               percentage={percentage}
//                               variant="compact"
//                               size="sm"
//                             />
//                             <div
//                               className="cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
//                               onClick={() => handleMonthClick(plan, month)}
//                               title={`View details for ${MONTH_NAMES[month - 1]}`}
//                             >
//                               <PerformanceGauge
//                                 percentage={percentage}
//                                 size={32}
//                                 strokeWidth={3}
//                                 showValue={false}
//                               />
//                             </div>
//                           </div>
//                         </TableCell>
//                       );
//                     }

//                     if (viewMode === "comparison") {
//                       return (
//                         <TableCell key={index} className="text-center p-2">
//                           <div className="space-y-1">
//                             <div className="text-xs text-blue-600 font-medium">
//                               {plannedValue.toLocaleString()}
//                             </div>
//                             <div className="text-xs text-orange-600 font-medium">
//                               {actualValue.toLocaleString()}
//                             </div>
//                             <PerformanceTier
//                               percentage={percentage}
//                               variant="minimal"
//                               showLabel={false}
//                             />
//                           </div>
//                         </TableCell>
//                       );
//                     }

//                     // Standard view
//                     const value =
//                       viewMode === "actual" ? actualValue : plannedValue;
//                     return (
//                       <TableCell key={index} className="text-center">
//                         <span
//                           className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 hover:scale-105 font-medium ${
//                             viewMode === "actual"
//                               ? "bg-orange-50 text-orange-700 hover:bg-orange-100 hover:shadow-md"
//                               : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md"
//                           }`}
//                           onClick={() => handleMonthClick(plan, month)}
//                           title={`View daily plans for ${MONTH_NAMES[month - 1]} ${plan.year}`}
//                         >
//                           {value.toLocaleString()}
//                         </span>
//                       </TableCell>
//                     );
//                   })}

//                   <TableCell className="text-center font-semibold">
//                     {viewMode === "comparison" ? (
//                       <div className="space-y-1">
//                         <div className="text-sm text-blue-600 font-bold">
//                           {stats.totalPlanned.toLocaleString()}
//                         </div>
//                         <div className="text-sm text-orange-600 font-bold">
//                           {stats.totalActual.toLocaleString()}
//                         </div>
//                         <PerformanceIndicator
//                           percentage={stats.overallPerformance}
//                           variant="compact"
//                           size="sm"
//                         />
//                       </div>
//                     ) : (
//                       <div className="flex flex-col items-center gap-1">
//                         <span
//                           className={`px-3 py-2 rounded-lg font-bold ${
//                             viewMode === "actual"
//                               ? "bg-orange-100 text-orange-800"
//                               : "bg-green-100 text-green-800"
//                           }`}
//                         >
//                           {(viewMode === "actual"
//                             ? stats.totalActual
//                             : stats.totalPlanned
//                           ).toLocaleString()}
//                         </span>
//                         {visualMode === "performance" && (
//                           <PerformanceGauge
//                             percentage={stats.overallPerformance}
//                             size={40}
//                             strokeWidth={4}
//                           />
//                         )}
//                       </div>
//                     )}
//                   </TableCell>

//                   <TableCell className="text-center">
//                     <Button
//                       size="sm"
//                       variant="ghost"
//                       onClick={() => handleViewOrEditPlan(plan)}
//                       className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors"
//                       title={isAdmin ? t("common.edit") : t("common.view")}
//                     >
//                       {isAdmin ? (
//                         <Edit className="w-4 h-4" />
//                       ) : (
//                         <Eye className="w-4 h-4" />
//                       )}
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               );
//             })}

//             {/* Enhanced Summary row */}
//             {yearData.length > 1 && (
//               <TableRow className="bg-gradient-to-r from-gray-100 to-gray-200 font-semibold border-t-4 border-blue-500">
//                 <TableCell className="sticky left-0 bg-gradient-to-r from-gray-100 to-gray-200 z-10">
//                   <div className="flex items-center gap-2">
//                     <BarChart3 className="w-4 h-4 text-blue-600" />
//                     {t("yearly_plans.total")}
//                   </div>
//                 </TableCell>
//                 {Array.from({ length: 12 }, (_, index) => {
//                   const monthTotalPlanned = yearData.reduce((sum, plan) => {
//                     const monthDetail = plan.details.find(
//                       (d) => d.month === index + 1,
//                     );
//                     if (!monthDetail) return sum;
//                     return (
//                       sum + parseFloat(String(monthDetail.sales_plan) || "0")
//                     );
//                   }, 0);

//                   const monthTotalActual = yearData.reduce((sum, plan) => {
//                     const monthDetail = plan.details.find(
//                       (d) => d.month === index + 1,
//                     );
//                     if (!monthDetail) return sum;
//                     return sum + (monthDetail.sales || 0);
//                   }, 0);

//                   if (
//                     viewMode === "comparison" ||
//                     visualMode === "performance"
//                   ) {
//                     const percentage =
//                       monthTotalPlanned > 0
//                         ? (monthTotalActual / monthTotalPlanned) * 100
//                         : 0;
//                     return (
//                       <TableCell key={index} className="text-center">
//                         {visualMode === "performance" ? (
//                           <div className="space-y-1">
//                             <div className="text-xs">
//                               <span className="text-blue-600">
//                                 {monthTotalPlanned.toLocaleString()}
//                               </span>
//                               {" / "}
//                               <span className="text-orange-600">
//                                 {monthTotalActual.toLocaleString()}
//                               </span>
//                             </div>
//                             <PerformanceIndicator
//                               percentage={percentage}
//                               variant="compact"
//                               size="sm"
//                             />
//                           </div>
//                         ) : (
//                           <div className="space-y-1">
//                             <div className="text-xs text-blue-600 font-bold">
//                               {monthTotalPlanned.toLocaleString()}
//                             </div>
//                             <div className="text-xs text-orange-600 font-bold">
//                               {monthTotalActual.toLocaleString()}
//                             </div>
//                             <PerformanceTier
//                               percentage={percentage}
//                               variant="minimal"
//                               showLabel={false}
//                             />
//                           </div>
//                         )}
//                       </TableCell>
//                     );
//                   }

//                   const monthTotal =
//                     viewMode === "actual"
//                       ? monthTotalActual
//                       : monthTotalPlanned;
//                   return (
//                     <TableCell key={index} className="text-center">
//                       <span
//                         className={`px-2 py-1 rounded font-bold ${
//                           viewMode === "actual"
//                             ? "bg-orange-200 text-orange-900"
//                             : "bg-blue-200 text-blue-900"
//                         }`}
//                       >
//                         {monthTotal.toLocaleString()}
//                       </span>
//                     </TableCell>
//                   );
//                 })}
//                 <TableCell className="text-center">
//                   {(() => {
//                     const grandTotalPlanned = yearData.reduce((sum, plan) => {
//                       const planTotal = plan.details.reduce(
//                         (planSum, detail) => {
//                           return (
//                             planSum +
//                             parseFloat(String(detail.sales_plan) || "0")
//                           );
//                         },
//                         0,
//                       );
//                       return sum + planTotal;
//                     }, 0);

//                     const grandTotalActual = yearData.reduce((sum, plan) => {
//                       const planTotal = plan.details.reduce(
//                         (planSum, detail) => {
//                           return planSum + (detail.sales || 0);
//                         },
//                         0,
//                       );
//                       return sum + planTotal;
//                     }, 0);

//                     if (viewMode === "comparison") {
//                       const grandPercentage =
//                         grandTotalPlanned > 0
//                           ? (grandTotalActual / grandTotalPlanned) * 100
//                           : 0;
//                       return (
//                         <div className="space-y-1">
//                           <div className="text-sm text-blue-600 font-bold">
//                             {grandTotalPlanned.toLocaleString()}
//                           </div>
//                           <div className="text-sm text-orange-600 font-bold">
//                             {grandTotalActual.toLocaleString()}
//                           </div>
//                           <PerformanceIndicator
//                             percentage={grandPercentage}
//                             variant="compact"
//                             size="sm"
//                           />
//                         </div>
//                       );
//                     }

//                     return (
//                       <div className="flex flex-col items-center gap-1">
//                         <span
//                           className={`px-3 py-2 rounded-lg font-bold ${
//                             viewMode === "actual"
//                               ? "bg-orange-200 text-orange-900"
//                               : "bg-green-200 text-green-900"
//                           }`}
//                         >
//                           {(viewMode === "actual"
//                             ? grandTotalActual
//                             : grandTotalPlanned
//                           ).toLocaleString()}
//                         </span>
//                         {visualMode === "performance" && (
//                           <PerformanceGauge
//                             percentage={
//                               grandTotalPlanned > 0
//                                 ? (grandTotalActual / grandTotalPlanned) * 100
//                                 : 0
//                             }
//                             size={36}
//                             strokeWidth={4}
//                           />
//                         )}
//                       </div>
//                     );
//                   })()}
//                 </TableCell>
//                 <TableCell></TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     );
//   };

//   return (
//     <div className="space-y-6">
//       {displayYears.length === 0 ? (
//         <Card>
//           <CardContent className="text-center py-8">
//             <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
//             <p className="text-gray-500 mb-4">{t("yearly_plans.no_data")}</p>
//             {users.length > 0 && isAdmin && (
//               <Button onClick={handleAddPlan}>
//                 <Plus className="w-4 h-4 mr-2" />
//                 {t("yearly_plans.add_first_plan")}
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       ) : (
//         displayYears.map((displayYear) => {
//           const yearData = groupedByYear[displayYear] || [];

//           if (yearData.length === 0) return null;

//           return (
//             <Card
//               key={displayYear}
//               className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50"
//             >
//               <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
//                 <div className="flex justify-between items-center">
//                   <CardTitle className="flex items-center gap-3">
//                     <div className="p-2 bg-blue-500 rounded-lg">
//                       <BarChart3 className="w-5 h-5 text-white" />
//                     </div>
//                     <div>
//                       <div className="text-xl font-bold text-gray-900">
//                         {displayYear} {t("yearly_plans.sales_plans_all_users")}
//                       </div>
//                       <div className="text-sm text-gray-600 font-normal">
//                         {viewMode === "actual"
//                           ? t("yearly_plans.actual_values")
//                           : viewMode === "comparison"
//                             ? t("yearly_plans.comparison_view")
//                             : t("yearly_plans.planned_values")}
//                         {visualMode !== "standard" && (
//                           <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
//                             {visualMode === "performance" && "Performance View"}
//                             {visualMode === "heatmap" && "Heat Map"}
//                             {visualMode === "dashboard" && "Dashboard"}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </CardTitle>
//                   {isAdmin && (
//                     <Button
//                       onClick={handleAddPlan}
//                       size="sm"
//                       className="bg-blue-600 hover:bg-blue-700"
//                     >
//                       <Plus className="w-4 h-4 mr-2" />
//                       {t("yearly_plans.add_user_plan")}
//                     </Button>
//                   )}
//                 </div>
//               </CardHeader>
//               <CardContent className="p-6">
//                 {renderTableContent(yearData)}
//               </CardContent>
//             </Card>
//           );
//         })
//       )}

//       {/* Modal for adding/editing plans */}
//       <Dialog open={modalState.isOpen} onOpenChange={handleCloseModal}>
//         <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>
//               {modalState.mode === "add"
//                 ? t("yearly_plans.add_user_plan")
//                 : t("yearly_plans.edit_plan")}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-6">
//             {/* User and Year selection */}
//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="user">{t("forms.user")}</Label>
//                 <Select
//                   value={formData.user.toString()}
//                   onValueChange={(value) =>
//                     setFormData((prev) => ({ ...prev, user: parseInt(value) }))
//                   }
//                   disabled={modalState.mode === "edit"}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder={t("placeholders.select_user")} />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {availableUsers.map((user) => (
//                       <SelectItem key={user.id} value={user.id.toString()}>
//                         {user.full_name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="year">{t("forms.year")}</Label>
//                 <Input
//                   type="number"
//                   value={formData.year}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       year: parseInt(e.target.value),
//                     }))
//                   }
//                   disabled={modalState.mode === "edit"}
//                 />
//               </div>
//             </div>

//             {/* Monthly plans */}
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold">
//                 {t("yearly_plans.monthly_plans")}
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {MONTH_NAMES.map((month, index) => {
//                   const monthData = formData.details.find(
//                     (d) => d.month === index + 1,
//                   ) || {
//                     month: index + 1,
//                     sales_plan: 0,
//                     clients_plan: 0,
//                     sales_count_plan: 0,
//                   };

//                   return (
//                     <Card key={index} className="p-4">
//                       <h4 className="font-medium mb-3 text-center">{month}</h4>
//                       <div className="space-y-3">
//                         <div>
//                           <Label className="text-xs">
//                             {t("forms.sales_plan")}
//                           </Label>
//                           <Input
//                             type="number"
//                             value={monthData.sales_plan}
//                             onChange={(e) =>
//                               updateFormDetail(
//                                 index + 1,
//                                 "sales_plan",
//                                 parseFloat(e.target.value) || 0,
//                               )
//                             }
//                             disabled={!isAdmin}
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-xs">
//                             {t("forms.clients_plan")}
//                           </Label>
//                           <Input
//                             type="number"
//                             value={monthData.clients_plan}
//                             onChange={(e) =>
//                               updateFormDetail(
//                                 index + 1,
//                                 "clients_plan",
//                                 parseFloat(e.target.value) || 0,
//                               )
//                             }
//                             disabled={!isAdmin}
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-xs">
//                             {t("forms.sales_count_plan")}
//                           </Label>
//                           <Input
//                             type="number"
//                             value={monthData.sales_count_plan}
//                             onChange={(e) =>
//                               updateFormDetail(
//                                 index + 1,
//                                 "sales_count_plan",
//                                 parseFloat(e.target.value) || 0,
//                               )
//                             }
//                             disabled={!isAdmin}
//                           />
//                         </div>
//                       </div>
//                     </Card>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Action buttons */}
//             <div className="flex justify-end gap-3 pt-4 border-t">
//               <Button variant="outline" onClick={handleCloseModal}>
//                 {t("common.cancel")}
//               </Button>
//               {isAdmin && (
//                 <Button onClick={handleSubmit}>
//                   {modalState.mode === "add"
//                     ? t("common.create")
//                     : t("common.save")}
//                 </Button>
//               )}
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default EnhancedConsolidatedSalesPlanTable;
