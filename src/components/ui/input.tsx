/**
 * Reusable form input components.
 */
"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, useState } from "react";
import { cn } from "@/utils/cn";
import { Eye, EyeOff } from "lucide-react";

// =============================================================================
// INPUT
// =============================================================================

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, type, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-0.5 text-danger-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border bg-white px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "transition-colors duration-150",
            error
              ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-border",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-xs text-danger-600" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

// =============================================================================
// PASSWORD INPUT
// =============================================================================

export interface PasswordInputProps extends Omit<InputProps, "type"> {}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5">
        {props.label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-foreground">
            {props.label}
            {props.required && <span className="ml-0.5 text-danger-500">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? "text" : "password"}
            className={cn(
              "flex h-9 w-full rounded-md border bg-white px-3 py-2 pr-10 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
              "transition-colors duration-150",
              props.error
                ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-500"
                : "border-border",
              className,
            )}
            aria-invalid={props.error ? "true" : undefined}
            {...props}
            label={undefined}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {props.error && (
          <p className="text-xs text-danger-600" role="alert">
            {props.error}
          </p>
        )}
        {!props.error && props.hint && (
          <p className="text-xs text-muted-foreground">
            {props.hint}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

// =============================================================================
// TEXTAREA
// =============================================================================

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-0.5 text-danger-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "transition-colors duration-150 resize-y",
            error
              ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-border",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger-600" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

// =============================================================================
// SELECT
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, placeholder, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="ml-0.5 text-danger-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            "flex h-9 w-full rounded-md border bg-white px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "transition-colors duration-150 appearance-none",
            "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23627d98%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
            "bg-no-repeat bg-[right_8px_center]",
            error
              ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-500"
              : "border-border",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-danger-600" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

// =============================================================================
// CHECKBOX
// =============================================================================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="flex items-start gap-2 cursor-pointer select-none">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-border text-brand-700",
              "focus:ring-2 focus:ring-brand-500/30",
              "cursor-pointer accent-brand-700",
              className,
            )}
            {...props}
          />
          <span className="text-sm text-foreground">{label}</span>
        </label>
        {error && (
          <p className="text-xs text-danger-600 ml-6" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Input, PasswordInput, Textarea, Select, Checkbox };
