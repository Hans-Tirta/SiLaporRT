import { useState, useRef, useEffect } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Input from "../ui/Input";
import Select from "../ui/Select";

export type FilterField = {
  name: string;
  label: string;
  type: "select" | "date" | "daterange" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
  value?: string | { from?: string; to?: string };
  onChange?: (value: string | { from?: string; to?: string }) => void;
  disabled?: boolean;
};

export type AdvancedFilterProps = {
  fields: FilterField[];
  onReset?: () => void;
  activeFilterCount?: number;
  className?: string;
  dropdownClassName?: string;
};

export default function AdvancedFilter({
  fields,
  onReset,
  activeFilterCount = 0,
  className = "",
  dropdownClassName,
}: AdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleReset = () => {
    onReset?.();
    // Don't close dropdown after reset, let user continue filtering
  };

  const renderField = (field: FilterField) => {
    switch (field.type) {
      case "select":
        return (
          <Select
            key={field.name}
            value={field.value as string}
            onChange={(e) => field.onChange?.(e.target.value)}
            options={field.options || []}
            className="w-full"
            disabled={field.disabled}
          />
        );

      case "date":
        return (
          <Input
            key={field.name}
            type="date"
            value={field.value as string}
            onChange={(e) => field.onChange?.(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
            disabled={field.disabled}
          />
        );

      case "daterange": {
        const dateRangeValue = field.value as { from?: string; to?: string };
        return (
          <div key={field.name} className="space-y-2">
            <Input
              type="date"
              value={dateRangeValue?.from || ""}
              onChange={(e) =>
                field.onChange?.({ ...dateRangeValue, from: e.target.value })
              }
              placeholder="Dari tanggal"
              className="w-full"
              disabled={field.disabled}
            />
            <Input
              type="date"
              value={dateRangeValue?.to || ""}
              onChange={(e) =>
                field.onChange?.({ ...dateRangeValue, to: e.target.value })
              }
              placeholder="Sampai tanggal"
              className="w-full"
              disabled={field.disabled}
            />
          </div>
        );
      }

      case "text":
        return (
          <Input
            key={field.name}
            type="text"
            value={field.value as string}
            onChange={(e) => field.onChange?.(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
            disabled={field.disabled}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filter
        {activeFilterCount > 0 && (
          <Badge
            variant="info"
            size="sm"
            className="ml-2 px-1.5 py-0.5 text-xs"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 ${dropdownClassName || "right-0"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Filter Lanjutan
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filter Fields */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-full"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
