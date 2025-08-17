import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  id: string | number;
  name: string;
  [key: string]: unknown;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allOptionLabel?: string;
  showAllOption?: boolean;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  displayKey?: string;
  valueKey?: string;
  convertValue?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  allOptionLabel = "All",
  showAllOption = true,
  isLoading = false,
  onSearch,
  searchQuery = "",
  onSearchQueryChange,
  className,
  disabled = false,
  clearable = false,
  displayKey = "name",
  valueKey = "id",
  convertValue = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSearchQuery = onSearchQueryChange
    ? searchQuery
    : internalSearchQuery;
  const setCurrentSearchQuery = onSearchQueryChange || setInternalSearchQuery;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (onSearch) {
      const debounceTimer = setTimeout(() => {
        onSearch(currentSearchQuery);
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [currentSearchQuery, onSearch]);

  const filteredOptions = onSearch
    ? options
    : options.filter((option) =>
        option[displayKey]
          ?.toLowerCase()
          .includes(currentSearchQuery.toLowerCase()),
      );

  const selectedOption = options.find(
    (option) => option[valueKey]?.toString() === value?.toString(),
  );

  const handleSelect = (optionValue: string | number) => {
    const finalValue = convertValue ? optionValue.toString() : optionValue;
    onValueChange(finalValue);
    setIsOpen(false);
    setCurrentSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange(convertValue ? "all" : "");
    setCurrentSearchQuery("");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCurrentSearchQuery(query);
  };

  const getDisplayValue = () => {
    if (value === "all" || value === "") {
      return showAllOption ? allOptionLabel : placeholder;
    }
    return selectedOption?.[displayKey] || placeholder;
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Trigger */}
      <div
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span
          className={cn(
            "block truncate",
            !selectedOption && value !== "all" && "text-muted-foreground",
          )}
        >
          {getDisplayValue()}
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && value !== "all" && (
            <X
              className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={currentSearchQuery}
                onChange={handleSearchChange}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Loading...
              </div>
            ) : (
              <>
                {/* All Option */}
                {showAllOption && (
                  <div
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      (value === "all" || value === "") &&
                        "bg-accent text-accent-foreground",
                    )}
                    onClick={() => handleSelect("all")}
                  >
                    {allOptionLabel}
                  </div>
                )}

                {/* Filtered Options */}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <div
                      key={option[valueKey]}
                      className={cn(
                        "px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        option[valueKey]?.toString() === value?.toString() &&
                          "bg-accent text-accent-foreground",
                      )}
                      onClick={() => handleSelect(option[valueKey])}
                    >
                      {option[displayKey]}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    {emptyMessage}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
