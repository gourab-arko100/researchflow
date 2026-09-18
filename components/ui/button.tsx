import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-sans text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-ink text-paper hover:bg-ink-soft dark:bg-paper dark:text-ink dark:hover:bg-paper-raised",
        brass: "bg-brass text-paper hover:bg-brass-dark",
        outline:
          "border border-hairline text-ink hover:border-ink dark:border-hairline-dark dark:text-paper dark:hover:border-paper",
        ghost: "text-ink hover:bg-ink/5 dark:text-paper dark:hover:bg-paper/5",
        link: "text-teal underline-offset-4 hover:underline dark:text-teal-muted",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export { buttonVariants };

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
