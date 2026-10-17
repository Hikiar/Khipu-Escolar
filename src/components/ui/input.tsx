import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import { inputVariants } from "./variants"

interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "default" | "sm" | "lg"
  variant?: "default" | "filled" | "outline"
}

function Input({
  className,
  type,
  size = "default",
  variant = "default",
  ...props
}: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, variant, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
