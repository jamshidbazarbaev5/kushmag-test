import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = "Select options...",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Use setTimeout to allow mouseDown events to process first
        setTimeout(() => {
          setIsOpen(false);
        }, 100);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Always position dropdown at the top to avoid scrolling issues
  // No need for useEffect since we always use top positioning

  // Handle option selection/deselection
  const handleOptionToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  // Handle removing a selected item
  const handleRemoveItem = (itemValue: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newValue = value.filter((v) => v !== itemValue);
    onChange(newValue);
  };

  // Handle dropdown toggle
  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Get selected options for display
  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Trigger Button */}
      <div
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2",
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex flex-1 flex-wrap gap-1">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option) => (
              <div
                key={option.value}
                className="inline-flex items-center rounded-sm bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
              >
                <span className="truncate">{option.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    className="ml-1 rounded-sm hover:bg-secondary-foreground/20"
                    onClick={(e) => handleRemoveItem(option.value, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-[99999] w-full bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto",
            "min-w-max transform-gpu bottom-full mb-2 animate-in fade-in-0 zoom-in-95 duration-100",
          )}
          style={{
            position: "absolute",
            zIndex: 99999,
          }}
        >
          {options.length > 0 ? (
            <div className="p-1">
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleOptionToggle(option.value);
                    }}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center border border-primary rounded",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-background",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500 text-sm">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
