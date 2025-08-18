import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useCreateOrder, useCalculateOrder } from "../api/order";
import SearchableCounterpartySelect from "@/components/ui/searchable-counterparty-select";
import { useAuth } from "../context/AuthContext";
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
import {
  formatReferenceOptions,
  formatZamershikOptions,
} from "../helpers/formatters";
import { Button } from "../../components/ui/button";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
// import { Badge } from "../../components/ui/badge";
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
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Plus, Trash2, DoorOpen, Package, Calculator } from "lucide-react";
import api from "../api/api";
import { useGetMeasure } from "../api/measure";
import React from "react";
import { useGetZamershiks } from "../api/staff";
import { MultiSelect } from "../helpers/MultiSelect";
// import { createProductSelectHandler } from "@/utils/priceUtils";

// Helper function to get the full object for a selected ID
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
  return product || { id: actualId };
};

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { currentUser } = useAuth();
  const { mutate: createOrder, isPending: isLoading } = useCreateOrder();
  const { mutate: calculateOrder, isPending: isCalculating } =
    useCalculateOrder();

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
  // Extract measure ID from URL params or query params
  // Supports both: /orders/create-from-measure/:measureId and /orders/create?measure_id=123
  const searchParams = new URLSearchParams(location.search);
  const measureId = params.measureId || searchParams.get("measure_id");

  // Fetch measure data if measure ID is provided
  const { data: measureData } = useGetMeasure(measureId || "");

  const [doors, setDoors] = useState<any[]>([]);
  const [_currentStep, setCurrentStep] = useState(1);
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
  const [measureProcessed, setMeasureProcessed] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [advancePayment, setAdvancePayment] = useState<string>("");
  const [discountAmountInput, setDiscountAmountInput] = useState<number>(0);
  const [agreementAmountInput, setAgreementAmountInput] = useState<number>(0);
  const orderForm = useForm();

  // const { discount_percentage, advance_payment } = orderForm.watch();

  // Pre-populate from measure data if available
  useEffect(() => {
    if (measureData && !measureProcessed) {
      setMeasureProcessed(true);

      // Pre-fill client information in order form
      orderForm.setValue("address", measureData.address || "");

      // Pre-populate doors from measure data
      if (measureData.doors && measureData.doors.length > 0) {
        const measureDoors = measureData.doors.map((measureDoor: any) => ({
          model: "", // Will be selected by user
          price_type: null,
          price: 0,
          quantity: measureDoor.quantity || 1,
          height: measureDoor.height || 0,
          width: measureDoor.width || 0,
          // Convert IDs to strings to match fieldOptions format
          material: measureDoor.material?.id
            ? String(measureDoor.material.id)
            : "",
          material_type: measureDoor.material_type?.id
            ? String(measureDoor.material_type.id)
            : "",
          massif: measureDoor.massif?.id ? String(measureDoor.massif.id) : "",
          color: measureDoor.color?.id ? String(measureDoor.color.id) : "",
          patina_color: measureDoor.patina_color?.id
            ? String(measureDoor.patina_color.id)
            : "",
          beading_main: measureDoor.beading_main?.id
            ? String(measureDoor.beading_main.id)
            : "",
          beading_additional: measureDoor.beading_additional?.id
            ? String(measureDoor.beading_additional.id)
            : "",
          // Handle glass_type and threshold - they come as direct IDs in measure data
          glass_type: measureDoor.glass_type
            ? String(measureDoor.glass_type)
            : "",
          threshold: measureDoor.threshold ? String(measureDoor.threshold) : "",
          paska_orin: Array.isArray(measureDoor.paska_orin)
            ? measureDoor.paska_orin
            : [],
          // Pre-populate accessories from measure data
          extensions: (() => {
            const measureExtensions =
              measureDoor.extensions?.map((ext: any) => ({
                model: ext.model?.id ? String(ext.model.id) : "",
                price: ext.price || 0,
                quantity: ext.quantity || 1,
                height: ext.height || 0,
                width: ext.width || 0,
                // Keep reference to original measure data
                measureExtension: ext,
              })) || [];

            // Ensure at least 2 extensions
            while (measureExtensions.length < 2) {
              measureExtensions.push({
                model: "",
                price: 0,
                quantity: 1,
                height: 0,
                width: 0,
              });
            }
            return measureExtensions;
          })(),
          casings: (() => {
            const measureCasings =
              measureDoor.casings?.map((casing: any) => ({
                model: casing.model?.id ? String(casing.model.id) : "",
                price: casing.price || 0,
                quantity: casing.quantity || 1,
                height: casing.height || 0,
                width: casing.width || 0,
                casing_type: casing.casing_type || "",
                casing_formula: casing.casing_formula || "",
                casing_range: casing.casing_range?.id
                  ? String(casing.casing_range.id)
                  : "",
                // Keep reference to original measure data
                measureCasing: casing,
              })) || [];

            // Ensure at least 2 casings with proper types
            while (measureCasings.length < 2) {
              const isFirst = measureCasings.length === 0;
              measureCasings.push({
                model: "",
                price: 0,
                quantity: 1,
                height: 0,
                width: 0,
                casing_type: isFirst ? "боковой" : "прямой",
                casing_formula: "formula1",
                casing_range: "",
              });
            }

            // Ensure proper casing types for first two items
            if (measureCasings.length >= 1) {
              measureCasings[0].casing_type =
                measureCasings[0].casing_type || "боковой";
            }
            if (measureCasings.length >= 2) {
              measureCasings[1].casing_type =
                measureCasings[1].casing_type || "прямой";
            }

            return measureCasings;
          })(),
          crowns:
            measureDoor.crowns?.map((crown: any) => ({
              model: crown.model?.id ? String(crown.model.id) : "",
              price: crown.price || 0,
              quantity: crown.quantity || 1,
              width: crown.width || 0,
              // Keep reference to original measure data
              measureCrown: crown,
            })) || [],
          accessories:
            measureDoor.accessories?.map((accessory: any) => ({
              model: accessory.model?.id ? String(accessory.model.id) : "",
              price: accessory.price || 0,
              quantity: accessory.quantity || 1,
              accessory_type: accessory.accessory_type || "",
              // Keep reference to original measure data
              measureAccessory: accessory,
            })) || [],
          // Add reference to measure door for identification
          measureDoor: measureDoor,
          isFromMeasure: true, // Flag to identify doors from measure
        }));
        setDoors(measureDoors);

        // Debug logging to check if glass_type and threshold are being set
        console.log("Measure doors created:", measureDoors);
        measureDoors.forEach((door, index) => {
          console.log(`Door ${index + 1} glass_type:`, door.glass_type);
          console.log(`Door ${index + 1} threshold:`, door.threshold);
        });
      }

      toast.success(
        t("measure.data_loaded", { count: measureData.doors?.length || 0 }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureData, measureProcessed]);

  // const steps = [
  //   { id: 1, title: t("forms.basic_info"), icon: Package },
  //   { id: 2, title: t("forms.doors"), icon: DoorOpen },
  //   { id: 3, title: t("forms.review"), icon: Calculator },
  // ];

  //  Fetching ---
  const { data: currencies } = useGetCurrencies();
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
  const { data: branches } = useGetBranches();
  const { data: thresholds } = useGetThresholds();
  const { data: casingRanges } = useGetCasingRanges();
  const { data: zamershiks } = useGetZamershiks();
  const productsList = useMemo(
    () => (Array.isArray(products) ? products : products?.results || []),
    [products],
  );

  // --- Format Options for Selects ---
  const fieldOptions = {
    rateOptions: formatReferenceOptions(currencies),
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
    branchOptions: formatReferenceOptions(branches),
    zamershikOptions: formatZamershikOptions(zamershiks),
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
    glassTypeOptions: formatReferenceOptions(glassTypes).map((option) => ({
      ...option,
      value: String(option.value), // Ensure values are strings
    })),
    thresholdOptions: formatReferenceOptions(thresholds).map((option) => ({
      ...option,
      value: String(option.value), // Ensure values are strings
    })),
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

  // Debug field options for glass type and threshold
  console.log("Glass Type Options:", fieldOptions.glassTypeOptions);
  console.log("Threshold Options:", fieldOptions.thresholdOptions);
  console.log("Glass Types raw data:", glassTypes);
  console.log("Thresholds raw data:", thresholds);
  console.log(
    "Glass Type Options value types:",
    fieldOptions.glassTypeOptions?.map((opt) => ({
      value: opt.value,
      type: typeof opt.value,
    })),
  );
  console.log(
    "Threshold Options value types:",
    fieldOptions.thresholdOptions?.map((opt) => ({
      value: opt.value,
      type: typeof opt.value,
    })),
  );

  const orderFields = [
    {
      name: "store",
      label: t("forms.store"),
      type: "searchable-resource-select",
      resourceType: "stores",
      placeholder: t("placeholders.select_store"),
      required: true,
    },
    {
      name: "project",
      label: t("forms.project"),
      type: "searchable-resource-select",
      resourceType: "projects",
      placeholder: t("placeholders.select_project"),
      required: true,
    },
    {
      name: "branch",
      label: t("forms.branch"),
      type: "searchable-resource-select",
      resourceType: "branches",
      placeholder: t("placeholders.select_branch"),
      required: true,
    },
    {
      name: "organization",
      label: t("forms.organization"),
      type: "searchable-resource-select",
      resourceType: "organizations",
      placeholder: t("placeholders.select_organization"),
      required: true,
    },
    {
      name: "salesChannel",
      label: t("forms.sales_channel"),
      type: "searchable-resource-select",
      resourceType: "sales-channels",
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
      type: "searchable-resource-select",
      resourceType: "sellers",
      placeholder: t("placeholders.select_seller"),
      required: true,
    },
    {
      name: "zamershik",
      label: t("forms.zamershik"),
      type: "searchable-resource-select",
      resourceType: "zamershiks",
      placeholder: t("placeholders.select_zamershik"),
      required: true,
    },
    {
      name: "operator",
      label: t("forms.operator"),
      type: "searchable-resource-select",
      resourceType: "operators",
      placeholder: t("placeholders.select_operator"),
      required: true,
    },

    {
      name: "description",
      label: t("forms.description"),
      type: "text",
      placeholder: t("placeholders.enter_description"),
    },
  ];

  // Material attributes fields - set once for all doors
  const materialFields = [
    {
      name: "material",
      label: t("forms.material"),
      type: "searchable-resource-select",
      resourceType: "materials",
      placeholder: t("placeholders.select_material"),
      required: true,
    },
    {
      name: "material_type",
      label: t("forms.material_type"),
      type: "searchable-resource-select",
      resourceType: "material-types",
      placeholder: t("placeholders.select_material_type"),
      required: true,
    },
    {
      name: "massif",
      label: t("forms.massif"),
      type: "searchable-resource-select",
      resourceType: "massifs",
      placeholder: t("placeholders.select_massif"),
      required: true,
    },
    {
      name: "color",
      label: t("forms.color"),
      type: "searchable-resource-select",
      resourceType: "colors",
      placeholder: t("placeholders.select_color"),
      required: true,
    },
    {
      name: "patina_color",
      label: t("forms.patina_color"),
      type: "searchable-resource-select",
      resourceType: "patina-colors",
      placeholder: t("placeholders.select_patina_color"),
    },
    {
      name: "beading_main",
      label: t("forms.beading_main"),
      type: "searchable-resource-select",
      resourceType: "beadings",
      placeholder: t("placeholders.select_beading_main"),
    },
    {
      name: "beading_additional",
      label: t("forms.beading_additional"),
      type: "searchable-resource-select",
      resourceType: "beadings",
      placeholder: t("placeholders.select_beading_additional"),
    },
  ];

  // Synchronize form material fields with globalDoorSettings
  const materialFormFields = orderForm.watch([
    "material",
    "material_type",
    "massif",
    "color",
    "patina_color",
    "beading_main",
    "beading_additional",
  ]);

  useEffect(() => {
    if (materialFormFields && materialFormFields.length > 0) {
      const [
        material,
        material_type,
        massif,
        color,
        patina_color,
        beading_main,
        beading_additional,
      ] = materialFormFields;

      setGlobalDoorSettings((prev: any) => ({
        ...prev,
        material: material || "",
        material_type: material_type || "",
        massif: massif || "",
        color: color || "",
        patina_color: patina_color || "",
        beading_main: beading_main || "",
        beading_additional: beading_additional || "",
      }));
    }
  }, materialFormFields);

  // --- API-based Calculation Function ---
  const handleCalculateOrder = () => {
    // First, apply global door settings to all doors
    const updatedDoors = doors.map((door: any) => ({
      ...door,
      material: globalDoorSettings.material,
      material_type: globalDoorSettings.material_type,
      massif: globalDoorSettings.massif,
      color: globalDoorSettings.color,
      patina_color: globalDoorSettings.patina_color,
      beading_main: globalDoorSettings.beading_main,
      beading_additional: globalDoorSettings.beading_additional,
    }));
    setDoors(updatedDoors);

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
      doors: updatedDoors.map((door: any) => ({
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
        // Helper function to convert values with comma to number

        // Calculate total discount amount (base discount + agreement amount)
        const discountPercentageValue = parseFloat(
          discountPercentage.replace(/,/g, ".") || "0",
        );
        const baseDiscountAmount =
          (response.total_sum * discountPercentageValue) / 100;
        const currentAgreementAmount = agreementAmountInput || 0;
        const totalDiscountAmount = baseDiscountAmount + currentAgreementAmount;

        // Always use the calculated total discount amount
        const finalDiscountAmount = totalDiscountAmount;

        const advance = parseFloat(advancePayment.replace(/,/g, ".") || "0");
        const finalAmount = response.total_sum - finalDiscountAmount;
        const remainingBalance = finalAmount - advance;

        setTotals({
          ...response,
          discountAmount: finalDiscountAmount,
          remainingBalance: remainingBalance,
        });

        toast.success(t("messages.calculation_completed"));
      },
      onError: (error: any) => {
        console.error("Error calculating order:", error);
        toast.error(t("messages.calculation_failed"));
      },
    });
  };

  const onSubmit = async (data: any) => {
    const {
      total_sum,
      discountAmount: calculatedDiscountAmount,
      remainingBalance,
    } = totals;

    // Calculate base discount percentage for API (excluding agreement amount)
    const currentDiscountPercentage = parseFloat(discountPercentage || "0");
    const discountPercentageForAPI = currentDiscountPercentage;

    // Remove unwanted fields from form data
    const { order_code, order_date, ...cleanData } = data;

    const orderData = {
      ...cleanData,
      // Map IDs to full meta objects for the API
      created_at: new Date().toISOString(),
      rate: getMetaById(currencies, data.rate),
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
      // Add calculated totals
      discount_percentage: discountPercentageForAPI,
      discount_amount: calculatedDiscountAmount.toFixed(2),
      total_amount: total_sum.toFixed(2),
      advance_payment: parseFloat(
        advancePayment.replace(/,/g, ".") || "0",
      ).toFixed(2),
      remaining_balance: remainingBalance.toFixed(2),
      agreement_amount: agreementAmountInput.toFixed(2),
    };

    // If measureId is available, make a request to the specific endpoint
    if (measureId) {
      try {
        await api.put(`orders/${measureId}/`, orderData);
        toast.success(t("messages.order_from_measure_created"));
        navigate("/orders");
      } catch (error: any) {
        console.error(
          "Error creating order from measure:",
          error.response?.data,
        );
        toast.error(t("messages.error_creating_order"));
      }
    } else {
      // Use the default createOrder mutation for regular order creation
      createOrder(orderData, {
        onSuccess: () => {
          toast.success(t("messages.order_created_successfully"));
          navigate("/orders");
        },
        onError: (e: any) => {
          console.error("Error creating order:", e.response?.data);
          toast.error(t("messages.error_creating_order"));
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div>
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("pages.create_order")}
              </h1>
              {/* <p className="text-gray-600">
                {t("forms.create_order_description")}
              </p> */}
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

        {/* Dynamic Content Based on Step */}

        <div className="space-y-8">
          <StepOne
            orderForm={orderForm}
            orderFields={orderFields}
            materialFields={materialFields}
            isLoading={isLoading}
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

          {currentUser?.role !== "MANUFACTURE" && (
            <StepThree
              orderForm={orderForm}
              doors={doors}
              totals={totals}
              isLoading={isLoading}
              isCalculating={isCalculating}
              onSubmit={onSubmit}
              onCalculate={handleCalculateOrder}
              onBack={() => setCurrentStep(2)}
              discountAmount={discountAmount}
              setDiscountAmount={setDiscountAmount}
              discountPercentage={discountPercentage}
              setDiscountPercentage={setDiscountPercentage}
              advancePayment={advancePayment}
              setAdvancePayment={setAdvancePayment}
              discountAmountInput={discountAmountInput}
              setDiscountAmountInput={setDiscountAmountInput}
              agreementAmountInput={agreementAmountInput}
              setAgreementAmountInput={setAgreementAmountInput}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepOne({ orderForm, orderFields, materialFields, isLoading }: any) {
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
              {/* <p className="text-gray-600 mt-2">
                {t("forms.basic_order_info_description")}
              </p> */}
            </CardHeader>
            <CardContent className="space-y-6">
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
              <ResourceForm
                fields={orderFields}
                onSubmit={() => {}}
                isSubmitting={isLoading}
                hideSubmitButton={true}
                form={orderForm}
                gridClassName="md:grid-cols-3 gap-6"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side - Material Settings (50%) */}
        <div className="flex-1">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                {t("forms.material_attributes")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResourceForm
                fields={materialFields}
                onSubmit={() => {}}
                isSubmitting={isLoading}
                hideSubmitButton={true}
                form={orderForm}
                gridClassName="md:grid-cols-3 gap-6"
              />
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

  // Tables state - each table has its own door model, doors array, and search states
  const [tables, setTables] = useState([
    {
      id: 1,
      doorModel: null as any,
      doorSearch: "",
      doors: doors || [],
      // Search states for each section (table-specific)
      extensionSearch: "",
      casingSearch: "",
      crownSearch: "",
      cubeSearch: "",
      legSearch: "",
      glassSearch: "",
      lockSearch: "",
      topsaSearch: "",
      beadingSearch: "",
      // Selected products for each section (table-specific)
      selectedExtensionProduct: null as any,
      selectedCasingProduct: null as any,
      selectedCrownProduct: null as any,
      selectedCubeProduct: null as any,
      selectedLegProduct: null as any,
      selectedGlassProduct: null as any,
      selectedLockProduct: null as any,
      selectedTopsaProduct: null as any,
      selectedBeadingProduct: null as any,
    },
  ]);

  // Removed price type states as we no longer use individual price selects

  // Remove currentTable and currentDoors as we're displaying all tables

  // Sync doors with parent component
  useEffect(() => {
    // Flatten all doors from all tables
    const allDoors = tables.flatMap((table) => table.doors);
    setDoors(allDoors);
  }, [tables]);

  // Initialize tables with existing doors
  useEffect(() => {
    if (doors && doors.length > 0 && tables[0].doors.length === 0) {
      setTables([
        {
          ...tables[0],
          doors: doors,
        },
      ]);
    }
  }, [doors]);

  // Helper function to auto-apply selected product to specific table
  const autoApplyProductToTable = (
    tableId: number,
    productType: string,
    product: any,
  ) => {
    setTables((prevTables) =>
      prevTables.map((table) => {
        if (table.id !== tableId) return table;

        return {
          ...table,
          doors: table.doors.map((door: any) => {
            const productPrice = product
              ? (product.salePrices?.find(
                  (p: any) => p.priceType.name === "Цена продажи",
                )?.value || 0) / 100
              : 0;

            if (productType === "extension") {
              return {
                ...door,
                extensions:
                  door.extensions?.map((ext: any) => ({
                    ...ext,
                    model: product.id,
                    price: productPrice,
                  })) || [],
              };
            } else if (productType === "casing") {
              return {
                ...door,
                casings:
                  door.casings?.map((casing: any) => ({
                    ...casing,
                    model: product.id,
                    price: productPrice,
                  })) || [],
              };
            } else if (productType === "crown") {
              return {
                ...door,
                crowns:
                  door.crowns?.map((crown: any) => ({
                    ...crown,
                    model: product.id,
                    price: productPrice,
                  })) || [],
              };
            }
            return door;
          }),
        };
      }),
    );
  };

  // Add new table functionality
  const handleAddNewTable = () => {
    const newTableId = Math.max(...tables.map((t) => t.id)) + 1;
    const newTable = {
      id: newTableId,
      doorModel: null as any,
      doorSearch: "",
      doors: [],
      // Initialize search states for new table
      extensionSearch: "",
      casingSearch: "",
      crownSearch: "",
      cubeSearch: "",
      legSearch: "",
      glassSearch: "",
      lockSearch: "",
      topsaSearch: "",
      beadingSearch: "",
      // Initialize selected products for new table
      selectedExtensionProduct: null as any,
      selectedCasingProduct: null as any,
      selectedCrownProduct: null as any,
      selectedCubeProduct: null as any,
      selectedLegProduct: null as any,
      selectedGlassProduct: null as any,
      selectedLockProduct: null as any,
      selectedTopsaProduct: null as any,
      selectedBeadingProduct: null as any,
    };
    setTables([...tables, newTable]);
  };

  // Remove table functionality
  const handleRemoveTable = (tableId: number) => {
    if (tables.length <= 1) return; // Don't allow removing the last table

    const updatedTables = tables.filter((table) => table.id !== tableId);
    setTables(updatedTables);

    // No longer need to track editing state
  };

  const handleAddNewRow = (tableId?: number) => {
    // Get material attributes from the order form to apply to all doors
    const orderData = orderForm.getValues();

    // Use specified table or first table
    const targetTableId = tableId || tables[0]?.id || 1;
    const targetTable =
      tables.find((table) => table.id === targetTableId) || tables[0];

    // Use target table's door model as default for new rows
    const defaultDoorModel = targetTable.doorModel?.id || "";
    const defaultDoorPrice = targetTable.doorModel
      ? (targetTable.doorModel.salePrices?.find(
          (p: any) => p.priceType.name === "Цена продажи",
        )?.value || 0) / 100
      : 0;

    // Get table-specific selected products
    const tableSelectedExtensionProduct = targetTable.selectedExtensionProduct;
    const tableSelectedCasingProduct = targetTable.selectedCasingProduct;
    const tableSelectedCrownProduct = targetTable.selectedCrownProduct;
    const tableSelectedCubeProduct = targetTable.selectedCubeProduct;
    const tableSelectedLegProduct = targetTable.selectedLegProduct;
    const tableSelectedGlassProduct = targetTable.selectedGlassProduct;
    const tableSelectedLockProduct = targetTable.selectedLockProduct;
    const tableSelectedTopsaProduct = targetTable.selectedTopsaProduct;
    const tableSelectedBeadingProduct = targetTable.selectedBeadingProduct;

    // Create 2 default extensions (dobors) - with selected product if available, otherwise empty entries
    const defaultExtensions = [
      {
        model: tableSelectedExtensionProduct
          ? tableSelectedExtensionProduct.id
          : "",
        price_type: "",
        price: tableSelectedExtensionProduct
          ? (tableSelectedExtensionProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 1,
        height: 0,
        width: 0,
      },
      {
        model: tableSelectedExtensionProduct
          ? tableSelectedExtensionProduct.id
          : "",
        price_type: "",
        price: tableSelectedExtensionProduct
          ? (tableSelectedExtensionProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
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
        model: tableSelectedCasingProduct ? tableSelectedCasingProduct.id : "",
        price_type: "",
        price: tableSelectedCasingProduct
          ? (tableSelectedCasingProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
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
        model: tableSelectedCasingProduct ? tableSelectedCasingProduct.id : "",
        price_type: "",
        price: tableSelectedCasingProduct
          ? (tableSelectedCasingProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
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
        model: tableSelectedCrownProduct ? tableSelectedCrownProduct.id : "",
        price_type: "",
        price: tableSelectedCrownProduct
          ? (tableSelectedCrownProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
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
        model: tableSelectedCubeProduct ? tableSelectedCubeProduct.id : "",
        price_type: "",
        price: tableSelectedCubeProduct
          ? (tableSelectedCubeProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "cube",
        name: "Кубик",
      },
      {
        model: tableSelectedLegProduct ? tableSelectedLegProduct.id : "",
        price_type: "",
        price: tableSelectedLegProduct
          ? (tableSelectedLegProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "leg",
        name: "Ножка",
      },
      {
        model: tableSelectedGlassProduct ? tableSelectedGlassProduct.id : "",
        price_type: "",
        price: tableSelectedGlassProduct
          ? (tableSelectedGlassProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "glass",
        name: "Стекло",
      },
      {
        model: tableSelectedLockProduct ? tableSelectedLockProduct.id : "",
        price_type: "",
        price: tableSelectedLockProduct
          ? (tableSelectedLockProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "lock",
        name: "Замок",
      },
      {
        model: tableSelectedTopsaProduct ? tableSelectedTopsaProduct.id : "",
        price_type: "",
        price: tableSelectedTopsaProduct
          ? (tableSelectedTopsaProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "topsa",
        name: "Топса",
      },
      {
        model: tableSelectedBeadingProduct
          ? tableSelectedBeadingProduct.id
          : "",
        price_type: "",
        price: tableSelectedBeadingProduct
          ? (tableSelectedBeadingProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "beading",
        name: "Шпингалет",
      },
    ];

    const newDoor = {
      model: defaultDoorModel,
      price_type: "",
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

    // Add door to target table
    const updatedTables = tables.map((table) => {
      if (table.id === targetTableId) {
        return {
          ...table,
          doors: [...table.doors, newDoor],
        };
      }
      return table;
    });

    setTables(updatedTables);
    // Door is immediately editable - no need to set editing state
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
    if (tables.some((table) => table.doors.length > 0)) {
      const [
        material,
        material_type,
        massif,
        color,
        patina_color,
        beading_main,
        beading_additional,
      ] = materialAttributes;

      const updatedTables = tables.map((table) => ({
        ...table,
        doors: table.doors.map((door: any) => ({
          ...door,
          material: material || "",
          material_type: material_type || "",
          massif: massif || "",
          color: color || "",
          patina_color: patina_color || "",
          beading_main: beading_main || "",
          beading_additional: beading_additional || "2",
        })),
      }));

      setTables(updatedTables);

      // Material attributes are automatically applied to all doors in tables
    }
  }, materialAttributes);

  // Auto-sync tables data to main doors state whenever tables change
  useEffect(() => {
    const allDoors = tables.flatMap((table) =>
      table.doors.map((door: any) => ({
        ...door,
        model: table.doorModel?.id || door.model,
      })),
    );
    setDoors(allDoors);
  }, [tables, setDoors]);

  const handleRemoveDoor = (index: number, tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        return {
          ...table,
          doors: table.doors.filter((_: any, i: number) => i !== index),
        };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Real-time field change handler - updates doors directly in tables
  const handleFieldChange = (
    doorIndex: number,
    tableId: number,
    field: string,
    value: any,
  ) => {
    console.log(
      "handleFieldChange called - doorIndex:",
      doorIndex,
      "tableId:",
      tableId,
      "field:",
      field,
      "value:",
      value,
    );

    // Handle comma-separated decimal numbers
    if (field === "price" || field === "height" || field === "width") {
      if (typeof value === "string") {
        let cleanedValue = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
        const parts = cleanedValue.split(".");
        if (parts.length > 2) {
          cleanedValue = parts[0] + "." + parts.slice(1).join("");
        }
        value = cleanedValue;
      }
    }

    const updatedTables = tables.map((table) => {
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

      if (table.id === tableId) {
        const updatedDoors = [...table.doors];
        const door = updatedDoors[doorIndex];

        if (field === "quantity") {
          let numericValue = value;
          if (typeof value === "string") {
            numericValue = value === "" ? 0 : parseInt(value);
          }
          updatedDoors[doorIndex] = {
            ...door,
            [field]: numericValue,
          };
        } else {
          updatedDoors[doorIndex] = {
            ...door,
            [field]: value,
          };
        }

        // If door width or height changed, update crown widths and recalculate casing dimensions
        if (field === "width" || field === "height") {
          const updatedDoor = updatedDoors[doorIndex];

          // Update crown widths
          if (updatedDoor.crowns && updatedDoor.crowns.length > 0) {
            updatedDoor.crowns = updatedDoor.crowns.map((crown: any) => ({
              ...crown,
              width: convertToNumber(updatedDoor.width, 0) + crownSize,
            }));
          }

          // Recalculate casing dimensions
          if (updatedDoor.casings && updatedDoor.casings.length > 0) {
            updatedDoor.casings = updatedDoor.casings.map((casing: any) =>
              calculateCasingDimensions(
                { ...casing },
                updatedDoor,
                fieldOptions,
                casingSize,
              ),
            );
          }
        }

        return {
          ...table,
          doors: updatedDoors,
        };
      }
      return table;
    });

    setTables(updatedTables);
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
    <div className="space-y-6">
      {/* Add New Table Button */}
      <div className="flex justify-end">
        <Button
          // variant="outline"
          size="sm"
          onClick={handleAddNewTable}
          className="h-8 flex items-center gap-1  bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-3 w-3" />
          Добавить новую модель двери
        </Button>
      </div>

      {/* Render all tables vertically */}
      {tables.map((table, _tableIndex) => {
        const tableCurrentDoors = table.doors || [];
        return (
          <Card
            key={table.id}
            className="shadow-lg border-0 bg-white/90 backdrop-blur mb-6"
          >
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DoorOpen className="h-6 w-6 text-green-600" />
                    </div>
                    {/* {t("forms.doors_configuration")} - Таблица {table.id} */}
                    {/* <Badge variant="secondary" className="ml-3 px-3 py-1">
                      {tableCurrentDoors.length} {t("forms.doors_added")}
                    </Badge>
                    {table.doorModel && (
                      <Badge
                        variant="outline"
                        className="ml-2 px-2 py-1 text-xs"
                      >
                        {table.doorModel.name}
                      </Badge>
                    )} */}
                    <HeaderSearch
                      value={table.doorSearch}
                      onChange={(value) => {
                        const updatedTables = tables.map((t) => {
                          if (t.id === table.id) {
                            return { ...t, doorSearch: value };
                          }
                          return t;
                        });
                        setTables(updatedTables);
                      }}
                      placeholder={t("forms.search_doors")}
                      selectedProduct={table.doorModel}
                      onProductSelect={(product) => {
                        const updatedTables = tables.map((t) => {
                          if (t.id === table.id) {
                            // Calculate the price for the selected product
                            const productPrice = product
                              ? (product.salePrices?.find(
                                  (p: any) =>
                                    p.priceType.name === "Цена продажи",
                                )?.value || 0) / 100
                              : 0;

                            return {
                              ...t,
                              doorModel: product,
                              doorSearch: product?.name || "",
                              // Update all existing doors in this table with the new model
                              doors: t.doors.map((door: any) => ({
                                ...door,
                                model: product?.id || "",
                                price: productPrice,
                              })),
                            };
                          }
                          return t;
                        });
                        setTables(updatedTables);
                      }}
                    />
                  </CardTitle>
                  {/* <p className="text-gray-600 mt-2">
                    {t("forms.add_doors_description")}
                  </p> */}
                </div>
                <div className="flex items-center gap-2">
                  {tables.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTable(table.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
              {/* {!table.doorModel && (
                <p className="text-xs text-red-500 mt-2">
                  Выбирете модель двери
                </p>
              )} */}

              {/* Single Save Button for entire table */}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Door Model Selection */}
              {/* <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{t("forms.door_model")}</span>
                  {table.doorModel && (
                    <Badge variant="outline" className="px-2 py-1 text-xs">
                      {table.doorModel.name}
                    </Badge>
                  )}
                </div>

              </div> */}

              <div className="rounded-lg border overflow-x-auto relative">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-16">
                        {t("forms.quantity")}
                      </TableHead>
                      <TableHead className="w-20">
                        {t("forms.height")}
                      </TableHead>
                      <TableHead className="w-20">{t("forms.width")}</TableHead>
                      <TableHead className="w-28">
                        {t("forms.glass_type")}
                      </TableHead>
                      <TableHead className="w-28">
                        {t("forms.threshold")}
                      </TableHead>
                      <TableHead className="w-28">Паска орыны</TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span>{t("forms.extensions")}</span>
                            {/* <span className="text-xs text-gray-500">(Search & select first)</span> */}
                          </div>
                          <HeaderSearch
                            value={table.extensionSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, extensionSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_extensions")}
                            selectedProduct={table.selectedExtensionProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedExtensionProduct: product,
                                    extensionSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);

                              // Auto-apply to this table only
                              if (product) {
                                autoApplyProductToTable(
                                  table.id,
                                  "extension",
                                  product,
                                );
                              }
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[250px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>{t("forms.casings")}</span>
                            {/* <span className="text-xs text-gray-500">(Search & select first)</span> */}
                          </div>
                          <HeaderSearch
                            value={table.casingSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, casingSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_casings")}
                            selectedProduct={table.selectedCasingProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedCasingProduct: product,
                                    casingSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);

                              // Auto-apply to this table only
                              if (product) {
                                autoApplyProductToTable(
                                  table.id,
                                  "casing",
                                  product,
                                );
                              }
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span>{t("forms.crowns")}</span>
                            {/* <span className="text-xs text-gray-500">(Search & select first)</span> */}
                          </div>
                          <HeaderSearch
                            value={table.crownSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, crownSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_crowns")}
                            selectedProduct={table.selectedCrownProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedCrownProduct: product,
                                    crownSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);

                              // Auto-apply to this table only
                              if (product) {
                                autoApplyProductToTable(
                                  table.id,
                                  "crown",
                                  product,
                                );
                              }
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>Кубик</span>
                          </div>
                          <HeaderSearch
                            value={table.cubeSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, cubeSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_cubes")}
                            selectedProduct={table.selectedCubeProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedCubeProduct: product,
                                    cubeSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>Ножка</span>
                          </div>
                          <HeaderSearch
                            value={table.legSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, legSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_legs")}
                            selectedProduct={table.selectedLegProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedLegProduct: product,
                                    legSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>Стекло</span>
                          </div>
                          <HeaderSearch
                            value={table.glassSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, glassSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_glass")}
                            selectedProduct={table.selectedGlassProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedGlassProduct: product,
                                    glassSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>Замок</span>
                          </div>
                          <HeaderSearch
                            value={table.lockSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, lockSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_locks")}
                            selectedProduct={table.selectedLockProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedLockProduct: product,
                                    lockSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>Топса</span>
                          </div>
                          <HeaderSearch
                            value={table.topsaSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, topsaSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_topsas")}
                            selectedProduct={table.selectedTopsaProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedTopsaProduct: product,
                                    topsaSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <span>Шпингалет</span>
                          </div>
                          <HeaderSearch
                            value={table.beadingSearch}
                            onChange={(value) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return { ...t, beadingSearch: value };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                            placeholder={t("forms.search_beading")}
                            selectedProduct={table.selectedBeadingProduct}
                            onProductSelect={(product) => {
                              const updatedTables = tables.map((t) => {
                                if (t.id === table.id) {
                                  return {
                                    ...t,
                                    selectedBeadingProduct: product,
                                    beadingSearch: product?.name || "",
                                  };
                                }
                                return t;
                              });
                              setTables(updatedTables);
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-32">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableCurrentDoors.map((door: any, index: number) => (
                      <TableRow key={index} className="h-[100px]">
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>

                        {/* Quantity - Always editable */}
                        <TableCell className="align-middle">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={door.quantity?.toString() || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                table.id,
                                "quantity",
                                e.target.value,
                              )
                            }
                            className="w-16"
                          />
                        </TableCell>

                        {/* Height - Always editable */}
                        <TableCell className="align-middle">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={door.height?.toString() || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                table.id,
                                "height",
                                e.target.value,
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>

                        {/* Width - Always editable */}
                        <TableCell className="align-middle">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={door.width?.toString() || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                index,
                                table.id,
                                "width",
                                e.target.value,
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>

                        {/* Glass Type - Always editable */}
                        <TableCell className="align-middle">
                          <Select
                            value={door.glass_type || ""}
                            onValueChange={(value) =>
                              handleFieldChange(
                                index,
                                table.id,
                                "glass_type",
                                value,
                              )
                            }
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue
                                placeholder={t(
                                  "placeholders.select_glass_type",
                                )}
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
                        </TableCell>

                        {/* Threshold - Always editable */}
                        <TableCell className="align-middle">
                          <Select
                            value={door.threshold || ""}
                            onValueChange={(value) =>
                              handleFieldChange(
                                index,
                                table.id,
                                "threshold",
                                value,
                              )
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
                        </TableCell>

                        {/* Paska Orin - Always editable */}
                        <TableCell className="align-middle">
                          <MultiSelect
                            value={
                              Array.isArray(door.paska_orin)
                                ? door.paska_orin
                                : []
                            }
                            onChange={(value) =>
                              handleFieldChange(
                                index,
                                table.id,
                                "paska_orin",
                                value,
                              )
                            }
                            options={[
                              { value: "Сырты", label: "Сырты" },
                              { value: "Иши", label: "Иши" },
                              { value: "Жок", label: "Жок" },
                            ]}
                            placeholder="Paska Orin"
                            className="h-8"
                          />
                        </TableCell>

                        {/* Extensions - Always editable */}
                        <TableCell className="align-top p-2">
                          <div className="space-y-1">
                            {door.extensions?.map(
                              (extension: any, extIndex: number) => (
                                <div
                                  key={extIndex}
                                  className="bg-blue-50 p-2 rounded border space-y-1"
                                >
                                  <div className="grid grid-cols-3 gap-1">
                                    <div>
                                      {extIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Кол-во
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                          extension.quantity?.toString() || ""
                                        }
                                        onChange={(e) => {
                                          const updatedExtensions = [
                                            ...door.extensions,
                                          ];
                                          updatedExtensions[extIndex] = {
                                            ...updatedExtensions[extIndex],
                                            model:
                                              table.selectedExtensionProduct
                                                ? table.selectedExtensionProduct
                                                    .id
                                                : updatedExtensions[extIndex]
                                                    ?.model || "",
                                            quantity: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
                                            "extensions",
                                            updatedExtensions,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Кол-во"
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
                                            ...door.extensions,
                                          ];
                                          updatedExtensions[extIndex] = {
                                            ...updatedExtensions[extIndex],
                                            height: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
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
                                            ...door.extensions,
                                          ];
                                          updatedExtensions[extIndex] = {
                                            ...updatedExtensions[extIndex],
                                            width: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
                                            "extensions",
                                            updatedExtensions,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Ширина"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </TableCell>

                        {/* Casings - Always editable */}
                        <TableCell className="align-top p-2">
                          <div className="space-y-1">
                            {door.casings?.map(
                              (casing: any, casIndex: number) => (
                                <div
                                  key={casIndex}
                                  className="bg-green-50 p-2 rounded border space-y-1"
                                >
                                  <div className="grid grid-cols-4 gap-1">
                                    <div>
                                      {casIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Кол-во
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={
                                          casing.quantity?.toString() || ""
                                        }
                                        onChange={(e) => {
                                          const updatedCasings = [
                                            ...door.casings,
                                          ];
                                          updatedCasings[casIndex] = {
                                            ...updatedCasings[casIndex],
                                            model: table.selectedCasingProduct
                                              ? table.selectedCasingProduct.id
                                              : updatedCasings[casIndex]
                                                  ?.model || "",
                                            quantity: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
                                            "casings",
                                            updatedCasings,
                                          );
                                        }}
                                        className="h-8"
                                        placeholder="Кол-во"
                                      />
                                    </div>
                                    <div>
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
                                            ...door.casings,
                                          ];
                                          updatedCasings[casIndex] = {
                                            ...updatedCasings[casIndex],
                                            height: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
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
                                    {/* <div>
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
                                            ...door.casings,
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
                                              door,
                                              fieldOptions,
                                              casingSize,
                                            );
                                          updatedCasings[casIndex] =
                                            recalculatedCasing;
                                          handleFieldChange(
                                            index,
                                            table.id,
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
                                              ...door.casings,
                                            ];
                                            const updatedCasing = {
                                              ...updatedCasings[casIndex],
                                              casing_range: value,
                                            };
                                            const recalculatedCasing =
                                              calculateCasingDimensions(
                                                updatedCasing,
                                                door,
                                                fieldOptions,
                                                casingSize,
                                              );
                                            updatedCasings[casIndex] =
                                              recalculatedCasing;
                                            handleFieldChange(
                                              index,
                                              table.id,
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
                                    )} */}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </TableCell>

                        {/* Crowns - Always editable */}
                        <TableCell className="align-top p-2">
                          <div className="space-y-1">
                            {door.crowns?.map(
                              (crown: any, crownIndex: number) => (
                                <div
                                  key={crownIndex}
                                  className="bg-purple-50 p-2 rounded border space-y-1"
                                >
                                  <div className="grid grid-cols-2 gap-1">
                                    <div>
                                      {crownIndex === 0 && (
                                        <label className="text-xs text-gray-600">
                                          Кол-во
                                        </label>
                                      )}
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={crown.quantity?.toString() || ""}
                                        onChange={(e) => {
                                          const updatedCrowns = [
                                            ...door.crowns,
                                          ];
                                          updatedCrowns[crownIndex] = {
                                            ...updatedCrowns[crownIndex],
                                            model: table.selectedCrownProduct
                                              ? table.selectedCrownProduct.id
                                              : updatedCrowns[crownIndex]
                                                  ?.model || "",
                                            quantity: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
                                            "crowns",
                                            updatedCrowns,
                                          );
                                        }}
                                        placeholder="Кол-во"
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
                                            ...door.crowns,
                                          ];
                                          updatedCrowns[crownIndex] = {
                                            ...updatedCrowns[crownIndex],
                                            width: e.target.value,
                                          };
                                          handleFieldChange(
                                            index,
                                            table.id,
                                            "crowns",
                                            updatedCrowns,
                                          );
                                        }}
                                        placeholder="Ширина"
                                        className="h-8"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </TableCell>

                        {/* Кубик - Always editable */}
                        <TableCell className="align-top">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={
                              door.accessories?.[0]?.quantity?.toString() || ""
                            }
                            onChange={(e) => {
                              const updatedAccessories = [
                                ...(door.accessories || []),
                              ];
                              // Ensure array has enough elements
                              while (updatedAccessories.length < 6) {
                                updatedAccessories.push({
                                  model: "",
                                  price_type: "",
                                  price: 0,
                                  quantity: 0,
                                  accessory_type: "",
                                  name: "",
                                });
                              }
                              updatedAccessories[0] = {
                                model: table.selectedCubeProduct
                                  ? table.selectedCubeProduct.id
                                  : updatedAccessories[0]?.model || "",
                                price_type:
                                  updatedAccessories[0]?.price_type || "",
                                price: table.selectedCubeProduct
                                  ? (table.selectedCubeProduct.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : updatedAccessories[0]?.price || 0,
                                quantity: parseInt(e.target.value) || 0,
                                accessory_type: "cube",
                                name: "Кубик",
                              };
                              handleFieldChange(
                                index,
                                table.id,
                                "accessories",
                                updatedAccessories,
                              );
                            }}
                            className="w-16"
                            placeholder="Кол-во"
                            min="0"
                          />
                        </TableCell>

                        {/* Ножка - Always editable */}
                        <TableCell className="align-top">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={
                              door.accessories?.[1]?.quantity?.toString() || ""
                            }
                            onChange={(e) => {
                              const updatedAccessories = [
                                ...(door.accessories || []),
                              ];
                              // Ensure array has enough elements
                              while (updatedAccessories.length < 6) {
                                updatedAccessories.push({
                                  model: "",
                                  price_type: "",
                                  price: 0,
                                  quantity: 0,
                                  accessory_type: "",
                                  name: "",
                                });
                              }
                              updatedAccessories[1] = {
                                model: table.selectedLegProduct
                                  ? table.selectedLegProduct.id
                                  : updatedAccessories[1]?.model || "",
                                price_type:
                                  updatedAccessories[1]?.price_type || "",
                                price: table.selectedLegProduct
                                  ? (table.selectedLegProduct.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : updatedAccessories[1]?.price || 0,
                                quantity: parseInt(e.target.value) || 0,
                                accessory_type: "leg",
                                name: "Ножка",
                              };
                              handleFieldChange(
                                index,
                                table.id,
                                "accessories",
                                updatedAccessories,
                              );
                            }}
                            className="w-16"
                            placeholder="Кол-во"
                            min="0"
                          />
                        </TableCell>

                        {/* Стекло - Always editable */}
                        <TableCell className="align-top">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={
                              door.accessories?.[2]?.quantity?.toString() || ""
                            }
                            onChange={(e) => {
                              const updatedAccessories = [
                                ...(door.accessories || []),
                              ];
                              // Ensure array has enough elements
                              while (updatedAccessories.length < 6) {
                                updatedAccessories.push({
                                  model: "",
                                  price_type: "",
                                  price: 0,
                                  quantity: 0,
                                  accessory_type: "",
                                  name: "",
                                });
                              }
                              updatedAccessories[2] = {
                                model: table.selectedGlassProduct
                                  ? table.selectedGlassProduct.id
                                  : updatedAccessories[2]?.model || "",
                                price_type:
                                  updatedAccessories[2]?.price_type || "",
                                price: table.selectedGlassProduct
                                  ? (table.selectedGlassProduct.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : updatedAccessories[2]?.price || 0,
                                quantity: parseInt(e.target.value) || 0,
                                accessory_type: "glass",
                                name: "Стекло",
                              };
                              handleFieldChange(
                                index,
                                table.id,
                                "accessories",
                                updatedAccessories,
                              );
                            }}
                            className="w-16"
                            placeholder="Кол-во"
                            min="0"
                          />
                        </TableCell>

                        {/* Замок - Always editable */}
                        <TableCell className="align-top">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={
                              door.accessories?.[3]?.quantity?.toString() || ""
                            }
                            onChange={(e) => {
                              const updatedAccessories = [
                                ...(door.accessories || []),
                              ];
                              // Ensure array has enough elements
                              while (updatedAccessories.length < 6) {
                                updatedAccessories.push({
                                  model: "",
                                  price_type: "",
                                  price: 0,
                                  quantity: 0,
                                  accessory_type: "",
                                  name: "",
                                });
                              }
                              updatedAccessories[3] = {
                                model: table.selectedLockProduct
                                  ? table.selectedLockProduct.id
                                  : updatedAccessories[3]?.model || "",
                                price_type:
                                  updatedAccessories[3]?.price_type || "",
                                price: table.selectedLockProduct
                                  ? (table.selectedLockProduct.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : updatedAccessories[3]?.price || 0,
                                quantity: parseInt(e.target.value) || 0,
                                accessory_type: "lock",
                                name: "Замок",
                              };
                              handleFieldChange(
                                index,
                                table.id,
                                "accessories",
                                updatedAccessories,
                              );
                            }}
                            className="w-16"
                            placeholder="Кол-во"
                            min="0"
                          />
                        </TableCell>

                        {/* Топса - Always editable */}
                        <TableCell className="align-top">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={
                              door.accessories?.[4]?.quantity?.toString() || ""
                            }
                            onChange={(e) => {
                              const updatedAccessories = [
                                ...(door.accessories || []),
                              ];
                              // Ensure array has enough elements
                              while (updatedAccessories.length < 6) {
                                updatedAccessories.push({
                                  model: "",
                                  price_type: "",
                                  price: 0,
                                  quantity: 0,
                                  accessory_type: "",
                                  name: "",
                                });
                              }
                              updatedAccessories[4] = {
                                model: table.selectedTopsaProduct
                                  ? table.selectedTopsaProduct.id
                                  : updatedAccessories[4]?.model || "",
                                price_type:
                                  updatedAccessories[4]?.price_type || "",
                                price: table.selectedTopsaProduct
                                  ? (table.selectedTopsaProduct.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : updatedAccessories[4]?.price || 0,
                                quantity: parseInt(e.target.value) || 0,
                                accessory_type: "topsa",
                                name: "Топса",
                              };
                              handleFieldChange(
                                index,
                                table.id,
                                "accessories",
                                updatedAccessories,
                              );
                            }}
                            className="w-16"
                            placeholder="Кол-во"
                            min="0"
                          />
                        </TableCell>

                        {/* Шпингалет - Always editable */}
                        <TableCell className="align-top">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={
                              door.accessories?.[5]?.quantity?.toString() || ""
                            }
                            onChange={(e) => {
                              const updatedAccessories = [
                                ...(door.accessories || []),
                              ];
                              // Ensure array has enough elements
                              while (updatedAccessories.length < 6) {
                                updatedAccessories.push({
                                  model: "",
                                  price_type: "",
                                  price: 0,
                                  quantity: 0,
                                  accessory_type: "",
                                  name: "",
                                });
                              }
                              updatedAccessories[5] = {
                                model: table.selectedBeadingProduct
                                  ? table.selectedBeadingProduct.id
                                  : updatedAccessories[5]?.model || "",
                                price_type:
                                  updatedAccessories[5]?.price_type || "",
                                price: table.selectedBeadingProduct
                                  ? (table.selectedBeadingProduct.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : updatedAccessories[5]?.price || 0,
                                quantity: parseInt(e.target.value) || 0,
                                accessory_type: "beading",
                                name: "Шпингалет",
                              };
                              handleFieldChange(
                                index,
                                table.id,
                                "accessories",
                                updatedAccessories,
                              );
                            }}
                            className="w-16"
                            placeholder="Кол-во"
                            min="0"
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleRemoveDoor(index, table.id)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {tableCurrentDoors.length === 0 && (
                      <TableRow className="h-24">
                        <TableCell
                          colSpan={11}
                          className="text-center py-8 text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <DoorOpen className="h-8 w-8 text-gray-400" />
                            <p>Двери не добавлены</p>
                            <p className="text-sm">
                              Нажмите 'Добавить строку' чтобы начать
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    handleAddNewRow(table.id);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                  disabled={!table.doorModel}
                >
                  <Plus className="h-5 w-5" />
                  {t("forms.add_row")}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
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
  selectedProduct,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onProductSelect?: (product: any) => void;
  selectedProduct?: any;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search for products when user types
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const searchProducts = async () => {
      if (value.length < 2) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // Don't search if the current value exactly matches the selected product name
      if (selectedProduct && value === selectedProduct.name) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      try {
        const res = await api.get(
          `products?search=${encodeURIComponent(value)}`,
          { signal: abortController.signal },
        );

        // Check if request was aborted
        if (abortController.signal.aborted) {
          return;
        }

        const results = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setProducts(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        // Don't log errors for aborted requests
        if (!abortController.signal.aborted) {
          console.error("Error searching products:", error);
          setProducts([]);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    // Set loading immediately for better UX
    if (value.length >= 2) {
      setIsLoading(true);
    }

    searchTimeoutRef.current = setTimeout(searchProducts, 600);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, selectedProduct]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Reset dropdown state immediately on input change
    if (newValue.length < 2) {
      setIsOpen(false);
      setProducts([]);
    }
  };

  const handleFocus = () => {
    if (value.length >= 2 && products.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleProductSelect = (product: any) => {
    onChange(product.name);
    setIsOpen(false);
    setProducts([]);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
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
          onKeyDown={handleKeyDown}
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
        {/* Show dropdown arrow when there are results */}
        {!isLoading && value.length >= 2 && products.length > 0 && (
          <div
            className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {isOpen && value.length >= 2 && (
        <div className="absolute z-[99999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              Searching...
            </div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
                onMouseDown={() => handleProductSelect(product)}
              >
                {product.name}
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-gray-500 text-sm">
              No products found for "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// Accessory Manager Component for managing extensions, casings, crowns, and accessories

function StepThree({
  orderForm,
  doors,
  totals,
  isLoading,
  isCalculating,
  onSubmit,
  onCalculate,
  // onBack,
  discountAmount,
  setDiscountAmount,
  discountPercentage,
  setDiscountPercentage,
  advancePayment,
  setAdvancePayment,
  // discountAmountInput,
  setDiscountAmountInput,
  agreementAmountInput,
  setAgreementAmountInput,
}: any) {
  const { t } = useTranslation();

  // Helper function to convert values with comma to number
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

  // Calculate discount percentage for display

  // Handle discount amount input change
  const handleDiscountAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setDiscountAmount(value);
    setDiscountAmountInput(amount);

    // When total discount amount is changed manually, we need to calculate what the base discount percentage should be
    // Total discount = base discount + agreement amount
    // So: base discount = total discount - agreement amount
    const currentAgreementAmount = agreementAmountInput || 0;
    const baseDiscountAmount = Math.max(0, amount - currentAgreementAmount);

    // Calculate percentage based on base discount amount only
    if (totals.total_sum > 0) {
      const percentage = (baseDiscountAmount / totals.total_sum) * 100;
      setDiscountPercentage(percentage.toFixed(2));
    } else {
      setDiscountPercentage("0");
    }
  };

  // Handle discount percentage input change
  const handleDiscountPercentageChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    setDiscountPercentage(value);

    // Calculate base discount amount from percentage
    const baseDiscountAmount = (totals.total_sum * percentage) / 100;
    // Add agreement amount to get total discount
    const currentAgreementAmount = agreementAmountInput || 0;
    const totalDiscountAmount = baseDiscountAmount + currentAgreementAmount;

    setDiscountAmount(totalDiscountAmount.toFixed(0));
    setDiscountAmountInput(totalDiscountAmount);
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
                    <span className="font-semibold text-black">
                      {(totals.door_price || 0).toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.extensions_subtotal")}</span>
                    <span className="text-black">
                      {(totals.extension_price || 0).toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.casings_subtotal")}</span>
                    <span className="text-black">
                      {(totals.casing_price || 0).toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.crowns_subtotal")}</span>
                    <span className="text-black">
                      {(totals.crown_price || 0).toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.accessories_subtotal")}</span>
                    <span className="text-black">
                      {(totals.accessory_price || 0).toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">{t("forms.subtotal")}</span>
                    <span className="font-bold text-black">
                      {totals.total_sum.toFixed(0)} сум
                    </span>
                  </div>
                </div>
              </div>

              {/* Door Details */}
              {/* <div className="space-y-4">
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
              </div> */}
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
                  className=" bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
            <CardContent className="grid grid-colums-2">
              <div className="grid grid-colums-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("forms.subtotal")}</span>
                  <span className="font-semibold text-black">
                    {totals.total_sum.toFixed(0)} сум
                  </span>
                </div>

                {/* Discount Section */}
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-green-700">
                    {t("forms.discount")}
                  </h4>

                  {/* Discount Amount Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("forms.discount_amount")} (сум)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={discountAmount?.toString() || ""}
                      onChange={(e) =>
                        handleDiscountAmountChange(e.target.value)
                      }
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  {/* Discount Percentage Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("forms.discount_percentage")} (%)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={discountPercentage?.toString() || ""}
                      onChange={(e) =>
                        handleDiscountPercentageChange(e.target.value)
                      }
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  {/* Discount Summary */}
                  {(parseFloat(discountAmount) > 0 ||
                    parseFloat(discountPercentage) > 0) && (
                    <div className="space-y-2 pt-2 border-t border-green-200">
                      {/* Base Discount */}
                      {parseFloat(discountPercentage) > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>
                            {t("forms.discount")} ({discountPercentage}%)
                          </span>
                          <span className="text-black">
                            {(
                              (totals.total_sum *
                                (parseFloat(discountPercentage) || 0)) /
                              100
                            ).toFixed(0)}{" "}
                            сум
                          </span>
                        </div>
                      )}

                      {/* Agreement Amount */}
                      {agreementAmountInput > 0 && (
                        <div className="flex justify-between text-purple-600 font-medium">
                          <span>{t("forms.agreement")}</span>
                          <span className="text-black">
                            {agreementAmountInput.toFixed(0)} сум
                          </span>
                        </div>
                      )}

                      {/* Total Discount */}
                      {(parseFloat(discountPercentage) > 0 ||
                        agreementAmountInput > 0) && (
                        <div className="flex justify-between text-green-700 font-semibold border-t border-green-300 pt-2">
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
                          <span className="text-black">
                            {totals.discountAmount.toFixed(0)} сум
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Advance Payment Section */}
                <div className="bg-orange-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-orange-700">
                    {t("forms.advance_payment")}
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("forms.advance_payment")} (сум)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={advancePayment?.toString() || ""}
                      onChange={(e) =>
                        handleAdvancePaymentChange(e.target.value)
                      }
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  {advancePayment > 0 && (
                    <div className="flex justify-between text-orange-600 font-medium pt-2 border-t border-orange-200">
                      <span>{t("forms.advance_payment")}</span>
                      <span className="text-black">
                        {advancePayment.toFixed(0)} сум
                      </span>
                    </div>
                  )}
                </div>

                {/* Agreement Amount Section */}
                <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-purple-700">
                    {t("forms.agreement")}
                  </h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("forms.agreement_amount")} (сум)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={agreementAmountInput?.toString() || ""}
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
                        const currentDiscountPercentage = convertToNumber(
                          discountPercentage,
                          0,
                        );
                        const baseDiscountAmount =
                          (totals.total_sum * currentDiscountPercentage) / 100;

                        // Total discount = base discount + agreement amount
                        const totalDiscountAmount = baseDiscountAmount + amount;

                        // Update only the total discount amount, keep the base percentage unchanged
                        setDiscountAmountInput(totalDiscountAmount);
                        setDiscountAmount(totalDiscountAmount.toFixed(0));
                      }}
                      placeholder="0"
                      className="w-full"
                    />
                  </div>

                  {agreementAmountInput > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-purple-600 font-medium pt-2 border-t border-purple-200">
                        <span>{t("forms.agreement_amount")}</span>
                        <span className="text-black">
                          {agreementAmountInput.toFixed(0)} сум
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t("forms.agreement_amount_description")}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Summary breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("forms.subtotal")}</span>
                    <span className="font-semibold text-black">
                      {totals.total_sum.toFixed(0)} сум
                    </span>
                  </div>
                  {/* Base Discount */}
                  {discountPercentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>
                        {t("forms.discount")} ({discountPercentage || 0}%)
                      </span>
                      <span className="text-black">
                        {(
                          (totals.total_sum *
                            (parseFloat(discountPercentage) || 0)) /
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
                      <span className="text-black">
                        {agreementAmountInput.toFixed(0)} сум
                      </span>
                    </div>
                  )}

                  {/* Total Discount */}
                  {(parseFloat(discountPercentage) > 0 ||
                    agreementAmountInput > 0) && (
                    <div className="flex justify-between text-green-700 font-semibold border-t pt-2">
                      <span>
                        {t("forms.total_discount")} (
                        {totals.total_sum > 0
                          ? (
                              (totals.discountAmount / totals.total_sum) *
                              100
                            ).toFixed(0)
                          : 0}
                        %)
                      </span>
                      <span className="text-black">
                        {totals.discountAmount.toFixed(0)} сум
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-red-600">
                    <span>{t("forms.advance_payment")}</span>
                    <span className="text-black">
                      {parseFloat(advancePayment || "0").toFixed(0)} сум
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Final Remaining Balance */}
                <div className="flex justify-between text-xl font-bold text-purple-600 bg-purple-50 p-4 rounded-lg">
                  <span>{t("forms.remaining_balance")}</span>
                  <span className="text-black">
                    {totals.remainingBalance.toFixed(0)} сум
                  </span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={orderForm.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isLoading
                    ? `${t("common.creating")}...`
                    : t("common.create_order")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
