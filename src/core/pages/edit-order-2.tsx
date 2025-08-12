import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useGetOrder, useUpdateOrder, useCalculateOrder } from "../api/order";
import SearchableCounterpartySelect from "@/components/ui/searchable-counterparty-select";
import {
  useGetCurrencies,
  useGetStores,
  useGetProjects,
  useGetCounterparties,
  useGetOrganizations,
  useGetSalesChannels,
  useGetSellers,
  useGetOperators,
  useGetBranches,
} from "../api/references";
import { useGetProducts } from "../api/products";
import { useGetMaterials } from "../api/material";
import { useGetMaterialTypes } from "../api/materialType";
import { useGetMassifs } from "../api/massif";
import { useGetColors } from "../api/color";
import { useGetPatinaColors } from "../api/patinaColor";
import { useGetBeadings } from "../api/beading";
import { useGetGlassTypes } from "../api/glassType";
import { useGetThresholds } from "../api/threshold";
import { useGetCasingRanges } from "../api/casingRange";
import { useGetAttributeSettings } from "../api/attributeSettings";
import { useState, useEffect, useMemo, useRef } from "react";
import { formatReferenceOptions } from "../helpers/formatters";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

import {
  Plus,
  Trash2,
  DoorOpen,
  Package,
  Calculator,
  Edit,
  Save,
  X,
} from "lucide-react";
import api from "../api/api";
import { useAutoSave } from "../hooks/useAutoSave";
import React from "react";
import { useGetZamershiks } from "../api/staff";

const getMetaById = (list: any, id: any) => {
  if (!list || !id) return null;
  const items = Array.isArray(list) ? list : list?.results || [];
  return items.find((item: any) => item.id === id) || null;
};

// Returns a full product object from the list by its ID
const getProductById = (productsList: any[], id: string | any) => {
  if (!productsList || !id) return null;

  // If id is an object, try to extract the actual ID
  let actualId = id;
  if (typeof id === "object") {
    actualId = id.value || id.id || id;
  }

  // Ensure we have a valid ID to search with
  if (
    !actualId ||
    (typeof actualId !== "string" && typeof actualId !== "number")
  ) {
    return { id: actualId };
  }

  const product = productsList.find((p) => p.id === actualId);

  // Return the full product object if found, otherwise return an object with just the ID
  return product || { id: actualId };
};

export default function EditOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: orderData, isLoading: isLoadingOrder } = useGetOrder(id!);
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: calculateOrder, isPending: isCalculating } =
    useCalculateOrder();

  const [doors, setDoors] = useState<any[]>([]);
  const [_currentStep, _setCurrentStep] = useState(1);
  const [totals, setTotals] = useState({
    total_sum: 0,
    door_price: 0,
    casing_price: 0,
    extension_price: 0,
    crown_price: 0,
    accessory_price: 0,
    discountAmount: 0,
    remainingBalance: 0,
  });
  // New state for discount and advance payment in step 3
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [agreementAmountInput, setAgreementAmountInput] = useState<number>(0);

  // Global door attributes state
  const [globalDoorSettings, setGlobalDoorSettings] = useState({
    material: "",
    material_type: "",
    massif: "",
    color: "",
    patina_color: "",
    beading_main: "",
    beading_additional: "2",
    glass_type: "",
    threshold: "",
  });

  // Fetch attribute settings for casing and crown sizes
  const { data: attributeSettings } = useGetAttributeSettings();
  const attributeSettingsArray = Array.isArray(attributeSettings)
    ? attributeSettings
    : attributeSettings?.results || [];
  const casingSize = attributeSettingsArray[0]?.casing_size || 6; // Default fallback
  const crownSize = attributeSettingsArray[0]?.crown_size || 10; // Default fallback

  const orderForm = useForm();

  // Auto-save functionality
  const orderFormData = orderForm.watch();
  useAutoSave(orderFormData, `edit-order-${id}-draft`);
  useAutoSave(doors, `edit-order-${id}-doors-draft`);

  // Initialize steps data

  //  Fetching ---
  const { data: currencies } = useGetCurrencies();
  const { data: branches } = useGetBranches();

  const { data: stores } = useGetStores();
  const { data: projects } = useGetProjects();
  const { data: counterparties } = useGetCounterparties();
  const { data: organizations } = useGetOrganizations();
  const { data: salesChannels } = useGetSalesChannels();
  const { data: sellers } = useGetSellers();
  const { data: operators } = useGetOperators();
  const { data: materials } = useGetMaterials();
  const { data: materialTypes } = useGetMaterialTypes();
  const { data: massifs } = useGetMassifs();
  const { data: colors } = useGetColors();
  const { data: patinaColors } = useGetPatinaColors();
  const { data: beadings } = useGetBeadings();
  const { data: glassTypes } = useGetGlassTypes();
  const { data: products } = useGetProducts();
  const { data: zamershiks } = useGetZamershiks();
  const { data: thresholds } = useGetThresholds();
  const { data: casingRanges } = useGetCasingRanges();
  const productsList = useMemo(
    () => (Array.isArray(products) ? products : products?.results || []),
    [products],
  );

  // Initialize form with order data - wait for reference data to load
  useEffect(() => {
    if (
      orderData &&
      currencies &&
      stores &&
      projects &&
      counterparties &&
      organizations &&
      salesChannels &&
      sellers &&
      operators &&
      zamershiks
    ) {
      // Helper function to format date for datetime-local input
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return "";
        try {
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return "";
          // Format as YYYY-MM-DDTHH:MM (datetime-local format)
          return date.toISOString().slice(0, 16);
        } catch {
          return "";
        }
      };

      // Convert API data to form format with all possible fields
      const formData = {
        rate: orderData.rate?.id || orderData.rate,
        store: orderData.store?.id || orderData.store,
        project: orderData.project?.id || orderData.project,
        agent: orderData.agent
          ? {
              value: orderData.agent.id,
              label: orderData.agent.name,
              ...orderData.agent,
            }
          : null,
        organization: orderData.organization?.id || orderData.organization,
        salesChannel: orderData.salesChannel?.id || orderData.salesChannel,
        seller: orderData.seller?.id || orderData.seller,
        operator: orderData.operator?.id || orderData.operator,
        address: orderData.address || "",
        // order_code: orderData.order_code || "",
        // order_date: formatDateForInput(orderData.created_at),
        deadline_date: formatDateForInput(orderData.deadline_date),
        description: orderData.description || "",
        branch: orderData?.branch?.id || orderData.branch,
        zamershik: orderData?.zamershik?.id || orderData.zamershik,
      };

      // Initialize discount and advance payment state from order data
      const initialDiscountPercentage = orderData.discount_percentage || 0;
      const initialDiscountAmount = parseFloat(
        String(orderData.discount_amount || 0),
      );
      const initialAdvancePayment = parseFloat(
        String(orderData.advance_payment || 0),
      );
      const initialAgreementAmount = parseFloat(
        String((orderData as any).agreement_amount || 0),
      );

      setDiscountPercentage(initialDiscountPercentage);
      setDiscountAmount(initialDiscountAmount);
      setAdvancePayment(initialAdvancePayment);
      setAgreementAmountInput(initialAgreementAmount);

      console.log("Agreement amount loaded:", initialAgreementAmount); // Debug log

      console.log("Form data being set:", formData); // Debug log
      console.log("Original order data:", orderData); // Debug log

      // Use setTimeout to ensure the form components are rendered before setting values
      setTimeout(() => {
        // Use reset method for better form initialization
        orderForm.reset(formData);
        console.log("Form reset with formData:", formData);
        // Trigger validation to ensure all fields are properly updated
        orderForm.trigger();
      }, 200);

      // Set doors data if available - normalize the nested items for editing
      if (orderData.doors && Array.isArray(orderData.doors)) {
        const normalizedDoors = orderData.doors.map((door: any) => {
          // Helper function to detect price type based on actual price
          const detectPriceType = (item: any) => {
            if (!item.model?.salePrices || !item.price) return null;

            const itemPriceInRubles = parseFloat(item.price); // Order price is already in rubles
            const matchingPrice = item.model.salePrices.find(
              (salePrice: any) => {
                const apiPriceInRubles = salePrice.value / 100; // Convert API kopecks to rubles
                return Math.abs(apiPriceInRubles - itemPriceInRubles) < 1; // Allow small floating point differences
              },
            );

            return matchingPrice?.priceType?.id || null;
          };

          const normalizeItems = (items: any[]) => {
            if (!Array.isArray(items)) return [];
            return items.map((item: any) => ({
              ...item,
              // Store the model ID directly for proper selection in editing
              model: item.model?.id || item.model,
              // Detect and store price_type based on actual price
              price_type: item.price_type || detectPriceType(item),
            }));
          };

          return {
            ...door,
            // Store the model ID directly for proper selection in editing
            model: door.model?.id || door.model,
            // Detect and store price_type based on actual price
            price_type: door.price_type || detectPriceType(door),
            // Normalize nested items
            extensions: normalizeItems(door.extensions),
            casings: normalizeItems(door.casings),
            crowns: normalizeItems(door.crowns),
            accessories: normalizeItems(door.accessories),
          };
        });

        console.log("Normalized doors for editing:", normalizedDoors); // Debug log
        setDoors(normalizedDoors);

        // Initialize global door settings from the first door (if available)
        if (normalizedDoors.length > 0) {
          const firstDoor = normalizedDoors[0];
          setGlobalDoorSettings({
            material: firstDoor.material || "",
            material_type: firstDoor.material_type || "",
            massif: firstDoor.massif || "",
            color: firstDoor.color || "",
            patina_color: firstDoor.patina_color || "",
            beading_main: firstDoor.beading_main || "",
            beading_additional: firstDoor.beading_additional || "2",
            glass_type: firstDoor.glass_type || "",
            threshold: firstDoor.threshold || "",
          });
        }
      }
    }
  }, [
    orderData,
    orderForm,
    currencies,
    stores,
    projects,
    counterparties,
    organizations,
    salesChannels,
    sellers,
    branches,
    zamershiks,
    operators,
  ]);

  // Auto-calculate order when data is loaded
  useEffect(() => {
    // Only auto-calculate if we have all the necessary data and doors
    if (
      orderData &&
      doors.length > 0 &&
      currencies &&
      stores &&
      projects &&
      counterparties &&
      organizations &&
      salesChannels &&
      sellers &&
      branches &&
      zamershiks &&
      operators &&
      productsList.length > 0 &&
      totals.total_sum === 0 // Only calculate if not already calculated
    ) {
      // Delay the calculation to ensure all form data is properly set
      setTimeout(() => {
        handleCalculateOrder();
      }, 500);
    }
  }, [
    orderData,
    doors,
    currencies,
    stores,
    projects,
    counterparties,
    organizations,
    salesChannels,
    sellers,
    operators,
    zamershiks,
    productsList,
    totals.total_sum,
  ]);

  // --- Format Options for Selects ---
  const fieldOptions = {
    rateOptions: formatReferenceOptions(currencies),
    branchOptions: formatReferenceOptions(branches),
    storeOptions: formatReferenceOptions(stores),
    projectOptions: formatReferenceOptions(projects),
    agentOptions: formatReferenceOptions(counterparties),
    organizationOptions: formatReferenceOptions(organizations),
    salesChannelOptions: formatReferenceOptions(salesChannels),
    sellerOptions: formatReferenceOptions(sellers),
    operatorOptions: formatReferenceOptions(operators),
    materialOptions: formatReferenceOptions(materials),
    materialTypeOptions: formatReferenceOptions(materialTypes),
    massifOptions: formatReferenceOptions(massifs),
    colorOptions: formatReferenceOptions(colors),
    zamershikOptions: formatReferenceOptions(zamershiks),
    patinaColorOptions: formatReferenceOptions(patinaColors),
    beadingMainOptions: formatReferenceOptions(
      Array.isArray(beadings)
        ? beadings.filter((b) => b.type === "main")
        : {
            results: beadings?.results?.filter((b) => b.type === "main") || [],
          },
    ),
    beadingAdditionalOptions: formatReferenceOptions(
      Array.isArray(beadings)
        ? beadings.filter((b) => b.type === "additional")
        : {
            results:
              beadings?.results?.filter((b) => b.type === "additional") || [],
          },
    ),
    glassTypeOptions: formatReferenceOptions(glassTypes),
    thresholdOptions: formatReferenceOptions(thresholds),
    casingRangeOptions: (Array.isArray(casingRanges)
      ? casingRanges
      : casingRanges?.results || []
    ).map((range) => ({
      value: String(range.id), // Convert to string for Select component
      label: `$ ${range.id} (${range.min_size}-${range.max_size}, ${t(
        "forms.casing_size",
      )}: ${range.casing_size})`,
      ...range,
    })),
  };

  // Debug log to check if casingRanges data is being received
  console.log("Casing Ranges Data:", casingRanges);
  console.log(
    "Formatted Casing Range Options:",
    fieldOptions.casingRangeOptions,
  );

  const orderFields = [
    {
      name: "store",
      label: t("forms.store"),
      type: "searchable-select",
      options: fieldOptions.storeOptions,
      placeholder: t("placeholders.select_store"),
      required: true,
    },
    {
      name: "project",
      label: t("forms.project"),
      type: "searchable-select",
      options: fieldOptions.projectOptions,
      placeholder: t("placeholders.select_project"),
      required: true,
    },
    {
      name: "organization",
      label: t("forms.organization"),
      type: "searchable-select",
      options: fieldOptions.organizationOptions,
      placeholder: t("placeholders.select_organization"),
      required: true,
    },
    {
      name: "branch",
      label: t("forms.branch"),
      type: "searchable-select",
      options: fieldOptions.branchOptions,
      placeholder: t("placeholders.select_branch"),
      required: true,
    },
    {
      name: "salesChannel",
      label: t("forms.sales_channel"),
      type: "searchable-select",
      options: fieldOptions.salesChannelOptions,
      placeholder: t("placeholders.select_sales_channel"),
      required: true,
    },
    {
      name: "address",
      label: t("forms.address"),
      type: "text",
      placeholder: t("placeholders.enter_address"),
      required: true,
    },

    {
      name: "deadline_date",
      label: t("forms.deadline_date"),
      type: "datetime-local",
      placeholder: t("placeholders.enter_deadline_date"),
      required: true,
    },
    {
      name: "seller",
      label: t("forms.seller"),
      type: "searchable-select",
      options: fieldOptions.sellerOptions,
      placeholder: t("placeholders.select_seller"),
      required: true,
    },
    {
      name: "zamershik",
      label: t("forms.zamershik"),
      type: "searchable-select",
      options: fieldOptions.zamershikOptions,
      placeholder: t("placeholders.select_zamershik"),
      required: true,
    },
    {
      name: "operator",
      label: t("forms.operator"),
      type: "searchable-select",
      options: fieldOptions.operatorOptions,
      placeholder: t("placeholders.select_operator"),
      required: true,
    },
    {
      name: "description",
      label: t("forms.description"),
      type: "textarea",
      placeholder: t("placeholders.enter_description"),
    },
  ];

  // --- API-based Calculation Function ---
  const handleCalculateOrder = () => {
    const orderData = orderForm.getValues();

    // Prepare order data for calculation
    const calculationData = {
      ...orderData,
      // Map IDs to full meta objects for the API
      store: getMetaById(stores, orderData.store),
      project: getMetaById(projects, orderData.project),
      agent:
        orderData.agent && typeof orderData.agent === "object"
          ? orderData.agent
          : getMetaById(counterparties, orderData.agent),
      organization: getMetaById(organizations, orderData.organization),
      salesChannel: getMetaById(salesChannels, orderData.salesChannel),
      seller: getMetaById(sellers, orderData.seller),
      operator: getMetaById(operators, orderData.operator),
      branch: getMetaById(branches, orderData.branch),
      // Hydrate door data with full product info
      zamershik: getMetaById(zamershiks, orderData.zamershik),
      doors: doors.map((door: any) => ({
        ...door,
        model: getProductById(productsList, door.model),
        extensions: door.extensions?.map((ext: any) => ({
          ...ext,
          model: getProductById(productsList, ext.model),
        })),
        casings: door.casings?.map((casing: any) => ({
          ...casing,
          model: getProductById(productsList, casing.model),
        })),
        crowns: door.crowns?.map((crown: any) => ({
          ...crown,
          model: getProductById(productsList, crown.model),
        })),
        accessories: door.accessories?.map((acc: any) => ({
          ...acc,
          model: getProductById(productsList, acc.model),
        })),
      })),
    };

    calculateOrder(calculationData, {
      onSuccess: (response) => {
        // Calculate total discount amount (base discount + agreement amount)
        const baseDiscountAmount =
          (response.total_sum * discountPercentage) / 100;
        const currentAgreementAmount = agreementAmountInput || 0;
        const totalDiscountAmount = baseDiscountAmount + currentAgreementAmount;

        // Always use the calculated total discount amount
        const finalDiscountAmount = totalDiscountAmount;
        const finalAmount = response.total_sum - finalDiscountAmount;
        const remainingBalance = finalAmount - advancePayment;

        setTotals({
          ...response,
          discountAmount: finalDiscountAmount,
          remainingBalance: remainingBalance,
        });
      },
      onError: (error: any) => {
        console.error("Error calculating order:", error);
        toast.error(t("messages.calculation_failed"));
      },
    });
  };

  const onSubmit = async (data: any) => {
    const { total_sum, remainingBalance } = totals;

    const orderUpdateData = {
      ...data,
      id: orderData?.id,
      // Map IDs to full meta objects for the API
      // rate: getMetaById(currencies, data.rate),
      created_at: new Date(),
      store: getMetaById(stores, data.store),
      project: getMetaById(projects, data.project),
      agent:
        data.agent && typeof data.agent === "object"
          ? data.agent
          : getMetaById(counterparties, data.agent),
      organization: getMetaById(organizations, data.organization),
      salesChannel: getMetaById(salesChannels, data.salesChannel),
      seller: getMetaById(sellers, data.seller),
      operator: getMetaById(operators, data.operator),
      branch: getMetaById(branches, data.branch),
      zamershik: getMetaById(zamershiks, data.zamershik),
      // Hydrate door data with full product info
      doors: doors.map((door: any) => ({
        ...door,
        model: getProductById(productsList, door.model),
        extensions:
          door.extensions
            ?.map((ext: any) => ({
              ...ext,
              model: getProductById(productsList, ext.model),
            }))
            .filter(
              (ext: any) => ext.model && ext.model.id && ext.quantity > 0,
            ) || [],
        casings:
          door.casings
            ?.map((casing: any) => ({
              ...casing,
              model: getProductById(productsList, casing.model),
            }))
            .filter(
              (casing: any) =>
                casing.model && casing.model.id && casing.quantity > 0,
            ) || [],
        crowns:
          door.crowns
            ?.map((crown: any) => ({
              ...crown,
              model: getProductById(productsList, crown.model),
            }))
            .filter(
              (crown: any) =>
                crown.model && crown.model.id && crown.quantity > 0,
            ) || [],
        accessories:
          door.accessories
            ?.map((acc: any) => ({
              ...acc,
              model: getProductById(productsList, acc.model),
            }))
            .filter(
              (acc: any) => acc.model && acc.model.id && acc.quantity > 0,
            ) || [],
      })),
      // Add calculated totals and payment info
      total_amount: total_sum.toFixed(2),
      discount_percentage: discountPercentage.toFixed(2),
      discount_amount: totals.discountAmount.toFixed(2),
      advance_payment: advancePayment.toFixed(2),
      remaining_balance: remainingBalance.toFixed(2),
      agreement_amount: agreementAmountInput.toFixed(2),
    };

    updateOrder(orderUpdateData, {
      onSuccess: () => {
        toast.success(t("messages.order_updated_successfully"));
        navigate("/orders");
      },
      onError: (e: any) => {
        console.error("Error updating order:", e.response?.data);
        toast.error(t("messages.error_updating_order"));
      },
    });
  };

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div>
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {/* {t("forms.edit_order")} #{orderData?.order_code} */}
              </h1>
              <p className="text-gray-600">
                {t("forms.edit_order_description")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="flex items-center gap-2"
            >
              ← {t("common.back_to_orders")}
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          <StepOne
            orderForm={orderForm}
            orderFields={orderFields}
            isLoading={isUpdating}
            globalDoorSettings={globalDoorSettings}
            setGlobalDoorSettings={setGlobalDoorSettings}
            fieldOptions={fieldOptions}
            doors={doors}
            setDoors={setDoors}
            // onNext={() => setCurrentStep(2)}
          />

          {/* Step 2: Doors Configuration */}
          <StepTwo
            doors={doors}
            setDoors={setDoors}
            fieldOptions={fieldOptions}
            productsList={productsList}
            orderForm={orderForm}
            casingSize={casingSize}
            crownSize={crownSize}
          />

          <StepThree
            orderForm={orderForm}
            doors={doors}
            totals={totals}
            isLoading={isUpdating}
            isCalculating={isCalculating}
            onSubmit={onSubmit}
            onCalculate={handleCalculateOrder}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            discountPercentage={discountPercentage}
            setDiscountPercentage={setDiscountPercentage}
            advancePayment={advancePayment}
            setAdvancePayment={setAdvancePayment}
            agreementAmountInput={agreementAmountInput}
            setAgreementAmountInput={setAgreementAmountInput}
            orderData={orderData}
          />
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepOne({
  orderForm,
  orderFields,
  isLoading,
  globalDoorSettings,
  setGlobalDoorSettings,
  fieldOptions,
  doors,
  setDoors,
}: any) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex gap-6">
        {/* Left side - Order Information (50%) */}
        <div className="flex-1">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                {t("forms.order_information")}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {t("forms.basic_order_info_description")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResourceForm
                fields={orderFields}
                onSubmit={() => {}}
                isSubmitting={isLoading}
                hideSubmitButton={true}
                form={orderForm}
                gridClassName="grid-cols-1 gap-6"
              />

              {/* Custom Counterparty Select Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("forms.agent")} *
                </label>
                <SearchableCounterpartySelect
                  value={orderForm.watch("agent")}
                  onChange={(value) => orderForm.setValue("agent", value)}
                  placeholder={t("placeholders.select_agent")}
                  required={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Material Settings (50%) */}
        <div className="flex-1">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DoorOpen className="h-6 w-6 text-green-600" />
                </div>
                {t("forms.global_door_settings")}
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {t("forms.global_door_settings_description")}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Material */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.material")}
                  </label>
                  <Select
                    value={globalDoorSettings.material}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        material: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.select_material")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.materialOptions?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Material Type */}
                <div className="space-y-2 w-full">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.material_type")}
                  </label>
                  <Select
                    value={globalDoorSettings.material_type}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        material_type: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.select_material_type")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.materialTypeOptions?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Massif */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.massif")}
                  </label>
                  <Select
                    value={globalDoorSettings.massif}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        massif: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.select_massif")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.massifOptions?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.color")}
                  </label>
                  <Select
                    value={globalDoorSettings.color}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        color: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.select_color")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.colorOptions?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Patina Color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.patina_color")}
                  </label>
                  <Select
                    value={globalDoorSettings.patina_color}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        patina_color: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.select_patina_color")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.patinaColorOptions?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Beading Main */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.beading_main")}
                  </label>
                  <Select
                    value={globalDoorSettings.beading_main}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        beading_main: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("placeholders.select_beading_main")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.beadingMainOptions?.map((option: any) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Beading Additional */}
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    {t("forms.beading_additional")}
                  </label>
                  <Select
                    value={globalDoorSettings.beading_additional}
                    onValueChange={(value) =>
                      setGlobalDoorSettings((prev: any) => ({
                        ...prev,
                        beading_additional: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t(
                          "placeholders.select_beading_additional",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.beadingAdditionalOptions?.map(
                        (option: any) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Glass Type */}
                {/* <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t("forms.glass_type")}
              </label>
              <Select
                value={globalDoorSettings.glass_type}
                onValueChange={(value) => setGlobalDoorSettings((prev:any) => ({ ...prev, glass_type: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("placeholders.select_glass_type")} />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.glassTypeOptions?.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

                {/* Threshold */}
                {/* <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                {t("forms.threshold")}
              </label>
              <Select
                value={globalDoorSettings.threshold}
                onValueChange={(value) => setGlobalDoorSettings((prev:any) => ({ ...prev, threshold: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("placeholders.select_threshold")} />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.thresholdOptions?.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
              </div>

              {/* Apply to All Doors Button */}
              {doors.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        {t("forms.apply_to_all_doors")}
                      </h4>
                      <p className="text-xs text-blue-700 mt-1">
                        {t("forms.apply_to_all_doors_description")}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const updatedDoors = doors.map((door: any) => ({
                          ...door,
                          material: globalDoorSettings.material,
                          material_type: globalDoorSettings.material_type,
                          massif: globalDoorSettings.massif,
                          color: globalDoorSettings.color,
                          patina_color: globalDoorSettings.patina_color,
                          beading_main: globalDoorSettings.beading_main,
                          beading_additional:
                            globalDoorSettings.beading_additional,
                          // glass_type: globalDoorSettings.glass_type,
                          // threshold: globalDoorSettings.threshold,
                        }));
                        setDoors(updatedDoors);
                      }}
                      className="text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      {t("forms.apply_to_all")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StepTwo({
  doors,
  setDoors,
  fieldOptions,
  productsList,
  orderForm,
  casingSize,
  crownSize,
}: any) {
  const { t } = useTranslation();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDoor, setEditingDoor] = useState<any>(null);

  // Search states for each section
  const [doorSearch, setDoorSearch] = useState<string>("");
  const [tempSelectedDoorProduct, setTempSelectedDoorProduct] =
    useState<any>(null);
  const [lastSelectedDoorModel, setLastSelectedDoorModel] = useState<any>(null);
  const [extensionSearch, setExtensionSearch] = useState<string>("");
  const [casingSearch, setCasingSearch] = useState<string>("");
  const [crownSearch, setCrownSearch] = useState<string>("");

  // Search states for accessories
  const [cubeSearch, setCubeSearch] = useState<string>("");
  const [legSearch, setLegSearch] = useState<string>("");
  const [glassSearch, setGlassSearch] = useState<string>("");
  const [lockSearch, setLockSearch] = useState<string>("");
  const [topsaSearch, setTopsaSearch] = useState<string>("");
  const [beadingSearch, setBeadingSearch] = useState<string>("");

  // Selected products and price types for each section (header level)
  const [selectedExtensionProduct, setSelectedExtensionProduct] =
    useState<any>(null);
  const [selectedCasingProduct, setSelectedCasingProduct] = useState<any>(null);
  const [selectedCrownProduct, setSelectedCrownProduct] = useState<any>(null);

  // Selected products for accessories
  const [selectedCubeProduct, setSelectedCubeProduct] = useState<any>(null);
  const [selectedLegProduct, setSelectedLegProduct] = useState<any>(null);
  const [selectedGlassProduct, setSelectedGlassProduct] = useState<any>(null);
  const [selectedLockProduct, setSelectedLockProduct] = useState<any>(null);
  const [selectedTopsaProduct, setSelectedTopsaProduct] = useState<any>(null);
  const [selectedBeadingProduct, setSelectedBeadingProduct] =
    useState<any>(null);

  // Price types for each section (header level)
  const [extensionPriceType, setExtensionPriceType] = useState<string>("");
  const [casingPriceType, setCasingPriceType] = useState<string>("");
  const [crownPriceType, setCrownPriceType] = useState<string>("");

  // Price types for accessories
  const [cubePriceType, setCubePriceType] = useState<string>("");
  const [legPriceType, setLegPriceType] = useState<string>("");
  const [glassPriceType, setGlassPriceType] = useState<string>("");
  const [lockPriceType, setLockPriceType] = useState<string>("");
  const [topsaPriceType, setTopsaPriceType] = useState<string>("");
  const [beadingPriceType, setBeadingPriceType] = useState<string>("");
  console.log("editing door", editingDoor);
  console.log("cube search", selectedCubeProduct);

  // Helper function to update accessories by type instead of hardcoded index
  const updateAccessoryByType = (
    currentAccessories: any[],
    accessoryType: string,
    updates: any,
  ) => {
    const updatedAccessories = [...(currentAccessories || [])];

    // Find existing accessory of this type
    const existingIndex = updatedAccessories.findIndex(
      (acc: any) => acc.accessory_type === accessoryType,
    );

    if (existingIndex >= 0) {
      // Update existing accessory
      updatedAccessories[existingIndex] = {
        ...updatedAccessories[existingIndex],
        ...updates,
        accessory_type: accessoryType,
      };
    } else {
      // Add new accessory
      updatedAccessories.push({
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        ...updates,
        accessory_type: accessoryType,
      });
    }

    return updatedAccessories;
  };

  const handleAddNewRow = () => {
    // Get material attributes from the order form to apply to all doors
    const orderData = orderForm.getValues();

    // Use last selected door model as default for new rows
    const defaultDoorModel = lastSelectedDoorModel?.id || "";
    const defaultDoorPriceType = lastSelectedDoorModel?.lastPriceType || "";
    const defaultDoorPrice =
      lastSelectedDoorModel && lastSelectedDoorModel.lastPriceType
        ? (lastSelectedDoorModel.salePrices?.find(
            (p: any) => p.priceType.id === lastSelectedDoorModel.lastPriceType,
          )?.value || 0) / 100
        : 0;

    // Create 2 default extensions (dobors) - with selected product if available, otherwise empty entries
    const defaultExtensions = [
      {
        model: selectedExtensionProduct ? selectedExtensionProduct.id : "",
        price_type: extensionPriceType || "",
        price:
          selectedExtensionProduct && extensionPriceType
            ? (selectedExtensionProduct.salePrices?.find(
                (p: any) => p.priceType.id === extensionPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 1,
        height: 0,
        width: 0,
      },
      {
        model: selectedExtensionProduct ? selectedExtensionProduct.id : "",
        price_type: extensionPriceType || "",
        price:
          selectedExtensionProduct && extensionPriceType
            ? (selectedExtensionProduct.salePrices?.find(
                (p: any) => p.priceType.id === extensionPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 1,
        height: 0,
        width: 0,
      },
    ];

    // Create 2 default casings - with selected product if available, otherwise empty entries
    const defaultCasings = [
      {
        model: selectedCasingProduct ? selectedCasingProduct.id : "",
        price_type: casingPriceType || "",
        price:
          selectedCasingProduct && casingPriceType
            ? (selectedCasingProduct.salePrices?.find(
                (p: any) => p.priceType.id === casingPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 1,
        casing_type: "боковой",
        casing_formula: "formula1",
        casing_range: "",
        height: 0,
        width: casingSize,
      },
      {
        model: selectedCasingProduct ? selectedCasingProduct.id : "",
        price_type: casingPriceType || "",
        price:
          selectedCasingProduct && casingPriceType
            ? (selectedCasingProduct.salePrices?.find(
                (p: any) => p.priceType.id === casingPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 1,
        casing_type: "прямой",
        casing_formula: "formula1",
        casing_range: "",
        height: 0,
        width: casingSize,
      },
    ];

    // Create 1 default crown - with selected product if available, otherwise empty entry
    const defaultCrowns = [
      {
        model: selectedCrownProduct ? selectedCrownProduct.id : "",
        price_type: crownPriceType || "",
        price:
          selectedCrownProduct && crownPriceType
            ? (selectedCrownProduct.salePrices?.find(
                (p: any) => p.priceType.id === crownPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 1,
        height: 0,
        width: 0 + crownSize, // Will be recalculated when door width is set
      },
    ];

    // Create 6 predefined accessories with selected products
    const defaultAccessories = [
      {
        model: selectedCubeProduct ? selectedCubeProduct.id : "",
        price_type: cubePriceType || "",
        price:
          selectedCubeProduct && cubePriceType
            ? (selectedCubeProduct.salePrices?.find(
                (p: any) => p.priceType.id === cubePriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 0,
        accessory_type: "cube",
        name: "Кубик",
      },
      {
        model: selectedLegProduct ? selectedLegProduct.id : "",
        price_type: legPriceType || "",
        price:
          selectedLegProduct && legPriceType
            ? (selectedLegProduct.salePrices?.find(
                (p: any) => p.priceType.id === legPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 0,
        accessory_type: "leg",
        name: "Ножка",
      },
      {
        model: selectedGlassProduct ? selectedGlassProduct.id : "",
        price_type: glassPriceType || "",
        price:
          selectedGlassProduct && glassPriceType
            ? (selectedGlassProduct.salePrices?.find(
                (p: any) => p.priceType.id === glassPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 0,
        accessory_type: "glass",
        name: "Стекло",
      },
      {
        model: selectedLockProduct ? selectedLockProduct.id : "",
        price_type: lockPriceType || "",
        price:
          selectedLockProduct && lockPriceType
            ? (selectedLockProduct.salePrices?.find(
                (p: any) => p.priceType.id === lockPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 0,
        accessory_type: "lock",
        name: "Замок",
      },
      {
        model: selectedTopsaProduct ? selectedTopsaProduct.id : "",
        price_type: topsaPriceType || "",
        price:
          selectedTopsaProduct && topsaPriceType
            ? (selectedTopsaProduct.salePrices?.find(
                (p: any) => p.priceType.id === topsaPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 0,
        accessory_type: "topsa",
        name: "Топса",
      },
      {
        model: selectedBeadingProduct ? selectedBeadingProduct.id : "",
        price_type: beadingPriceType || "",
        price:
          selectedBeadingProduct && beadingPriceType
            ? (selectedBeadingProduct.salePrices?.find(
                (p: any) => p.priceType.id === beadingPriceType,
              )?.value || 0) / 100
            : 0,
        quantity: 0,
        accessory_type: "beading",
        name: "Шпингалет",
      },
    ];

    const newDoor = {
      model: defaultDoorModel,
      price_type: defaultDoorPriceType,
      price: defaultDoorPrice,
      quantity: 1,
      height: 0,
      width: 0,
      material: orderData.material || "",
      material_type: orderData.material_type || "",
      massif: orderData.massif || "",
      color: orderData.color || "",
      patina_color: orderData.patina_color || "",
      beading_main: orderData.beading_main || "",
      beading_additional: orderData.beading_additional || "2",
      glass_type: "",
      threshold: "",
      extensions: defaultExtensions,
      casings: defaultCasings,
      crowns: defaultCrowns,
      accessories: defaultAccessories,
    };

    const newIndex = doors.length;
    setDoors([...doors, newDoor]);
    setEditingIndex(newIndex);
    setEditingDoor({ ...newDoor });

    // If we have a default door model, set it as temp selected product and search text
    if (lastSelectedDoorModel) {
      setTempSelectedDoorProduct(lastSelectedDoorModel);
      setDoorSearch(lastSelectedDoorModel.name || "");
    } else {
      setDoorSearch("");
      setTempSelectedDoorProduct(null);
    }
  };

  // Effect to update all doors when material attributes change in order form
  const materialAttributes = orderForm.watch([
    "material",
    "material_type",
    "massif",
    "color",
    "patina_color",
    "beading_main",
    "beading_additional",
  ]);

  useEffect(() => {
    if (doors.length > 0) {
      const [
        material,
        material_type,
        massif,
        color,
        patina_color,
        beading_main,
      ] = materialAttributes;

      const updatedDoors = doors.map((door: any) => ({
        ...door,
        material: material || "",
        material_type: material_type || "",
        massif: massif || "",
        color: color || "",
        patina_color: patina_color || "",
        beading_main: beading_main || "",
      }));

      setDoors(updatedDoors);

      // Also update editing door if it's currently being edited
      if (editingDoor && editingIndex !== null) {
        setEditingDoor({
          ...editingDoor,
          material: material || "",
          material_type: material_type || "",
          massif: massif || "",
          color: color || "",
          patina_color: patina_color || "",
          beading_main: beading_main || "",
        });
      }
    }
  }, materialAttributes);

  const handleEditDoor = (index: number) => {
    setEditingIndex(index);
    setEditingDoor({ ...doors[index] });
    // Set temp selected product based on current door model
    const currentDoorProduct = productsList.find(
      (p: any) => p.id === doors[index].model,
    );
    if (currentDoorProduct) {
      setDoorSearch(currentDoorProduct.name || "");
      setTempSelectedDoorProduct({
        ...currentDoorProduct,
        lastPriceType: doors[index].price_type,
      });
    } else {
      setDoorSearch("");
      setTempSelectedDoorProduct(null);
    }

    // Populate accessory search fields from existing accessory data
    const accessories = doors[index].accessories || [];

    // Cube - find by accessory_type
    const cubeAccessory = accessories.find(
      (acc: any) => acc.accessory_type === "cube",
    );
    if (cubeAccessory && cubeAccessory.model) {
      const cubeProduct = productsList.find(
        (p: any) => p.id === cubeAccessory.model,
      );
      if (cubeProduct) {
        setCubeSearch(cubeProduct.name || "");
        setSelectedCubeProduct(cubeProduct);
        setCubePriceType(cubeAccessory.price_type || "");
      }
    } else {
      setCubeSearch("");
      setSelectedCubeProduct(null);
      setCubePriceType("");
    }

    // Leg - find by accessory_type
    const legAccessory = accessories.find(
      (acc: any) => acc.accessory_type === "leg",
    );
    if (legAccessory && legAccessory.model) {
      const legProduct = productsList.find(
        (p: any) => p.id === legAccessory.model,
      );
      if (legProduct) {
        setLegSearch(legProduct.name || "");
        setSelectedLegProduct(legProduct);
        setLegPriceType(legAccessory.price_type || "");
      }
    } else {
      setLegSearch("");
      setSelectedLegProduct(null);
      setLegPriceType("");
    }

    // Glass - find by accessory_type
    const glassAccessory = accessories.find(
      (acc: any) => acc.accessory_type === "glass",
    );
    if (glassAccessory && glassAccessory.model) {
      const glassProduct = productsList.find(
        (p: any) => p.id === glassAccessory.model,
      );
      if (glassProduct) {
        setGlassSearch(glassProduct.name || "");
        setSelectedGlassProduct(glassProduct);
        setGlassPriceType(glassAccessory.price_type || "");
      }
    } else {
      setGlassSearch("");
      setSelectedGlassProduct(null);
      setGlassPriceType("");
    }

    // Lock - find by accessory_type
    const lockAccessory = accessories.find(
      (acc: any) => acc.accessory_type === "lock",
    );
    if (lockAccessory && lockAccessory.model) {
      const lockProduct = productsList.find(
        (p: any) => p.id === lockAccessory.model,
      );
      if (lockProduct) {
        setLockSearch(lockProduct.name || "");
        setSelectedLockProduct(lockProduct);
        setLockPriceType(lockAccessory.price_type || "");
      }
    } else {
      setLockSearch("");
      setSelectedLockProduct(null);
      setLockPriceType("");
    }

    // Topsa - find by accessory_type
    const topsaAccessory = accessories.find(
      (acc: any) => acc.accessory_type === "topsa",
    );
    if (topsaAccessory && topsaAccessory.model) {
      const topsaProduct = productsList.find(
        (p: any) => p.id === topsaAccessory.model,
      );
      if (topsaProduct) {
        setTopsaSearch(topsaProduct.name || "");
        setSelectedTopsaProduct(topsaProduct);
        setTopsaPriceType(topsaAccessory.price_type || "");
      }
    } else {
      setTopsaSearch("");
      setSelectedTopsaProduct(null);
      setTopsaPriceType("");
    }

    // Beading - find by accessory_type
    const beadingAccessory = accessories.find(
      (acc: any) => acc.accessory_type === "beading",
    );
    if (beadingAccessory && beadingAccessory.model) {
      const beadingProduct = productsList.find(
        (p: any) => p.id === beadingAccessory.model,
      );
      if (beadingProduct) {
        setBeadingSearch(beadingProduct.name || "");
        setSelectedBeadingProduct(beadingProduct);
        setBeadingPriceType(beadingAccessory.price_type || "");
      }
    } else {
      setBeadingSearch("");
      setSelectedBeadingProduct(null);
      setBeadingPriceType("");
    }

    // Populate extension search fields from existing extension data

    const extensions = doors[index].extensions || [];
    const extensionProduct = productsList.find(
      (p: any) => p.id === extensions[0].model,
    );
    console.log("extensions", extensionProduct);
    if (extensions[0] && extensions[0].model) {
      const extensionProduct = productsList.find(
        (p: any) => p.id === extensions[0].model,
      );

      if (extensionProduct) {
        setExtensionSearch(extensionProduct.name || "");
        setSelectedExtensionProduct(extensionProduct);
        setExtensionPriceType(extensions[0].price_type || "");
      }
    } else {
      setExtensionSearch("");
      setSelectedExtensionProduct(null);
      setExtensionPriceType("");
    }

    // Populate casing search fields from existing casing data
    const casings = doors[index].casings || [];
    if (casings[0] && casings[0].model) {
      const casingProduct = productsList.find(
        (p: any) => p.id === casings[0].model,
      );
      if (casingProduct) {
        setCasingSearch(casingProduct.name || "");
        setSelectedCasingProduct(casingProduct);
        setCasingPriceType(casings[0].price_type || "");
      }
    } else {
      setCasingSearch("");
      setSelectedCasingProduct(null);
      setCasingPriceType("");
    }

    // Populate crown search fields from existing crown data
    const crowns = doors[index].crowns || [];
    if (crowns[0] && crowns[0].model) {
      const crownProduct = productsList.find(
        (p: any) => p.id === crowns[0].model,
      );
      if (crownProduct) {
        setCrownSearch(crownProduct.name || "");
        setSelectedCrownProduct(crownProduct);
        setCrownPriceType(crowns[0].price_type || "");
      }
    } else {
      setCrownSearch("");
      setSelectedCrownProduct(null);
      setCrownPriceType("");
    }
  };

  const handleSaveDoor = () => {
    if (editingIndex !== null && editingDoor) {
      const updatedDoors = [...doors];

      // Helper function to convert string with comma to number
      const convertToNumber = (value: any, defaultValue: number = 0) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          // Replace comma with dot and clean
          const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
          if (normalized === "" || normalized === ".") return defaultValue;
          const parsed = parseFloat(normalized);
          return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
      };

      // Validate door model and price type
      if (!editingDoor.model) {
        toast.error("Please select a door model");
        return;
      }
      if (!editingDoor.price_type) {
        toast.error("Please select a price type for the door");
        return;
      }

      // Apply door data being saved
      const updatedDoor = {
        ...editingDoor,
        // Keep individual door model and price type selections
        model: editingDoor.model,
        price_type: editingDoor.price_type,
        price: convertToNumber(editingDoor.price, 0),
        quantity: parseInt(editingDoor.quantity || 1),
        height: convertToNumber(editingDoor.height, 0),
        width: convertToNumber(editingDoor.width, 0),
        // Update extensions with header selection
        extensions:
          editingDoor.extensions?.map((ext: any) => ({
            ...ext,
            model: selectedExtensionProduct?.id || ext.model,
            price_type: extensionPriceType || ext.price_type,
            price:
              selectedExtensionProduct && extensionPriceType
                ? (selectedExtensionProduct.salePrices?.find(
                    (p: any) => p.priceType.id === extensionPriceType,
                  )?.value || 0) / 100
                : convertToNumber(ext.price, 0),
            height: convertToNumber(ext.height, 0),
            width: convertToNumber(ext.width, 0),
          })) || [],
        // Update casings with header selection
        casings:
          editingDoor.casings?.map((casing: any, casIndex: number) => ({
            ...casing,
            model: selectedCasingProduct?.id || casing.model,
            price_type: casingPriceType || casing.price_type,
            price:
              selectedCasingProduct && casingPriceType
                ? (selectedCasingProduct.salePrices?.find(
                    (p: any) => p.priceType.id === casingPriceType,
                  )?.value || 0) / 100
                : convertToNumber(casing.price, 0),
            height: convertToNumber(casing.height, 0),
            width: convertToNumber(casing.width, 0),
            // Ensure casing types are properly set: first one is "боковой", second one is "прямой"
            casing_type: casIndex === 0 ? "боковой" : "прямой",
          })) || [],
        // Update crowns with header selection
        crowns:
          editingDoor.crowns?.map((crown: any) => ({
            ...crown,
            model: selectedCrownProduct?.id || crown.model,
            price_type: crownPriceType || crown.price_type,
            price:
              selectedCrownProduct && crownPriceType
                ? (selectedCrownProduct.salePrices?.find(
                    (p: any) => p.priceType.id === crownPriceType,
                  )?.value || 0) / 100
                : convertToNumber(crown.price, 0),
            height: convertToNumber(crown.height, 0),
            width: convertToNumber(crown.width, 0),
          })) || [],
        // Keep individual accessory model selections (don't override with header selection)
        accessories:
          editingDoor.accessories?.map((accessory: any) => ({
            ...accessory,
            // Only convert price to number, keep individual model and price_type selections
            price: convertToNumber(accessory.price, 0),
          })) || [],
      };

      updatedDoors[editingIndex] = updatedDoor;
      setDoors(updatedDoors);
      setEditingIndex(null);
      setEditingDoor(null);
      // Reset temporary states
      setDoorSearch("");
      setTempSelectedDoorProduct(null);
      toast.success(t("forms.door_updated_successfully"));
    }
  };

  const handleCancelEdit = () => {
    if (editingIndex === doors.length - 1 && !doors[editingIndex].model) {
      // If it's a new row that was just added and not saved, remove it
      setDoors(doors.slice(0, -1));
    }
    setEditingIndex(null);
    setEditingDoor(null);
    // Reset temporary states
    setDoorSearch("");
    setTempSelectedDoorProduct(null);
  };

  const handleRemoveDoor = (index: number) => {
    setDoors(doors.filter((_: any, i: number) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingDoor(null);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    const convertToNumber = (value: any, defaultValue: number = 0) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
        if (normalized === "" || normalized === ".") return defaultValue;
        const parsed = parseFloat(normalized);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      return defaultValue;
    };

    if (editingDoor) {
      console.log(
        "handleFieldChange called - field:",
        field,
        "value:",
        value,
        "type:",
        typeof value,
      ); // Debug log

      if (field === "model" && value === "") {
        console.log("WARNING: Model field being set to empty string!"); // Debug log
        console.trace("Stack trace for empty model value"); // Stack trace
      }

      // Handle comma-separated decimal numbers
      if (field === "price" || field === "height" || field === "width") {
        // Replace comma with dot for decimal numbers
        if (typeof value === "string") {
          // Clean the input - replace comma with dot and remove any non-numeric characters except dots
          let cleanedValue = value.replace(/,/g, ".").replace(/[^\d.]/g, "");

          // Handle multiple dots - keep only the first one
          const parts = cleanedValue.split(".");
          if (parts.length > 2) {
            cleanedValue = parts[0] + "." + parts.slice(1).join("");
          }

          value = cleanedValue;
        }
      }

      // Use functional update to avoid stale closure issues
      setEditingDoor((prevEditingDoor: any) => {
        if (!prevEditingDoor) return prevEditingDoor;
        // Handle numeric fields - keep as strings during editing to preserve input like "0,5"
        if (field === "price" || field === "height" || field === "width") {
          let processedValue = value;
          if (typeof value === "string") {
            // Replace comma with dot for decimal separator and clean input
            let normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");

            // Handle multiple dots - keep only the first one
            const parts = normalized.split(".");
            if (parts.length > 2) {
              normalized = parts[0] + "." + parts.slice(1).join("");
            }

            // Keep as string to preserve partial input like "0." or "0"
            processedValue = normalized;
          }
          const newEditingDoor = {
            ...prevEditingDoor,
            [field]: processedValue,
          };
          console.log(
            "Setting editingDoor for numeric field:",
            field,
            "new editingDoor:",
            newEditingDoor,
          );

          // If door width or height changed, update crown widths and recalculate casing dimensions
          if (field === "width" || field === "height") {
            // Update crown widths
            if (newEditingDoor.crowns && newEditingDoor.crowns.length > 0) {
              newEditingDoor.crowns = newEditingDoor.crowns.map(
                (crown: any) => ({
                  ...crown,
                  width: convertToNumber(newEditingDoor.width, 0) + crownSize,
                }),
              );
            }

            // Recalculate casing dimensions
            if (newEditingDoor.casings && newEditingDoor.casings.length > 0) {
              newEditingDoor.casings = newEditingDoor.casings.map(
                (casing: any) =>
                  calculateCasingDimensions(
                    { ...casing },
                    newEditingDoor,
                    fieldOptions,
                    casingSize,
                  ),
              );
            }
          }

          return newEditingDoor;
        } else if (field === "quantity") {
          let numericValue = value;
          if (typeof value === "string") {
            numericValue = value === "" ? 0 : parseInt(value);
          }
          const newEditingDoor = {
            ...prevEditingDoor,
            [field]: numericValue,
          };
          return newEditingDoor;
        } else {
          // For non-numeric fields
          const newEditingDoor = {
            ...prevEditingDoor,
            [field]: value,
          };
          console.log(
            "Setting editingDoor for non-numeric field:",
            field,
            "new editingDoor:",
            newEditingDoor,
          );

          // If door width or height changed, update crown widths and recalculate casing dimensions
          if (field === "width" || field === "height") {
            // Update crown widths
            if (newEditingDoor.crowns && newEditingDoor.crowns.length > 0) {
              newEditingDoor.crowns = newEditingDoor.crowns.map(
                (crown: any) => ({
                  ...crown,
                  width: convertToNumber(newEditingDoor.width, 0) + crownSize,
                }),
              );
            }

            // Recalculate casing dimensions
            if (newEditingDoor.casings && newEditingDoor.casings.length > 0) {
              newEditingDoor.casings = newEditingDoor.casings.map(
                (casing: any) =>
                  calculateCasingDimensions(
                    { ...casing },
                    newEditingDoor,
                    fieldOptions,
                    casingSize,
                  ),
              );
            }
          }

          return newEditingDoor;
        }
      });
    }
  };

  // Function to calculate casing dimensions based on formula and type
  const calculateCasingDimensions = (
    casing: any,
    doorData: any,
    fieldOptions: any,
    casingSize: number,
  ) => {
    if (!doorData) return casing;

    const convertToNumber = (value: any, defaultValue: number = 0) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
        if (normalized === "" || normalized === ".") return defaultValue;
        const parsed = parseFloat(normalized);
        return isNaN(parsed) ? defaultValue : parsed;
      }
      return defaultValue;
    };

    const doorWidth = convertToNumber(doorData.width, 0);
    const doorHeight = convertToNumber(doorData.height, 0);

    // Auto-calculate height based on formula
    if (casing.casing_formula === "formula2" && casing.casing_range) {
      // Find the selected casing range object to get its casing_size
      const selectedRange = fieldOptions.casingRangeOptions?.find(
        (range: any) => range.value === String(casing.casing_range),
      );
      if (selectedRange && selectedRange.casing_size !== undefined) {
        casing.height = selectedRange.casing_size;
      }
    } else if (casing.casing_formula === "formula1" || !casing.casing_formula) {
      // Original logic using door dimensions
      if (casing.casing_type === "боковой") {
        casing.height = doorHeight + casingSize;
      } else if (casing.casing_type === "прямой") {
        casing.height = doorWidth + 2 * casingSize;
      }
    }

    // Always set width to casingSize for casings
    casing.width = casingSize;

    return casing;
  };

  const getProductName = (modelId: string | any) => {
    if (typeof modelId === "object" && modelId !== null) {
      if (modelId.name) return modelId.name;
      if (modelId.label) return modelId.label;
      if (modelId.value) {
        return getProductName(modelId.value);
      }
      if (modelId.id) {
        modelId = modelId.id;
      } else {
        return t("forms.unknown_product");
      }
    }

    const model = getProductById(productsList, modelId);
    if (model && typeof model === "object" && model.name) {
      return model.name;
    }
    if (typeof modelId === "string" || typeof modelId === "number") {
      return String(modelId);
    }
    return t("forms.unknown_product");
  };

  return (
    <div>
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DoorOpen className="h-6 w-6 text-green-600" />
                </div>
                {t("forms.doors_configuration")}
                <Badge variant="secondary" className="ml-3 px-3 py-1">
                  {doors.length} {t("forms.doors_added")}
                </Badge>
              </CardTitle>
              <p className="text-gray-600 mt-2">
                {t("forms.add_doors_description")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleAddNewRow}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                {t("forms.add_row")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border overflow-x-auto relative">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[250px]">
                    {t("forms.door_model")}
                  </TableHead>
                  <TableHead className="w-16">{t("forms.quantity")}</TableHead>
                  <TableHead className="w-20">{t("forms.height")}</TableHead>
                  <TableHead className="w-20">{t("forms.width")}</TableHead>
                  <TableHead className="w-28">
                    {t("forms.glass_type")}
                  </TableHead>
                  <TableHead className="w-28">{t("forms.threshold")}</TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span>{t("forms.extensions")}</span>
                        {/* <span className="text-xs text-gray-500">(Search & select first)</span> */}
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={extensionSearch}
                            onChange={setExtensionSearch}
                            placeholder={t("forms.search_extensions")}
                            onProductSelect={setSelectedExtensionProduct}
                          />
                          <Select
                            value={extensionPriceType}
                            onValueChange={setExtensionPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedExtensionProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[570px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>{t("forms.casings")}</span>
                        {/* <span className="text-xs text-gray-500">(Search & select first)</span> */}
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={casingSearch}
                            onChange={setCasingSearch}
                            placeholder={t("forms.search_casings")}
                            onProductSelect={setSelectedCasingProduct}
                          />
                          <Select
                            value={casingPriceType}
                            onValueChange={setCasingPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedCasingProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span>{t("forms.crowns")}</span>
                        {/* <span className="text-xs text-gray-500">(Search & select first)</span> */}
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={crownSearch}
                            onChange={setCrownSearch}
                            placeholder={t("forms.search_crowns")}
                            onProductSelect={setSelectedCrownProduct}
                          />
                          <Select
                            value={crownPriceType}
                            onValueChange={setCrownPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedCrownProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>Кубик</span>
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={cubeSearch}
                            onChange={setCubeSearch}
                            placeholder={t("forms.search_cubes")}
                            onProductSelect={setSelectedCubeProduct}
                          />
                          <Select
                            value={cubePriceType}
                            onValueChange={setCubePriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedCubeProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>Ножка</span>
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={legSearch}
                            onChange={setLegSearch}
                            placeholder={t("forms.search_legs")}
                            onProductSelect={setSelectedLegProduct}
                          />
                          <Select
                            value={legPriceType}
                            onValueChange={setLegPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedLegProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>Стекло</span>
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={glassSearch}
                            onChange={setGlassSearch}
                            placeholder={t("forms.search_glass")}
                            onProductSelect={setSelectedGlassProduct}
                          />
                          <Select
                            value={glassPriceType}
                            onValueChange={setGlassPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedGlassProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>Замок</span>
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={lockSearch}
                            onChange={setLockSearch}
                            placeholder={t("forms.search_locks")}
                            onProductSelect={setSelectedLockProduct}
                          />
                          <Select
                            value={lockPriceType}
                            onValueChange={setLockPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedLockProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>Топса</span>
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={topsaSearch}
                            onChange={setTopsaSearch}
                            placeholder={t("forms.search_topsas")}
                            onProductSelect={setSelectedTopsaProduct}
                          />
                          <Select
                            value={topsaPriceType}
                            onValueChange={setTopsaPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedTopsaProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <span>Шпингалет</span>
                      </div>
                      {editingIndex !== null && (
                        <>
                          <HeaderSearch
                            value={beadingSearch}
                            onChange={setBeadingSearch}
                            placeholder={t("forms.search_beading")}
                            onProductSelect={setSelectedBeadingProduct}
                          />
                          <Select
                            value={beadingPriceType}
                            onValueChange={setBeadingPriceType}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue
                                placeholder={t("forms.price_type")}
                              />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              {selectedBeadingProduct?.salePrices?.map(
                                (price: any) => (
                                  <SelectItem
                                    key={price.priceType.id}
                                    value={price.priceType.id}
                                  >
                                    {price.priceType.name} -{" "}
                                    {(price.value / 100).toFixed(2)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-32">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doors.map((door: any, index: number) => (
                  <TableRow
                    key={index}
                    className={editingIndex === index ? "bg-blue-50" : ""}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>

                    {/* Door Model */}
                    <TableCell
                      className={`${editingIndex === index ? "align-middle" : "align-top"} p-2`}
                    >
                      {editingIndex === index ? (
                        <div className="space-y-2">
                          <HeaderSearch
                            value={doorSearch}
                            onChange={setDoorSearch}
                            placeholder={t("forms.search_doors")}
                            onProductSelect={(product) => {
                              setTempSelectedDoorProduct(product);
                              handleFieldChange("model", product?.id || "");
                              handleFieldChange("price_type", "");
                              handleFieldChange("price", 0);
                              // Update last selected door model for future rows
                              if (product) {
                                setLastSelectedDoorModel({
                                  ...product,
                                  lastPriceType: "",
                                });
                              }
                            }}
                          />
                          {tempSelectedDoorProduct && (
                            <Select
                              value={editingDoor?.price_type || ""}
                              onValueChange={(value) => {
                                const selectedPrice =
                                  tempSelectedDoorProduct?.salePrices?.find(
                                    (p: any) => p.priceType.id === value,
                                  );
                                handleFieldChange("price_type", value);
                                handleFieldChange(
                                  "price",
                                  selectedPrice ? selectedPrice.value / 100 : 0,
                                );
                                // Update last selected price type for future rows
                                if (tempSelectedDoorProduct) {
                                  setLastSelectedDoorModel({
                                    ...tempSelectedDoorProduct,
                                    lastPriceType: value,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Тип цены" />
                              </SelectTrigger>
                              <SelectContent className="z-[9999]">
                                {tempSelectedDoorProduct?.salePrices?.map(
                                  (price: any) => (
                                    <SelectItem
                                      key={price.priceType.id}
                                      value={price.priceType.id}
                                    >
                                      {price.priceType.name} -{" "}
                                      {(price.value / 100).toFixed(2)}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-xs font-medium">
                            {getProductName(door.model) || "No model selected"}
                          </div>
                          {/* {door.price_type && (
                            <div className="text-xs text-gray-600">
                              {productsList
                                .find((p: any) => p.id === door.model)
                                ?.salePrices?.find(
                                  (p: any) =>
                                    p.priceType.id === door.price_type,
                                )?.priceType?.name || door.price_type}
                            </div>
                          )} */}

                          <Button
                            onClick={() => {
                              handleEditDoor(index);
                            }}
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                          >
                            Сменить модел
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell
                      className={
                        editingIndex === index ? "align-middle" : "align-top"
                      }
                    >
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={editingDoor?.quantity || ""}
                          onChange={(e) =>
                            handleFieldChange("quantity", e.target.value)
                          }
                          className="w-16"
                        />
                      ) : (
                        <span className="text-xs">{door.quantity || 1}</span>
                      )}
                    </TableCell>

                    {/* Height */}
                    <TableCell
                      className={
                        editingIndex === index ? "align-middle" : "align-top"
                      }
                    >
                      {editingIndex === index ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingDoor?.height?.toString() || ""}
                          onChange={(e) =>
                            handleFieldChange("height", e.target.value)
                          }
                          className="w-20"
                        />
                      ) : (
                        <span className="text-xs">{door.height || 0}</span>
                      )}
                    </TableCell>

                    {/* Width */}
                    <TableCell
                      className={
                        editingIndex === index ? "align-middle" : "align-top"
                      }
                    >
                      {editingIndex === index ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingDoor?.width?.toString() || ""}
                          onChange={(e) =>
                            handleFieldChange("width", e.target.value)
                          }
                          className="w-20"
                        />
                      ) : (
                        <span className="text-xs">{door.width || 0}</span>
                      )}
                    </TableCell>

                    {/* Glass Type */}
                    <TableCell
                      className={
                        editingIndex === index ? "align-middle" : "align-top"
                      }
                    >
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.glass_type || ""}
                          onValueChange={(value) =>
                            handleFieldChange("glass_type", value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue
                              placeholder={t("placeholders.select_glass_type")}
                            />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {fieldOptions.glassTypeOptions?.map(
                              (option: any) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs truncate max-w-[100px]">
                          {fieldOptions.glassTypeOptions?.find(
                            (opt: any) => opt.value === door.glass_type,
                          )?.label || "-"}
                        </span>
                      )}
                    </TableCell>

                    {/* Threshold */}
                    <TableCell
                      className={
                        editingIndex === index ? "align-middle" : "align-top"
                      }
                    >
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.threshold || ""}
                          onValueChange={(value) =>
                            handleFieldChange("threshold", value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue
                              placeholder={t("placeholders.select_threshold")}
                            />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            {fieldOptions.thresholdOptions?.map(
                              (option: any) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs truncate max-w-[100px]">
                          {fieldOptions.thresholdOptions?.find(
                            (opt: any) => opt.value === door.threshold,
                          )?.label || "-"}
                        </span>
                      )}
                    </TableCell>

                    {/* Extensions - Inline Sub-table */}
                    <TableCell className="align-top p-2">
                      <div className="space-y-1">
                        {editingIndex === index ? (
                          <>
                            {editingDoor?.extensions?.map(
                              (extension: any, extIndex: number) => (
                                <div
                                  key={extIndex}
                                  className="bg-blue-50 p-2 rounded border space-y-1"
                                >
                                  {/* <div className="text-xs font-medium text-blue-700 mb-1">Extension {extIndex + 1}</div> */}
                                  <div className="grid grid-cols-3 gap-1">
                                    {/* <div>
                                    <label className="text-xs text-gray-600">Model</label>
                                    <div className="h-8 px-2 text-xs bg-gray-100 border rounded flex items-center">
                                      {selectedExtensionProduct?.name || "No model selected"}
                                    </div>
                                  </div> */}

                                    <div>
                                      {extIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Кол-во
                                        </label>
                                      )}
                                      <Input
                                        type="number"
                                        value={extension.quantity || ""}
                                        onChange={(e) => {
                                          const updatedExtensions = [
                                            ...editingDoor.extensions,
                                          ];
                                          updatedExtensions[extIndex] = {
                                            ...updatedExtensions[extIndex],
                                            quantity: e.target.value,
                                          };
                                          handleFieldChange(
                                            "extensions",
                                            updatedExtensions,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Кol-во"
                                      />
                                    </div>
                                    <div>
                                      {extIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Высота
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                          extension.height?.toString() || ""
                                        }
                                        onChange={(e) => {
                                          const updatedExtensions = [
                                            ...editingDoor.extensions,
                                          ];
                                          updatedExtensions[extIndex] = {
                                            ...updatedExtensions[extIndex],
                                            height: e.target.value,
                                          };
                                          handleFieldChange(
                                            "extensions",
                                            updatedExtensions,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Высота"
                                      />
                                    </div>
                                    <div>
                                      {extIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Ширина
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                          extension.width?.toString() || ""
                                        }
                                        onChange={(e) => {
                                          const updatedExtensions = [
                                            ...editingDoor.extensions,
                                          ];
                                          updatedExtensions[extIndex] = {
                                            ...updatedExtensions[extIndex],
                                            width: e.target.value,
                                          };
                                          handleFieldChange(
                                            "extensions",
                                            updatedExtensions,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Ширина"
                                      />
                                    </div>
                                  </div>
                                  {/* <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs font-medium text-blue-600">
                                    Total: {(parseFloat(extension.price || 0) * parseInt(extension.quantity || 1)).toFixed(2)}
                                  </span>
                                </div> */}
                                </div>
                              ),
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-600">
                            {/* {door.extensions?.length || 0} items */}
                            {door.extensions?.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {door.extensions.map((ext: any, i: number) => (
                                  <div
                                    key={i}
                                    className="text-xs bg-blue-50 p-1 rounded"
                                  >
                                    {getProductName(ext.model)} (x{ext.quantity}
                                    )
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Casings - Inline Sub-table */}
                    <TableCell className="align-top p-2">
                      <div className="space-y-1">
                        {editingIndex === index ? (
                          <>
                            {editingDoor?.casings?.map(
                              (casing: any, casIndex: number) => (
                                <div
                                  key={casIndex}
                                  className="bg-green-50 p-2 rounded border space-y-1"
                                >
                                  <div className="grid grid-cols-4 gap-10">
                                    <div>
                                      {casIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Кол-во
                                        </label>
                                      )}
                                      <Input
                                        type="number"
                                        value={casing.quantity || ""}
                                        onChange={(e) => {
                                          const updatedCasings = [
                                            ...editingDoor.casings,
                                          ];
                                          updatedCasings[casIndex] = {
                                            ...updatedCasings[casIndex],
                                            quantity: e.target.value,
                                          };
                                          handleFieldChange(
                                            "casings",
                                            updatedCasings,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Кol-во"
                                      />
                                    </div>
                                    {/* <div>
                                    <label className="text-xs text-gray-600">Type</label>
                                    <div className="h-8 px-2 text-xs bg-gray-100 border rounded flex items-center">
                                      {casIndex === 0 ? "боковой" : "прямой"}
                                    </div>
                                  </div> */}
                                    <div>
                                      {/* <label className="text-xs text-gray-600">Height</label> */}
                                      {casIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Высота
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={casing.height?.toString() || ""}
                                        onChange={(e) => {
                                          const updatedCasings = [
                                            ...editingDoor.casings,
                                          ];
                                          updatedCasings[casIndex] = {
                                            ...updatedCasings[casIndex],
                                            height: e.target.value,
                                          };
                                          handleFieldChange(
                                            "casings",
                                            updatedCasings,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Auto-calc"
                                        title={`Calculated based on type: боковой = door height + ${casingSize}, прямой = door width + ${2 * casingSize}`}
                                        disabled={
                                          casing.casing_formula === "formula2"
                                        }
                                      />
                                    </div>
                                    <div>
                                      {/* <label className="text-xs text-gray-600">Formula</label> */}
                                      {casIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Formula
                                        </label>
                                      )}
                                      <Select
                                        value={
                                          casing.casing_formula || "formula1"
                                        }
                                        onValueChange={(value) => {
                                          const updatedCasings = [
                                            ...editingDoor.casings,
                                          ];
                                          const updatedCasing = {
                                            ...updatedCasings[casIndex],
                                            casing_formula: value,
                                          };
                                          if (value === "formula1") {
                                            updatedCasing.casing_range = "";
                                          }
                                          const recalculatedCasing =
                                            calculateCasingDimensions(
                                              updatedCasing,
                                              editingDoor,
                                              fieldOptions,
                                              casingSize,
                                            );
                                          updatedCasings[casIndex] =
                                            recalculatedCasing;
                                          handleFieldChange(
                                            "casings",
                                            updatedCasings,
                                          );
                                        }}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Formula" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                          <SelectItem value="formula1">
                                            Formula 1
                                          </SelectItem>
                                          <SelectItem value="formula2">
                                            Formula 2
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {casing.casing_formula === "formula2" && (
                                      <div>
                                        <label className="text-xs text-gray-600">
                                          Диапазон
                                        </label>
                                        <Select
                                          value={casing.casing_range || ""}
                                          onValueChange={(value) => {
                                            const updatedCasings = [
                                              ...editingDoor.casings,
                                            ];
                                            const updatedCasing = {
                                              ...updatedCasings[casIndex],
                                              casing_range: value,
                                            };
                                            const recalculatedCasing =
                                              calculateCasingDimensions(
                                                updatedCasing,
                                                editingDoor,
                                                fieldOptions,
                                                casingSize,
                                              );
                                            updatedCasings[casIndex] =
                                              recalculatedCasing;
                                            handleFieldChange(
                                              "casings",
                                              updatedCasings,
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Диапазон" />
                                          </SelectTrigger>
                                          <SelectContent className="z-[9999]">
                                            {fieldOptions.casingRangeOptions?.map(
                                              (option: any) => (
                                                <SelectItem
                                                  key={option.value}
                                                  value={option.value}
                                                >
                                                  {option.casing_size}
                                                </SelectItem>
                                              ),
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>

                                  {/* <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs font-medium text-green-600">
                                    Total: {(parseFloat(casing.price || 0) * parseInt(casing.quantity || 1)).toFixed(2)}
                                  </span>
                                </div> */}
                                </div>
                              ),
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-600">
                            {/* {door.casings?.length || 0} <span>элементов</span> */}
                            {door.casings?.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {door.casings.map((casing: any, i: number) => (
                                  <div
                                    key={i}
                                    className="text-xs bg-green-50 p-1 rounded"
                                  >
                                    {getProductName(casing.model)} (x
                                    {casing.quantity})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Crowns - Inline Sub-table */}
                    <TableCell className="align-top p-2">
                      <div className="space-y-1">
                        {editingIndex === index ? (
                          <>
                            {editingDoor?.crowns?.map(
                              (crown: any, crownIndex: number) => (
                                <div
                                  key={crownIndex}
                                  className="bg-purple-50 p-2 rounded border space-y-1"
                                >
                                  {/* <div className="text-xs font-medium text-purple-700 mb-1">Crown {crownIndex + 1}</div> */}
                                  <div className="grid grid-cols-3 gap-1">
                                    {/* <div>
                                    <label className="text-xs text-gray-600">Model</label>
                                    <div className="h-8 px-2 text-xs bg-gray-100 border rounded flex items-center">
                                      {selectedCrownProduct?.name || "No model selected"}
                                    </div>
                                  </div> */}

                                    <div>
                                      {/* <label className="text-xs text-gray-600">Qty</label> */}
                                      {crownIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Кол-во
                                        </label>
                                      )}
                                      <Input
                                        type="number"
                                        value={crown.quantity || ""}
                                        onChange={(e) => {
                                          const updatedCrowns = [
                                            ...editingDoor.crowns,
                                          ];
                                          updatedCrowns[crownIndex] = {
                                            ...updatedCrowns[crownIndex],
                                            quantity: e.target.value,
                                          };
                                          handleFieldChange(
                                            "crowns",
                                            updatedCrowns,
                                          );
                                        }}
                                        placeholder="Кol-во"
                                        className="h-8"
                                      />
                                    </div>

                                    <div>
                                      {crownIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Ширина
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={crown.width?.toString() || ""}
                                        onChange={(e) => {
                                          const updatedCrowns = [
                                            ...editingDoor.crowns,
                                          ];
                                          updatedCrowns[crownIndex] = {
                                            ...updatedCrowns[crownIndex],
                                            width: e.target.value,
                                          };
                                          handleFieldChange(
                                            "crowns",
                                            updatedCrowns,
                                          );
                                        }}
                                        placeholder="Ширина"
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                  {/* <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs font-medium text-purple-600">
                                    Total: {(parseFloat(crown.price || 0) * parseInt(crown.quantity || 1)).toFixed(2)}
                                  </span>
                                </div> */}
                                </div>
                              ),
                            )}
                          </>
                        ) : (
                          <div className="text-xs text-gray-600">
                            {/* {door.crowns?.length || 0} items */}
                            {door.crowns?.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {door.crowns.map((crown: any, i: number) => (
                                  <div
                                    key={i}
                                    className="text-xs bg-purple-50 p-1 rounded"
                                  >
                                    {getProductName(crown.model)} (x
                                    {crown.quantity})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Кубик */}
                    <TableCell className="align-top">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={
                            editingDoor?.accessories?.find(
                              (acc: any) => acc.accessory_type === "cube",
                            )?.quantity || ""
                          }
                          onChange={(e) => {
                            const updatedAccessories = updateAccessoryByType(
                              editingDoor.accessories,
                              "cube",
                              {
                                model: selectedCubeProduct
                                  ? selectedCubeProduct.id
                                  : "",
                                price_type: cubePriceType || "",
                                price:
                                  selectedCubeProduct && cubePriceType
                                    ? (selectedCubeProduct.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.id === cubePriceType,
                                      )?.value || 0) / 100
                                    : 0,
                                quantity: parseInt(e.target.value) || 0,
                                name: "Кубик",
                              },
                            );
                            handleFieldChange(
                              "accessories",
                              updatedAccessories,
                            );
                          }}
                          className="w-45"
                          placeholder="Кol-во"
                          min="0"
                        />
                      ) : (
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const cubeAccessory = door.accessories?.find(
                              (acc: any) => acc.accessory_type === "cube",
                            );
                            return cubeAccessory?.quantity > 0 ? (
                              <div className="bg-blue-50 p-1 rounded">
                                {getProductName(cubeAccessory.model)} (x
                                {cubeAccessory.quantity})
                              </div>
                            ) : (
                              <span>0</span>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    {/* Ножка */}
                    <TableCell className="align-top">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={
                            editingDoor?.accessories?.find(
                              (acc: any) => acc.accessory_type === "leg",
                            )?.quantity || ""
                          }
                          onChange={(e) => {
                            const updatedAccessories = updateAccessoryByType(
                              editingDoor.accessories,
                              "leg",
                              {
                                model: selectedLegProduct
                                  ? selectedLegProduct.id
                                  : "",
                                price_type: legPriceType || "",
                                price:
                                  selectedLegProduct && legPriceType
                                    ? (selectedLegProduct.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.id === legPriceType,
                                      )?.value || 0) / 100
                                    : 0,
                                quantity: parseInt(e.target.value) || 0,
                                name: "Ножка",
                              },
                            );
                            handleFieldChange(
                              "accessories",
                              updatedAccessories,
                            );
                          }}
                          className="w-45"
                          placeholder="Кol-во"
                          min="0"
                        />
                      ) : (
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const legAccessory = door.accessories?.find(
                              (acc: any) => acc.accessory_type === "leg",
                            );
                            return legAccessory?.quantity > 0 ? (
                              <div className="bg-orange-50 p-1 rounded">
                                {getProductName(legAccessory.model)} (x
                                {legAccessory.quantity})
                              </div>
                            ) : (
                              <span>0</span>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    {/* Стекло */}
                    <TableCell className="align-top">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={
                            editingDoor?.accessories?.find(
                              (acc: any) => acc.accessory_type === "glass",
                            )?.quantity || ""
                          }
                          onChange={(e) => {
                            const updatedAccessories = updateAccessoryByType(
                              editingDoor.accessories,
                              "glass",
                              {
                                model: selectedGlassProduct
                                  ? selectedGlassProduct.id
                                  : "",
                                price_type: glassPriceType || "",
                                price:
                                  selectedGlassProduct && glassPriceType
                                    ? (selectedGlassProduct.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.id === glassPriceType,
                                      )?.value || 0) / 100
                                    : 0,
                                quantity: parseInt(e.target.value) || 0,
                                name: "Стекло",
                              },
                            );
                            handleFieldChange(
                              "accessories",
                              updatedAccessories,
                            );
                          }}
                          className="w-45"
                          placeholder="Кol-во"
                          min="0"
                        />
                      ) : (
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const glassAccessory = door.accessories?.find(
                              (acc: any) => acc.accessory_type === "glass",
                            );
                            return glassAccessory?.quantity > 0 ? (
                              <div className="bg-cyan-50 p-1 rounded">
                                {getProductName(glassAccessory.model)} (x
                                {glassAccessory.quantity})
                              </div>
                            ) : (
                              <span>0</span>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    {/* Замок */}
                    <TableCell className="align-top">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={
                            editingDoor?.accessories?.find(
                              (acc: any) => acc.accessory_type === "lock",
                            )?.quantity || ""
                          }
                          onChange={(e) => {
                            const updatedAccessories = updateAccessoryByType(
                              editingDoor.accessories,
                              "lock",
                              {
                                model: selectedLockProduct
                                  ? selectedLockProduct.id
                                  : "",
                                price_type: lockPriceType || "",
                                price:
                                  selectedLockProduct && lockPriceType
                                    ? (selectedLockProduct.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.id === lockPriceType,
                                      )?.value || 0) / 100
                                    : 0,
                                quantity: parseInt(e.target.value) || 0,
                                name: "Замок",
                              },
                            );
                            handleFieldChange(
                              "accessories",
                              updatedAccessories,
                            );
                          }}
                          className="w-45"
                          placeholder="Кol-во"
                          min="0"
                        />
                      ) : (
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const lockAccessory = door.accessories?.find(
                              (acc: any) => acc.accessory_type === "lock",
                            );
                            return lockAccessory?.quantity > 0 ? (
                              <div className="bg-red-50 p-1 rounded">
                                {getProductName(lockAccessory.model)} (x
                                {lockAccessory.quantity})
                              </div>
                            ) : (
                              <span>0</span>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    {/* Топса */}
                    <TableCell className="align-top">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={
                            editingDoor?.accessories?.find(
                              (acc: any) => acc.accessory_type === "topsa",
                            )?.quantity || ""
                          }
                          onChange={(e) => {
                            const updatedAccessories = updateAccessoryByType(
                              editingDoor.accessories,
                              "topsa",
                              {
                                model: selectedTopsaProduct
                                  ? selectedTopsaProduct.id
                                  : "",
                                price_type: topsaPriceType || "",
                                price:
                                  selectedTopsaProduct && topsaPriceType
                                    ? (selectedTopsaProduct.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.id === topsaPriceType,
                                      )?.value || 0) / 100
                                    : 0,
                                quantity: parseInt(e.target.value) || 0,
                                name: "Топса",
                              },
                            );
                            handleFieldChange(
                              "accessories",
                              updatedAccessories,
                            );
                          }}
                          className="w-45"
                          placeholder="Кol-во"
                          min="0"
                        />
                      ) : (
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const topsaAccessory = door.accessories?.find(
                              (acc: any) => acc.accessory_type === "topsa",
                            );
                            return topsaAccessory?.quantity > 0 ? (
                              <div className="bg-indigo-50 p-1 rounded">
                                {getProductName(topsaAccessory.model)} (x
                                {topsaAccessory.quantity})
                              </div>
                            ) : (
                              <span>0</span>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    {/* Шпингалет */}
                    <TableCell className="align-top">
                      {editingIndex === index ? (
                        <Input
                          type="number"
                          value={
                            editingDoor?.accessories?.find(
                              (acc: any) => acc.accessory_type === "beading",
                            )?.quantity || ""
                          }
                          onChange={(e) => {
                            const updatedAccessories = updateAccessoryByType(
                              editingDoor.accessories,
                              "beading",
                              {
                                model: selectedBeadingProduct
                                  ? selectedBeadingProduct.id
                                  : "",
                                price_type: beadingPriceType || "",
                                price:
                                  selectedBeadingProduct && beadingPriceType
                                    ? (selectedBeadingProduct.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.id === beadingPriceType,
                                      )?.value || 0) / 100
                                    : 0,
                                quantity: parseInt(e.target.value) || 0,
                                name: "Шпингалет",
                              },
                            );
                            handleFieldChange(
                              "accessories",
                              updatedAccessories,
                            );
                          }}
                          className="w-45"
                          placeholder="Кol-во"
                          min="0"
                        />
                      ) : (
                        <div className="text-xs text-gray-600">
                          {(() => {
                            const beadingAccessory = door.accessories?.find(
                              (acc: any) => acc.accessory_type === "beading",
                            );
                            return beadingAccessory?.quantity > 0 ? (
                              <div className="bg-yellow-50 p-1 rounded">
                                {getProductName(beadingAccessory.model)} (x
                                {beadingAccessory.quantity})
                              </div>
                            ) : (
                              <span>0</span>
                            );
                          })()}
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {editingIndex === index ? (
                          <>
                            <Button
                              onClick={handleSaveDoor}
                              size="sm"
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEditDoor(index)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveDoor(index)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {doors.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={18}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <DoorOpen className="h-8 w-8 text-gray-400" />
                        <p>{t("forms.no_doors_added")}</p>
                        <p className="text-sm">
                          {t("forms.click_add_row_to_start")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {doors.length === 0 && (
            <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-amber-700 font-medium">
                {t("forms.add_at_least_one_door")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
// Door Product Select Component for async product search

// Header Search Component for table header search functionality
function HeaderSearch({
  value,
  onChange,
  placeholder,
  onProductSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onProductSelect?: (product: any) => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search for products when user types
  useEffect(() => {
    const searchProducts = async () => {
      if (value.length < 1) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get(
          `products?search=${encodeURIComponent(value)}`,
        );
        const results = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setProducts(results);
      } catch (error) {
        console.error("Error searching products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimeout);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    if (value.length >= 1 && products.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleProductSelect = (product: any) => {
    onChange(product.name);
    setIsOpen(false);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseEnter={() => {
            // Auto-open dropdown on hover if there are results
            if (value.length >= 1 && products.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="h-8 text-xs pr-8"
          autoComplete="off"
        />
        {/* Show loading spinner when searching */}
        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {/* Show indicator when there are filtered results */}
        {!isLoading && value.length >= 1 && products.length > 0 && !isOpen && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2"></div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[99999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-center text-gray-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              Searching...
            </div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onMouseDown={() => handleProductSelect(product)}
              >
                {product.name}
              </div>
            ))
          ) : value.length >= 1 ? (
            <div className="p-2 text-center text-gray-500">
              No products found for "{value}"
            </div>
          ) : (
            <div className="p-2 text-center text-gray-500">
              Type to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function StepThree({
  orderForm,
  doors,
  totals,
  isLoading,
  isCalculating,
  onSubmit,
  onCalculate,
  onBack,
  discountAmount,
  setDiscountAmount,
  discountPercentage,
  setDiscountPercentage,
  advancePayment,
  setAdvancePayment,
  agreementAmountInput,
  setAgreementAmountInput,
  orderData,
}: any) {
  const { t } = useTranslation();

  // Handle discount amount change
  const handleDiscountAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setDiscountAmount(amount);

    // When total discount amount is changed manually, we need to calculate what the base discount percentage should be
    // Total discount = base discount + agreement amount
    // So: base discount = total discount - agreement amount
    const currentAgreementAmount = agreementAmountInput || 0;
    const baseDiscountAmount = Math.max(0, amount - currentAgreementAmount);

    // Calculate percentage based on base discount amount only
    if (totals.total_sum > 0) {
      const percentage = (baseDiscountAmount / totals.total_sum) * 100;
      setDiscountPercentage(percentage);
    } else {
      setDiscountPercentage(0);
    }
  };

  // Handle discount percentage change
  const handleDiscountPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    setDiscountPercentage(percentage);

    // Calculate base discount amount from percentage
    const baseDiscountAmount = (totals.total_sum * percentage) / 100;
    // Add agreement amount to get total discount
    const currentAgreementAmount = agreementAmountInput || 0;
    const totalDiscountAmount = baseDiscountAmount + currentAgreementAmount;
    setDiscountAmount(totalDiscountAmount);
  };

  // Handle advance payment change
  const handleAdvancePaymentChange = (value: string) => {
    const payment = parseFloat(value) || 0;
    setAdvancePayment(payment);
  };

  // Calculate detailed subtotals
  // Now using API response data instead of client-side calculation

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Order Review (50%) */}
        <div className="flex-1 lg:w-1/2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calculator className="h-6 w-6 text-purple-600" />
                </div>
                {t("forms.order_review")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Details Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">
                    {t("forms.doors_count")}
                  </p>
                  <p className="font-semibold">{doors.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {t("forms.total_items")}
                  </p>
                  <p className="font-semibold">
                    {doors.reduce(
                      (total: number, door: any) =>
                        total +
                        1 +
                        (door.extensions?.length || 0) +
                        (door.casings?.length || 0) +
                        (door.crowns?.length || 0) +
                        (door.accessories?.length || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  {t("forms.price_breakdown")}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>{t("forms.doors_subtotal")}</span>
                    <span className="font-semibold">
                      {totals.door_price.toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.extensions_subtotal")}</span>
                    <span>{totals.extension_price.toFixed(0)} сум</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.casings_subtotal")}</span>
                    <span>{totals.casing_price.toFixed(0)} сум</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.crowns_subtotal")}</span>
                    <span>{totals.crown_price.toFixed(0)} сум</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.accessories_subtotal")}</span>
                    <span>{totals.accessory_price.toFixed(0)} сум</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">{t("forms.subtotal")}</span>
                    <span className="font-bold">
                      {totals.total_sum.toFixed(0)} сум
                    </span>
                  </div>
                </div>
              </div>

              {/* Door Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">
                  {t("forms.door_details")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {doors.map((door: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg bg-white shadow-sm"
                    >
                      <h5 className="font-medium mb-2 text-center">
                        {t("forms.door")} {index + 1}
                      </h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          {t("forms.dimensions")}: {parseFloat(door.width || 0)}{" "}
                          x {parseFloat(door.height || 0)}
                        </p>
                        <p>
                          {t("forms.quantity")}: {parseInt(door.quantity || 1)}
                        </p>
                        <p>
                          {t("forms.price")}:{" "}
                          {parseFloat(door.price || 0).toFixed(0)} сум
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Price Summary (50%) */}
        <div className="flex-1 lg:w-1/2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur sticky top-8 h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl">
                <span>{t("forms.pricing_summary")}</span>
                <Button
                  onClick={onCalculate}
                  disabled={doors.length === 0 || isCalculating}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-md"
                  size="sm"
                >
                  {isCalculating ? (
                    <>
                      <Calculator className="h-4 w-4 mr-2 animate-spin" />
                      {t("forms.calculating")}
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      {t("forms.calculate")}
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount and Payment Fields */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800">
                  {t("forms.discount")} & {t("forms.advance_payment")} &
                  {/* Additional Agreement Discount */}
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("forms.discount")}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={discountAmount || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => {
                            let value = e.target.value;
                            // Handle comma as decimal separator
                            if (typeof value === "string") {
                              let cleanedValue = value
                                .replace(/,/g, ".")
                                .replace(/[^\d.]/g, "");
                              const parts = cleanedValue.split(".");
                              if (parts.length > 2) {
                                cleanedValue =
                                  parts[0] + "." + parts.slice(1).join("");
                              }
                              value = cleanedValue;
                            }
                            const amount = parseFloat(value) || 0;
                            handleDiscountAmountChange(amount.toString());
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">
                          {t("forms.discount_amount")}
                        </span>
                      </div>
                      <div className="w-20">
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={discountPercentage || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          onChange={(e) => {
                            let value = e.target.value;
                            // Handle comma as decimal separator
                            if (typeof value === "string") {
                              let cleanedValue = value
                                .replace(/,/g, ".")
                                .replace(/[^\d.]/g, "");
                              const parts = cleanedValue.split(".");
                              if (parts.length > 2) {
                                cleanedValue =
                                  parts[0] + "." + parts.slice(1).join("");
                              }
                              value = cleanedValue;
                            }
                            handleDiscountPercentageChange(value);
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block text-center">
                          %
                        </span>
                      </div>
                    </div>
                    {(discountPercentage > 0 || discountAmount > 0) && (
                      <p className="text-sm text-green-600">
                        {t("forms.discount_amount")}:{" "}
                        {discountAmount > 0
                          ? discountAmount.toFixed(0)
                          : (
                              totals.total_sum *
                              (discountPercentage / 100)
                            ).toFixed(0)}{" "}
                        сум
                        {discountPercentage > 0 && ` (${discountPercentage}%)`}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("forms.advance_payment")}
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={advancePayment || ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        let value = e.target.value;
                        // Handle comma as decimal separator
                        if (typeof value === "string") {
                          let cleanedValue = value
                            .replace(/,/g, ".")
                            .replace(/[^\d.]/g, "");
                          const parts = cleanedValue.split(".");
                          if (parts.length > 2) {
                            cleanedValue =
                              parts[0] + "." + parts.slice(1).join("");
                          }
                          value = cleanedValue;
                        }
                        handleAdvancePaymentChange(value);
                      }}
                    />
                  </div>

                  {/* Agreement Amount Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t("forms.agreement")}
                    </label>
                    <div>
                      <div>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0"
                          value={agreementAmountInput || ""}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => {
                            let value = e.target.value;
                            // Handle comma as decimal separator
                            if (typeof value === "string") {
                              let cleanedValue = value
                                .replace(/,/g, ".")
                                .replace(/[^\d.]/g, "");
                              const parts = cleanedValue.split(".");
                              if (parts.length > 2) {
                                cleanedValue =
                                  parts[0] + "." + parts.slice(1).join("");
                              }
                              value = cleanedValue;
                            }
                            const amount = parseFloat(value) || 0;
                            setAgreementAmountInput(amount);

                            // When agreement amount changes, we need to recalculate the total discount
                            // Get the current discount percentage to calculate base discount amount
                            const baseDiscountAmount =
                              (totals.total_sum * discountPercentage) / 100;

                            // Total discount = base discount + agreement amount
                            const totalDiscountAmount =
                              baseDiscountAmount + amount;

                            // Update only the total discount amount, keep the base percentage unchanged
                            setDiscountAmount(totalDiscountAmount);
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">
                          {t("forms.agreement_amount")}
                        </span>
                      </div>
                    </div>
                    {agreementAmountInput > 0 && (
                      <p className="text-sm text-blue-600">
                        {t("forms.agreement_amount")}:{" "}
                        {agreementAmountInput.toFixed(0)} сум
                        <br />
                        <span className="text-xs text-gray-500">
                          {t("forms.agreement_amount_description")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("forms.subtotal")}</span>
                  <span className="font-semibold">
                    {totals.total_sum.toFixed(0)} сум
                  </span>
                </div>
                {/* Base Discount */}
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      {t("forms.discount")} ({discountPercentage || 0}%)
                    </span>
                    <span>
                      {(
                        (totals.total_sum * (discountPercentage || 0)) /
                        100
                      ).toFixed(0)}{" "}
                      сум
                    </span>
                  </div>
                )}

                {/* Agreement Amount */}
                {agreementAmountInput > 0 && (
                  <div className="flex justify-between text-purple-600">
                    <span>{t("forms.agreement")}</span>
                    <span>{agreementAmountInput.toFixed(0)} сум</span>
                  </div>
                )}

                {/* Total Discount - only show if there's any discount */}
                {(discountPercentage > 0 || agreementAmountInput > 0) && (
                  <div className="flex justify-between text-green-700 font-semibold border-t pt-2">
                    <span>
                      {t("forms.total_discount")} (
                      {totals.total_sum > 0
                        ? (
                            (totals.discountAmount / totals.total_sum) *
                            100
                          ).toFixed(2)
                        : 0}
                      %)
                    </span>
                    <span>{totals.discountAmount.toFixed(0)} сум</span>
                  </div>
                )}

                <div className="flex justify-between text-red-600">
                  <span>{t("forms.advance_payment")}</span>
                  <span>{advancePayment.toFixed(0)} сум</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-blue-600">
                  <span>{t("forms.remaining_balance")}</span>
                  <span>{totals.remainingBalance.toFixed(0)} сум</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={orderForm.handleSubmit(onSubmit)}
                  disabled={
                    isLoading || orderData?.order_status === "moy_sklad"
                  }
                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isLoading
                    ? `${t("common.creating")}...`
                    : t("common.create_order")}
                </Button>
                <Button variant="outline" onClick={onBack} className="w-full">
                  {t("common.back_to_doors")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
