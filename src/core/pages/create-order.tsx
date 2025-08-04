import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import { useCreateOrder } from "../api/order";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Plus, Trash2, DoorOpen, Package, Calculator, Edit, Save, X } from "lucide-react";
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
  const [discountAmountInput, setDiscountAmountInput] = useState<number>(0);

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

  // --- Calculations ---
  useEffect(() => {
    const calculateTotals = () => {
      const totalAmount = doors.reduce((total, door) => {
        // Helper function to convert values with comma to number
        const convertToNumber = (value: any, defaultValue: number = 0) => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
            if (normalized === '' || normalized === '.') return defaultValue;
            const parsed = parseFloat(normalized);
            return isNaN(parsed) ? defaultValue : parsed;
          }
          return defaultValue;
        };

        let doorTotal = convertToNumber(door.price, 0) * (door.quantity || 1);

        const sumItems = (items: any[]) =>
          items?.reduce(
            (sum, item) =>
              sum + convertToNumber(item.price, 0) * (item.quantity || 1),
            0
          ) || 0;

        doorTotal += sumItems(door.extensions);
        doorTotal += sumItems(door.casings);
        doorTotal += sumItems(door.crowns);
        doorTotal += sumItems(door.accessories);

        return total + doorTotal;
      }, 0);

      // Helper function to convert values with comma to number
      const convertToNumber = (value: any, defaultValue: number = 0) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
          if (normalized === '' || normalized === '.') return defaultValue;
          const parsed = parseFloat(normalized);
          return isNaN(parsed) ? defaultValue : parsed;
        }
        return defaultValue;
      };

      const discount = convertToNumber(discount_percentage, 0);
      const advance = convertToNumber(advance_payment, 0);

      // Use the actual discount amount if it was set via amount input, otherwise calculate from percentage
      const discountAmount = discountAmountInput > 0 ? discountAmountInput : (totalAmount * discount) / 100;
      const finalAmount = totalAmount - discountAmount;
      const remainingBalance = finalAmount - advance;

      setTotals({
        totalAmount: totalAmount,
        discountAmount: discountAmount,
        remainingBalance: remainingBalance,
      });
    };

    calculateTotals();
  }, [doors, discount_percentage, advance_payment, discountAmountInput]);

  const onSubmit = async (data: any) => {
    const { totalAmount, discountAmount, remainingBalance } = totals;
//  const discount = convertToNumber(discount_percentage, 0);
    const orderData = {
      ...data,
      // Set created_at to current date and time (ISO string)
      created_at: new Date().toISOString(),
      // Map IDs to full meta objects for the API
      // rate: getMetaById(currencies, data.rate),
      store: getMetaById(stores, data.store),
      project: getMetaById(projects, data.project),
      agent: data.agent && typeof data.agent === 'object' ? data.agent : getMetaById(counterparties, data.agent),
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
      // discount_percentage:Number(discount_percentage.toFixed(2)),
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
      <div>
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
            discountAmountInput={discountAmountInput}
            setDiscountAmountInput={setDiscountAmountInput}
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDoor, setEditingDoor] = useState<any>(null);
  
  const handleAddNewRow = () => {
    const newDoor = {
      model: '',
      price_type: null,
      price: 0,
      quantity: 1,
      height: 0,
      width: 0,
      material: '',
      material_type: '',
      massif: '',
      color: '',
      patina_color: '',
      beading_main: '',
      beading_additional: '',
      glass_type: '',
      threshold: '',
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
  
  const handleEditDoor = (index: number) => {
    setEditingIndex(index);
    setEditingDoor({ ...doors[index] });
  };
  
  const handleSaveDoor = () => {
    if (editingIndex !== null && editingDoor) {
      const updatedDoors = [...doors];
      
      // Helper function to convert string with comma to number
      const convertToNumber = (value: any, defaultValue: number = 0) => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // Replace comma with dot and clean
          const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
          if (normalized === '' || normalized === '.') return defaultValue;
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
      console.log('handleFieldChange called - field:', field, 'value:', value, 'type:', typeof value); // Debug log
      
      if (field === 'model' && value === '') {
        console.log('WARNING: Model field being set to empty string!'); // Debug log
        console.trace('Stack trace for empty model value'); // Stack trace
      }

      // Handle comma-separated decimal numbers
      if (field === 'price' || field === 'height' || field === 'width') {
        // Replace comma with dot for decimal numbers
        if (typeof value === 'string') {
          // Clean the input - replace comma with dot and remove any non-numeric characters except dots
          let cleanedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
          
          // Handle multiple dots - keep only the first one
          const parts = cleanedValue.split('.');
          if (parts.length > 2) {
            cleanedValue = parts[0] + '.' + parts.slice(1).join('');
          }
          
          value = cleanedValue;
        }
      }
      
      // Use functional update to avoid stale closure issues
      setEditingDoor((prevEditingDoor: any) => {
        if (!prevEditingDoor) return prevEditingDoor;
        // Handle numeric fields - keep as strings during editing to preserve input like "0,5"
        if (field === 'price' || field === 'height' || field === 'width') {
          let processedValue = value;
          if (typeof value === 'string') {
            // Replace comma with dot for decimal separator and clean input
            let normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
            
            // Handle multiple dots - keep only the first one
            const parts = normalized.split('.');
            if (parts.length > 2) {
              normalized = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Keep as string to preserve partial input like "0." or "0"
            processedValue = normalized;
          }
          const newEditingDoor = {
            ...prevEditingDoor,
            [field]: processedValue
          };
          console.log('Setting editingDoor for numeric field:', field, 'new editingDoor:', newEditingDoor);
          return newEditingDoor;
        } else if (field === 'quantity') {
          let numericValue = value;
          if (typeof value === 'string') {
            numericValue = value === '' ? 0 : parseInt(value);
          }
          const newEditingDoor = {
            ...prevEditingDoor,
            [field]: numericValue
          };
          return newEditingDoor;
        } else {
          // For non-numeric fields
          const newEditingDoor = {
            ...prevEditingDoor,
            [field]: value
          };
          console.log('Setting editingDoor for non-numeric field:', field, 'new editingDoor:', newEditingDoor);
          return newEditingDoor;
        }
      });
    }
  };

  const getProductName = (modelId: string | any) => {
    if (typeof modelId === 'object' && modelId !== null) {
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
    if (model && typeof model === 'object' && model.name) {
      return model.name;
    }
    if (typeof modelId === 'string' || typeof modelId === 'number') {
      return String(modelId);
    }
    return t("forms.unknown_product");
  };

  return (
    <div  >
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
        <CardContent className="space-y-6">
          {/* Doors Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[200px]">{t("forms.model")}</TableHead>
                  <TableHead>{t("forms.price_type")}</TableHead>
                  <TableHead>{t("forms.price")}</TableHead>
                  <TableHead>{t("forms.quantity")}</TableHead>
                  <TableHead>{t("forms.height")}</TableHead>
                  <TableHead>{t("forms.width")}</TableHead>
                  <TableHead>{t("forms.material")}</TableHead>
                  <TableHead>{t("forms.material_type")}</TableHead>
                  <TableHead>{t("forms.massif")}</TableHead>
                  <TableHead>{t("forms.color")}</TableHead>
                  <TableHead>{t("forms.patina_color")}</TableHead>
                  <TableHead>{t("forms.beading_main")}</TableHead>
                  <TableHead>{t("forms.glass_type")}</TableHead>
                  <TableHead>{t("forms.threshold")}</TableHead>
                  <TableHead>{t("forms.extensions")}</TableHead>
                  <TableHead>{t("forms.casings")}</TableHead>
                  <TableHead>{t("forms.crowns")}</TableHead>
                  <TableHead>{t("forms.accessories")}</TableHead>
                  <TableHead className="min-w-[120px]">{t("forms.total")}</TableHead>
                  <TableHead className="w-32">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doors.map((door: any, index: number) => (
                  <TableRow key={index} className={editingIndex === index ? "bg-blue-50" : ""}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    
                    {/* Model */}
                    <TableCell>
                      {editingIndex === index ? (
                        <DoorProductSelect
                          value={editingDoor?.model || ''}
                          onChange={(value) => {
                            console.log('Model onChange called with value:', value);
                            // First update the model value
                            handleFieldChange('model', value);
                            
                            // If model is cleared, also clear price and price_type
                            if (!value) {
                              console.log('Model cleared, clearing price_type and price');
                              handleFieldChange('price_type', null);
                              handleFieldChange('price', '');
                            }
                          }}
                          onProductSelect={(product) => {
                            console.log('Product selected in DoorProductSelect:', product);
                            console.log('Product salePrices:', product?.salePrices);
                            
                            // Auto-set price when product is selected
                            if (product && product.salePrices && product.salePrices.length > 0) {
                              console.log('Selected product has sale prices:', product.salePrices);
                              
                              if (product.salePrices.length === 1) {
                                // If only one price option, select it automatically
                                const priceTypeId = product.salePrices[0].priceType.id;
                                const priceValue = product.salePrices[0].value / 100;
                                
                                console.log(`Setting single price type: ${priceTypeId}, value: ${priceValue}`);
                                handleFieldChange('price_type', priceTypeId);
                                handleFieldChange('price', priceValue);
                              } else {
                                // If multiple options, try to find a retail price first
                                const retailPrice = product.salePrices.find((p: any) => 
                                  p.priceType.name?.toLowerCase().includes('retail') || 
                                  p.priceType.name?.toLowerCase().includes('sale') ||
                                  p.priceType.name?.toLowerCase().includes('Цена продажи')
                                );
                                
                                // If not found, try to find wholesale price
                                const wholesalePrice = product.salePrices.find((p: any) => 
                                  p.priceType.name?.toLowerCase().includes('wholesale') || 
                                  p.priceType.name?.toLowerCase().includes('optom') ||
                                  p.priceType.name?.toLowerCase().includes('Цена оптом')
                                );
                                
                                // Use retail first, wholesale second, or first price as fallback
                                const selectedPrice = retailPrice || wholesalePrice || product.salePrices[0];
                                const priceTypeId = selectedPrice.priceType.id;
                                const priceValue = selectedPrice.value / 100;
                                
                                console.log(`Setting multiple price type: ${priceTypeId}, value: ${priceValue}`);
                                handleFieldChange('price_type', priceTypeId);
                                handleFieldChange('price', priceValue);
                              }
                            } else {
                              console.log('No price data available for product');
                              handleFieldChange('price_type', null);
                              handleFieldChange('price', '');
                            }
                          }}
                          placeholder={t("placeholders.select_door_model")}
                          productsList={productsList}
                        />
                      ) : (
                        <div className="truncate max-w-[200px]" title={getProductName(door.model)}>
                          {getProductName(door.model) || t("forms.select_model")}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Price Type */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.price_type || undefined}
                          onValueChange={(value) => {
                            handleFieldChange('price_type', value);
                            // Auto-set price when price type is selected
                            if (editingDoor?.model) {
                              const product = productsList.find((p: any) => p.id === editingDoor.model);
                              if (product && product.salePrices) {
                                const selectedPrice = product.salePrices.find(
                                  (p: any) => p.priceType.id === value
                                );
                                if (selectedPrice) {
                                  handleFieldChange('price', selectedPrice.value / 100);
                                }
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder={t("placeholders.select_price_type")} />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              console.log('Price Type Select rendering:');
                              console.log('- editingDoor:', editingDoor);
                              console.log('- editingDoor?.model:', editingDoor?.model);
                              console.log('- productsList length:', productsList?.length);
                              
                              if (!editingDoor?.model) {
                                console.log('No model selected, showing no product message');
                                return <SelectItem value="no_product" disabled>No product selected</SelectItem>;
                              }
                              
                              const product = productsList.find((p: any) => p.id === editingDoor.model);
                              console.log('Found product for model', editingDoor.model, ':', product);
                              console.log('Product salePrices:', product?.salePrices);
                              
                              if (!product || !product.salePrices || product.salePrices.length === 0) {
                                console.log('No price types available for product');
                                return <SelectItem value="no_prices" disabled>No price types available</SelectItem>;
                              }
                              
                              console.log('Rendering price types:', product.salePrices.length, 'options');
                              return product.salePrices.map((p: any) => (
                                <SelectItem key={p.priceType.id} value={p.priceType.id}>
                                  {p.priceType.name} {(p.value / 100).toFixed(2)}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {(() => {
                            if (!door.model || !door.price_type) return '-';
                            const product = productsList.find((p: any) => p.id === door.model);
                            const priceType = product?.salePrices?.find(
                              (p: any) => p.priceType.id === door.price_type
                            )?.priceType?.name || '-';
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
                          value={editingDoor?.price?.toString() || ''}
                          onChange={(e) => handleFieldChange('price', e.target.value)}
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
                          value={editingDoor?.quantity || ''}
                          onChange={(e) => handleFieldChange('quantity', e.target.value)}
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
                          value={editingDoor?.height?.toString() || ''}
                          onChange={(e) => handleFieldChange('height', e.target.value)}
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
                          value={editingDoor?.width?.toString() || ''}
                          onChange={(e) => handleFieldChange('width', e.target.value)}
                          className="w-20"
                        />
                      ) : (
                        <span>{door.width || 0}</span>
                      )}
                    </TableCell>
                    
                    {/* Material */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.material || ''}
                          onValueChange={(value) => handleFieldChange('material', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("placeholders.select_material")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.materialOptions?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.materialOptions?.find((opt: any) => opt.value === door.material)?.label || '-'}
                        </span>
                      )}
                    </TableCell>
                    
                    {/* Color */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.color || ''}
                          onValueChange={(value) => handleFieldChange('color', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("placeholders.select_color")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.colorOptions?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.colorOptions?.find((opt: any) => opt.value === door.color)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Material Type */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.material_type || ''}
                          onValueChange={(value) => handleFieldChange('material_type', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("placeholders.select_material_type")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.materialTypeOptions?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.materialTypeOptions?.find((opt: any) => opt.value === door.material_type)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Massif */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.massif || ''}
                          onValueChange={(value) => handleFieldChange('massif', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("placeholders.select_massif")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.massifOptions?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.massifOptions?.find((opt: any) => opt.value === door.massif)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Patina Color */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.patina_color || ''}
                          onValueChange={(value) => handleFieldChange('patina_color', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("placeholders.select_patina_color")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.patinaColorOptions?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.patinaColorOptions?.find((opt: any) => opt.value === door.patina_color)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Beading Main */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.beading_main || ''}
                          onValueChange={(value) => handleFieldChange('beading_main', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder={t("placeholders.select_beading_main")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.beadingMainOptions?.map((option: any) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.beadingMainOptions?.find((opt: any) => opt.value === door.beading_main)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Glass Type */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.glass_type || ''}
                          onValueChange={(value) => handleFieldChange('glass_type', value)}
                        >
                          <SelectTrigger className="w-32">
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
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.glassTypeOptions?.find((opt: any) => opt.value === door.glass_type)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Threshold */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Select
                          value={editingDoor?.threshold || ''}
                          onValueChange={(value) => handleFieldChange('threshold', value)}
                        >
                          <SelectTrigger className="w-32">
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
                      ) : (
                        <span className="truncate max-w-[100px]">
                          {fieldOptions.thresholdOptions?.find((opt: any) => opt.value === door.threshold)?.label || '-'}
                        </span>
                      )}
                    </TableCell>

                    {/* Extensions */}
                    <TableCell>
                     <div > 
                       {editingIndex === index ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {editingDoor?.extensions?.length || 0}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[95vw]">
                            <DialogHeader>
                              <DialogTitle>{t("forms.manage_extensions")}</DialogTitle>
                            </DialogHeader>
                            <AccessoryManager
                              items={editingDoor?.extensions || []}
                              onUpdate={(items) => handleFieldChange('extensions', items)}
                              type="extension"
                              fieldOptions={fieldOptions}
                              doorData={editingDoor}
                              productsList={productsList}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-xs">
                          {door.extensions?.length || 0} items
                        </span>
                      )}
                     </div>
                    </TableCell>

                    {/* Casings */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {editingDoor?.casings?.length || 0}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[95vw]">
                            <DialogHeader>
                              <DialogTitle>{t("forms.manage_casings")}</DialogTitle>
                            </DialogHeader>
                            <AccessoryManager
                              items={editingDoor?.casings || []}
                              onUpdate={(items) => handleFieldChange('casings', items)}
                              type="casing"
                              fieldOptions={fieldOptions}
                              doorData={editingDoor}
                              productsList={productsList}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-xs">
                          {door.casings?.length || 0} items
                        </span>
                      )}
                    </TableCell>

                    {/* Crowns */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {editingDoor?.crowns?.length || 0}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[95vw]">
                            <DialogHeader>
                              <DialogTitle>{t("forms.manage_crowns")}</DialogTitle>
                            </DialogHeader>
                            <AccessoryManager
                              items={editingDoor?.crowns || []}
                              onUpdate={(items) => handleFieldChange('crowns', items)}
                              type="crown"
                              fieldOptions={fieldOptions}
                              doorData={editingDoor}
                              productsList={productsList}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-xs">
                          {door.crowns?.length || 0} items
                        </span>
                      )}
                    </TableCell>

                    {/* Accessories */}
                    <TableCell>
                      {editingIndex === index ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {editingDoor?.accessories?.length || 0}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-[95vw]">
                            <DialogHeader>
                              <DialogTitle>{t("forms.manage_accessories")}</DialogTitle>
                            </DialogHeader>
                            <AccessoryManager
                              items={editingDoor?.accessories || []}
                              onUpdate={(items) => handleFieldChange('accessories', items)}
                              type="accessory"
                              fieldOptions={fieldOptions}
                              doorData={editingDoor}
                              productsList={productsList}
                            />
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-xs">
                          {door.accessories?.length || 0} items
                        </span>
                      )}
                    </TableCell>
                    
                    {/* Total */}
                    <TableCell>
                      <span className="font-semibold text-blue-600">
                        {(() => {
                          // Helper function to convert values with comma to number
                          const convertToNumber = (value: any, defaultValue: number = 0) => {
                            if (typeof value === 'number') return value;
                            if (typeof value === 'string') {
                              const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                              if (normalized === '' || normalized === '.') return defaultValue;
                              const parsed = parseFloat(normalized);
                              return isNaN(parsed) ? defaultValue : parsed;
                            }
                            return defaultValue;
                          };

                          let total = convertToNumber(door.price, 0) * parseInt(door.quantity || 1);
                          // Add extensions total
                          const extensionsTotal = (door.extensions || []).reduce((sum: number, item: any) => 
                            sum + (convertToNumber(item.price, 0) * parseInt(item.quantity || 1)), 0);
                          // Add casings total
                          const casingsTotal = (door.casings || []).reduce((sum: number, item: any) => 
                            sum + (convertToNumber(item.price, 0) * parseInt(item.quantity || 1)), 0);
                          // Add crowns total
                          const crownsTotal = (door.crowns || []).reduce((sum: number, item: any) => 
                            sum + (convertToNumber(item.price, 0) * parseInt(item.quantity || 1)), 0);
                          // Add accessories total
                          const accessoriesTotal = (door.accessories || []).reduce((sum: number, item: any) => 
                            sum + (convertToNumber(item.price, 0) * parseInt(item.quantity || 1)), 0);
                          total += extensionsTotal + casingsTotal + crownsTotal + accessoriesTotal;
                          return total.toFixed(2);
                        })()}
                      </span>
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
                    <TableCell colSpan={20} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <DoorOpen className="h-8 w-8 text-gray-400" />
                        <p>{t("forms.no_doors_added")}</p>
                        <p className="text-sm">{t("forms.click_add_row_to_start")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
// Door Product Select Component for async product search
function DoorProductSelect({ value, onChange, placeholder, productsList = [], onProductSelect }: {
  value: any,
  onChange: (value: any) => void,
  placeholder: string,
  productsList?: any[],
  onProductSelect?: (product: any) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>(productsList || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Effect 1: Sync component with the initial value from the parent form
  useEffect(() => {
    if (value && productsList.length > 0 && (!selectedProduct || selectedProduct.id !== value)) {
      const product = productsList.find(p => p.id === value);
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
        const res = await api.get(`products?search=${encodeURIComponent(searchQuery)}`);
        const results = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setProducts(results);
      } catch (error) {
        console.error('Error searching products:', error);
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
    if (newQuery === '') {
      setSelectedProduct(null);
      onChange('');
      setIsOpen(true);
    }
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSearchQuery(product.name || '');
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
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-auto">
          {isLoading ? (
            <div className="p-2 text-center text-gray-500">Loading...</div>
          ) : products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className={`p-2 hover:bg-gray-100 cursor-pointer text-sm ${selectedProduct?.id === product.id ? 'bg-blue-50 font-medium' : ''
                  }`}
                // Use onMouseDown to ensure it fires before the input's onBlur event
                onMouseDown={() => handleProductSelect(product)}
              >
                {product.name}
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-gray-500">
              {searchQuery.length > 1 ? "No products found" : "Type to search..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// Accessory Manager Component for managing extensions, casings, crowns, and accessories
function AccessoryManager({ items, onUpdate, type, fieldOptions, doorData, productsList = [] }: { 
  items: any[], 
  onUpdate: (items: any[]) => void, 
  type: string, 
  fieldOptions: any,
  doorData?: any, // Pass door data for calculations
  productsList?: any[] // Pass productsList for product resolution
}) {
  const { t } = useTranslation();
  const [crownSize, setCrownSize] = useState<number>(0);
  const [casingSize, setCasingSize] = useState<number>(0);

  // Helper function to convert values with comma to number
  const convertToNumber = (value: any, defaultValue: number = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
      if (normalized === '' || normalized === '.') return defaultValue;
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  // Fetch crown_size and casing_size from attribute settings API
  useEffect(() => {
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
            setCrownSize(isNaN(size) ? 0 : size);
          }
          
          if (found.casing_size !== undefined) {
            const size = typeof found.casing_size === "number" 
              ? found.casing_size 
              : parseFloat(found.casing_size);
            setCasingSize(isNaN(size) ? 0 : size);
          }
        }
      })
      .catch(() => {
        setCrownSize(0);
        setCasingSize(0);
      });
  }, []);

  const addItem = () => {
    const doorWidth = convertToNumber(doorData?.width, 0);
    const doorHeight = convertToNumber(doorData?.height, 0);
    
    const newItem = type === 'extension' 
      ? { model: '', price: 0, quantity: 1, height: 0, width: 0 }
      : type === 'casing'
      ? { 
          model: '', 
          price: 0, 
          quantity: 1, 
          height: doorHeight, // Default to door height
          width: casingSize, // Default to casing size
          casing_type: '', 
          casing_formula: '',
          casing_range: ''
        }
      : type === 'crown'
      ? { 
          model: '', 
          price: 0, 
          quantity: 1, 
          width: doorWidth + crownSize // Auto-calculate crown width
        }
      : { model: '', price: 0, quantity: 1, accessory_type: '' };
    
    onUpdate([...items, newItem]);
  };

  const updateItem = (index: number, field: string, value: any, productData?: any) => {
    console.log('AccessoryManager updateItem called - field:', field, 'value:', value, 'productData:', productData); // Debug log
    if (field === 'model' && value === '') {
      console.log('WARNING: AccessoryManager model field being set to empty string!'); // Debug log
      console.trace('Stack trace for empty model value in AccessoryManager'); // Stack trace
    }
    
    // Handle comma-separated decimal numbers for numeric fields - keep as strings during editing
    if (field === 'price' || field === 'height' || field === 'width') {
      if (typeof value === 'string') {
        // Clean the input - replace comma with dot and remove any non-numeric characters except dots
        let cleanedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
        
        // Handle multiple dots - keep only the first one
        const parts = cleanedValue.split('.');
        if (parts.length > 2) {
          cleanedValue = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Keep as string to preserve partial input like "0." or "0"
        value = cleanedValue;
      }
    }
    
    const updatedItems = [...items];
    const item = { ...updatedItems[index], [field]: value };
    
    // Auto-set price when product is selected (but only if not already set)
    if (field === 'model' && productData && productData.salePrices && !item.price_type) {
      if (productData.salePrices.length === 1) {
        // If only one price type, automatically set it
        item.price_type = productData.salePrices[0].priceType.id;
        item.price = productData.salePrices[0].value / 100;
      } else if (productData.salePrices.length > 1) {
        // If multiple price types, find optom (wholesale) or for sale (retail) and set default
        const optomPrice = productData.salePrices.find((p: any) => 
          p.priceType.name?.toLowerCase().includes('optom') || 
          p.priceType.name?.toLowerCase().includes('wholesale')
        );
        const salePrice = productData.salePrices.find((p: any) => 
          p.priceType.name?.toLowerCase().includes('sale') || 
          p.priceType.name?.toLowerCase().includes('retail')
        );
        
        // Default to optom price if available, otherwise use sale price, otherwise use first available
        const defaultPrice = optomPrice || salePrice || productData.salePrices[0];
        item.price_type = defaultPrice.priceType.id;
        item.price = defaultPrice.value / 100;
      }
    }
    
    // Auto-calculate dimensions for casings based on type and formula
    if (type === 'casing' && doorData) {
      const doorWidth = convertToNumber(doorData.width, 0);
      const doorHeight = convertToNumber(doorData.height, 0);
      
      if (field === 'casing_type' || field === 'casing_formula' || field === 'casing_range') {
        if (item.casing_formula === 'formula2' && item.casing_range) {
          // Find the selected casing range object to get its casing_size
          const selectedRange = fieldOptions.casingRangeOptions?.find(
            (range: any) => range.value === String(item.casing_range)
          );
          if (selectedRange && selectedRange.casing_size !== undefined) {
            item.height = selectedRange.casing_size;
          }
        } else if (item.casing_formula === 'formula1' || !item.casing_formula) {
          // Original logic using door dimensions
          if (item.casing_type === "боковой") {
            item.height = doorHeight + casingSize;
          } else if (item.casing_type === "прямой") {
            item.height = doorWidth + (2 * casingSize);
          }
        }
        
        // Always set width to casingSize for casings
        item.width = casingSize;
      }
    }
    
    // Auto-calculate crown width
    if (type === 'crown' && doorData && field !== 'width') {
      const doorWidth = convertToNumber(doorData.width, 0);
      item.width = doorWidth + crownSize;
    }
    
    updatedItems[index] = item;
    onUpdate(updatedItems);
  };

  const removeItem = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto ">
      <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b">
        <h4 className="font-medium text-lg">{t(`forms.manage_${type}s`)}</h4>
        <Button size="sm" onClick={addItem} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          {t("common.add")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <Package className="h-8 w-8 mx-auto" />
          </div>
          <p className="text-gray-500">{t(`forms.no_${type}s_added`)}</p>
        </div>
      ) : (
        <div className="space-y-4 ">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-blue-600">
                  {t(`forms.${type}`)} #{index + 1}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Model */}
                <div className="col-span-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {t("forms.model")} *
                  </label>
                  <DoorProductSelect
                    value={item.model}
                    onChange={(value) => updateItem(index, 'model', value)}
                    onProductSelect={(product) => {
                      // Don't call updateItem for model again since onChange already handles it
                      // Just pass the product data for price setting
                      updateItem(index, 'model', product.id, product);
                    }}
                    placeholder={t(`placeholders.select_${type}_model`)}
                    productsList={productsList}
                  />
                </div>

                {/* Price Type (show only if product has multiple price types) */}
                {item.model && (() => {
                  const product = productsList.find(p => p.id === item.model);
                  return product && product.salePrices && product.salePrices.length > 1;
                })() && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {t("forms.price_type")} *
                    </label>
                    <select
                      value={item.price_type || ''}
                      onChange={(e) => {
                        const selectedPriceTypeId = e.target.value;
                        updateItem(index, 'price_type', selectedPriceTypeId);
                        
                        // Update price when price type changes
                        const product = productsList.find(p => p.id === item.model);
                        if (product && product.salePrices) {
                          const selectedPrice = product.salePrices.find(
                            (p: any) => p.priceType.id === selectedPriceTypeId
                          );
                          if (selectedPrice) {
                            updateItem(index, 'price', selectedPrice.value / 100);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t("placeholders.select_price_type")}</option>
                      {(() => {
                        const product = productsList.find(p => p.id === item.model);
                        return product && product.salePrices 
                          ? product.salePrices.map((p: any) => (
                              <option key={p.priceType.id} value={p.priceType.id}>
                                {p.priceType.name}
                              </option>
                            ))
                          : [];
                      })()}
                    </select>
                  </div>
                )}

                {/* Price */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {t("forms.price")} *
                  </label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={item.price?.toString() || ''}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    placeholder="0.00"
                    readOnly={(() => {
                      const product = productsList.find(p => p.id === item.model);
                      return product && product.salePrices && product.salePrices.length > 0;
                    })()}
                    className={(() => {
                      const product = productsList.find(p => p.id === item.model);
                      return product && product.salePrices && product.salePrices.length > 0 
                        ? 'bg-gray-100' : '';
                    })()}
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    {t("forms.quantity")} *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    placeholder="1"
                  />
                </div>

                {/* Conditional fields based on type */}
                {(type === 'extension' || type === 'casing') && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("forms.height")} {type === 'casing' ? '(auto-calculated)' : ''}
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.height?.toString() || ''}
                        onChange={(e) => updateItem(index, 'height', e.target.value)}
                        disabled={type === 'casing'}
                        placeholder="0.0"
                        className={type === 'casing' ? 'bg-gray-100' : ''}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("forms.width")} {type === 'casing' ? '(auto-calculated)' : ''}
                      </label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={item.width?.toString() || ''}
                        onChange={(e) => updateItem(index, 'width', e.target.value)}
                        disabled={type === 'casing'}
                        placeholder="0.0"
                        className={type === 'casing' ? 'bg-gray-100' : ''}
                      />
                    </div>
                  </>
                )}

                {type === 'crown' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {t("forms.width")} (auto-calculated)
                    </label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={item.width?.toFixed(2)}
                      disabled
                      placeholder="0.0"
                      className="bg-gray-100"
                    />
                  </div>
                )}

                {type === 'casing' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("forms.casing_type")} *
                      </label>
                      <Select
                        value={item.casing_type || ''}
                        onValueChange={(value) => updateItem(index, 'casing_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("placeholders.select_casing_type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="боковой">{t("forms.casing_type_side")}</SelectItem>
                          <SelectItem value="прямой">{t("forms.casing_type_straight")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("forms.casing_formula")} *
                      </label>
                      <Select
                        value={item.casing_formula || ''}
                        onValueChange={(value) => updateItem(index, 'casing_formula', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("placeholders.select_casing_formula")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formula1">{t("forms.formula_1")}</SelectItem>
                          <SelectItem value="formula2">{t("forms.formula_2")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {item.casing_formula === 'formula2' && (
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          {t("forms.casing_range")} *
                        </label>
                        <Select
                          value={item.casing_range || ''}
                          onValueChange={(value) => updateItem(index, 'casing_range', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("placeholders.select_casing_range")} />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldOptions.casingRangeOptions?.map((range: any) => (
                              <SelectItem key={range.value} value={range.value}>
                                {range.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                {type === 'accessory' && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {t("forms.accessory_type")} *
                    </label>
                    <Select
                      value={item.accessory_type || ''}
                      onValueChange={(value) => updateItem(index, 'accessory_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("placeholders.select_accessory_type")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cube">{t("accessory_types.cube")}</SelectItem>
                        <SelectItem value="leg">{t("accessory_types.leg")}</SelectItem>
                        <SelectItem value="glass">{t("accessory_types.glass")}</SelectItem>
                        <SelectItem value="lock">{t("accessory_types.lock")}</SelectItem>
                        <SelectItem value="topsa">{t("accessory_types.topsa")}</SelectItem>
                        <SelectItem value="beading">{t("accessory_types.beading")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Item total */}
                <div className="col-span-1 md:col-span-2 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t("forms.item_total")}:</span>
                    <span className="font-semibold text-blue-600">
                      {((convertToNumber(item.price, 0) * parseInt(item.quantity || 1)) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total for all items */}
      {items.length > 0 && (
        <div className="sticky bottom-0 bg-white pt-4 border-t">
          <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
            <span className="font-medium text-blue-700">
              {t("forms.total")} {t(`forms.${type}s`)}:
            </span>
            <span className="font-bold text-blue-600 text-lg">
              {items.reduce((total, item) => 
                total + (convertToNumber(item.price, 0) * parseInt(item.quantity || 1)), 0
              ).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StepThree({ orderForm, doors, totals, isLoading, onSubmit, onBack, discount_percentage, advance_payment, discountAmountInput, setDiscountAmountInput }: any) {
  const { t } = useTranslation();

  // Helper function to convert values with comma to number
  const convertToNumber = (value: any, defaultValue: number = 0) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
      if (normalized === '' || normalized === '.') return defaultValue;
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  const advance = convertToNumber(advance_payment, 0);

  // Calculate detailed subtotals
  const priceBreakdown = doors.reduce(
    (acc: any, door: any) => {
      const qty = parseInt(door.quantity || 1);
      const doorPrice = convertToNumber(door.price, 0) * qty;
      acc.doors += doorPrice;

      const sumItems = (items: any[]) =>
        items?.reduce((sum, item) => sum + convertToNumber(item.price, 0) * (item.quantity || 1), 0) || 0;

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
              {/* Discount and Payment Fields */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800">{t("forms.discount")} & {t("forms.advance_payment")}</h4>
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
                          value={discountAmountInput || ''}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => {
                            let value = e.target.value;
                            // Handle comma as decimal separator
                            if (typeof value === 'string') {
                              let cleanedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                              const parts = cleanedValue.split('.');
                              if (parts.length > 2) {
                                cleanedValue = parts[0] + '.' + parts.slice(1).join('');
                              }
                              value = cleanedValue;
                            }
                            const amount = parseFloat(value) || 0;
                            setDiscountAmountInput(amount);
                            // Update percentage for display purposes
                            const percentage = totals.totalAmount > 0 ? (amount / totals.totalAmount * 100) : 0;
                            orderForm.setValue("discount_percentage", percentage.toFixed(2));
                          }}
                        />
                        <span className="text-xs text-gray-500 mt-1 block">{t("forms.discount_amount")}</span>
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
                              if (typeof value === 'string') {
                                let cleanedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                                const parts = cleanedValue.split('.');
                                if (parts.length > 2) {
                                  cleanedValue = parts[0] + '.' + parts.slice(1).join('');
                                }
                                value = cleanedValue;
                              }
                              const percentage = parseFloat(value) || 0;
                              const amount = totals.totalAmount * (percentage / 100);
                              setDiscountAmountInput(amount);
                            }
                          })}
                        />
                        <span className="text-xs text-gray-500 mt-1 block text-center">%</span>
                      </div>
                    </div>
                    {(discount_percentage > 0 || discountAmountInput > 0) && (
                      <p className="text-sm text-green-600">
                        {t("forms.discount_amount")}: {discountAmountInput > 0 ? discountAmountInput.toFixed(0) : (totals.totalAmount * (discount_percentage / 100)).toFixed(0)} сум 
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
                          if (typeof value === 'string') {
                            let cleanedValue = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
                            const parts = cleanedValue.split('.');
                            if (parts.length > 2) {
                              cleanedValue = parts[0] + '.' + parts.slice(1).join('');
                            }
                            e.target.value = cleanedValue;
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("forms.subtotal")}</span>
                  <span className="font-semibold">{totals.totalAmount.toFixed(0)} сум</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>{t("forms.discount")} ({discount_percentage || 0}%)</span>
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



