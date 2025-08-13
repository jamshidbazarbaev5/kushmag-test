import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ResourceTable } from "../helpers/ResourceTable";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ResourceForm } from "../helpers/ResourceForm";
import { toast } from "sonner";
import {
  type PriceSetting,
  type PriceSettingWithPriceType,
  type PriceType,
  useGetPriceSettings,
  useUpdatePriceSetting,
  useDeletePriceSetting,
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

const columns = (
  t: (key: string, options?: Record<string, unknown>) => string,
) => [
  {
    header: t("forms.product"),
    accessorKey: "product",
    cell: (
      row: PriceSettingWithPriceType & {
        displayId: number;
        price_type_name: string;
      },
    ) => {
      const productChoice = PRODUCT_CHOICES.find(
        (choice) => choice.value === row.product,
      );
      return productChoice ? productChoice.label : row.product;
    },
  },
  {
    header: t("forms.price_type"),
    accessorKey: "price_type_name",
  },
];

export default function PriceSettingsPage() {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPriceSetting, setEditingPriceSetting] =
    useState<PriceSettingWithPriceType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  const { data: priceSettingsData, isLoading } = useGetPriceSettings({
    params: {
      product: searchTerm,
    },
  }) as { data: PriceSettingWithPriceType[] | undefined; isLoading: boolean };

  const { data: priceTypes = [], isLoading: isLoadingPriceTypes } =
    useGetPriceTypes();

  const fields = priceSettingFields(t, priceTypes);

  // Get the price settings array directly from the response
  const priceSettings = priceSettingsData || [];

  // Enhance price settings with display ID and price type name
  const enhancedPriceSettings = priceSettings.map(
    (priceSetting: PriceSettingWithPriceType, index: number) => {
      const priceType = priceTypes.find(
        (pt) => pt.id === priceSetting.price_type,
      );
      return {
        ...priceSetting,
        displayId: index + 1,
        price_type_name: priceType?.name || priceSetting.price_type,
      };
    },
  );

  const { mutate: updatePriceSetting, isPending: isUpdating } =
    useUpdatePriceSetting();
  const { mutate: deletePriceSetting } = useDeletePriceSetting();

  const handleEdit = (priceSetting: PriceSettingWithPriceType) => {
    setEditingPriceSetting(priceSetting);
    setIsFormOpen(true);
  };

  const handleUpdateSubmit = (data: Partial<PriceSetting>) => {
    if (!editingPriceSetting?.id) return;

    updatePriceSetting(
      { ...data, id: editingPriceSetting.id } as PriceSetting,
      {
        onSuccess: () => {
          toast.success(
            t("messages.success.updated", {
              item: t("navigation.price_settings"),
            }),
          );
          setIsFormOpen(false);
          setEditingPriceSetting(null);
        },
        onError: () =>
          toast.error(
            t("messages.error.update", {
              item: t("navigation.price_settings"),
            }),
          ),
      },
    );
  };

  const handleDelete = (id: number) => {
    deletePriceSetting(id, {
      onSuccess: () =>
        toast.success(
          t("messages.success.deleted", {
            item: t("navigation.price_settings"),
          }),
        ),
      onError: () =>
        toast.error(
          t("messages.error.delete", { item: t("navigation.price_settings") }),
        ),
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("navigation.price_settings")}</h1>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={t("placeholders.search_product")}
          className="w-full p-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <ResourceTable
        data={enhancedPriceSettings}
        columns={columns(t)}
        isLoading={isLoading || isLoadingPriceTypes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => navigate("/create-price-setting")}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <ResourceForm
            fields={fields}
            onSubmit={handleUpdateSubmit}
            defaultValues={editingPriceSetting || {}}
            isSubmitting={isUpdating}
            title={t("messages.edit")}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
