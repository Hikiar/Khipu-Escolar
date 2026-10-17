import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cn } from "cn"
import { buttonVariants, type ButtonVariants } from "./variants"

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & ButtonVariants) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
