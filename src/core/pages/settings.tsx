import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

// Import all API hooks
import {
  useGetMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  type Material,
} from "../api/material";
import {
  useGetMaterialTypes,
  useCreateMaterialType,
  useUpdateMaterialType,
  useDeleteMaterialType,
} from "../api/materialType";
import {
  useGetMassifs,
  useCreateMassif,
  useUpdateMassif,
  useDeleteMassif,
} from "../api/massif";
import {
  useGetColors,
  useCreateColor,
  useUpdateColor,
  useDeleteColor,
} from "../api/color";
import {
  useGetPatinaColors,
  useCreatePatinaColor,
  useUpdatePatinaColor,
  useDeletePatinaColor,
} from "../api/patinaColor";
import {
  useGetBeadings,
  useCreateBeading,
  useUpdateBeading,
  useDeleteBeading,
} from "../api/beading";
import {
  useGetGlassTypes,
  useCreateGlassType,
  useUpdateGlassType,
  useDeleteGlassType,
} from "../api/glassType";
import {
  useGetThresholds,
  useCreateThreshold,
  useUpdateThreshold,
  useDeleteThreshold,
} from "../api/threshold";
import {
  useGetAttributeSettings,
  useUpdateAttributeSettings,
} from "../api/attributeSettings";
import {
  useGetCasingRanges,
  useCreateCasingRange,
  useUpdateCasingRange,
  useDeleteCasingRange,
} from "../api/casingRange";
import {
  useGetPriceSettings,
  useCreatePriceSetting,
  useUpdatePriceSetting,
  useDeletePriceSetting,
  useGetPriceTypes,
  PRODUCT_CHOICES,
} from "../api/priceSettings";
import {
  useGetFrames,
  useCreateFrame,
  useUpdateFrame,
  useDeleteFrame,
} from "../api/frame";
import {
  useGetCladdings,
  useCreateCladding,
  useUpdateCladding,
  useDeleteCladding,
} from "../api/cladding";
import {
  useGetLocks,
  useCreateLock,
  useUpdateLock,
  useDeleteLock,
} from "../api/lock";
import {
  useGetSteelColors,
  useCreateSteelColor,
  useUpdateSteelColor,
  useDeleteSteelColor,
} from "../api/steelColor";
import { useGetDeadlineDays, useUpdateDeadlineDay } from "../api/deadlineDay";
import { useSyncAll, useSyncLogs, type SyncLog } from "../api/sync";

// Import types
import type {
  MaterialType,
  Massif,
  Color,
  PatinaColor,
  Beading,
  GlassType,
  Threshold,
  AttributeSettings,
  CasingRange,
  Frame,
  Cladding,
  Lock,
  SteelColor,
  DeadlineDay,
} from "../api/types";
import type { PriceSettingWithPriceType } from "../api/priceSettings";

// Import the new inline editable table component
import {
  InlineEditableTable,
  type TableField,
} from "../helpers/InlineEditableTable";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  // Sync functionality
  const syncAllMutation = useSyncAll();
  const [syncLogsPage, setSyncLogsPage] = useState(1);
  const {
    data: syncLogsData,
    isLoading: syncLogsLoading,
    refetch: refetchSyncLogs,
  } = useSyncLogs(syncLogsPage, 10);

  const handleSyncAll = async () => {
    try {
      await syncAllMutation.mutateAsync();
      // Refetch sync logs after successful sync
      refetchSyncLogs();
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  // Search states for each section (immediate input values)
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialTypeSearch, setMaterialTypeSearch] = useState("");
  const [massifSearch, setMassifSearch] = useState("");
  const [colorSearch, setColorSearch] = useState("");
  const [patinaColorSearch, setPatinaColorSearch] = useState("");
  const [beadingSearch, setBeadingSearch] = useState("");
  const [glassTypeSearch, setGlassTypeSearch] = useState("");
  const [thresholdSearch, setThresholdSearch] = useState("");
  const [casingRangeSearch, setCasingRangeSearch] = useState("");
  const [priceSettingSearch, setPriceSettingSearch] = useState("");
  const [frameSearch, setFrameSearch] = useState("");
  const [claddingSearch, setCladdingSearch] = useState("");
  const [lockSearch, setLockSearch] = useState("");
  const [steelColorSearch, setSteelColorSearch] = useState("");

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
  const [framePage, setFramePage] = useState(1);
  const [framePageSize, setFramePageSize] = useState(20);
  const [claddingPage, setCladdingPage] = useState(1);
  const [claddingPageSize, setCladdingPageSize] = useState(20);
  const [lockPage, setLockPage] = useState(1);
  const [lockPageSize, setLockPageSize] = useState(20);
  const [steelColorPage, setSteelColorPage] = useState(1);
  const [steelColorPageSize, setSteelColorPageSize] = useState(20);

  // Debounced search states (used for API calls)
  const [debouncedMaterialSearch, setDebouncedMaterialSearch] = useState("");
  const [debouncedMaterialTypeSearch, setDebouncedMaterialTypeSearch] =
    useState("");
  const [debouncedMassifSearch, setDebouncedMassifSearch] = useState("");
  const [debouncedColorSearch, setDebouncedColorSearch] = useState("");
  const [debouncedPatinaColorSearch, setDebouncedPatinaColorSearch] =
    useState("");
  const [debouncedBeadingSearch, setDebouncedBeadingSearch] = useState("");
  const [debouncedGlassTypeSearch, setDebouncedGlassTypeSearch] = useState("");
  const [debouncedThresholdSearch, setDebouncedThresholdSearch] = useState("");
  const [debouncedCasingRangeSearch, setDebouncedCasingRangeSearch] =
    useState("");
  const [debouncedPriceSettingSearch, setDebouncedPriceSettingSearch] =
    useState("");
  const [debouncedFrameSearch, setDebouncedFrameSearch] = useState("");
  const [debouncedCladdingSearch, setDebouncedCladdingSearch] = useState("");
  const [debouncedLockSearch, setDebouncedLockSearch] = useState("");
  const [debouncedSteelColorSearch, setDebouncedSteelColorSearch] =
    useState("");

  // Debounce effects for search terms
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedMaterialSearch(materialSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [materialSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedMaterialTypeSearch(materialTypeSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [materialTypeSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedMassifSearch(massifSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [massifSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedColorSearch(colorSearch), 300);
    return () => clearTimeout(timeout);
  }, [colorSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedPatinaColorSearch(patinaColorSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [patinaColorSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedBeadingSearch(beadingSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [beadingSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedGlassTypeSearch(glassTypeSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [glassTypeSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedThresholdSearch(thresholdSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [thresholdSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedCasingRangeSearch(casingRangeSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [casingRangeSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedPriceSettingSearch(priceSettingSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [priceSettingSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFrameSearch(frameSearch), 300);
    return () => clearTimeout(timeout);
  }, [frameSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedCladdingSearch(claddingSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [claddingSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedLockSearch(lockSearch), 300);
    return () => clearTimeout(timeout);
  }, [lockSearch]);

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSteelColorSearch(steelColorSearch),
      300,
    );
    return () => clearTimeout(timeout);
  }, [steelColorSearch]);

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
  }, [debouncedCasingRangeSearch]);

  useEffect(() => {
    setPriceSettingPage(1);
  }, [debouncedPriceSettingSearch]);

  useEffect(() => {
    setFramePage(1);
  }, [debouncedFrameSearch]);

  useEffect(() => {
    setCladdingPage(1);
  }, [debouncedCladdingSearch]);

  useEffect(() => {
    setLockPage(1);
  }, [debouncedLockSearch]);

  useEffect(() => {
    setSteelColorPage(1);
  }, [debouncedSteelColorSearch]);

  // API hooks for fetching data (using debounced search terms and pagination)
  const { data: materialsResponse, isLoading: materialsLoading } =
    useGetMaterials({
      params: {
        search: debouncedMaterialSearch,
        page: materialPage,
        page_size: materialPageSize,
      },
    });
  const { data: materialTypesResponse, isLoading: materialTypesLoading } =
    useGetMaterialTypes({
      params: {
        search: debouncedMaterialTypeSearch,
        page: materialTypePage,
        page_size: materialTypePageSize,
      },
    });
  const { data: massifsResponse, isLoading: massifsLoading } = useGetMassifs({
    params: {
      search: debouncedMassifSearch,
      page: massifPage,
      page_size: massifPageSize,
    },
  });
  const { data: colorsResponse, isLoading: colorsLoading } = useGetColors({
    params: {
      search: debouncedColorSearch,
      page: colorPage,
      page_size: colorPageSize,
    },
  });
  const { data: patinaColorsResponse, isLoading: patinaColorsLoading } =
    useGetPatinaColors({
      params: {
        search: debouncedPatinaColorSearch,
        page: patinaColorPage,
        page_size: patinaColorPageSize,
      },
    });
  const { data: beadingsResponse, isLoading: beadingsLoading } = useGetBeadings(
    {
      params: {
        search: debouncedBeadingSearch,
        page: beadingPage,
        page_size: beadingPageSize,
      },
    },
  );
  const { data: glassTypesResponse, isLoading: glassTypesLoading } =
    useGetGlassTypes({
      params: {
        search: debouncedGlassTypeSearch,
        page: glassTypePage,
        page_size: glassTypePageSize,
      },
    });
  const { data: thresholdsResponse, isLoading: thresholdsLoading } =
    useGetThresholds({
      params: {
        search: debouncedThresholdSearch,
        page: thresholdPage,
        page_size: thresholdPageSize,
      },
    });
  const {
    data: attributeSettingsResponse,
    isLoading: attributeSettingsLoading,
  } = useGetAttributeSettings();
  const { data: casingRangesResponse, isLoading: casingRangesLoading } =
    useGetCasingRanges({
      params: {
        search: debouncedCasingRangeSearch,
        page: casingRangePage,
        page_size: casingRangePageSize,
      },
    });
  const { data: priceSettingsResponse, isLoading: priceSettingsLoading } =
    useGetPriceSettings({
      params: {
        search: debouncedPriceSettingSearch,
        page: priceSettingPage,
        page_size: priceSettingPageSize,
      },
    });
  const { data: priceTypesData } = useGetPriceTypes();
  const { data: framesResponse, isLoading: framesLoading } = useGetFrames({
    params: {
      search: debouncedFrameSearch,
      page: framePage,
      page_size: framePageSize,
    },
  });
  const { data: claddingsResponse, isLoading: claddingsLoading } =
    useGetCladdings({
      params: {
        search: debouncedCladdingSearch,
        page: claddingPage,
        page_size: claddingPageSize,
      },
    });
  const { data: locksResponse, isLoading: locksLoading } = useGetLocks({
    params: {
      search: debouncedLockSearch,
      page: lockPage,
      page_size: lockPageSize,
    },
  });
  const { data: steelColorsResponse, isLoading: steelColorsLoading } =
    useGetSteelColors({
      params: {
        search: debouncedSteelColorSearch,
        page: steelColorPage,
        page_size: steelColorPageSize,
      },
    });
  const { data: deadlineDaysResponse, isLoading: deadlineDaysLoading } =
    useGetDeadlineDays();

  // Helper function to extract data and pagination info from API responses
  const extractPaginatedData = (
    response: any,
    pageSize: number,
    currentPage: number,
  ) => {
    if (!response) return { data: [], pagination: null };

    // Check if response has pagination structure
    if (response.results && typeof response.count === "number") {
      const totalPages = Math.ceil(response.count / pageSize);
      return {
        data: response.results,
        pagination: {
          count: response.count,
          next: response.next,
          previous: response.previous,
          currentPage,
          totalPages,
          pageSize,
        },
      };
    }

    // Fallback for non-paginated responses
    return {
      data: Array.isArray(response) ? response : [],
      pagination: null,
    };
  };

  // Extract arrays and pagination info from API responses
  const { data: materialsData, pagination: materialsPagination } =
    extractPaginatedData(materialsResponse, materialPageSize, materialPage);
  const { data: materialTypesData, pagination: materialTypesPagination } =
    extractPaginatedData(
      materialTypesResponse,
      materialTypePageSize,
      materialTypePage,
    );
  const { data: massifsData, pagination: massifsPagination } =
    extractPaginatedData(massifsResponse, massifPageSize, massifPage);
  const { data: colorsData, pagination: colorsPagination } =
    extractPaginatedData(colorsResponse, colorPageSize, colorPage);
  const { data: patinaColorsData, pagination: patinaColorsPagination } =
    extractPaginatedData(
      patinaColorsResponse,
      patinaColorPageSize,
      patinaColorPage,
    );
  const { data: beadingsData, pagination: beadingsPagination } =
    extractPaginatedData(beadingsResponse, beadingPageSize, beadingPage);
  const { data: glassTypesData, pagination: glassTypesPagination } =
    extractPaginatedData(glassTypesResponse, glassTypePageSize, glassTypePage);
  const { data: thresholdsData, pagination: thresholdsPagination } =
    extractPaginatedData(thresholdsResponse, thresholdPageSize, thresholdPage);
  const attributeSettingsData = Array.isArray(attributeSettingsResponse)
    ? attributeSettingsResponse
    : [];
  const { data: casingRangesData, pagination: casingRangesPagination } =
    extractPaginatedData(
      casingRangesResponse,
      casingRangePageSize,
      casingRangePage,
    );
  const { data: priceSettingsData, pagination: priceSettingsPagination } =
    extractPaginatedData(
      priceSettingsResponse,
      priceSettingPageSize,
      priceSettingPage,
    );
  const { data: framesData, pagination: framesPagination } =
    extractPaginatedData(framesResponse, framePageSize, framePage);
  const { data: claddingsData, pagination: claddingsPagination } =
    extractPaginatedData(claddingsResponse, claddingPageSize, claddingPage);
  const { data: locksData, pagination: locksPagination } = extractPaginatedData(
    locksResponse,
    lockPageSize,
    lockPage,
  );
  const { data: steelColorsData, pagination: steelColorsPagination } =
    extractPaginatedData(
      steelColorsResponse,
      steelColorPageSize,
      steelColorPage,
    );
  const deadlineDaysData = Array.isArray(deadlineDaysResponse)
    ? deadlineDaysResponse
    : [];

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

  const { mutateAsync: createFrame } = useCreateFrame();
  const { mutateAsync: updateFrame } = useUpdateFrame();
  const { mutateAsync: deleteFrame } = useDeleteFrame();

  const { mutateAsync: createCladding } = useCreateCladding();
  const { mutateAsync: updateCladding } = useUpdateCladding();
  const { mutateAsync: deleteCladding } = useDeleteCladding();

  const { mutateAsync: createLock } = useCreateLock();
  const { mutateAsync: updateLock } = useUpdateLock();
  const { mutateAsync: deleteLock } = useDeleteLock();

  const { mutateAsync: createSteelColor } = useCreateSteelColor();
  const { mutateAsync: updateSteelColor } = useUpdateSteelColor();
  const { mutateAsync: deleteSteelColor } = useDeleteSteelColor();

  const { mutateAsync: updateDeadlineDay } = useUpdateDeadlineDay();

  // Field definitions for each entity type
  const materialFields: TableField[] = [
    {
      name: "name",
      label: t("forms.material_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const materialTypeFields: TableField[] = [
    {
      name: "name",
      label: t("forms.material_type_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const massifFields: TableField[] = [
    {
      name: "name",
      label: t("forms.massif_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const colorFields: TableField[] = [
    {
      name: "name",
      label: t("forms.color_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const patinaColorFields: TableField[] = [
    {
      name: "name",
      label: t("forms.patina_color_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const beadingFields: TableField[] = [
    {
      name: "name",
      label: t("forms.beading_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
    {
      name: "type",
      label: t("forms.beading_type"),
      type: "select",
      options: [
        { value: "main", label: t("forms.main") },
        { value: "additional", label: t("forms.additional") },
      ],
      required: true,
      editable: true,
    },
  ];

  const glassTypeFields: TableField[] = [
    {
      name: "name",
      label: t("forms.glass_type_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const thresholdFields: TableField[] = [
    {
      name: "name",
      label: t("forms.threshold_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const frameFields: TableField[] = [
    {
      name: "name",
      label: t("forms.frame_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const claddingFields: TableField[] = [
    {
      name: "name",
      label: t("forms.cladding_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const lockFields: TableField[] = [
    {
      name: "name",
      label: t("forms.lock_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const steelColorFields: TableField[] = [
    {
      name: "name",
      label: t("forms.steel_color_name"),
      type: "text",
      placeholder: t("placeholders.enter_name"),
      required: true,
      editable: true,
    },
  ];

  const deadlineDayFields: TableField[] = [
    {
      name: "deadline_day",
      label: t("forms.deadline_day"),
      type: "number",
      placeholder: t("placeholders.enter_deadline_day"),
      required: true,
      editable: true,
    },
  ];

  const attributeSettingsFields: TableField[] = [
    {
      name: "casing_size",
      label: t("forms.casing_size"),
      type: "number",
      placeholder: t("placeholders.enter_size"),
      required: true,
      editable: true,
    },
    {
      name: "crown_size",
      label: t("forms.crown_size"),
      type: "number",
      placeholder: t("placeholders.enter_size"),
      required: true,
      editable: true,
    },
    {
      name: "casing_formula",
      label: t("forms.casing_formula"),
      type: "select",
      options: [
        { value: "true", label: t("common.yes") },
        { value: "false", label: t("common.no") },
      ],
      required: true,
      editable: true,
    },
  ];

  const casingRangeFields: TableField[] = [
    {
      name: "min_size",
      label: t("forms.min_size"),
      type: "number",
      placeholder: t("placeholders.enter_min_size"),
      required: true,
      editable: true,
    },
    {
      name: "max_size",
      label: t("forms.max_size"),
      type: "number",
      placeholder: t("placeholders.enter_max_size"),
      required: true,
      editable: true,
    },
    {
      name: "casing_size",
      label: t("forms.casing_size"),
      type: "number",
      placeholder: t("placeholders.enter_casing_size"),
      required: true,
      editable: true,
    },
  ];

  const priceSettingFields: TableField[] = [
    {
      name: "product",
      label: t("forms.product"),
      type: "select",
      options: PRODUCT_CHOICES.map((choice) => ({
        value: choice.value,
        label: choice.label,
      })),
      required: true,
      editable: true,
    },
    {
      name: "price_type",
      label: t("forms.price_type"),
      type: "select",
      options:
        priceTypesData?.map((pt) => ({ value: pt.id, label: pt.name })) || [],
      required: true,
      editable: true,
    },
  ];

  // Helper functions for CRUD operations
  const handleMaterialCreate = async (data: Omit<Material, "id">) => {
    await createMaterial({ id: 0, ...data });
  };

  const handleMaterialUpdate = async (id: number, data: Partial<Material>) => {
    await updateMaterial({ id, name: data.name || "" });
  };

  const handleMaterialDelete = async (id: number) => {
    await deleteMaterial(id);
  };

  // Similar helper functions for other entities
  const handleMaterialTypeCreate = async (data: Omit<MaterialType, "id">) => {
    await createMaterialType({ id: 0, ...data });
  };

  const handleMaterialTypeUpdate = async (
    id: number,
    data: Partial<MaterialType>,
  ) => {
    await updateMaterialType({ id, name: data.name || "" });
  };

  const handleMaterialTypeDelete = async (id: number) => {
    await deleteMaterialType(id);
  };

  const handleMassifCreate = async (data: Omit<Massif, "id">) => {
    await createMassif({ id: 0, ...data });
  };

  const handleMassifUpdate = async (id: number, data: Partial<Massif>) => {
    await updateMassif({ id, name: data.name || "" });
  };

  const handleMassifDelete = async (id: number) => {
    await deleteMassif(id);
  };

  const handleColorCreate = async (data: Omit<Color, "id">) => {
    await createColor({ id: 0, ...data });
  };

  const handleColorUpdate = async (id: number, data: Partial<Color>) => {
    await updateColor({ id, name: data.name || "" });
  };

  const handleColorDelete = async (id: number) => {
    await deleteColor(id);
  };

  const handlePatinaColorCreate = async (data: Omit<PatinaColor, "id">) => {
    await createPatinaColor({ id: 0, ...data });
  };

  const handlePatinaColorUpdate = async (
    id: number,
    data: Partial<PatinaColor>,
  ) => {
    await updatePatinaColor({ id, name: data.name || "" });
  };

  const handlePatinaColorDelete = async (id: number) => {
    await deletePatinaColor(id);
  };

  const handleBeadingCreate = async (data: Omit<Beading, "id">) => {
    await createBeading({ id: 0, ...data });
  };

  const handleBeadingUpdate = async (id: number, data: Partial<Beading>) => {
    await updateBeading({
      id,
      name: data.name || "",
      type: data.type || "main",
    });
  };

  const handleBeadingDelete = async (id: number) => {
    await deleteBeading(id);
  };

  const handleGlassTypeCreate = async (data: Omit<GlassType, "id">) => {
    await createGlassType({ id: 0, ...data });
  };

  const handleGlassTypeUpdate = async (
    id: number,
    data: Partial<GlassType>,
  ) => {
    await updateGlassType({ id, name: data.name || "" });
  };

  const handleGlassTypeDelete = async (id: number) => {
    await deleteGlassType(id);
  };

  const handleThresholdCreate = async (data: Omit<Threshold, "id">) => {
    await createThreshold({ id: 0, ...data });
  };

  const handleThresholdUpdate = async (
    id: number,
    data: Partial<Threshold>,
  ) => {
    await updateThreshold({ id, name: data.name || "" });
  };

  const handleThresholdDelete = async (id: number) => {
    await deleteThreshold(id);
  };

  const handleAttributeSettingsUpdate = async (
    id: number,
    data: Partial<AttributeSettings>,
  ) => {
    await updateAttributeSettings({
      id,
      casing_size: data.casing_size || 0,
      crown_size: data.crown_size || 0,
      casing_formula: data.casing_formula || false,
    });
  };

  const handleCasingRangeCreate = async (data: Omit<CasingRange, "id">) => {
    await createCasingRange({ ...data });
  };

  const handleCasingRangeUpdate = async (
    id: number,
    data: Partial<CasingRange>,
  ) => {
    await updateCasingRange({
      id,
      min_size: data.min_size || 0,
      max_size: data.max_size || 0,
      casing_size: data.casing_size || 0,
    });
  };

  const handleCasingRangeDelete = async (id: number) => {
    await deleteCasingRange(id);
  };

  const handlePriceSettingCreate = async (
    data: Omit<PriceSettingWithPriceType, "id">,
  ) => {
    await createPriceSetting({
      product: data.product as any,
      price_type: data.price_type as string,
    });
  };

  const handlePriceSettingUpdate = async (
    id: number,
    data: Partial<PriceSettingWithPriceType>,
  ) => {
    await updatePriceSetting({
      id,
      product: data.product as any,
      price_type: data.price_type as string,
    });
  };

  const handlePriceSettingDelete = async (id: number) => {
    await deletePriceSetting(id);
  };

  const handleFrameCreate = async (data: Omit<Frame, "id">) => {
    await createFrame({ id: 0, ...data });
  };

  const handleFrameUpdate = async (id: number, data: Partial<Frame>) => {
    await updateFrame({ id, name: data.name || "" });
  };

  const handleFrameDelete = async (id: number) => {
    await deleteFrame(id);
  };

  const handleCladdingCreate = async (data: Omit<Cladding, "id">) => {
    await createCladding({ id: 0, ...data });
  };

  const handleCladdingUpdate = async (id: number, data: Partial<Cladding>) => {
    await updateCladding({ id, name: data.name || "" });
  };

  const handleCladdingDelete = async (id: number) => {
    await deleteCladding(id);
  };

  const handleLockCreate = async (data: Omit<Lock, "id">) => {
    await createLock({ id: 0, ...data });
  };

  const handleLockUpdate = async (id: number, data: Partial<Lock>) => {
    await updateLock({ id, name: data.name || "" });
  };

  const handleLockDelete = async (id: number) => {
    await deleteLock(id);
  };

  const handleSteelColorCreate = async (data: Omit<SteelColor, "id">) => {
    await createSteelColor({ id: 0, ...data });
  };

  const handleSteelColorUpdate = async (
    id: number,
    data: Partial<SteelColor>,
  ) => {
    await updateSteelColor({ id, name: data.name || "" });
  };

  const handleSteelColorDelete = async (id: number) => {
    await deleteSteelColor(id);
  };

  const handleDeadlineDayUpdate = async (
    id: number,
    data: Partial<DeadlineDay>,
  ) => {
    await updateDeadlineDay({ id, deadline_day: data.deadline_day || 0 });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("navigation.settings")}
        </h1>
        <p className="text-gray-600">{t("settings.description")}</p>
      </div>

      {/* Data Synchronization Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('forms.sync')}
            </h2>
            <p className="text-gray-600">
              {t('forms.sync_description')}
            </p>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={syncAllMutation.isPending}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              syncAllMutation.isPending
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {syncAllMutation.isPending ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-200"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {t('forms.syncing')}
              </div>
            ) : (
             'Синхронизация'
            )}
          </button>
        </div>

        {/* Sync Status */}
        {syncAllMutation.isSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <svg
                className="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {syncAllMutation.data?.message ||
                    "Все моделы успешно  синхронизировались"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Logs Table */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
          {t('forms.sync_history')}
          </h3>
          {syncLogsLoading ? (
            <div className="flex justify-center py-4">
              <svg
                className="animate-spin h-8 w-8 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                   
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                     {t("forms.data")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('forms.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {syncLogsData?.results?.map((log: SyncLog) => (
                    <tr key={log.id}>
                     
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.sync_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.success
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.success ? "Success" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                      Нет данных
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination for sync logs */}
              {syncLogsData && syncLogsData.count > 10 && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Показываю {(syncLogsPage - 1) * 10 + 1} to{" "}
                    {Math.min(syncLogsPage * 10, syncLogsData.count)} of{" "}
                    {syncLogsData.count} результаты
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setSyncLogsPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!syncLogsData.previous}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                      Пред
                    </button>
                    <button
                      onClick={() => setSyncLogsPage((prev) => prev + 1)}
                      disabled={!syncLogsData.next}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
                    >
                     Следущий
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Materials Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_material")}
            pagination={materialsPagination}
            onPageChange={setMaterialPage}
            onPageSizeChange={setMaterialPageSize}
          />
        )}

        {/* Material Types Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_material_type")}
            pagination={materialTypesPagination}
            onPageChange={setMaterialTypePage}
            onPageSizeChange={setMaterialTypePageSize}
          />
        )}

        {/* Massifs Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_massif")}
            pagination={massifsPagination}
            onPageChange={setMassifPage}
            onPageSizeChange={setMassifPageSize}
          />
        )}

        {/* Colors Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_color")}
            pagination={colorsPagination}
            onPageChange={setColorPage}
            onPageSizeChange={setColorPageSize}
          />
        )}

        {/* Patina Colors Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_patina_color")}
            pagination={patinaColorsPagination}
            onPageChange={setPatinaColorPage}
            onPageSizeChange={setPatinaColorPageSize}
          />
        )}

        {/* Beadings Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_beading")}
            pagination={beadingsPagination}
            onPageChange={setBeadingPage}
            onPageSizeChange={setBeadingPageSize}
          />
        )}

        {/* Glass Types Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_glass_type")}
            pagination={glassTypesPagination}
            onPageChange={setGlassTypePage}
            onPageSizeChange={setGlassTypePageSize}
          />
        )}

        {/* Thresholds Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_threshold")}
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
          searchPlaceholder=""
          showCreateButton={false}
          showDeleteButton={false}
          showSearchBar={false}
        />

        {/* Formula Display Section */}
        {attributeSettingsData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("forms.casing_formula")}
            </h2>
            <div className="space-y-4">
              {attributeSettingsData.map((setting: any) => (
                <div
                  key={setting.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">
                      {t("common.current_formula")}:{" "}
                    </span>
                    <span className="text-sm font-semibold text-blue-600">
                      {setting.casing_formula
                        ? t("forms.formula_1")
                        : t("forms.formula_2")}
                    </span>
                  </div>

                  {setting.casing_formula ? (
                    // Formula 1 (when casing_formula is true)
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">
                        {t("forms.formula_1")}:
                      </h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          • {t("forms.casing_type_side")}: высота = высота двери
                          + размер наличника
                        </p>
                        <p>
                          • {t("forms.casing_type_straight")}: высота = ширина
                          двери + (2 × размер наличника)
                        </p>
                      </div>
                      {/* <p className="text-xs text-gray-500 mt-2">
                        {t("forms.formula_1_description")}
                      </p> */}
                    </div>
                  ) : (
                    // Formula 2 (when casing_formula is false)
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">
                        {t("forms.formula_2")}:
                      </h4>
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
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_casing_range")}
            pagination={casingRangesPagination}
            onPageChange={setCasingRangePage}
            onPageSizeChange={setCasingRangePageSize}
          />
        )}

        {/* Price Settings Section */}
        {currentUser?.role === "ADMIN" && (
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
            searchPlaceholder={t("placeholders.search_price_setting")}
            pagination={priceSettingsPagination}
            onPageChange={setPriceSettingPage}
            onPageSizeChange={setPriceSettingPageSize}
          />
        )}

        {/* Frames Section */}
        {currentUser?.role === "ADMIN" && (
          <InlineEditableTable
            title={t("navigation.frames")}
            data={framesData}
            fields={frameFields}
            isLoading={framesLoading}
            searchTerm={frameSearch}
            onSearchChange={setFrameSearch}
            onCreate={handleFrameCreate}
            onUpdate={handleFrameUpdate}
            onDelete={handleFrameDelete}
            searchPlaceholder={t("placeholders.search_frame")}
            pagination={framesPagination}
            onPageChange={setFramePage}
            onPageSizeChange={setFramePageSize}
          />
        )}

        {/* Claddings Section */}
        {currentUser?.role === "ADMIN" && (
          <InlineEditableTable
            title={t("navigation.claddings")}
            data={claddingsData}
            fields={claddingFields}
            isLoading={claddingsLoading}
            searchTerm={claddingSearch}
            onSearchChange={setCladdingSearch}
            onCreate={handleCladdingCreate}
            onUpdate={handleCladdingUpdate}
            onDelete={handleCladdingDelete}
            searchPlaceholder={t("placeholders.search_cladding")}
            pagination={claddingsPagination}
            onPageChange={setCladdingPage}
            onPageSizeChange={setCladdingPageSize}
          />
        )}

        {/* Locks Section */}
        {currentUser?.role === "ADMIN" && (
          <InlineEditableTable
            title={t("navigation.locks")}
            data={locksData}
            fields={lockFields}
            isLoading={locksLoading}
            searchTerm={lockSearch}
            onSearchChange={setLockSearch}
            onCreate={handleLockCreate}
            onUpdate={handleLockUpdate}
            onDelete={handleLockDelete}
            searchPlaceholder={t("placeholders.search_lock")}
            pagination={locksPagination}
            onPageChange={setLockPage}
            onPageSizeChange={setLockPageSize}
          />
        )}

        {/* Steel Colors Section */}
        {currentUser?.role === "ADMIN" && (
          <InlineEditableTable
            title={t("navigation.steel_colors")}
            data={steelColorsData}
            fields={steelColorFields}
            isLoading={steelColorsLoading}
            searchTerm={steelColorSearch}
            onSearchChange={setSteelColorSearch}
            onCreate={handleSteelColorCreate}
            onUpdate={handleSteelColorUpdate}
            onDelete={handleSteelColorDelete}
            searchPlaceholder={t("placeholders.search_steel_color")}
            pagination={steelColorsPagination}
            onPageChange={setSteelColorPage}
            onPageSizeChange={setSteelColorPageSize}
          />
        )}

        {/* Deadline Day Section */}
        {currentUser?.role === "ADMIN" && (
          <InlineEditableTable
            title={t("navigation.deadline_day")}
            data={deadlineDaysData}
            fields={deadlineDayFields}
            isLoading={deadlineDaysLoading}
            searchTerm=""
            onSearchChange={() => {}}
            onCreate={async () => {}}
            onUpdate={handleDeadlineDayUpdate}
            onDelete={async () => {}}
            searchPlaceholder=""
            pagination={null}
            onPageChange={() => {}}
            onPageSizeChange={() => {}}
            showCreateButton={false}
            showDeleteButton={false}
            showSearchBar={false}
          />
        )}
      </div>
    </div>
  );
}
