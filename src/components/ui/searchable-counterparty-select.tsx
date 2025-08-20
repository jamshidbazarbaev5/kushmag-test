import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "./input";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import api from "@/core/api/api";

export interface Counterparty {
  id: string;
  name: string;
  phone?: string;
  [key: string]: any;
}

interface SearchableCounterpartySelectProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableCounterpartySelect({
  value,
  onChange,
  placeholder = "Search counterparties...",
  required = false,
  disabled = false,
  className = "",
}: SearchableCounterpartySelectProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCounterparty, setSelectedCounterparty] =
    useState<Counterparty | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const createForm = useForm({
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // Effect 1: Sync component with the initial value from the parent form
  useEffect(() => {
    if (value && typeof value === "object" && value.name) {
      setSelectedCounterparty(value);
      setSearchQuery(value.name);
    } else if (value && typeof value === "string") {
      // If we have just an ID, we might need to fetch the full object
      // For now, we'll just clear the display
      setSelectedCounterparty(null);
      setSearchQuery("");
    } else if (!value) {
      setSelectedCounterparty(null);
      setSearchQuery("");
    }
  }, [value]);

  // Effect 2: Perform search when the user types
  useEffect(() => {
    // Don't search if the dropdown is not open or if the query matches the selected counterparty name
    if (
      !isOpen ||
      (selectedCounterparty && searchQuery === selectedCounterparty.name)
    ) {
      return;
    }

    const searchCounterparties = async () => {
      if (searchQuery.length < 2) {
        setCounterparties([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await api.get(
          `counterparty/?search=${encodeURIComponent(searchQuery)}`,
        );
        const results = Array.isArray(res.data)
          ? res.data
          : res.data?.results || [];
        setCounterparties(results);
      } catch (error) {
        console.error("Error searching counterparties:", error);
        setCounterparties([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchCounterparties, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, isOpen, selectedCounterparty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);

    // If user clears input, reset everything
    if (newQuery === "") {
      setSelectedCounterparty(null);
      onChange(null);
      setIsOpen(true);
    }
  };

  const handleCounterpartySelect = (counterparty: Counterparty) => {
    setSelectedCounterparty(counterparty);
    setSearchQuery(counterparty.name || "");
    onChange(counterparty);
    setIsOpen(false);
  };

  const handleBlur = () => {
    // Use a short timeout to allow click events on dropdown items to register
    setTimeout(() => {
      setIsOpen(false);
      // If the user blurs without making a selection, revert to the last selected counterparty's name
      if (selectedCounterparty) {
        setSearchQuery(selectedCounterparty.name);
      } else if (!selectedCounterparty && searchQuery) {
        setSearchQuery("");
      }
    }, 200);
  };

  const handleCreateCounterparty = async (data: {
    name: string;
    phone: string;
  }) => {
    try {
      const response = await api.post("counterparty/", {
        name: data.name,
        phone: data.phone,
      });

      const newCounterparty = response.data;

      // Auto-select the newly created counterparty
      setSelectedCounterparty(newCounterparty);
      setSearchQuery(newCounterparty.name);
      onChange(newCounterparty);

      // Close modal and reset form
      setShowCreateModal(false);
      createForm.reset();
      setIsOpen(false);

      toast.success(t("messages.counterparty_created_successfully"));
    } catch (error: any) {
      console.error("Error creating counterparty:", error);
      toast.error(t("messages.error_creating_counterparty"));
    }
  };

  const handleShowCreateModal = () => {
    // Pre-fill the name field with the current search query
    createForm.setValue("name", searchQuery);
    setShowCreateModal(true);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <Input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full"
          autoComplete="off"
          required={required}
          disabled={disabled}
        />

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">
                {t("common.loading")}...
              </div>
            ) : counterparties.length > 0 ? (
              <>
                {counterparties.map((counterparty) => (
                  <div
                    key={counterparty.id}
                    className={`p-3 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                      selectedCounterparty?.id === counterparty.id
                        ? "bg-blue-50 font-medium"
                        : ""
                    }`}
                    onMouseDown={() => handleCounterpartySelect(counterparty)}
                  >
                    <div className="font-medium">{counterparty.name}</div>
                    {counterparty.phone && (
                      <div className="text-xs text-gray-500 mt-1">
                        {counterparty.phone}
                      </div>
                    )}
                  </div>
                ))}
                {/* Create new option at the bottom */}
                <div
                  className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-t border-gray-200 bg-gray-50"
                  onMouseDown={handleShowCreateModal}
                >
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <Plus className="h-4 w-4" />
                    {t("forms.create_new_counterparty")}
                  </div>
                </div>
              </>
            ) : searchQuery.length >= 2 ? (
              <div className="p-3">
                <div className="text-center text-gray-500 text-sm mb-3">
                  {t("common.no_results_found")}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onMouseDown={handleShowCreateModal}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("forms.create_counterparty")}
                </Button>
              </div>
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {t("common.type_to_search")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Counterparty Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t("forms.create_new_counterparty")}
            </DialogTitle>
          </DialogHeader>

          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateCounterparty)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.name")} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("placeholders.enter_counterparty_name")}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forms.phone")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("placeholders.enter_phone_number")}
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createForm.formState.isSubmitting}
                >
                  {createForm.formState.isSubmitting
                    ? t("common.creating") + "..."
                    : t("common.create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SearchableCounterpartySelect;
