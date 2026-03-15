import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        // Base
        "group/card flex flex-col overflow-hidden rounded-2xl bg-white text-foreground",
        "border border-line",
        // Gap + padding
        "gap-5 py-5",
        "data-[size=sm]:gap-3 data-[size=sm]:py-3",
        // Shadow
        "shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
        // Image rounding helpers
        "has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-2xl",
        "*:[img:last-child]:rounded-b-2xl",
        className
      )}
      {...props}
    />
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-1",
        "px-5 group-data-[size=sm]/card:px-4",
        // When there's an action slot → 2-col layout
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        // Border bottom variant
        "[.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  );
}

// ─── CardTitle ────────────────────────────────────────────────────────────────

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-display font-bold text-foreground leading-snug",
        "text-lg group-data-[size=sm]/card:text-base",
        className
      )}
      {...props}
    />
  );
}

// ─── CardDescription ─────────────────────────────────────────────────────────

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted leading-relaxed", className)}
      {...props}
    />
  );
}

// ─── CardAction ───────────────────────────────────────────────────────────────

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

// ─── CardContent ─────────────────────────────────────────────────────────────

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-5 group-data-[size=sm]/card:px-4",
        className
      )}
      {...props}
    />
  );
}

// ─── CardFooter ──────────────────────────────────────────────────────────────

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-2xl border-t border-line px-5 py-4",
        "bg-canvas-soft",
        "group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:py-3",
        className
      )}
      {...props}
    />
  );
}

// ─── CardBadge ───────────────────────────────────────────────────────────────
// Utility badge to use inside card headers

function CardBadge({
  className,
  color,
  ...props
}: React.ComponentProps<"span"> & { color?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full",
        className
      )}
      style={color ? { background: `${color}18`, color } : undefined}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardBadge,
};
