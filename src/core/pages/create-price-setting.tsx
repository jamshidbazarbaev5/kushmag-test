import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import {
  type PriceSetting,
  type PriceType,
  useCreatePriceSetting,
  useGetPriceTypes,
  PRODUCT_CHOICES,
} from "../api/priceSettings";

const priceSettingFields = (
  t: (key: string, options?: Record<string, unknown>) => string,
  priceTypes: PriceType[],
) => [
  {
    name: "product",
    label: t("forms.product"),
    type: "select",
    placeholder: t("placeholders.select_product"),
    required: true,
    options: PRODUCT_CHOICES.map((choice) => ({
      value: choice.value,
      label: choice.label,
    })),
  },
  {
    name: "price_type",
    label: t("forms.price_type"),
    type: "select",
    placeholder: t("placeholders.select_price_type"),
    required: true,
    options: priceTypes.map((priceType) => ({
      value: priceType.id,
      label: priceType.name,
    })),
  },
];

export default function CreatePriceSettingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: priceTypes = [], isLoading: isLoadingPriceTypes } =
    useGetPriceTypes();
  const { mutate: createPriceSetting, isPending: isCreating } =
    useCreatePriceSetting();

  const fields = priceSettingFields(t, priceTypes);

  const handleSubmit = (data: Partial<PriceSetting>) => {
    createPriceSetting(data as Omit<PriceSetting, "id">, {
      onSuccess: () => {
        toast.success(
          t("messages.success.created", {
            item: t("navigation.price_settings"),
          }),
        );
        navigate("/price-settings");
      },
      onError: () =>
        toast.error(
          t("messages.error.create", { item: t("navigation.price_settings") }),
        ),
    });
  };



  if (isLoadingPriceTypes) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto">
        <h1 className="text-2xl font-bold">
         {t("navigation.price_settings")}
        </h1>
      </div>

        <ResourceForm
          fields={fields}
          onSubmit={handleSubmit}
          isSubmitting={isCreating}
        />
        
    </div>
  );
}
