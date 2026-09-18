import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded border border-hairline bg-paper-raised px-3 font-sans text-sm text-ink placeholder:text-ink-faint dark:border-hairline-dark dark:bg-paper-dark-raised dark:text-paper dark:placeholder:text-paper/30",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
