/**
 * Reusable Button component.
 *
 * Uses class-variance-authority for variant management.
 * All buttons in the application should use this component.
 */
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium whitespace-nowrap select-none",
    "transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
    "disabled:pointer-events-none disabled:opacity-50",
    "cursor-pointer",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-900",
        secondary: "bg-brand-100 text-brand-800 hover:bg-brand-200 active:bg-brand-300",
        outline: "border border-border-strong bg-transparent text-foreground hover:bg-muted active:bg-brand-50",
        ghost: "bg-transparent text-foreground hover:bg-muted active:bg-brand-50",
        danger: "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800",
        "danger-outline": "border border-danger-300 text-danger-600 hover:bg-danger-50 active:bg-danger-100",
        link: "text-brand-700 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded",
        md: "h-9 px-4 text-sm rounded-md",
        lg: "h-10 px-5 text-sm rounded-md",
        xl: "h-11 px-6 text-base rounded-md",
        icon: "h-9 w-9 rounded-md",
        "icon-sm": "h-8 w-8 rounded",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
