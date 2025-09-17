import React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "destructive";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-green-600/15 text-green-400 border border-green-600/30",
  warning: "bg-yellow-600/15 text-yellow-400 border border-yellow-600/30",
  destructive: "bg-red-600/15 text-red-400 border border-red-600/30",
};

export default function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}







