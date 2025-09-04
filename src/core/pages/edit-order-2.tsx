// Edit-order page with create-order pattern
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "../../utils/numberFormat";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import {
  useGetOrder,
  useUpdateOrder,
  useCalculateOrder,
  useSendToMoySklad,
} from "../api/order";
import SearchableCounterpartySelect from "@/components/ui/searchable-counterparty-select";
import { useAuth } from "../context/AuthContext";
import {
  // useGetCurrencies,
  useGetStores,
  useGetProjects,
  useGetCounterparties,
  useGetOrganizations,
  useGetSalesChannels,
  useGetBranches,
} from "../api/references";
import { useGetSellers, useGetOperators } from "../api/user";
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
import { useGetSteelColors } from "../api/steelColor";
import { useGetFrames } from "../api/frame";
import { useGetCladdings } from "../api/cladding";
import { useGetLocks } from "../api/lock";
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
  Minus,
  Trash2,
  DoorOpen,
  Package,
  Calculator,
  Send,
  ExternalLink,
  Download,
} from "lucide-react";
import api from "../api/api";
import { useAutoSave } from "../hooks/useAutoSave";
import React from "react";
import { useGetZamershiks } from "../api/staff";
import { MultiSelect } from "../helpers/MultiSelect";

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

// Function to calculate casing dimensions based on formula and type
const calculateCasingDimensions = (
  casing: any,
  doorData: any,
  fieldOptions: any,
  casingSize: number,
  useApiFormula: boolean,
) => {
  if (!doorData) return { ...casing };

  const doorWidth = convertToNumber(doorData.width, 0);
  const doorHeight = convertToNumber(doorData.height, 0);

  // Create a new casing object to avoid mutating the original
  const newCasing = { ...casing };

  // Auto-calculate height based on API casing_formula setting
  if (!useApiFormula && casing.casing_range) {
    // Formula 2: Use casing ranges when casing_formula is false
    const selectedRange = fieldOptions.casingRangeOptions?.find(
      (range: any) => range.value === String(casing.casing_range),
    );
    if (selectedRange && selectedRange.casing_size !== undefined) {
      newCasing.height = selectedRange.casing_size;
    }
  } else {
    // Formula 1: Use door dimensions when casing_formula is true
    if (casing.casing_type === "боковой") {
      newCasing.height = doorHeight + casingSize;
    } else if (casing.casing_type === "прямой") {
      newCasing.height = doorWidth + 2 * casingSize;
    }
  }

  // Always set width to casingSize for casings
  newCasing.width = casingSize;

  return newCasing;
};

export default function EditOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const { data: orderData, isLoading: isLoadingOrder } = useGetOrder(id!);
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();
  const { mutate: calculateOrder, isPending: isCalculating } =
    useCalculateOrder();
  const { mutate: sendToMoySklad, isPending: isSendingToMoySklad } =
    useSendToMoySklad();

  const [doors, setDoors] = useState<any[]>([]);
  const [doorType, setDoorType] = useState<"WOOD" | "STEEL">("WOOD");
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
  const [isLoadingPDF, setIsLoadingPDF] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: boolean;
  }>({});

  // Global door attributes state
  const [globalDoorSettings, setGlobalDoorSettings] = useState({
    material: "",
    material_type: "",
    massif: "",
    color: "",
    patina_color: "",
    beading_main: "",
    beading_additional: null,
    beading_additional2: null,
    glass_type: "",
    threshold: "",
    paska_orin: [],
  });

  // Fetch attribute settings for casing and crown sizes
  const { data: attributeSettings } = useGetAttributeSettings();
  const attributeSettingsArray = Array.isArray(attributeSettings)
    ? attributeSettings
    : attributeSettings?.results || [];
  const casingSize = attributeSettingsArray[0]?.casing_size; // Default fallback
  const crownSize = attributeSettingsArray[0]?.crown_size; // Default fallback
  const casingFormula = attributeSettingsArray[0]?.casing_formula ?? true; // Default to true (formula 1)

  const validateRequiredFields = (
    formData: any,
    doors: any[],
    doorType: "WOOD" | "STEEL",
  ): boolean => {
    const errors: { [key: string]: boolean } = {};
    let isValid = true;

    // Required fields for all orders
    const requiredFields = [
      { field: "agent", name: "Контрагент" },
      { field: "organization", name: "Организация" },
      { field: "seller", name: "Продавец" },
      { field: "operator", name: "Оператор" },
      { field: "deadline_date", name: "Срок исполнения" },
    ];

    // Check required form fields
    requiredFields.forEach(({ field }) => {
      const value = formData[field];
      if (
        !value ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && value === 0) ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors[field] = true;
        isValid = false;
      }
    });

    // For steel doors, validate door_name is required
    if (doorType === "STEEL" && doors && doors.length > 0) {
      doors.forEach((door, index) => {
        if (
          !door.door_name ||
          (typeof door.door_name === "string" && door.door_name.trim() === "")
        ) {
          errors[`door_name_${index}`] = true;
          isValid = false;
        }
      });
    }

    setValidationErrors(errors);
    return isValid;
  };

  const clearFieldError = (fieldName: string) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const scrollToFirstError = () => {
    // Find the first field with validation error
    const errorFields = Object.keys(validationErrors);
    if (errorFields.length === 0) return;

    const firstErrorField = errorFields[0];

    // Try to find and scroll to the element
    const element =
      document.querySelector(`[name="${firstErrorField}"]`) ||
      document.querySelector(`.border-red-500`) ||
      document.querySelector('[data-error="true"]');

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Focus the element if it's focusable
      if (
        element instanceof HTMLElement &&
        typeof element.focus === "function"
      ) {
        setTimeout(() => element.focus(), 100);
      }
    }
  };

  const orderForm = useForm({
    defaultValues: {
      rate: "",
      store: "",
      project: "",
      agent: null,
      organization: "",
      salesChannel: "",
      seller: "",
      operator: "",
      address: "",
      extra_comment: "",
      deadline_date: "",
      description: "",
      branch: "",
      zamershik: "",
      material: "",
      material_type: "",
      massif: "",
      color: "",
      patina_color: "",
      beading_main: "",
      beading_additional: null,
      beading_additional2: null,
    },
  });

  // Auto-save functionality
  const orderFormData = orderForm.watch();
  useAutoSave(orderFormData, `edit-order-${id}-draft`);
  useAutoSave(doors, `edit-order-${id}-doors-draft`);

  // Initialize steps data

  //  Fetching ---
  // const { data: currencies } = useGetCurrencies();
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
  const { data: steelColors } = useGetSteelColors();
  const { data: frames } = useGetFrames();
  const { data: claddings } = useGetCladdings();
  const { data: locks } = useGetLocks();
  const productsList = useMemo(
    () => (Array.isArray(products) ? products : products?.results || []),
    [products],
  );

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

  // Memoize reference data loaded state to prevent unnecessary re-renders
  const isReferenceDataLoaded = useMemo(() => {
    return !!(
      stores &&
      projects &&
      counterparties &&
      organizations &&
      salesChannels &&
      sellers &&
      operators &&
      zamershiks
    );
  }, [
    stores,
    projects,
    counterparties,
    organizations,
    salesChannels,
    sellers,
    operators,
    zamershiks,
  ]);

  // Initialize form with order data - wait for reference data to load
  useEffect(() => {
    if (orderData && isReferenceDataLoaded) {
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
        rate: orderData.rate?.id || orderData.rate || "",
        store: orderData.store?.id || orderData.store || "",
        project: orderData.project?.id || orderData.project || "",
        agent: orderData.agent
          ? {
              value: orderData.agent.id,
              label: orderData.agent.name,
              ...orderData.agent,
            }
          : null,
        organization:
          orderData.organization?.id || orderData.organization || "",
        salesChannel:
          orderData.salesChannel?.id || orderData.salesChannel || "",
        seller: orderData.seller?.id || orderData.seller || "",
        operator: orderData.operator?.id || orderData.operator || "",
        address: orderData.address || "",
        // order_code: orderData.order_code || "",
        extra_comment: orderData.extra_comment || "",
        // order_date: formatDateForInput(orderData.created_at),
        deadline_date: formatDateForInput(orderData.deadline_date),
        description: orderData.description || "",
        branch: orderData?.branch?.id || orderData.branch || "",
        zamershik: orderData?.zamershik?.id || orderData.zamershik || "",
        // Material fields - initialized from first door if available
        material: orderData.doors?.[0]?.material || "",
        material_type: orderData.doors?.[0]?.material_type || "",
        massif: orderData.doors?.[0]?.massif || "",
        color: orderData.doors?.[0]?.color || "",
        patina_color: orderData.doors?.[0]?.patina_color || "",
        beading_main: orderData.doors?.[0]?.beading_main || "",
        beading_additional: orderData.doors?.[0]?.beading_additional ?? null,
        beading_additional2: orderData.doors?.[0]?.beading_additional2 ?? null,
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

      // Debug seller, operator, and zamershik field initialization
      console.log("User fields initialization debug:", {
        originalSeller: orderData?.seller,
        sellerId: orderData?.seller?.id,
        formDataSeller: formData.seller,
        sellersList: sellers,
        originalOperator: orderData?.operator,
        operatorId: orderData?.operator?.id,
        formDataOperator: formData.operator,
        operatorsList: operators,
        originalZamershik: orderData?.zamershik,
        zamershikId: orderData?.zamershik?.id,
        formDataZamershik: formData.zamershik,
        zamershiksList: zamershiks,
      });

      // Set form values individually to ensure proper controlled component behavior
      Object.entries(formData).forEach(([key, value]) => {
        orderForm.setValue(key as any, value);
      });

      console.log("Form values set with formData:", formData);
      // Trigger validation to ensure all fields are properly updated
      orderForm.trigger();

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
              model: item.model?.id || (item.model === "" ? null : item.model),
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

        // Calculate casing dimensions for existing doors to ensure proper height values
        const doorsWithCalculatedCasings = normalizedDoors.map((door: any) => {
          if (door.casings && door.casings.length > 0) {
            return {
              ...door,
              casings: door.casings.map((casing: any) =>
                calculateCasingDimensions(
                  { ...casing },
                  door,
                  fieldOptions,
                  casingSize,
                  casingFormula,
                ),
              ),
            };
          }
          return door;
        });

        console.log(
          "Normalized doors for editing:",
          doorsWithCalculatedCasings,
        ); // Debug log
        console.log("Setting doors state with:", doorsWithCalculatedCasings);
        setDoors(doorsWithCalculatedCasings);

        // Initialize door type from order data
        if ((orderData as any).door_type) {
          setDoorType((orderData as any).door_type);
        }

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
            beading_additional: firstDoor.beading_additional ?? null,
            beading_additional2: firstDoor.beading_additional2 ?? null,
            glass_type: firstDoor.glass_type || "",
            threshold: firstDoor.threshold || "",
            paska_orin: Array.isArray(firstDoor.paska_orin)
              ? firstDoor.paska_orin
              : [],
          });
        }
      } else {
        console.log(
          "Doors not initialized - orderData:",
          orderData,
          "doors array:",
          orderData?.doors,
        );
      }
    } else {
      console.log("Required data not loaded yet:", {
        orderData: !!orderData,
        // currencies: !!currencies,
        stores: !!stores,
        projects: !!projects,
        counterparties: !!counterparties,
        organizations: !!organizations,
        salesChannels: !!salesChannels,
        sellers: !!sellers,
        operators: !!operators,
        zamershiks: !!zamershiks,
      });
    }
  }, [orderData, isReferenceDataLoaded, orderForm]);

  // Auto-calculate order when data is loaded (debounced)
  const shouldCalculateOrder = useMemo(() => {
    return !!(
      orderData &&
      doors.length > 0 &&
      isReferenceDataLoaded &&
      branches &&
      productsList.length > 0 &&
      totals.total_sum === 0
    );
  }, [
    orderData,
    doors.length,
    isReferenceDataLoaded,
    branches,
    productsList.length,
    totals.total_sum,
  ]);

  useEffect(() => {
    if (shouldCalculateOrder) {
      const timeoutId = setTimeout(() => {
        handleCalculateOrder();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [shouldCalculateOrder]);

  // Synchronize form material fields with globalDoorSettings
  const materialFormFields = orderForm.watch([
    "material",
    "material_type",
    "massif",
    "color",
    "patina_color",
    "beading_main",
    "beading_additional",
    "beading_additional2",
  ]);

  // Memoize material form fields to prevent unnecessary updates
  const materialFieldsHash = useMemo(() => {
    if (!materialFormFields || materialFormFields.every((field) => !field))
      return "";
    return JSON.stringify(materialFormFields);
  }, [materialFormFields]);

  const prevMaterialFieldsHashRef = useRef<string>("");

  useEffect(() => {
    if (
      prevMaterialFieldsHashRef.current === materialFieldsHash ||
      !materialFieldsHash
    ) {
      return;
    }
    prevMaterialFieldsHashRef.current = materialFieldsHash;

    const [
      material,
      material_type,
      massif,
      color,
      patina_color,
      beading_main,
      beading_additional,
      beading_additional2,
    ] = materialFormFields;

    setGlobalDoorSettings((prev: any) => ({
      ...prev,
      material: material || "",
      material_type: material_type || "",
      massif: massif || "",
      color: color || "",
      patina_color: patina_color || "",
      beading_main: beading_main || "",
      beading_additional: beading_additional ?? null,
      beading_additional2: beading_additional2 ?? null,
    }));
  }, [materialFieldsHash, materialFormFields]);

  // --- Format Options for Selects (Memoized) ---
  const fieldOptions = useMemo(
    () => ({
      // rateOptions: formatReferenceOptions(currencies),
      branchOptions: formatReferenceOptions(branches),
      storeOptions: formatReferenceOptions(stores),
      projectOptions: formatReferenceOptions(projects),
      agentOptions: formatReferenceOptions(counterparties),
      organizationOptions: formatReferenceOptions(organizations),
      salesChannelOptions: formatReferenceOptions(salesChannels),
      sellerOptions: formatReferenceOptions(
        (sellers as any)?.results || sellers,
      ),
      operatorOptions: formatReferenceOptions(
        (operators as any)?.results || operators,
      ),
      materialOptions: formatReferenceOptions(materials),
      materialTypeOptions: formatReferenceOptions(materialTypes),
      massifOptions: formatReferenceOptions(massifs),
      colorOptions: formatReferenceOptions(colors),
      zamershikOptions: formatZamershikOptions(zamershiks),
      patinaColorOptions: formatReferenceOptions(patinaColors),
      beadingMainOptions: formatReferenceOptions(
        Array.isArray(beadings)
          ? beadings.filter((b) => b.type === "main")
          : {
              results:
                beadings?.results?.filter((b) => b.type === "main") || [],
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
        label: `${range.casing_size}`,
        ...range,
      })),
      steelColorOptions: formatReferenceOptions(steelColors),
      frameOptions: formatReferenceOptions(frames),
      claddingOptions: formatReferenceOptions(claddings),
      lockOptions: formatReferenceOptions(locks),
    }),
    [
      branches,
      stores,
      projects,
      counterparties,
      organizations,
      salesChannels,
      sellers,
      operators,
      materials,
      materialTypes,
      massifs,
      colors,
      zamershiks,
      patinaColors,
      beadings,
      glassTypes,
      thresholds,
      casingRanges,
      steelColors,
      frames,
      claddings,
      locks,
    ],
  );

  // Debug log to check if casingRanges data is being received
  console.log("Casing Ranges Data:", casingRanges);
  console.log(
    "Formatted Casing Range Options:",
    fieldOptions.casingRangeOptions,
  );
  console.log("Casing Formula from API:", casingFormula);

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
      name: "organization",
      label: t("forms.organization"),
      type: "searchable-resource-select",
      resourceType: "organizations",
      placeholder: t("placeholders.select_organization"),
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
    {
      name: "extra_comment",
      label: t("forms.extra_comment"),
      type: "textarea",
      placeholder: t("placeholders.enter_extra_comment"),
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
    {
      name: "beading_additional2",
      label: t("forms.beading_additional2"),
      type: "searchable-resource-select",
      resourceType: "beadings",
      placeholder: t("placeholders.select_beading_additional2"),
    },
  ];

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
      beading_additional2: globalDoorSettings.beading_additional2,
    }));
    setDoors(updatedDoors);

    const orderData = orderForm.getValues();

    // Prepare order data for calculation
    const calculationData = {
      ...orderData,
      // Add door_type at order level
      door_type: doorType,
      // Map IDs to full meta objects for the API
      store: getMetaById(stores, orderData.store),
      project: getMetaById(projects, orderData.project),
      agent:
        orderData.agent && typeof orderData.agent === "object"
          ? orderData.agent
          : getMetaById(counterparties, orderData.agent),
      organization: getMetaById(organizations, orderData.organization),
      salesChannel: getMetaById(salesChannels, orderData.salesChannel),
      seller: orderData.seller,
      operator: orderData.operator,
      branch: getMetaById(branches, orderData.branch),
      // Hydrate door data with full product info
      zamershik: orderData.zamershik,
      doors: updatedDoors.map((door: any) => {
        if (doorType === "STEEL") {
          // Steel door structure - no extensions, casings, crowns, accessories
          return {
            ...door,
            model: getProductById(productsList, door.model),
          };
        }

        // Wood door structure (existing)
        return {
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
        };
      }),
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
    // Validate required fields before submission
    const isValid = validateRequiredFields(data, doors, doorType);
    if (!isValid) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      scrollToFirstError();
      return;
    }
    const { total_sum, remainingBalance } = totals;

    // Debug zamershik field
    console.log("Form submission - zamershik data:", {
      formZamershik: data.zamershik,
      zamershiksList: zamershiks,
      zamershikFound: getMetaById(zamershiks, data.zamershik),
    });

    // Debug doors data being sent
    console.log("Form submission - doors data being sent:", doors);

    const orderUpdateData = {
      ...data,
      id: orderData?.id,
      // Add door_type at order level
      door_type: doorType,

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
      seller: data.seller,
      operator: data.operator,
      branch: getMetaById(branches, data.branch),
      zamershik: data.zamershik,
      // Hydrate door data with full product info
      doors: doors.map((door: any) => {
        if (doorType === "STEEL") {
          // Steel door structure - no extensions, casings, crowns, accessories
          return {
            ...door,
            model: getProductById(productsList, door.model),
          };
        }

        // Wood door structure (existing)
        return {
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
        };
      }),
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
        // navigate("/orders");
      },
      onError: (e: any) => {
        console.error("Error updating order:", e.response?.data);
        toast.error(t("messages.error_updating_order"));
      },
    });
  };

  const handleSendToMoySklad = () => {
    if (!orderData?.id) return;

    // Get current form data for validation
    const currentFormData = orderForm.getValues();

    // Validate required fields before sending to Moy Sklad
    const isValid = validateRequiredFields(currentFormData, doors, doorType);
    if (!isValid) {
      toast.error(
        "Перед отправкой в Мой Склад необходимо заполнить все обязательные поля: Контрагент, Организация, Продавец, Оператор, Срок исполнения",
      );
      scrollToFirstError();
      return;
    }

    sendToMoySklad(orderData.id, {
      onSuccess: () => {
        toast.success(t("messages.order_sent_to_moy_sklad"));
        // You might want to refetch the order data to update the status
        window.location.reload(); // Simple way to refresh the data
      },
      onError: (error: any) => {
        console.error("Error sending order to Moy Sklad:", error);
        toast.error(t("messages.error_sending_to_moy_sklad"));
      },
    });
  };

  const handleDownloadPDF = async () => {
    if (!orderData?.id) return;

    setIsDownloadingPDF(true);
    try {
      const response = await api.get(`orders/${orderData.id}/pdf/`, {
        responseType: "blob",
      });

      // Validate response content type
      const contentType = response.headers["content-type"];
      if (contentType && !contentType.includes("application/pdf")) {
        throw new Error("Invalid PDF response");
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create meaningful filename
      const orderFormData = orderForm.getValues();
      const agent = orderFormData.agent;
      const clientName =
        (agent && typeof agent === "object" && (agent as any).name) ||
        (agent && typeof agent === "object" && (agent as any).label) ||
        "";
      const sanitizedClientName = clientName
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 30);
      const date = new Date().toISOString().split("T")[0];
      const filename = sanitizedClientName
        ? `order_${orderData.id}_${sanitizedClientName}_${date}.pdf`
        : `order_${orderData.id}_${date}.pdf`;

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      toast.success(
        t("messages.pdf_downloaded") || "PDF downloaded successfully",
      );
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error(
        t("messages.error_downloading_pdf") || "Error downloading PDF",
      );
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleViewPDF = async () => {
    if (!orderData?.id) return;

    setIsLoadingPDF(true);
    try {
      const response = await api.get(`orders/${orderData.id}/pdf/`, {
        responseType: "blob",
      });

      // Validate response content type
      const contentType = response.headers["content-type"];
      if (contentType && !contentType.includes("application/pdf")) {
        throw new Error("Invalid PDF response");
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create meaningful filename
      const orderFormData = orderForm.getValues();
      const agent = orderFormData.agent;
      const clientName =
        (agent && typeof agent === "object" && (agent as any).name) ||
        (agent && typeof agent === "object" && (agent as any).label) ||
        "";
      const sanitizedClientName = clientName
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 30);
      const date = new Date().toISOString().split("T")[0];
      const filename = sanitizedClientName
        ? `order_${orderData.id}_${sanitizedClientName}_${date}.pdf`
        : `order_${orderData.id}_${date}.pdf`;

      // Create a temporary anchor element to handle the download with proper filename
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Open in new tab for viewing
      const newWindow = window.open(url, "_blank");

      // Add download functionality to the new window
      if (newWindow) {
        newWindow.document.title = `Order ${orderData.id} PDF`;

        // Add download button to the new window
        newWindow.addEventListener("load", () => {
          const downloadBtn = newWindow.document.createElement("button");
          downloadBtn.innerHTML = "📥 Download PDF";
          downloadBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #ea580c;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          `;
          downloadBtn.onclick = () => {
            const downloadLink = newWindow.document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.click();
          };
          newWindow.document.body.appendChild(downloadBtn);
        });
      } else {
        // Popup was blocked, fallback to direct download
        toast.warning(
          t("messages.popup_blocked_downloading") ||
            "Popup blocked. Downloading PDF instead...",
        );
        const fallbackLink = document.createElement("a");
        fallbackLink.href = url;
        fallbackLink.download = filename;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        document.body.removeChild(fallbackLink);
      }

      // Clean up the blob URL after 30 seconds (increased from 1 second)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 30000);

      toast.success(t("messages.pdf_opened") || "PDF opened in new window");
    } catch (error) {
      console.error("Error opening PDF:", error);
      toast.error(t("messages.error_opening_pdf") || "Error opening PDF");
    } finally {
      setIsLoadingPDF(false);
    }
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
            <div className="flex gap-2">
              <Button
                onClick={handleViewPDF}
                disabled={!orderData?.id || isLoadingPDF}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                <ExternalLink className="h-4 w-4" />
                {isLoadingPDF
                  ? t("common.loading") || "Loading..."
                  : t("common.view_pdf") || "View PDF"}
              </Button>
              <Button
                onClick={handleDownloadPDF}
                disabled={!orderData?.id || isDownloadingPDF}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {isDownloadingPDF
                  ? t("common.downloading") || "Downloading..."
                  : t("common.download_pdf") || "Download PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/orders")}
                className="flex items-center gap-2"
              >
                ← {t("common.back_to_orders")}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <StepOne
            orderForm={orderForm}
            orderFields={orderFields}
            materialFields={materialFields}
            isLoading={isUpdating}
            order={orderData}
            doorType={doorType}
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
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
            casingFormula={casingFormula}
            doorType={doorType}
            setDoorType={setDoorType}
            validationErrors={validationErrors}
            clearFieldError={clearFieldError}
          />

          {currentUser?.role !== "MANUFACTURE" && (
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
              onSendToMoySklad={handleSendToMoySklad}
              isSendingToMoySklad={isSendingToMoySklad}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function StepOne({
  orderForm,
  orderFields,
  materialFields,
  isLoading,
  order,
  doorType,
  validationErrors,
  clearFieldError,
}: any) {
  const { t } = useTranslation();
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

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
                {t("forms.order_information")} {order.order_code} /{" "}
                {formatDate(order.created_at)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Custom Counterparty Select Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("forms.agent")} *
                </label>
                <SearchableCounterpartySelect
                  value={orderForm.watch("agent")}
                  onChange={(value) => {
                    orderForm.setValue("agent", value);
                    if (value) clearFieldError("agent");
                  }}
                  placeholder={t("placeholders.select_agent")}
                  required={true}
                  className={
                    validationErrors.agent ? "border-red-500 border-2" : ""
                  }
                />
                {validationErrors.agent && (
                  <p className="text-red-500 text-sm mt-1">
                    Это поле обязательно для заполнения
                  </p>
                )}
              </div>
              <ResourceForm
                fields={orderFields}
                onSubmit={() => {}}
                isSubmitting={isLoading}
                hideSubmitButton={true}
                form={orderForm}
                gridClassName="md:grid-cols-2 gap-6"
                validationErrors={validationErrors}
                clearFieldError={clearFieldError}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side - Material Settings (50%) - Only show for non-steel doors */}
        {doorType !== "STEEL" && (
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
        )}
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
  casingFormula,
  doorType,
  setDoorType,
  validationErrors,
  clearFieldError,
}: any) {
  const { t } = useTranslation();

  console.log("StepTwo render - doors prop:", doors);
  console.log("StepTwo render - doors length:", doors?.length);

  // Ref to track if tables have been initialized
  // const tablesInitialized = useRef(false);

  // Tables state - each table has its own door model and doors array
  const [tables, setTables] = useState([
    {
      id: 1,
      doorModel: null as any,
      doorSearch: "",
      doors: doors || [],
      // Table-specific search states
      extensionSearch: "",
      casingSearch: "",
      crownSearch: "",
      cubeSearch: "",
      legSearch: "",
      glassSearch: "",
      lockSearch: "",
      topsaSearch: "",
      beadingSearch: "",
      // Table-specific selected products
      selectedExtensionProduct: null as any,
      selectedCasingProduct: null as any,
      selectedCrownProduct: null as any,
      selectedCubeProduct: null as any,
      selectedLegProduct: null as any,
      selectedGlassProduct: null as any,
      selectedLockProduct: null as any,
      selectedTopsaProduct: null as any,
      selectedBeadingProduct: null as any,
      // Flag to indicate if this table is component-only (no door model)
      isComponentOnlyTable: false,
    },
  ]);

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

  // Enhanced grouping function that considers both door models and component configurations
  const createTableGroupingKey = (door: any) => {
    // If door has a model, use it as primary grouping key
    if (door.model) {
      return `door_${door.model}`;
    }

    // For doors without models, create grouping key based on component configurations
    const componentKeys = [];

    // Check casings
    if (door.casings && door.casings.length > 0) {
      const casingModels = door.casings
        .map((c: any) => c.model)
        .filter((m: any) => m)
        .sort()
        .join(",");
      if (casingModels) componentKeys.push(`casings_${casingModels}`);
    }

    // Check crowns
    if (door.crowns && door.crowns.length > 0) {
      const crownModels = door.crowns
        .map((c: any) => c.model)
        .filter((m: any) => m)
        .sort()
        .join(",");
      if (crownModels) componentKeys.push(`crowns_${crownModels}`);
    }

    // Check extensions
    if (door.extensions && door.extensions.length > 0) {
      const extensionModels = door.extensions
        .map((e: any) => e.model)
        .filter((m: any) => m)
        .sort()
        .join(",");
      if (extensionModels) componentKeys.push(`extensions_${extensionModels}`);
    }

    // Check accessories
    if (door.accessories && door.accessories.length > 0) {
      const accessoryModels = door.accessories
        .map((a: any) => `${a.accessory_type}_${a.model}`)
        .filter((m: any) => m && !m.endsWith("_"))
        .sort()
        .join(",");
      if (accessoryModels) componentKeys.push(`accessories_${accessoryModels}`);
    }

    // If no components found, use a default key
    if (componentKeys.length === 0) {
      return "no_model_no_components";
    }

    // Combine all component keys to create unique grouping
    return `components_${componentKeys.join("|")}`;
  };

  // Initialize tables with existing doors - use useMemo to prevent infinite loops
  const initializedTables = useMemo(() => {
    console.log("StepTwo useMemo - doors:", doors);
    console.log("StepTwo useMemo - productsList length:", productsList.length);

    // Only initialize if we have doors data and products
    if (!doors || doors.length === 0 || productsList.length === 0) {
      return [
        {
          id: 1,
          doorModel: null as any,
          doorSearch: "",
          doors: [],
          extensionSearch: "",
          casingSearch: "",
          crownSearch: "",
          cubeSearch: "",
          legSearch: "",
          glassSearch: "",
          lockSearch: "",
          topsaSearch: "",
          beadingSearch: "",
          selectedExtensionProduct: null as any,
          selectedCasingProduct: null as any,
          selectedCrownProduct: null as any,
          selectedCubeProduct: null as any,
          selectedLegProduct: null as any,
          selectedGlassProduct: null as any,
          selectedLockProduct: null as any,
          selectedTopsaProduct: null as any,
          selectedBeadingProduct: null as any,
          isComponentOnlyTable: false,
        },
      ];
    }

    console.log("Initializing tables with doors:", doors);
    // Enhanced grouping: Group doors by model OR component configurations
    const doorGroups: { [key: string]: any[] } = {};

    doors.forEach((door: any) => {
      const key = createTableGroupingKey(door);
      if (!doorGroups[key]) {
        doorGroups[key] = [];
      }
      doorGroups[key].push(door);
    });

    // Create tables for each group
    const newTables = Object.keys(doorGroups).map((key, index) => {
      const groupDoors = doorGroups[key];
      const firstDoor = groupDoors[0];

      let doorModel = null;
      let doorSearch = "";
      let isComponentOnlyTable = false;

      // Check if this is a door model-based table or component-based table
      if (key.startsWith("door_") && firstDoor && firstDoor.model) {
        // Door model-based table
        const product = productsList.find((p: any) => p.id === firstDoor.model);
        if (product) {
          doorModel = product;
          doorSearch = product.name || "";
        }
      } else {
        // Component-based table (no door model)
        isComponentOnlyTable = true;
        doorSearch = ""; // Will be set based on component models
      }

      // Initialize table-specific selected products from all doors in the group
      let selectedExtensionProduct: any = null;
      let selectedCasingProduct: any = null;
      let selectedCrownProduct: any = null;
      let selectedCubeProduct: any = null;
      let selectedLegProduct: any = null;
      let selectedGlassProduct: any = null;
      let selectedLockProduct: any = null;
      let selectedTopsaProduct: any = null;
      let selectedBeadingProduct: any = null;

      // Check all doors in the group to find the first available product for each type
      groupDoors.forEach((door: any) => {
        // Pre-populate extension product from first available
        if (
          !selectedExtensionProduct &&
          door.extensions &&
          door.extensions.length > 0
        ) {
          const extensionModel = door.extensions[0].model;
          if (extensionModel) {
            selectedExtensionProduct = productsList.find(
              (p: any) => p.id === extensionModel,
            );
          }
        }

        // Pre-populate casing product from first available
        if (!selectedCasingProduct && door.casings && door.casings.length > 0) {
          const casingModel = door.casings[0].model;
          if (casingModel) {
            selectedCasingProduct = productsList.find(
              (p: any) => p.id === casingModel,
            );
          }
        }

        // Pre-populate crown product from first available
        if (!selectedCrownProduct && door.crowns && door.crowns.length > 0) {
          const crownModel = door.crowns[0].model;
          if (crownModel) {
            selectedCrownProduct = productsList.find(
              (p: any) => p.id === crownModel,
            );
          }
        }

        // Pre-populate accessory products from any door that has them
        if (door.accessories && door.accessories.length > 0) {
          door.accessories.forEach((accessory: any) => {
            if (!accessory.model) return;

            const accessoryProduct = productsList.find(
              (p: any) => p.id === accessory.model,
            );
            if (!accessoryProduct) return;

            switch (accessory.accessory_type) {
              case "cube":
                if (!selectedCubeProduct)
                  selectedCubeProduct = accessoryProduct;
                break;
              case "leg":
                if (!selectedLegProduct) selectedLegProduct = accessoryProduct;
                break;
              case "glass":
                if (!selectedGlassProduct)
                  selectedGlassProduct = accessoryProduct;
                break;
              case "lock":
                if (!selectedLockProduct)
                  selectedLockProduct = accessoryProduct;
                break;
              case "topsa":
                if (!selectedTopsaProduct)
                  selectedTopsaProduct = accessoryProduct;
                break;
              case "beading":
                if (!selectedBeadingProduct)
                  selectedBeadingProduct = accessoryProduct;
                break;
            }
          });
        }
      });
      return {
        id: index + 1,
        doorModel: doorModel,
        doorSearch: doorSearch,
        doors: groupDoors,
        // Table-specific search states
        extensionSearch: selectedExtensionProduct?.name || "",
        casingSearch: selectedCasingProduct?.name || "",
        crownSearch: selectedCrownProduct?.name || "",
        cubeSearch: selectedCubeProduct?.name || "",
        legSearch: selectedLegProduct?.name || "",
        glassSearch: selectedGlassProduct?.name || "",
        lockSearch: selectedLockProduct?.name || "",
        topsaSearch: selectedTopsaProduct?.name || "",
        beadingSearch: selectedBeadingProduct?.name || "",
        // Table-specific selected products
        selectedExtensionProduct,
        selectedCasingProduct,
        selectedCrownProduct,
        selectedCubeProduct,
        selectedLegProduct,
        selectedGlassProduct,
        selectedLockProduct,
        selectedTopsaProduct,
        selectedBeadingProduct,
        // Flag to indicate if this table is component-only (no door model)
        isComponentOnlyTable,
      };
    });

    console.log("StepTwo - newTables created:", newTables);

    // If no groups found, create default table
    if (newTables.length === 0) {
      newTables.push({
        id: 1,
        doorModel: null,
        doorSearch: "",
        doors: doors,
        extensionSearch: "",
        casingSearch: "",
        crownSearch: "",
        cubeSearch: "",
        legSearch: "",
        glassSearch: "",
        lockSearch: "",
        topsaSearch: "",
        beadingSearch: "",
        selectedExtensionProduct: null,
        selectedCasingProduct: null,
        selectedCrownProduct: null,
        selectedCubeProduct: null,
        selectedLegProduct: null,
        selectedGlassProduct: null,
        selectedLockProduct: null,
        selectedTopsaProduct: null,
        selectedBeadingProduct: null,
        isComponentOnlyTable: false,
      });
    }

    return newTables;
  }, [
    doors?.length,
    productsList?.length,
    doors?.map((d: any) => d.id || d.model)?.join(","),
    productsList?.map((p: any) => p.id)?.join(","),
  ]);

  // Update tables when initializedTables changes
  // Memoize tables structure hash to prevent unnecessary updates
  const tablesStructureHash = useMemo(() => {
    return initializedTables.map((table) => ({
      doorsCount: table.doors.length,
      doorModelId: table.doorModel?.id || null,
    }));
  }, [initializedTables]);

  const prevTablesHashRef = useRef<string>("");

  useEffect(() => {
    const currentHash = JSON.stringify(tablesStructureHash);
    if (prevTablesHashRef.current === currentHash) {
      return;
    }
    prevTablesHashRef.current = currentHash;

    setTables(initializedTables);
  }, [tablesStructureHash, initializedTables]);

  // Add new table functionality
  const handleAddNewTable = () => {
    const newTableId = Math.max(...tables.map((t) => t.id)) + 1;
    const newTable = {
      id: newTableId,
      doorModel: null as any,
      doorSearch: "",
      doors: [],
      // Table-specific search states
      extensionSearch: "",
      casingSearch: "",
      crownSearch: "",
      cubeSearch: "",
      legSearch: "",
      glassSearch: "",
      lockSearch: "",
      topsaSearch: "",
      beadingSearch: "",
      // Table-specific selected products
      selectedExtensionProduct: null as any,
      selectedCasingProduct: null as any,
      selectedCrownProduct: null as any,
      selectedCubeProduct: null as any,
      selectedLegProduct: null as any,
      selectedGlassProduct: null as any,
      selectedLockProduct: null as any,
      selectedTopsaProduct: null as any,
      selectedBeadingProduct: null as any,
      // Flag to indicate if this table is component-only (no door model)
      isComponentOnlyTable: false,
    };
    setTables([...tables, newTable]);
  };

  // Remove table functionality
  const handleRemoveTable = (tableId: number) => {
    if (tables.length <= 1) return; // Don't allow removing the last table

    const updatedTables = tables.filter((table) => table.id !== tableId);
    setTables(updatedTables);
  };

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

  const handleAddNewRow = (tableId?: number) => {
    // Get material attributes from the order form to apply to all doors
    const orderData = orderForm.getValues();

    // Use specified table or first table
    const targetTableId = tableId || tables[0]?.id || 1;
    const targetTable =
      tables.find((table) => table.id === targetTableId) || tables[0];

    // For component-only tables, don't require a door model
    if (targetTable.isComponentOnlyTable) {
      // Create a door entry without a door model for component-only tables
      const newDoor = {
        model: null, // No door model for component-only tables
        price_type: "",
        price: 0,
        quantity: 0,
        height: 0,
        width: 0,
        // Material attributes from global settings
        material: orderData.material || "",
        material_type: orderData.material_type || "",
        massif: orderData.massif || "",
        color: orderData.color || "",
        patina_color: orderData.patina_color || "",
        beading_main: orderData.beading_main || "",
        beading_additional: orderData.beading_additional ?? null,
        beading_additional2: orderData.beading_additional2 ?? null,
        glass_type: "",
        threshold: "",
        paska_orin: [],
        opening_side: "Правый",
        promog: "Бар",
        // Initialize with empty component arrays
        extensions: [],
        casings: [],
        crowns: [],
        accessories: [],
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
      return;
    }

    // Use target table's door model as default for new rows (existing logic)
    const defaultDoorModel = targetTable.doorModel?.id || "";
    const defaultDoorPrice = targetTable.doorModel
      ? (targetTable.doorModel.salePrices?.find(
          (p: any) => p.priceType.name === "Цена продажи",
        )?.value || 0) / 100
      : 0;

    // For steel doors, create a simpler structure
    if (doorType === "STEEL") {
      const newDoor = {
        model: defaultDoorModel,
        price_type: "",
        price: defaultDoorPrice,
        quantity: 1,
        height: 2.1,
        width: 0.9,
        door_name: "",
        steel_color: "",
        crown_casing: [],
        frame: "",
        cladding: "",
        lock: "",
        peephole: "Жок",
        opening_side: "Правый",
        promog: "Бар",
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
      return;
    }

    // Create 2 default extensions (dobors) - with selected product if available, otherwise empty entries
    const defaultExtensions = [
      {
        model: targetTable.selectedExtensionProduct
          ? targetTable.selectedExtensionProduct.id
          : null,
        price_type: "",
        price: targetTable.selectedExtensionProduct
          ? (targetTable.selectedExtensionProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 1,
        height: 0,
        width: 0,
      },
      {
        model: targetTable.selectedExtensionProduct
          ? targetTable.selectedExtensionProduct.id
          : null,
        price_type: "",
        price: targetTable.selectedExtensionProduct
          ? (targetTable.selectedExtensionProduct.salePrices?.find(
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
        model: targetTable.selectedCasingProduct
          ? targetTable.selectedCasingProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedCasingProduct
          ? (targetTable.selectedCasingProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 1,
        casing_type: "боковой",
        casing_formula: casingFormula ? "formula1" : "formula2",
        casing_range: "",
        height: 0,
        width: casingSize,
      },
      {
        model: targetTable.selectedCasingProduct
          ? targetTable.selectedCasingProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedCasingProduct
          ? (targetTable.selectedCasingProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 1,
        casing_type: "прямой",
        casing_formula: casingFormula ? "formula1" : "formula2",
        casing_range: "",
        height: 0,
        width: casingSize,
      },
    ];

    // Create 1 default crown - with selected product if available, otherwise empty entry
    const defaultCrowns = [
      {
        model: targetTable.selectedCrownProduct
          ? targetTable.selectedCrownProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedCrownProduct
          ? (targetTable.selectedCrownProduct.salePrices?.find(
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
        model: targetTable.selectedCubeProduct
          ? targetTable.selectedCubeProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedCubeProduct
          ? (targetTable.selectedCubeProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "cube",
        name: "Кубик",
      },
      {
        model: targetTable.selectedLegProduct
          ? targetTable.selectedLegProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedLegProduct
          ? (targetTable.selectedLegProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "leg",
        name: "Ножка",
      },
      {
        model: targetTable.selectedGlassProduct
          ? targetTable.selectedGlassProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedGlassProduct
          ? (targetTable.selectedGlassProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "glass",
        name: "Стекло",
      },
      {
        model: targetTable.selectedLockProduct
          ? targetTable.selectedLockProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedLockProduct
          ? (targetTable.selectedLockProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "lock",
        name: "Замок",
      },
      {
        model: targetTable.selectedTopsaProduct
          ? targetTable.selectedTopsaProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedTopsaProduct
          ? (targetTable.selectedTopsaProduct.salePrices?.find(
              (p: any) => p.priceType.name === "Цена продажи",
            )?.value || 0) / 100
          : 0,
        quantity: 0,
        accessory_type: "topsa",
        name: "Топса",
      },
      {
        model: targetTable.selectedBeadingProduct
          ? targetTable.selectedBeadingProduct.id
          : "",
        price_type: "",
        price: targetTable.selectedBeadingProduct
          ? (targetTable.selectedBeadingProduct.salePrices?.find(
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
      beading_additional: orderData.beading_additional ?? null,
      beading_additional2: orderData.beading_additional2 ?? null,
      glass_type: "",
      threshold: "",
      paska_orin: [],
      extensions: defaultExtensions,
      casings: defaultCasings,
      crowns: defaultCrowns,
      accessories: defaultAccessories,
    };

    // Calculate casing dimensions after door is created
    newDoor.casings = newDoor.casings.map((casing: any) =>
      calculateCasingDimensions(
        { ...casing },
        newDoor,
        fieldOptions,
        casingSize,
        casingFormula,
      ),
    );

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
        } else if (
          field === "extensions" ||
          field === "crowns" ||
          field === "casings" ||
          field === "accessories"
        ) {
          // For nested arrays like extensions/crowns/casings/accessories, ensure we preserve the structure
          updatedDoors[doorIndex] = {
            ...door,
            [field]: value,
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

          // Recalculate casing dimensions while preserving the model
          if (updatedDoor.casings && updatedDoor.casings.length > 0) {
            updatedDoor.casings = updatedDoor.casings.map((casing: any) => {
              const originalModel = casing.model; // Preserve the original model
              const recalculatedCasing = calculateCasingDimensions(
                { ...casing },
                updatedDoor,
                fieldOptions,
                casingSize,
                casingFormula,
              );
              // Ensure the model is preserved after recalculation
              return {
                ...recalculatedCasing,
                model: originalModel,
              };
            });
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

  // Memoize doors data to prevent unnecessary recalculations
  const doorsFromTables = useMemo(() => {
    return tables.flatMap((table) =>
      table.doors.map((door: any) => ({
        ...door,
        model: table.doorModel ? table.doorModel.id : door.model,
      })),
    );
  }, [tables]);

  // Create a stable hash of doors for comparison
  const doorsHash = useMemo(() => {
    return JSON.stringify(
      doorsFromTables.map((door) => ({
        model: door.model,
        quantity: door.quantity,
        width: door.width,
        height: door.height,
        door_name: door.door_name,
        price: door.price,
        steel_color: door.steel_color,
        frame: door.frame,
        cladding: door.cladding,
        lock: door.lock,
        peephole: door.peephole,
        opening_side: door.opening_side,
        promog: door.promog,
        price_type: door.price_type,
        material: door.material,
        material_type: door.material_type,
        massif: door.massif,
        color: door.color,
        patina_color: door.patina_color,
        beading_main: door.beading_main,
        beading_additional: door.beading_additional,
        beading_additional2: door.beading_additional2,
        extensions: door.extensions,
        casings: door.casings,
        crowns: door.crowns,
        accessories: door.accessories,
      })),
    );
  }, [doorsFromTables]);

  const prevDoorsHashRef = useRef<string>("");

  useEffect(() => {
    if (prevDoorsHashRef.current === doorsHash) {
      return;
    }
    prevDoorsHashRef.current = doorsHash;

    console.log(
      "Syncing tables to doors state - doors count:",
      doorsFromTables.length,
    );
    setDoors(doorsFromTables);
  }, [doorsHash, doorsFromTables]);

  // Effect to update door type when doorType changes (debounced)
  useEffect(() => {
    if (tables.length === 0) return;

    const timeoutId = setTimeout(() => {
      setTables((prevTables) => {
        return prevTables.map((table) => ({
          ...table,
          doors: table.doors.map((door: any) => ({
            ...door,
            // Remove door_type from individual doors since it's now at order level
          })),
        }));
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [doorType, tables.length]);

  // Remove door functionality
  const handleRemoveDoor = (doorIndex: number, tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        return {
          ...table,
          doors: table.doors.filter((_: any, i: number) => i !== doorIndex),
        };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Add extension functionality
  // const handleAddExtension = (doorIndex: number, tableId: number) => {
  //   const updatedTables = tables.map((table) => {
  //     if (table.id === tableId) {
  //       const updatedDoors = [...table.doors];
  //       const door = updatedDoors[doorIndex];

  //       const newExtension = {
  //         model: table.selectedExtensionProduct
  //           ? table.selectedExtensionProduct.id
  //           : "",
  //         price_type: "",
  //         price: table.selectedExtensionProduct
  //           ? (table.selectedExtensionProduct.salePrices?.find(
  //               (p: any) => p.priceType.name === "Цена продажи",
  //             )?.value || 0) / 100
  //           : 0,
  //         quantity: 1,
  //         height: 0,
  //         width: 0,
  //       };

  //       updatedDoors[doorIndex] = {
  //         ...door,
  //         extensions: [...(door.extensions || []), newExtension],
  //       };

  //       return { ...table, doors: updatedDoors };
  //     }
  //     return table;
  //   });
  //   setTables(updatedTables);
  // };

  // // Remove extension functionality
  // const handleRemoveExtension = (
  //   doorIndex: number,
  //   tableId: number,
  //   extensionIndex: number,
  // ) => {
  //   const updatedTables = tables.map((table) => {
  //     if (table.id === tableId) {
  //       const updatedDoors = [...table.doors];
  //       const door = updatedDoors[doorIndex];

  //       updatedDoors[doorIndex] = {
  //         ...door,
  //         extensions:
  //           door.extensions?.filter(
  //             (_: any, i: number) => i !== extensionIndex,
  //           ) || [],
  //       };

  //       return { ...table, doors: updatedDoors };
  //     }
  //     return table;
  //   });
  //   setTables(updatedTables);
  // };

  // Bulk add extensions to all doors in a table
  const handleBulkAddExtensions = (tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const newExtension = {
          model: table.selectedExtensionProduct
            ? table.selectedExtensionProduct.id
            : "",
          price_type: "",
          price: table.selectedExtensionProduct
            ? (table.selectedExtensionProduct.salePrices?.find(
                (p: any) => p.priceType.name === "Цена продажи",
              )?.value || 0) / 100
            : 0,
          quantity: 1,
          height: 0,
          width: 0,
        };

        const updatedDoors = table.doors.map((door: any) => ({
          ...door,
          extensions: [...(door.extensions || []), newExtension],
        }));

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Bulk remove last extension from all doors in a table
  const handleBulkRemoveExtensions = (tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedDoors = table.doors.map((door: any) => {
          if (door.extensions && door.extensions.length > 0) {
            return {
              ...door,
              extensions: door.extensions.slice(0, -1), // Remove last extension
            };
          }
          return door;
        });

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Add casing functionality
  // const handleAddCasing = (doorIndex: number, tableId: number) => {
  //   const updatedTables = tables.map((table) => {
  //     if (table.id === tableId) {
  //       const updatedDoors = [...table.doors];
  //       const door = updatedDoors[doorIndex];

  //       const newCasing = {
  //         model: table.selectedCasingProduct
  //           ? table.selectedCasingProduct.id
  //           : "",
  //         price_type: "",
  //         price: table.selectedCasingProduct
  //           ? (table.selectedCasingProduct.salePrices?.find(
  //               (p: any) => p.priceType.name === "Цена продажи",
  //             )?.value || 0) / 100
  //           : 0,
  //         quantity: 1,
  //         height: 0,
  //         width: casingSize || 0,
  //         casing_type: "боковой",
  //         casing_range: "",
  //       };

  //       // Calculate casing dimensions
  //       const calculatedCasing = calculateCasingDimensions(
  //         newCasing,
  //         door,
  //         fieldOptions,
  //         casingSize,
  //         casingFormula,
  //       );

  //       updatedDoors[doorIndex] = {
  //         ...door,
  //         casings: [...(door.casings || []), calculatedCasing],
  //       };

  //       return { ...table, doors: updatedDoors };
  //     }
  //     return table;
  //   });
  //   setTables(updatedTables);
  // };

  // Remove casing functionality
  // const handleRemoveCasing = (
  //   doorIndex: number,
  //   tableId: number,
  //   casingIndex: number,
  // ) => {
  //   const updatedTables = tables.map((table) => {
  //     if (table.id === tableId) {
  //       const updatedDoors = [...table.doors];
  //       const door = updatedDoors[doorIndex];

  //       updatedDoors[doorIndex] = {
  //         ...door,
  //         casings:
  //           door.casings?.filter((_: any, i: number) => i !== casingIndex) ||
  //           [],
  //       };

  //       return { ...table, doors: updatedDoors };
  //     }
  //     return table;
  //   });
  //   setTables(updatedTables);
  // };

  // // Add crown functionality
  // const handleAddCrown = (doorIndex: number, tableId: number) => {
  //   const updatedTables = tables.map((table) => {
  //     if (table.id === tableId) {
  //       const updatedDoors = [...table.doors];
  //       const door = updatedDoors[doorIndex];

  //       const newCrown = {
  //         model: table.selectedCrownProduct
  //           ? table.selectedCrownProduct.id
  //           : "",
  //         price_type: "",
  //         price: table.selectedCrownProduct
  //           ? (table.selectedCrownProduct.salePrices?.find(
  //               (p: any) => p.priceType.name === "Цена продажи",
  //             )?.value || 0) / 100
  //           : 0,
  //         quantity: 1,
  //         height: crownSize || 0,
  //         width: 0,
  //       };

  //       updatedDoors[doorIndex] = {
  //         ...door,
  //         crowns: [...(door.crowns || []), newCrown],
  //       };

  //       return { ...table, doors: updatedDoors };
  //     }
  //     return table;
  //   });
  //   setTables(updatedTables);
  // };

  // // Remove crown functionality
  // const handleRemoveCrown = (
  //   doorIndex: number,
  //   tableId: number,
  //   crownIndex: number,
  // ) => {
  //   const updatedTables = tables.map((table) => {
  //     if (table.id === tableId) {
  //       const updatedDoors = [...table.doors];
  //       const door = updatedDoors[doorIndex];

  //       updatedDoors[doorIndex] = {
  //         ...door,
  //         crowns:
  //           door.crowns?.filter((_: any, i: number) => i !== crownIndex) || [],
  //       };

  //       return { ...table, doors: updatedDoors };
  //     }
  //     return table;
  //   });
  //   setTables(updatedTables);
  // };

  // Bulk add casings to all doors in a table
  const handleBulkAddCasings = (tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const newCasing = {
          model: table.selectedCasingProduct
            ? table.selectedCasingProduct.id
            : "",
          price_type: "",
          price: table.selectedCasingProduct
            ? (table.selectedCasingProduct.salePrices?.find(
                (p: any) => p.priceType.name === "Цена продажи",
              )?.value || 0) / 100
            : 0,
          quantity: 1,
          height: 0,
          width: casingSize || 0,
          casing_type: "боковой",
          casing_range: "",
        };

        const updatedDoors = table.doors.map((door: any) => {
          // Calculate casing dimensions for each door
          const calculatedCasing = calculateCasingDimensions(
            { ...newCasing },
            door,
            fieldOptions,
            casingSize,
            casingFormula,
          );

          return {
            ...door,
            casings: [...(door.casings || []), calculatedCasing],
          };
        });

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Bulk remove last casing from all doors in a table
  const handleBulkRemoveCasings = (tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedDoors = table.doors.map((door: any) => {
          if (door.casings && door.casings.length > 0) {
            return {
              ...door,
              casings: door.casings.slice(0, -1), // Remove last casing
            };
          }
          return door;
        });

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Bulk add crowns to all doors in a table
  const handleBulkAddCrowns = (tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const newCrown = {
          model: table.selectedCrownProduct
            ? table.selectedCrownProduct.id
            : "",
          price_type: "",
          price: table.selectedCrownProduct
            ? (table.selectedCrownProduct.salePrices?.find(
                (p: any) => p.priceType.name === "Цена продажи",
              )?.value || 0) / 100
            : 0,
          quantity: 1,
          height: crownSize || 0,
          width: 0,
        };

        const updatedDoors = table.doors.map((door: any) => ({
          ...door,
          crowns: [...(door.crowns || []), newCrown],
        }));

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  // Bulk remove last crown from all doors in a table
  const handleBulkRemoveCrowns = (tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedDoors = table.doors.map((door: any) => {
          if (door.crowns && door.crowns.length > 0) {
            return {
              ...door,
              crowns: door.crowns.slice(0, -1), // Remove last crown
            };
          }
          return door;
        });

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
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
    "beading_additional2",
  ]);

  // Memoize material attributes to prevent unnecessary updates
  const materialAttributesHash = useMemo(() => {
    if (!materialAttributes || materialAttributes.every((field: any) => !field))
      return "";
    return JSON.stringify(materialAttributes);
  }, [materialAttributes]);

  const prevMaterialAttributesHashRef = useRef<string>("");

  useEffect(() => {
    if (
      prevMaterialAttributesHashRef.current === materialAttributesHash ||
      !materialAttributesHash
    ) {
      return;
    }
    prevMaterialAttributesHashRef.current = materialAttributesHash;

    const [
      material,
      material_type,
      massif,
      color,
      patina_color,
      beading_main,
      beading_additional,
      beading_additional2,
    ] = materialAttributes;

    // Debounce the table update
    const timeoutId = setTimeout(() => {
      setTables((prevTables) => {
        const updatedTables = prevTables.map((table) => ({
          ...table,
          doors: table.doors.map((door: any) => {
            // Check if any material attribute actually changed
            const hasChanges =
              door.material !== (material || "") ||
              door.material_type !== (material_type || "") ||
              door.massif !== (massif || "") ||
              door.color !== (color || "") ||
              door.patina_color !== (patina_color || "") ||
              door.beading_main !== (beading_main || "") ||
              door.beading_additional !== beading_additional ||
              door.beading_additional2 !== beading_additional2;

            if (!hasChanges) return door;

            return {
              ...door,
              material: material || "",
              material_type: material_type || "",
              massif: massif || "",
              color: color || "",
              patina_color: patina_color || "",
              beading_main: beading_main || "",
              beading_additional: beading_additional ?? null,
              beading_additional2: beading_additional2 ?? null,
            };
          }),
        }));

        // Only return new tables if there were actual changes
        const hasAnyChanges = updatedTables.some((table, index) =>
          table.doors.some(
            (door: any, doorIndex: any) =>
              door !== prevTables[index]?.doors[doorIndex],
          ),
        );

        return hasAnyChanges ? updatedTables : prevTables;
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [materialAttributesHash, materialAttributes]);

  return (
    <div className="space-y-6">
      {/* Door Type Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Тип двери:</label>
          <Select
            value={doorType}
            onValueChange={(value: "WOOD" | "STEEL") => setDoorType(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Выберите тип двери" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WOOD">WOOD (агаш қапы)</SelectItem>
              <SelectItem value="STEEL">STEEL (темир қапы)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add New Table Button */}
        <Button
          // variant="outline"
          size="sm"
          onClick={handleAddNewTable}
          className="h-8 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-3 w-3" />
          Добавить новую модель двери
        </Button>
      </div>

      {/* Render all tables vertically */}
      {tables.map((table, _tableIndex) => {
        const tableCurrentDoors = table.doors || [];
        console.log(
          "Rendering table",
          table.id,
          "with doors:",
          tableCurrentDoors,
        );
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
                    {table.isComponentOnlyTable ? (
                      // Component-only table header
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-gray-700">
                          #{table.id}
                        </span>
                        {/* <div className="flex gap-2 mt-1">
                          {table.selectedCasingProduct && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {t("forms.casing") || "Casing"}: {table.selectedCasingProduct.name}
                            </span>
                          )}
                          {table.selectedCrownProduct && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              {t("forms.crown") || "Crown"}: {table.selectedCrownProduct.name}
                            </span>
                          )}
                          {table.selectedExtensionProduct && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {t("forms.extension") || "Extension"}: {table.selectedExtensionProduct.name}
                            </span>
                          )}
                        </div> */}
                      </div>
                    ) : (
                      // Door model table header
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
                              // If this table was empty and we're selecting a model, add one row automatically
                              const shouldAddRow =
                                t.doors.length === 0 && product;

                              let newDoors = t.doors;

                              // If table has existing doors, update their model to the new selected model
                              if (t.doors.length > 0 && product) {
                                newDoors = t.doors.map((door: any) => ({
                                  ...door,
                                  model: product.id,
                                  price_type: "",
                                  price: product
                                    ? (product.salePrices?.find(
                                        (p: any) =>
                                          p.priceType.name === "Цена продажи",
                                      )?.value || 0) / 100
                                    : door.price,
                                }));
                              }

                              if (shouldAddRow) {
                                const orderData = orderForm.getValues();
                                const defaultDoorPrice = product
                                  ? (product.salePrices?.find(
                                      (p: any) =>
                                        p.priceType.name === "Цена продажи",
                                    )?.value || 0) / 100
                                  : 0;

                                // Create 2 default extensions (dobors) - with selected product if available, otherwise empty entries
                                const defaultExtensions = [
                                  {
                                    model: t.selectedExtensionProduct
                                      ? t.selectedExtensionProduct.id
                                      : null,
                                    price_type: "",
                                    price: t.selectedExtensionProduct
                                      ? (t.selectedExtensionProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 1,
                                    height: 0,
                                    width: 0,
                                  },
                                  {
                                    model: t.selectedExtensionProduct
                                      ? t.selectedExtensionProduct.id
                                      : null,
                                    price_type: "",
                                    price: t.selectedExtensionProduct
                                      ? (t.selectedExtensionProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
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
                                    model: t.selectedCasingProduct
                                      ? t.selectedCasingProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedCasingProduct
                                      ? (t.selectedCasingProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 1,
                                    casing_type: "боковой",
                                    casing_range: "",
                                    height: 0,
                                    width: casingSize,
                                  },
                                  {
                                    model: t.selectedCasingProduct
                                      ? t.selectedCasingProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedCasingProduct
                                      ? (t.selectedCasingProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 1,
                                    casing_type: "прямой",
                                    casing_range: "",
                                    height: 0,
                                    width: casingSize,
                                  },
                                ];

                                // Create 1 default crown - with selected product if available, otherwise empty entry
                                const defaultCrowns = [
                                  {
                                    model: t.selectedCrownProduct
                                      ? t.selectedCrownProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedCrownProduct
                                      ? (t.selectedCrownProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
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
                                    model: t.selectedCubeProduct
                                      ? t.selectedCubeProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedCubeProduct
                                      ? (t.selectedCubeProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 0,
                                    accessory_type: "cube",
                                    name: "Кубик",
                                  },
                                  {
                                    model: t.selectedLegProduct
                                      ? t.selectedLegProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedLegProduct
                                      ? (t.selectedLegProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 0,
                                    accessory_type: "leg",
                                    name: "Ножка",
                                  },
                                  {
                                    model: t.selectedGlassProduct
                                      ? t.selectedGlassProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedGlassProduct
                                      ? (t.selectedGlassProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 0,
                                    accessory_type: "glass",
                                    name: "Стекло",
                                  },
                                  {
                                    model: t.selectedLockProduct
                                      ? t.selectedLockProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedLockProduct
                                      ? (t.selectedLockProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 0,
                                    accessory_type: "lock",
                                    name: "Замок",
                                  },
                                  {
                                    model: t.selectedTopsaProduct
                                      ? t.selectedTopsaProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedTopsaProduct
                                      ? (t.selectedTopsaProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 0,
                                    accessory_type: "topsa",
                                    name: "Топса",
                                  },
                                  {
                                    model: t.selectedBeadingProduct
                                      ? t.selectedBeadingProduct.id
                                      : "",
                                    price_type: "",
                                    price: t.selectedBeadingProduct
                                      ? (t.selectedBeadingProduct.salePrices?.find(
                                          (p: any) =>
                                            p.priceType.name === "Цена продажи",
                                        )?.value || 0) / 100
                                      : 0,
                                    quantity: 0,
                                    accessory_type: "beading",
                                    name: "Шпингалет",
                                  },
                                ];

                                const newDoor =
                                  doorType === "STEEL"
                                    ? {
                                        model: product.id,
                                        price_type: "",
                                        price: defaultDoorPrice,
                                        quantity: 1,
                                        height: 2.1,
                                        width: 0.9,
                                        door_name: "",
                                        steel_color: "",
                                        crown_casing: [],
                                        frame: "",
                                        cladding: "",
                                        lock: "",
                                        peephole: "Жок",
                                        opening_side: "Правый",
                                        promog: "Бар",
                                      }
                                    : {
                                        model: product.id,
                                        price_type: "",
                                        price: defaultDoorPrice,
                                        quantity: 1,
                                        height: 0,
                                        width: 0,
                                        material: orderData.material || "",
                                        material_type:
                                          orderData.material_type || "",
                                        massif: orderData.massif || "",
                                        color: orderData.color || "",
                                        patina_color:
                                          orderData.patina_color || "",
                                        beading_main:
                                          orderData.beading_main || "",
                                        beading_additional:
                                          orderData.beading_additional ?? null,
                                        beading_additional2:
                                          orderData.beading_additional2 ?? null,
                                        glass_type: "",
                                        threshold: "",
                                        paska_orin: [],
                                        extensions: defaultExtensions,
                                        casings: defaultCasings,
                                        crowns: defaultCrowns,
                                        accessories: defaultAccessories,
                                      };

                                // Calculate casing dimensions after door is created (only for wood doors)
                                if (doorType === "WOOD" && newDoor.casings) {
                                  newDoor.casings = newDoor.casings.map(
                                    (casing: any) =>
                                      calculateCasingDimensions(
                                        { ...casing },
                                        newDoor,
                                        fieldOptions,
                                        casingSize,
                                        casingFormula,
                                      ),
                                  );
                                }
                                newDoors = [newDoor];
                              }

                              return {
                                ...t,
                                doorModel: product,
                                doorSearch: product?.name || "",
                                doors: newDoors,
                              };
                            }
                            return t;
                          });
                          setTables(updatedTables);
                        }}
                      />
                    )}
                    {/* {t("forms.doors_configuration")} - Table {table.id}
                    <Badge variant="secondary" className="ml-3 px-3 py-1">
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
                  </CardTitle>
                  {/* <p className="text-gray-600 mt-2">
                      {t("forms.add_doors_description")}
                    </p> */}
                </div>
                {/* <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      handleAddNewRow(table.id);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    size="lg"
                    disabled={!table.doorModel}
                  >
                    <Plus className="h-5 w-5" />
                    {t("forms.add_row")}
                  </Button>
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
                </div> */}
              </div>
              {/* {!table.doorModel && (
                <p className="text-xs text-red-500 mt-2">
                  Select door model first
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
                      <TableHead className="w-20">
                        {t("forms.height")}
                      </TableHead>
                      <TableHead className="w-20">{t("forms.width")}</TableHead>
                      <TableHead className="w-16">
                        {t("forms.quantity_of")}
                      </TableHead>

                      {doorType === "STEEL" ? (
                        // Steel door headers
                        <>
                          <TableHead className="w-32">Название двери</TableHead>
                          <TableHead className="w-32">Цвет стали</TableHead>
                          <TableHead className="w-32">
                            Корона/Наличник
                          </TableHead>
                          <TableHead className="w-32">Коробка</TableHead>
                          <TableHead className="w-32">Обшивка</TableHead>
                          <TableHead className="w-32">Замок</TableHead>
                          <TableHead className="w-32">Глазок</TableHead>
                          <TableHead className="w-32">
                            Сторона открытия
                          </TableHead>
                          <TableHead className="w-32">Промок</TableHead>
                        </>
                      ) : (
                        // Wood door headers
                        <>
                          <TableHead className="w-28">
                            {t("forms.glass_type")}
                          </TableHead>
                          <TableHead className="w-28">
                            {t("forms.threshold")}
                          </TableHead>
                          <TableHead className="w-28">Паска орыны</TableHead>

                          <TableHead className="min-w-[250px]">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span>{t("forms.casings")}</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleBulkAddCasings(table.id);
                                    }}
                                    className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-600"
                                    title="Add casing to all doors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleBulkRemoveCasings(table.id);
                                    }}
                                    className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                                    title="Remove last casing from all doors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                </div>
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
                                        doors: t.doors.map((door: any) => ({
                                          ...door,
                                          casings:
                                            door.casings?.map(
                                              (casing: any) => ({
                                                ...casing,
                                                model: product
                                                  ? product.id
                                                  : casing.model,
                                                price_type:
                                                  casing.price_type || "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : casing.price,
                                              }),
                                            ) || [],
                                        })),
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
                              <div className="flex items-center gap-2">
                                <span>{t("forms.crowns")}</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleBulkAddCrowns(table.id);
                                    }}
                                    className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-600"
                                    title="Add crown to all doors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleBulkRemoveCrowns(table.id);
                                    }}
                                    className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                                    title="Remove last crown from all doors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                </div>
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
                                        doors: t.doors.map((door: any) => ({
                                          ...door,
                                          crowns:
                                            door.crowns?.map((crown: any) => ({
                                              ...crown,
                                              model: product
                                                ? product.id
                                                : crown.model,
                                              price_type:
                                                crown.price_type || "",
                                              price: product
                                                ? (product.salePrices?.find(
                                                    (p: any) =>
                                                      p.priceType.name ===
                                                      "Цена продажи",
                                                  )?.value || 0) / 100
                                                : crown.price,
                                            })) || [],
                                        })),
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
                              <div className="flex items-center gap-2">
                                <span>{t("forms.extensions")}</span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleBulkAddExtensions(table.id);
                                    }}
                                    className="p-1 rounded bg-green-100 hover:bg-green-200 text-green-600"
                                    title="Add extension to all doors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleBulkRemoveExtensions(table.id);
                                    }}
                                    className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"
                                    title="Remove last extension from all doors"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                </div>
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
                                        doors: t.doors.map((door: any) => ({
                                          ...door,
                                          extensions:
                                            door.extensions?.map(
                                              (ext: any) => ({
                                                ...ext,
                                                model: product
                                                  ? product.id
                                                  : ext.model,
                                                price_type:
                                                  ext.price_type || "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : ext.price,
                                              }),
                                            ) || [],
                                        })),
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
                                        doors: t.doors.map((door: any) => {
                                          const updatedAccessories = [
                                            ...(door.accessories || []),
                                          ];
                                          const existingIndex =
                                            updatedAccessories.findIndex(
                                              (acc: any) =>
                                                acc.accessory_type === "cube",
                                            );

                                          if (existingIndex >= 0) {
                                            // Update existing accessory
                                            updatedAccessories[existingIndex] =
                                              {
                                                ...updatedAccessories[
                                                  existingIndex
                                                ],
                                                model: product
                                                  ? product.id
                                                  : "",
                                                price_type: "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
                                              };
                                          } else if (product) {
                                            // Create new accessory if it doesn't exist
                                            updatedAccessories.push({
                                              model: product.id,
                                              price_type: "",
                                              price:
                                                (product.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100,
                                              quantity: 0,
                                              accessory_type: "cube",
                                              name: "Кубик",
                                            });
                                          }

                                          return {
                                            ...door,
                                            accessories: updatedAccessories,
                                          };
                                        }),
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
                                        doors: t.doors.map((door: any) => {
                                          const updatedAccessories = [
                                            ...(door.accessories || []),
                                          ];
                                          const existingIndex =
                                            updatedAccessories.findIndex(
                                              (acc: any) =>
                                                acc.accessory_type === "leg",
                                            );

                                          if (existingIndex >= 0) {
                                            // Update existing accessory
                                            updatedAccessories[existingIndex] =
                                              {
                                                ...updatedAccessories[
                                                  existingIndex
                                                ],
                                                model: product
                                                  ? product.id
                                                  : "",
                                                price_type: "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
                                              };
                                          } else if (product) {
                                            // Create new accessory if it doesn't exist
                                            updatedAccessories.push({
                                              model: product.id,
                                              price_type: "",
                                              price:
                                                (product.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100,
                                              quantity: 0,
                                              accessory_type: "leg",
                                              name: "Ножка",
                                            });
                                          }

                                          return {
                                            ...door,
                                            accessories: updatedAccessories,
                                          };
                                        }),
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
                                        doors: t.doors.map((door: any) => {
                                          const updatedAccessories = [
                                            ...(door.accessories || []),
                                          ];
                                          const existingIndex =
                                            updatedAccessories.findIndex(
                                              (acc: any) =>
                                                acc.accessory_type === "glass",
                                            );

                                          if (existingIndex >= 0) {
                                            // Update existing accessory
                                            updatedAccessories[existingIndex] =
                                              {
                                                ...updatedAccessories[
                                                  existingIndex
                                                ],
                                                model: product
                                                  ? product.id
                                                  : "",
                                                price_type: "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
                                              };
                                          } else if (product) {
                                            // Create new accessory if it doesn't exist
                                            updatedAccessories.push({
                                              model: product.id,
                                              price_type: "",
                                              price:
                                                (product.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100,
                                              quantity: 0,
                                              accessory_type: "glass",
                                              name: "Стекло",
                                            });
                                          }

                                          return {
                                            ...door,
                                            accessories: updatedAccessories,
                                          };
                                        }),
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
                                        doors: t.doors.map((door: any) => {
                                          const updatedAccessories = [
                                            ...(door.accessories || []),
                                          ];
                                          const existingIndex =
                                            updatedAccessories.findIndex(
                                              (acc: any) =>
                                                acc.accessory_type === "lock",
                                            );

                                          if (existingIndex >= 0) {
                                            // Update existing accessory
                                            updatedAccessories[existingIndex] =
                                              {
                                                ...updatedAccessories[
                                                  existingIndex
                                                ],
                                                model: product
                                                  ? product.id
                                                  : "",
                                                price_type: "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
                                              };
                                          } else if (product) {
                                            // Create new accessory if it doesn't exist
                                            updatedAccessories.push({
                                              model: product.id,
                                              price_type: "",
                                              price:
                                                (product.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100,
                                              quantity: 0,
                                              accessory_type: "lock",
                                              name: "Замок",
                                            });
                                          }

                                          return {
                                            ...door,
                                            accessories: updatedAccessories,
                                          };
                                        }),
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
                                        doors: t.doors.map((door: any) => {
                                          const updatedAccessories = [
                                            ...(door.accessories || []),
                                          ];
                                          const existingIndex =
                                            updatedAccessories.findIndex(
                                              (acc: any) =>
                                                acc.accessory_type === "topsa",
                                            );

                                          if (existingIndex >= 0) {
                                            // Update existing accessory
                                            updatedAccessories[existingIndex] =
                                              {
                                                ...updatedAccessories[
                                                  existingIndex
                                                ],
                                                model: product
                                                  ? product.id
                                                  : "",
                                                price_type: "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
                                              };
                                          } else if (product) {
                                            // Create new accessory if it doesn't exist
                                            updatedAccessories.push({
                                              model: product.id,
                                              price_type: "",
                                              price:
                                                (product.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100,
                                              quantity: 0,
                                              accessory_type: "topsa",
                                              name: "Топса",
                                            });
                                          }

                                          return {
                                            ...door,
                                            accessories: updatedAccessories,
                                          };
                                        }),
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
                                        doors: t.doors.map((door: any) => {
                                          const updatedAccessories = [
                                            ...(door.accessories || []),
                                          ];
                                          const existingIndex =
                                            updatedAccessories.findIndex(
                                              (acc: any) =>
                                                acc.accessory_type ===
                                                "beading",
                                            );

                                          if (existingIndex >= 0) {
                                            // Update existing accessory
                                            updatedAccessories[existingIndex] =
                                              {
                                                ...updatedAccessories[
                                                  existingIndex
                                                ],
                                                model: product
                                                  ? product.id
                                                  : "",
                                                price_type: "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
                                              };
                                          } else if (product) {
                                            // Create new accessory if it doesn't exist
                                            updatedAccessories.push({
                                              model: product.id,
                                              price_type: "",
                                              price:
                                                (product.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100,
                                              quantity: 0,
                                              accessory_type: "beading",
                                              name: "Шпингалет",
                                            });
                                          }

                                          return {
                                            ...door,
                                            accessories: updatedAccessories,
                                          };
                                        }),
                                      };
                                    }
                                    return t;
                                  });
                                  setTables(updatedTables);
                                }}
                              />
                            </div>
                          </TableHead>
                        </>
                      )}

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

                        {doorType === "STEEL" ? (
                          // Steel door fields
                          <>
                            {/* Door Name */}
                            <TableCell className="align-middle">
                              <div>
                                <Input
                                  type="text"
                                  value={door.door_name || ""}
                                  onChange={(e) => {
                                    handleFieldChange(
                                      index,
                                      table.id,
                                      "door_name",
                                      e.target.value,
                                    );
                                    if (e.target.value.trim() !== "") {
                                      clearFieldError(`door_name_${index}`);
                                    }
                                  }}
                                  placeholder="Название двери"
                                  className={`w-32 ${validationErrors[`door_name_${index}`] ? "border-red-500 border-2" : ""}`}
                                />
                                {validationErrors[`door_name_${index}`] && (
                                  <p className="text-red-500 text-xs mt-1">
                                    Название двери обязательно
                                  </p>
                                )}
                              </div>
                            </TableCell>

                            {/* Steel Color */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.steel_color || ""}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "steel_color",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Цвет стали" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.steelColorOptions?.map(
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

                            {/* Crown/Casing Multiselect */}
                            <TableCell className="align-middle">
                              <MultiSelect
                                options={[
                                  { value: "Корона", label: "Корона" },
                                  { value: "Наличник", label: "Наличник" },
                                  { value: "Жок", label: "Жок" },
                                ]}
                                value={door.crown_casing || []}
                                onChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "crown_casing",
                                    value,
                                  )
                                }
                                placeholder="Корона/Наличник"
                                className="w-32"
                              />
                            </TableCell>

                            {/* Frame */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.frame || ""}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "frame",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Коробка" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.frameOptions?.map(
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

                            {/* Cladding */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.cladding || ""}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "cladding",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Обшивка" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.claddingOptions?.map(
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

                            {/* Lock */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.lock || ""}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "lock",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Замок" />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldOptions.lockOptions?.map(
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

                            {/* Peephole */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.peephole || "Жок"}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "peephole",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Бар">Бар</SelectItem>
                                  <SelectItem value="Жок">Жок</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            {/* Opening Side */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.opening_side || "Правый"}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "opening_side",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Правый">Правый</SelectItem>
                                  <SelectItem value="Левый">Левый</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            {/* Promog */}
                            <TableCell className="align-middle">
                              <Select
                                value={door.promog || "Бар"}
                                onValueChange={(value) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "promog",
                                    value,
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Бар">Бар</SelectItem>
                                  <SelectItem value="Жок">Жок</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </>
                        ) : (
                          // Wood door fields
                          <>
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
                                    placeholder={t(
                                      "placeholders.select_threshold",
                                    )}
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
                            {/* Casings - Always editable */}
                            <TableCell className="align-top p-2">
                              <div className="space-y-1">
                                {(() => {
                                  // Ensure we always have at least 2 default casings to display
                                  const casingsToShow =
                                    door.casings && door.casings.length > 0
                                      ? door.casings
                                      : [
                                          {
                                            model: table.selectedCasingProduct
                                              ? table.selectedCasingProduct.id
                                              : "",
                                            price_type: "",
                                            price: table.selectedCasingProduct
                                              ? (table.selectedCasingProduct.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100
                                              : 0,
                                            quantity: 0,
                                            casing_type: "боковой",
                                            casing_formula: casingFormula
                                              ? "formula1"
                                              : "formula2",
                                            casing_range: "",
                                            height: 0,
                                            width: 0,
                                          },
                                          {
                                            model: table.selectedCasingProduct
                                              ? table.selectedCasingProduct.id
                                              : "",
                                            price_type: "",
                                            price: table.selectedCasingProduct
                                              ? (table.selectedCasingProduct.salePrices?.find(
                                                  (p: any) =>
                                                    p.priceType.name ===
                                                    "Цена продажи",
                                                )?.value || 0) / 100
                                              : 0,
                                            quantity: 0,
                                            casing_type: "прямой",
                                            casing_formula: casingFormula
                                              ? "formula1"
                                              : "formula2",
                                            casing_range: "",
                                            height: 0,
                                            width: 0,
                                          },
                                        ];

                                  return casingsToShow.map(
                                    (casing: any, casIndex: number) => (
                                      <div
                                        key={casIndex}
                                        className="bg-green-50 p-2 rounded border space-y-1"
                                      >
                                        <div className="grid grid-cols-4 gap-1">
                                          <div>
                                            {casIndex === 0 && (
                                              <label className="text-xs text-gray-600">
                                                Высота
                                              </label>
                                            )}
                                            <Input
                                              type="text"
                                              inputMode="decimal"
                                              value={
                                                casing.height?.toString() || "0"
                                              }
                                              onChange={(e) => {
                                                const updatedCasings =
                                                  door.casings &&
                                                  door.casings.length > 0
                                                    ? [...door.casings]
                                                    : casingsToShow.map(
                                                        (c: any) => ({ ...c }),
                                                      );
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
                                              placeholder="Высота"
                                            />
                                          </div>
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
                                                casing.quantity?.toString() ||
                                                "0"
                                              }
                                              onChange={(e) => {
                                                const updatedCasings =
                                                  door.casings &&
                                                  door.casings.length > 0
                                                    ? [...door.casings]
                                                    : casingsToShow.map(
                                                        (c: any) => ({ ...c }),
                                                      );
                                                updatedCasings[casIndex] = {
                                                  ...updatedCasings[casIndex],
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
                                          {!casingFormula && (
                                            <div>
                                              {casIndex === 0 && (
                                                <label className="text-xs text-gray-600 bg-yellow-100 px-1 rounded">
                                                  Диапазон
                                                </label>
                                              )}
                                              <Select
                                                value={
                                                  casing.casing_range || ""
                                                }
                                                onValueChange={(value) => {
                                                  const updatedCasings =
                                                    door.casings &&
                                                    door.casings.length > 0
                                                      ? [...door.casings]
                                                      : casingsToShow.map(
                                                          (c: any) => ({
                                                            ...c,
                                                          }),
                                                        );
                                                  const updatedCasing = {
                                                    ...updatedCasings[casIndex],
                                                    casing_range: value,
                                                  };
                                                  const originalModel =
                                                    updatedCasing.model; // Preserve the original model
                                                  const recalculatedCasing =
                                                    calculateCasingDimensions(
                                                      updatedCasing,
                                                      door,
                                                      fieldOptions,
                                                      casingSize,
                                                      casingFormula,
                                                    );
                                                  // Ensure the model is preserved after recalculation
                                                  updatedCasings[casIndex] = {
                                                    ...recalculatedCasing,
                                                    model: originalModel,
                                                  };
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
                                                        {option.label}
                                                      </SelectItem>
                                                    ),
                                                  )}
                                                </SelectContent>
                                              </Select>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ),
                                  );
                                })()}
                              </div>
                            </TableCell>
                            {/* Crowns - Always editable */}
                            <TableCell className="align-top p-2">
                              <div className="space-y-1">
                                {(() => {
                                  // Ensure we always have at least 1 default crown to display
                                  const crownsToShow =
                                    door.crowns && door.crowns.length > 0
                                      ? door.crowns
                                      : [
                                          {
                                            model: "",
                                            price_type: "",
                                            price: 0,
                                            quantity: 0,
                                            width: 0,
                                          },
                                        ];

                                  return crownsToShow.map(
                                    (crown: any, crownIndex: number) => (
                                      <div
                                        key={crownIndex}
                                        className="bg-purple-50 p-2 rounded border space-y-1"
                                      >
                                        <div className="grid grid-cols-2 gap-1">
                                          <div>
                                            {crownIndex === 0 && (
                                              <label className="text-xs text-gray-600">
                                                Ширина
                                              </label>
                                            )}
                                            <Input
                                              type="text"
                                              inputMode="decimal"
                                              value={
                                                crown.width?.toString() || "0"
                                              }
                                              onChange={(e) => {
                                                const updatedCrowns =
                                                  door.crowns &&
                                                  door.crowns.length > 0
                                                    ? [...door.crowns]
                                                    : crownsToShow.map(
                                                        (c: any) => ({ ...c }),
                                                      );
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

                                          <div>
                                            {crownIndex === 0 && (
                                              <label className="text-xs text-gray-600">
                                                Кол-во
                                              </label>
                                            )}
                                            <Input
                                              type="text"
                                              inputMode="decimal"
                                              value={
                                                crown.quantity?.toString() ||
                                                "0"
                                              }
                                              onChange={(e) => {
                                                const updatedCrowns =
                                                  door.crowns &&
                                                  door.crowns.length > 0
                                                    ? [...door.crowns]
                                                    : crownsToShow.map(
                                                        (c: any) => ({ ...c }),
                                                      );
                                                updatedCrowns[crownIndex] = {
                                                  ...updatedCrowns[crownIndex],
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
                                        </div>
                                      </div>
                                    ),
                                  );
                                })()}
                              </div>
                            </TableCell>

                            {/* Extensions */}
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
                                              extension.quantity?.toString() ||
                                              ""
                                            }
                                            onChange={(e) => {
                                              const updatedExtensions = [
                                                ...door.extensions,
                                              ];
                                              updatedExtensions[extIndex] = {
                                                ...updatedExtensions[extIndex],
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
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            </TableCell>

                            {/* Кубик */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories
                                    ?.find(
                                      (acc: any) =>
                                        acc.accessory_type === "cube",
                                    )
                                    ?.quantity?.toString() || ""
                                }
                                onChange={(e) => {
                                  const updatedAccessories =
                                    updateAccessoryByType(
                                      door.accessories,
                                      "cube",
                                      {
                                        model: table.selectedCubeProduct
                                          ? table.selectedCubeProduct.id
                                          : "",
                                        price_type: "",
                                        price: table.selectedCubeProduct
                                          ? (table.selectedCubeProduct.salePrices?.find(
                                              (p: any) =>
                                                p.priceType.name ===
                                                "Цена продажи",
                                            )?.value || 0) / 100
                                          : 0,
                                        quantity: parseInt(e.target.value) || 0,
                                        name: "Кубик",
                                      },
                                    );
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "accessories",
                                    updatedAccessories,
                                  );
                                }}
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Ножка */}
                            <TableCell className="align-middle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories
                                    ?.find(
                                      (acc: any) =>
                                        acc.accessory_type === "leg",
                                    )
                                    ?.quantity?.toString() || ""
                                }
                                onChange={(e) => {
                                  const updatedAccessories =
                                    updateAccessoryByType(
                                      door.accessories,
                                      "leg",
                                      {
                                        model: table.selectedLegProduct
                                          ? table.selectedLegProduct.id
                                          : "",
                                        price_type: "",
                                        price: table.selectedLegProduct
                                          ? (table.selectedLegProduct.salePrices?.find(
                                              (p: any) =>
                                                p.priceType.name ===
                                                "Цена продажи",
                                            )?.value || 0) / 100
                                          : 0,
                                        quantity: parseInt(e.target.value) || 0,
                                        name: "Ножка",
                                      },
                                    );
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "accessories",
                                    updatedAccessories,
                                  );
                                }}
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Стекло */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories
                                    ?.find(
                                      (acc: any) =>
                                        acc.accessory_type === "glass",
                                    )
                                    ?.quantity?.toString() || ""
                                }
                                onChange={(e) => {
                                  const updatedAccessories =
                                    updateAccessoryByType(
                                      door.accessories,
                                      "glass",
                                      {
                                        model: table.selectedGlassProduct
                                          ? table.selectedGlassProduct.id
                                          : "",
                                        price_type: "",
                                        price: table.selectedGlassProduct
                                          ? (table.selectedGlassProduct.salePrices?.find(
                                              (p: any) =>
                                                p.priceType.name ===
                                                "Цена продажи",
                                            )?.value || 0) / 100
                                          : 0,
                                        quantity: parseInt(e.target.value) || 0,
                                        name: "Стекло",
                                      },
                                    );
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "accessories",
                                    updatedAccessories,
                                  );
                                }}
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Замок */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories
                                    ?.find(
                                      (acc: any) =>
                                        acc.accessory_type === "lock",
                                    )
                                    ?.quantity?.toString() || ""
                                }
                                onChange={(e) => {
                                  const updatedAccessories =
                                    updateAccessoryByType(
                                      door.accessories,
                                      "lock",
                                      {
                                        model: table.selectedLockProduct
                                          ? table.selectedLockProduct.id
                                          : "",
                                        price_type: "",
                                        price: table.selectedLockProduct
                                          ? (table.selectedLockProduct.salePrices?.find(
                                              (p: any) =>
                                                p.priceType.name ===
                                                "Цена продажи",
                                            )?.value || 0) / 100
                                          : 0,
                                        quantity: parseInt(e.target.value) || 0,
                                        name: "Замок",
                                      },
                                    );
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "accessories",
                                    updatedAccessories,
                                  );
                                }}
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Топса */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories
                                    ?.find(
                                      (acc: any) =>
                                        acc.accessory_type === "topsa",
                                    )
                                    ?.quantity?.toString() || ""
                                }
                                onChange={(e) => {
                                  const updatedAccessories =
                                    updateAccessoryByType(
                                      door.accessories,
                                      "topsa",
                                      {
                                        model: table.selectedTopsaProduct
                                          ? table.selectedTopsaProduct.id
                                          : "",
                                        price_type: "",
                                        price: table.selectedTopsaProduct
                                          ? (table.selectedTopsaProduct.salePrices?.find(
                                              (p: any) =>
                                                p.priceType.name ===
                                                "Цена продажи",
                                            )?.value || 0) / 100
                                          : 0,
                                        quantity: parseInt(e.target.value) || 0,
                                        name: "Топса",
                                      },
                                    );
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "accessories",
                                    updatedAccessories,
                                  );
                                }}
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Шпингалет */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories
                                    ?.find(
                                      (acc: any) =>
                                        acc.accessory_type === "beading",
                                    )
                                    ?.quantity?.toString() || ""
                                }
                                onChange={(e) => {
                                  const updatedAccessories =
                                    updateAccessoryByType(
                                      door.accessories,
                                      "beading",
                                      {
                                        model: table.selectedBeadingProduct
                                          ? table.selectedBeadingProduct.id
                                          : "",
                                        price_type: "",
                                        price: table.selectedBeadingProduct
                                          ? (table.selectedBeadingProduct.salePrices?.find(
                                              (p: any) =>
                                                p.priceType.name ===
                                                "Цена продажи",
                                            )?.value || 0) / 100
                                          : 0,
                                        quantity: parseInt(e.target.value) || 0,
                                        name: "Шпингалет",
                                      },
                                    );
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "accessories",
                                    updatedAccessories,
                                  );
                                }}
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>
                          </>
                        )}

                        {/* Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleRemoveDoor(index, table.id)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {tableCurrentDoors.length === 0 && (
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

              {/* {tableCurrentDoors.length === 0 && (
                <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-amber-700 font-medium">
                    {t("forms.add_at_least_one_door")}
                  </p>
                </div>
              )} */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={() => {
                    handleAddNewRow(table.id);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                  disabled={!table.doorModel && !table.isComponentOnlyTable}
                >
                  <Plus className="h-5 w-5" />
                  {table.isComponentOnlyTable
                    ? t("forms.add_component_row") || "Add Component Row"
                    : t("forms.add_row")}
                </Button>
                {tables.length > 1 && (
                  <Button
                    onClick={() => {
                      handleRemoveTable(table.id);
                    }}
                    variant="destructive"
                    size="lg"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-5 w-5" />
                    {t("forms.remove_table")}
                  </Button>
                )}
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

  // Memoize search trigger to prevent unnecessary API calls
  const searchTrigger = useMemo(() => {
    return {
      value: value.trim(),
      selectedProductName: selectedProduct?.name || null,
    };
  }, [value, selectedProduct?.name]);

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
      const searchValue = searchTrigger.value;

      if (searchValue.length < 2) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // Don't search if the current value exactly matches the selected product name
      if (
        searchTrigger.selectedProductName &&
        searchValue === searchTrigger.selectedProductName
      ) {
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
          `products?search=${encodeURIComponent(searchValue)}`,
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
    if (searchTrigger.value.length >= 2) {
      setIsLoading(true);
    }

    searchTimeoutRef.current = setTimeout(searchProducts, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTrigger]);

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
  agreementAmountInput,
  setAgreementAmountInput,
  orderData,
  onSendToMoySklad,
  isSendingToMoySklad,
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
                      {formatCurrency(totals.door_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.extensions_subtotal")}</span>
                    <span className="text-black">
                      {formatCurrency(totals.extension_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.casings_subtotal")}</span>
                    <span className="text-black">
                      {formatCurrency(totals.casing_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.crowns_subtotal")}</span>
                    <span className="text-black">
                      {formatCurrency(totals.crown_price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.accessories_subtotal")}</span>
                    <span className="text-black">
                      {formatCurrency(totals.accessory_price)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">{t("forms.subtotal")}</span>
                    <span className="font-bold text-black">
                      {formatCurrency(totals.total_sum)}
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
                          {formatCurrency(parseFloat(door.price || 0))}
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
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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

                <div className="grid grid-cols-2 gap-4">
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
                        {/* <span className="text-xs text-gray-500 mt-1 block">
                          {t("forms.discount_amount")}
                        </span> */}
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
                        {/* <span className="text-xs text-gray-500 mt-1 block text-center">
                          %
                        </span> */}
                      </div>
                    </div>
                    {/* {(discountPercentage > 0 || discountAmount > 0) && (
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
                    )} */}
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
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("forms.subtotal")}</span>
                  <span className="font-semibold text-black">
                    {formatCurrency(totals.total_sum)}
                  </span>
                </div>
                {/* Base Discount */}
                {discountPercentage > 0 && (
                  <div className="flex justify-between text-black-600">
                    <span>
                      {t("forms.discount")} ({discountPercentage || 0}%)
                    </span>
                    <span className="text-black">
                      {formatCurrency(
                        (totals.total_sum * (discountPercentage || 0)) / 100,
                      )}
                    </span>
                  </div>
                )}

                {/* Agreement Amount */}
                {agreementAmountInput > 0 && (
                  <div className="flex justify-between text-black-600">
                    <span>{t("forms.agreement")}</span>
                    <span className="text-black">
                      {formatCurrency(agreementAmountInput)}
                    </span>
                  </div>
                )}

                {/* Total Discount - only show if there's any discount */}
                {(discountPercentage > 0 || agreementAmountInput > 0) && (
                  <div className="flex justify-between text-black-700 font-semibold border-t pt-2">
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
                      {formatCurrency(totals.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-black-600">
                  <span>{t("forms.advance_payment")}</span>
                  <span className="text-black">
                    {formatCurrency(advancePayment)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-black-600">
                  <span>{t("forms.remaining_balance")}</span>
                  <span className="text-black">
                    {formatCurrency(totals.remainingBalance)}
                  </span>
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
                    : t("common.update_order")}
                </Button>

                <Button
                  onClick={onSendToMoySklad}
                  disabled={
                    isSendingToMoySklad ||
                    orderData?.order_status === "moy_sklad"
                  }
                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSendingToMoySklad ? (
                    <>
                      <Send className="h-5 w-5 mr-2 animate-spin" />
                      {t("common.sending")}...
                    </>
                  ) : orderData?.order_status === "moy_sklad" ? (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      {t("common.sent_to_moy_sklad")}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      {t("common.send_to_moy_sklad")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
