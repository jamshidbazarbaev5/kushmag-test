import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";


// Import all API hooks
import { useGetMaterials, useCreateMaterial, useUpdateMaterial, useDeleteMaterial, type Material } from "../api/material";
import { useGetMaterialTypes, useCreateMaterialType, useUpdateMaterialType, useDeleteMaterialType } from "../api/materialType";
import { useGetMassifs, useCreateMassif, useUpdateMassif, useDeleteMassif } from "../api/massif";
import { useGetColors, useCreateColor, useUpdateColor, useDeleteColor } from "../api/color";
import { useGetPatinaColors, useCreatePatinaColor, useUpdatePatinaColor, useDeletePatinaColor } from "../api/patinaColor";
import { useGetBeadings, useCreateBeading, useUpdateBeading, useDeleteBeading } from "../api/beading";
import { useGetGlassTypes, useCreateGlassType, useUpdateGlassType, useDeleteGlassType } from "../api/glassType";
import { useGetThresholds, useCreateThreshold, useUpdateThreshold, useDeleteThreshold } from "../api/threshold";
import { useGetAttributeSettings, useUpdateAttributeSettings } from "../api/attributeSettings";
import { useGetCasingRanges, useCreateCasingRange, useUpdateCasingRange, useDeleteCasingRange } from "../api/casingRange";
import { useGetPriceSettings, useCreatePriceSetting, useUpdatePriceSetting, useDeletePriceSetting, useGetPriceTypes, PRODUCT_CHOICES } from "../api/priceSettings";

// Import types
import type { MaterialType, Massif, Color, PatinaColor, Beading, GlassType, Threshold, AttributeSettings, CasingRange } from "../api/types";
import type { PriceSettingWithPriceType } from "../api/priceSettings";

// Import the new inline editable table component
import { InlineEditableTable, type TableField } from "../helpers/InlineEditableTable";



export default function SettingsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  // Search states for each section (immediate input values)
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialTypeSearch, setMaterialTypeSearch] = useState('');
  const [massifSearch, setMassifSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [patinaColorSearch, setPatinaColorSearch] = useState('');
  const [beadingSearch, setBeadingSearch] = useState('');
  const [glassTypeSearch, setGlassTypeSearch] = useState('');
  const [thresholdSearch, setThresholdSearch] = useState('');
  const [casingRangeSearch, setCasingRangeSearch] = useState('');
  const [priceSettingSearch, setPriceSettingSearch] = useState('');

  // Pagination states for each section
  const [materialPage, setMaterialPage] = useState(1);
  const [materialPageSize, setMaterialPageSize] = useState(20);
  const [materialTypePageSize, setMaterialTypePageSize] = useState(20);
  const [materialTypePage, setMaterialTypePage] = useState(1);
  const [massifPage, setMassifPage] = useState(1);
  const [massifPageSize, setMassifPageSize] = useState(20);
  const [colorPage, setColorPage] = useState(1);
  const [colorPageSize, setColorPageSize] = useState(20);
  const [patinaColorPage, setPatinaColorPage] = useState(1);
  const [patinaColorPageSize, setPatinaColorPageSize] = useState(20);
  const [beadingPage, setBeadingPage] = useState(1);
  const [beadingPageSize, setBeadingPageSize] = useState(20);
  const [glassTypePage, setGlassTypePage] = useState(1);
  const [glassTypePageSize, setGlassTypePageSize] = useState(20);
  const [thresholdPage, setThresholdPage] = useState(1);
  const [thresholdPageSize, setThresholdPageSize] = useState(20);
  const [casingRangePage, setCasingRangePage] = useState(1);
  const [casingRangePageSize, setCasingRangePageSize] = useState(20);
  const [priceSettingPage, setPriceSettingPage] = useState(1);
  const [priceSettingPageSize, setPriceSettingPageSize] = useState(20);

  // Debounced search states (used for API calls)
  const [debouncedMaterialSearch, setDebouncedMaterialSearch] = useState('');
  const [debouncedMaterialTypeSearch, setDebouncedMaterialTypeSearch] = useState('');
  const [debouncedMassifSearch, setDebouncedMassifSearch] = useState('');
  const [debouncedColorSearch, setDebouncedColorSearch] = useState('');
  const [debouncedPatinaColorSearch, setDebouncedPatinaColorSearch] = useState('');
  const [debouncedBeadingSearch, setDebouncedBeadingSearch] = useState('');
  const [debouncedGlassTypeSearch, setDebouncedGlassTypeSearch] = useState('');
  const [debouncedThresholdSearch, setDebouncedThresholdSearch] = useState('');
  const [_debouncedCasingRangeSearch, setDebouncedCasingRangeSearch] = useState('');
  const [debouncedPriceSettingSearch, setDebouncedPriceSettingSearch] = useState('');

  // Debounce effects for search terms
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedMaterialSearch(materialSearch), 300);
    return () => clearTimeout(timeout);
  }, [materialSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedMaterialTypeSearch(materialTypeSearch), 300);
    return () => clearTimeout(timeout);
  }, [materialTypeSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedMassifSearch(massifSearch), 300);
    return () => clearTimeout(timeout);
  }, [massifSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedColorSearch(colorSearch), 300);
    return () => clearTimeout(timeout);
  }, [colorSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPatinaColorSearch(patinaColorSearch), 300);
    return () => clearTimeout(timeout);
  }, [patinaColorSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedBeadingSearch(beadingSearch), 300);
    return () => clearTimeout(timeout);
  }, [beadingSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedGlassTypeSearch(glassTypeSearch), 300);
    return () => clearTimeout(timeout);
  }, [glassTypeSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedThresholdSearch(thresholdSearch), 300);
    return () => clearTimeout(timeout);
  }, [thresholdSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedCasingRangeSearch(casingRangeSearch), 300);
    return () => clearTimeout(timeout);
  }, [casingRangeSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedPriceSettingSearch(priceSettingSearch), 300);
    return () => clearTimeout(timeout);
  }, [priceSettingSearch]);

  // Reset pagination when search terms change
  useEffect(() => {
    setMaterialPage(1);
  }, [debouncedMaterialSearch]);

  useEffect(() => {
    setMaterialTypePage(1);
  }, [debouncedMaterialTypeSearch]);

  useEffect(() => {
    setMassifPage(1);
  }, [debouncedMassifSearch]);

  useEffect(() => {
    setColorPage(1);
  }, [debouncedColorSearch]);

  useEffect(() => {
    setPatinaColorPage(1);
  }, [debouncedPatinaColorSearch]);

  useEffect(() => {
    setBeadingPage(1);
  }, [debouncedBeadingSearch]);

  useEffect(() => {
    setGlassTypePage(1);
  }, [debouncedGlassTypeSearch]);

  useEffect(() => {
    setThresholdPage(1);
  }, [debouncedThresholdSearch]);

  useEffect(() => {
    setCasingRangePage(1);
  }, [_debouncedCasingRangeSearch]);

  useEffect(() => {
    setPriceSettingPage(1);
  }, [debouncedPriceSettingSearch]);

  // API hooks for fetching data (using debounced search terms and pagination)
  const { data: materialsResponse, isLoading: materialsLoading } = useGetMaterials({
    params: {
      search: debouncedMaterialSearch,
      page: materialPage,
      page_size: materialPageSize
    }
  });
  const { data: materialTypesResponse, isLoading: materialTypesLoading } = useGetMaterialTypes({
    params: {
      search: debouncedMaterialTypeSearch,
      page: materialTypePage,
      page_size: materialTypePageSize
    }
  });
  const { data: massifsResponse, isLoading: massifsLoading } = useGetMassifs({
    params: {
      search: debouncedMassifSearch,
      page: massifPage,
      page_size: massifPageSize
    }
  });
  const { data: colorsResponse, isLoading: colorsLoading } = useGetColors({
    params: {
      search: debouncedColorSearch,
      page: colorPage,
      page_size: colorPageSize
    }
  });
  const { data: patinaColorsResponse, isLoading: patinaColorsLoading } = useGetPatinaColors({
    params: {
      search: debouncedPatinaColorSearch,
      page: patinaColorPage,
      page_size: patinaColorPageSize
    }
  });
  const { data: beadingsResponse, isLoading: beadingsLoading } = useGetBeadings({
    params: {
      search: debouncedBeadingSearch,
      page: beadingPage,
      page_size: beadingPageSize
    }
  });
  const { data: glassTypesResponse, isLoading: glassTypesLoading } = useGetGlassTypes({
    params: {
      search: debouncedGlassTypeSearch,
      page: glassTypePage,
      page_size: glassTypePageSize
    }
  });
  const { data: thresholdsResponse, isLoading: thresholdsLoading } = useGetThresholds({
    params: {
      search: debouncedThresholdSearch,
      page: thresholdPage,
      page_size: thresholdPageSize
    }
  });
  const { data: attributeSettingsResponse, isLoading: attributeSettingsLoading } = useGetAttributeSettings();
  const { data: casingRangesResponse, isLoading: casingRangesLoading } = useGetCasingRanges({
    params: {
      search: _debouncedCasingRangeSearch,
      page: casingRangePage,
      page_size: casingRangePageSize
    }
  });
  const { data: priceSettingsResponse, isLoading: priceSettingsLoading } = useGetPriceSettings({
    params: {
      search: debouncedPriceSettingSearch,
      page: priceSettingPage,
      page_size: priceSettingPageSize
    }
  });
  const { data: priceTypesData } = useGetPriceTypes();

  // Helper function to extract data and pagination info from API responses
  const extractPaginatedData = (response: any, pageSize: number, currentPage: number) => {
    if (!response) return { data: [], pagination: null };

    // Check if response has pagination structure
    if (response.results && typeof response.count === 'number') {
      const totalPages = Math.ceil(response.count / pageSize);
      return {
        data: response.results,
        pagination: {
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage,
          totalPages,
          pageSize
        }
      };
    }

    // Fallback for non-paginated responses
    return {
      data: Array.isArray(response) ? response : [],
      pagination: null
    };
  };

  // Extract arrays and pagination info from API responses
  const { data: materialsData, pagination: materialsPagination } = extractPaginatedData(materialsResponse, materialPageSize, materialPage);
  const { data: materialTypesData, pagination: materialTypesPagination } = extractPaginatedData(materialTypesResponse, materialTypePageSize, materialTypePage);
  const { data: massifsData, pagination: massifsPagination } = extractPaginatedData(massifsResponse, massifPageSize, massifPage);
  const { data: colorsData, pagination: colorsPagination } = extractPaginatedData(colorsResponse, colorPageSize, colorPage);
  const { data: patinaColorsData, pagination: patinaColorsPagination } = extractPaginatedData(patinaColorsResponse, patinaColorPageSize, patinaColorPage);
  const { data: beadingsData, pagination: beadingsPagination } = extractPaginatedData(beadingsResponse, beadingPageSize, beadingPage);
  const { data: glassTypesData, pagination: glassTypesPagination } = extractPaginatedData(glassTypesResponse, glassTypePageSize, glassTypePage);
  const { data: thresholdsData, pagination: thresholdsPagination } = extractPaginatedData(thresholdsResponse, thresholdPageSize, thresholdPage);
  const attributeSettingsData = Array.isArray(attributeSettingsResponse) ? attributeSettingsResponse : [];
  const { data: casingRangesData, pagination: casingRangesPagination } = extractPaginatedData(casingRangesResponse, casingRangePageSize, casingRangePage);
  const { data: priceSettingsData, pagination: priceSettingsPagination } = extractPaginatedData(priceSettingsResponse, priceSettingPageSize, priceSettingPage);

  // Mutation hooks
  const { mutateAsync: createMaterial } = useCreateMaterial();
  const { mutateAsync: updateMaterial } = useUpdateMaterial();
  const { mutateAsync: deleteMaterial } = useDeleteMaterial();

  const { mutateAsync: createMaterialType } = useCreateMaterialType();
  const { mutateAsync: updateMaterialType } = useUpdateMaterialType();
  const { mutateAsync: deleteMaterialType } = useDeleteMaterialType();

  const { mutateAsync: createMassif } = useCreateMassif();
  const { mutateAsync: updateMassif } = useUpdateMassif();
  const { mutateAsync: deleteMassif } = useDeleteMassif();

  const { mutateAsync: createColor } = useCreateColor();
  const { mutateAsync: updateColor } = useUpdateColor();
  const { mutateAsync: deleteColor } = useDeleteColor();

  const { mutateAsync: createPatinaColor } = useCreatePatinaColor();
  const { mutateAsync: updatePatinaColor } = useUpdatePatinaColor();
  const { mutateAsync: deletePatinaColor } = useDeletePatinaColor();

  const { mutateAsync: createBeading } = useCreateBeading();
  const { mutateAsync: updateBeading } = useUpdateBeading();
  const { mutateAsync: deleteBeading } = useDeleteBeading();

  const { mutateAsync: createGlassType } = useCreateGlassType();
  const { mutateAsync: updateGlassType } = useUpdateGlassType();
  const { mutateAsync: deleteGlassType } = useDeleteGlassType();

  const { mutateAsync: createThreshold } = useCreateThreshold();
  const { mutateAsync: updateThreshold } = useUpdateThreshold();
  const { mutateAsync: deleteThreshold } = useDeleteThreshold();

  const { mutateAsync: updateAttributeSettings } = useUpdateAttributeSettings();

  const { mutateAsync: createCasingRange } = useCreateCasingRange();
  const { mutateAsync: updateCasingRange } = useUpdateCasingRange();
  const { mutateAsync: deleteCasingRange } = useDeleteCasingRange();

  const { mutateAsync: createPriceSetting } = useCreatePriceSetting();
  const { mutateAsync: updatePriceSetting } = useUpdatePriceSetting();
  const { mutateAsync: deletePriceSetting } = useDeletePriceSetting();

  // Field definitions for each entity type
  const materialFields: TableField[] = [
    { name: 'name', label: t('forms.material_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const materialTypeFields: TableField[] = [
    { name: 'name', label: t('forms.material_type_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const massifFields: TableField[] = [
    { name: 'name', label: t('forms.massif_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const colorFields: TableField[] = [
    { name: 'name', label: t('forms.color_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const patinaColorFields: TableField[] = [
    { name: 'name', label: t('forms.patina_color_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const beadingFields: TableField[] = [
    { name: 'name', label: t('forms.beading_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true },
    {
      name: 'type',
      label: t('forms.beading_type'),
      type: 'select',
      options: [
        { value: 'main', label: t('forms.main') },
        { value: 'additional', label: t('forms.additional') }
      ],
      required: true,
      editable: true
    }
  ];

  const glassTypeFields: TableField[] = [
    { name: 'name', label: t('forms.glass_type_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const thresholdFields: TableField[] = [
    { name: 'name', label: t('forms.threshold_name'), type: 'text', placeholder: t('placeholders.enter_name'), required: true, editable: true }
  ];

  const attributeSettingsFields: TableField[] = [
    { name: 'casing_size', label: t('forms.casing_size'), type: 'number', placeholder: t('placeholders.enter_size'), required: true, editable: true },
    { name: 'crown_size', label: t('forms.crown_size'), type: 'number', placeholder: t('placeholders.enter_size'), required: true, editable: true },
    {
      name: 'casing_formula',
      label: t('forms.casing_formula'),
      type: 'select',
      options: [
        { value: 'true', label: t('common.yes') },
        { value: 'false', label: t('common.no') }
      ],
      required: true,
      editable: true
    }
  ];

  const casingRangeFields: TableField[] = [
    { name: 'min_size', label: t('forms.min_size'), type: 'number', placeholder: t('placeholders.enter_min_size'), required: true, editable: true },
    { name: 'max_size', label: t('forms.max_size'), type: 'number', placeholder: t('placeholders.enter_max_size'), required: true, editable: true },
    { name: 'casing_size', label: t('forms.casing_size'), type: 'number', placeholder: t('placeholders.enter_casing_size'), required: true, editable: true }
  ];

  const priceSettingFields: TableField[] = [
    {
      name: 'product',
      label: t('forms.product'),
      type: 'select',
      options: PRODUCT_CHOICES.map(choice => ({ value: choice.value, label: choice.label })),
      required: true,
      editable: true
    },
    {
      name: 'price_type',
      label: t('forms.price_type'),
      type: 'select',
      options: priceTypesData?.map(pt => ({ value: pt.id, label: pt.name })) || [],
      required: true,
      editable: true
    }
  ];





  // Helper functions for CRUD operations
  const handleMaterialCreate = async (data: Omit<Material, 'id'>) => {
    await createMaterial({ id: 0, ...data });
  };

  const handleMaterialUpdate = async (id: number, data: Partial<Material>) => {
    await updateMaterial({ id, name: data.name || '' });
  };

  const handleMaterialDelete = async (id: number) => {
    await deleteMaterial(id);
  };

  // Similar helper functions for other entities
  const handleMaterialTypeCreate = async (data: Omit<MaterialType, 'id'>) => {
    await createMaterialType({ id: 0, ...data });
  };

  const handleMaterialTypeUpdate = async (id: number, data: Partial<MaterialType>) => {
    await updateMaterialType({ id, name: data.name || '' });
  };

  const handleMaterialTypeDelete = async (id: number) => {
    await deleteMaterialType(id);
  };

  const handleMassifCreate = async (data: Omit<Massif, 'id'>) => {
    await createMassif({ id: 0, ...data });
  };

  const handleMassifUpdate = async (id: number, data: Partial<Massif>) => {
    await updateMassif({ id, name: data.name || '' });
  };

  const handleMassifDelete = async (id: number) => {
    await deleteMassif(id);
  };

  const handleColorCreate = async (data: Omit<Color, 'id'>) => {
    await createColor({ id: 0, ...data });
  };

  const handleColorUpdate = async (id: number, data: Partial<Color>) => {
    await updateColor({ id, name: data.name || '' });
  };

  const handleColorDelete = async (id: number) => {
    await deleteColor(id);
  };

  const handlePatinaColorCreate = async (data: Omit<PatinaColor, 'id'>) => {
    await createPatinaColor({ id: 0, ...data });
  };

  const handlePatinaColorUpdate = async (id: number, data: Partial<PatinaColor>) => {
    await updatePatinaColor({ id, name: data.name || '' });
  };

  const handlePatinaColorDelete = async (id: number) => {
    await deletePatinaColor(id);
  };

  const handleBeadingCreate = async (data: Omit<Beading, 'id'>) => {
    await createBeading({ id: 0, ...data });
  };

  const handleBeadingUpdate = async (id: number, data: Partial<Beading>) => {
    await updateBeading({ id, name: data.name || '', type: data.type || 'main' });
  };

  const handleBeadingDelete = async (id: number) => {
    await deleteBeading(id);
  };

  const handleGlassTypeCreate = async (data: Omit<GlassType, 'id'>) => {
    await createGlassType({ id: 0, ...data });
  };

  const handleGlassTypeUpdate = async (id: number, data: Partial<GlassType>) => {
    await updateGlassType({ id, name: data.name || '' });
  };

  const handleGlassTypeDelete = async (id: number) => {
    await deleteGlassType(id);
  };

  const handleThresholdCreate = async (data: Omit<Threshold, 'id'>) => {
    await createThreshold({ id: 0, ...data });
  };

  const handleThresholdUpdate = async (id: number, data: Partial<Threshold>) => {
    await updateThreshold({ id, name: data.name || '' });
  };

  const handleThresholdDelete = async (id: number) => {
    await deleteThreshold(id);
  };

  const handleAttributeSettingsUpdate = async (id: number, data: Partial<AttributeSettings>) => {
    await updateAttributeSettings({
      id,
      casing_size: data.casing_size || 0,
      crown_size: data.crown_size || 0,
      casing_formula: data.casing_formula || false
    });
  };

  const handleCasingRangeCreate = async (data: Omit<CasingRange, 'id'>) => {
    await createCasingRange({ ...data });
  };

  const handleCasingRangeUpdate = async (id: number, data: Partial<CasingRange>) => {
    await updateCasingRange({
      id,
      min_size: data.min_size || 0,
      max_size: data.max_size || 0,
      casing_size: data.casing_size || 0
    });
  };

  const handleCasingRangeDelete = async (id: number) => {
    await deleteCasingRange(id);
  };

  const handlePriceSettingCreate = async (data: Omit<PriceSettingWithPriceType, 'id'>) => {
    await createPriceSetting({
      product: data.product as any,
      price_type: data.price_type as string
    });
  };

  const handlePriceSettingUpdate = async (id: number, data: Partial<PriceSettingWithPriceType>) => {
    await updatePriceSetting({
      id,
      product: data.product as any,
      price_type: data.price_type as string
    });
  };

  const handlePriceSettingDelete = async (id: number) => {
    await deletePriceSetting(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("navigation.settings")}
        </h1>
        <p className="text-gray-600">{t("settings.description")}</p>
      </div>

      <div className="space-y-8">
        {/* Materials Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.material")}
            data={materialsData}
            fields={materialFields}
            isLoading={materialsLoading}
            searchTerm={materialSearch}
            onSearchChange={setMaterialSearch}
            onCreate={handleMaterialCreate}
            onUpdate={handleMaterialUpdate}
            onDelete={handleMaterialDelete}
            searchPlaceholder={t('placeholders.search_material')}
            pagination={materialsPagination}
            onPageChange={setMaterialPage}
            onPageSizeChange={setMaterialPageSize}
          />
        )}

        {/* Material Types Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.material_types")}
            data={materialTypesData}
            fields={materialTypeFields}
            isLoading={materialTypesLoading}
            searchTerm={materialTypeSearch}
            onSearchChange={setMaterialTypeSearch}
            onCreate={handleMaterialTypeCreate}
            onUpdate={handleMaterialTypeUpdate}
            onDelete={handleMaterialTypeDelete}
            searchPlaceholder={t('placeholders.search_material_type')}
            pagination={materialTypesPagination}
            onPageChange={setMaterialTypePage}
            onPageSizeChange={setMaterialTypePageSize}
          />
        )}

        {/* Massifs Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.massifs")}
            data={massifsData}
            fields={massifFields}
            isLoading={massifsLoading}
            searchTerm={massifSearch}
            onSearchChange={setMassifSearch}
            onCreate={handleMassifCreate}
            onUpdate={handleMassifUpdate}
            onDelete={handleMassifDelete}
            searchPlaceholder={t('placeholders.search_massif')}
            pagination={massifsPagination}
            onPageChange={setMassifPage}
            onPageSizeChange={setMassifPageSize}
          />
        )}

        {/* Colors Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.colors")}
            data={colorsData}
            fields={colorFields}
            isLoading={colorsLoading}
            searchTerm={colorSearch}
            onSearchChange={setColorSearch}
            onCreate={handleColorCreate}
            onUpdate={handleColorUpdate}
            onDelete={handleColorDelete}
            searchPlaceholder={t('placeholders.search_color')}
            pagination={colorsPagination}
            onPageChange={setColorPage}
            onPageSizeChange={setColorPageSize}
          />
        )}

        {/* Patina Colors Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.patina_colors")}
            data={patinaColorsData}
            fields={patinaColorFields}
            isLoading={patinaColorsLoading}
            searchTerm={patinaColorSearch}
            onSearchChange={setPatinaColorSearch}
            onCreate={handlePatinaColorCreate}
            onUpdate={handlePatinaColorUpdate}
            onDelete={handlePatinaColorDelete}
            searchPlaceholder={t('placeholders.search_patina_color')}
            pagination={patinaColorsPagination}
            onPageChange={setPatinaColorPage}
            onPageSizeChange={setPatinaColorPageSize}
          />
        )}

        {/* Beadings Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.beadings")}
            data={beadingsData}
            fields={beadingFields}
            isLoading={beadingsLoading}
            searchTerm={beadingSearch}
            onSearchChange={setBeadingSearch}
            onCreate={handleBeadingCreate}
            onUpdate={handleBeadingUpdate}
            onDelete={handleBeadingDelete}
            searchPlaceholder={t('placeholders.search_beading')}
            pagination={beadingsPagination}
            onPageChange={setBeadingPage}
            onPageSizeChange={setBeadingPageSize}
          />
        )}

        {/* Glass Types Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.glass_types")}
            data={glassTypesData}
            fields={glassTypeFields}
            isLoading={glassTypesLoading}
            searchTerm={glassTypeSearch}
            onSearchChange={setGlassTypeSearch}
            onCreate={handleGlassTypeCreate}
            onUpdate={handleGlassTypeUpdate}
            onDelete={handleGlassTypeDelete}
            searchPlaceholder={t('placeholders.search_glass_type')}
            pagination={glassTypesPagination}
            onPageChange={setGlassTypePage}
            onPageSizeChange={setGlassTypePageSize}
          />
        )}

        {/* Thresholds Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.thresholds")}
            data={thresholdsData}
            fields={thresholdFields}
            isLoading={thresholdsLoading}
            searchTerm={thresholdSearch}
            onSearchChange={setThresholdSearch}
            onCreate={handleThresholdCreate}
            onUpdate={handleThresholdUpdate}
            onDelete={handleThresholdDelete}
            searchPlaceholder={t('placeholders.search_threshold')}
            pagination={thresholdsPagination}
            onPageChange={setThresholdPage}
            onPageSizeChange={setThresholdPageSize}
          />
        )}

        {/* Attribute Settings Section */}
        <InlineEditableTable
          title={t("navigation.attribute_settings")}
          data={attributeSettingsData}
          fields={attributeSettingsFields}
          isLoading={attributeSettingsLoading}
          searchTerm=""
          onSearchChange={() => {}}
          onCreate={async () => {}} // Attribute settings typically don't support create
          onUpdate={handleAttributeSettingsUpdate}
          onDelete={async () => {}} // Attribute settings typically don't support delete
          searchPlaceholder={t('placeholders.search_attribute_settings')}
        />

        {/* Formula Display Section */}
        {attributeSettingsData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("forms.casing_formula")}
            </h2>
            <div className="space-y-4">
              {attributeSettingsData.map((setting: any) => (
                <div key={setting.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">
                      {t("common.current_formula")}:{" "}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {setting.casing_formula ? t("forms.formula_1") : t("forms.formula_2")}
                    </span>
                  </div>

                  {setting.casing_formula ? (
                    // Formula 1 (when casing_formula is true)
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">{t("forms.formula_1")}:</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>• {t("forms.casing_type_side")}: высота = высота двери + размер наличника</p>
                        <p>• {t("forms.casing_type_straight")}: высота = ширина двери + (2 × размер наличника)</p>
                      </div>
                      {/* <p className="text-xs text-gray-500 mt-2">
                        {t("forms.formula_1_description")}
                      </p> */}
                    </div>
                  ) : (
                    // Formula 2 (when casing_formula is false)
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">{t("forms.formula_2")}:</h4>
                      <div className="text-sm text-gray-700">
                        <p>{t("forms.formula_2_description")}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Casing Ranges Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.casing_ranges")}
            data={casingRangesData}
            fields={casingRangeFields}
            isLoading={casingRangesLoading}
            searchTerm={casingRangeSearch}
            onSearchChange={setCasingRangeSearch}
            onCreate={handleCasingRangeCreate}
            onUpdate={handleCasingRangeUpdate}
            onDelete={handleCasingRangeDelete}
            searchPlaceholder={t('placeholders.search_casing_range')}
            pagination={casingRangesPagination}
            onPageChange={setCasingRangePage}
            onPageSizeChange={setCasingRangePageSize}
          />
        )}

        {/* Price Settings Section */}
        {(currentUser?.role === "ADMIN") && (
          <InlineEditableTable
            title={t("navigation.price_settings")}
            data={priceSettingsData}
            fields={priceSettingFields}
            isLoading={priceSettingsLoading}
            searchTerm={priceSettingSearch}
            onSearchChange={setPriceSettingSearch}
            onCreate={handlePriceSettingCreate}
            onUpdate={handlePriceSettingUpdate}
            onDelete={handlePriceSettingDelete}
            searchPlaceholder={t('placeholders.search_price_setting')}
            pagination={priceSettingsPagination}
            onPageChange={setPriceSettingPage}
            onPageSizeChange={setPriceSettingPageSize}
          />
        )}
      </div>
    </div>
  );
}
