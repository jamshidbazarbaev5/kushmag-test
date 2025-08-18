import React, { useState, useEffect, useRef } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  options: Option[];
  onSearch?: (searchTerm: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  allowReset?: boolean;
}

export function SearchableSelect({
  value,
  onChange,
  placeholder = "Select an option...",
  options = [],
  onSearch,
  isLoading = false,
  disabled = false,
  className,
  allowReset = true,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update filtered options when options or search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredOptions(filtered);
    }
  }, [options, searchTerm]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    // Call external search function if provided
    if (onSearch) {
      onSearch(newSearchTerm);
    }
  };

  // Handle option selection
  const handleOptionSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Handle dropdown toggle
  const handleToggle = () => {
    if (disabled) return;

    setIsOpen(!isOpen);

    // Focus search input when opening
    if (!isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  // Handle reset
  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  // Get display value
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : "";
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between h-10 px-3 py-2 text-sm",
          !displayValue && "text-muted-foreground",
          disabled && "opacity-50 cursor-not-allowed",
          hasValue && allowReset && "pr-16",
        )}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <div className="flex items-center gap-1 ml-2">
          {hasValue && allowReset && !disabled && (
            <button
              type="button"
              onClick={handleReset}
              className="h-4 w-4 rounded-sm opacity-50 hover:opacity-80 hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-50 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                className="pl-8 h-8 text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center px-3 py-2 text-sm hover:bg-gray-100",
                    value === option.value && "bg-blue-50 text-blue-600",
                  )}
                  onClick={() => handleOptionSelect(option)}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <Check className="ml-auto h-4 w-4" />
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : "No options available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
