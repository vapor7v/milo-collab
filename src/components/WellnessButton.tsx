import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const wellnessButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        // Material You Filled Button (Primary) - replaces old "primary"
        primary: "bg-primary-600 text-white shadow-elevation-1 hover:shadow-elevation-2 hover:bg-primary-700 active:shadow-elevation-1",

        // Material You Filled Button (Primary) - new "filled" variant
        filled: "bg-primary-600 text-white shadow-elevation-1 hover:shadow-elevation-2 hover:bg-primary-700 active:shadow-elevation-1",

        // Material You Outlined Button (Secondary) - replaces old "outline"
        outlined: "border-2 border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/10 active:bg-primary-100 dark:active:bg-primary-900/20",

        // Material You Outlined Button (Secondary) - replaces old "outline"
        outline: "border-2 border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 dark:hover:bg-primary-900/10 active:bg-primary-100 dark:active:bg-primary-900/20",

        // Material You Tonal Button (Medium emphasis) - replaces old "secondary"
        secondary: "bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-900/50 active:bg-primary-300 dark:active:bg-primary-900/70",

        // Material You Tonal Button (Medium emphasis) - new "tonal" variant
        tonal: "bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-900/50 active:bg-primary-300 dark:active:bg-primary-900/70",

        // Material You Text Button (Low emphasis) - replaces old "ghost"
        ghost: "text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 active:bg-primary-100 dark:active:bg-primary-900/20",

        // Material You Text Button (Low emphasis) - new "text" variant
        text: "text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 active:bg-primary-100 dark:active:bg-primary-900/20",

        // Special variants for specific use cases
        critical: "bg-red-600 text-white shadow-elevation-1 hover:shadow-elevation-2 hover:bg-red-700 active:shadow-elevation-1",
        safe: "bg-green-600 text-white shadow-elevation-1 hover:shadow-elevation-2 hover:bg-green-700 active:shadow-elevation-1",
        warning: "bg-amber-600 text-white shadow-elevation-1 hover:shadow-elevation-2 hover:bg-amber-700 active:shadow-elevation-1",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "default",
    },
  }
);

export interface WellnessButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof wellnessButtonVariants> {
  asChild?: boolean;
}

export const WellnessButton = React.forwardRef<HTMLButtonElement, WellnessButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(wellnessButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
WellnessButton.displayName = "WellnessButton";
