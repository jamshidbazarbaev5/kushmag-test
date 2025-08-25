import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useCreateOrder, useCalculateOrder } from "../api/order";
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
import { useAutoSave, useOrderDraftRecovery } from "../hooks/useAutoSave";
import { useGetZamershiks } from "../api/staff";

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

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createOrder, isPending: isLoading } = useCreateOrder();
  const { mutate: calculateOrder, isPending: isCalculating } =
    useCalculateOrder();
  const [doors, setDoors] = useState<any[]>([]);
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
  const productsList = useMemo(
    () => (Array.isArray(products) ? products : products?.results || []),
    [products],
  );

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
      options: fieldOptions.sellerOptions,
      placeholder: t("placeholders.select_seller"),
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

  // Material attributes fields - set once for all doors
  const materialFields = [
    {
      name: "material",
      label: t("forms.material"),
      type: "searchable-select",
      options: fieldOptions.materialOptions,
      placeholder: t("placeholders.select_material"),
      required: true,
    },
    {
      name: "material_type",
      label: t("forms.material_type"),
      type: "searchable-select",
      options: fieldOptions.materialTypeOptions,
      placeholder: t("placeholders.select_material_type"),
      required: true,
    },
    {
      name: "massif",
      label: t("forms.massif"),
      type: "searchable-select",
      options: fieldOptions.massifOptions,
      placeholder: t("placeholders.select_massif"),
      required: true,
    },
    {
      name: "color",
      label: t("forms.color"),
      type: "searchable-select",
      options: fieldOptions.colorOptions,
      placeholder: t("placeholders.select_color"),
      required: true,
    },
    {
      name: "patina_color",
      label: t("forms.patina_color"),
      type: "searchable-select",
      options: fieldOptions.patinaColorOptions,
      placeholder: t("placeholders.select_patina_color"),
    },
    {
      name: "beading_main",
      label: t("forms.beading_main"),
      type: "searchable-select",
      options: fieldOptions.beadingMainOptions,
      placeholder: t("placeholders.select_beading_main"),
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

        const discount = convertToNumber(discount_percentage, 0);
        const advance = convertToNumber(advance_payment, 0);

        // Use the actual discount amount if it was set via amount input, otherwise calculate from percentage
        const discountAmount =
          discountAmountInput > 0
            ? discountAmountInput
            : (response.total_sum * discount) / 100;
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
    //  const discount = convertToNumber(discount_percentage, 0);
    const orderData = {
      ...data,
      // Set created_at to current date and time (ISO string)
      created_at: new Date().toISOString(),
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
      seller: getMetaById(sellers, data.seller),
      operator: getMetaById(operators, data.operator),
      branch: getMetaById(branches, data.branch),
      // Hydrate door data with full product info
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

      // Add calculated totals
      total_amount: total_sum.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      // discount_percentage:Number(discount_percentage.toFixed(2)),
      remaining_balance: remainingBalance.toFixed(2),
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
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("pages.create_order")}
              </h1>
              <p className="text-gray-600">
                {t("forms.create_order_description")}
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
          />

          {/* Step 3: Summary and Submit */}
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
          />
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
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
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
            gridClassName="md:grid-cols-2 lg:grid-cols-3 gap-6"
          />

          {/* Custom Counterparty Select Field */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          </div>

          {/* Material Attributes Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              {t("forms.material_attributes")} -{" "}
              {t("forms.applies_to_all_doors")}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t("forms.material_attributes_description")}
            </p>
            <ResourceForm
              fields={materialFields}
              onSubmit={() => {}}
              isSubmitting={isLoading}
              hideSubmitButton={true}
              form={orderForm}
              gridClassName="md:grid-cols-2 lg:grid-cols-3 gap-6"
            />
          </div>
        </CardContent>
      </Card>
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

  const handleAddNewRow = () => {
    // Get material attributes from the order form to apply to all doors
    const orderData = orderForm.getValues();

    const newDoor = {
      model: "",
      price_type: null,
      price: 0,
      quantity: 1,
      height: 0,
      width: 0,
      material: orderData.material || "",
      material_type: orderData.material_type || "",
      massif: orderData.massif || "",
      color: orderData.color || "",
      patina_color: orderData.patina_color || "",
      beading_main: orderData.beading_main || "",
      beading_additional: null,
      glass_type: "",
      threshold: "",
      extensions: [],
      casings: [],
      crowns: [],
      accessories: [],
    };

    const newIndex = doors.length;
    setDoors([...doors, newDoor]);
    setEditingIndex(newIndex);
    setEditingDoor({ ...newDoor });
  };

  // Effect to update all doors when material attributes change in order form
  const materialAttributes = orderForm.watch([
    "material",
    "material_type",
    "massif",
    "color",
    "patina_color",
    "beading_main",
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

      updatedDoors[editingIndex] = {
        ...editingDoor,
        price: convertToNumber(editingDoor.price, 0),
        quantity: parseInt(editingDoor.quantity || 1),
        height: convertToNumber(editingDoor.height, 0),
        width: convertToNumber(editingDoor.width, 0),
      };
      setDoors(updatedDoors);
      setEditingIndex(null);
      setEditingDoor(null);
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
  };

  const handleRemoveDoor = (index: number) => {
    setDoors(doors.filter((_: any, i: number) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingDoor(null);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
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
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur overflow-visible">
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
            <Button
              onClick={handleAddNewRow}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              {t("forms.add_row")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 overflow-visible">
          {/* Doors Table */}
          <div className="rounded-lg border overflow-visible">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">
                    {t("forms.model")}
                  </TableHead>
                  <TableHead>{t("forms.price_type")}</TableHead>
                  <TableHead>{t("forms.price")}</TableHead>
                  <TableHead>{t("forms.quantity")}</TableHead>
                  <TableHead>{t("forms.height")}</TableHead>
                  <TableHead>{t("forms.width")}</TableHead>
                  <TableHead>{t("forms.glass_type")}</TableHead>
                  <TableHead>{t("forms.threshold")}</TableHead>
                  <TableHead>{t("forms.extensions")}</TableHead>
                  <TableHead>{t("forms.casings")}</TableHead>
                  <TableHead>{t("forms.crowns")}</TableHead>
                  <TableHead>{t("forms.accessories")}</TableHead>
                  {/* <TableHead className="min-w-[120px]">
                    {t("forms.total")}
                  </TableHead> */}
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

                    {/* Model */}
                    <TableCell>
                      {editingIndex === index ? (
                        <DoorProductSelect
                          value={editingDoor?.model || ""}
                          onChange={(value) => {
                            console.log(
                              "Model onChange called with value:",
                              value,
                            );
                            // First update the model value
                            handleFieldChange("model", value);

                            // If model is cleared, also clear price and price_type
                            if (!value) {
                              console.log(
                                "Model cleared, clearing price_type and price",
                              );
                              handleFieldChange("price_type", null);
                              handleFieldChange("price", "");
                            }
                          }}
                          onProductSelect={(product) => {
                            console.log(
                              "Product selected in DoorProductSelect:",
                              product,
                            );
                            console.log(
                              "Product salePrices:",
                              product?.salePrices,
                            );

                            // Auto-set price when product is selected
                            if (
                              product &&
                              product.salePrices &&
                              product.salePrices.length > 0
                            ) {
                              console.log(
                                "Selected product has sale prices:",
                                product.salePrices,
                              );

                              if (product.salePrices.length === 1) {
                                // If only one price option, select it automatically
                                const priceTypeId =
                                  product.salePrices[0].priceType.id;
                                const priceValue =
                                  product.salePrices[0].value / 100;

                                console.log(
                                  `Setting single price type: ${priceTypeId}, value: ${priceValue}`,
                                );
                                handleFieldChange("price_type", priceTypeId);
                                handleFieldChange("price", priceValue);
                              } else {
                                // If multiple options, try to find a retail price first
                                const retailPrice = product.salePrices.find(
                                  (p: any) =>
                                    p.priceType.name
                                      ?.toLowerCase()
                                      .includes("retail") ||
                                    p.priceType.name
                                      ?.toLowerCase()
                                      .includes("sale") ||
                                    p.priceType.name
                                      ?.toLowerCase()
                                      .includes("Цена продажи"),
                                );

                                // If not found, try to find wholesale price
                                const wholesalePrice = product.salePrices.find(
                                  (p: any) =>
                                    p.priceType.name
                                      ?.toLowerCase()
                                      .includes("wholesale") ||
                                    p.priceType.name
                                      ?.toLowerCase()
                                      .includes("optom") ||
                                    p.priceType.name
                                      ?.toLowerCase()
                                      .includes("Цена оптом"),
                                );

                                // Use retail first, wholesale second, or first price as fallback
                                const selectedPrice =
                                  retailPrice ||
                                  wholesalePrice ||
                                  product.salePrices[0];
                                const priceTypeId = selectedPrice.priceType.id;
                                const priceValue = selectedPrice.value / 100;

                                console.log(
                                  `Setting multiple price type: ${priceTypeId}, value: ${priceValue}`,
                                );
                                handleFieldChange("price_type", priceTypeId);
                                handleFieldChange("price", priceValue);
                              }
                            } else {
                              console.log(
                                "No price data available for product",
                              );
                              handleFieldChange("price_type", null);
                              handleFieldChange("price", "");
                            }
                          }}
                          placeholder={t("placeholders.select_door_model")}
                          productsList={productsList}
                        />
                      ) : (
                        <div
                          className="truncate max-w-[200px]"
                          title={getProductName(door.model)}
                        >
                          {getProductName(door.model) ||
                            t("forms.select_model")}
                        </div>
                      )}
                    </TableCell>

                    {/* Price Type */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.price_type || undefined}
                          onValueChange={(value) => {
                            handleFieldChange("price_type", value);
                            // Auto-set price when price type is selected
                            if (editingDoor?.model) {
                              const product = productsList.find(
                                (p: any) => p.id === editingDoor.model,
                              );
                              if (product && product.salePrices) {
                                const selectedPrice = product.salePrices.find(
                                  (p: any) => p.priceType.id === value,
                                );
                                if (selectedPrice) {
                                  handleFieldChange(
                                    "price",
                                    selectedPrice.value / 100,
                                  );
                                }
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue
                              placeholder={t("placeholders.select_price_type")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              console.log("Price Type Select rendering:");
                              console.log("- editingDoor:", editingDoor);
                              console.log(
                                "- editingDoor?.model:",
                                editingDoor?.model,
                              );
                              console.log(
                                "- productsList length:",
                                productsList?.length,
                              );

                              if (!editingDoor?.model) {
                                console.log(
                                  "No model selected, showing no product message",
                                );
                                return (
                                  <SelectItem value="no_product" disabled>
                                    No product selected
                                  </SelectItem>
                                );
                              }

                              const product = productsList.find(
                                (p: any) => p.id === editingDoor.model,
                              );
                              console.log(
                                "Found product for model",
                                editingDoor.model,
                                ":",
                                product,
                              );
                              console.log(
                                "Product salePrices:",
                                product?.salePrices,
                              );

                              if (
                                !product ||
                                !product.salePrices ||
                                product.salePrices.length === 0
                              ) {
                                console.log(
                                  "No price types available for product",
                                );
                                return (
                                  <SelectItem value="no_prices" disabled>
                                    No price types available
                                  </SelectItem>
                                );
                              }

                              console.log(
                                "Rendering price types:",
                                product.salePrices.length,
                                "options",
                              );
                              return product.salePrices.map((p: any) => (
                                <SelectItem
                                  key={p.priceType.id}
                                  value={p.priceType.id}
                                >
                                  {p.priceType.name}{" "}
                                  {(p.value / 100).toFixed(2)}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {(() => {
                            if (!door.model || !door.price_type) return "-";
                            const product = productsList.find(
                              (p: any) => p.id === door.model,
                            );
                            const priceType =
                              product?.salePrices?.find(
                                (p: any) => p.priceType.id === door.price_type,
                              )?.priceType?.name || "-";
                            return priceType;
                          })()}
                        </span>
                      )}
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editingDoor?.price?.toString() || ""}
                          onChange={(e) =>
                            handleFieldChange("price", e.target.value)
                          }
                          className="w-20"
                        />
                      ) : (
                        <span>{parseFloat(door.price || 0).toFixed(2)}</span>
                      )}
                    </TableCell>

                    {/* Quantity */}
                    <TableCell>
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
                        <span>{door.quantity || 1}</span>
                      )}
                    </TableCell>

                    {/* Height */}
                    <TableCell>
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
                        <span>{door.height || 0}</span>
                      )}
                    </TableCell>

                    {/* Width */}
                    <TableCell>
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
                        <span>{door.width || 0}</span>
                      )}
                    </TableCell>

                    {/* Glass Type */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.glass_type || ""}
                          onValueChange={(value) =>
                            handleFieldChange("glass_type", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue
                              placeholder={t("placeholders.select_glass_type")}
                            />
                          </SelectTrigger>
                          <SelectContent>
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
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.glassTypeOptions?.find(
                            (opt: any) => opt.value === door.glass_type,
                          )?.label || "-"}
                        </span>
                      )}
                    </TableCell>

                    {/* Threshold */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.threshold || ""}
                          onValueChange={(value) =>
                            handleFieldChange("threshold", value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue
                              placeholder={t("placeholders.select_threshold")}
                            />
                          </SelectTrigger>
                          <SelectContent>
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
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.thresholdOptions?.find(
                            (opt: any) => opt.value === door.threshold,
                          )?.label || "-"}
                        </span>
                      )}
                    </TableCell>

                    {/* Extensions */}
                    <TableCell className="p-2 align-top">
                      {editingIndex === index ? (
                        <div className="space-y-2 min-w-[520px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs w-full"
                            onClick={() => {
                              const newExtension = {
                                model: "",
                                price_type: "",
                                price: 0,
                                quantity: 1,
                                height: 0,
                                width: 0,
                              };
                              handleFieldChange("extensions", [
                                ...(editingDoor?.extensions || []),
                                newExtension,
                              ]);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("forms.add_extension")} (
                            {editingDoor?.extensions?.length || 0})
                          </Button>

                          {/* Extensions List */}
                          {editingDoor?.extensions &&
                            editingDoor.extensions.length > 0 && (
                              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-visible relative">
                                {editingDoor.extensions.map(
                                  (extension: any, extIndex: number) => (
                                    <div
                                      key={extIndex}
                                      className="bg-blue-50 p-3 rounded border text-xs"
                                    >
                                      <div className="grid grid-cols-1 gap-2 mb-2">
                                        <div className="w-full">
                                          <DoorProductSelect
                                            value={extension.model || ""}
                                            onChange={(value) => {
                                              const updatedExtensions = [
                                                ...editingDoor.extensions,
                                              ];
                                              updatedExtensions[extIndex] = {
                                                ...updatedExtensions[extIndex],
                                                model: value,
                                              };
                                              handleFieldChange(
                                                "extensions",
                                                updatedExtensions,
                                              );
                                            }}
                                            onProductSelect={(product) => {
                                              if (
                                                product &&
                                                product.salePrices &&
                                                product.salePrices.length > 0
                                              ) {
                                                const price =
                                                  product.salePrices[0].value /
                                                  100;
                                                const updatedExtensions = [
                                                  ...editingDoor.extensions,
                                                ];
                                                updatedExtensions[extIndex] = {
                                                  ...updatedExtensions[
                                                    extIndex
                                                  ],
                                                  model: product.id,
                                                  price_type:
                                                    product.salePrices[0]
                                                      .priceType.id,
                                                  price: price,
                                                };
                                                handleFieldChange(
                                                  "extensions",
                                                  updatedExtensions,
                                                );
                                              }
                                            }}
                                            placeholder={t(
                                              "placeholders.select_extension_model",
                                            )}
                                            productsList={productsList}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Select
                                          value={
                                            extension.price_type
                                              ? String(extension.price_type)
                                              : undefined
                                          }
                                          onValueChange={(value) => {
                                            const updatedExtensions = [
                                              ...editingDoor.extensions,
                                            ];
                                            updatedExtensions[extIndex] = {
                                              ...updatedExtensions[extIndex],
                                              price_type: value,
                                            };
                                            // Auto-set price when price type is selected
                                            if (extension.model) {
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === extension.model,
                                              );
                                              if (
                                                product &&
                                                product.salePrices
                                              ) {
                                                const selectedPrice =
                                                  product.salePrices.find(
                                                    (p: any) =>
                                                      p.priceType.id === value,
                                                  );
                                                if (selectedPrice) {
                                                  updatedExtensions[extIndex] =
                                                    {
                                                      ...updatedExtensions[
                                                        extIndex
                                                      ],
                                                      price:
                                                        selectedPrice.value /
                                                        100,
                                                    };
                                                }
                                              }
                                            }
                                            handleFieldChange(
                                              "extensions",
                                              updatedExtensions,
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_price_type",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[999] fixed"
                                            position="popper"
                                            side="bottom"
                                            align="start"
                                            sideOffset={5}
                                            avoidCollisions={true}
                                          >
                                            {(() => {
                                              if (!extension.model) {
                                                return (
                                                  <SelectItem
                                                    value="no_product"
                                                    disabled
                                                  >
                                                    {t(
                                                      "forms.select_model_first",
                                                    )}
                                                  </SelectItem>
                                                );
                                              }
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === extension.model,
                                              );
                                              if (
                                                !product ||
                                                !product.salePrices ||
                                                product.salePrices.length === 0
                                              ) {
                                                return (
                                                  <SelectItem
                                                    value="no_prices"
                                                    disabled
                                                  >
                                                    {t("forms.no_price_types")}
                                                  </SelectItem>
                                                );
                                              }
                                              return product.salePrices.map(
                                                (salePrice: any) => (
                                                  <SelectItem
                                                    key={salePrice.priceType.id}
                                                    value={String(
                                                      salePrice.priceType.id,
                                                    )}
                                                  >
                                                    {salePrice.priceType.name} -{" "}
                                                    {(
                                                      salePrice.value / 100
                                                    ).toFixed(2)}{" "}
                                                    сум
                                                  </SelectItem>
                                                ),
                                              );
                                            })()}
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.price")}
                                          value={
                                            extension.price?.toString() || ""
                                          }
                                          onChange={(e) => {
                                            const updatedExtensions = [
                                              ...editingDoor.extensions,
                                            ];
                                            updatedExtensions[extIndex] = {
                                              ...updatedExtensions[extIndex],
                                              price: e.target.value,
                                            };
                                            handleFieldChange(
                                              "extensions",
                                              updatedExtensions,
                                            );
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 mb-2">
                                        <Input
                                          type="number"
                                          placeholder={t("forms.quantity")}
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
                                        />
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.height")}
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
                                        />
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.width")}
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
                                        />
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-blue-600">
                                          {t("forms.total")}:{" "}
                                          {(
                                            parseFloat(extension.price || 0) *
                                            parseInt(extension.quantity || 1)
                                          ).toFixed(2)}
                                        </span>
                                        <Button
                                          onClick={() => {
                                            const updatedExtensions =
                                              editingDoor.extensions.filter(
                                                (_: any, i: number) =>
                                                  i !== extIndex,
                                              );
                                            handleFieldChange(
                                              "extensions",
                                              updatedExtensions,
                                            );
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs">
                          {door.extensions?.length || 0} items
                        </span>
                      )}
                    </TableCell>

                    {/* Casings */}
                    <TableCell className="p-2 align-top">
                      {editingIndex === index ? (
                        <div className="space-y-2 min-w-[560px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs w-full"
                            onClick={() => {
                              const newCasing = {
                                model: "",
                                price_type: "",
                                price: 0,
                                quantity: 1,
                                casing_type: "",
                                casing_formula: "formula1",
                                casing_range: "",
                                height: 0,
                                width: casingSize,
                              };
                              handleFieldChange("casings", [
                                ...(editingDoor?.casings || []),
                                newCasing,
                              ]);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("forms.add_casing")} (
                            {editingDoor?.casings?.length || 0})
                          </Button>

                          {/* Casings List */}
                          {editingDoor?.casings &&
                            editingDoor.casings.length > 0 && (
                              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-visible">
                                {editingDoor.casings.map(
                                  (casing: any, casIndex: number) => (
                                    <div
                                      key={casIndex}
                                      className="bg-green-50 p-3 rounded border text-xs"
                                    >
                                      <div className="grid grid-cols-1 gap-2 mb-2">
                                        <div className="w-full">
                                          <DoorProductSelect
                                            value={casing.model || ""}
                                            onChange={(value) => {
                                              const updatedCasings = [
                                                ...editingDoor.casings,
                                              ];
                                              updatedCasings[casIndex] = {
                                                ...updatedCasings[casIndex],
                                                model: value,
                                              };
                                              handleFieldChange(
                                                "casings",
                                                updatedCasings,
                                              );
                                            }}
                                            onProductSelect={(product) => {
                                              if (
                                                product &&
                                                product.salePrices &&
                                                product.salePrices.length > 0
                                              ) {
                                                const price =
                                                  product.salePrices[0].value /
                                                  100;
                                                const updatedCasings = [
                                                  ...editingDoor.casings,
                                                ];
                                                updatedCasings[casIndex] = {
                                                  ...updatedCasings[casIndex],
                                                  model: product.id,
                                                  price_type:
                                                    product.salePrices[0]
                                                      .priceType.id,
                                                  price: price,
                                                };
                                                handleFieldChange(
                                                  "casings",
                                                  updatedCasings,
                                                );
                                              }
                                            }}
                                            placeholder={t(
                                              "placeholders.select_casing_model",
                                            )}
                                            productsList={productsList}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Select
                                          value={
                                            casing.price_type
                                              ? String(casing.price_type)
                                              : undefined
                                          }
                                          onValueChange={(value) => {
                                            const updatedCasings = [
                                              ...editingDoor.casings,
                                            ];
                                            updatedCasings[casIndex] = {
                                              ...updatedCasings[casIndex],
                                              price_type: value,
                                            };
                                            // Auto-set price when price type is selected
                                            if (casing.model) {
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === casing.model,
                                              );
                                              if (
                                                product &&
                                                product.salePrices
                                              ) {
                                                const selectedPrice =
                                                  product.salePrices.find(
                                                    (p: any) =>
                                                      p.priceType.id === value,
                                                  );
                                                if (selectedPrice) {
                                                  updatedCasings[casIndex] = {
                                                    ...updatedCasings[casIndex],
                                                    price:
                                                      selectedPrice.value / 100,
                                                  };
                                                }
                                              }
                                            }
                                            handleFieldChange(
                                              "casings",
                                              updatedCasings,
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_price_type",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[100]"
                                            position="popper"
                                            side="bottom"
                                            align="center"
                                            sideOffset={5}
                                            avoidCollisions={false}
                                            sticky="always"
                                          >
                                            {(() => {
                                              if (!casing.model) {
                                                return (
                                                  <SelectItem
                                                    value="no_product"
                                                    disabled
                                                  >
                                                    {t(
                                                      "forms.select_model_first",
                                                    )}
                                                  </SelectItem>
                                                );
                                              }
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === casing.model,
                                              );
                                              if (
                                                !product ||
                                                !product.salePrices ||
                                                product.salePrices.length === 0
                                              ) {
                                                return (
                                                  <SelectItem
                                                    value="no_prices"
                                                    disabled
                                                  >
                                                    {t("forms.no_price_types")}
                                                  </SelectItem>
                                                );
                                              }
                                              return product.salePrices.map(
                                                (salePrice: any) => (
                                                  <SelectItem
                                                    key={salePrice.priceType.id}
                                                    value={String(
                                                      salePrice.priceType.id,
                                                    )}
                                                  >
                                                    {salePrice.priceType.name} -{" "}
                                                    {(
                                                      salePrice.value / 100
                                                    ).toFixed(2)}{" "}
                                                    сум
                                                  </SelectItem>
                                                ),
                                              );
                                            })()}
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.price")}
                                          value={casing.price?.toString() || ""}
                                          onChange={(e) => {
                                            const updatedCasings = [
                                              ...editingDoor.casings,
                                            ];
                                            updatedCasings[casIndex] = {
                                              ...updatedCasings[casIndex],
                                              price: e.target.value,
                                            };
                                            handleFieldChange(
                                              "casings",
                                              updatedCasings,
                                            );
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Select
                                          value={casing.casing_type || ""}
                                          onValueChange={(value) => {
                                            const updatedCasings = [
                                              ...editingDoor.casings,
                                            ];
                                            const updatedCasing = {
                                              ...updatedCasings[casIndex],
                                              casing_type: value,
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
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_casing_type",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[100]"
                                            position="popper"
                                            side="bottom"
                                            align="start"
                                            sideOffset={5}
                                            avoidCollisions={true}
                                          >
                                            <SelectItem value="боковой">
                                              боковой
                                            </SelectItem>
                                            <SelectItem value="прямой">
                                              прямой
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
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
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_casing_formula",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[100]"
                                            position="popper"
                                            side="bottom"
                                            align="start"
                                            sideOffset={5}
                                            avoidCollisions={true}
                                          >
                                            <SelectItem value="formula1">
                                              Formula 1
                                            </SelectItem>
                                            <SelectItem value="formula2">
                                              Formula 2
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Input
                                          type="number"
                                          placeholder={t("forms.quantity")}
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
                                        />
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center">
                                          {t("forms.dimensions")}:{" "}
                                          {casing.height || 0} x{" "}
                                          {casing.width || 0}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-green-600">
                                          {t("forms.total")}:{" "}
                                          {(
                                            parseFloat(casing.price || 0) *
                                            parseInt(casing.quantity || 1)
                                          ).toFixed(2)}
                                        </span>
                                        <Button
                                          onClick={() => {
                                            const updatedCasings =
                                              editingDoor.casings.filter(
                                                (_: any, i: number) =>
                                                  i !== casIndex,
                                              );
                                            handleFieldChange(
                                              "casings",
                                              updatedCasings,
                                            );
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs">
                          {door.casings?.length || 0} items
                        </span>
                      )}
                    </TableCell>

                    {/* Crowns */}
                    <TableCell className="p-2 align-top">
                      {editingIndex === index ? (
                        <div className="space-y-2 min-w-[500px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs w-full"
                            onClick={() => {
                              const doorWidth = convertToNumber(
                                editingDoor?.width,
                                0,
                              );
                              const newCrown = {
                                model: "",
                                price: 0,
                                quantity: 1,
                                height: 0,
                                width: doorWidth + crownSize, // Auto-calculate crown width
                                price_type: "",
                              };
                              handleFieldChange("crowns", [
                                ...(editingDoor?.crowns || []),
                                newCrown,
                              ]);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("forms.add_crown")} (
                            {editingDoor?.crowns?.length || 0})
                          </Button>

                          {/* Crowns List */}
                          {editingDoor?.crowns &&
                            editingDoor.crowns.length > 0 && (
                              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-visible">
                                {editingDoor.crowns.map(
                                  (crown: any, crownIndex: number) => (
                                    <div
                                      key={crownIndex}
                                      className="bg-purple-50 p-3 rounded border text-xs"
                                    >
                                      <div className="grid grid-cols-1 gap-2 mb-2">
                                        <div className="w-full">
                                          <DoorProductSelect
                                            value={crown.model || ""}
                                            onChange={(value) => {
                                              const updatedCrowns = [
                                                ...editingDoor.crowns,
                                              ];
                                              updatedCrowns[crownIndex] = {
                                                ...updatedCrowns[crownIndex],
                                                model: value,
                                              };
                                              handleFieldChange(
                                                "crowns",
                                                updatedCrowns,
                                              );
                                            }}
                                            onProductSelect={(product) => {
                                              if (
                                                product &&
                                                product.salePrices &&
                                                product.salePrices.length > 0
                                              ) {
                                                const price =
                                                  product.salePrices[0].value /
                                                  100;
                                                const updatedCrowns = [
                                                  ...editingDoor.crowns,
                                                ];
                                                updatedCrowns[crownIndex] = {
                                                  ...updatedCrowns[crownIndex],
                                                  model: product.id,
                                                  price_type:
                                                    product.salePrices[0]
                                                      .priceType.id,
                                                  price: price,
                                                };
                                                handleFieldChange(
                                                  "crowns",
                                                  updatedCrowns,
                                                );
                                              }
                                            }}
                                            placeholder={t(
                                              "placeholders.select_crown_model",
                                            )}
                                            productsList={productsList}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Select
                                          value={
                                            crown.price_type
                                              ? String(crown.price_type)
                                              : undefined
                                          }
                                          onValueChange={(value) => {
                                            const updatedCrowns = [
                                              ...editingDoor.crowns,
                                            ];
                                            updatedCrowns[crownIndex] = {
                                              ...updatedCrowns[crownIndex],
                                              price_type: value,
                                            };
                                            // Auto-set price when price type is selected
                                            if (crown.model) {
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === crown.model,
                                              );
                                              if (
                                                product &&
                                                product.salePrices
                                              ) {
                                                const selectedPrice =
                                                  product.salePrices.find(
                                                    (p: any) =>
                                                      p.priceType.id === value,
                                                  );
                                                if (selectedPrice) {
                                                  updatedCrowns[crownIndex] = {
                                                    ...updatedCrowns[
                                                      crownIndex
                                                    ],
                                                    price:
                                                      selectedPrice.value / 100,
                                                  };
                                                }
                                              }
                                            }
                                            handleFieldChange(
                                              "crowns",
                                              updatedCrowns,
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_price_type",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[100]"
                                            position="popper"
                                            side="bottom"
                                            align="start"
                                            sideOffset={5}
                                            avoidCollisions={true}
                                          >
                                            {(() => {
                                              if (!crown.model) {
                                                return (
                                                  <SelectItem
                                                    value="no_product"
                                                    disabled
                                                  >
                                                    {t(
                                                      "forms.select_model_first",
                                                    )}
                                                  </SelectItem>
                                                );
                                              }
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === crown.model,
                                              );
                                              if (
                                                !product ||
                                                !product.salePrices ||
                                                product.salePrices.length === 0
                                              ) {
                                                return (
                                                  <SelectItem
                                                    value="no_prices"
                                                    disabled
                                                  >
                                                    {t("forms.no_price_types")}
                                                  </SelectItem>
                                                );
                                              }
                                              return product.salePrices.map(
                                                (salePrice: any) => (
                                                  <SelectItem
                                                    key={salePrice.priceType.id}
                                                    value={String(
                                                      salePrice.priceType.id,
                                                    )}
                                                  >
                                                    {salePrice.priceType.name} -{" "}
                                                    {(
                                                      salePrice.value / 100
                                                    ).toFixed(2)}{" "}
                                                    сум
                                                  </SelectItem>
                                                ),
                                              );
                                            })()}
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.price")}
                                          value={crown.price?.toString() || ""}
                                          onChange={(e) => {
                                            const updatedCrowns = [
                                              ...editingDoor.crowns,
                                            ];
                                            updatedCrowns[crownIndex] = {
                                              ...updatedCrowns[crownIndex],
                                              price: e.target.value,
                                            };
                                            handleFieldChange(
                                              "crowns",
                                              updatedCrowns,
                                            );
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 mb-2">
                                        <Input
                                          type="number"
                                          placeholder={t("forms.quantity")}
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
                                          className="h-8"
                                        />
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.height")}
                                          value={crown.height?.toString() || ""}
                                          onChange={(e) => {
                                            const updatedCrowns = [
                                              ...editingDoor.crowns,
                                            ];
                                            updatedCrowns[crownIndex] = {
                                              ...updatedCrowns[crownIndex],
                                              height: e.target.value,
                                            };
                                            handleFieldChange(
                                              "crowns",
                                              updatedCrowns,
                                            );
                                          }}
                                          className="h-8"
                                        />
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.width")}
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
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-purple-600">
                                          {t("forms.total")}:{" "}
                                          {(
                                            parseFloat(crown.price || 0) *
                                            parseInt(crown.quantity || 1)
                                          ).toFixed(2)}
                                        </span>
                                        <Button
                                          onClick={() => {
                                            const updatedCrowns =
                                              editingDoor.crowns.filter(
                                                (_: any, i: number) =>
                                                  i !== crownIndex,
                                              );
                                            handleFieldChange(
                                              "crowns",
                                              updatedCrowns,
                                            );
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs">
                          {door.crowns?.length || 0} items
                        </span>
                      )}
                    </TableCell>

                    {/* Accessories */}
                    <TableCell className="p-2 align-top">
                      {editingIndex === index ? (
                        <div className="space-y-2 min-w-[420px]">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs w-full"
                            onClick={() => {
                              const newAccessory = {
                                model: "",
                                price_type: "",
                                price: 0,
                                quantity: 1,
                                accessory_type: "",
                              };
                              handleFieldChange("accessories", [
                                ...(editingDoor?.accessories || []),
                                newAccessory,
                              ]);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("forms.add_accessory")} (
                            {editingDoor?.accessories?.length || 0})
                          </Button>

                          {/* Accessories List */}
                          {editingDoor?.accessories &&
                            editingDoor.accessories.length > 0 && (
                              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-visible">
                                {editingDoor.accessories.map(
                                  (accessory: any, accIndex: number) => (
                                    <div
                                      key={accIndex}
                                      className="bg-orange-50 p-3 rounded border text-xs"
                                    >
                                      <div className="grid grid-cols-1 gap-2 mb-2">
                                        <div className="w-full">
                                          <DoorProductSelect
                                            value={accessory.model || ""}
                                            onChange={(value) => {
                                              const updatedAccessories = [
                                                ...editingDoor.accessories,
                                              ];
                                              updatedAccessories[accIndex] = {
                                                ...updatedAccessories[accIndex],
                                                model: value,
                                              };
                                              handleFieldChange(
                                                "accessories",
                                                updatedAccessories,
                                              );
                                            }}
                                            onProductSelect={(product) => {
                                              if (
                                                product &&
                                                product.salePrices &&
                                                product.salePrices.length > 0
                                              ) {
                                                const price =
                                                  product.salePrices[0].value /
                                                  100;
                                                const updatedAccessories = [
                                                  ...editingDoor.accessories,
                                                ];
                                                updatedAccessories[accIndex] = {
                                                  ...updatedAccessories[
                                                    accIndex
                                                  ],
                                                  model: product.id,
                                                  price_type:
                                                    product.salePrices[0]
                                                      .priceType.id,
                                                  price: price,
                                                };
                                                handleFieldChange(
                                                  "accessories",
                                                  updatedAccessories,
                                                );
                                              }
                                            }}
                                            placeholder={t(
                                              "placeholders.select_accessory_model",
                                            )}
                                            productsList={productsList}
                                          />
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Select
                                          value={
                                            accessory.price_type
                                              ? String(accessory.price_type)
                                              : undefined
                                          }
                                          onValueChange={(value) => {
                                            const updatedAccessories = [
                                              ...editingDoor.accessories,
                                            ];
                                            updatedAccessories[accIndex] = {
                                              ...updatedAccessories[accIndex],
                                              price_type: value,
                                            };
                                            // Auto-set price when price type is selected
                                            if (accessory.model) {
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === accessory.model,
                                              );
                                              if (
                                                product &&
                                                product.salePrices
                                              ) {
                                                const selectedPrice =
                                                  product.salePrices.find(
                                                    (p: any) =>
                                                      p.priceType.id === value,
                                                  );
                                                if (selectedPrice) {
                                                  updatedAccessories[accIndex] =
                                                    {
                                                      ...updatedAccessories[
                                                        accIndex
                                                      ],
                                                      price:
                                                        selectedPrice.value /
                                                        100,
                                                    };
                                                }
                                              }
                                            }
                                            handleFieldChange(
                                              "accessories",
                                              updatedAccessories,
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_price_type",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[100]"
                                            position="popper"
                                            side="bottom"
                                            align="start"
                                            sideOffset={5}
                                            avoidCollisions={true}
                                          >
                                            {(() => {
                                              if (!accessory.model) {
                                                return (
                                                  <SelectItem
                                                    value="no_product"
                                                    disabled
                                                  >
                                                    {t(
                                                      "forms.select_model_first",
                                                    )}
                                                  </SelectItem>
                                                );
                                              }
                                              const product = productsList.find(
                                                (p: any) =>
                                                  p.id === accessory.model,
                                              );
                                              if (
                                                !product ||
                                                !product.salePrices ||
                                                product.salePrices.length === 0
                                              ) {
                                                return (
                                                  <SelectItem
                                                    value="no_prices"
                                                    disabled
                                                  >
                                                    {t("forms.no_price_types")}
                                                  </SelectItem>
                                                );
                                              }
                                              return product.salePrices.map(
                                                (salePrice: any) => (
                                                  <SelectItem
                                                    key={salePrice.priceType.id}
                                                    value={String(
                                                      salePrice.priceType.id,
                                                    )}
                                                  >
                                                    {salePrice.priceType.name} -{" "}
                                                    {(
                                                      salePrice.value / 100
                                                    ).toFixed(2)}{" "}
                                                    сум
                                                  </SelectItem>
                                                ),
                                              );
                                            })()}
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder={t("forms.price")}
                                          value={
                                            accessory.price?.toString() || ""
                                          }
                                          onChange={(e) => {
                                            const updatedAccessories = [
                                              ...editingDoor.accessories,
                                            ];
                                            updatedAccessories[accIndex] = {
                                              ...updatedAccessories[accIndex],
                                              price: e.target.value,
                                            };
                                            handleFieldChange(
                                              "accessories",
                                              updatedAccessories,
                                            );
                                          }}
                                          className="h-8"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mb-2">
                                        <Input
                                          type="number"
                                          placeholder={t("forms.quantity")}
                                          value={accessory.quantity || ""}
                                          onChange={(e) => {
                                            const updatedAccessories = [
                                              ...editingDoor.accessories,
                                            ];
                                            updatedAccessories[accIndex] = {
                                              ...updatedAccessories[accIndex],
                                              quantity: e.target.value,
                                            };
                                            handleFieldChange(
                                              "accessories",
                                              updatedAccessories,
                                            );
                                          }}
                                          className="h-8"
                                        />
                                        <Select
                                          value={accessory.accessory_type || ""}
                                          onValueChange={(value) => {
                                            const updatedAccessories = [
                                              ...editingDoor.accessories,
                                            ];
                                            updatedAccessories[accIndex] = {
                                              ...updatedAccessories[accIndex],
                                              accessory_type: value,
                                            };
                                            handleFieldChange(
                                              "accessories",
                                              updatedAccessories,
                                            );
                                          }}
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue
                                              placeholder={t(
                                                "placeholders.select_accessory_type",
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent
                                            className="z-[100]"
                                            position="popper"
                                            side="bottom"
                                            align="start"
                                            sideOffset={5}
                                            avoidCollisions={true}
                                          >
                                            <SelectItem value="handle">
                                              Handle
                                            </SelectItem>
                                            <SelectItem value="lock">
                                              Lock
                                            </SelectItem>
                                            <SelectItem value="hinge">
                                              Hinge
                                            </SelectItem>
                                            <SelectItem value="other">
                                              Other
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium text-orange-600">
                                          {t("forms.total")}:{" "}
                                          {(
                                            parseFloat(accessory.price || 0) *
                                            parseInt(accessory.quantity || 1)
                                          ).toFixed(2)}
                                        </span>
                                        <Button
                                          onClick={() => {
                                            const updatedAccessories =
                                              editingDoor.accessories.filter(
                                                (_: any, i: number) =>
                                                  i !== accIndex,
                                              );
                                            handleFieldChange(
                                              "accessories",
                                              updatedAccessories,
                                            );
                                          }}
                                          size="sm"
                                          variant="outline"
                                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs">
                          {door.accessories?.length || 0} items
                        </span>
                      )}
                    </TableCell>

                    {/* Total */}
                    {/* <TableCell>
                      <span className="font-semibold text-blue-600">
                        {(() => {
                          // Helper function to convert values with comma to number
                          const convertToNumber = (
                            value: any,
                            defaultValue: number = 0
                          ) => {
                            if (typeof value === "number") return value;
                            if (typeof value === "string") {
                              const normalized = value
                                .replace(/,/g, ".")
                                .replace(/[^\d.]/g, "");
                              if (normalized === "" || normalized === ".")
                                return defaultValue;
                              const parsed = parseFloat(normalized);
                              return isNaN(parsed) ? defaultValue : parsed;
                            }
                            return defaultValue;
                          };

                          let total =
                            convertToNumber(door.price, 0) *
                            parseInt(door.quantity || 1);
                          // Add extensions total
                          const extensionsTotal = (
                            door.extensions || []
                          ).reduce(
                            (sum: number, item: any) =>
                              sum +
                              convertToNumber(item.price, 0) *
                                parseInt(item.quantity || 1),
                            0
                          );
                          // Add casings total
                          const casingsTotal = (door.casings || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              convertToNumber(item.price, 0) *
                                parseInt(item.quantity || 1),
                            0
                          );
                          // Add crowns total
                          const crownsTotal = (door.crowns || []).reduce(
                            (sum: number, item: any) =>
                              sum +
                              convertToNumber(item.price, 0) *
                                parseInt(item.quantity || 1),
                            0
                          );
                          // Add accessories total
                          const accessoriesTotal = (
                            door.accessories || []
                          ).reduce(
                            (sum: number, item: any) =>
                              sum +
                              convertToNumber(item.price, 0) *
                                parseInt(item.quantity || 1),
                            0
                          );
                          total +=
                            extensionsTotal +
                            casingsTotal +
                            crownsTotal +
                            accessoriesTotal;
                          return total.toFixed(2);
                        })()}
                      </span>
                    </TableCell> */}

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
                      colSpan={14}
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
function DoorProductSelect({
  value,
  onChange,
  placeholder,
  productsList = [],
  onProductSelect,
}: {
  value: any;
  onChange: (value: any) => void;
  placeholder: string;
  productsList?: any[];
  onProductSelect?: (product: any) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<any[]>(productsList || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Effect 1: Sync component with the initial value from the parent form
  useEffect(() => {
    if (
      value &&
      productsList.length > 0 &&
      (!selectedProduct || selectedProduct.id !== value)
    ) {
      const product = productsList.find((p) => p.id === value);
      if (product) {
        setSelectedProduct(product);
        setSearchQuery(product.name);
      }
    }
  }, [value, productsList]);

  // Effect 2: Perform search when the user types
  useEffect(() => {
    // Don't search if the dropdown is not open or if the query matches the selected product name
    if (!isOpen || (selectedProduct && searchQuery === selectedProduct.name)) {
      return;
    }

    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setProducts(productsList || []); // Show initial list if query is short
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get(
          `products?search=${encodeURIComponent(searchQuery)}`,
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
  }, [searchQuery, isOpen, selectedProduct, productsList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    // If user clears input, reset everything
    if (newQuery === "") {
      setSelectedProduct(null);
      onChange("");
      setIsOpen(true);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery(product.name || "");
    onChange(product.id);
    setIsOpen(false);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const handleBlur = () => {
    // Use a short timeout to allow click events on dropdown items to register
    setTimeout(() => {
      setIsOpen(false);
      // If the user blurs without making a selection, revert to the last selected product's name
      if (selectedProduct) {
        setSearchQuery(selectedProduct.name);
      }
    }, 200);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full"
        autoComplete="off"
      />

      {isOpen && (
        <div
          className="fixed z-[999] w-[calc(100%-2rem)] max-w-[350px] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-auto"
          style={{
            top: "auto",
            left: "auto",
            transform: "translate(0, 0)",
          }}
        >
          {isLoading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className={`p-2 hover:bg-gray-100 cursor-pointer text-sm ${
                  selectedProduct?.id === product.id
                    ? "bg-blue-50 font-medium"
                    : ""
                }`}
                // Use onMouseDown to ensure it fires before the input's onBlur event
                onMouseDown={() => handleProductSelect(product)}
              >
                {product.name}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">
              {searchQuery.length > 1
                ? "No products found"
                : "Type to search..."}
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
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            {t("forms.order_review")}
            {/* Calculate Button */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Details Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">{t("forms.doors_count")}</p>
              <p className="font-semibold">{doors.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t("forms.total_items")}</p>
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
                  {priceBreakdown.doors.toFixed(2)} сум
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("forms.extensions_subtotal")}</span>
                <span>{priceBreakdown.extensions.toFixed(2)} сум</span>
              </div>
              <div className="flex justify-between">
                <span>{t("forms.casings_subtotal")}</span>
                <span>{priceBreakdown.casings.toFixed(2)} сум</span>
              </div>
              <div className="flex justify-between">
                <span>{t("forms.crowns_subtotal")}</span>
                <span>{priceBreakdown.crowns.toFixed(2)} сум</span>
              </div>
              <div className="flex justify-between">
                <span>{t("forms.accessories_subtotal")}</span>
                <span>{priceBreakdown.accessories.toFixed(2)} сум</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold">{t("forms.subtotal")}</span>
                <span className="font-bold">
                  {totals.total_sum.toFixed(2)} сум
                </span>
              </div>
            </div>
          </div>

          {/* Door Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">
              {t("forms.door_details")}
            </h4>
            {doors.map((door: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg bg-white">
                <h5 className="font-medium mb-2">
                  {t("forms.door")} {index + 1}
                </h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    {t("forms.dimensions")}: {parseFloat(door.width || 0)} x{" "}
                    {parseFloat(door.height || 0)}
                  </p>
                  <p>
                    {t("forms.quantity")}: {parseInt(door.quantity || 1)}
                  </p>
                  <p>
                    {t("forms.price")}: {parseFloat(door.price || 0).toFixed(2)}{" "}
                    сум
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary & Actions */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur sticky top-8">
        <CardHeader>
          <CardTitle className="text-xl">
            {t("forms.pricing_summary")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Discount and Payment Fields */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">
                {t("forms.discount")} & {t("forms.advance_payment")}
              </h4>
              <div className="ml-auto">
                <Button
                  onClick={onCalculate}
                  disabled={isCalculating || doors.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  size="lg"
                >
                  <Calculator className="h-5 w-5" />
                  {isCalculating
                    ? t("forms.calculating")
                    : t("forms.calculate")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        // Update percentage for display purposes
                        const percentage =
                          totals.total_sum > 0
                            ? (amount / totals.total_sum) * 100
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
                          const amount = totals.total_sum * (percentage / 100);
                          setDiscountAmountInput(amount);
                        },
                      })}
                    />
                    <span className="text-xs text-gray-500 mt-1 block text-center">
                      %
                    </span>
                  </div>
                </div>
                {(discount_percentage > 0 || discountAmountInput > 0) && (
                  <p className="text-sm text-green-600">
                    {t("forms.discount_amount")}:{" "}
                    {discountAmountInput > 0
                      ? discountAmountInput.toFixed(0)
                      : (
                          totals.total_sum *
                          (discount_percentage / 100)
                        ).toFixed(0)}{" "}
                    сум
                    {discount_percentage > 0 && ` (${discount_percentage}%)`}
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
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t("forms.subtotal")}</span>
              <span className="font-semibold">
                {totals.total_sum.toFixed(0)} сум
              </span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>
                {t("forms.discount")} ({discount_percentage || 0}%)
              </span>
              <span>{totals.discountAmount.toFixed(0)} сум</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>{t("forms.advance_payment")}</span>
              <span>{advance.toFixed(0)} сум</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold text-blue-600">
              <span>{t("forms.remaining_balance")}</span>
              <span>{totals.remainingBalance.toFixed(0)} сум</span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={orderForm.handleSubmit(onSubmit)}
              disabled={isLoading}
              className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isLoading
                ? `${t("common.creating")}...`
                : t("common.create_order")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {}}
              className="w-full hidden"
            >
               {t("common.back_to_doors")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
