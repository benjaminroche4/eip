import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"

import AccordionToggleIcon from "@/components/page/accordion-toggle-icon"
import { cn } from "@/lib/utils"

// Variant adapted to the site (Figma 278-10243 closed / 278-10244 open): the item is a padded block, sand
// background once open, plus morphing into a minus (accordion-toggle-icon), no underline, square corners. Keyboard/ARIA behaviour untouched.

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  )
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "rounded-none p-4 transition-colors duration-300 data-[state=closed]:hover:bg-background-05 data-[state=open]:bg-background-08 sm:p-6",
        className
      )}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group focus-ring flex flex-1 items-start justify-between gap-6 rounded-none text-left text-base font-semibold text-muted-foreground outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-foreground",
          className
        )}
        {...props}
      >
        {children}
        <span className="flex h-6 shrink-0 items-center">
          <AccordionToggleIcon className="pointer-events-none" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-base/7 text-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down sm:text-sm/6 motion-reduce:animate-none"
      {...props}
    >
      <div className={cn("pt-4 pr-11", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
