import { useNavigate, useSearchParams } from "react-router-dom";
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
import { useGetPriceSettings } from "../api/priceSettings";
import { useGetSteelColors } from "../api/steelColor";
import { useGetFrames } from "../api/frame";
import { useGetCladdings } from "../api/cladding";
import { useGetLocks } from "../api/lock";
import { useState, useEffect, useMemo, useRef } from "react";
import React from "react";
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
// Removed createProductSelectHandler import as we no longer use price type selects
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
  // Edit,
  // X,
} from "lucide-react";
import api from "../api/api";
import { useAutoSave, useOrderDraftRecovery } from "../hooks/useAutoSave";
import { useGetZamershiks } from "../api/staff";
import { MultiSelect } from "../helpers/MultiSelect";

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

// Helper function to convert string with comma to number
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

// Helper function to convert numeric fields from empty strings to 0
const convertNumericFields = (obj: any) => {
  const numericFields = ["height", "width", "price", "quantity"];
  const converted = { ...obj };

  numericFields.forEach((field) => {
    if (
      converted[field] === "" ||
      converted[field] === null ||
      converted[field] === undefined
    ) {
      converted[field] = 0;
    } else if (typeof converted[field] === "string") {
      const num = convertToNumber(converted[field], 0);
      converted[field] = num;
    }
  });

  return converted;
};

// Price type mapping for different product types
const getPriceTypeByProduct = (
  productName: string,
  priceSettings: { product: string; price_type: string }[] = [],
): string => {
  // Defensive check to ensure priceSettings is an array
  if (!Array.isArray(priceSettings)) {
    console.warn("priceSettings is not an array:", priceSettings);
    return "0f4d57e2-f0b0-11ee-0a80-16ce00046acd";
  }

  // Find the price setting for this product
  const priceSetting = priceSettings.find(
    (setting) => setting.product === productName.toLowerCase(),
  );

  // Return the price_type from the setting, or a default value
  return priceSetting?.price_type || "0f4d57e2-f0b0-11ee-0a80-16ce00046acd";
};

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mutate: createOrder, isPending: isLoading } = useCreateOrder();
  const { mutate: calculateOrder, isPending: isCalculating } =
    useCalculateOrder();
  const [doors, setDoors] = useState<any[]>([]);
  const [searchParams] = useSearchParams();
  const doorTypeFromUrl = searchParams.get("door_type") as
    | "WOOD"
    | "STEEL"
    | null;
  const [doorType, setDoorType] = useState<"WOOD" | "STEEL">(
    doorTypeFromUrl || "WOOD",
  );
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
  const [hasCheckedForDraft, setHasCheckedForDraft] = useState(false);
  const recoveryProcessed = useRef(false);
  const orderForm = useForm();
  const [discountAmountInput, setDiscountAmountInput] = useState<number>(0);
  const [agreementAmountInput, setAgreementAmountInput] = useState<number>(0);

  // Auto-save functionality
  const { getOrderDraft, clearAllDrafts, hasDraftData, STORAGE_KEYS } =
    useOrderDraftRecovery();
  const orderFormData = orderForm.watch();

  // Fetch attribute settings for casing and crown sizes
  const { data: attributeSettings } = useGetAttributeSettings();
  const attributeSettingsArray = Array.isArray(attributeSettings)
    ? attributeSettings
    : attributeSettings?.results || [];
  const casingSize = attributeSettingsArray[0]?.casing_size || 6; // Default fallback
  const crownSize = attributeSettingsArray[0]?.crown_size || 10; // Default fallback
  const casingFormula = attributeSettingsArray[0]?.casing_formula ?? true; // Default to true (Formula 1)

  // Auto-save order form data and doors (will be filtered in the hook based on hasCheckedForDraft)
  useAutoSave(orderFormData, STORAGE_KEYS.ORDER_DRAFT);
  useAutoSave(doors, STORAGE_KEYS.DOORS_DRAFT);

  // Recovery effect - only run once on mount
  useEffect(() => {
    if (recoveryProcessed.current || hasCheckedForDraft) return;

    recoveryProcessed.current = true;
    setHasCheckedForDraft(true);

    if (hasDraftData()) {
      const { orderData, doorsData } = getOrderDraft();

      // Show recovery dialog
      const shouldRecover = window.confirm(t("forms.recover_draft_data"));

      if (shouldRecover) {
        if (orderData && typeof orderData === "object") {
          Object.keys(orderData).forEach((key) => {
            if (
              orderData[key] !== undefined &&
              orderData[key] !== null &&
              orderData[key] !== ""
            ) {
              orderForm.setValue(key, orderData[key]);
            }
          });
        }
        if (doorsData && Array.isArray(doorsData) && doorsData.length > 0) {
          setDoors(doorsData);
        }
        toast.success(t("forms.draft_recovered"));
      } else {
        clearAllDrafts();
        // Set default value for beading_additional
        orderForm.setValue("beading_additional", null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const { discount_percentage, advance_payment } = orderForm.watch();

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
  const { data: thresholds } = useGetThresholds();
  const { data: zamershiks } = useGetZamershiks();
  const { data: casingRanges } = useGetCasingRanges();
  const { data: priceSettings } = useGetPriceSettings();
  const { data: steelColors } = useGetSteelColors();
  const { data: frames } = useGetFrames();
  const { data: claddings } = useGetCladdings();
  const { data: locks } = useGetLocks();

  // Debug logging for priceSettings
  console.log("priceSettings raw data:", priceSettings);
  console.log("priceSettings type:", typeof priceSettings);
  console.log("priceSettings is array:", Array.isArray(priceSettings));
  const productsList = useMemo(
    () => (Array.isArray(products) ? products : products?.results || []),
    [products],
  );
  const priceSettingsList = useMemo(() => {
    if (!priceSettings) return [];
    if (Array.isArray(priceSettings)) return priceSettings;
    if (
      typeof priceSettings === "object" &&
      "results" in priceSettings &&
      Array.isArray((priceSettings as any).results)
    )
      return (priceSettings as any).results;

    console.warn("Unexpected priceSettings format:", priceSettings);
    return [];
  }, [priceSettings]);

  // --- Format Options for Selects ---
  const fieldOptions = {
    rateOptions: formatReferenceOptions(currencies),
    branchOptions: formatReferenceOptions(branches),
    storeOptions: formatReferenceOptions(stores),
    projectOptions: formatReferenceOptions(projects),
    agentOptions: formatReferenceOptions(counterparties),
    organizationOptions: formatReferenceOptions(organizations),
    salesChannelOptions: formatReferenceOptions(salesChannels),
    sellerOptions: formatReferenceOptions((sellers as any)?.results || sellers),
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
    steelColorOptions: formatReferenceOptions(steelColors),
    frameOptions: formatReferenceOptions(frames),
    claddingOptions: formatReferenceOptions(claddings),
    lockOptions: formatReferenceOptions(locks),
  };

  // Debug log to check if casingRanges data is being received
  console.log("Casing Ranges Data:", casingRanges);
  console.log(
    "Formatted Casing Range Options:",
    fieldOptions.casingRangeOptions,
  );
  console.log("Final priceSettingsList:", priceSettingsList);

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
      name: "extra_comment",
      label: t("forms.extra_comment"),
      type: "textarea",
      placeholder: t("placeholders.enter_extra_comment"),
    },
  ];

  // --- API-based Calculation Function ---
  const handleCalculateOrder = () => {
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
      doors: doors.map((door: any) => {
        const doorModel = getProductById(productsList, door.model);

        if (doorType === "STEEL") {
          // Steel door structure - no extensions, casings, crowns, accessories
          return {
            ...door,
            model: doorModel,
            price_type: doorModel
              ? getPriceTypeByProduct(
                  doorModel.name || "door",
                  priceSettingsList,
                )
              : getPriceTypeByProduct("door", priceSettingsList),
          };
        }

        // Wood door structure (existing)
        return {
          ...door,
          model: doorModel,
          price_type: doorModel
            ? getPriceTypeByProduct(doorModel.name || "door", priceSettingsList)
            : getPriceTypeByProduct("door", priceSettingsList),
          extensions:
            door.extensions
              ?.map((ext: any) => {
                const model = getProductById(productsList, ext.model);
                return convertNumericFields({
                  ...ext,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "extension",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("extension", priceSettingsList),
                });
              })
              .filter(
                (ext: any) =>
                  ext.quantity > 0 &&
                  ext.model &&
                  (ext.model.id ||
                    (typeof ext.model === "string" && ext.model !== "")),
              ) || [],
          casings:
            door.casings
              ?.map((casing: any) => {
                const model = getProductById(productsList, casing.model);
                return convertNumericFields({
                  ...casing,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "casing",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("casing", priceSettingsList),
                });
              })
              .filter(
                (casing: any) =>
                  casing.quantity > 0 &&
                  casing.model &&
                  (casing.model.id ||
                    (typeof casing.model === "string" && casing.model !== "")),
              ) || [],
          crowns:
            door.crowns
              ?.map((crown: any) => {
                const model = getProductById(productsList, crown.model);
                return convertNumericFields({
                  ...crown,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "crown",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("crown", priceSettingsList),
                });
              })
              .filter(
                (crown: any) =>
                  crown.quantity > 0 &&
                  crown.model &&
                  (crown.model.id ||
                    (typeof crown.model === "string" && crown.model !== "")),
              ) || [],
          accessories:
            door.accessories
              ?.map((acc: any) => {
                const model = getProductById(productsList, acc.model);
                return convertNumericFields({
                  ...acc,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "lock",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("lock", priceSettingsList),
                });
              })
              .filter(
                (acc: any) =>
                  acc.quantity > 0 &&
                  acc.model &&
                  (acc.model.id ||
                    (typeof acc.model === "string" && acc.model !== "")),
              ) || [],
        };
      }),
    };

    calculateOrder(calculationData, {
      onSuccess: (response) => {
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

        const accs = doors.map((door: any) => {
          return (
            door.accessories?.map((acc: any) => {
              return {
                ...acc,
                model: getProductById(productsList, acc.model),
              };
            }) || []
          );
        });
        console.log("door accs", accs);
        const discount = convertToNumber(discount_percentage, 0);
        const advance = convertToNumber(advance_payment, 0);

        // Calculate total discount amount (base discount + agreement amount)
        const baseDiscountAmount = (response.total_sum * discount) / 100;
        const currentAgreementAmount = agreementAmountInput || 0;
        const totalDiscountAmount = baseDiscountAmount + currentAgreementAmount;

        // Always use the calculated total discount amount
        const discountAmount = totalDiscountAmount;
        const finalAmount = response.total_sum - discountAmount;
        const remainingBalance = finalAmount - advance;

        setTotals({
          ...response,
          discountAmount: discountAmount,
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
    const { total_sum, discountAmount, remainingBalance } = totals;

    // Note: Extensions, casings, crowns, and accessories without models or with quantity 0 are automatically filtered out

    //  const discount = convertToNumber(discount_percentage, 0);
    const orderData = {
      ...data,
      // Set created_at to current date and time (ISO string)
      created_at: new Date().toISOString(),
      // Add door_type at order level
      door_type: doorType,
      // Map IDs to full meta objects for the API
      // rate: getMetaById(currencies, data.rate),
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
      // Hydrate door data with full product info and add price_type
      doors: doors.map((door: any) => {
        const doorModel = getProductById(productsList, door.model);

        if (doorType === "STEEL") {
          // Steel door structure - no extensions, casings, crowns, accessories
          return convertNumericFields({
            ...door,
            model: doorModel,
            price_type: doorModel
              ? getPriceTypeByProduct(
                  doorModel.name || "door",
                  priceSettingsList,
                )
              : getPriceTypeByProduct("door", priceSettingsList),
          });
        }

        // Wood door structure (existing)
        return convertNumericFields({
          ...door,
          model: doorModel,
          price_type: doorModel
            ? getPriceTypeByProduct(doorModel.name || "door", priceSettingsList)
            : getPriceTypeByProduct("door", priceSettingsList),
          extensions:
            door.extensions
              ?.map((ext: any) => {
                const model = getProductById(productsList, ext.model);
                return convertNumericFields({
                  ...ext,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "extension",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("extension", priceSettingsList),
                });
              })
              .filter(
                (ext: any) =>
                  ext.quantity > 0 &&
                  ext.model &&
                  (ext.model.id ||
                    (typeof ext.model === "string" && ext.model !== "")),
              ) || [],
          casings:
            door.casings
              ?.map((casing: any) => {
                const model = getProductById(productsList, casing.model);
                return convertNumericFields({
                  ...casing,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "casing",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("casing", priceSettingsList),
                });
              })
              .filter(
                (casing: any) =>
                  casing.quantity > 0 &&
                  casing.model &&
                  (casing.model.id ||
                    (typeof casing.model === "string" && casing.model !== "")),
              ) || [],
          crowns:
            door.crowns
              ?.map((crown: any) => {
                const model = getProductById(productsList, crown.model);
                return convertNumericFields({
                  ...crown,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "crown",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("crown", priceSettingsList),
                });
              })
              .filter(
                (crown: any) =>
                  crown.quantity > 0 &&
                  crown.model &&
                  (crown.model.id ||
                    (typeof crown.model === "string" && crown.model !== "")),
              ) || [],
          accessories:
            door.accessories
              ?.map((acc: any) => {
                const model = getProductById(productsList, acc.model);
                return convertNumericFields({
                  ...acc,
                  model,
                  price_type: model
                    ? getPriceTypeByProduct(
                        model.name || "lock",
                        priceSettingsList,
                      )
                    : getPriceTypeByProduct("lock", priceSettingsList),
                });
              })
              .filter(
                (acc: any) =>
                  acc.quantity > 0 &&
                  acc.model &&
                  (acc.model.id ||
                    (typeof acc.model === "string" && acc.model !== "")),
              ) || [],
        });
      }),

      // Add calculated totals
      total_amount: total_sum.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      // discount_percentage:Number(discount_percentage.toFixed(2)),
      remaining_balance: remainingBalance.toFixed(2),
      agreement_amount: agreementAmountInput.toFixed(2),
      beading_additional: data.beading_additional,
      discount_percentage: convertToNumber(data.discount_percentage, 0),
    };

    createOrder(orderData, {
      onSuccess: () => {
        clearAllDrafts(); // Clear saved draft data on successful submission
        toast.success(t("messages.order_created_successfully"));
        navigate("/orders");
      },
      onError: (e: any) => {
        console.error("Error creating order:", e.response?.data);
        toast.error(t("messages.error_creating_order"));
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div>
        {/* Header */}
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

        {/* All Steps Combined in One Page */}
        <div className="space-y-8">
          {/* Step 1: Order Information */}
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
            casingFormula={casingFormula}
            doorType={doorType}
            setDoorType={setDoorType}
          />

          {/* Step 3: Summary and Submit */}
          {currentUser?.role !== "MANUFACTURE" && (
            <StepThree
              orderForm={orderForm}
              doors={doors}
              totals={totals}
              isLoading={isLoading}
              isCalculating={isCalculating}
              onSubmit={onSubmit}
              onCalculate={handleCalculateOrder}
              discount_percentage={discount_percentage}
              advance_payment={advance_payment}
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
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full overflow-visible">
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
            <CardContent className="space-y-6 overflow-visible">
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
                gridClassName="md:grid-cols-2 gap-6"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side - Material Attributes (50%) */}
        <div className="flex-1">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur h-full overflow-visible">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                {t("forms.material_attributes")}
              </CardTitle>
              {/* <p className="text-gray-600 mt-2">
                {t("forms.material_attributes_description")} -{" "}
                {t("forms.applies_to_all_doors")}
              </p> */}
            </CardHeader>
            <CardContent className="space-y-6 overflow-visible">
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
  casingFormula,
  doorType,
  
}: any) {
  const { t } = useTranslation();

  // Function to create a default door with empty values
  const createDefaultDoor = (
    orderData: any = {},
    doorType: "WOOD" | "STEEL" = "WOOD",
  ) => {
    if (doorType === "STEEL") {
      // Steel door structure
      return {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        height: 0,
        width: 0,
        door_name: "", // Text input for door name
        steel_color: "", // From steel colors endpoint
        crown_casing: [], // Multiselect: ["Корона", "Наличник", "Жак"]
        frame: "", // Коробка - from frames endpoint
        cladding: "", // Обшивка - from claddings endpoint
        lock: "", // Замок - from locks endpoint
        peephole: "Жок", // Глазок: Бар/Жок
        opening_side: "Правый", // Правый/Левый
        promog: "Бар", // Промок: Бар/Жок
      };
    }

    // Wood door structure (existing)
    const defaultExtensions = [
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        height: 0,
        width: 0,
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        height: 0,
        width: 0,
      },
    ];

    const defaultCasings = [
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 1,
        casing_type: "боковой",
        casing_formula: casingFormula ? "formula1" : "formula2",
        casing_range: "",
        height: 0,
        width: casingSize || 0,
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        casing_type: "прямой",
        casing_formula: casingFormula ? "formula1" : "formula2",
        casing_range: "",
        height: 0,
        width: casingSize || 0,
      },
    ];

    const defaultCrowns = [
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        height: 0,
        width: crownSize || 0,
      },
    ];

    const defaultAccessories = [
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        accessory_type: "cube",
        name: "Кубик",
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        accessory_type: "leg",
        name: "Ножка",
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        accessory_type: "glass",
        name: "Стекло",
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        accessory_type: "lock",
        name: "Замок",
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        accessory_type: "topsa",
        name: "Топса",
      },
      {
        model: "",
        price_type: "",
        price: 0,
        quantity: 0,
        accessory_type: "beading",
        name: "Шпингалет",
      },
    ];

    return {
      model: "",
      price_type: "",
      price: 0,
      quantity: 0,
      height: 0,
      width: 0,
      material: orderData.material || "",
      material_type: orderData.material_type || "",
      massif: orderData.massif || "",
      color: orderData.color || "",
      patina_color: orderData.patina_color || "",
      beading_main: orderData.beading_main || "",
      beading_additional: orderData.beading_additional || null,
      glass_type: "",
      threshold: "",
      paska_orin: [],
      extensions: defaultExtensions,
      casings: defaultCasings,
      crowns: defaultCrowns,
      accessories: defaultAccessories,
    };
  };

  // Tables state - each table has its own door model and doors array
  const [tables, setTables] = useState([
    {
      id: 1,
      doorModel: null as any,
      // Removed doorPriceType from table state
      doorSearch: "",
      doors:
        doorType === "WOOD" ? [createDefaultDoor({}, doorType)] : ([] as any[]),
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
    },
  ]);

  // Removed activeTableId as we no longer need it

  // Removed price type states as we no longer use individual price selects

  // Remove currentTable and currentDoors as we're displaying all tables

  // Sync doors with parent component
  useEffect(() => {
    // Flatten all doors from all tables
    const allDoors = tables.flatMap((table) => table.doors);
    setDoors(allDoors);
  }, [tables]);

  // Initialize tables with existing doors or ensure default row
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

  // Ensure at least one default row on component mount and when doorType changes
  useEffect(() => {
    const orderData = orderForm.getValues();
    setTables((prevTables: any[]) =>
      prevTables.map((table: any) => ({
        ...table,
        doors:
          table.doors.length === 0
            ? [createDefaultDoor(orderData, doorType)]
            : table.doors,
      })),
    );
  }, [doorType]);

  // Add new table functionality
  const handleAddNewTable = () => {
    const newTableId = Math.max(...tables.map((t) => t.id)) + 1;
    const orderData = orderForm.getValues();
    const newTable = {
      id: newTableId,
      doorModel: null as any,
      doorSearch: "",
      doors: [createDefaultDoor(orderData, doorType)],
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

    // For steel doors, create a simpler structure
    if (doorType === "STEEL") {
      const newDoor = {
        door_type: "STEEL",
        model: defaultDoorModel,
        price_type: "",
        price: defaultDoorPrice,
        quantity: 0,
        height: 0,
        width: 0,
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
          : "",
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
          : "",
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
      beading_additional: orderData.beading_additional || null,
      glass_type: "",
      threshold: "",
      paska_orin: [],
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
          beading_additional: beading_additional || null,
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

  // Effect to update door type when doorType changes
  useEffect(() => {
    if (tables.length > 0) {
      const updatedTables = tables.map((table) => {
        // Update door type for existing doors
        let updatedDoors = table.doors.map((door: any) => ({
          ...door,
          door_type: doorType,
        }));

        // For WOOD type doors, ensure at least one door exists even without door model
        if (doorType === "WOOD" && updatedDoors.length === 0) {
          const orderData = orderForm.getValues();
          updatedDoors = [createDefaultDoor(orderData, doorType)];
        }

        return {
          ...table,
          doors: updatedDoors,
        };
      });
      setTables(updatedTables);
    }
  }, [doorType]);

  const handleRemoveDoor = (index: number, tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const filteredDoors = table.doors.filter(
          (_: any, i: number) => i !== index,
        );
        // Ensure at least one row always remains - if all doors would be removed, add a default one
        const finalDoors =
          filteredDoors.length === 0
            ? [createDefaultDoor(orderForm.getValues(), doorType)]
            : filteredDoors;

        return {
          ...table,
          doors: finalDoors,
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

  // Functions to add new items
  const addNewCasing = (doorIndex: number, tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedDoors = [...table.doors];
        const door = updatedDoors[doorIndex];

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
          casing_type: "боковой",
          casing_formula: casingFormula ? "formula1" : "formula2",
          casing_range: "",
          height: 0,
          width: casingSize,
        };

        updatedDoors[doorIndex] = {
          ...door,
          casings: [...(door.casings || []), newCasing],
        };

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  const addNewExtension = (doorIndex: number, tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedDoors = [...table.doors];
        const door = updatedDoors[doorIndex];

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

        updatedDoors[doorIndex] = {
          ...door,
          extensions: [...(door.extensions || []), newExtension],
        };

        return { ...table, doors: updatedDoors };
      }
      return table;
    });
    setTables(updatedTables);
  };

  const addNewCrown = (doorIndex: number, tableId: number) => {
    const updatedTables = tables.map((table) => {
      if (table.id === tableId) {
        const updatedDoors = [...table.doors];
        const door = updatedDoors[doorIndex];

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
          width: convertToNumber(door.width, 0) + crownSize,
        };

        updatedDoors[doorIndex] = {
          ...door,
          crowns: [...(door.crowns || []), newCrown],
        };

        return { ...table, doors: updatedDoors };
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

    const doorWidth = convertToNumber(doorData.width, 0);
    const doorHeight = convertToNumber(doorData.height, 0);

    // Auto-calculate height based on formula
    if (!casingFormula && casing.casing_range) {
      // Formula 2: Use casing ranges
      const selectedRange = fieldOptions.casingRangeOptions?.find(
        (range: any) => range.value === String(casing.casing_range),
      );
      if (selectedRange && selectedRange.casing_size !== undefined) {
        casing.height = selectedRange.casing_size;
      }
    } else {
      // Formula 1: Calculate based on door dimensions
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
      {/* Door Type Selector */}
      <div className="flex items-center justify-end">
    

        {/* Add New Table Button */}
        <Button
          // variant="outline"
          size="sm"
          onClick={handleAddNewTable}
          className="h-8 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 "
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
                <div className="flex items-center gap-4 flex-1">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DoorOpen className="h-6 w-6 text-green-600" />
                    </div>
                  </CardTitle>

                  <div className="flex items-center gap-2">
                    <div className="w-80">
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
                              // Calculate door price from product
                              const doorPrice = product
                                ? (product.salePrices?.find(
                                    (p: any) =>
                                      p.priceType.name === "Цена продажи",
                                  )?.value || 0) / 100
                                : 0;

                              // If this table was empty and we're selecting a model, add one row automatically
                              const shouldAddRow =
                                t.doors.length === 0 && product;

                              let newDoors = t.doors;
                              if (shouldAddRow) {
                                const orderData = orderForm.getValues();

                                // Create 2 default extensions (dobors) - with selected product if available, otherwise empty entries
                                const defaultExtensions = [
                                  {
                                    model: t.selectedExtensionProduct
                                      ? t.selectedExtensionProduct.id
                                      : "",
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
                                      : "",
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
                                    casing_formula: casingFormula
                                      ? "formula1"
                                      : "formula2",
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
                                    casing_formula: casingFormula
                                      ? "formula1"
                                      : "formula2",
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
                                        door_type: "STEEL",
                                        model: product.id,
                                        price_type: "",
                                        price: doorPrice,
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
                                        door_type: "WOOD",
                                        model: product.id,
                                        price_type: "",
                                        price: doorPrice,
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
                                          orderData.beading_additional || null,
                                        glass_type: "",
                                        threshold: "",
                                        paska_orin: [],
                                        extensions: defaultExtensions,
                                        casings: defaultCasings,
                                        crowns: defaultCrowns,
                                        accessories: defaultAccessories,
                                      };
                                newDoors = [newDoor];
                              } else {
                                // Update existing doors with new model and price
                                newDoors = t.doors.map((door: any) => ({
                                  ...door,
                                  model: product ? product.id : "",
                                  price: doorPrice,
                                }));
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
                    </div>
                  </div>
                </div>
              </div>
              {/* {!table.doorModel && (
                <p className="text-xs text-red-500 mt-2">
                  Выбирете модель двери
                </p>
              )} */}
            </CardHeader>
            <CardContent className="space-y-6">
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
                          <TableHead className="min-w-[200px]">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <span>{t("forms.casings")}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-100"
                                  onClick={() => {
                                    // Add new casing to all doors in this table
                                    tableCurrentDoors.forEach((_, index) => {
                                      addNewCasing(index, table.id);
                                    });
                                  }}
                                  title="Добавить новый наличник"
                                >
                                  <Plus className="h-3 w-3 text-green-600" />
                                </Button>
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
                                                  : "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
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
                              <div className="flex items-center justify-between gap-2">
                                <span>{t("forms.extensions")}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-blue-100"
                                  onClick={() => {
                                    // Add new extension to all doors in this table
                                    tableCurrentDoors.forEach((_, index) => {
                                      addNewExtension(index, table.id);
                                    });
                                  }}
                                  title="Добавить новое расширение"
                                >
                                  <Plus className="h-3 w-3 text-blue-600" />
                                </Button>
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
                                                  : "",
                                                price: product
                                                  ? (product.salePrices?.find(
                                                      (p: any) =>
                                                        p.priceType.name ===
                                                        "Цена продажи",
                                                    )?.value || 0) / 100
                                                  : 0,
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
                              <div className="flex items-center justify-between gap-2">
                                <span>{t("forms.crowns")}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-purple-100"
                                  onClick={() => {
                                    // Add new crown to all doors in this table
                                    tableCurrentDoors.forEach((_, index) => {
                                      addNewCrown(index, table.id);
                                    });
                                  }}
                                  title="Добавить новую корону"
                                >
                                  <Plus className="h-3 w-3 text-purple-600" />
                                </Button>
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
                                              model: product ? product.id : "",
                                              price: product
                                                ? (product.salePrices?.find(
                                                    (p: any) =>
                                                      p.priceType.name ===
                                                      "Цена продажи",
                                                  )?.value || 0) / 100
                                                : 0,
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
                            className="w-15"
                          />
                        </TableCell>

                        {doorType === "STEEL" ? (
                          // Steel door fields
                          <>
                            {/* Door Name */}
                            <TableCell className="align-middle">
                              <Input
                                type="text"
                                value={door.door_name || ""}
                                onChange={(e) =>
                                  handleFieldChange(
                                    index,
                                    table.id,
                                    "door_name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Название двери"
                                className="w-32"
                              />
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
                                  { value: "Жак", label: "Жак" },
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

                            {/*    - Always editable */}
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
                                placeholder="Паска орыны"
                                className="h-8"
                              />
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
                                      <div className="flex items-center justify-between gap-1">
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
                                                model:
                                                  table.selectedCasingProduct
                                                    ? table
                                                        .selectedCasingProduct
                                                        .id
                                                    : "",
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
                                            value={
                                              casing.height?.toString() || ""
                                            }
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
                                            disabled={!casingFormula}
                                          />
                                        </div>
                                        {/* Show formula info for reference */}
                                        {/* {casIndex === 0 && (
                                      <div className="text-xs text-gray-600 mb-1">
                                        {casingFormula ? "Formula 1 (Auto)" : "Formula 2 (Ranges)"}
                                      </div>
                                    )} */}
                                        {!casingFormula && (
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
                                        )}
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
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
                                              extension.quantity?.toString() ||
                                              ""
                                            }
                                            onChange={(e) => {
                                              const updatedExtensions = [
                                                ...door.extensions,
                                              ];
                                              updatedExtensions[extIndex] = {
                                                ...updatedExtensions[extIndex],
                                                model:
                                                  table.selectedExtensionProduct
                                                    ? table
                                                        .selectedExtensionProduct
                                                        .id
                                                    : "",
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
                                            value={
                                              crown.quantity?.toString() || ""
                                            }
                                            onChange={(e) => {
                                              const updatedCrowns = [
                                                ...door.crowns,
                                              ];
                                              updatedCrowns[crownIndex] = {
                                                ...updatedCrowns[crownIndex],
                                                model:
                                                  table.selectedCrownProduct
                                                    ? table.selectedCrownProduct
                                                        .id
                                                    : "",
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
                                            value={
                                              crown.width?.toString() || ""
                                            }
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
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories?.[0]?.quantity?.toString() ||
                                  ""
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
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Ножка - Always editable */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories?.[1]?.quantity?.toString() ||
                                  ""
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
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Стекло - Always editable */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories?.[2]?.quantity?.toString() ||
                                  ""
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
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Замок - Always editable */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories?.[3]?.quantity?.toString() ||
                                  ""
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
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Топса - Always editable */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories?.[4]?.quantity?.toString() ||
                                  ""
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
                                className="w-45"
                                placeholder="Кол-во"
                                min="0"
                              />
                            </TableCell>

                            {/* Шпингалет - Always editable */}
                            <TableCell className="align-midlle">
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={
                                  door.accessories?.[5]?.quantity?.toString() ||
                                  ""
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

              {/* Add Row and Remove Row Buttons - Bottom Right */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={() => {
                    handleAddNewRow(table.id);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-5 w-5" />
                  {t("forms.add_row")}
                </Button>
                {tables.length > 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTable(table.id)}
                    className="h-8 flex items-center gap-1 px-2 text-white bg-red-600 hover:bg-red-700"
                    title="Удалить всю таблицу"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="text-xs">Удалить</span>
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

function StepThree({
  orderForm,
  doors,
  totals,
  isLoading,
  isCalculating,
  onSubmit,
  onCalculate,
  discount_percentage,
  advance_payment,
  discountAmountInput,
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

  const advance = convertToNumber(advance_payment, 0);

  // Use API response data for price breakdown
  const priceBreakdown = {
    doors: totals.door_price || 0,
    extensions: totals.extension_price || 0,
    casings: totals.casing_price || 0,
    crowns: totals.crown_price || 0,
    accessories: totals.accessory_price || 0,
  };

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
                      {priceBreakdown.doors.toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.extensions_subtotal")}</span>
                    <span className="text-black">
                      {priceBreakdown.extensions.toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.casings_subtotal")}</span>
                    <span className="text-black">
                      {priceBreakdown.casings.toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.crowns_subtotal")}</span>
                    <span className="text-black">
                      {priceBreakdown.crowns.toFixed(0)} сум
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("forms.accessories_subtotal")}</span>
                    <span className="text-black">
                      {priceBreakdown.accessories.toFixed(0)} сум
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
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Discount and Payment Fields */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800">
                  {/* {t("forms.discount")} & {t("forms.advance_payment")} & */}
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
                          value={discountAmountInput || ""}
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
                            setDiscountAmountInput(amount);

                            // When total discount amount is changed manually, we need to calculate what the base discount percentage should be
                            // Total discount = base discount + agreement amount
                            // So: base discount = total discount - agreement amount
                            const currentAgreementAmount =
                              agreementAmountInput || 0;
                            const baseDiscountAmount = Math.max(
                              0,
                              amount - currentAgreementAmount,
                            );

                            // Calculate percentage based on base discount amount only
                            const percentage =
                              totals.total_sum > 0
                                ? (baseDiscountAmount / totals.total_sum) * 100
                                : 0;
                            orderForm.setValue(
                              "discount_percentage",
                              percentage.toFixed(2),
                            );
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                          {...orderForm.register("discount_percentage", {
                            onChange: (e: any) => {
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
                              const percentage = parseFloat(value) || 0;
                              // Calculate base discount amount from percentage
                              const baseDiscountAmount =
                                totals.total_sum * (percentage / 100);
                              // Add agreement amount to get total discount
                              const currentAgreementAmount =
                                agreementAmountInput || 0;
                              const totalDiscountAmount =
                                baseDiscountAmount + currentAgreementAmount;
                              setDiscountAmountInput(totalDiscountAmount);
                            },
                          })}
                        />
                        <span className="text-xs text-gray-500 mt-1 block text-center">
                          %
                        </span>
                      </div>
                    </div>
                    {(discount_percentage > 0 || discountAmountInput > 0) && (
                      <p className="text-sm text-black">
                        {t("forms.discount_amount")}:{" "}
                        {discountAmountInput > 0
                          ? discountAmountInput.toFixed(0)
                          : (
                              totals.total_sum *
                              (discount_percentage / 100)
                            ).toFixed(0)}{" "}
                        сум
                        {discount_percentage > 0 &&
                          ` (${discount_percentage}%)`}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...orderForm.register("advance_payment", {
                        onChange: (e: any) => {
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
                            e.target.value = cleanedValue;
                          }
                        },
                      })}
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
                          className="w-150 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              orderForm.getValues("discount_percentage"),
                              0,
                            );
                            const baseDiscountAmount =
                              (totals.total_sum * currentDiscountPercentage) /
                              100;

                            // Total discount = base discount + agreement amount
                            const totalDiscountAmount =
                              baseDiscountAmount + amount;

                            // Update only the total discount amount, keep the base percentage unchanged
                            setDiscountAmountInput(totalDiscountAmount);
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">
                          {t("forms.agreement_amount")}
                        </span>
                      </div>
                    </div>
                    {agreementAmountInput > 0 && (
                      <p className="text-sm text-black">
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
                  <span className="font-semibold text-black">
                    {totals.total_sum.toFixed(0)} сум
                  </span>
                </div>
                {/* Base Discount */}
                {discount_percentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      {t("forms.discount")} ({discount_percentage || 0}%)
                    </span>
                    <span className="text-black">
                      {(
                        (totals.total_sum * (discount_percentage || 0)) /
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

                {/* Total Discount - only show if there's any discount */}
                {(discount_percentage > 0 || agreementAmountInput > 0) && (
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
                    <span className="text-black">
                      {totals.discountAmount.toFixed(0)} сум
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-red-600">
                  <span>{t("forms.advance_payment")}</span>
                  <span className="text-black">{advance.toFixed(0)} сум</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-blue-600">
                  <span>{t("forms.remaining_balance")}</span>
                  <span className="text-black">
                    {totals.remainingBalance.toFixed(0)} сум
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button
                  onClick={orderForm.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="w-80 h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isLoading
                    ? `${t("common.creating")}...`
                    : t("common.create_order")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {}}
                  className="w-full hidden"
                >
                  {t("common.back_to_doors")}
                </Button>
                <Button
                  onClick={onCalculate}
                  disabled={isCalculating || doors.length === 0}
                  className="flex items-center h-12 w-80 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  // size="lg"
                >
                  <Calculator className="h-4 w-4" />
                  {isCalculating ? t("forms.calculating") : "Рассчитать"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
