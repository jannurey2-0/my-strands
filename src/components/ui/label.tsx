import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

// Helper component to style the asterisk
const RequiredAsterisk = () => <span className="text-red-500">*</span>;

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants> & { required?: boolean }
>(({ className, children, required, ...props }, ref) => {
  // If children is a string and contains an asterisk, split it and wrap the asterisk
  if (typeof children === 'string' && children.includes('*')) {
    const [text] = children.split('*');
    return (
      <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
        {text}<span className="text-red-500">*</span>
      </LabelPrimitive.Root>
    );
  }
  
  // Otherwise, just render children with optional required asterisk
  return (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props}>
      {children}
      {required && <span className="text-red-500">*</span>}
    </LabelPrimitive.Root>
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
