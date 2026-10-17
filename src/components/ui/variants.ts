/**
 * CVA Variants - Component Variants unificados
 * Single source of truth para todas las variantes de componentes UI
 */

import { cva, type VariantProps } from "class-variance-authority"

// ============================================
// BUTTON VARIANTS
// ============================================
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-[var(--motion-fast)] outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.98] active:duration-100 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-12 gap-2 px-6 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

// ============================================
// BADGE VARIANTS
// ============================================
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border bg-background text-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        info: "border-transparent bg-info/15 text-info",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type BadgeVariants = VariantProps<typeof badgeVariants>

// ============================================
// CARD VARIANTS
// ============================================
export const cardVariants = cva(
  "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
  {
    variants: {
      size: {
        default: "[--card-spacing:--spacing(4)]",
        sm: "[--card-spacing:--spacing(3)]",
        lg: "[--card-spacing:--spacing(6)]",
      },
      variant: {
        default: "ring-1 ring-foreground/10",
        outline: "border-border bg-transparent",
        elevated: "shadow-lg ring-0",
        filled: "bg-muted/50 ring-0",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export type CardVariants = VariantProps<typeof cardVariants>

// ============================================
// INPUT VARIANTS
// ============================================
export const inputVariants = cva(
  "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        default: "h-10 px-3 text-base",
        sm: "h-8 px-2.5 text-sm",
        lg: "h-12 px-4 text-lg",
      },
      variant: {
        default: "border-input bg-transparent",
        filled: "bg-muted border-transparent",
        outline: "border-2 border-border",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

export type InputVariants = VariantProps<typeof inputVariants> & {
  variant?: "default" | "filled" | "outline"
  size?: "default" | "sm" | "lg"
}