import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useCreateOrder } from "../api/order";
import {
  useGetCurrencies,
  useGetStores,
  useGetProjects,
  useGetCounterparties,
  useGetOrganizations,
  useGetSalesChannels,
  useGetSellers,
  useGetOperators,
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
import { Plus, Trash2, DoorOpen, Package, Calculator } from "lucide-react";
import api from "../api/api";
import { useAutoSave, useOrderDraftRecovery } from "../hooks/useAutoSave";

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
  if (typeof id === 'object') {
    actualId = id.value || id.id || id;
  }
  
  // Ensure we have a valid ID to search with
  if (!actualId || (typeof actualId !== 'string' && typeof actualId !== 'number')) {
    return { id: actualId };
  }
  
  const product = productsList.find((p) => p.id === actualId);
  return product || { id: actualId };
};

const createProductItemFields = (
  t: any,
  modelLabel: string,
  modelPlaceholder: string,
  withDimensions = false,
  options: { 
    isCrown?: boolean; 
    getDoorWidth?: () => number; 
    crownSize?: number; 
    disabled?: boolean;
    isCasing?: boolean;
    getDoorHeight?: () => number;
    casingSize?: number;
    casingRangeOptions?: any[];
  } = {}
) => {
  const itemFields = [
    {
      name: "model",
      label: modelLabel,
      type: "async-searchable-select",
      placeholder: modelPlaceholder,
      required: true,
      searchProducts: async (query: string) => {
        const res = await api(`products?search=${encodeURIComponent(query)}`);
        const products = res ? await res.data : [];
        return products.map((product: any) => ({
          value: product.id,
          label: product.name,
          ...product,
        }));
      },
    },
    {
      name: "price_type",
      label: t("forms.price_type"),
      type: "select",
      placeholder: t("placeholders.select_price_type"),
      required: true,
      show: (itemData: any) => itemData?.model?.salePrices?.length > 1,
    },
  ];

  // Add casing type selection for casings
  if (options.isCasing) {
    console.log("Creating casing fields with options:", options.casingRangeOptions); // Debug log
    itemFields.push(
      {
        name: "casing_type",
        label: t("forms.casing_type"),
        type: "select",
        placeholder: t("placeholders.select_casing_type"),
        required: true,
        options: [
          { value: "боковой", label: t("forms.casing_type_side") },
          { value: "прямой", label: t("forms.casing_type_straight") },
        ],
        show: () => true,
      } as any,
      {
        name: "casing_formula",
        label: t("forms.casing_formula"),
        type: "select",
        placeholder: t("placeholders.select_casing_formula"),
        required: true,
        options: [
          { value: "formula1", label: t("forms.formula_1") },
          { value: "formula2", label: t("forms.formula_2") },
        ],
        show: () => true,
      } as any,
      {
        name: "casing_range",
        label: t("forms.casing_range"),
        type: "select",
        placeholder: t("placeholders.select_casing_range"),
        required: true,
        options: options.casingRangeOptions || [],
        show: (itemData: any) => itemData?.casing_formula === "formula2",
      } as any
    );
  }

  if (withDimensions) {
    itemFields.push(
      {
        name: "height",
        label: t("forms.height"),
        type: "number",
        required: true,
        placeholder: t("placeholders.enter_height"),
        show: () => true,
        ...(options.isCasing && {
          disabled: true,
          calculateValue: typeof options.getDoorHeight === "function"
            ? (itemData: any) => {
                const doorHeight = (options.getDoorHeight && options.getDoorHeight()) || 0;
                const doorWidth = (options.getDoorWidth && options.getDoorWidth()) || 0;
                const casingType = itemData?.casing_type;
                const casingFormula = itemData?.casing_formula;
                const casingRange = itemData?.casing_range;
                
                // Formula 2: Use selected casing range's casing_size
                if (casingFormula === "formula2" && casingRange) {
                  // Find the selected casing range object to get its casing_size
                  const selectedRange = options.casingRangeOptions?.find(
                    (range: any) => range.value === String(casingRange) // Convert to string for comparison
                  );
                  if (selectedRange && selectedRange.casing_size !== undefined) {
                    return selectedRange.casing_size;
                  }
                }
                
                // Formula 1: Original logic
                if (casingFormula === "formula1" || !casingFormula) {
                  const casingSize = options.casingSize || 0;
                  if (casingType === "боковой") {
                    return doorHeight + casingSize;
                  } else if (casingType === "прямой") {
                    return doorWidth + (2 * casingSize);
                  }
                }
                
                return doorHeight;
              }
            : undefined,
        }),
      },
      {
        name: "width",
        label: t("forms.width"),
        type: "number",
        required: true,
        placeholder: t("placeholders.enter_width"),
        show: () => true,
        ...(options.isCasing && {
          defaultValue: options.casingSize || 0,
          calculateValue: () => options.casingSize || 0,
        }),
      }
    );
  } else if (
    modelLabel.toLowerCase().includes("crown") ||
    modelLabel.toLowerCase().includes(t("forms.crown_model").toLowerCase())
  ) {
    // Always show width input for crowns, but make it read-only and auto-filled
    itemFields.push({
      name: "width",
      label: t("forms.width"),
      type: "number",
      required: true,
      placeholder: t("placeholders.enter_width"),
      show: () => true,
      disabled: true, // Use disabled instead of readOnly for form field
      calculateValue:
        options.isCrown &&
        typeof options.getDoorWidth === "function" &&
        typeof options.crownSize === "number"
          ? () => {
              const doorWidth = (options.getDoorWidth && options.getDoorWidth()) || 0;
              const crownSize = options.crownSize || 0;
              const totalWidth = doorWidth + crownSize;
              return isNaN(totalWidth) ? "" : totalWidth;
            }
          : undefined,
    } as any);
  }
  // Add quantity and price fields at the end
  itemFields.push(
    {
      name: "quantity",
      label: t("forms.quantity"),
      type: "number",
      required: true,
      placeholder: t("placeholders.enter_quantity"),
      show: () => true,
    },
    {
      name: "price",
      label: t("forms.price"),
      type: "number",
      required: true,
      placeholder: t("placeholders.enter_price"),
      show: () => true,
    }
  );
  return itemFields;
};

const doorFields = (t: any, fieldOptions: any, form: any, crownSize?: number, casingSize?: number) => {
  const watchDoorData = form.watch(); // Watch all fields in the current door form
  const getDoorWidth = () => parseFloat(watchDoorData.width || 0);
  const getDoorHeight = () => parseFloat(watchDoorData.height || 0);

  return [
    {
      name: "model",
      label: t("forms.door_model"),
      type: "async-searchable-select",
      apiEndpoint: "/api/products",
      searchParam: "search",
      placeholder: t("placeholders.search_model"),
      required: true,
      onChange: (option: any) => {
        if (option && option.salePrices) {
          if (option.salePrices.length === 1) {
            form.setValue("price_type", option.salePrices[0].priceType.id);
            form.setValue("price", option.salePrices[0].value / 100);
          } else {
            form.setValue("price", "");
            form.setValue("price_type", null);
          }
        }
      },
    },
    {
      name: "price_type",
      label: t("forms.price_type"),
      type: "select",
      options:
        watchDoorData.model?.salePrices?.map((p: any) => ({
          value: p.priceType.id,
          label: p.priceType.name,
        })) || [],
      placeholder: t("placeholders.select_price_type"),
      required: true,
      show: () => watchDoorData.model?.salePrices?.length > 1,
      onChange: (priceTypeId: string) => {
        const price = watchDoorData.model.salePrices.find(
          (p: any) => p.priceType.id === priceTypeId
        );
        if (price) {
          form.setValue("price", price.value / 100);
        }
      },
    },
    {
      name: "price",
      label: t("forms.price"),
      type: "number",
      step: "0.01",
      required: true,
      readOnly: watchDoorData.model?.salePrices?.length > 0,
    },
    {
      name: "extensions",
      label: t("forms.extensions"),
      type: "dynamic-list",
      itemFields: createProductItemFields(
        t,
        t("forms.extension_model"),
        t("placeholders.search_extension_model"),
        true
      ),
      addButtonLabel: t("forms.add_extension"),
    },
    {
      name: "casings",
      label: t("forms.casings"),
      type: "dynamic-list",
      itemFields: createProductItemFields(
        t,
        t("forms.casing_model"),
        t("placeholders.search_casing_model"),
        true,
        {
          isCasing: true,
          getDoorHeight,
          getDoorWidth,
          casingSize,
          casingRangeOptions: fieldOptions.casingRangeOptions,
        }
      ),
      addButtonLabel: t("forms.add_casing"),
    },
    {
      name: "crowns",
      label: t("forms.crowns"),
      type: "dynamic-list",
      itemFields: createProductItemFields(
        t,
        t("forms.crown_model"),
        t("placeholders.search_crown_model"),
        false,
        {
          isCrown: true,
          getDoorWidth,
          crownSize,
        }
      ),
      addButtonLabel: t("forms.add_crown"),
    },
    {
      name: "accessories",
      label: t("forms.accessories"),
      type: "dynamic-list",
      itemFields: [
        ...createProductItemFields(
          t,
          t("forms.accessory_model"),
          t("placeholders.search_accessory_model")
        ),
        {
          name: "accessory_type",
          label: t("forms.accessory_type"),
          type: "select",
          options: [
            { value: "cube", label: t("accessory_types.cube") },
            { value: "leg", label: t("accessory_types.leg") },
            { value: "glass", label: t("accessory_types.glass") },
            { value: "lock", label: t("accessory_types.lock") },
            { value: "topsa", label: t("accessory_types.topsa") },
            { value: "beading", label: t("accessory_types.beading") },
          ],
          required: true,
        },
      ],
      addButtonLabel: t("forms.add_accessory"),
    },
    // Other Fields...
    {
      name: "material",
      label: t("forms.material"),
      type: "select",
      options: fieldOptions.materialOptions,
      placeholder: t("placeholders.select_material"),
      required: true,
    },
    {
      name: "material_type",
      label: t("forms.material_type"),
      type: "select",
      options: fieldOptions.materialTypeOptions,
      placeholder: t("placeholders.select_material_type"),
      required: true,
    },
    {
      name: "massif",
      label: t("forms.massif"),
      type: "select",
      options: fieldOptions.massifOptions,
      placeholder: t("placeholders.select_massif"),
      required: true,
    },
    {
      name: "color",
      label: t("forms.color"),
      type: "select",
      options: fieldOptions.colorOptions,
      placeholder: t("placeholders.select_color"),
      required: true,
    },
    {
      name: "patina_color",
      label: t("forms.patina_color"),
      type: "select",
      options: fieldOptions.patinaColorOptions,
      placeholder: t("placeholders.select_patina_color"),
      required: true,
    },
    {
      name: "beading_main",
      label: t("forms.beading_main"),
      type: "select",
      options: fieldOptions.beadingMainOptions,
      placeholder: t("placeholders.select_beading_main"),
      required: true,
    },
    {
      name: "beading_additional",
      label: t("forms.beading_additional"),
      type: "select",
      options: fieldOptions.beadingAdditionalOptions,
      placeholder: t("placeholders.select_beading_additional"),
      required: true,
    },
    {
      name: "glass_type",
      label: t("forms.glass_type"),
      type: "select",
      options: fieldOptions.glassTypeOptions,
      placeholder: t("placeholders.select_glass_type"),
      required: true,
    },
    {
      name: "threshold",
      label: t("forms.threshold"),
      type: "select",
      options: fieldOptions.thresholdOptions,
      placeholder: t("placeholders.select_threshold"),
      required: true,
    },
    {
      name: "height",
      label: t("forms.height"),
      type: "number",
      step: "0.1",
      required: true,
    },
    {
      name: "width",
      label: t("forms.width"),
      type: "number",
      step: "0.1",
      required: true,
    },
    {
      name: "quantity",
      label: t("forms.quantity"),
      type: "number",
      required: true,
    },
  ];
};

export default function CreateOrderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: createOrder, isPending: isLoading } = useCreateOrder();
  const [doors, setDoors] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [totals, setTotals] = useState({
    totalAmount: 0,
    discountAmount: 0,
    remainingBalance: 0,
  });
  const [hasCheckedForDraft, setHasCheckedForDraft] = useState(false);
  const recoveryProcessed = useRef(false);
  const orderForm = useForm();

  // Auto-save functionality
  const { getOrderDraft, clearAllDrafts, hasDraftData, STORAGE_KEYS } = useOrderDraftRecovery();
  const orderFormData = orderForm.watch();
  
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
        if (orderData && typeof orderData === 'object') {
          Object.keys(orderData).forEach(key => {
            if (orderData[key] !== undefined && orderData[key] !== null && orderData[key] !== '') {
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

  const steps = [
    { id: 1, title: t("forms.basic_info"), icon: Package },
    { id: 2, title: t("forms.doors"), icon: DoorOpen },
    { id: 3, title: t("forms.review"), icon: Calculator },
  ];

  const { discount_percentage, advance_payment } = orderForm.watch();

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
  const { data: thresholds } = useGetThresholds();
  const { data: casingRanges } = useGetCasingRanges();
  const productsList = useMemo(
    () => (Array.isArray(products) ? products : products?.results || []),
    [products]
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
    patinaColorOptions: formatReferenceOptions(patinaColors),
    beadingMainOptions: formatReferenceOptions(
      Array.isArray(beadings)
        ? beadings.filter((b) => b.type === "main")
        : { results: beadings?.results?.filter((b) => b.type === "main") || [] }
    ),
    beadingAdditionalOptions: formatReferenceOptions(
      Array.isArray(beadings)
        ? beadings.filter((b) => b.type === "additional")
        : {
            results:
              beadings?.results?.filter((b) => b.type === "additional") || [],
          }
    ),
    glassTypeOptions: formatReferenceOptions(glassTypes),
    thresholdOptions: formatReferenceOptions(thresholds),
    casingRangeOptions: (Array.isArray(casingRanges) ? casingRanges : casingRanges?.results || []).map(range => ({
      value: String(range.id), // Convert to string for Select component
      label: `$ ${range.id} (${range.min_size}-${range.max_size}, ${t("forms.casing_size")}: ${range.casing_size})`,
      ...range,
    })),
  };

  // Debug log to check if casingRanges data is being received
  console.log("Casing Ranges Data:", casingRanges);
  console.log("Formatted Casing Range Options:", fieldOptions.casingRangeOptions);

  const orderFields = [
    {
      name: "rate",
      label: t("forms.currency"),
      type: "searchable-select",
      options: fieldOptions.rateOptions,
      placeholder: t("placeholders.select_currency"),
      required: true,
    },
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
      name: "agent",
      label: t("forms.agent"),
      type: "searchable-select",
      options: fieldOptions.agentOptions,
      placeholder: t("placeholders.select_agent"),
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
      name: "order_code",
      label: t("forms.order_code"),
      type: "text",
      placeholder: t("placeholders.enter_order_code"),
      required: true,
    },
    {
      name: "order_date",
      label: t("forms.order_date"),
      type: "datetime-local",
      placeholder: t("placeholders.enter_order_date"),
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
      name: "operator",
      label: t("forms.operator"),
      type: "searchable-select",
      options: fieldOptions.operatorOptions,
      placeholder: t("placeholders.select_operator"),
      required: true,
    },
    {
      name: "discount_percentage",
      label: t("forms.discount_percentage"),
      type: "number",
      step: "0.1",
      required: false,
    },
    {
      name: "advance_payment",
      label: t("forms.advance_payment"),
      type: "number",
      step: "0.01",
      required: false,
    },
    {
      name: "description",
      label: t("forms.description"),
      type: "textarea",
      placeholder: t("placeholders.enter_description"),
    },
  ];

  // --- Calculations ---
  useEffect(() => {
    const calculateTotals = () => {
      const totalAmount = doors.reduce((total, door) => {
        let doorTotal = parseFloat(door.price || 0) * (door.quantity || 1);

        const sumItems = (items: any[]) =>
          items?.reduce(
            (sum, item) =>
              sum + parseFloat(item.price || 0) * (item.quantity || 1),
            0
          ) || 0;

        doorTotal += sumItems(door.extensions);
        doorTotal += sumItems(door.casings);
        doorTotal += sumItems(door.crowns);
        doorTotal += sumItems(door.accessories);

        return total + doorTotal;
      }, 0);

      const discount = parseFloat(discount_percentage || 0);
      const advance = parseFloat(advance_payment || 0);

      const discountAmount = (totalAmount * discount) / 100;
      const finalAmount = totalAmount - discountAmount;
      const remainingBalance = finalAmount - advance;

      setTotals({
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        remainingBalance: remainingBalance,
      });
    };

    calculateTotals();
  }, [doors, discount_percentage, advance_payment]);

  const onSubmit = async (data: any) => {
    const { totalAmount, discountAmount, remainingBalance } = totals;

    const orderData = {
      ...data,
      // Map IDs to full meta objects for the API
      rate: getMetaById(currencies, data.rate),
      store: getMetaById(stores, data.store),
      project: getMetaById(projects, data.project),
      agent: getMetaById(counterparties, data.agent),
      organization: getMetaById(organizations, data.organization),
      salesChannel: getMetaById(salesChannels, data.salesChannel),
      seller: getMetaById(sellers, data.seller),
      operator: getMetaById(operators, data.operator),
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
      total_amount: totalAmount.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      remaining_balance: remainingBalance.toFixed(2),
    };

    createOrder(orderData, {
      onSuccess: () => {
        clearAllDrafts(); // Clear saved draft data on successful submission
        toast.success(t("messages.created"));
        navigate("/orders");
      },
      onError: (e: any) => {
        console.error("Error creating order:", e.response?.data);
        toast.error(t("messages.error"));
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("pages.create_order")}
              </h1>
              <p className="text-gray-600">{t("forms.create_order_description")}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate("/orders")}
              className="flex items-center gap-2"
            >
              ← {t("common.back_to_orders")}
            </Button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    currentStep === step.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : currentStep > step.id
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 mx-4 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Content Based on Step */}
        {currentStep === 1 && (
          <StepOne 
            orderForm={orderForm} 
            orderFields={orderFields} 
            isLoading={isLoading}
            onNext={() => setCurrentStep(2)}
          />
        )}
        
        {currentStep === 2 && (
          <StepTwo 
            doors={doors}
            setDoors={setDoors}
            fieldOptions={fieldOptions}
            productsList={productsList}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        )}
        
        {currentStep === 3 && (
          <StepThree 
            orderForm={orderForm}
            doors={doors}
            totals={totals}
            isLoading={isLoading}
            onSubmit={onSubmit}
            onBack={() => setCurrentStep(2)}
            discount_percentage={discount_percentage}
            advance_payment={advance_payment}
          />
        )}
      </div>
    </div>
  );
}

// Step Components
function StepOne({ orderForm, orderFields, isLoading, onNext }: any) {
  const { t } = useTranslation();
  
  const handleNext = () => {
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
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
          <div className="flex justify-end pt-6">
            <Button 
              onClick={handleNext}
              className="px-8 py-3 text-lg font-medium"
              size="lg"
            >
              {t("common.next_step")} →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StepTwo({ doors, setDoors, fieldOptions, productsList, onNext, onBack }: any) {
  const { t } = useTranslation();
  
  const handleAddDoor = (doorData: any) => {
    console.log("Adding door data:", doorData); // Debug log
    
    // Ensure all required fields are present and properly typed
    const safeDoorData = {
      ...doorData,
      model: doorData.model || '',
      price: parseFloat(doorData.price || 0),
      quantity: parseInt(doorData.quantity || 1),
      height: parseFloat(doorData.height || 0),
      width: parseFloat(doorData.width || 0),
      extensions: doorData.extensions || [],
      casings: doorData.casings || [],
      crowns: doorData.crowns || [],
      accessories: doorData.accessories || [],
    };
    
    console.log("Safe door data:", safeDoorData); // Debug log
    setDoors([...doors, safeDoorData]);
  };
  
  const handleRemoveDoor = (index: number) => setDoors(doors.filter((_: any, i: number) => i !== index));

  return (
    <div className="max-w-6xl mx-auto">
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
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Existing Doors - Enhanced Display */}
          {doors.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DoorOpen className="h-5 w-5" />
                {t("forms.configured_doors")}
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {doors.map((door: any, index: number) => (
                  <DoorCard 
                    key={index}
                    door={door}
                    index={index}
                    productsList={productsList}
                    onRemove={() => handleRemoveDoor(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add New Door Form - Enhanced */}
          <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 bg-blue-50/30 hover:bg-blue-50/50 transition-colors">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-3">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {t("forms.add_new_door")}
              </h3>
              <p className="text-gray-600">
                {t("forms.configure_door_specifications")}
              </p>
            </div>
            <DoorForm
              onSubmit={handleAddDoor}
              fieldOptions={fieldOptions}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline"
              onClick={onBack}
              className="px-8 py-3 text-lg font-medium"
              size="lg"
            >
              ← {t("common.back")}
            </Button>
            <Button 
              onClick={onNext}
              disabled={doors.length === 0}
              className="px-8 py-3 text-lg font-medium"
              size="lg"
            >
              {t("common.review_order")} →
            </Button>
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

function StepThree({ orderForm, doors, totals, isLoading, onSubmit, onBack, discount_percentage, advance_payment }: any) {
  const { t } = useTranslation();

  // Calculate detailed subtotals
  const priceBreakdown = doors.reduce(
    (acc: any, door: any) => {
      const qty = parseInt(door.quantity || 1);
      const doorPrice = parseFloat(door.price || 0) * qty;
      acc.doors += doorPrice;

      const sumItems = (items: any[]) =>
        items?.reduce((sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1), 0) || 0;

      acc.extensions += sumItems(door.extensions);
      acc.casings += sumItems(door.casings);
      acc.crowns += sumItems(door.crowns);
      acc.accessories += sumItems(door.accessories);
      return acc;
    },
    { doors: 0, extensions: 0, casings: 0, crowns: 0, accessories: 0 }
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
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
                  <p className="text-sm text-gray-600">{t("forms.doors_count")}</p>
                  <p className="font-semibold">{doors.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("forms.total_items")}</p>
                  <p className="font-semibold">
                    {doors.reduce((total: number, door: any) =>
                      total + 1 +
                      (door.extensions?.length || 0) +
                      (door.casings?.length || 0) +
                      (door.crowns?.length || 0) +
                      (door.accessories?.length || 0), 0
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
                    <span className="font-semibold">{priceBreakdown.doors.toFixed(2)} сум</span>
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
                    <span className="font-bold">{totals.totalAmount.toFixed(2)} сум</span>
                  </div>
                </div>
              </div>

              {/* Door Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800">{t("forms.door_details")}</h4>
                {doors.map((door: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-white">
                    <h5 className="font-medium mb-2">
                      {t("forms.door")} {index + 1}
                    </h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{t("forms.dimensions")}: {parseFloat(door.width || 0)} x {parseFloat(door.height || 0)}</p>
                      <p>{t("forms.quantity")}: {parseInt(door.quantity || 1)}</p>
                      <p>{t("forms.price")}: {parseFloat(door.price || 0).toFixed(2)} сум</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary & Actions */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur sticky top-8">
            <CardHeader>
              <CardTitle className="text-xl">{t("forms.pricing_summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("forms.subtotal")}</span>
                  <span className="font-semibold">{totals.totalAmount.toFixed(0)} сум</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>{t("forms.discount")} ({discount_percentage || 0}%)</span>
                  <span>-{totals.discountAmount.toFixed(0)} сум</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>{t("forms.advance_payment")}</span>
                  <span>-{parseFloat(advance_payment || 0).toFixed(0)} сум</span>
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
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isLoading ? `${t("common.creating")}...` : t("common.create_order")}
                </Button>
                <Button 
                  variant="outline"
                  onClick={onBack}
                  className="w-full"
                >
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

// Enhanced Door Card Component
function DoorCard({ door, index, productsList, onRemove }: any) {
  const { t } = useTranslation();
  
  const getProductName = (modelId: string | any) => {
    // Handle if modelId is an object
    if (typeof modelId === 'object' && modelId !== null) {
      if (modelId.name) return modelId.name;
      if (modelId.label) return modelId.label;
      if (modelId.value) {
        // If value is also an object, recursively get the name
        return getProductName(modelId.value);
      }
      if (modelId.id) {
        modelId = modelId.id;
      } else {
        return t("forms.unknown_product");
      }
    }
    
    // Now modelId should be a string or number
    const model = getProductById(productsList, modelId);
    if (model && typeof model === 'object' && model.name) {
      return model.name;
    }
    if (typeof modelId === 'string' || typeof modelId === 'number') {
      return String(modelId);
    }
    return t("forms.unknown_product");
  };

  const calculateDoorTotal = () => {
    let total = parseFloat(door.price || 0) * (door.quantity || 1);
    
    const addItemsTotal = (items: any[]) => 
      items?.reduce((sum, item) => 
        sum + parseFloat(item.price || 0) * (item.quantity || 1), 0
      ) || 0;

    total += addItemsTotal(door.extensions);
    total += addItemsTotal(door.casings);
    total += addItemsTotal(door.crowns);
    total += addItemsTotal(door.accessories);
    
    return total;
  };

  // Safely get door dimensions
  const getDoorWidth = () => {
    const width = door.width;
    if (typeof width === 'number') return width;
    if (typeof width === 'string') return parseFloat(width) || 0;
    return 0;
  };

  const getDoorHeight = () => {
    const height = door.height;
    if (typeof height === 'number') return height;
    if (typeof height === 'string') return parseFloat(height) || 0;
    return 0;
  };

  const getDoorQuantity = () => {
    const quantity = door.quantity;
    if (typeof quantity === 'number') return quantity;
    if (typeof quantity === 'string') return parseFloat(quantity) || 1;
    return 1;
  };

  return (
    <div className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <DoorOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <Badge variant="outline" className="text-sm font-medium">
              {t("forms.door")} {index + 1}
            </Badge>
            <p className="text-sm text-gray-500 mt-1">
              {getDoorWidth()} x {getDoorHeight()} • {t("forms.qty_short")}: {getDoorQuantity()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 truncate">
            {getProductName(door.model)}
          </p>
          <p className="text-lg font-semibold text-blue-600">
            ${calculateDoorTotal().toFixed(2)}
          </p>
        </div>
        
        {/* Show accessories count */}
        <div className="flex gap-2 text-xs text-gray-500">
          {door.extensions?.length > 0 && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {door.extensions.length} {t("forms.ext_short")}
            </span>
          )}
          {door.casings?.length > 0 && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {door.casings.length} {t("forms.cas_short")}
            </span>
          )}
          {door.crowns?.length > 0 && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {door.crowns.length} {t("forms.crown_short")}
            </span>
          )}
          {door.accessories?.length > 0 && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {door.accessories.length} {t("forms.acc_short")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Enhanced DoorForm Component ---

function DoorForm({
  onSubmit,
  fieldOptions,
}: {
  onSubmit: (data: any) => void;
  fieldOptions: any;
}) {
  const { t } = useTranslation();
  const form = useForm();
  const [crownSize, setCrownSize] = useState<number | null>(null);
  const [casingSize, setCasingSize] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const fetchedAttributeSettings = useRef(false);

  // Fetch crown_size and casing_size from attribute settings API once
  useEffect(() => {
    if (fetchedAttributeSettings.current) return;
    fetchedAttributeSettings.current = true;
    api
      .get("attribute-settings/")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        const found = data.find((item: any) => 
          item.crown_size !== undefined || item.casing_size !== undefined
        );
        
        if (found) {
          if (found.crown_size !== undefined) {
            const size = typeof found.crown_size === "number" 
              ? found.crown_size 
              : parseFloat(found.crown_size);
            setCrownSize(isNaN(size) ? null : size);
          }
          
          if (found.casing_size !== undefined) {
            const size = typeof found.casing_size === "number" 
              ? found.casing_size 
              : parseFloat(found.casing_size);
            setCasingSize(isNaN(size) ? null : size);
          }
        }
      })
      .catch(() => {
        setCrownSize(null);
        setCasingSize(null);
      });
  }, []);

  // Group fields by category for better organization
  const basicFields = [
    "model", "price_type", "price", "height", "width", "quantity"
  ];
  
  const materialFields = [
    "material", "material_type", "massif", "color", "patina_color", 
    "beading_main", "beading_additional", "glass_type", "threshold"
  ];

  const fields = doorFields(t, fieldOptions, form, 
    crownSize === null ? undefined : crownSize,
    casingSize === null ? undefined : casingSize
  );
  
  const basicFieldsData = fields.filter(f => basicFields.includes(f.name));
  const materialFieldsData = fields.filter(f => materialFields.includes(f.name));
  const dynamicFieldsData = fields.filter(f => !basicFields.includes(f.name) && !materialFields.includes(f.name));

  // Normalize data before submitting
  const normalizeDoorData = (data: any) => {
    const normalizeModelField = (item: any) => {
      if (item.model && typeof item.model === "object") {
        // Extract the ID from the model object
        return { ...item, model: item.model.value || item.model.id || item.model };
      }
      return item;
    };

    let newData = { ...data };
    
    // Normalize the main door model
    if (newData.model && typeof newData.model === "object") {
      newData.model = newData.model.value || newData.model.id || newData.model;
    }

    // Ensure all numeric fields are properly converted
    newData.price = parseFloat(newData.price || 0);
    newData.quantity = parseInt(newData.quantity || 1);
    newData.height = parseFloat(newData.height || 0);
    newData.width = parseFloat(newData.width || 0);

    // Handle crown width calculation
    if (Array.isArray(newData.crowns) && crownSize != null) {
      const doorWidth = parseFloat(newData.width || 0);
      newData.crowns = newData.crowns.map((crown: any) => ({
        ...normalizeModelField(crown),
        width: (doorWidth && !isNaN(doorWidth) ? doorWidth : 0) + (crownSize && !isNaN(crownSize) ? crownSize : 0),
      }));
    } else if (Array.isArray(newData.crowns)) {
      newData.crowns = newData.crowns.map(normalizeModelField);
    }

    // Handle casing height calculation based on type
    if (Array.isArray(newData.casings) && casingSize != null) {
      const doorHeight = parseFloat(newData.height || 0);
      const doorWidth = parseFloat(newData.width || 0);
      newData.casings = newData.casings.map((casing: any) => {
        const normalizedCasing = normalizeModelField(casing);
        
        // Calculate height based on casing type and formula
        const casingType = casing.casing_type;
        const casingFormula = casing.casing_formula;
        const casingRange = casing.casing_range;
        
        if (casingFormula === "formula2" && casingRange) {
          // Find the selected casing range object to get its casing_size
          const selectedRange = fieldOptions.casingRangeOptions?.find(
            (range: any) => range.value === String(casingRange)
          );
          if (selectedRange && selectedRange.casing_size !== undefined) {
            normalizedCasing.height = selectedRange.casing_size;
          }
        } else if (casingFormula === "formula1" || !casingFormula) {
          // Original logic
          if (casingType === "боковой") {
            normalizedCasing.height = doorHeight + casingSize;
          } else if (casingType === "прямой") {
            normalizedCasing.height = doorWidth + (2 * casingSize);
          } else {
            normalizedCasing.height = parseFloat(casing.height || 0);
          }
        }
        
        // Set width to casing_size if not already set
        if (!casing.width || casing.width === 0) {
          normalizedCasing.width = casingSize;
        } else {
          normalizedCasing.width = parseFloat(casing.width || casingSize);
        }
        
        // Ensure other numeric fields are properly converted
        normalizedCasing.price = parseFloat(casing.price || 0);
        normalizedCasing.quantity = parseInt(casing.quantity || 1);
        
        return normalizedCasing;
      });
    } else if (Array.isArray(newData.casings)) {
      newData.casings = newData.casings.map(normalizeModelField);
    }

    // Normalize other accessory arrays
    ["extensions", "accessories"].forEach((key) => {
      if (Array.isArray(newData[key])) {
        newData[key] = newData[key].map(normalizeModelField);
      }
    });
    
    return newData;
  };

  const handleSubmit = (data: any) => {
    try {
      const normalizedData = normalizeDoorData(data);
      console.log("Normalized door data:", normalizedData); // Debug log
      onSubmit(normalizedData);
      form.reset();
      setIsExpanded(false);
      toast.success(t("forms.door_added_successfully"));
    } catch (error) {
      console.error("Error normalizing door data:", error);
      toast.error(t("forms.error_adding_door"));
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Door Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-blue-600" />
          {t("forms.basic_door_info")}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
          <ResourceForm
            fields={basicFieldsData}
            onSubmit={handleSubmit}
            form={form}
            hideSubmitButton={true}
            gridClassName="contents"
          />
        </div>
      </div>

      {/* Material Specifications */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("forms.material_specifications")}
          </span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ↓
          </span>
        </button>
        
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <ResourceForm
              fields={materialFieldsData}
              onSubmit={handleSubmit}
              form={form}
              hideSubmitButton={true}
              gridClassName="contents"
            />
          </div>
        )}
      </div>

      {/* Accessories & Add-ons */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" />
          {t("forms.accessories_addons")}
        </h4>
        <div className="space-y-4  md:grid-cols-1">
          <ResourceForm
            fields={dynamicFieldsData}
            onSubmit={handleSubmit}
            form={form}
            hideSubmitButton={true}
            gridClassName="md:grid-cols-1 lg:grid-cols-1 gap-4"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          className="flex-1 h-12 text-lg font-medium bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          size="lg"
          disabled={
            (crownSize === null && fields.some(f => f.name === "crowns")) ||
            (casingSize === null && fields.some(f => f.name === "casings"))
          }
        >
          <Plus className="h-5 w-5 mr-2" />
          {t("forms.add_door")}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset();
            setIsExpanded(false);
          }}
          className="px-6"
        >
          {t("common.reset")}
        </Button>
      </div>
      
      {((fields.some(f => f.name === "crowns") && crownSize === null) ||
        (fields.some(f => f.name === "casings") && casingSize === null)) && (
        <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-amber-700 font-medium">
            {t("forms.loading_attribute_settings")}
          </p>
        </div>
      )}
    </div>
  );
}
