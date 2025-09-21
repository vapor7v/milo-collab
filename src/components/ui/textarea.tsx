import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "enhanced"
  error?: boolean
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", error = false, helperText, ...props }, ref) => {
    const baseClasses = "flex min-h-[80px] w-full rounded-xl border bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 resize-none"

    const variantClasses = {
      default: "border-input focus-visible:ring-ring",
      enhanced: "border-2 border-primary/20 bg-primary/5 focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:bg-primary/10"
    }

    const errorClasses = error ? "border-destructive focus-visible:ring-destructive/20" : ""

    return (
      <div className="space-y-2">
        <textarea
          className={cn(
            baseClasses,
            variantClasses[variant],
            errorClasses,
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className={cn(
            "text-sm",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }