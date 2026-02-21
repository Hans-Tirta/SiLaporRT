import React from "react";
import { cn } from "../../utils/cn";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  limit?: number;
  showCounter?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      limit,
      value,
      defaultValue,
      onChange,
      showCounter,
      error,
      helperText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
        ? defaultValue.length
        : 0;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (limit && e.target.value.length > limit) {
        e.target.value = e.target.value.slice(0, limit);
      }
      onChange?.(e);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            id={inputId}
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            {...props}
          />
          {showCounter && limit && (
            <span className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-gray-400">
              {currentLength}/{limit}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
export default Textarea;
